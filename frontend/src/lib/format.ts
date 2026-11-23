import type { CurrencyCode } from '../types'

const MINUS = '\u2212'

export const currencyLabel: Record<CurrencyCode, string> = {
  USC: 'US Cent',
  USD: 'US Dollar',
  IDR: 'Indonesian Rupiah',
  EUR: 'Euro',
  GBP: 'British Pound',
}

export function currencyDecimals(currency: string): number {
  return currency === 'IDR' ? 0 : 2
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0)
}

export function toISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayISO(): string {
  return toISO(new Date())
}

export function addDays(iso: string, days: number): string {
  const d = parseISO(iso)
  d.setDate(d.getDate() + days)
  return toISO(d)
}

export function addMonths(iso: string, months: number): string {
  const d = parseISO(iso)
  d.setMonth(d.getMonth() + months)
  return toISO(d)
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7)
}

export function monthLabel(key: string, style: 'short' | 'long' = 'short'): string {
  const [y, m] = key.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', {
    month: style === 'long' ? 'long' : 'short',
    year: 'numeric',
  }).format(new Date(y, m - 1, 1))
}

export function fmtNumber(value: number, decimals = 2): string {
  const abs = Math.abs(value)
  const body = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(abs)
  return `${value < 0 ? MINUS : ''}${body}`
}

export function fmtMoney(
  value: number,
  currency: string,
  opts: { decimals?: number; signed?: boolean; code?: boolean } = {},
): string {
  const decimals = opts.decimals ?? currencyDecimals(currency)
  const body = fmtNumber(value, decimals)
  const sign = value > 0 && opts.signed ? '+' : ''
  const code = opts.code === false ? '' : ` ${currency}`
  return `${sign}${body}${code}`
}

export function fmtCompact(value: number): string {
  const abs = Math.abs(value)
  const body = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: abs >= 1000 ? 1 : 2,
  }).format(abs)
  return `${value < 0 ? MINUS : ''}${body}`
}

export function fmtPct(value: number, opts: { signed?: boolean; digits?: number } = {}): string {
  const digits = opts.digits ?? 2
  const abs = Math.abs(value)
  const body = abs.toFixed(digits)
  const sign = value < 0 ? MINUS : value > 0 && opts.signed !== false ? '+' : ''
  return `${sign}${body}%`
}

export function fmtDate(
  iso: string,
  style: 'short' | 'medium' | 'long' | 'full' | 'month' | 'monthShort' | 'day' | 'weekday' = 'short',
): string {
  const date = parseISO(iso)
  switch (style) {
    case 'medium':
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
    case 'long':
      return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(date)
    case 'full':
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(date)
    case 'month':
      return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date)
    case 'monthShort':
      return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(date)
    case 'day':
      return String(date.getDate())
    case 'weekday':
      return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date)
    default:
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date)
  }
}

export function fmtRate(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value)
}

export function relativeTime(isoTimestamp: string): string {
  const then = new Date(isoTimestamp).getTime()
  const diff = Math.max(0, Date.now() - then)
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'just now'
  if (min < 60) return `${min} min ago`
  const hours = Math.floor(min / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

export function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Good evening'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}
