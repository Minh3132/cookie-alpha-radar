import { useEffect, useMemo, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { VersionedTransaction } from '@solana/web3.js'
import { COOK_DECIMALS, COOK_MINT, COOKIE_EXPLORER } from '../lib/config'
import { buildSwapTransaction, getSwapQuotes } from '../lib/trade'
import type { SwapQuote, TokenRecord } from '../lib/types'

function fromBase64(s: string) {
  const bin = atob(s); const out = new Uint8Array(bin.length)
  for (let i=0;i<bin.length;i++) out[i] = bin.charCodeAt(i)
  return out
}
function fmtRaw(raw: string, decimals: number | null) {
  if (decimals == null) return raw
  try {
    const v = BigInt(raw); const base = 10n ** BigInt(decimals); const whole = v / base; const frac = (v % base).toString().padStart(decimals,'0').slice(0,6).replace(/0+$/,'')
    return frac ? `${whole}.${frac}` : whole.toString()
  } catch { return raw }
}

export function TradeModal({ token, onClose }: { token: TokenRecord; onClose: () => void }) {
  const [amount, setAmount] = useState('1')
  const [slippage, setSlippage] = useState(500)
  const [quotes, setQuotes] = useState<SwapQuote[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [state, setState] = useState<'idle'|'quoting'|'building'|'signing'|'simulating'|'sending'|'confirmed'|'error'>('idle')
  const [message, setMessage] = useState('')
  const [signature, setSignature] = useState('')
  const { connection } = useConnection()
  const { publicKey, signTransaction } = useWallet()
  const rawAmount = useMemo(() => {
    const n = Number(amount); if (!Number.isFinite(n) || n <= 0) return ''
    return BigInt(Math.round(n * 10 ** COOK_DECIMALS)).toString()
  }, [amount])

  async function quote() {
    if (!rawAmount) { setMessage('Enter a positive COOK amount.'); setState('error'); return }
    setState('quoting'); setMessage('Comparing Cookiebox and Candy Shop routes…'); setQuotes([]); setErrors([])
    try {
      const data = await getSwapQuotes({ inputMint: COOK_MINT, outputMint: token.mint, amount: rawAmount, slippageBps: slippage, owner: publicKey?.toBase58() })
      setQuotes(data.quotes); setErrors(data.errors); setState('idle'); setMessage(data.quotes.length ? 'Best net output is ranked first.' : 'No route found.')
    } catch (e) { setState('error'); setMessage(e instanceof Error ? e.message : 'Quote failed') }
  }

  async function execute(q: SwapQuote) {
    if (!publicKey || !signTransaction) { setState('error'); setMessage('Connect a signing wallet first.'); return }
    try {
      setState('building'); setMessage(`Building ${q.aggregator} transaction…`)
      const built = await buildSwapTransaction({ quote:q, owner:publicKey.toBase58(), amount:rawAmount, slippageBps:slippage })
      const tx = VersionedTransaction.deserialize(fromBase64(built.transactionBase64!))
      setState('signing'); setMessage('Review the transaction in your wallet. It will NOT broadcast yet.')
      const signed = await signTransaction(tx)
      setState('simulating'); setMessage('Wallet signed. Simulating on Cookie Chain before broadcast…')
      const sim = await connection.simulateTransaction(signed, { sigVerify: true })
      if (sim.value.err) throw new Error(`simulation rejected: ${JSON.stringify(sim.value.err)}`)
      setState('sending'); setMessage('Simulation passed. Broadcasting to Cookie Chain…')
      const sig = await connection.sendRawTransaction(signed.serialize(), { skipPreflight:false, preflightCommitment:'confirmed' })
      await connection.confirmTransaction(sig, 'confirmed')
      setSignature(sig); setState('confirmed'); setMessage('Swap confirmed on Cookie Chain.')
    } catch (e) { setState('error'); setMessage(e instanceof Error ? e.message : 'Swap failed') }
  }

  useEffect(() => { void quote() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <div className="trade-modal">
      <button className="modal-close" onClick={onClose}>×</button>
      <span className="kicker">SMART ROUTER</span><h2>COOK → {token.symbol}</h2>
      <p className="muted">Compare two Cookie Chain aggregators. The winning transaction is built server-side, signed only inside your wallet, simulated on the official Cookie RPC, then broadcast only if simulation succeeds.</p>
      <div className="trade-inputs"><label>Spend COOK<input value={amount} onChange={e=>setAmount(e.target.value)} inputMode="decimal" /></label><label>Slippage<select value={slippage} onChange={e=>setSlippage(Number(e.target.value))}><option value={100}>1%</option><option value={300}>3%</option><option value={500}>5%</option><option value={1000}>10%</option></select></label><button onClick={()=>void quote()} disabled={state==='quoting'}>Compare</button></div>
      <div className={`trade-state state-${state}`}>{message || 'Ready.'}</div>
      {errors.length>0 && <div className="route-errors">{errors.map(x=><span key={x}>{x}</span>)}</div>}
      <div className="quotes">{quotes.map((q,i)=><div className="quote-card" key={q.aggregator}>
        <div><b>{i===0?'BEST · ':''}{q.aggregator === 'cookiebox'?'Cookiebox':'Candy Shop'}</b><span>{q.route.join(' → ') || 'aggregated route'}</span></div>
        <div className="quote-output"><small>Expected</small><strong>{fmtRaw(q.outAmount, token.decimals)} {token.symbol}</strong><span>impact {q.priceImpactPct == null?'—':`${q.priceImpactPct.toFixed(2)}%`}</span></div>
        <button onClick={()=>void execute(q)} disabled={!publicKey || ['building','signing','simulating','sending'].includes(state)}>{publicKey?'Review & swap':'Connect wallet'}</button>
      </div>)}</div>
      {signature && <a className="confirmed-link" href={`${COOKIE_EXPLORER}/tx/${signature}`} target="_blank" rel="noreferrer">Open confirmed transaction ↗</a>}
      <div className="trade-safety"><b>Safety boundary</b><span>No private key enters the app. Signing happens in the wallet. A signed transaction is simulated before send. You can reject the wallet prompt at any time.</span></div>
    </div>
  </div>
}
