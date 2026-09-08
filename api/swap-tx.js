const COOKIEBOX = 'https://agg.cookiebox.app'
const COOKIESCAN_SWAP = 'https://swap.cookiescan.io/api'

async function readJson(url, init, timeoutMs = 60000) {
  const controller = new AbortController(); const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const r = await fetch(url, { ...init, signal:controller.signal, headers:{'content-type':'application/json', ...(init?.headers || {})} })
    const text = await r.text()
    if (!r.ok) throw new Error(`${r.status}: ${text.slice(0,200)}`)
    return JSON.parse(text)
  } finally { clearTimeout(id) }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  try {
    const { aggregator, inputMint, outputMint, amount, slippageBps = 500, owner } = req.body || {}
    if (!owner || !inputMint || !outputMint || !amount) throw new Error('missing swap fields')
    if (!/^\d+$/.test(String(amount)) || BigInt(String(amount)) <= 0n) throw new Error('amount must be a positive raw integer')
    const slip = Number(slippageBps)
    if (!Number.isInteger(slip) || slip < 10 || slip > 3000) throw new Error('slippageBps must be between 10 and 3000')

    if (aggregator === 'cookiebox') {
      // Cookiebox re-quotes server-side as part of /swap-tx.
      const built = await readJson(`${COOKIEBOX}/swap-tx`, {method:'POST',body:JSON.stringify({ inputMint, outputMint, amount:String(amount), slippageBps:slip, owner })})
      if (!built?.transactionBase64) throw new Error('Cookiebox returned no transaction')
      return res.status(200).json({ aggregator, transactionBase64: built.transactionBase64, blockhash: built.blockhash, lastValidBlockHeight: built.lastValidBlockHeight, freshQuote: { aggregator:'cookiebox', inputMint, outputMint, inAmount:String(built.route?.inAmount ?? amount), outAmount:String(built.route?.netOutAmount ?? built.route?.outAmount ?? '0'), minOutAmount:built.route?.minOutAmount == null ? null : String(built.route.minOutAmount), priceImpactPct:Number.isFinite(Number(built.route?.priceImpactPct)) ? Number(built.route.priceImpactPct) : null, route:Array.isArray(built.route?.path) ? built.route.path : [] } })
    }

    if (aggregator === 'cookiescan') {
      // Never trust a route echoed by the browser. Re-quote on the server immediately before build.
      const qs = new URLSearchParams({ inputMint, outputMint, amount:String(amount), slippageBps:String(slip) })
      const quoted = await readJson(`${COOKIESCAN_SWAP}/quote/multi-route?${qs}`, undefined, 12000)
      if (!quoted?.multiRoute) throw new Error('Candy Shop returned no fresh route')
      const built = await readJson(`${COOKIESCAN_SWAP}/swap-tx/multi-route`, {method:'POST',body:JSON.stringify({ multiRoute: quoted.multiRoute, userPublicKey: owner })}, 20000)
      if (!built?.transactionBase64) throw new Error('Candy Shop returned no transaction')
      return res.status(200).json({ aggregator, transactionBase64: built.transactionBase64, freshQuote: { aggregator:'cookiescan', inputMint, outputMint, inAmount:String(quoted.multiRoute.totalInAmount ?? amount), outAmount:String(quoted.multiRoute.totalOutAmount ?? '0'), minOutAmount:quoted.multiRoute.minOutAmount == null ? null : String(quoted.multiRoute.minOutAmount), priceImpactPct:Number.isFinite(Number(quoted.multiRoute.combinedPriceImpactPct)) ? Number(quoted.multiRoute.combinedPriceImpactPct) : null, route:Array.isArray(quoted.multiRoute.route) ? quoted.multiRoute.route : [] } })
    }
    throw new Error('unsupported aggregator')
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'swap build failed' })
  }
}
