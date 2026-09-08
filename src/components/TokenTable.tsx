import type { TokenRecord } from '../lib/types'
import { COOKIE_EXPLORER, COOKIE_SWAP } from '../lib/config'

const money = (value: number | null) => {
  if (value == null) return '—'
  if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
  if (Math.abs(value) >= 1) return `$${value.toFixed(2)}`
  return `$${value.toPrecision(3)}`
}

export function TokenTable({ tokens, onWatch, onTrade, busyMint }: { tokens: TokenRecord[]; onWatch: (token: TokenRecord) => void; onTrade: (token: TokenRecord) => void; busyMint: string | null }) {
  if (!tokens.length) return <div className="empty">No live token rows yet. CookieScan may be indexing or temporarily unavailable.</div>
  return (
    <div className="table-wrap">
      <table>
        <thead><tr><th>Asset</th><th>Alpha</th><th>Price</th><th>24h</th><th>Liquidity</th><th>Volume</th><th>Risk signal</th><th></th></tr></thead>
        <tbody>{tokens.map((token) => (
          <tr key={token.mint}>
            <td><div className="asset"><b>{token.symbol}</b><span>{token.name}</span><code>{token.mint.slice(0, 5)}…{token.mint.slice(-5)}</code></div></td>
            <td><div className={`score score-${token.risk.toLowerCase()}`}>{token.score}</div></td>
            <td>{money(token.priceUsd)}</td>
            <td className={(token.change24h ?? 0) >= 0 ? 'positive' : 'negative'}>{token.change24h == null ? '—' : `${token.change24h > 0 ? '+' : ''}${token.change24h.toFixed(1)}%`}</td>
            <td>{money(token.liquidity)}</td>
            <td>{money(token.volume24h)}</td>
            <td><div className="reasons">{token.reasons.slice(0, 2).map(r => <span key={r}>{r}</span>)}</div></td>
            <td><div className="row-actions">
              <button className="watch-button" onClick={() => onWatch(token)} disabled={busyMint === token.mint}>{busyMint === token.mint ? 'Signing…' : 'Watch on-chain'}</button>
              <a href={`${COOKIE_EXPLORER}/token/${token.mint}`} target="_blank" rel="noreferrer">Scan</a>
              <button className="trade-button" onClick={() => onTrade(token)}>Smart swap</button><a href={COOKIE_SWAP} target="_blank" rel="noreferrer">DEX</a>
            </div></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  )
}
