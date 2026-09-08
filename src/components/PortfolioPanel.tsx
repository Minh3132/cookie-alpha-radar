import { useEffect, useMemo, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js'
import { COOKIE_API, COOKIE_EXPLORER } from '../lib/config'

type AssetRow = {
  id: string
  symbol: string
  name: string
  amount: string | null
  decimals: number | null
}

type TxRow = {
  signature: string
  slot: number
  blockTime: number | null
  err: unknown
}

function compactAddress(value: string) {
  return value.length > 12 ? `${value.slice(0, 6)}…${value.slice(-6)}` : value
}

function assetAmount(raw: unknown, decimals: unknown): string | null {
  const balance = typeof raw === 'number' || typeof raw === 'string' ? String(raw) : ''
  const d = typeof decimals === 'number' && Number.isInteger(decimals) && decimals >= 0 && decimals <= 18 ? decimals : null
  if (!balance || d == null || !/^\d+$/.test(balance)) return null
  try {
    const v = BigInt(balance)
    const base = 10n ** BigInt(d)
    const whole = v / base
    const frac = (v % base).toString().padStart(d, '0').slice(0, 6).replace(/0+$/, '')
    return frac ? `${whole}.${frac}` : whole.toString()
  } catch {
    return null
  }
}

function normalizeAssets(payload: unknown): AssetRow[] {
  if (!payload || typeof payload !== 'object') return []
  const root = payload as Record<string, unknown>
  const result = root.result && typeof root.result === 'object' ? root.result as Record<string, unknown> : {}
  const items = Array.isArray(result.items) ? result.items : []
  const out: AssetRow[] = []
  for (const item of items) {
    if (!item || typeof item !== 'object') continue
    const o = item as Record<string, any>
    const id = typeof o.id === 'string' ? o.id : ''
    if (!id) continue
    const meta = o.content?.metadata || {}
    const tokenInfo = o.token_info || o.tokenInfo || {}
    const symbol = typeof meta.symbol === 'string' && meta.symbol.trim() ? meta.symbol.trim() : compactAddress(id)
    const name = typeof meta.name === 'string' && meta.name.trim() ? meta.name.trim() : symbol
    const decimals = typeof tokenInfo.decimals === 'number' ? tokenInfo.decimals : null
    const rawBalance = tokenInfo.balance ?? tokenInfo.amount
    out.push({ id, symbol, name, decimals, amount: assetAmount(rawBalance, decimals) })
  }
  return out.slice(0, 10)
}

async function fetchDasAssets(owner: string, signal: AbortSignal) {
  const response = await fetch(COOKIE_API, {
    method: 'POST',
    signal,
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'cookie-alpha-portfolio',
      method: 'getAssetsByOwner',
      params: { ownerAddress: owner, page: 1, limit: 100 },
    }),
  })
  if (!response.ok) throw new Error(`DAS ${response.status}`)
  return normalizeAssets(await response.json())
}

export function PortfolioPanel() {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const [cook, setCook] = useState<number | null>(null)
  const [assets, setAssets] = useState<AssetRow[]>([])
  const [txs, setTxs] = useState<TxRow[]>([])
  const [loading, setLoading] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)

  const owner = publicKey?.toBase58() || ''

  useEffect(() => {
    if (!publicKey) {
      setCook(null); setAssets([]); setTxs([]); setWarning(null)
      return
    }
    const controller = new AbortController()
    let alive = true
    setLoading(true); setWarning(null)
    void (async () => {
      const messages: string[] = []
      const [balanceResult, txResult, assetResult] = await Promise.allSettled([
        connection.getBalance(publicKey, 'confirmed'),
        connection.getSignaturesForAddress(publicKey, { limit: 8 }, 'confirmed'),
        fetchDasAssets(publicKey.toBase58(), controller.signal),
      ])
      if (!alive) return
      if (balanceResult.status === 'fulfilled') setCook(balanceResult.value / LAMPORTS_PER_SOL)
      else messages.push('COOK balance unavailable')
      if (txResult.status === 'fulfilled') setTxs(txResult.value.map(x => ({ signature: x.signature, slot: x.slot, blockTime: x.blockTime ?? null, err: x.err })))
      else messages.push('transaction history unavailable')
      if (assetResult.status === 'fulfilled') setAssets(assetResult.value)
      else messages.push('DAS assets unavailable')
      setWarning(messages.length ? messages.join(' · ') : null)
      setLoading(false)
    })()
    return () => { alive = false; controller.abort() }
  }, [connection, publicKey])

  const successTxs = useMemo(() => txs.filter(x => !x.err).length, [txs])

  if (!publicKey) {
    return <section className="panel portfolio-panel"><span className="kicker">WALLET INTELLIGENCE</span><h2>Your Cookie Chain footprint</h2><p className="muted">Connect Nightly to load native COOK balance, indexed assets and recent Cookie Chain activity. Nothing is fabricated when the indexer or RPC is unavailable.</p></section>
  }

  return <section className="panel portfolio-panel">
    <div className="portfolio-head">
      <div><span className="kicker">WALLET INTELLIGENCE</span><h2>{compactAddress(owner)}</h2></div>
      <a href={`${COOKIE_EXPLORER}/address/${owner}`} target="_blank" rel="noreferrer">Open wallet ↗</a>
    </div>
    <div className="wallet-metrics">
      <div><small>Native COOK</small><strong>{cook == null ? '—' : cook.toLocaleString(undefined, { maximumFractionDigits: 6 })}</strong></div>
      <div><small>Indexed assets</small><strong>{loading && !assets.length ? '…' : assets.length}</strong></div>
      <div><small>Recent successful txs</small><strong>{loading && !txs.length ? '…' : `${successTxs}/${txs.length}`}</strong></div>
    </div>
    {warning && <div className="warning compact"><b>Partial data.</b> {warning}</div>}
    <div className="wallet-grid">
      <div>
        <h3>Assets</h3>
        {assets.length ? <div className="asset-list">{assets.map(asset => <a key={asset.id} href={`${COOKIE_EXPLORER}/token/${asset.id}`} target="_blank" rel="noreferrer"><div><b>{asset.symbol}</b><span>{asset.name}</span></div><strong>{asset.amount ?? 'indexed'}</strong></a>)}</div> : <p className="muted">{loading ? 'Loading DAS portfolio…' : 'No fungible/indexed assets returned.'}</p>}
      </div>
      <div>
        <h3>Recent activity</h3>
        {txs.length ? <div className="tx-list">{txs.map(tx => <a key={tx.signature} href={`${COOKIE_EXPLORER}/tx/${tx.signature}`} target="_blank" rel="noreferrer"><div><b className={tx.err ? 'negative' : 'positive'}>{tx.err ? 'FAILED' : 'CONFIRMED'}</b><span>slot {tx.slot.toLocaleString()}</span></div><code>{compactAddress(tx.signature)}</code></a>)}</div> : <p className="muted">{loading ? 'Reading recent signatures…' : 'No recent signatures found.'}</p>}
      </div>
    </div>
  </section>
}
