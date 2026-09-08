const COOKIEBOX = 'https://agg.cookiebox.app'
const COOKIESCAN_SWAP = 'https://swap.cookiescan.io/api'

async function postJson(url, body, timeoutMs = 60000) {
  const controller = new AbortController(); const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const r = await fetch(url, { method:'POST', signal:controller.signal, headers:{'content-type':'application/json'}, body:JSON.stringify(body) })
    const text = await r.text()
    if (!r.ok) throw new Error(`${r.status}: ${text.slice(0,200)}`)
    return JSON.parse(text)
  } finally { clearTimeout(id) }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' })
  try {
    const { aggregator, inputMint, outputMint, amount, slippageBps = 500, owner, rawRoute } = req.body || {}
    if (!owner || !inputMint || !outputMint || !amount) throw new Error('missing swap fields')
    if (aggregator === 'cookiebox') {
      const built = await postJson(`${COOKIEBOX}/swap-tx`, { inputMint, outputMint, amount:String(amount), slippageBps:Number(slippageBps), owner })
      return res.status(200).json({ aggregator, transactionBase64: built.transactionBase64, blockhash: built.blockhash, lastValidBlockHeight: built.lastValidBlockHeight })
    }
    if (aggregator === 'cookiescan') {
      if (!rawRoute) throw new Error('missing Candy Shop route')
      const built = await postJson(`${COOKIESCAN_SWAP}/swap-tx/multi-route`, { multiRoute: rawRoute, userPublicKey: owner }, 20000)
      return res.status(200).json({ aggregator, transactionBase64: built.transactionBase64 })
    }
    throw new Error('unsupported aggregator')
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'swap build failed' })
  }
}
