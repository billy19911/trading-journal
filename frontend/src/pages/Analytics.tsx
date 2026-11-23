import { useMemo, useState, type ReactNode } from 'react'
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Download,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { useAppStore } from '../store'
import { useJourney } from '../hooks'
import { analyze, monthlyStats, slicePoints } from '../lib/journey'
import { exportJournalsCsv } from '../lib/export'
import { fmtDate, fmtMoney, fmtNumber, fmtPct } from '../lib/format'
import {
  cn,
  Badge,
  Button,
  PageHeader,
  Panel,
  PanelHeader,
  Progress,
  Segmented,
  Sparkline,
} from '../components/ui'
import { BalanceChart, DistributionChart, DrawdownChart, MonthlyBars } from '../components/charts'
import type { DistributionBin } from '../components/charts'

type Range = '1M' | '3M' | 'ALL'

function MetricCard({
  label,
  value,
  sub,
  tone,
  spark,
  icon,
}: {
  label: string
  value: string
  sub: string
  tone: 'profit' | 'loss' | 'accent' | 'neutral'
  spark?: number[]
  icon: ReactNode
}) {
  return (
    <Panel innerClassName="p-4">
      <div className="flex items-start justify-between">
        <span className="eyebrow">{label}</span>
        <span className="grid h-6 w-6 place-items-center rounded-lg border border-line bg-elevated/50 text-faint">
          {icon}
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <div
            className={cn(
              'num text-[22px] font-medium leading-none tracking-[-0.03em]',
              tone === 'profit'
                ? 'text-profit'
                : tone === 'loss'
                  ? 'text-loss'
                  : tone === 'accent'
                    ? 'text-ink'
                    : 'text-ink',
            )}
          >
            {value}
          </div>
          <div className="mt-2 truncate text-[9.5px] text-faint">{sub}</div>
        </div>
        {spark && (
          <Sparkline
            values={spark}
            tone={tone === 'loss' ? 'loss' : tone === 'profit' ? 'profit' : 'accent'}
            width={70}
            height={26}
            className="shrink-0 opacity-90"
          />
        )}
      </div>
    </Panel>
  )
}

function SessionStats({
  stats,
  currency,
}: {
  stats: ReturnType<typeof analyze>
  currency: string
}) {
  const total = Math.max(stats.tradingDays, 1)
  const winShare = (stats.winningDays / total) * 100
  const lossShare = (stats.losingDays / total) * 100
  const flatShare = Math.max(0, 100 - winShare - lossShare)

  return (
    <Panel innerClassName="flex h-full flex-col p-5">
      <PanelHeader
        title="Session statistics"
        subtitle="Win/loss distribution and extremes"
        right={<Badge variant="outline">{stats.tradingDays} days</Badge>}
      />

      <div className="mt-4">
        <div className="flex h-1.5 overflow-hidden rounded-full bg-elevated">
          <div className="bg-profit" style={{ width: `${winShare}%` }} />
          <div className="bg-loss" style={{ width: `${lossShare}%` }} />
          <div className="bg-faint/50" style={{ width: `${flatShare}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-[8.5px] text-faint">
          <span className="flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-profit" /> {stats.winningDays} wins
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-loss" /> {stats.losingDays} losses
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-faint" /> {stats.breakevenDays} flat
          </span>
        </div>
      </div>

      <div className="mt-4 grid flex-1 grid-cols-2 gap-x-4">
        {[
          { label: 'Avg win', value: fmtMoney(stats.avgWin, currency), tone: 'text-profit' },
          { label: 'Avg loss', value: fmtMoney(stats.avgLoss, currency), tone: 'text-loss' },
          {
            label: 'Best day',
            value: stats.bestDay
              ? `${fmtMoney(stats.bestDay.pnl, currency, { signed: true })}`
              : '—',
            tone: 'text-profit',
            sub: stats.bestDay ? `${fmtDate(stats.bestDay.date, 'short')} · ${fmtPct(stats.bestDay.returnPct)}` : '',
          },
          {
            label: 'Worst day',
            value: stats.worstDay
              ? `${fmtMoney(stats.worstDay.pnl, currency, { signed: true })}`
              : '—',
            tone: 'text-loss',
            sub: stats.worstDay ? `${fmtDate(stats.worstDay.date, 'short')} · ${fmtPct(stats.worstDay.returnPct)}` : '',
          },
          {
            label: 'Current streak',
            value:
              stats.currentStreak.count === 0
                ? '—'
                : `${stats.currentStreak.count} ${stats.currentStreak.type}`,
            tone: stats.currentStreak.type === 'loss' ? 'text-loss' : 'text-ink',
          },
          {
            label: 'Profit factor',
            value: stats.profitFactor >= 99 ? '∞' : stats.profitFactor.toFixed(2),
            tone: 'text-ink',
          },
        ].map((item) => (
          <div key={item.label} className="border-b border-line-soft py-2.5 last:border-0">
            <div className="text-[8px] uppercase tracking-[0.14em] text-faint">{item.label}</div>
            <div className={cn('num mt-1 text-[11px]', item.tone)}>{item.value}</div>
            {item.sub && <div className="mt-0.5 text-[8.5px] text-faint">{item.sub}</div>}
          </div>
        ))}
      </div>
    </Panel>
  )
}

export default function Analytics() {
  const { account, journey } = useJourney()
  const journals = useAppStore((state) => state.journals)
  const pushToast = useAppStore((state) => state.pushToast)
  const [range, setRange] = useState<Range>('ALL')

  const points = useMemo(
    () => slicePoints(journey.points, range === '1M' ? 30 : range === '3M' ? 90 : 'all'),
    [journey.points, range],
  )
  const startBalance = points[0]?.opening ?? account.initialBalance
  const stats = useMemo(() => analyze(points, startBalance), [points, startBalance])
  const monthly = useMemo(() => monthlyStats(points), [points])

  const trading = points.filter((point) => point.hasEntry && point.status !== 'No Trade')
  const returns = trading.map((point) => point.returnPct)
  const equity = points.map((point) => point.closing)
  const winSpark = trading.map((point) => (point.pnl > 0 ? 1 : point.pnl < 0 ? -1 : 0)).slice(-30)

  const distribution: DistributionBin[] = [
    { label: '<−2', count: returns.filter((value) => value < -2).length, positive: false },
    { label: '−2–−1', count: returns.filter((value) => value >= -2 && value < -1).length, positive: false },
    { label: '−1–0', count: returns.filter((value) => value >= -1 && value < 0).length, positive: false },
    { label: '0–1', count: returns.filter((value) => value >= 0 && value < 1).length, positive: true },
    { label: '1–2', count: returns.filter((value) => value >= 1 && value < 2).length, positive: true },
    { label: '≥2', count: returns.filter((value) => value >= 2).length, positive: true },
  ]

  const monthlyTarget = (Math.pow(1 + account.dailyTarget / 100, 20) - 1) * 100
  const currentMonth = monthly[monthly.length - 1]
  const targetPathBalance = startBalance * Math.pow(1 + account.dailyTarget / 100, Math.max(stats.tradingDays, 1))
  const pathProgress = targetPathBalance > 0 ? (stats.currentBalance / targetPathBalance) * 100 : 0
  const dailyProgress = account.dailyTarget > 0 ? (stats.avgDailyReturn / account.dailyTarget) * 100 : 0
  const monthProgress = monthlyTarget > 0 ? ((currentMonth?.returnPct ?? 0) / monthlyTarget) * 100 : 0
  const onTrack = dailyProgress >= 100 && monthProgress >= 90

  const bestMonth = monthly.reduce<typeof monthly[number] | null>(
    (best, month) => (!best || month.returnPct > best.returnPct ? month : best),
    null,
  )
  const worstMonth = monthly.reduce<typeof monthly[number] | null>(
    (worst, month) => (!worst || month.returnPct < worst.returnPct ? month : worst),
    null,
  )

  const handleExport = () => {
    exportJournalsCsv(account, journals[account.id] ?? [])
    pushToast({
      title: 'Analytics export ready',
      message: `${account.name} journal data downloaded as CSV`,
      tone: 'success',
    })
  }

  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader
        eyebrow="Intelligence · actual data"
        title="Analytics"
        description="A factual read on performance: returns, win rate, drawdown and consistency. External cash is excluded from trading results."
        meta={
          <div className="ml-1 flex items-center gap-1.5">
            <Badge variant="outline">Actual</Badge>
            <Badge variant="neutral">{range === 'ALL' ? 'All time' : range}</Badge>
          </div>
        }
        actions={
          <>
            <Segmented
              value={range}
              onChange={setRange}
              size="sm"
              options={[
                { value: '1M', label: '1M' },
                { value: '3M', label: '3M' },
                { value: 'ALL', label: 'All' },
              ]}
            />
            <Button
              variant="secondary"
              size="sm"
              icon={<Download size={14} strokeWidth={1.5} />}
              onClick={handleExport}
            >
              Export
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <MetricCard
          label="Total return"
          value={fmtPct(stats.totalReturn)}
          sub="net trading P/L / start balance"
          tone={stats.totalReturn >= 0 ? 'profit' : 'loss'}
          spark={equity.slice(-30)}
          icon={<TrendingUp size={13} strokeWidth={1.5} />}
        />
        <MetricCard
          label="Avg daily return"
          value={fmtPct(stats.avgDailyReturn)}
          sub={`target ${account.dailyTarget.toFixed(1)}% per day`}
          tone={stats.avgDailyReturn >= account.dailyTarget ? 'profit' : 'accent'}
          spark={returns.slice(-30)}
          icon={<Activity size={13} strokeWidth={1.5} />}
        />
        <MetricCard
          label="Win rate"
          value={`${stats.winRate.toFixed(1)}%`}
          sub={`${stats.winningDays}W · ${stats.losingDays}L · ${stats.breakevenDays}BE`}
          tone="profit"
          spark={winSpark}
          icon={<Target size={13} strokeWidth={1.5} />}
        />
        <MetricCard
          label="Max drawdown"
          value={`−${stats.maxDrawdown.toFixed(2)}%`}
          sub="balance basis · peak to trough"
          tone="loss"
          icon={<ArrowDownRight size={13} strokeWidth={1.5} />}
        />
      </div>

      <div className="grid grid-cols-12 gap-3 lg:gap-4">
        <Panel className="col-span-12 xl:col-span-8" innerClassName="p-5">
          <PanelHeader
            title="Equity curve"
            subtitle="Closing balance · external cash excluded from returns"
            right={
              <div className="flex items-center gap-2">
                <Badge variant="outline">{points.length} ledger days</Badge>
                <Badge variant="accent">{account.currency}</Badge>
              </div>
            }
          />
          <div className="mt-4">
            <BalanceChart
              points={points}
              currency={account.currency}
              reference={startBalance}
              height={260}
            />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3 border-t border-line-soft pt-3">
            <div>
              <div className="text-[8.5px] uppercase tracking-[0.14em] text-faint">Start balance</div>
              <div className="num mt-1 text-[10.5px] text-muted">{fmtMoney(startBalance, account.currency, { decimals: 0 })}</div>
            </div>
            <div>
              <div className="text-[8.5px] uppercase tracking-[0.14em] text-faint">Current</div>
              <div className="num mt-1 text-[10.5px] text-ink">{fmtMoney(stats.currentBalance, account.currency, { decimals: 0 })}</div>
            </div>
            <div>
              <div className="text-[8.5px] uppercase tracking-[0.14em] text-faint">Net P/L</div>
              <div className={cn('num mt-1 text-[10.5px]', stats.netPnl >= 0 ? 'text-profit' : 'text-loss')}>
                {fmtMoney(stats.netPnl, account.currency, { signed: true, decimals: 0 })}
              </div>
            </div>
          </div>
        </Panel>

        <Panel className="col-span-12 xl:col-span-4" innerClassName="flex h-full flex-col p-5">
          <PanelHeader
            title="Return distribution"
            subtitle="Trading days grouped by daily return"
            right={<Badge variant="outline">{trading.length}</Badge>}
          />
          <div className="mt-3 flex-1">
            <DistributionChart data={distribution} height={196} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-line-soft pt-3">
            <div>
              <div className="text-[8.5px] uppercase tracking-[0.14em] text-faint">Avg win</div>
              <div className="num mt-1 text-[10.5px] text-profit">{fmtMoney(stats.avgWin, account.currency)}</div>
            </div>
            <div>
              <div className="text-[8.5px] uppercase tracking-[0.14em] text-faint">Avg loss</div>
              <div className="num mt-1 text-[10.5px] text-loss">{fmtMoney(stats.avgLoss, account.currency)}</div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-12 gap-3 lg:gap-4">
        <Panel className="col-span-12 xl:col-span-7" innerClassName="p-5">
          <PanelHeader
            title="Drawdown"
            subtitle="Peak-to-trough decline of the closing balance"
            right={<Badge variant="loss">−{stats.maxDrawdown.toFixed(2)}% max</Badge>}
          />
          <div className="mt-3">
            <DrawdownChart points={points} startBalance={startBalance} height={190} />
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-line-soft pt-3 text-[9px] text-faint">
            <span>Uses balance, not equity — labelled accordingly.</span>
            <span className="flex items-center gap-1">
              <ArrowDownRight size={10} strokeWidth={1.5} />
              Lower is worse
            </span>
          </div>
        </Panel>

        <Panel className="col-span-12 xl:col-span-5" innerClassName="flex h-full flex-col p-5">
          <PanelHeader
            title="Monthly performance"
            subtitle="Trading P/L and time-weighted return"
            right={<Badge variant="outline">{monthly.length} months</Badge>}
          />
          <div className="mt-3 flex-1">
            <MonthlyBars data={monthly} currency={account.currency} height={190} />
          </div>
          <div className="mt-3 space-y-1.5 border-t border-line-soft pt-3 text-[9.5px]">
            <div className="flex items-center justify-between">
              <span className="text-faint">Best month</span>
              <span className="num text-profit">
                {bestMonth ? `${bestMonth.label} · ${fmtPct(bestMonth.returnPct)}` : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-faint">Worst month</span>
              <span className="num text-loss">
                {worstMonth ? `${worstMonth.label} · ${fmtPct(worstMonth.returnPct)}` : '—'}
              </span>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-12 gap-3 lg:gap-4">
        <div className="col-span-12 xl:col-span-5">
          <SessionStats stats={stats} currency={account.currency} />
        </div>

        <Panel className="col-span-12 xl:col-span-7" innerClassName="p-5">
          <PanelHeader
            title="Actual vs target"
            subtitle="Your plan compared with the realised record"
            right={
              <Badge variant={onTrack ? 'profit' : 'loss'} dot>
                {onTrack ? 'Ahead of target' : 'Behind target'}
              </Badge>
            }
          />
          <div className="mt-5 space-y-5">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[10.5px]">
                <span className="text-muted">Average daily return</span>
                <span className="num text-ink">
                  {fmtPct(stats.avgDailyReturn)} <span className="text-faint">/ {account.dailyTarget.toFixed(1)}%</span>
                </span>
              </div>
              <Progress value={Math.max(0, dailyProgress)} tone={dailyProgress >= 100 ? 'profit' : 'accent'} />
              <div className="mt-1 text-[8.5px] text-faint">
                {dailyProgress >= 100 ? 'Ahead of your daily target' : `${(100 - dailyProgress).toFixed(0)}% below the daily target pace`}
              </div>
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[10.5px]">
                <span className="text-muted">Current month · TWR</span>
                <span className="num text-ink">
                  {fmtPct(currentMonth?.returnPct ?? 0)}{' '}
                  <span className="text-faint">/ {fmtPct(monthlyTarget, { signed: false })}</span>
                </span>
              </div>
              <Progress value={Math.max(0, monthProgress)} tone={monthProgress >= 100 ? 'profit' : 'loss'} />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[10.5px]">
                <span className="text-muted">Balance vs target path</span>
                <span className="num text-ink">
                  {fmtNumber(stats.currentBalance, 0)}{' '}
                  <span className="text-faint">/ {fmtMoney(targetPathBalance, account.currency, { decimals: 0 })}</span>
                </span>
              </div>
              <Progress value={Math.max(0, Math.min(100, pathProgress))} tone={pathProgress >= 95 ? 'profit' : 'loss'} />
              <div className="mt-1 text-[8.5px] text-faint">
                Target path compounds {account.dailyTarget.toFixed(1)}% over {stats.tradingDays} trading days.
              </div>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-2 border-t border-line-soft pt-3 text-[9px] text-faint">
            <TrendingUp size={11} strokeWidth={1.5} className="text-accent" />
            Status is a comparison to your own targets — not a forecast.
          </div>
        </Panel>
      </div>

      <Panel innerClassName="p-5">
        <PanelHeader
          title="Monthly breakdown"
          subtitle="Returns are time-weighted; cash movements are shown separately"
          right={<Badge variant="outline">{monthly.length} periods</Badge>}
        />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="border-b border-line-soft">
                {['Month', 'Opening', 'Closing', 'P/L', 'TWR', 'Deposits', 'Withdrawals', 'Max DD', 'W / L'].map(
                  (header) => (
                    <th
                      key={header}
                      className={cn(
                        'pb-2 pr-3 text-[8px] font-medium uppercase tracking-[0.14em] text-faint last:pr-0',
                        header !== 'Month' && 'text-right',
                      )}
                    >
                      {header}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {monthly.map((month) => (
                <tr key={month.key} className="transition-colors hover:bg-elevated/30">
                  <td className="py-2.5 pr-3 text-[10px] text-muted">{month.label}</td>
                  <td className="num py-2.5 pr-3 text-right text-[10px] text-muted">
                    {fmtMoney(month.opening, account.currency, { decimals: 0 })}
                  </td>
                  <td className="num py-2.5 pr-3 text-right text-[10px] text-ink">
                    {fmtMoney(month.closing, account.currency, { decimals: 0 })}
                  </td>
                  <td
                    className={cn(
                      'num py-2.5 pr-3 text-right text-[10px]',
                      month.pnl >= 0 ? 'text-profit' : 'text-loss',
                    )}
                  >
                    {fmtMoney(month.pnl, account.currency, { signed: true, decimals: 0 })}
                  </td>
                  <td
                    className={cn(
                      'num py-2.5 pr-3 text-right text-[10px]',
                      month.returnPct >= 0 ? 'text-profit' : 'text-loss',
                    )}
                  >
                    {fmtPct(month.returnPct)}
                  </td>
                  <td className="num py-2.5 pr-3 text-right text-[10px] text-muted">
                    {month.deposits > 0 ? fmtMoney(month.deposits, account.currency, { decimals: 0 }) : '—'}
                  </td>
                  <td className="num py-2.5 pr-3 text-right text-[10px] text-muted">
                    {month.withdrawals > 0 ? fmtMoney(month.withdrawals, account.currency, { decimals: 0 }) : '—'}
                  </td>
                  <td className="num py-2.5 pr-3 text-right text-[10px] text-muted">
                    {month.maxDrawdown.toFixed(1)}%
                  </td>
                  <td className="num py-2.5 text-right text-[10px] text-muted">
                    {month.wins} / {month.losses}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-line-soft pt-3 text-[9px] text-faint">
          <span className="flex items-center gap-1.5">
            <TrendingDown size={10} strokeWidth={1.5} />
            Drawdown uses closing balance, not equity.
          </span>
          <span>{stats.tradingDays} trading days · {stats.winningDays} wins · {stats.losingDays} losses</span>
        </div>
      </Panel>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[9.5px] text-faint">
        <span className="flex items-center gap-1.5">
          <ArrowUpRight size={11} strokeWidth={1.5} />
          Return excludes deposits and withdrawals. Time-weighted where applicable.
        </span>
        <span>
          {account.broker} · {account.type} · {account.currency}
        </span>
      </div>
    </div>
  )
}
