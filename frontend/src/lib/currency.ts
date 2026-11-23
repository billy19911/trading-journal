import type { CurrencyCode } from '../types'

/**
 * Convert capital through a USD pivot. USC uses the account's own cent ratio.
 * Prototype supports IDR, USD and USC (the currencies used by the seeded accounts).
 */
export function convertCapital(
  amount: number,
  source: CurrencyCode,
  target: CurrencyCode,
  usdIdrRate: number,
  centRatio: number,
): number {
  if (!Number.isFinite(amount) || amount === 0) return 0
  const ratio = centRatio > 0 ? centRatio : 1
  const rate = usdIdrRate > 0 ? usdIdrRate : 1

  let usd = amount
  if (source === 'IDR') usd = amount / rate
  else if (source === 'USC') usd = amount / ratio

  if (target === 'IDR') return usd * rate
  if (target === 'USC') return usd * ratio
  return usd
}

export function conversionPath(
  source: CurrencyCode,
  target: CurrencyCode,
  centRatio: number,
): string {
  if (source === target) return source
  if (target === 'USC') {
    return source === 'USD' ? `USD × ${centRatio} → USC` : `${source} → USD × ${centRatio} → USC`
  }
  if (source === 'USC') {
    return `USC ÷ ${centRatio} → USD${target === 'IDR' ? ' → IDR' : ''}`
  }
  return `${source} → ${target}`
}
