import { useCallback, useEffect, useMemo, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js'
import { Buffer } from 'buffer'
import { WalletPanel } from './components/WalletPanel'
import { TokenTable } from './components/TokenTable'
import { TradeModal } from './components/TradeModal'
import { PortfolioPanel } from './components/PortfolioPanel'
import { ActivityPanel } from './components/ActivityPanel'
import { JudgePanel } from './components/JudgePanel'
import { fetchChainStatus, fetchTokens } from './lib/api'
import { COOKIE_BRIDGE, COOKIE_EXPLORER, COOKIE_RPC, COOKIE_WS, MEMO_PROGRAM } from './lib/config'
import type { ActivityRecord, ChainStatus, TokenRecord, WatchProof } from './lib/types'
import { applyPriceTick } from './lib/market'
import { DEMO_TOKENS } from './lib/demo'
import { loadActivities, newActivityId, persistActivities } from './lib/journal'

const initialStatus: ChainStatus = { online: false, cookUsd: null, activeTokens: null, slot: null, latencyMs: null, source: 'unknown' }

export default function App() {
  const [tokens, setTokens] = useState<TokenRecord[]>([])
  const [status, setStatus] = useState<ChainStatus>(initialStatus)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [busyMint, setBusyMint] = useState<string | null>(null)
  const [tradeToken, setTradeToken] = useState<TokenRecord | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [streamLive, setStreamLive] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  const [activities, setActivities] = useState<ActivityRecord[]>(() => loadActivities())
  const [proofs, setProofs] = useState<WatchProof[]>(() => {
    try { return JSON.parse(localStorage.getItem('cookie-alpha-proofs') || '[]') as WatchProof[] } catch { return [] }
  })
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()

  const addActivity = useCallback((record: ActivityRecord) => {
    setActivities(current => { const next = [record, ...current].slice(0, 100); persistActivities(next); return next })
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true); setError(null)
    const controller = new AbortController()
    try {
      const [nextTokens, nextStatus] = await Promise.all([fetchTokens(controller.signal), fetchChainStatus(controller.signal)])
      setTokens(nextTokens); setStatus(nextStatus); setDemoMode(false)
    } catch (e) {
      setStatus(await fetchChainStatus())
      setError(e instanceof Error ? e.message : 'CookieScan market feed unavailable')
    } finally { setLoading(false) }
    return () => controller.abort()
  }, [])

  useEffect(() => { void refresh(); const id = window.setInterval(() => void refresh(), 20_000); return () => window.clearInterval(id) }, [refresh])

  useEffect(() => {
    let socket: WebSocket | null = null
    let retryId: number | null = null
    let stopped = false

    const connect = () => {
      if (stopped) return
      try {
        socket = new WebSocket(COOKIE_WS)
        socket.onopen = () => setStreamLive(true)
        socket.onmessage = (event) => {
          try { setTokens((current) => applyPriceTick(current, JSON.parse(String(event.data)))) } catch { /* ignore malformed ticks */ }
        }
        socket.onerror = () => setStreamLive(false)
        socket.onclose = () => {
          setStreamLive(false)
          if (!stopped) retryId = window.setTimeout(connect, 5_000)
        }
      } catch {
        setStreamLive(false)
        retryId = window.setTimeout(connect, 5_000)
      }
    }
    connect()
    return () => {
      stopped = true
      if (retryId != null) window.clearTimeout(retryId)
      socket?.close()
    }
  }, [])


  const useDemoFixture = useCallback(() => { setTokens(DEMO_TOKENS); setDemoMode(true); setLoading(false); setToast('DEMO fixture loaded — transactional actions are disabled for synthetic rows.') }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tokens.filter(t => !q || t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q) || t.mint.toLowerCase().includes(q))
  }, [tokens, query])

  const watchOnChain = useCallback(async (token: TokenRecord) => {
    if (!publicKey) { setToast('Connect Nightly (or another Wallet Standard wallet) first.'); return }
    setBusyMint(token.mint); setToast('Building Cookie Chain watch proof…')
    try {
      const latest = await connection.getLatestBlockhash('confirmed')
      const memo = `cookie-alpha-radar:v1|watch=${token.mint}|symbol=${token.symbol}|score=${token.score}`
      const tx = new Transaction({ feePayer: publicKey, recentBlockhash: latest.blockhash }).add(
        new TransactionInstruction({ keys: [], programId: new PublicKey(MEMO_PROGRAM), data: Buffer.from(memo, 'utf8') })
      )
      const signature = await sendTransaction(tx, connection, { skipPreflight: false, preflightCommitment: 'confirmed' })
      await connection.confirmTransaction({ signature, ...latest }, 'confirmed')
      const createdAt = new Date().toISOString()
      const proof: WatchProof = { mint: token.mint, symbol: token.symbol, score: token.score, signature, createdAt }
      const next = [proof, ...proofs].slice(0, 12); setProofs(next); localStorage.setItem('cookie-alpha-proofs', JSON.stringify(next))
      addActivity({ id:newActivityId('watch'), kind:'watch', status:'confirmed', createdAt, symbol:token.symbol, mint:token.mint, signature })
      setToast(`Confirmed: ${signature.slice(0, 8)}…${signature.slice(-8)}`)
    } catch (e) {
      const text = e instanceof Error ? e.message : 'unknown wallet/RPC error'
      addActivity({ id:newActivityId('watch'), kind:'watch', status:'failed', createdAt:new Date().toISOString(), symbol:token.symbol, mint:token.mint, message:text })
      setToast(`Transaction failed: ${text}`)
    }
    finally { setBusyMint(null) }
  }, [addActivity, connection, proofs, publicKey, sendTransaction])

  const top = filtered.slice(0, 24)
  const lowRisk = tokens.filter(t => t.risk === 'LOW').length
  const median = tokens.length ? [...tokens].sort((a,b) => a.score-b.score)[Math.floor(tokens.length/2)]?.score ?? 0 : 0

  return (
    <main>
      <header className="nav">
        <div className="brand"><span className="cookie-mark">C</span><div><b>Cookie Alpha Radar</b><small>signal → verify → prove on-chain</small></div></div>
        <WalletPanel />
      </header>

      <section className="hero">
        <div className="eyebrow"><i className={status.online ? 'dot online' : 'dot'} /> COOKIE CHAIN LIVE MARKET INTELLIGENCE</div>
        <h1>Find the signal.<br/><em>Stamp it on-chain.</em></h1>
        <p>Ranks Cookie Chain assets by liquidity, flow, turnover and volatility. A wallet can write a tamper-evident watch proof through the native Memo program — one click, one real Cookie Chain transaction.</p>
        <div className="hero-actions"><a className="primary-link" href="#radar">Open radar</a><a href={COOKIE_BRIDGE} target="_blank" rel="noreferrer">Bridge COOK ↗</a><a href={`${COOKIE_EXPLORER}/programs`} target="_blank" rel="noreferrer">Programs ↗</a></div>
      </section>

      <section className="metrics">
        <Metric label="Feed" value={demoMode ? 'DEMO' : status.online ? 'LIVE' : 'DEGRADED'} sub={demoMode ? 'explicit synthetic fixture' : `${status.source}${streamLive ? ' + 5s stream' : ' + polling'}`} />
        <Metric label="Assets ranked" value={tokens.length || '—'} sub="CookieScan registry" />
        <Metric label="Low-risk assets" value={tokens.length ? lowRisk : '—'} sub="separate safety model" />
        <Metric label="Median alpha" value={tokens.length ? median : '—'} sub="0–100 model" />
        <Metric label="RPC latency" value={status.latencyMs == null ? '—' : `${status.latencyMs}ms`} sub={COOKIE_RPC.replace('https://','')} />
      </section>

      <JudgePanel status={status} streamLive={streamLive} demoMode={demoMode} tokenCount={tokens.length} proofs={proofs} activities={activities} />

      <section className="panel" id="radar">
        <div className="panel-head"><div><span className="kicker">ALPHA BOARD</span><h2>Live market radar</h2></div><div className="filters"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search symbol / mint"/><button onClick={() => void refresh()}>{loading ? 'Refreshing…' : 'Refresh'}</button></div></div>
        {error && <div className="warning feed-warning"><div><b>Market feed degraded.</b> {error}. No synthetic values are substituted automatically.</div><button onClick={useDemoFixture}>Load labeled demo fixture</button></div>}
        <TokenTable tokens={top} onWatch={watchOnChain} onTrade={setTradeToken} busyMint={busyMint} />
      </section>

      <PortfolioPanel />

      <ActivityPanel activities={activities} />

      <section className="split">
        <div className="panel methodology"><span className="kicker">MODEL</span><h2>Explainable, not magic.</h2><p>Alpha rewards liquidity depth, 24h flow and turnover. Risk is scored separately from liquidity weakness, concentration proxies, missing flow and extreme volatility — momentum is never labeled safe just because it is strong.</p><div className="formula"><span>Liquidity</span><b>+</b><span>Flow</span><b>+</b><span>Turnover</span><b>−</b><span>Volatility</span></div></div>
        <div className="panel proofs"><span className="kicker">ON-CHAIN ACTIVITY</span><h2>Watch proofs</h2>{proofs.length === 0 ? <p className="muted">Connect a wallet and choose “Watch on-chain”. The app writes a small Memo transaction on Cookie Chain and records the confirmed signature here.</p> : <div className="proof-list">{proofs.map(p => <a key={p.signature} href={`${COOKIE_EXPLORER}/tx/${p.signature}`} target="_blank" rel="noreferrer"><b>{p.symbol}</b><span>score {p.score}</span><code>{p.signature.slice(0,6)}…{p.signature.slice(-6)}</code></a>)}</div>}</div>
      </section>

      <footer><div><b>Cookie Alpha Radar · v0.4.1</b><span>Built natively for Cookie Chain.</span></div><div><a href="https://docs.cookiechain.wtf" target="_blank" rel="noreferrer">Docs</a><a href="https://api.cookiescan.io" target="_blank" rel="noreferrer">DAS API</a><a href="https://cookieswap.fun" target="_blank" rel="noreferrer">CookieSwap</a></div></footer>
      {tradeToken && <TradeModal token={tradeToken} onClose={() => setTradeToken(null)} onActivity={addActivity} />}
      {toast && <button className="toast" onClick={() => setToast(null)}>{toast}<span>×</span></button>}
    </main>
  )
}

function Metric({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return <div className="metric"><small>{label}</small><strong>{value}</strong><span>{sub}</span></div>
}
