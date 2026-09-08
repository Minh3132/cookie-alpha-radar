const COOKIEBOX = 'https://agg.cookiebox.app'
const COOKIESCAN_SWAP = 'https://swap.cookiescan.io/api'

const required = (value, name) => {
  if (!value || typeof value !== 'string') throw new Error(`missing ${name}`)
  return value
}
const n = (v) => Number.isFinite(Number(v)) ? Number(v) : null

async function readJson(url, init, timeoutMs = 12000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const r = await fetch(url, { ...init, signal: controller.signal, headers: { 'content-type': 'application/json', ...(init?.headers || {}) } })
    const text = await r.text()
    if (!r.ok) throw new Error(`${r.status}: ${text.slice(0, 180)}`)
    return JSON.parse(text)
  } finally { clearTimeout(id) }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  try {
    const inputMint = required(req.query.inputMint, 'inputMint')
    const outputMint = required(req.query.outputMint, 'outputMint')
    const amount = required(req.query.amount, 'amount')
    const slippageBps = String(req.query.slippageBps || '500')
    const owner = typeof req.query.owner === 'string' ? req.query.owner : ''
    if (!/^\d+$/.test(amount) || BigInt(amount) <= 0n) throw new Error('amount must be a positive raw integer')
    const qs = new URLSearchParams({ inputMint, outputMint, amount, slippageBps, ...(owner ? { owner } : {}) })

    const [cb, cs] = await Promise.allSettled([
      readJson(`${COOKIEBOX}/quote?${qs}`),
      readJson(`${COOKIESCAN_SWAP}/quote/multi-route?${new URLSearchParams({ inputMint, outputMint, amount, slippageBps })}`),
    ])
    const quotes = []
    const errors = []
    if (cb.status === 'fulfilled' && cb.value?.route) {
      const q = cb.value.route
      quotes.push({
        aggregator: 'cookiebox', inputMint, outputMint,
        inAmount: String(q.inAmount ?? amount),
        outAmount: String(q.netOutAmount ?? q.outAmount ?? '0'),
        minOutAmount: q.minOutAmount == null ? null : String(q.minOutAmount),
        priceImpactPct: n(q.priceImpactPct),
        route: Array.isArray(q.path) ? q.path : [],
        raw: q,
      })
    } else errors.push(`cookiebox: ${cb.status === 'rejected' ? cb.reason?.message || cb.reason : 'no route'}`)

    if (cs.status === 'fulfilled' && cs.value?.multiRoute) {
      const q = cs.value.multiRoute
      quotes.push({
        aggregator: 'cookiescan', inputMint, outputMint,
        inAmount: String(q.totalInAmount ?? amount),
        outAmount: String(q.totalOutAmount ?? '0'),
        minOutAmount: q.minOutAmount == null ? null : String(q.minOutAmount),
        priceImpactPct: n(q.combinedPriceImpactPct),
        route: Array.isArray(q.route) ? q.route : [],
        raw: q,
      })
    } else errors.push(`cookiescan: ${cs.status === 'rejected' ? cs.reason?.message || cs.reason : 'no route'}`)

    quotes.sort((a,b) => { try { return BigInt(b.outAmount) > BigInt(a.outAmount) ? 1 : BigInt(b.outAmount) < BigInt(a.outAmount) ? -1 : 0 } catch { return 0 } })
    res.status(200).json({ quotes, errors })
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : 'quote failed' })
  }
}
