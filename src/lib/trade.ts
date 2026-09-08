import type { SwapQuote } from './types'

export async function getSwapQuotes(args: { inputMint: string; outputMint: string; amount: string; slippageBps: number; owner?: string }) {
  const q = new URLSearchParams({ inputMint: args.inputMint, outputMint: args.outputMint, amount: args.amount, slippageBps: String(args.slippageBps), ...(args.owner ? { owner: args.owner } : {}) })
  const r = await fetch(`/api/quote?${q}`)
  const body = await r.json() as { quotes?: SwapQuote[]; errors?: string[]; error?: string }
  if (!r.ok) throw new Error(body.error || `quote ${r.status}`)
  return { quotes: body.quotes || [], errors: body.errors || [] }
}

export async function buildSwapTransaction(args: { quote: SwapQuote; owner: string; amount: string; slippageBps: number }) {
  const r = await fetch('/api/swap-tx', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
    aggregator: args.quote.aggregator,
    inputMint: args.quote.inputMint,
    outputMint: args.quote.outputMint,
    amount: args.amount,
    slippageBps: args.slippageBps,
    owner: args.owner,
  }) })
  const body = await r.json() as { transactionBase64?: string; blockhash?: string; lastValidBlockHeight?: number; error?: string }
  if (!r.ok || !body.transactionBase64) throw new Error(body.error || `swap build ${r.status}`)
  return body
}
