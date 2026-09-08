import type { ActivityRecord } from '../lib/types'
import { COOKIE_EXPLORER } from '../lib/config'
import { exportActivityCsv, exportActivityJson } from '../lib/journal'

function compact(value: string) { return value.length > 16 ? `${value.slice(0,8)}…${value.slice(-8)}` : value }

export function ActivityPanel({ activities }: { activities: ActivityRecord[] }) {
  return <section className="panel activity-panel" id="activity">
    <div className="activity-head">
      <div><span className="kicker">EVIDENCE JOURNAL</span><h2>Transaction activity</h2></div>
      <div className="activity-actions"><button onClick={() => exportActivityJson(activities)} disabled={!activities.length}>Export JSON</button><button onClick={() => exportActivityCsv(activities)} disabled={!activities.length}>Export CSV</button></div>
    </div>
    {!activities.length ? <p className="muted">Confirmed and failed Watch Proof / Smart Swap attempts will be recorded locally here. Export the journal as submission evidence; private keys and wallet secrets are never stored.</p> :
      <div className="activity-list">{activities.slice(0,20).map(row => <div className={`activity-row activity-${row.status}`} key={row.id}>
        <div><b>{row.kind === 'swap' ? `SWAP · ${row.symbol}` : `WATCH · ${row.symbol}`}</b><span>{new Date(row.createdAt).toLocaleString()}</span></div>
        <div><small>{row.status}</small><strong>{row.kind === 'swap' && row.inputAmountCook ? `${row.inputAmountCook} COOK` : row.aggregator || 'Memo'}</strong></div>
        <div className="activity-proof">{row.signature ? <a href={`${COOKIE_EXPLORER}/tx/${row.signature}`} target="_blank" rel="noreferrer">{compact(row.signature)} ↗</a> : <span>{row.message || 'No signature'}</span>}</div>
      </div>)}</div>}
  </section>
}
