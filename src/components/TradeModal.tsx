import { useEffect, useMemo, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { VersionedTransaction, type Connection } from '@solana/web3.js'
import { COOK_DECIMALS, COOK_MINT, COOKIE_EXPLORER } from '../lib/config'
import { decimalToRaw } from '../lib/amount'
import { buildSwapTransaction, getSwapQuotes } from '../lib/trade'
import { newActivityId } from '../lib/journal'
import type { ActivityRecord, FreshSwapQuote, SwapQuote, TokenRecord } from '../lib/types'

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
async function waitForSignature(connection: Connection, signature: string) {
  for (let i=0;i<45;i++) {
    const result = await connection.getSignatureStatuses([signature], { searchTransactionHistory: true })
    const row = result.value[0]
    if (row?.err) throw new Error(`chain rejected transaction: ${JSON.stringify(row.err)}`)
    if (row?.confirmationStatus === 'confirmed' || row?.confirmationStatus === 'finalized') return
    await new Promise(resolve => window.setTimeout(resolve, 1_000))
  }
  throw new Error('confirmation timed out; check the signature in CookieScan before retrying')
}
function validateFreshQuote(selected: SwapQuote, fresh: FreshSwapQuote, slippageBps: number) {
  if (fresh.aggregator !== selected.aggregator || fresh.inputMint !== selected.inputMint || fresh.outputMint !== selected.outputMint) throw new Error('fresh quote identity mismatch')
  const selectedOut = BigInt(selected.outAmount)
  const freshOut = BigInt(fresh.outAmount)
  if (selectedOut <= 0n || freshOut <= 0n) throw new Error('aggregator returned invalid output amount')
  const floor = selectedOut * BigInt(10_000 - slippageBps) / 10_000n
  if (freshOut < floor) throw new Error('fresh quote deteriorated beyond your selected slippage; compare routes again')
}

export function TradeModal({ token, onClose, onActivity }: { token: TokenRecord; onClose: () => void; onActivity: (record: ActivityRecord) => void }) {
  const [amount, setAmount] = useState('1')
  const [slippage, setSlippage] = useState(500)
  const [quotes, setQuotes] = useState<SwapQuote[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [state, setState] = useState<'idle'|'quoting'|'building'|'signing'|'simulating'|'sending'|'confirmed'|'error'>('idle')
  const [message, setMessage] = useState('')
  const [signature, setSignature] = useState('')
  const [riskAccepted, setRiskAccepted] = useState(false)
  const { connection } = useConnection()
  const { publicKey, signTransaction } = useWallet()
  const rawAmount = useMemo(() => decimalToRaw(amount, COOK_DECIMALS), [amount])

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
    if (!rawAmount) { setState('error'); setMessage('Enter a valid COOK amount with at most 9 decimals.'); return }
    const createdAt = new Date().toISOString()
    try {
      setState('building'); setMessage(`Re-quoting and building ${q.aggregator} transaction…`)
      const built = await buildSwapTransaction({ quote:q, owner:publicKey.toBase58(), amount:rawAmount, slippageBps:slippage })
      validateFreshQuote(q, built.freshQuote!, slippage)
      const tx = VersionedTransaction.deserialize(fromBase64(built.transactionBase64!))
      const feePayer = tx.message.staticAccountKeys[0]?.toBase58()
      if (feePayer !== publicKey.toBase58()) throw new Error('transaction fee payer does not match the connected wallet')
      setState('signing'); setMessage(`Fresh route validated: ${fmtRaw(built.freshQuote!.outAmount, token.decimals)} ${token.symbol}. Review the wallet transaction; it is not broadcast yet.`)
      const signed = await signTransaction(tx)
      setState('simulating'); setMessage('Wallet signed. Simulating on Cookie Chain before broadcast…')
      const sim = await connection.simulateTransaction(signed, { sigVerify: true })
      if (sim.value.err) throw new Error(`simulation rejected: ${JSON.stringify(sim.value.err)}`)
      setState('sending'); setMessage('Simulation passed. Broadcasting to Cookie Chain…')
      const sig = await connection.sendRawTransaction(signed.serialize(), { skipPreflight:false, preflightCommitment:'confirmed' })
      await waitForSignature(connection, sig)
      setSignature(sig); setState('confirmed'); setMessage('Swap confirmed on Cookie Chain.')
      onActivity({ id:newActivityId('swap'), kind:'swap', status:'confirmed', createdAt, symbol:token.symbol, mint:token.mint, aggregator:q.aggregator, inputAmountCook:amount, expectedOut:fmtRaw(built.freshQuote!.outAmount, token.decimals), signature:sig })
    } catch (e) {
      const text = e instanceof Error ? e.message : 'Swap failed'
      setState('error'); setMessage(text)
      onActivity({ id:newActivityId('swap'), kind:'swap', status:'failed', createdAt, symbol:token.symbol, mint:token.mint, aggregator:q.aggregator, inputAmountCook:amount, message:text })
    }
  }

  useEffect(() => { void quote() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <div className="trade-modal">
      <button className="modal-close" onClick={onClose}>×</button>
      <span className="kicker">SMART ROUTER</span><h2>COOK → {token.symbol}</h2>
      <p className="muted">Compare two Cookie Chain aggregators. Before signing, the server re-quotes, the app validates route identity + output deterioration + fee payer, then the wallet-signed transaction is simulated on Cookie RPC. Broadcast happens only after simulation passes.</p>
      {token.risk === 'HIGH' && <label className="risk-consent"><input type="checkbox" checked={riskAccepted} onChange={e=>setRiskAccepted(e.target.checked)} /><span><b>High-risk market signal.</b> I understand thin liquidity / volatility can cause severe slippage or loss.</span></label>}
      <div className="trade-inputs"><label>Spend COOK<input value={amount} onChange={e=>setAmount(e.target.value)} inputMode="decimal" /></label><label>Slippage<select value={slippage} onChange={e=>setSlippage(Number(e.target.value))}><option value={100}>1%</option><option value={300}>3%</option><option value={500}>5%</option><option value={1000}>10%</option></select></label><button onClick={()=>void quote()} disabled={state==='quoting'}>Compare</button></div>
      <div className={`trade-state state-${state}`}>{message || 'Ready.'}</div>
      {errors.length>0 && <div className="route-errors">{errors.map(x=><span key={x}>{x}</span>)}</div>}
      <div className="quotes">{quotes.map((q,i)=><div className="quote-card" key={q.aggregator}>
        <div><b>{i===0?'BEST · ':''}{q.aggregator === 'cookiebox'?'Cookiebox':'Candy Shop'}</b><span>{q.route.join(' → ') || 'aggregated route'}</span></div>
        <div className="quote-output"><small>Expected</small><strong>{fmtRaw(q.outAmount, token.decimals)} {token.symbol}</strong><span>impact {q.priceImpactPct == null?'—':`${q.priceImpactPct.toFixed(2)}%`}</span></div>
        <button onClick={()=>void execute(q)} disabled={!publicKey || (token.risk === 'HIGH' && !riskAccepted) || ['building','signing','simulating','sending'].includes(state)}>{publicKey?'Review & swap':'Connect wallet'}</button>
      </div>)}</div>
      {signature && <a className="confirmed-link" href={`${COOKIE_EXPLORER}/tx/${signature}`} target="_blank" rel="noreferrer">Open confirmed transaction ↗</a>}
      <div className="trade-safety"><b>Safety boundary</b><span>No private key enters the app. The server never receives wallet secrets. A fresh server quote is validated before signing; signing stays inside the wallet; the signed transaction is simulated before send.</span></div>
    </div>
  </div>
}
