export function decimalToRaw(value: string, decimals: number): string {
  const trimmed = value.trim()
  if (!/^\d+(?:\.\d+)?$/.test(trimmed)) return ''
  const [whole, frac = ''] = trimmed.split('.')
  if (frac.length > decimals) return ''
  const raw = `${whole}${frac.padEnd(decimals, '0')}`.replace(/^0+(?=\d)/, '') || '0'
  try {
    const n = BigInt(raw)
    return n > 0n ? n.toString() : ''
  } catch {
    return ''
  }
}
