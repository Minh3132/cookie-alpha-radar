import type { TokenRecord } from './types'

// Explicitly synthetic fixtures for UI/demo resilience only. They are never tradable and are never
// presented as live market data. The UI only offers them after the live CookieScan feed fails.
export const DEMO_TOKENS: TokenRecord[] = [
  { mint:'DemoAlpha1111111111111111111111111111111111', symbol:'CRMB', name:'Demo Crumb', decimals:9, priceUsd:0.0184, volume24h:184000, marketCap:920000, liquidity:148000, change24h:12.8, score:93, risk:'LOW', reasons:['deep liquidity','strong 24h flow','good liquidity / cap'], source:'demo' },
  { mint:'DemoChip22222222222222222222222222222222222', symbol:'CHIP', name:'Demo Choc Chip', decimals:6, priceUsd:0.00421, volume24h:71600, marketCap:440000, liquidity:59000, change24h:31.2, score:77, risk:'MEDIUM', reasons:['healthy liquidity','active flow','high turnover'], source:'demo' },
  { mint:'DemoOven33333333333333333333333333333333333', symbol:'OVEN', name:'Demo Oven', decimals:9, priceUsd:0.00073, volume24h:9800, marketCap:190000, liquidity:18200, change24h:-16.4, score:58, risk:'MEDIUM', reasons:['active flow','limited liquidity depth'], source:'demo' },
  { mint:'DemoRisk44444444444444444444444444444444444', symbol:'RISK', name:'Demo Thin Cookie', decimals:9, priceUsd:0.000041, volume24h:440, marketCap:85000, liquidity:2100, change24h:112.0, score:8, risk:'HIGH', reasons:['thin liquidity','low flow','extreme 24h volatility'], source:'demo' },
]
