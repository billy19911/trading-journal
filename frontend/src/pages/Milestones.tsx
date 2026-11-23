import { useMemo, useState } from 'react'
import {
  CalendarClock,
  Check,
  CircleCheck,
  Lock,
  Plus,
  Sparkles,
  Target,
  Trash,
  TrendingUp,
  Trophy,
} from 'lucide-react'
import { useAppStore } from '../store'
import { useJourney } from '../hooks'
import { fmtDate, fmtMoney, fmtNumber, fmtPct, todayISO, addDays } from '../lib/format'
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
  Progress,
  Ring,
} from '../components/ui'
import type { DayPoint, Milestone } from '../types'

interface MilestoneRow {
  milestone: Milestone
  status: 'achieved' | 'progress' | 'locked'
  achievedDate?: string
  projectedDate?: string | null
  progress: number
}

function achievedOn(points: DayPoint[], target: number, fallback: string): string {
  const hit = points.find((point) => point.closing >= target)
  return hit?.date ?? fallback
}

function projectDate(current: number, target: number, ratePct: number): string | null {
  if (target <= current || current <= 0 || ratePct <= 0) return null
  const sessions = Math.log(target / current) / Math.log(1 + ratePct / 100)
  if (!Number.isFinite(sessions) || sessions <= 0) return null
  if (sessions > 2600) return 'far'
  const calendarDays = Math.ceil(sessions * (7 / 5))
  return addDays(todayISO(), calendarDays)
}

function suggestedTargets(current: number): number[] {
  const step = current >= 20000 ? 5000 : current >= 5000 ? 2500 : current >= 1000 ? 500 : 100
  const first = Math.ceil((current + 1) / step) * step
  return Array.from({ length: 4 }, (_, index) => first + step * index)
}

function MilestoneRowView({
  row,
  currency,
  isLast,
  onRemove,
}: {
  row: MilestoneRow
  currency: string
  isLast: boolean
  onRemove: (id: string) => void
}) {
  const { milestone, status, achievedDate, projectedDate, progress } = row
  const achieved = status === 'achieved'
  const inProgress = status === 'progress'

  return (
    <div className="relative flex gap-3.5 pb-6 last:pb-0 sm:gap-4">
      {!isLast && (
        <span
          className={cn(
            'absolute left-[13px] top-7 bottom-0 w-px',
            achieved ? 'bg-profit/30' : 'bg-line',
          )}
        />
      )}
      <span
        className={cn(
          'relative z-10 mt-0.5 grid h-[27px] w-[27px] shrink-0 place-items-center rounded-full border',
          achieved
            ? 'border-profit/30 bg-profit/10 text-profit'
            : inProgress
              ? 'border-accent/40 bg-accent/10 text-accent'
              : 'border-line bg-elevated text-faint',
        )}
      >
        {achieved ? (
          <Check size={13} strokeWidth={2.2} />
        ) : inProgress ? (
          <Target size={13} strokeWidth={1.8} />
        ) : (
          <Lock size={11.5} strokeWidth={1.8} />
        )}
        {inProgress && (
          <span className="absolute inset-0 rounded-full border border-accent/30 pulse-soft" />
        )}
      </span>

      <div
        className={cn(
          'group min-w-0 flex-1 rounded-xl border px-3.5 py-3 transition-colors duration-300',
          inProgress
            ? 'border-accent/25 bg-accent/[0.035]'
            : achieved
              ? 'border-profit/15 bg-profit/[0.02]'
              : 'border-line-soft bg-elevated/20',
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'num text-[16px] font-medium leading-none tracking-tight',
                  achieved ? 'text-profit' : inProgress ? 'text-ink' : 'text-muted',
                )}
              >
                {fmtMoney(milestone.target, milestone.currency, { decimals: 0 })}
              </span>
              {inProgress && <Badge variant="accent">Next up</Badge>}
              {achieved && <Badge variant="profit">Completed</Badge>}
              {status === 'locked' && <Badge variant="neutral">Locked</Badge>}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[9.5px] text-faint">
              {achieved ? (
                <span className="flex items-center gap-1 text-profit/80">
                  <CircleCheck size={10} strokeWidth={1.7} />
                  Reached {fmtDate(achievedDate ?? '', 'medium')}
                </span>
              ) : inProgress ? (
                <>
                  <span className="flex items-center gap-1">
                    <CalendarClock size={10} strokeWidth={1.6} />
                    {projectedDate === 'far'
                      ? 'Beyond a realistic horizon'
                      : projectedDate
                        ? `Est. ${fmtDate(projectedDate, 'medium')}`
                        : 'Not currently on pace'}
                  </span>
                  <span className="text-line">·</span>
                  <span>{fmtPct(progress, { signed: false })} of the way</span>
                </>
              ) : (
                <span className="flex items-center gap-1">
                  <Lock size={9.5} strokeWidth={1.6} />
                  Unlocks after the milestone above
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!achieved && (
              <button
                onClick={() => onRemove(milestone.id)}
                aria-label="Remove milestone"
                className="grid h-6 w-6 place-items-center rounded-md text-faint opacity-0 transition-all hover:bg-loss/10 hover:text-loss focus-visible:opacity-100 group-hover:opacity-100"
              >
                <Trash size={11.5} strokeWidth={1.6} />
              </button>
            )}
            {inProgress && (
              <div className="text-right">
                <div className="num text-[10.5px] text-muted">
                  {fmtMoney(Math.max(0, milestone.target - (progress / 100) * milestone.target), currency, {
                    decimals: 0,
                  })}
                </div>
                <div className="text-[8px] uppercase tracking-[0.12em] text-faint">to go</div>
              </div>
            )}
          </div>
        </div>

        {inProgress && (
          <div className="mt-3">
            <Progress value={progress} tone="accent" height={5} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function Milestones() {
  const { account, journey } = useJourney()
  const milestonesAll = useAppStore((state) => state.milestones)
  const accounts = useAppStore((state) => state.accounts)
  const addMilestone = useAppStore((state) => state.addMilestone)
  const removeMilestone = useAppStore((state) => state.removeMilestone)
  const pushToast = useAppStore((state) => state.pushToast)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const { currentBalance, stats, points } = journey

  const rows = useMemo<MilestoneRow[]>(() => {
    const list = milestonesAll
      .filter((milestone) => milestone.accountId === account.id)
      .slice()
      .sort((a, b) => a.target - b.target)
    const pace =
      stats.avgDailyReturn > 0 ? stats.avgDailyReturn : account.dailyTarget > 0 ? account.dailyTarget : 0
    let foundProgress = false

    return list.map((milestone) => {
      const achieved = milestone.target <= currentBalance
      let status: MilestoneRow['status']
      if (achieved) {
        status = 'achieved'
      } else if (!foundProgress) {
        foundProgress = true
        status = 'progress'
      } else {
        status = 'locked'
      }

      const progress =
        milestone.target > 0 ? Math.min(100, (currentBalance / milestone.target) * 100) : 100

      return {
        milestone,
        status,
        achievedDate: achieved ? achievedOn(points, milestone.target, account.startDate) : undefined,
        projectedDate: status === 'progress' ? projectDate(currentBalance, milestone.target, pace) : null,
        progress,
      }
    })
  }, [milestonesAll, account.id, account.startDate, account.dailyTarget, currentBalance, points, stats.avgDailyReturn])

  const achievedRows = rows.filter((row) => row.status === 'achieved')
  const nextRow = rows.find((row) => row.status === 'progress')
  const totalTarget = rows.length > 0 ? rows[rows.length - 1].milestone.target : 0
  const pace =
    stats.avgDailyReturn > 0 ? stats.avgDailyReturn : account.dailyTarget > 0 ? account.dailyTarget : 0

  const otherAccounts = accounts.filter((item) => item.id !== account.id)

  const resetDraft = () => {
    setDraft('')
    setSubmitted(false)
  }

  const openModal = () => {
    resetDraft()
    setOpen(true)
  }

  const closeModal = () => {
    setOpen(false)
    resetDraft()
  }

  const parsed = draft.trim() === '' ? NaN : Number(draft.replace(/,/g, ''))
  const validNumber = Number.isFinite(parsed) && parsed > 0
  const duplicate = rows.some((row) => Math.abs(row.milestone.target - parsed) < 0.005)
  const aboveBalance = parsed > currentBalance
  const valid = validNumber && !duplicate && aboveBalance

  const save = () => {
    setSubmitted(true)
    if (!valid) {
      pushToast({
        title: 'Check the milestone target',
        message: !validNumber
          ? 'Enter a valid amount.'
          : duplicate
            ? 'This target already exists.'
            : 'Target must be above the current balance.',
        tone: 'error',
      })
      return
    }
    addMilestone({
      id: `ms-${account.id}-${Date.now().toString(36)}`,
      accountId: account.id,
      target: Math.round(parsed * 100) / 100,
      currency: account.currency,
    })
    closeModal()
  }

  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader
        eyebrow="Actual journey · account goals"
        title="Milestones"
        description="Targets you set for this account, judged only by the actual closing balance. Projected dates are rough estimates from your current pace — not promises."
        meta={
          <div className="ml-1 flex items-center gap-1.5">
            <Badge variant="outline">{account.currency}</Badge>
            <Badge variant="neutral">{rows.length} targets</Badge>
          </div>
        }
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={14} strokeWidth={1.8} />}
            onClick={openModal}
          >
            Add milestone
          </Button>
        }
      />

      <div className="grid grid-cols-12 gap-3 lg:gap-4">
        <Panel className="col-span-12 xl:col-span-7" innerClassName="relative overflow-hidden p-5 sm:p-6">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-accent/[0.06] blur-3xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="eyebrow">Next milestone</span>
                <Badge variant="accent" dot>
                  In progress
                </Badge>
              </div>
              <div className="mt-3 text-[13px] text-muted">{nextRow ? 'Target balance' : 'Every target reached'}</div>
              <div className="num mt-1 text-[32px] font-medium leading-none tracking-[-0.04em] text-ink sm:text-[38px]">
                {nextRow
                  ? fmtNumber(nextRow.milestone.target, 0)
                  : fmtNumber(currentBalance, 0)}
                <span className="ml-1.5 text-[12px] font-medium tracking-normal text-muted">
                  {account.currency}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-faint">
                <span>
                  Current{' '}
                  <span className="num text-muted">{fmtMoney(currentBalance, account.currency, { decimals: 0 })}</span>
                </span>
                {nextRow && (
                  <>
                    <span className="text-line">·</span>
                    <span>
                      Remaining{' '}
                      <span className="num text-muted">
                        {fmtMoney(nextRow.milestone.target - currentBalance, account.currency, {
                          decimals: 0,
                        })}
                      </span>
                    </span>
                  </>
                )}
                <span className="text-line">·</span>
                <span>{achievedRows.length} of {rows.length} completed</span>
              </div>
            </div>

            <Ring
              value={nextRow ? nextRow.progress : 100}
              size={122}
              stroke={9}
              tone={nextRow ? 'accent' : 'profit'}
            >
              <div className="text-center">
                <div className="num text-[22px] font-medium leading-none text-ink">
                  {nextRow ? `${nextRow.progress.toFixed(0)}%` : '100%'}
                </div>
                <div className="mt-1 text-[7.5px] uppercase tracking-[0.14em] text-faint">complete</div>
              </div>
            </Ring>
          </div>

          <div className="relative mt-5 grid grid-cols-2 gap-3 border-t border-line-soft pt-4 sm:grid-cols-4">
            {[
              {
                label: 'Est. completion',
                value: nextRow?.projectedDate
                  ? nextRow.projectedDate === 'far'
                    ? '> 5 years'
                    : fmtDate(nextRow.projectedDate, 'short')
                  : '—',
                tone: 'text-ink',
              },
              {
                label: 'Pace used',
                value: `${fmtPct(pace, { signed: false })} / day`,
                tone: 'text-muted',
              },
              {
                label: 'Balance growth',
                value: fmtMoney(currentBalance - account.initialBalance, account.currency, {
                  signed: true,
                  decimals: 0,
                }),
                tone: currentBalance >= account.initialBalance ? 'text-profit' : 'text-loss',
              },
              {
                label: 'Final target',
                value: fmtMoney(totalTarget, account.currency, { decimals: 0 }),
                tone: 'text-ink',
              },
            ].map((item) => (
              <div key={item.label}>
                <div className="text-[8px] uppercase tracking-[0.14em] text-faint">{item.label}</div>
                <div className={cn('num mt-1 text-[11px]', item.tone)}>{item.value}</div>
              </div>
            ))}
          </div>

          <div className="relative mt-4 flex items-start gap-2 rounded-xl border border-dashed border-accent/20 bg-accent/[0.02] px-3.5 py-3 text-[9.5px] leading-relaxed text-muted">
            <Sparkles size={12} strokeWidth={1.5} className="mt-0.5 shrink-0 text-accent" />
            <span>
              Projected dates assume{' '}
              <span className="text-ink">{fmtPct(pace, { signed: false })}</span> per trading day,
              compounded on every active session. Change the plan, not the history.
            </span>
          </div>
        </Panel>

        <div className="col-span-12 space-y-3 xl:col-span-5 lg:space-y-4">
          <Panel innerClassName="p-5">
            <PanelHeader
              title="Milestone summary"
              subtitle={`${account.name} · ${account.currency}`}
              right={<Trophy size={15} strokeWidth={1.5} className="text-faint" />}
            />
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { label: 'Completed', value: achievedRows.length, tone: 'text-profit' },
                { label: 'In progress', value: rows.filter((row) => row.status === 'progress').length, tone: 'text-accent' },
                { label: 'Locked', value: rows.filter((row) => row.status === 'locked').length, tone: 'text-muted' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-line-soft bg-elevated/30 p-3">
                  <div className="text-[8px] uppercase tracking-[0.14em] text-faint">{item.label}</div>
                  <div className={cn('num mt-1.5 text-[20px] font-medium leading-none', item.tone)}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-faint">Target range</span>
                <span className="num text-muted">
                  {rows.length > 0
                    ? `${fmtNumber(rows[0].milestone.target, 0)} → ${fmtNumber(totalTarget, 0)}`
                    : 'No targets yet'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-faint">Coverage of final target</span>
                <span className="num text-muted">
                  {totalTarget > 0 ? `${Math.min(100, (currentBalance / totalTarget) * 100).toFixed(1)}%` : '—'}
                </span>
              </div>
              <Progress
                value={totalTarget > 0 ? Math.min(100, (currentBalance / totalTarget) * 100) : 0}
                tone="profit"
              />
            </div>
            <div className="mt-4 flex items-center gap-1.5 border-t border-line-soft pt-3 text-[9px] text-faint">
              <TrendingUp size={11} strokeWidth={1.5} className="text-accent" />
              Judged on the actual closing balance only
            </div>
          </Panel>

          <Panel innerClassName="p-5">
            <PanelHeader
              title="Other accounts"
              subtitle="Switch account to manage its milestones"
            />
            <div className="mt-3 space-y-1.5">
              {otherAccounts.map((item) => (
                <button
                  key={item.id}
                  onClick={() => useAppStore.getState().setActiveAccount(item.id)}
                  className="flex w-full items-center gap-2.5 rounded-xl border border-line-soft px-3 py-2.5 text-left transition-colors hover:bg-elevated/50"
                >
                  <span
                    className="h-6 w-6 shrink-0 rounded-full"
                    style={{
                      background: `color-mix(in srgb, ${item.accent} 16%, transparent)`,
                      border: `1px solid color-mix(in srgb, ${item.accent} 30%, transparent)`,
                    }}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[10.5px] font-medium text-ink">{item.name}</span>
                    <span className="block text-[8.5px] uppercase tracking-[0.1em] text-faint">
                      {item.currency} · {milestonesAll.filter((m) => m.accountId === item.id).length} targets
                    </span>
                  </span>
                  <span className="text-[9px] text-faint">Switch</span>
                </button>
              ))}
            </div>
          </Panel>

          <InfoNote title="Milestones are intentions, not predictions.">
            Dates are extrapolated from current performance and can move when results change.
          </InfoNote>
        </div>
      </div>

      <Panel innerClassName="p-5">
        <PanelHeader
          title="Milestone timeline"
          subtitle="Completed targets are permanent; future targets stay locked until reached"
          right={
            <Button variant="ghost" size="xs" icon={<Plus size={12} strokeWidth={1.8} />} onClick={openModal}>
              Add
            </Button>
          }
        />
        <div className="mt-5">
          {rows.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line px-5 py-12 text-center">
              <span className="grid h-11 w-11 place-items-center rounded-full border border-line bg-elevated/40 text-faint">
                <Target size={19} strokeWidth={1.4} />
              </span>
              <div className="mt-3 text-[12px] font-medium text-ink">No milestones for this account yet</div>
              <div className="mt-1 max-w-sm text-[10.5px] leading-relaxed text-faint">
                Add the first target. We will track progress and estimate the date from actual results.
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                icon={<Plus size={13} strokeWidth={1.7} />}
                onClick={openModal}
              >
                Add milestone
              </Button>
            </div>
          )}
          {rows.map((row, index) => (
            <MilestoneRowView
              key={row.milestone.id}
              row={row}
              currency={account.currency}
              isLast={index === rows.length - 1}
              onRemove={removeMilestone}
            />
          ))}
        </div>
      </Panel>

      <Modal
        open={open}
        onClose={closeModal}
        title="Add milestone"
        description={`A target balance for ${account.name} in ${account.currency}.`}
        footer={
          <div className="flex items-center justify-between gap-3">
            <span className="text-[9.5px] text-faint">Measured on the actual closing balance</span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={13} strokeWidth={2} />}
                onClick={save}
                disabled={submitted && !valid}
              >
                Add target
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <Field
            label="Target balance"
            htmlFor="milestone-target"
            hint={`Current ${fmtMoney(currentBalance, account.currency, { decimals: 0 })}`}
          >
            <div className="relative">
              <Input
                id="milestone-target"
                inputMode="decimal"
                placeholder="0.00"
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value)
                  setSubmitted(false)
                }}
                className={cn(
                  'num h-12 pr-16 text-[18px] font-medium',
                  submitted && !valid && 'border-loss/60',
                )}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-medium uppercase tracking-[0.12em] text-faint">
                {account.currency}
              </span>
            </div>
          </Field>

          <div>
            <div className="mb-2 text-[9px] uppercase tracking-[0.14em] text-faint">Suggestions</div>
            <div className="flex flex-wrap gap-1.5">
              {suggestedTargets(currentBalance).map((target) => (
                <button
                  key={target}
                  type="button"
                  onClick={() => {
                    setDraft(String(target))
                    setSubmitted(false)
                  }}
                  className="num rounded-full border border-line bg-elevated/40 px-2.5 py-1 text-[9.5px] text-muted transition-colors hover:border-accent/30 hover:text-accent"
                >
                  {fmtNumber(target, 0)}
                </button>
              ))}
            </div>
          </div>

          {validNumber && (
            <div className="rounded-xl border border-line-soft bg-elevated/30 p-3.5">
              <div className="flex items-center justify-between text-[9.5px]">
                <span className="text-faint">Current balance</span>
                <span className="num text-muted">{fmtMoney(currentBalance, account.currency, { decimals: 0 })}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[9.5px]">
                <span className="text-faint">Target</span>
                <span className="num text-ink">{fmtMoney(parsed, account.currency, { decimals: 0 })}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[9.5px]">
                <span className="text-faint">Distance</span>
                <span className={cn('num', aboveBalance ? 'text-accent' : 'text-loss')}>
                  {aboveBalance
                    ? fmtMoney(parsed - currentBalance, account.currency, { decimals: 0 })
                    : 'Already at or below balance'}
                </span>
              </div>
              <div className="mt-3">
                <Progress
                  value={Math.max(0, Math.min(100, (currentBalance / parsed) * 100))}
                  tone="accent"
                  height={5}
                />
              </div>
            </div>
          )}

          {submitted && !valid && (
            <div className="rounded-xl border border-loss/25 bg-loss/5 px-3.5 py-2.5 text-[10px] text-loss">
              {!validNumber
                ? 'Enter a valid positive amount.'
                : duplicate
                  ? 'That target already exists for this account.'
                  : 'The target must be above the current balance.'}
            </div>
          )}

          <div className="rounded-xl border border-dashed border-line px-3.5 py-3 text-[9.5px] leading-relaxed text-faint">
            <span className="flex items-center gap-1.5 font-medium uppercase tracking-[0.12em] text-muted">
              <Lock size={10} strokeWidth={1.6} /> Locked until reached
            </span>
            <p className="mt-1">
              Completing a target records the actual date it was crossed. Nothing is auto-credited or
              simulated into the Journey.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
