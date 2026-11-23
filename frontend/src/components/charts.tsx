import { useId } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DayPoint, MonthStat } from '../types'
import { drawdownSeries } from '../lib/journey'
import { fmtCompact, fmtDate, fmtMoney, fmtPct } from '../lib/format'
import type { ScenarioSeriesPoint } from '../lib/simulate'

const AXIS = {
  tick: { fill: 'var(--faint)', fontSize: 9.5, fontFamily: 'Geist Mono, monospace' },
  axisLine: false as const,
  tickLine: false as const,
}

function fmtAxis(value: number): string {
  if (Math.abs(value) >= 1000) return fmtCompact(value)
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value)
}

function niceCeil(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)))
  const normalized = value / magnitude
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return step * magnitude
}

function ChartTip({
  active,
  payload,
  label,
  currency,
  percent = false,
  raw = false,
}: {
  active?: boolean
  payload?: any[]
  label?: string
  currency: string
  percent?: boolean
  raw?: boolean
}) {
  if (!active || !payload || payload.length === 0) return null
  const row = payload[0]?.payload ?? {}
  const title = row.fullLabel ?? label
  return (
    <div className="chart-tip min-w-[140px]">
      <div className="eyebrow mb-1.5">{title}</div>
      <div className="space-y-1">
        {payload.map((entry, index) => {
          const value = Number(entry.value ?? 0)
          const formatted = raw
            ? `${value}`
            : percent
              ? fmtPct(value)
              : fmtMoney(value, currency)
          return (
            <div key={`${entry.dataKey ?? index}`} className="flex items-center justify-between gap-5">
              <span className="flex items-center gap-1.5 text-muted">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: entry.color ?? 'var(--accent)' }}
                />
                {entry.name}
              </span>
              <span className="num text-[11px] text-ink">{formatted}</span>
            </div>
          )
        })}
        {row.returnPct !== undefined && (
          <div className="mt-1 flex items-center justify-between gap-5 border-t border-line-soft pt-1.5">
            <span className="text-faint">Return</span>
            <span className="num text-[10.5px] text-muted">{fmtPct(row.returnPct)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------- Balance area ------------------------------ */

export function BalanceChart({
  points,
  currency,
  height = 280,
  reference,
  className,
}: {
  points: DayPoint[]
  currency: string
  height?: number
  reference?: number
  className?: string
}) {
  const gradientId = useId().replace(/:/g, '')
  const data = points.map((point) => ({
    fullLabel: fmtDate(point.date, 'medium'),
    label: fmtDate(point.date, 'short'),
    balance: point.closing,
    date: point.date,
  }))
  const values = points.map((point) => point.closing)
  const baseline = reference ?? (values.length > 0 ? values[0] : 0)
  const min = Math.min(...values, baseline)
  const max = Math.max(...values, baseline)
  const pad = (max - min || 1) * 0.09

  return (
    <div style={{ height }} className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 2, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.26" />
              <stop offset="72%" stopColor="var(--accent)" stopOpacity="0.05" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--grid)" vertical={false} strokeDasharray="2 6" />
          <XAxis dataKey="label" {...AXIS} minTickGap={52} tickMargin={12} />
          <YAxis
            width={50}
            domain={[min - pad, max + pad]}
            tickFormatter={(value: number) => fmtAxis(value)}
            {...AXIS}
            tickMargin={6}
          />
          <Tooltip
            content={<ChartTip currency={currency} />}
            cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '3 4' }}
          />
          {reference !== undefined && (
            <ReferenceLine
              y={reference}
              stroke="var(--faint)"
              strokeDasharray="3 6"
              strokeOpacity={0.45}
            />
          )}
          <Area
            type="monotone"
            dataKey="balance"
            name="Balance"
            stroke="var(--accent)"
            strokeWidth={1.8}
            fill={`url(#${gradientId})`}
            animationDuration={900}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ------------------------------ Monthly bars ------------------------------- */

export function MonthlyBars({
  data,
  currency,
  height = 220,
}: {
  data: MonthStat[]
  currency: string
  height?: number
}) {
  const chartData = data.map((month) => ({
    fullLabel: month.label,
    label: month.label.split(' ')[0],
    pnl: Number(month.pnl.toFixed(2)),
    returnPct: month.returnPct,
  }))
  const maxAbs = niceCeil(Math.max(...chartData.map((item) => Math.abs(item.pnl)), 1))

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 2, left: 0, bottom: 0 }} barCategoryGap="32%">
          <CartesianGrid stroke="var(--grid)" vertical={false} strokeDasharray="2 6" />
          <XAxis dataKey="label" {...AXIS} tickMargin={12} />
          <YAxis
            width={48}
            domain={[-maxAbs * 1.15, maxAbs * 1.15]}
            tickFormatter={(value: number) => fmtAxis(value)}
            {...AXIS}
          />
          <Tooltip
            content={<ChartTip currency={currency} />}
            cursor={{ fill: 'var(--elevated)', opacity: 0.55 }}
          />
          <ReferenceLine y={0} stroke="var(--border)" />
          <Bar dataKey="pnl" name="Trading P/L" radius={[4, 4, 0, 0]} animationDuration={800}>
            {chartData.map((entry) => (
              <Cell
                key={entry.fullLabel}
                fill={entry.pnl >= 0 ? 'var(--profit)' : 'var(--loss)'}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/* -------------------------------- Drawdown -------------------------------- */

export function DrawdownChart({
  points,
  startBalance,
  height = 170,
}: {
  points: DayPoint[]
  startBalance: number
  height?: number
}) {
  const gradientId = useId().replace(/:/g, '')
  const data = drawdownSeries(points, startBalance).map((point) => ({
    fullLabel: fmtDate(point.date, 'medium'),
    label: fmtDate(point.date, 'short'),
    drawdown: point.drawdown,
  }))
  const min = Math.min(...data.map((point) => point.drawdown), -0.1)

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 2, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--loss)" stopOpacity="0.02" />
              <stop offset="100%" stopColor="var(--loss)" stopOpacity="0.24" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--grid)" vertical={false} strokeDasharray="2 6" />
          <XAxis dataKey="label" {...AXIS} minTickGap={52} tickMargin={10} />
          <YAxis
            width={44}
            domain={[min * 1.05, 0]}
            tickFormatter={(value: number) => `${value.toFixed(0)}%`}
            {...AXIS}
          />
          <Tooltip
            content={<ChartTip currency="USD" percent />}
            cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '3 4' }}
          />
          <Area
            type="monotone"
            dataKey="drawdown"
            name="Drawdown"
            stroke="var(--loss)"
            strokeWidth={1.2}
            fill={`url(#${gradientId})`}
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ------------------------------- Projection -------------------------------- */

export function ProjectionChart({
  series,
  currency,
  compare,
  height = 300,
}: {
  series: ScenarioSeriesPoint[]
  currency: string
  compare: boolean
  height?: number
}) {
  const all = series.flatMap((point) => [point.base, point.best, point.worst])
  const max = Math.max(...all)
  const min = Math.min(...all)
  const pad = (max - min || 1) * 0.08

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series} margin={{ top: 10, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--grid)" vertical={false} strokeDasharray="2 6" />
          <XAxis dataKey="label" {...AXIS} minTickGap={24} tickMargin={12} />
          <YAxis
            width={52}
            domain={[Math.max(0, min - pad), max + pad]}
            tickFormatter={(value: number) => fmtAxis(value)}
            {...AXIS}
          />
          <Tooltip
            content={<ChartTip currency={currency} />}
            cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '3 4' }}
          />
          <Line
            type="monotone"
            dataKey="base"
            name="Base case"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
            animationDuration={900}
          />
          {compare && (
            <Line
              type="monotone"
              dataKey="best"
              name="Best case"
              stroke="var(--profit)"
              strokeWidth={1.3}
              strokeDasharray="4 5"
              dot={false}
              animationDuration={900}
            />
          )}
          {compare && (
            <Line
              type="monotone"
              dataKey="worst"
              name="Worst case"
              stroke="var(--loss)"
              strokeWidth={1.3}
              strokeDasharray="4 5"
              dot={false}
              animationDuration={900}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/* ------------------------------ Distribution ------------------------------- */

export interface DistributionBin {
  label: string
  count: number
  positive: boolean
}

export function DistributionChart({
  data,
  height = 190,
}: {
  data: DistributionBin[]
  height?: number
}) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 2, left: 0, bottom: 0 }} barCategoryGap="18%">
          <CartesianGrid stroke="var(--grid)" vertical={false} strokeDasharray="2 6" />
          <XAxis dataKey="label" {...AXIS} tickMargin={10} interval={0} />
          <YAxis width={24} allowDecimals={false} {...AXIS} hide />
          <Tooltip
            content={<ChartTip currency="" raw />}
            cursor={{ fill: 'var(--elevated)', opacity: 0.55 }}
          />
          <Bar dataKey="count" name="Days" radius={[3, 3, 0, 0]} animationDuration={700}>
            {data.map((bin) => (
              <Cell
                key={bin.label}
                fill={bin.positive ? 'var(--profit)' : 'var(--loss)'}
                fillOpacity={0.75}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
