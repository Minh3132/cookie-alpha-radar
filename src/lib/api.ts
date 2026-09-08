import { Connection } from '@solana/web3.js'
import { COOKIE_API, COOKIE_RPC } from './config'
import { extractTokenArray, normalizeToken } from './market'
import type { ChainStatus, RawObject, TokenRecord } from './types'

async function getJson(path: string, signal?: AbortSignal) {
  const response = await fetch(`${COOKIE_API}${path}`, { signal, headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`${path} returned ${response.status}`)
  return response.json() as Promise<unknown>
}

export async function fetchTokens(signal?: AbortSignal): Promise<TokenRecord[]> {
  const candidates = ['/v1/assets/trending', '/api/tokens']
  let lastError: unknown
  for (const path of candidates) {
    try {
      const payload = await getJson(path, signal)
      const records = extractTokenArray(payload).map(normalizeToken).filter(Boolean) as TokenRecord[]
      if (records.length) return dedupe(records).sort((a, b) => b.score - a.score)
    } catch (error) {
      if ((error as Error).name === 'AbortError') throw error
      lastError = error
    }
  }
  throw lastError instanceof Error ? lastError : new Error('CookieScan token feeds returned no records')
}

function dedupe(tokens: TokenRecord[]) {
  const map = new Map<string, TokenRecord>()
  for (const token of tokens) if (!map.has(token.mint)) map.set(token.mint, token)
  return [...map.values()]
}

export async function fetchChainStatus(signal?: AbortSignal): Promise<ChainStatus> {
  const started = performance.now()
  try {
    const payload = await getJson('/api/status', signal)
    const o = (payload && typeof payload === 'object' ? payload : {}) as RawObject
    return {
      online: true,
      cookUsd: toNum(o.cookUsd ?? o.cook_usd ?? o.price),
      activeTokens: toNum(o.activeTokens ?? o.active_tokens),
      slot: toNum(o.slot),
      latencyMs: Math.round(performance.now() - started),
      source: 'cookiescan',
    }
  } catch {
    try {
      const connection = new Connection(COOKIE_RPC, 'confirmed')
      const slot = await connection.getSlot('confirmed')
      return { online: true, cookUsd: null, activeTokens: null, slot, latencyMs: Math.round(performance.now() - started), source: 'rpc' }
    } catch {
      return { online: false, cookUsd: null, activeTokens: null, slot: null, latencyMs: null, source: 'unknown' }
    }
  }
}

const toNum = (v: unknown) => {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN
  return Number.isFinite(n) ? n : null
}
