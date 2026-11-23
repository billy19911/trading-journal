import type { SimMonth, SimParams, SimResult } from '../types'

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

export function runSimulation(params: SimParams): SimResult {
  const initial = Math.max(0, params.initial)
  const months = Math.max(1, Math.round(params.months))
  const tradingDays = Math.max(0, Math.round(params.tradingDays))
  const rate = params.dailyReturn / 100
  const monthlyDeposit = Math.max(0, params.monthlyDeposit)
  const monthlyWithdrawal = Math.max(0, params.monthlyWithdrawal)

  let balance = initial
  let peak = initial
  let maxDrawdown = 0
  let totalPnl = 0
  let totalDeposits = 0
  let totalWithdrawals = 0
  let totalTradingDays = 0
  let stopped = false

  const resultMonths: SimMonth[] = []

  for (let m = 1; m <= months; m++) {
    if (stopped) break

    const opening = balance
    const deposit = monthlyDeposit
    const withdrawal = monthlyWithdrawal
    balance = balance + deposit - withdrawal
    totalDeposits += deposit
    totalWithdrawals += withdrawal
    const returnBase = balance

    let monthPnl = 0
    let daysRun = 0
    let monthStopped = false
    let monthPeak = balance

    for (let d = 0; d < tradingDays; d++) {
      const base = params.compounding ? balance : initial
      const profit = base * rate
      balance += profit
      monthPnl += profit
      daysRun++
      totalTradingDays++

      if (balance > peak) peak = balance
      if (balance > monthPeak) monthPeak = balance
      if (peak > 0) {
        maxDrawdown = Math.max(maxDrawdown, ((peak - balance) / peak) * 100)
      }
      if (balance <= 0) {
        monthStopped = true
        stopped = true
        break
      }
    }

    totalPnl += monthPnl
    const drawdown =
      monthPeak > 0 ? Math.max(0, ((monthPeak - balance) / monthPeak) * 100) : 0

    resultMonths.push({
      month: m,
      opening: round2(opening),
      deposit: round2(deposit),
      withdrawal: round2(withdrawal),
      pnl: round2(monthPnl),
      closing: round2(balance),
      returnPct: returnBase > 0 ? (monthPnl / returnBase) * 100 : 0,
      drawdown,
      tradingDays: daysRun,
      stopped: monthStopped,
    })
  }

  const final = balance
  const roi = initial > 0 ? (totalPnl / initial) * 100 : 0

  return {
    months: resultMonths,
    final,
    totalPnl,
    roi,
    maxDrawdown,
    totalDeposits,
    totalWithdrawals,
    tradingDays: totalTradingDays,
    stopped,
  }
}

export interface ScenarioSeriesPoint {
  label: string
  base: number
  best: number
  worst: number
}

export function buildScenarioSeries(params: SimParams, base: SimResult): ScenarioSeriesPoint[] {
  const rate = params.dailyReturn
  const bestRate = rate >= 0 ? rate * 1.5 : rate * 0.5
  const worstRate = rate >= 0 ? rate * 0.5 : rate * 1.5

  const best = runSimulation({ ...params, dailyReturn: bestRate })
  const worst = runSimulation({ ...params, dailyReturn: worstRate })

  const points: ScenarioSeriesPoint[] = [
    {
      label: 'Start',
      base: params.initial,
      best: params.initial,
      worst: params.initial,
    },
  ]

  base.months.forEach((month, index) => {
    points.push({
      label: `M${month.month}`,
      base: month.closing,
      best: best.months[index]?.closing ?? month.closing,
      worst: worst.months[index]?.closing ?? month.closing,
    })
  })

  return points
}
