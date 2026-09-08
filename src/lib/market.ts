import type { RawObject, TokenRecord } from './types'

const num = (...values: unknown[]): number | null => {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value.replace(/[$,%]/g, ''))
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return null
}

const str = (...values: unknown[]): string => {
  for (const value of values) if (typeof value === 'string' && value.trim()) return value.trim()
  return ''
}

const getNested = (obj: RawObject, key: string): unknown => {
  const parts = key.split('.')
  let cur: unknown = obj
  for (const part of parts) {
    if (!cur || typeof cur !== 'object') return undefined
    cur = (cur as RawObject)[part]
  }
  return cur
}

export function normalizeToken(input: unknown): TokenRecord | null {
  if (!input || typeof input !== 'object') return null
  const o = input as RawObject
  const mint = str(o.mint, o.address, o.tokenMint, o.id, getNested(o, 'token.mint'))
  if (!mint) return null
  const symbol = str(o.symbol, o.ticker, getNested(o, 'token.symbol')) || `${mint.slice(0, 4)}…${mint.slice(-4)}`
  const name = str(o.name, getNested(o, 'token.name')) || symbol
  const decimals = num(o.decimals, getNested(o, 'token.decimals'))
  const priceUsd = num(o.priceUsd, o.price_usd, o.price, getNested(o, 'market.priceUsd'))
  const volume24h = num(o.volume24h, o.volume_24h, o.volume24H, getNested(o, 'market.volume24h'))
  const marketCap = num(o.marketCap, o.market_cap, o.mcap, getNested(o, 'market.marketCap'))
  const liquidity = num(o.liquidity, o.liquidityUsd, o.tvl, o.tvlUsd, getNested(o, 'market.liquidityUsd'))
  const change24h = num(o.change24h, o.priceChange24h, o.change_24h, getNested(o, 'market.change24h'))
  const scored = scoreToken({ volume24h, marketCap, liquidity, change24h })
  return { mint, symbol, name, decimals, priceUsd, volume24h, marketCap, liquidity, change24h, ...scored, source: 'live' }
}

function scoreToken(v: Pick<TokenRecord, 'volume24h' | 'marketCap' | 'liquidity' | 'change24h'>) {
  let score = 35
  const reasons: string[] = []
  const liq = v.liquidity ?? 0
  const vol = v.volume24h ?? 0
  const mcap = v.marketCap ?? 0
  const change = Math.abs(v.change24h ?? 0)

  if (liq >= 100_000) { score += 18; reasons.push('deep liquidity') }
  else if (liq >= 25_000) { score += 12; reasons.push('healthy liquidity') }
  else if (liq > 0 && liq < 5_000) { score -= 16; reasons.push('thin liquidity') }

  if (vol >= 100_000) { score += 18; reasons.push('strong 24h flow') }
  else if (vol >= 10_000) { score += 10; reasons.push('active flow') }
  else if (vol > 0 && vol < 1_000) { score -= 8; reasons.push('low flow') }

  if (mcap > 0 && liq > 0) {
    const ratio = liq / mcap
    if (ratio >= 0.12) { score += 12; reasons.push('good liquidity / cap') }
    else if (ratio < 0.02) { score -= 12; reasons.push('weak liquidity / cap') }
  }

  if (vol > 0 && mcap > 0 && vol / mcap >= 0.25) { score += 10; reasons.push('high turnover') }
  if (change >= 80) { score -= 12; reasons.push('extreme 24h volatility') }
  else if (change >= 35) { score -= 5; reasons.push('elevated volatility') }

  score = Math.max(0, Math.min(100, Math.round(score)))
  const risk: TokenRecord['risk'] = score >= 68 ? 'LOW' : score >= 48 ? 'MEDIUM' : 'HIGH'
  if (!reasons.length) reasons.push('limited market data')
  return { score, risk, reasons }
}

export function extractTokenArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') return []
  const o = payload as RawObject
  for (const key of ['tokens', 'assets', 'data', 'results', 'items']) {
    const value = o[key]
    if (Array.isArray(value)) return value
    if (value && typeof value === 'object') {
      for (const nested of ['tokens', 'assets', 'items', 'results']) {
        const n = (value as RawObject)[nested]
        if (Array.isArray(n)) return n
      }
    }
  }
  return []
}
