import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
} from 'lucide-react'
import { useAppStore } from '../store'
import { useJourney } from '../hooks'
import { exportJournalsCsv } from '../lib/export'
import {
  fmtCompact,
  fmtDate,
  fmtMoney,
  fmtNumber,
  fmtPct,
  monthKey,
  monthLabel,
  todayISO,
} from '../lib/format'
import {
  cn,
  Badge,
  Button,
  Field,
  InfoNote,
  Input,
  Modal,
  PageHeader,
  Panel,
  PanelHeader,
  Segmented,
  Select,
  StatusDot,
  Textarea,
} from '../components/ui'
import { BalanceChart } from '../components/charts'
import type { DayPoint, Transaction } from '../types'

type LedgerFilter = 'all' | 'trades' | 'cash'

function txLabel(type: Transaction['type']): string {
  switch (type) {
    case 'INITIAL_CAPITAL':
      return 'Initial'
    case 'TRADING_PROFIT':
      return 'Profit'
    case 'TRADING_LOSS':
      return 'Loss'
    case 'DEPOSIT':
      return 'Deposit'
    case 'WITHDRAWAL':
      return 'Withdrawal'
    case 'ADJUSTMENT':
      return 'Adjustment'
    default:
      return 'Reversal'
  }
}

function txTone(type: Transaction['type']): 'profit' | 'loss' | 'neutral' {
  if (type === 'TRADING_PROFIT' || type === 'DEPOSIT') return 'profit'
  if (type === 'TRADING_LOSS' || type === 'WITHDRAWAL') return 'loss'
  return 'neutral'
}

function WeekdayHeader() {
  return (
    <div className="mb-1 grid grid-cols-7 gap-1">
      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
        <div
          key={`${day}-${index}`}
          className="text-center text-[8px] font-medium uppercase tracking-[0.12em] text-faint"
        >
          {day}
        </div>
      ))}
    </div>
  )
}

function DayDetail({
  date,
  point,
  currency,
  onOpenJournal,
}: {
  date: string
  point: DayPoint | undefined
  currency: string
  onOpenJournal: () => void
}) {
  const statusTone =
    point?.status === 'Profit' ? 'profit' : point?.status === 'Loss' ? 'loss' : 'neutral'

  return (
    <Panel innerClassName="flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="eyebrow">Selected day</div>
          <div className="mt-1 text-[16px] font-medium tracking-tight text-ink">{fmtDate(date, 'long')}</div>
        </div>
        {point?.hasEntry ? (
          <Badge variant={statusTone === 'profit' ? 'profit' : statusTone === 'loss' ? 'loss' : 'neutral'} dot>
            {point.status}
          </Badge>
        ) : (
          <Badge variant="outline">No journal</Badge>
        )}
      </div>

      {!point ? (
        <div className="mt-5 flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-line px-5 py-8 text-center">
          <CalendarDays size={20} strokeWidth={1.3} className="text-faint" />
          <div className="mt-2 text-[11px] font-medium text-ink">Nothing recorded for this day</div>
          <div className="mt-1 text-[10px] text-faint">Select a highlighted day or log a new session.</div>
        </div>
      ) : (
        <div className="mt-4 flex flex-1 flex-col">
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-line-soft bg-elevated/30 p-3.5">
            <div>
              <div className="text-[8.5px] uppercase tracking-[0.14em] text-faint">Opening</div>
              <div className="num mt-1 text-[12px] text-ink">{fmtMoney(point.opening, currency, { decimals: 0 })}</div>
            </div>
            <div>
              <div className="text-[8.5px] uppercase tracking-[0.14em] text-faint">Closing</div>
              <div className="num mt-1 text-[12px] text-ink">{fmtMoney(point.closing, currency, { decimals: 0 })}</div>
            </div>
            <div>
              <div className="text-[8.5px] uppercase tracking-[0.14em] text-faint">Trading P/L</div>
              <div
                className={cn(
                  'num mt-1 text-[12px]',
                  point.pnl > 0 ? 'text-profit' : point.pnl < 0 ? 'text-loss' : 'text-muted',
                )}
              >
                {point.pnl === 0 ? '—' : fmtMoney(point.pnl, currency, { signed: true })}
              </div>
            </div>
            <div>
              <div className="text-[8.5px] uppercase tracking-[0.14em] text-faint">Daily return</div>
              <div
                className={cn(
                  'num mt-1 text-[12px]',
                  point.returnPct > 0 ? 'text-profit' : point.returnPct < 0 ? 'text-loss' : 'text-muted',
                )}
              >
                {fmtPct(point.returnPct)}
              </div>
            </div>
          </div>

          {(point.cashIn > 0 || point.cashOut > 0) && (
            <div className="mt-2.5 flex items-center justify-between rounded-lg border border-line-soft px-3 py-2 text-[10px]">
              <span className="text-faint">External cash</span>
              <span className="num text-muted">
                {point.cashIn > 0 && `+${fmtMoney(point.cashIn, currency)} `}
                {point.cashOut > 0 && `−${fmtMoney(point.cashOut, currency)}`}
              </span>
            </div>
          )}

          <div className="mt-4 flex-1">
            <div className="text-[8.5px] uppercase tracking-[0.14em] text-faint">Notes</div>
            <p className="mt-1.5 text-[10.5px] leading-relaxed text-muted">
              {point.notes ?? 'No journal notes for this session.'}
            </p>
            {point.tags && point.tags.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {point.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-line bg-elevated/60 px-2 py-0.5 text-[8.5px] uppercase tracking-[0.1em] text-faint"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {!point.hasEntry && (
            <InfoNote title="Ledger movement only." className="mb-3">
              This date contains external cash but no trading journal.
            </InfoNote>
          )}

          <Button
            variant="secondary"
            size="sm"
            className="mt-2 w-full"
            icon={<Plus size={13} strokeWidth={1.6} />}
            onClick={onOpenJournal}
          >
            {point.hasEntry ? 'Revise this entry' : 'Log this day'}
          </Button>
        </div>
      )}
    </Panel>
  )
}

export default function Journey() {
  const navigate = useNavigate()
  const { account, journey } = useJourney()
  const journals = useAppStore((state) => state.journals)
  const cashEventsAll = useAppStore((state) => state.cashEvents)
  const addCashEvent = useAppStore((state) => state.addCashEvent)
  const pushToast = useAppStore((state) => state.pushToast)
  const [filter, setFilter] = useState<LedgerFilter>('all')
  const [cashModalOpen, setCashModalOpen] = useState(false)
  const [cashType, setCashType] = useState<'DEPOSIT' | 'WITHDRAWAL'>('DEPOSIT')
  const [cashAmount, setCashAmount] = useState('')
  const [cashDate, setCashDate] = useState(todayISO())
  const [cashNote, setCashNote] = useState('')
  const [expanded, setExpanded] = useState(false)

  const { points, transactions, stats, currentBalance } = journey
  const cashEvents = cashEventsAll
    .filter((event) => event.accountId === account.id)
    .sort((a, b) => b.date.localeCompare(a.date))

  const latestEntry = [...points].reverse().find((point) => point.hasEntry)
  const [selectedDate, setSelectedDate] = useState(latestEntry?.date ?? todayISO())
  const [calendarMonth, setCalendarMonth] = useState(
    monthKey(latestEntry?.date ?? todayISO()),
  )

  useEffect(() => {
    const latest = [...journey.points].reverse().find((point) => point.hasEntry)
    setSelectedDate(latest?.date ?? todayISO())
    setCalendarMonth(monthKey(latest?.date ?? todayISO()))
    setExpanded(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account.id])

  const pointByDate = useMemo(() => {
    const map: Record<string, DayPoint> = {}
    for (const point of points) map[point.date] = point
    return map
  }, [points])

  const selectedPoint = pointByDate[selectedDate]
  const peak = Math.max(...points.map((point) => point.closing), account.initialBalance)
  const lowest = Math.min(...points.map((point) => point.closing), account.initialBalance)

  const [year, month] = calendarMonth.split('-').map(Number)
  const firstWeekday = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const today = todayISO()

  const ledger = transactions.filter((transaction) => {
    if (filter === 'all') return true
    if (filter === 'trades') return transaction.type === 'TRADING_PROFIT' || transaction.type === 'TRADING_LOSS'
    return ['DEPOSIT', 'WITHDRAWAL', 'INITIAL_CAPITAL'].includes(transaction.type)
  })
  const visibleLedger = expanded ? ledger : ledger.slice(0, 10)

  const handleExport = () => {
    exportJournalsCsv(account, journals[account.id] ?? [])
    pushToast({
      title: 'CSV export ready',
      message: `${account.name} journal history downloaded`,
      tone: 'success',
    })
  }

  const handleMonth = (offset: number) => {
    const date = new Date(year, month - 1 + offset, 1)
    setCalendarMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
  }

  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader
        eyebrow="Actual journey"
        title="Trading Journey"
        description="Every balance movement, journal entry and cash event in one auditable record. Nothing here is simulated."
        meta={
          <div className="ml-1 flex items-center gap-1.5">
            <Badge variant="outline">{account.currency}</Badge>
            <Badge variant="neutral">{account.type}</Badge>
          </div>
        }
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              icon={<Download size={14} strokeWidth={1.5} />}
              onClick={handleExport}
            >
              Export CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={14} strokeWidth={1.8} />}
              onClick={() => navigate('/journal')}
            >
              Log entry
            </Button>
          </>
        }
      />

      <Panel innerClassName="grid grid-cols-2 gap-px overflow-hidden bg-line-soft sm:grid-cols-5">
        {[
          { label: 'Initial balance', value: fmtMoney(account.initialBalance, account.currency), tone: 'text-ink' },
          { label: 'Total deposits', value: fmtMoney(stats.totalDeposits, account.currency), tone: 'text-profit' },
          { label: 'Total withdrawals', value: fmtMoney(stats.totalWithdrawals, account.currency), tone: 'text-loss' },
          { label: 'Net trading P/L', value: fmtMoney(stats.netPnl, account.currency, { signed: true }), tone: stats.netPnl >= 0 ? 'text-profit' : 'text-loss' },
          { label: 'Current balance', value: fmtMoney(currentBalance, account.currency), tone: 'text-ink' },
        ].map((item) => (
          <div key={item.label} className="bg-surface p-4">
            <div className="text-[8.5px] uppercase tracking-[0.14em] text-faint">{item.label}</div>
            <div className={cn('num mt-1.5 text-[12.5px]', item.tone)}>{item.value}</div>
          </div>
        ))}
      </Panel>

      <div className="grid grid-cols-12 gap-3 lg:gap-4">
        <Panel className="col-span-12 xl:col-span-8" innerClassName="p-5">
          <PanelHeader
            title="Balance timeline"
            subtitle="Actual closing balance · balance basis"
            right={
              <div className="flex items-center gap-2">
                <Badge variant="outline">{fmtDate(account.startDate, 'monthShort')} — now</Badge>
                <Badge variant="accent">{account.currency}</Badge>
              </div>
            }
          />
          <div className="mt-4">
            <BalanceChart
              points={points}
              currency={account.currency}
              reference={account.initialBalance}
              height={252}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line-soft pt-3 sm:grid-cols-4">
            {[
              { label: 'Peak balance', value: fmtMoney(peak, account.currency, { decimals: 0 }) },
              { label: 'Lowest balance', value: fmtMoney(lowest, account.currency, { decimals: 0 }) },
              { label: 'Net change', value: fmtMoney(currentBalance - account.initialBalance, account.currency, { signed: true, decimals: 0 }), tone: currentBalance >= account.initialBalance ? 'text-profit' : 'text-loss' },
              { label: 'Ledger entries', value: `${transactions.length}` },
            ].map((item) => (
              <div key={item.label}>
                <div className="text-[8.5px] uppercase tracking-[0.14em] text-faint">{item.label}</div>
                <div className={cn('num mt-1 text-[11px]', item.tone ?? 'text-ink')}>{item.value}</div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel className="col-span-12 xl:col-span-4" innerClassName="flex h-full flex-col p-5">
          <PanelHeader
            title="Cash movements"
            subtitle="Deposits & withdrawals, separate from P/L"
            right={
              <div className="flex items-center gap-1.5">
                <Badge variant="neutral">{cashEvents.length}</Badge>
                <Button variant="secondary" size="sm" onClick={() => setCashModalOpen(true)}>
                  <Plus size={12} strokeWidth={2} />
                  Move
                </Button>
              </div>
            }
          />
          <div className="mt-4 flex-1 space-y-1">
            {cashEvents.length === 0 && (
              <div className="rounded-xl border border-dashed border-line p-4 text-[10.5px] text-faint">
                No external cash movements recorded.
              </div>
            )}
            {cashEvents.slice(0, 6).map((event) => (
              <div key={event.id} className="flex items-center gap-3 rounded-lg px-1 py-2.5">
                <span
                  className={cn(
                    'grid h-8 w-8 shrink-0 place-items-center rounded-lg border',
                    event.type === 'DEPOSIT'
                      ? 'border-profit/20 bg-profit/10 text-profit'
                      : 'border-loss/20 bg-loss/10 text-loss',
                  )}
                >
                  {event.type === 'DEPOSIT' ? (
                    <ArrowDownLeft size={14} strokeWidth={1.6} />
                  ) : (
                    <ArrowUpRight size={14} strokeWidth={1.6} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[10.5px] font-medium text-ink">
                    {event.type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'}
                  </div>
                  <div className="truncate text-[9px] text-faint">
                    {fmtDate(event.date, 'medium')} · {event.note ?? 'No note'}
                  </div>
                </div>
                <span
                  className={cn(
                    'num shrink-0 text-[10.5px]',
                    event.type === 'DEPOSIT' ? 'text-profit' : 'text-loss',
                  )}
                >
                  {event.type === 'DEPOSIT' ? '+' : '−'}
                  {fmtMoney(event.amount, account.currency)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-line-soft pt-3">
            <div>
              <div className="text-[8.5px] uppercase tracking-[0.14em] text-faint">Total in</div>
              <div className="num mt-1 text-[11px] text-profit">{fmtMoney(stats.totalDeposits, account.currency)}</div>
            </div>
            <div>
              <div className="text-[8.5px] uppercase tracking-[0.14em] text-faint">Total out</div>
              <div className="num mt-1 text-[11px] text-loss">{fmtMoney(stats.totalWithdrawals, account.currency)}</div>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-12 gap-3 lg:gap-4">
        <Panel className="col-span-12 xl:col-span-7" innerClassName="p-4 sm:p-5">
          <PanelHeader
            title="Journal calendar"
            subtitle="Daily trading results by date"
            right={
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleMonth(-1)}
                  className="grid h-6 w-6 place-items-center rounded-md text-faint transition-colors hover:bg-elevated hover:text-ink"
                  aria-label="Previous month"
                >
                  <ChevronLeft size={13} strokeWidth={1.5} />
                </button>
                <span className="min-w-[92px] text-center text-[10px] font-medium text-ink">
                  {monthLabel(calendarMonth, 'long')}
                </span>
                <button
                  onClick={() => handleMonth(1)}
                  className="grid h-6 w-6 place-items-center rounded-md text-faint transition-colors hover:bg-elevated hover:text-ink"
                  aria-label="Next month"
                >
                  <ChevronRight size={13} strokeWidth={1.5} />
                </button>
              </div>
            }
          />
          <div className="mt-4">
            <WeekdayHeader />
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstWeekday }).map((_, index) => (
                <div key={`blank-${index}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, index) => {
                const day = index + 1
                const iso = `${calendarMonth}-${String(day).padStart(2, '0')}`
                const point = pointByDate[iso]
                const isSelected = selectedDate === iso
                const isToday = iso === today
                const tone =
                  point?.status === 'Profit'
                    ? 'profit'
                    : point?.status === 'Loss'
                      ? 'loss'
                      : point?.hasEntry
                        ? 'flat'
                        : 'empty'
                return (
                  <button
                    key={iso}
                    onClick={() => setSelectedDate(iso)}
                    title={point?.hasEntry ? `${iso} · ${point.status}` : iso}
                    className={cn(
                      'group relative flex h-10 flex-col items-center justify-center rounded-lg border text-[10px] transition-all duration-200 sm:h-11',
                      tone === 'profit' && 'border-profit/10 bg-profit/[0.08] text-profit hover:bg-profit/[0.14]',
                      tone === 'loss' && 'border-loss/10 bg-loss/[0.08] text-loss hover:bg-loss/[0.14]',
                      tone === 'flat' && 'border-line-soft bg-elevated/40 text-muted hover:bg-elevated',
                      tone === 'empty' && 'border-transparent text-faint hover:bg-elevated/50',
                      isSelected && 'ring-1 ring-accent/70',
                      isToday && !isSelected && 'ring-1 ring-line',
                    )}
                  >
                    <span className="num leading-none">{day}</span>
                    {point?.hasEntry && point.status !== 'No Trade' && point.status !== 'Breakeven' && (
                      <span className="num mt-0.5 text-[7.5px] leading-none opacity-80">
                        {point.pnl > 0 ? '+' : ''}
                        {fmtCompact(point.pnl)}
                      </span>
                    )}
                    {point?.hasEntry && point.status === 'No Trade' && (
                      <span className="mt-0.5 text-[7px] uppercase tracking-wide opacity-70">off</span>
                    )}
                  </button>
                )
              })}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line-soft pt-3 text-[8.5px] text-faint">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-profit/25" /> Profit
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-loss/25" /> Loss
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-elevated" /> No trade / flat
              </span>
              <span className="ml-auto">Click a day to inspect</span>
            </div>
          </div>
        </Panel>

        <div className="col-span-12 xl:col-span-5">
          <DayDetail
            date={selectedDate}
            point={selectedPoint}
            currency={account.currency}
            onOpenJournal={() => navigate('/journal', { state: { date: selectedDate } })}
          />
        </div>
      </div>

      <Panel innerClassName="p-5">
        <PanelHeader
          title="Transaction ledger"
          subtitle="Balance recomputed from the ledger — not from a stored figure"
          right={
            <div className="flex items-center gap-2">
              <Segmented
                value={filter}
                onChange={(value) => {
                  setFilter(value)
                  setExpanded(false)
                }}
                size="sm"
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'trades', label: 'Trades' },
                  { value: 'cash', label: 'Cash' },
                ]}
              />
              <button
                onClick={handleExport}
                className="hidden h-7 w-7 place-items-center rounded-md text-faint transition-colors hover:bg-elevated hover:text-ink sm:grid"
                aria-label="Export ledger"
              >
                <Download size={13} strokeWidth={1.5} />
              </button>
            </div>
          }
        />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left">
            <thead>
              <tr className="border-b border-line-soft">
                {['Date', 'Type', 'Description', 'Amount', 'Balance', 'Sync'].map((header) => (
                  <th
                    key={header}
                    className="pb-2 pr-3 text-[8.5px] font-medium uppercase tracking-[0.14em] text-faint last:pr-0"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {visibleLedger.map((transaction) => {
                const tone = txTone(transaction.type)
                return (
                  <tr key={transaction.id} className="group transition-colors hover:bg-elevated/30">
                    <td className="whitespace-nowrap py-2.5 pr-3 text-[10px] text-muted">
                      {fmtDate(transaction.date, 'medium')}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span
                        className={cn(
                          'rounded border px-1.5 py-0.5 text-[7.5px] font-medium uppercase tracking-[0.1em]',
                          tone === 'profit'
                            ? 'border-profit/20 bg-profit/10 text-profit'
                            : tone === 'loss'
                              ? 'border-loss/20 bg-loss/10 text-loss'
                              : 'border-line bg-elevated text-muted',
                        )}
                      >
                        {txLabel(transaction.type)}
                      </span>
                    </td>
                    <td className="max-w-[280px] truncate py-2.5 pr-3 text-[10px] text-muted">
                      {transaction.description}
                    </td>
                    <td
                      className={cn(
                        'num whitespace-nowrap py-2.5 pr-3 text-right text-[10.5px]',
                        tone === 'profit' ? 'text-profit' : tone === 'loss' ? 'text-loss' : 'text-muted',
                      )}
                    >
                      {tone === 'loss' ? '−' : tone === 'profit' ? '+' : ''}
                      {fmtMoney(transaction.amount, account.currency)}
                    </td>
                    <td className="num whitespace-nowrap py-2.5 pr-3 text-right text-[10px] text-ink">
                      {fmtMoney(transaction.balanceAfter, account.currency)}
                    </td>
                    <td className="whitespace-nowrap py-2.5">
                      <span className="flex items-center gap-1.5 text-[9px] text-profit">
                        <StatusDot tone="profit" />
                        Synced
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-3 text-[9.5px] text-faint">
          <span>
            Showing {visibleLedger.length} of {ledger.length} movements · {fmtNumber(stats.tradingDays, 0)} trading days
          </span>
          {ledger.length > 10 && (
            <button
              onClick={() => setExpanded((value) => !value)}
              className="flex items-center gap-1 text-muted transition-colors hover:text-ink"
            >
              {expanded ? 'Show latest 10' : `Show all ${ledger.length}`}
              <ChevronRight
                size={11}
                strokeWidth={1.5}
                className={cn('transition-transform', expanded && 'rotate-90')}
              />
            </button>
          )}
        </div>
      </Panel>

      <div className="flex flex-col gap-2 text-[9.5px] text-faint sm:flex-row sm:items-center sm:justify-between">
        <span className="flex items-center gap-1.5">
          <CalendarDays size={11} strokeWidth={1.5} />
          One journal per account per date · unique constraint enforced
        </span>
        <span>
          Funding snapshot: {fmtMoney(account.initialCapital, account.sourceCurrency)} @ {account.exchangeRate.toLocaleString('en-US')}
        </span>
      </div>

      <Modal
        open={cashModalOpen}
        onClose={() => setCashModalOpen(false)}
        title="Record cash movement"
        description="Deposits & withdrawals are separate from daily P/L."
        width="max-w-sm"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setCashModalOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!cashAmount || Number(cashAmount) <= 0}
              onClick={() => {
                const amount = Number(cashAmount.replace(/,/g, ''))
                if (!amount || amount <= 0) return
                addCashEvent(account.id, {
                  id: `ce-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  accountId: account.id,
                  type: cashType,
                  amount,
                  date: cashDate,
                  note: cashNote.trim() || undefined,
                })
                setCashModalOpen(false)
                setCashAmount('')
                setCashNote('')
              }}
            >
              {cashType === 'DEPOSIT' ? 'Record deposit' : 'Record withdrawal'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Segmented
            value={cashType}
            onChange={(val) => setCashType(val as 'DEPOSIT' | 'WITHDRAWAL')}
            options={[
              { value: 'DEPOSIT', label: 'Deposit' },
              { value: 'WITHDRAWAL', label: 'Withdrawal' },
            ]}
          />
          <Field label="Amount">
            <Input
              type="number"
              required
              min={0.01}
              step="any"
              value={cashAmount}
              placeholder="e.g. 500"
              onChange={(e) => setCashAmount(e.target.value)}
            />
          </Field>
          <Field label="Date">
            <Input
              type="date"
              required
              value={cashDate}
              onChange={(e) => setCashDate(e.target.value)}
            />
          </Field>
          <Field label="Note (optional)">
            <Input
              value={cashNote}
              placeholder="Top-up, profit withdrawal, etc."
              onChange={(e) => setCashNote(e.target.value)}
            />
          </Field>
        </div>
      </Modal>
    </div>
  )
}
