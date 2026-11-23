import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Download,
  Plus,
  ShieldCheck,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useAppStore } from '../store'
import { useJourney } from '../hooks'
import { slicePoints, drawdownSeries } from '../lib/journey'
import { exportAccountJson } from '../lib/export'
import { fmtMoney, fmtNumber, fmtPct, fmtDate, todayISO, greeting } from '../lib/format'
import {
  cn,
  Badge,
  Button,
  PageHeader,
  Panel,
  PanelHeader,
  Progress,
  Ring,
  Segmented,
  Sparkline,
} from '../components/ui'
import { BalanceChart, MonthlyBars } from '../components/charts'
import type { JournalEntry, MonthStat, Stats, Transaction } from '../types'

type Range = '1M' | '3M' | 'ALL'

function Delta({ value, className }: { value: number; className?: string }) {
  const up = value >= 0
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-[11px]', up ? 'text-profit' : 'text-loss', className)}>
      {up ? <ArrowUpRight size={12} strokeWidth={1.8} /> : <ArrowDownRight size={12} strokeWidth={1.8} />}
      <span className="num">{fmtPct(value)}</span>
    </span>
  )
}

function KpiCard({
  label,
  value,
  sub,
  delta,
  icon,
  spark,
  tone = 'accent',
}: {
  label: string
  value: string
  sub: string
  delta?: number
  icon: ReactNode
  spark: number[]
  tone?: 'accent' | 'profit' | 'loss'
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
          <div className="num text-[22px] font-medium leading-none tracking-[-0.03em] text-ink">{value}</div>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-faint">
            {delta !== undefined && <Delta value={delta} />}
            <span className="truncate">{sub}</span>
          </div>
        </div>
        <Sparkline values={spark} tone={tone} width={76} height={28} className="shrink-0 opacity-90" />
      </div>
    </Panel>
  )
}

function RecentJournal({
  entries,
  currency,
  onOpen,
}: {
  entries: JournalEntry[]
  currency: string
  onOpen: () => void
}) {
  return (
    <Panel innerClassName="flex h-full flex-col p-5">
      <PanelHeader
        title="Recent journal"
        subtitle="Last entries from the actual account"
        right={
          <button
            onClick={onOpen}
            className="flex items-center gap-1 text-[10px] text-muted transition-colors hover:text-ink"
          >
            Open journal <ArrowUpRight size={11} strokeWidth={1.5} />
          </button>
        }
      />
      <div className="mt-4 flex-1 space-y-1">
        {entries.length === 0 && (
          <div className="rounded-xl border border-dashed border-line p-4 text-[11px] text-faint">
            No journal entries yet for this account.
          </div>
        )}
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors duration-200 hover:bg-elevated/50"
          >
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-elevated/40">
              <span className="num text-[11px] font-medium text-ink">{fmtDate(entry.date, 'day')}</span>
              <span className="text-[7px] uppercase tracking-[0.12em] text-faint">
                {fmtDate(entry.date, 'weekday')}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    'h-1 w-1 rounded-full',
                    entry.status === 'Profit'
                      ? 'bg-profit'
                      : entry.status === 'Loss'
                        ? 'bg-loss'
                        : 'bg-faint',
                  )}
                />
                <span className="truncate text-[11px] font-medium text-ink">
                  {entry.status === 'No Trade' ? 'No trading day' : entry.status}
                </span>
                {entry.tags?.[0] && (
                  <span className="rounded border border-line px-1 py-px text-[7.5px] uppercase tracking-[0.1em] text-faint">
                    {entry.tags[0]}
                  </span>
                )}
              </div>
              <div className="mt-0.5 truncate text-[9.5px] text-faint">
                {entry.notes ?? 'No notes for this session'}
              </div>
            </div>
            <span
              className={cn(
                'num shrink-0 text-[11.5px]',
                entry.pnl > 0 ? 'text-profit' : entry.pnl < 0 ? 'text-loss' : 'text-muted',
              )}
            >
              {entry.pnl === 0 ? '—' : fmtMoney(entry.pnl, currency, { signed: true })}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function ActualVsTarget({
  stats,
  accountTarget,
  month,
  monthlyTarget,
  milestone,
  currency,
  onMilestones,
}: {
  stats: Stats
  accountTarget: number
  month: MonthStat | undefined
  monthlyTarget: number
  milestone: { target: number } | undefined
  currency: string
  onMilestones: () => void
}) {
  const dailyProgress = accountTarget > 0 ? (stats.avgDailyReturn / accountTarget) * 100 : 0
  const monthProgress = monthlyTarget > 0 ? ((month?.returnPct ?? 0) / monthlyTarget) * 100 : 0
  const milestoneProgress = milestone ? (stats.currentBalance / milestone.target) * 100 : 100
  const onTrack = monthProgress >= 100

  return (
    <Panel innerClassName="p-5">
      <PanelHeader
        title="Actual vs target"
        subtitle="Comparison against your own plan"
        right={
          <Badge variant={onTrack ? 'profit' : 'loss'} dot>
            {onTrack ? 'Ahead of target' : 'Behind target'}
          </Badge>
        }
      />
      <div className="mt-5 space-y-4">
        <div>
          <div className="mb-1.5 flex items-center justify-between text-[10.5px]">
            <span className="text-muted">Average daily return</span>
            <span className="num text-ink">
              {fmtPct(stats.avgDailyReturn)} <span className="text-faint">/ {accountTarget.toFixed(1)}%</span>
            </span>
          </div>
          <Progress value={Math.max(0, dailyProgress)} tone={dailyProgress >= 100 ? 'profit' : 'accent'} />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between text-[10.5px]">
            <span className="text-muted">This month (TWR)</span>
            <span className="num text-ink">
              {fmtPct(month?.returnPct ?? 0)} <span className="text-faint">/ {fmtPct(monthlyTarget, { signed: false })}</span>
            </span>
          </div>
          <Progress value={Math.max(0, monthProgress)} tone={monthProgress >= 100 ? 'profit' : 'loss'} />
        </div>
        <button onClick={onMilestones} className="block w-full text-left">
          <div className="mb-1.5 flex items-center justify-between text-[10.5px]">
            <span className="flex items-center gap-1.5 text-muted">
              <Target size={11} strokeWidth={1.5} className="text-faint" />
              Next milestone
            </span>
            <span className="num text-ink">
              {milestone ? fmtNumber(stats.currentBalance, 0) : 'All reached'}
              <span className="text-faint">
                {milestone ? ` / ${fmtMoney(milestone.target, currency)}` : ''}
              </span>
            </span>
          </div>
          <Progress value={Math.max(0, Math.min(100, milestoneProgress))} tone="accent" />
        </button>
      </div>
      <div className="mt-5 flex items-center gap-2 border-t border-line-soft pt-3 text-[9.5px] text-faint">
        <ShieldCheck size={12} strokeWidth={1.5} className="text-accent" />
        Status compares actual results to your target — never a prediction.
      </div>
    </Panel>
  )
}

function RecentTransactions({
  transactions,
  currency,
  onOpen,
}: {
  transactions: Transaction[]
  currency: string
  onOpen: () => void
}) {
  const labels: Record<Transaction['type'], string> = {
    INITIAL_CAPITAL: 'Initial',
    TRADING_PROFIT: 'Profit',
    TRADING_LOSS: 'Loss',
    DEPOSIT: 'Deposit',
    WITHDRAWAL: 'Withdrawal',
    ADJUSTMENT: 'Adjustment',
    REVERSAL: 'Reversal',
  }

  return (
    <Panel innerClassName="flex h-full flex-col p-5">
      <PanelHeader
        title="Recent transactions"
        subtitle="Ledger movements, latest first"
        right={
          <button
            onClick={onOpen}
            className="flex items-center gap-1 text-[10px] text-muted transition-colors hover:text-ink"
          >
            Ledger <ArrowUpRight size={11} strokeWidth={1.5} />
          </button>
        }
      />
      <div className="mt-4 flex-1">
        {transactions.slice(0, 5).map((transaction) => {
          const positive = transaction.type === 'TRADING_PROFIT' || transaction.type === 'DEPOSIT'
          const negative = transaction.type === 'TRADING_LOSS' || transaction.type === 'WITHDRAWAL'
          return (
            <div
              key={transaction.id}
              className="flex items-center gap-3 border-b border-line-soft py-2.5 last:border-0"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'rounded border px-1 py-px text-[7.5px] font-medium uppercase tracking-[0.1em]',
                      positive
                        ? 'border-profit/20 bg-profit/10 text-profit'
                        : negative
                          ? 'border-loss/20 bg-loss/10 text-loss'
                          : 'border-line bg-elevated text-muted',
                    )}
                  >
                    {labels[transaction.type]}
                  </span>
                  <span className="truncate text-[10px] text-muted">{transaction.description}</span>
                </div>
                <div className="mt-1 text-[9px] text-faint">{fmtDate(transaction.date, 'medium')}</div>
              </div>
              <div className="shrink-0 text-right">
                <div
                  className={cn(
                    'num text-[10.5px]',
                    positive ? 'text-profit' : negative ? 'text-loss' : 'text-muted',
                  )}
                >
                  {fmtMoney(negative ? -transaction.amount : transaction.amount, currency, {
                    signed: positive,
                  })}
                </div>
                <div className="mt-0.5 text-[8.5px] text-faint">
                  {fmtMoney(transaction.balanceAfter, currency, { decimals: 0 })}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}

export default function Overview() {
  const navigate = useNavigate()
  const { account, journey } = useJourney()
  const [range, setRange] = useState<Range>('ALL')
  const pushToast = useAppStore((state) => state.pushToast)
  const allJournals = useAppStore((state) => state.journals)
  const cashEvents = useAppStore((state) => state.cashEvents)
  const milestones = useAppStore((state) => state.milestones)

  const { stats, points: allPoints, monthly, transactions } = journey
  const days: 30 | 90 | 'all' = range === '1M' ? 30 : range === '3M' ? 90 : 'all'
  const visible = useMemo(() => slicePoints(allPoints, days), [allPoints, days])

  const journalEntries = (allJournals[account.id] ?? []).slice().sort((a, b) => b.date.localeCompare(a.date))
  const latestTrading = stats
  const monthlyTarget = (Math.pow(1 + account.dailyTarget / 100, 20) - 1) * 100
  const currentMonth = monthly[monthly.length - 1]
  const nextMilestone = milestones
    .filter((milestone) => milestone.accountId === account.id && milestone.target > stats.currentBalance)
    .sort((a, b) => a.target - b.target)[0]

  const equitySpark = visible.slice(-30).map((point) => point.closing)
  const returnSpark = allPoints
    .filter((point) => point.hasEntry && point.status !== 'No Trade')
    .slice(-30)
    .map((point) => point.returnPct)
  const drawdownSpark = drawdownSeries(visible, account.initialBalance)
    .slice(-30)
    .map((point) => point.drawdown)
  const winRateSpark = allPoints
    .filter((point) => point.hasEntry && point.status !== 'No Trade')
    .slice(-20)
    .map((point) => (point.pnl > 0 ? 1 : point.pnl < 0 ? -1 : 0))

  const deltaSinceStart = stats.totalReturn

  const handleExport = () => {
    exportAccountJson(
      account,
      allJournals[account.id] ?? [],
      cashEvents.filter((event) => event.accountId === account.id),
      transactions,
    )
    pushToast({
      title: 'Export ready',
      message: `${account.name} · JSON ledger downloaded`,
      tone: 'success',
    })
  }

  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader
        eyebrow={`Actual journey · ${fmtDate(todayISO(), 'long')}`}
        title={`${greeting()}, Billy.`}
        description="This is what actually happened. Every figure on this page is calculated from the Journey ledger — simulations never write here."
        meta={
          <div className="ml-1 flex items-center gap-1.5">
            <Badge variant="outline">{account.broker}</Badge>
            <Badge variant="neutral">{account.type}</Badge>
            <Badge variant="accent">{account.currency}</Badge>
          </div>
        }
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              className="hidden sm:inline-flex"
              icon={<Download size={14} strokeWidth={1.5} />}
              onClick={handleExport}
            >

              Export
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={14} strokeWidth={1.8} />}
              onClick={() => navigate('/journal')}
            >
              Log today
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-12 gap-3 lg:gap-4">
        <Panel
          className="col-span-12 xl:col-span-8"
          innerClassName="relative overflow-hidden p-4 sm:p-5 lg:p-6"
        >
          <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-accent/[0.06] blur-3xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="eyebrow">Current balance</span>
                <Badge variant="outline">Actual</Badge>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="num text-[36px] font-medium leading-none tracking-[-0.04em] text-ink sm:text-[44px]">
                  {fmtNumber(stats.currentBalance, 2)}
                </span>
                <span className="text-[12px] font-medium text-muted">{account.currency}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10.5px]">
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2 py-0.5',
                    deltaSinceStart >= 0
                      ? 'border-profit/20 bg-profit/10 text-profit'
                      : 'border-loss/20 bg-loss/10 text-loss',
                  )}
                >
                  {deltaSinceStart >= 0 ? (
                    <ArrowUpRight size={11} strokeWidth={1.8} />
                  ) : (
                    <ArrowDownRight size={11} strokeWidth={1.8} />
                  )}
                  <span className="num">{fmtPct(deltaSinceStart)}</span>
                </span>
                <span className="text-faint">all time</span>
                <span className="text-line">·</span>
                <span className="num text-muted">{fmtMoney(stats.netPnl, account.currency, { signed: true })}</span>
                <span className="text-faint">net trading P/L</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[9.5px] text-faint">
                <span>Started {fmtDate(account.startDate, 'medium')}</span>
                <span>·</span>
                <span>{stats.tradingDays} trading days</span>
                <span>·</span>
                <span>Target {account.dailyTarget.toFixed(1)}% / day</span>
              </div>
            </div>
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
          </div>

          <div className="relative mt-5">
            <BalanceChart
              points={visible}
              currency={account.currency}
              reference={account.initialBalance}
              height={232}
            />
          </div>

          <div className="relative mt-4 grid grid-cols-2 gap-3 border-t border-line-soft pt-3 sm:grid-cols-4">
            {[
              { label: 'Initial balance', value: fmtMoney(account.initialBalance, account.currency) },
              { label: 'Deposits', value: fmtMoney(stats.totalDeposits, account.currency) },
              { label: 'Withdrawals', value: fmtMoney(stats.totalWithdrawals, account.currency) },
              { label: 'Trading days', value: `${stats.tradingDays}` },
            ].map((item) => (
              <div key={item.label}>
                <div className="text-[8.5px] uppercase tracking-[0.14em] text-faint">{item.label}</div>
                <div className="num mt-1 text-[11.5px] text-ink">{item.value}</div>
              </div>
            ))}
          </div>
        </Panel>

        <div className="col-span-12 grid gap-3 sm:grid-cols-2 xl:col-span-4 xl:grid-cols-1 xl:gap-4">
          <Panel innerClassName="p-5">
            <PanelHeader
              title="Daily target"
              subtitle="Average return vs your daily goal"
              right={
                <Badge variant={latestTrading.avgDailyReturn >= account.dailyTarget ? 'profit' : 'neutral'}>
                  {latestTrading.avgDailyReturn >= account.dailyTarget ? 'On target' : 'Below'}
                </Badge>
              }
            />
            <div className="mt-4 flex items-center gap-4">
              <Ring
                value={account.dailyTarget > 0 ? (latestTrading.avgDailyReturn / account.dailyTarget) * 100 : 0}
                size={104}
                stroke={8}
                tone={latestTrading.avgDailyReturn >= account.dailyTarget ? 'profit' : 'accent'}
              >
                <div className="text-center">
                  <div className="num text-[18px] font-medium leading-none text-ink">
                    {fmtPct(latestTrading.avgDailyReturn)}
                  </div>
                  <div className="mt-1 text-[7.5px] uppercase tracking-[0.14em] text-faint">average</div>
                </div>
              </Ring>
              <div className="flex-1 space-y-2.5">
                {[
                  { label: 'Target', value: `${account.dailyTarget.toFixed(1)}% / day`, tone: 'text-ink' },
                  {
                    label: 'Best day',
                    value: latestTrading.bestDay ? fmtPct(latestTrading.bestDay.returnPct) : '—',
                    tone: 'text-profit',
                  },
                  {
                    label: 'Worst day',
                    value: latestTrading.worstDay ? fmtPct(latestTrading.worstDay.returnPct) : '—',
                    tone: 'text-loss',
                  },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-3 text-[10px]">
                    <span className="text-faint">{row.label}</span>
                    <span className={cn('num', row.tone)}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel innerClassName="p-5">
            <PanelHeader
              title="This month"
              subtitle={currentMonth?.label ?? 'No trading data'}
              right={<Badge variant="outline">{currentMonth?.tradingDays ?? 0} sessions</Badge>}
            />
            <div className="mt-3 flex items-end justify-between gap-3">
              <div>
                <div
                  className={cn(
                    'num text-[22px] font-medium leading-none',
                    (currentMonth?.pnl ?? 0) >= 0 ? 'text-ink' : 'text-loss',
                  )}
                >
                  {fmtMoney(currentMonth?.pnl ?? 0, account.currency, { signed: true })}
                </div>
                <div className="mt-1.5 text-[9.5px] text-faint">Net trading P/L</div>
              </div>
              <div className="text-right">
                <div
                  className={cn(
                    'num text-[12px]',
                    (currentMonth?.returnPct ?? 0) >= 0 ? 'text-profit' : 'text-loss',
                  )}
                >
                  {fmtPct(currentMonth?.returnPct ?? 0)}
                </div>
                <div className="text-[9px] text-faint">time-weighted</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between text-[9.5px]">
                <span className="text-faint">Monthly target</span>
                <span className="num text-muted">{fmtPct(monthlyTarget, { signed: false })}</span>
              </div>
              <Progress
                value={Math.max(0, ((currentMonth?.returnPct ?? 0) / monthlyTarget) * 100)}
                tone={(currentMonth?.returnPct ?? 0) >= 0 ? 'accent' : 'loss'}
              />
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[9px] text-faint">
              <TrendingUp size={11} strokeWidth={1.5} className="text-accent" />
              Deposits and withdrawals excluded from return
            </div>
          </Panel>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <KpiCard
          label="Total return"
          value={fmtPct(stats.totalReturn)}
          sub="since inception"
          icon={<TrendingUp size={13} strokeWidth={1.5} />}
          spark={equitySpark}
          tone={stats.totalReturn >= 0 ? 'profit' : 'loss'}
        />
        <KpiCard
          label="Win rate"
          value={`${stats.winRate.toFixed(1)}%`}
          sub={`${stats.winningDays}W · ${stats.losingDays}L · ${stats.breakevenDays}BE`}
          icon={<BadgeCheck size={13} strokeWidth={1.5} />}
          spark={winRateSpark}
          tone="profit"
        />
        <KpiCard
          label="Avg daily return"
          value={fmtPct(stats.avgDailyReturn)}
          sub={`target ${account.dailyTarget.toFixed(1)}% / day`}
          icon={<Target size={13} strokeWidth={1.5} />}
          spark={returnSpark}
          tone="accent"
        />
        <KpiCard
          label="Max drawdown"
          value={`−${stats.maxDrawdown.toFixed(2)}%`}
          sub="balance drawdown"
          icon={<ArrowDownRight size={13} strokeWidth={1.5} />}
          spark={drawdownSpark}
          tone="loss"
        />
      </div>

      <div className="grid grid-cols-12 gap-3 lg:gap-4">
        <Panel className="col-span-12 xl:col-span-7" innerClassName="p-5">
          <PanelHeader
            title="Monthly performance"
            subtitle="Net trading P/L · external cash excluded"
            right={
              <div className="flex items-center gap-3 text-[9px] text-faint">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-profit" /> Profit
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-loss" /> Loss
                </span>
              </div>
            }
          />
          <div className="mt-4">
            <MonthlyBars data={monthly} currency={account.currency} height={208} />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-3 text-[9.5px] text-faint">
            <span>
              {monthly.length} months tracked · {allPoints.length} ledger days
            </span>
            <button
              onClick={() => navigate('/analytics')}
              className="flex items-center gap-1 text-muted transition-colors hover:text-ink"
            >
              Full analytics <ArrowRight size={11} strokeWidth={1.5} />
            </button>
          </div>
        </Panel>

        <div className="col-span-12 xl:col-span-5">
          <RecentJournal
            entries={journalEntries.slice(0, 5)}
            currency={account.currency}
            onOpen={() => navigate('/journal')}
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3 lg:gap-4">
        <Panel className="col-span-12 xl:col-span-7" innerClassName="p-5">
          <ActualVsTarget
            stats={stats}
            accountTarget={account.dailyTarget}
            month={currentMonth}
            monthlyTarget={monthlyTarget}
            milestone={nextMilestone ? { target: nextMilestone.target } : undefined}
            currency={account.currency}
            onMilestones={() => navigate('/milestones')}
          />
        </Panel>
        <div className="col-span-12 xl:col-span-5">
          <RecentTransactions
            transactions={transactions}
            currency={account.currency}
            onOpen={() => navigate('/journey')}
          />
        </div>
      </div>

      <div className="flex flex-col items-start justify-between gap-2 rounded-xl border border-line-soft px-4 py-3 text-[9.5px] text-faint sm:flex-row sm:items-center">
        <span className="flex items-center gap-1.5">
          <ShieldCheck size={12} strokeWidth={1.5} className="text-accent" />
          Actual Journey only. Simulations are labelled and stored separately.
        </span>
        <span className="flex items-center gap-1.5">
          <Wallet size={11} strokeWidth={1.5} />
          {account.broker} · {account.accountNumber}
        </span>
      </div>
    </div>
  )
}
