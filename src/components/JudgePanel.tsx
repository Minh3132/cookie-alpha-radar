import { useWallet } from '@solana/wallet-adapter-react'
import type { ActivityRecord, ChainStatus, WatchProof } from '../lib/types'

export function JudgePanel({ status, streamLive, demoMode, tokenCount, proofs, activities }: { status: ChainStatus; streamLive: boolean; demoMode: boolean; tokenCount: number; proofs: WatchProof[]; activities: ActivityRecord[] }) {
  const { publicKey } = useWallet()
  const liveReady = !demoMode && status.online && tokenCount > 0
  const proofReady = proofs.length > 0
  const swapReady = activities.some(row => row.kind === 'swap' && row.status === 'confirmed' && row.signature)
  const steps = [
    { ok: liveReady, title: 'Live Cookie market', note: streamLive ? 'CookieScan + 5s stream' : 'CookieScan polling' },
    { ok: Boolean(publicKey), title: 'Nightly / Wallet Standard', note: publicKey ? `${publicKey.toBase58().slice(0,6)}…${publicKey.toBase58().slice(-6)}` : 'Connect wallet' },
    { ok: proofReady, title: 'On-chain Watch Proof', note: proofReady ? 'confirmed Memo evidence' : 'send tiny proof tx' },
    { ok: swapReady, title: 'Smart Swap evidence', note: swapReady ? 'confirmed swap in journal' : 'optional tiny swap' },
  ]
  return <section className="judge-panel">
    <div><span className="kicker">JUDGE PATH</span><h2>Verify the cApp in four checks.</h2><p>Live data and wallet state are never replaced silently. The final two steps create verifiable Cookie Chain transaction signatures.</p></div>
    <div className="judge-steps">{steps.map((step, index) => <a key={step.title} href={index < 2 ? '#radar' : index === 2 ? '#radar' : '#activity'} className={step.ok ? 'judge-done' : ''}><i>{step.ok ? '✓' : index + 1}</i><span><b>{step.title}</b><small>{step.note}</small></span></a>)}</div>
  </section>
}
