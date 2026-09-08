import type { ActivityRecord } from './types'

const STORAGE_KEY = 'cookie-alpha-activity-v1'

export function loadActivities(): ActivityRecord[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((row): row is ActivityRecord => Boolean(row && typeof row === 'object')).slice(0, 100)
  } catch {
    return []
  }
}

export function persistActivities(rows: ActivityRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.slice(0, 100)))
}

export function newActivityId(prefix: string) {
  try { return `${prefix}-${crypto.randomUUID()}` } catch { return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}` }
}

export function exportActivityJson(rows: ActivityRecord[]) {
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), activities: rows }, null, 2)], { type: 'application/json' })
  downloadBlob(blob, `cookie-alpha-activity-${new Date().toISOString().slice(0,10)}.json`)
}

export function exportActivityCsv(rows: ActivityRecord[]) {
  const fields: (keyof ActivityRecord)[] = ['createdAt','kind','status','symbol','mint','aggregator','inputAmountCook','expectedOut','signature','message']
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
  const csv = [fields.join(','), ...rows.map(row => fields.map(field => escape(row[field])).join(','))].join('\n')
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `cookie-alpha-activity-${new Date().toISOString().slice(0,10)}.csv`)
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
}
