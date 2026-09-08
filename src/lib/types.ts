export type RawObject = Record<string, unknown>

export type TokenRecord = {
  mint: string
  symbol: string
  name: string
  decimals: number | null
  priceUsd: number | null
  volume24h: number | null
  marketCap: number | null
  liquidity: number | null
  change24h: number | null
  score: number
  risk: 'LOW' | 'MEDIUM' | 'HIGH'
  reasons: string[]
  source: 'live' | 'demo'
}

export type ChainStatus = {
  online: boolean
  cookUsd: number | null
  activeTokens: number | null
  slot: number | null
  latencyMs: number | null
  source: 'cookiescan' | 'rpc' | 'unknown'
}

export type WatchProof = {
  mint: string
  symbol: string
  score: number
  signature: string
  createdAt: string
}

export type SwapQuote = {
  aggregator: 'cookiebox' | 'cookiescan'
  inputMint: string
  outputMint: string
  inAmount: string
  outAmount: string
  minOutAmount: string | null
  priceImpactPct: number | null
  route: string[]
  raw: unknown
}
