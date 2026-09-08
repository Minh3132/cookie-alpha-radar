import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

const COOKIEBOX = 'https://agg.cookiebox.app'
const COOKIESCAN_SWAP = 'https://swap.cookiescan.io/api'

async function readJson(url: string, init?: RequestInit, timeoutMs = 12000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const r = await fetch(url, { ...init, signal: controller.signal, headers: { 'content-type': 'application/json', ...(init?.headers || {}) } })
    const text = await r.text()
    if (!r.ok) throw new Error(`${r.status}: ${text.slice(0, 180)}`)
    return JSON.parse(text) as any
  } finally { clearTimeout(id) }
}

function localApi(): Plugin {
  return {
    name: 'cookie-alpha-local-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()
        res.setHeader('content-type', 'application/json')
        res.setHeader('cache-control', 'no-store')
        try {
          const url = new URL(req.url, 'http://localhost')
          if (url.pathname === '/api/quote' && req.method === 'GET') {
            const inputMint = url.searchParams.get('inputMint') || ''
            const outputMint = url.searchParams.get('outputMint') || ''
            const amount = url.searchParams.get('amount') || ''
            const slippageBps = url.searchParams.get('slippageBps') || '500'
            const owner = url.searchParams.get('owner') || ''
            if (!inputMint || !outputMint || !/^\d+$/.test(amount)) throw new Error('invalid quote fields')
            const qs = new URLSearchParams({ inputMint, outputMint, amount, slippageBps, ...(owner ? { owner } : {}) })
            const [cb, cs] = await Promise.allSettled([
              readJson(`${COOKIEBOX}/quote?${qs}`),
              readJson(`${COOKIESCAN_SWAP}/quote/multi-route?${new URLSearchParams({ inputMint, outputMint, amount, slippageBps })}`),
            ])
            const quotes:any[] = []; const errors:string[] = []
            if (cb.status === 'fulfilled' && cb.value?.route) {
              const q=cb.value.route; quotes.push({ aggregator:'cookiebox', inputMint, outputMint, inAmount:String(q.inAmount??amount), outAmount:String(q.netOutAmount??q.outAmount??'0'), minOutAmount:q.minOutAmount==null?null:String(q.minOutAmount), priceImpactPct:Number.isFinite(Number(q.priceImpactPct))?Number(q.priceImpactPct):null, route:Array.isArray(q.path)?q.path:[], raw:q })
            } else errors.push(`cookiebox: ${cb.status === 'rejected' ? cb.reason?.message || cb.reason : 'no route'}`)
            if (cs.status === 'fulfilled' && cs.value?.multiRoute) {
              const q=cs.value.multiRoute; quotes.push({ aggregator:'cookiescan', inputMint, outputMint, inAmount:String(q.totalInAmount??amount), outAmount:String(q.totalOutAmount??'0'), minOutAmount:q.minOutAmount==null?null:String(q.minOutAmount), priceImpactPct:Number.isFinite(Number(q.combinedPriceImpactPct))?Number(q.combinedPriceImpactPct):null, route:Array.isArray(q.route)?q.route:[], raw:q })
            } else errors.push(`cookiescan: ${cs.status === 'rejected' ? cs.reason?.message || cs.reason : 'no route'}`)
            quotes.sort((a,b)=>BigInt(b.outAmount)>BigInt(a.outAmount)?1:BigInt(b.outAmount)<BigInt(a.outAmount)?-1:0)
            res.statusCode=200; res.end(JSON.stringify({quotes,errors})); return
          }
          if (url.pathname === '/api/swap-tx' && req.method === 'POST') {
            const chunks:Buffer[]=[]; for await (const chunk of req) chunks.push(Buffer.from(chunk))
            const body=JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
            const {aggregator,inputMint,outputMint,amount,slippageBps=500,owner,rawRoute}=body
            if(!owner||!inputMint||!outputMint||!amount) throw new Error('missing swap fields')
            if(aggregator==='cookiebox') {
              const built=await readJson(`${COOKIEBOX}/swap-tx`,{method:'POST',body:JSON.stringify({inputMint,outputMint,amount:String(amount),slippageBps:Number(slippageBps),owner})},60000)
              res.statusCode=200; res.end(JSON.stringify({aggregator,transactionBase64:built.transactionBase64,blockhash:built.blockhash,lastValidBlockHeight:built.lastValidBlockHeight})); return
            }
            if(aggregator==='cookiescan') {
              if(!rawRoute) throw new Error('missing Candy Shop route')
              const built=await readJson(`${COOKIESCAN_SWAP}/swap-tx/multi-route`,{method:'POST',body:JSON.stringify({multiRoute:rawRoute,userPublicKey:owner})},20000)
              res.statusCode=200; res.end(JSON.stringify({aggregator,transactionBase64:built.transactionBase64})); return
            }
            throw new Error('unsupported aggregator')
          }
          res.statusCode=404; res.end(JSON.stringify({error:'not found'}))
        } catch (e) {
          res.statusCode=400; res.end(JSON.stringify({error:e instanceof Error?e.message:'local api failed'}))
        }
      })
    }
  }
}

export default defineConfig({
  plugins: [react(), localApi()],
  server: { port: 4173 },
})
