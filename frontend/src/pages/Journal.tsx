import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  Camera,
  Check,
  RotateCcw,
  ShieldCheck,
  Target,
  TrendingUp,
  X,
} from 'lucide-react'
import { useAppStore } from '../store'
import { useJourney } from '../hooks'
import { openingBefore } from '../lib/journey'
import { fmtDate, fmtMoney, fmtPct, monthKey, todayISO } from '../lib/format'
import {
  cn,
  Badge,
  Button,
  Field,
  InfoNote,
  Input,
  PageHeader,
  Panel,
  PanelHeader,
  Progress,
  Segmented,
  Textarea,
} from '../components/ui'
import type { JournalEntry, JournalStatus } from '../types'

const TAG_OPTIONS = ['Gold', 'Breakout', 'News', 'Discipline', 'Overtrade', 'Scalp', 'Risk', 'London', 'NY session']

const QUICK_AMOUNTS = [
  { label: '+0.5%', pct: 0.5 },
  { label: '+1%', pct: 1 },
  { label: '+2%', pct: 2 },
  { label: '−1%', pct: -1 },
]

export default function Journal() {
  const navigate = useNavigate()
  const location = useLocation()
  const { account, journey } = useJourney()
  const journals = useAppStore((state) => state.journals)
  const addJournal = useAppStore((state) => state.addJournal)
  const pushToast = useAppStore((state) => state.pushToast)

  const prefillDate = (location.state as { date?: string } | null)?.date
  const [date, setDate] = useState(prefillDate ?? todayISO())
  const [amount, setAmount] = useState('')
  const [noTrade, setNoTrade] = useState(false)
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [attachment, setAttachment] = useState<string | undefined>()

  const entries = journals[account.id] ?? []
  const existing = useMemo(() => entries.find((entry) => entry.date === date), [entries, date])
  const opening = useMemo(
    () => openingBefore(journey.points, date, account.initialBalance),
    [journey.points, date, account.initialBalance],
  )

  useEffect(() => {
    const entry = (journals[account.id] ?? []).find((item) => item.date === date)
    if (entry) {
      setNoTrade(entry.status === 'No Trade')
      setAmount(entry.pnl === 0 ? '' : String(entry.pnl))
      setNotes(entry.notes ?? '')
      setTags(entry.tags ?? [])
      setAttachment(entry.attachment)
    } else {
      setNoTrade(false)
      setAmount('')
      setNotes('')
      setTags([])
      setAttachment(undefined)
    }
  }, [date, account.id, journals])

  const parsed = amount.trim() === '' || amount.trim() === '-' ? 0 : Number(amount.replace(/,/g, ''))
  const valid = Number.isFinite(parsed)
  const pnl = noTrade ? 0 : valid ? parsed : 0
  const status: JournalStatus = noTrade ? 'No Trade' : pnl > 0 ? 'Profit' : pnl < 0 ? 'Loss' : 'Breakeven'
  const closing = opening + pnl
  const returnPct = opening !== 0 ? (pnl / opening) * 100 : 0

  const monthStat = journey.monthly.find((month) => month.key === monthKey(date))
  const targetAmount = (opening * account.dailyTarget) / 100
  const streak = journey.stats.currentStreak
  const streakLabel =
    streak.count === 0
      ? 'No streak'
      : `${streak.count} ${streak.type === 'win' ? 'win' : streak.type === 'loss' ? 'loss' : 'flat'} day${streak.count > 1 ? 's' : ''}`

  const recent = entries.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)
  const maxBar = Math.max(opening, Math.abs(closing), 1)

  const applyQuick = (pct: number) => {
    setNoTrade(false)
    setAmount(((opening * pct) / 100).toFixed(2))
  }

  const toggleTag = (tag: string) => {
    setTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]))
  }

  const reset = () => {
    setNoTrade(false)
    setAmount('')
    setNotes('')
    setTags([])
    setAttachment(undefined)
  }

  const save = () => {
    if (!valid) {
      pushToast({
        title: 'Check the amount',
        message: 'Enter a valid number, for example 250 or −125.',
        tone: 'error',
      })
      return
    }
    const entry: JournalEntry = {
      id: existing?.id ?? `j-${account.id}-${date}`,
      accountId: account.id,
      date,
      pnl,
      status,
      notes: notes.trim() ? notes.trim() : undefined,
      tags: tags.length > 0 ? tags : undefined,
      attachment,
    }
    addJournal(account.id, entry)
  }

  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader
        eyebrow="Actual journey · daily record"
        title="Daily Journal"
        description="One record per account per date. Saving writes to the ledger immediately — the before and after balance is always visible before you commit."
        meta={
          <div className="ml-1 flex items-center gap-1.5">
            <Badge variant="outline">{account.currency}</Badge>
            {existing && <Badge variant="accent">Editing</Badge>}
          </div>
        }
        actions={
          <Button
            variant="secondary"
            size="sm"
            iconRight={<ArrowUpRight size={12} strokeWidth={1.5} />}
            onClick={() => navigate('/journey')}
          >
            View journey
          </Button>
        }
      />

      <div className="grid grid-cols-12 gap-3 lg:gap-4">
        <Panel className="col-span-12 xl:col-span-7" innerClassName="p-5 sm:p-6">
          <PanelHeader
            title={existing ? `Revise entry · ${fmtDate(date, 'long')}` : 'Session details'}
            subtitle={
              existing
                ? 'Saving updates the existing ledger entry for this date'
                : 'Record the actual result of the trading day'
            }
            right={
              <Segmented
                value={noTrade ? 'off' : 'on'}
                onChange={(value) => {
                  setNoTrade(value === 'off')
                  if (value === 'off') setAmount('')
                }}
                size="sm"
                options={[
                  { value: 'on', label: 'Trading day' },
                  { value: 'off', label: 'No trade' },
                ]}
              />
            }
          />

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Journal date" htmlFor="journal-date">
              <Input
                id="journal-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="num"
              />
            </Field>
            <Field
              label="Opening balance"
              hint={noTrade ? 'No P/L applied' : 'Auto-calculated'}
            >
              <div className="relative">
                <Input
                  value={fmtMoney(opening, account.currency)}
                  readOnly
                  className="num bg-elevated/40 text-muted"
                />
              </div>
            </Field>
          </div>

          <div className="mt-4">
            <Field
              label="Daily profit / loss"
              htmlFor="journal-amount"
              hint={
                <span>
                  {noTrade ? (
                    'No trade selected'
                  ) : (
                    <span className={cn(pnl > 0 ? 'text-profit' : pnl < 0 ? 'text-loss' : 'text-faint')}>
                      {fmtPct(returnPct)} of opening
                    </span>
                  )}
                </span>
              }
            >
              <div className="relative">
                <Input
                  id="journal-amount"
                  inputMode="decimal"
                  placeholder="250.00 or −125.00"
                  value={amount}
                  disabled={noTrade}
                  onChange={(event) => setAmount(event.target.value)}
                  className={cn(
                    'num h-12 pr-20 text-[18px] font-medium tracking-tight',
                    !valid && 'border-loss/60',
                    noTrade && 'opacity-50',
                  )}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-medium uppercase tracking-[0.12em] text-faint">
                  {account.currency}
                </span>
              </div>
            </Field>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              {QUICK_AMOUNTS.map((quick) => (
                <button
                  key={quick.label}
                  type="button"
                  disabled={noTrade}
                  onClick={() => applyQuick(quick.pct)}
                  className="rounded-full border border-line bg-elevated/50 px-2.5 py-1 text-[9.5px] text-muted transition-colors hover:border-accent/30 hover:bg-accent/10 hover:text-accent disabled:opacity-40"
                >
                  {quick.label}
                </button>
              ))}
              <span className="ml-1 text-[9px] text-faint">quick amounts use opening balance</span>
            </div>
            {!valid && (
              <div className="mt-2 text-[10px] text-loss">Enter a valid number — negative values are losses.</div>
            )}
          </div>

          <div className="mt-4">
            <Field label="Session notes" htmlFor="journal-notes" hint={`${notes.length}/500`}>
              <Textarea
                id="journal-notes"
                maxLength={500}
                placeholder="What happened? Setup, execution, mistakes, mindset…"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Tags" hint="Optional">
              <div className="flex flex-wrap gap-1.5">
                {TAG_OPTIONS.map((tag) => {
                  const active = tags.includes(tag)
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-[9.5px] transition-all duration-200',
                        active
                          ? 'border-accent/40 bg-accent/10 text-accent'
                          : 'border-line bg-elevated/40 text-faint hover:border-line hover:text-muted',
                      )}
                    >
                      {tag}
                    </button>
                  )
                })}
              </div>
            </Field>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-line px-3 py-2 text-[10px] text-muted transition-colors hover:border-accent/30 hover:text-ink">
              <Camera size={14} strokeWidth={1.5} className="text-faint" />
              {attachment ? 'Replace screenshot' : 'Attach screenshot'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) {
                    setAttachment(file.name)
                    pushToast({
                      title: 'Screenshot attached',
                      message: 'Stored locally — upload arrives with cloud sync.',
                      tone: 'success',
                    })
                  }
                }}
              />
            </label>
            {attachment && (
              <span className="flex items-center gap-1.5 rounded-full border border-line bg-elevated/50 px-2.5 py-1 text-[9.5px] text-muted">
                {attachment}
                <button onClick={() => setAttachment(undefined)} aria-label="Remove attachment">
                  <X size={11} strokeWidth={1.5} className="text-faint hover:text-ink" />
                </button>
              </span>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-line-soft pt-4">
            <button
              onClick={reset}
              className="flex items-center gap-1.5 text-[10px] text-faint transition-colors hover:text-ink"
            >
              <RotateCcw size={12} strokeWidth={1.5} />
              Reset form
            </button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/journey')}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                icon={<Check size={14} strokeWidth={2} />}
                onClick={save}
                disabled={!valid || !date}
              >
                {existing ? 'Update entry' : 'Save entry'}
              </Button>
            </div>
          </div>

          {closing < 0 && (
            <div className="mt-3 rounded-xl border border-loss/25 bg-loss/5 px-3.5 py-2.5 text-[10px] text-loss">
              Warning: this entry pushes the balance below zero. The ledger allows it for historical
              corrections, but double-check the amount.
            </div>
          )}
        </Panel>

        <div className="col-span-12 space-y-3 xl:col-span-5 lg:space-y-4">
          <Panel innerClassName="p-5">
            <PanelHeader
              title="Balance impact"
              subtitle="Preview before saving to the ledger"
              right={
                <Badge
                  variant={status === 'Profit' ? 'profit' : status === 'Loss' ? 'loss' : 'neutral'}
                  dot
                >
                  {status}
                </Badge>
              }
            />
            <div className="mt-4 flex items-end justify-between gap-3">
              <div>
                <div className="text-[8.5px] uppercase tracking-[0.14em] text-faint">Balance after</div>
                <div
                  className={cn(
                    'num mt-1 text-[26px] font-medium leading-none tracking-tight',
                    pnl >= 0 ? 'text-ink' : 'text-loss',
                  )}
                >
                  {fmtMoney(closing, account.currency)}
                </div>
              </div>
              <div
                className={cn(
                  'rounded-full border px-2.5 py-1 text-[10px]',
                  pnl > 0
                    ? 'border-profit/20 bg-profit/10 text-profit'
                    : pnl < 0
                      ? 'border-loss/20 bg-loss/10 text-loss'
                      : 'border-line bg-elevated text-muted',
                )}
              >
                <span className="num">{pnl === 0 ? '—' : fmtMoney(pnl, account.currency, { signed: true })}</span>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div>
                <div className="mb-1 flex justify-between text-[9.5px]">
                  <span className="text-faint">Opening</span>
                  <span className="num text-muted">{fmtMoney(opening, account.currency)}</span>
                </div>
                <Progress value={(opening / maxBar) * 100} tone="muted" />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-[9.5px]">
                  <span className="text-faint">Closing</span>
                  <span className="num text-ink">{fmtMoney(closing, account.currency)}</span>
                </div>
                <Progress
                  value={(Math.abs(closing) / maxBar) * 100}
                  tone={pnl >= 0 ? 'profit' : 'loss'}
                />
              </div>
              <div className="flex items-center justify-between border-t border-line-soft pt-3 text-[9.5px]">
                <span className="text-faint">Daily return</span>
                <span className={cn('num', returnPct >= 0 ? 'text-profit' : 'text-loss')}>
                  {fmtPct(returnPct)}
                </span>
              </div>
            </div>
          </Panel>

          <Panel innerClassName="p-5">
            <PanelHeader title="Session context" subtitle={`${account.name} · ${account.currency}`} />
            <div className="mt-4 space-y-3">
              {[
                {
                  label: 'Current balance',
                  value: fmtMoney(journey.stats.currentBalance, account.currency),
                },
                {
                  label: `Target · ${account.dailyTarget.toFixed(1)}%`,
                  value: fmtMoney(targetAmount, account.currency),
                },
                {
                  label: 'This month (TWR)',
                  value: monthStat ? fmtPct(monthStat.returnPct) : 'No data',
                  tone: (monthStat?.returnPct ?? 0) >= 0 ? 'text-profit' : 'text-loss',
                },
                { label: 'Current streak', value: streakLabel },
                {
                  label: 'Win rate',
                  value: `${journey.stats.winRate.toFixed(1)}%`,
                },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-4 text-[10px]">
                  <span className="text-faint">{row.label}</span>
                  <span className={cn('num text-ink', row.tone)}>{row.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-1.5 border-t border-line-soft pt-3 text-[9px] text-faint">
              <Target size={11} strokeWidth={1.5} className="text-accent" />
              Target amount is {account.dailyTarget.toFixed(1)}% of the opening balance.
            </div>
          </Panel>

          <Panel innerClassName="p-5">
            <PanelHeader
              title="Recent entries"
              subtitle="Select an entry to revise it"
              right={<Badge variant="outline">{entries.length}</Badge>}
            />
            <div className="mt-3 space-y-1">
              {recent.length === 0 && (
                <div className="rounded-xl border border-dashed border-line p-4 text-[10.5px] text-faint">
                  No journal entries for this account yet.
                </div>
              )}
              {recent.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => {
                    setDate(entry.date)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors',
                    entry.date === date ? 'bg-elevated ring-1 ring-line' : 'hover:bg-elevated/50',
                  )}
                >
                  <span
                    className={cn(
                      'h-1.5 w-1.5 shrink-0 rounded-full',
                      entry.status === 'Profit'
                        ? 'bg-profit'
                        : entry.status === 'Loss'
                          ? 'bg-loss'
                          : 'bg-faint',
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10.5px] text-ink">{fmtDate(entry.date, 'medium')}</span>
                    <span className="block truncate text-[9px] text-faint">{entry.notes ?? entry.status}</span>
                  </span>
                  <span
                    className={cn(
                      'num text-[10px]',
                      entry.pnl > 0 ? 'text-profit' : entry.pnl < 0 ? 'text-loss' : 'text-faint',
                    )}
                  >
                    {entry.pnl === 0 ? '—' : fmtMoney(entry.pnl, account.currency, { signed: true })}
                  </span>
                </button>
              ))}
            </div>
          </Panel>

          <InfoNote title="Cash stays in the ledger.">
            Deposits and withdrawals are not trading P/L. Record them from the Journey so returns stay
            time-weighted and honest.
          </InfoNote>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[9.5px] text-faint">
        <span className="flex items-center gap-1.5">
          <ShieldCheck size={11} strokeWidth={1.5} className="text-accent" />
          Every revision is designed to keep an audit record — no hidden balance changes.
        </span>
        <span className="flex items-center gap-1.5">
          <TrendingUp size={11} strokeWidth={1.5} />
          {journey.stats.tradingDays} trading days · {entries.length} journal records
        </span>
      </div>
    </div>
  )
}
