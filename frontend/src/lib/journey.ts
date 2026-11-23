import type {
  Account,
  CashEvent,
  DayPoint,
  JournalEntry,
  JournalStatus,
  MonthStat,
  Stats,
  Transaction,
} from '../types'
import { fmtMoney, fmtRate, monthLabel } from './format'

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

export interface Journey {
  points: DayPoint[]
  transactions: Transaction[]
  stats: Stats
  monthly: MonthStat[]
  currentBalance: number
}

function emptyStats(balance: number): Stats {
  return {
    currentBalance: balance,
    netPnl: 0,
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalReturn: 0,
    avgDailyReturn: 0,
    winningDays: 0,
    losingDays: 0,
    breakevenDays: 0,
    tradingDays: 0,
    winRate: 0,
    maxDrawdown: 0,
    bestDay: null,
    worstDay: null,
    currentStreak: { type: 'flat', count: 0 },
    profitFactor: 0,
    avgWin: 0,
    avgLoss: 0,
  }
}

export function analyze(points: DayPoint[], startBalance: number): Stats {
  if (points.length === 0) return emptyStats(startBalance)

  const trading = points.filter((p) => p.hasEntry && p.status !== 'No Trade')
  const wins = trading.filter((p) => p.pnl > 0.005)
  const losses = trading.filter((p) => p.pnl < -0.005)
  const breakevens = trading.length - wins.length - losses.length

  const netPnl = points.reduce((sum, p) => sum + p.pnl, 0)
  const totalDeposits = points.reduce((sum, p) => sum + p.cashIn, 0)
  const totalWithdrawals = points.reduce((sum, p) => sum + p.cashOut, 0)
  const avgDailyReturn =
    trading.length > 0 ? trading.reduce((sum, p) => sum + p.returnPct, 0) / trading.length : 0

  let bestDay: DayPoint | null = null
  let worstDay: DayPoint | null = null
  for (const p of trading) {
    if (!bestDay || p.pnl > bestDay.pnl) bestDay = p
    if (!worstDay || p.pnl < worstDay.pnl) worstDay = p
  }

  let peak = startBalance
  let maxDrawdown = 0
  for (const p of points) {
    if (p.closing > peak) peak = p.closing
    if (peak > 0) {
      const dd = ((peak - p.closing) / peak) * 100
      if (dd > maxDrawdown) maxDrawdown = dd
    }
  }

  let streakType: 'win' | 'loss' | 'flat' = 'flat'
  let streakCount = 0
  for (let i = trading.length - 1; i >= 0; i--) {
    const p = trading[i]
    const type: 'win' | 'loss' | 'flat' = p.pnl > 0.005 ? 'win' : p.pnl < -0.005 ? 'loss' : 'flat'
    if (streakCount === 0) {
      streakType = type
      streakCount = 1
    } else if (type === streakType) {
      streakCount++
    } else {
      break
    }
  }

  const winSum = wins.reduce((sum, p) => sum + p.pnl, 0)
  const lossSum = Math.abs(losses.reduce((sum, p) => sum + p.pnl, 0))

  return {
    currentBalance: points[points.length - 1]?.closing ?? startBalance,
    netPnl,
    totalDeposits,
    totalWithdrawals,
    totalReturn: startBalance > 0 ? (netPnl / startBalance) * 100 : 0,
    avgDailyReturn,
    winningDays: wins.length,
    losingDays: losses.length,
    breakevenDays: breakevens,
    tradingDays: trading.length,
    winRate: trading.length > 0 ? (wins.length / trading.length) * 100 : 0,
    maxDrawdown,
    bestDay,
    worstDay,
    currentStreak: { type: streakType, count: streakCount },
    profitFactor: lossSum > 0 ? winSum / lossSum : winSum > 0 ? 99 : 0,
    avgWin: wins.length > 0 ? winSum / wins.length : 0,
    avgLoss: losses.length > 0 ? lossSum / losses.length : 0,
  }
}

export function monthlyStats(points: DayPoint[]): MonthStat[] {
  const groups = new Map<string, DayPoint[]>()
  for (const p of points) {
    const key = p.date.slice(0, 7)
    const list = groups.get(key)
    if (list) list.push(p)
    else groups.set(key, [p])
  }

  const out: MonthStat[] = []
  for (const [key, group] of [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const opening = group[0].opening
    const closing = group[group.length - 1].closing
    const pnl = group.reduce((sum, p) => sum + p.pnl, 0)
    const trading = group.filter((p) => p.hasEntry && p.status !== 'No Trade')
    const twr =
      trading.length > 0
        ? (trading.reduce((acc, p) => acc * (1 + p.returnPct / 100), 1) - 1) * 100
        : 0
    let peak = opening
    let maxDrawdown = 0
    for (const p of group) {
      if (p.closing > peak) peak = p.closing
      if (peak > 0) maxDrawdown = Math.max(maxDrawdown, ((peak - p.closing) / peak) * 100)
    }
    out.push({
      key,
      label: monthLabel(key),
      opening,
      closing,
      pnl,
      returnPct: twr,
      deposits: group.reduce((sum, p) => sum + p.cashIn, 0),
      withdrawals: group.reduce((sum, p) => sum + p.cashOut, 0),
      tradingDays: trading.length,
      wins: trading.filter((p) => p.pnl > 0.005).length,
      losses: trading.filter((p) => p.pnl < -0.005).length,
      maxDrawdown,
    })
  }
  return out
}

export function buildJourney(
  account: Account,
  allJournals: JournalEntry[],
  allCashEvents: CashEvent[],
): Journey {
  const entries = allJournals
    .filter((j) => j.accountId === account.id)
    .sort((a, b) => a.date.localeCompare(b.date))
  const entryByDate = new Map<string, JournalEntry>()
  for (const entry of entries) entryByDate.set(entry.date, entry)

  const events = allCashEvents
    .filter((e) => e.accountId === account.id && e.date >= account.startDate)
    .sort((a, b) => a.date.localeCompare(b.date))
  const eventsByDate = new Map<string, CashEvent[]>()
  for (const event of events) {
    const list = eventsByDate.get(event.date)
    if (list) list.push(event)
    else eventsByDate.set(event.date, [event])
  }

  const dates = [
    ...new Set([
      ...entries.filter((e) => e.date >= account.startDate).map((e) => e.date),
      ...events.map((e) => e.date),
    ]),
  ].sort()

  const points: DayPoint[] = []
  const transactions: Transaction[] = []
  let balance = account.initialBalance
  let seq = 0

  const initialDescription =
    account.sourceCurrency === account.currency
      ? `Initial capital · ${fmtMoney(account.initialCapital, account.sourceCurrency)}`
      : `Initial capital · ${fmtMoney(account.initialCapital, account.sourceCurrency)} @ ${fmtRate(account.exchangeRate)}`

  transactions.push({
    id: `${account.id}-initial`,
    date: account.startDate,
    type: 'INITIAL_CAPITAL',
    amount: account.initialBalance,
    balanceAfter: balance,
    description: initialDescription,
    sync: 'Synced',
  })

  for (const date of dates) {
    const entry = entryByDate.get(date)
    const dayEvents = eventsByDate.get(date) ?? []
    const opening = balance
    const pnl = entry?.pnl ?? 0

    if (pnl !== 0) {
      balance = round2(balance + pnl)
      transactions.push({
        id: `tx-${entry?.id ?? date}-trade`,
        date,
        type: pnl > 0 ? 'TRADING_PROFIT' : 'TRADING_LOSS',
        amount: Math.abs(pnl),
        balanceAfter: balance,
        description: entry?.notes?.slice(0, 72) || (pnl > 0 ? 'Trading profit' : 'Trading loss'),
        sync: 'Synced',
      })
    }

    let cashIn = 0
    let cashOut = 0
    for (const event of dayEvents) {
      if (event.type === 'DEPOSIT') {
        cashIn += event.amount
        balance = round2(balance + event.amount)
        transactions.push({
          id: `tx-${event.id}`,
          date,
          type: 'DEPOSIT',
          amount: event.amount,
          balanceAfter: balance,
          description: `Deposit${event.note ? ` · ${event.note}` : ''}`,
          sync: 'Synced',
        })
      } else {
        cashOut += event.amount
        balance = round2(balance - event.amount)
        transactions.push({
          id: `tx-${event.id}`,
          date,
          type: 'WITHDRAWAL',
          amount: event.amount,
          balanceAfter: balance,
          description: `Withdrawal${event.note ? ` · ${event.note}` : ''}`,
          sync: 'Synced',
        })
      }
    }

    const status: JournalStatus = entry?.status ?? 'No Trade'
    points.push({
      date,
      opening,
      pnl,
      closing: balance,
      returnPct: opening !== 0 ? (pnl / opening) * 100 : 0,
      status,
      hasEntry: Boolean(entry),
      cashIn,
      cashOut,
      notes: entry?.notes,
      tags: entry?.tags,
    })
  }

  if (points.length === 0) {
    points.push({
      date: account.startDate,
      opening: account.initialBalance,
      pnl: 0,
      closing: account.initialBalance,
      returnPct: 0,
      status: 'No Trade',
      hasEntry: false,
      cashIn: 0,
      cashOut: 0,
    })
  }

  const stats = analyze(points, account.initialBalance)
  const monthly = monthlyStats(points)

  return {
    points,
    transactions: transactions.reverse(),
    stats,
    monthly,
    currentBalance: stats.currentBalance,
  }
}

export function openingBefore(points: DayPoint[], date: string, fallback: number): number {
  let balance = fallback
  for (const point of points) {
    if (point.date < date) balance = point.closing
    else break
  }
  return balance
}

export function drawdownSeries(
  points: DayPoint[],
  startBalance: number,
): { date: string; label: string; drawdown: number }[] {
  let peak = startBalance
  return points.map((p) => {
    if (p.closing > peak) peak = p.closing
    const dd = peak > 0 ? -Math.max(0, ((peak - p.closing) / peak) * 100) : 0
    return { date: p.date, label: p.date, drawdown: dd }
  })
}

export function periodStart(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function slicePoints(points: DayPoint[], days: number | 'all'): DayPoint[] {
  if (days === 'all') return points
  const cutoff = periodStart(days)
  return points.filter((p) => p.date >= cutoff)
}
