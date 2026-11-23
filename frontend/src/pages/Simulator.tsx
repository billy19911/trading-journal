import { useMemo, useState } from 'react'
import {
  Calculator,
  Info,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { savedScenarios, useAppStore, type SavedScenario } from '../store'
import { useJourney } from '../hooks'
import { buildScenarioSeries, runSimulation } from '../lib/simulate'
import { fmtMoney, fmtNumber, fmtPct } from '../lib/format'
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
  Toggle,
} from '../components/ui'
import { ProjectionChart } from '../components/charts'
import type { SimParams } from '../types'

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function RangeField({
  label,
  value,
  min,
  max,
  step,
  suffix,
  hint,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  suffix?: string
  hint?: string
  onChange: (value: number) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label className="text-[11.5px] font-medium text-muted">{label}</label>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            value={Number.isFinite(value) ? value : 0}
            min={min}
            max={max}
            step={step}
            onChange={(event) => onChange(clamp(Number(event.target.value) || 0, min, max))}
            className="num w-[62px] rounded-lg border border-line bg-elevated px-2 py-1 text-right text-[11px] text-ink outline-none transition-colors focus:border-accent/60"
          />
          {suffix && <span className="w-3 text-[9.5px] text-faint">{suffix}</span>}
        </div>
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2.5 w-full"
      />
      {hint && <div className="mt-1 text-[9px] text-faint">{hint}</div>}
    </div>
  )
}

export default function Simulator() {
  const { account, journey } = useJourney()
  const pushToast = useAppStore((state) => state.pushToast)
  const [compare, setCompare] = useState(true)

  const defaults = useMemo<SimParams>(
    () => ({
      initial: Math.max(1, Math.round(journey.stats.currentBalance)),
      dailyReturn: 1.5,
      tradingDays: 20,
      months: 12,
      compounding: true,
      monthlyDeposit: 0,
      monthlyWithdrawal: 0,
    }),
    // The simulator is intentionally opened with the active account as a starting reference.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const [draft, setDraft] = useState<SimParams>(defaults)
  const [applied, setApplied] = useState<SimParams>(defaults)
  const dirty = JSON.stringify(draft) !== JSON.stringify(applied)

  const result = useMemo(() => runSimulation(applied), [applied])
  const series = useMemo(() => buildScenarioSeries(applied, result), [applied, result])
  const lastSeries = series[series.length - 1]

  const update = <K extends keyof SimParams>(key: K, value: SimParams[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  const loadScenario = (scenario: SavedScenario) => {
    const next: SimParams = { ...draft, ...scenario.params }
    setDraft(next)
    setApplied(next)
    pushToast({ title: `${scenario.name} loaded`, message: scenario.description, tone: 'success' })
  }

  const run = () => {
    setApplied({ ...draft })
  }

  const reset = () => {
    setDraft(defaults)
    setApplied(defaults)
  }

  const useActiveBalance = () => {
    update('initial', Math.max(1, Math.round(journey.stats.currentBalance)))
    pushToast({
      title: 'Initial balance updated',
      message: `${account.name} · ${fmtMoney(journey.stats.currentBalance, account.currency)}`,
      tone: 'success',
    })
  }

  const monthlyTarget = (Math.pow(1 + applied.dailyReturn / 100, applied.tradingDays) - 1) * 100
  const netCash = result.totalDeposits - result.totalWithdrawals

  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader
        eyebrow="Intelligence · isolated projection"
        title="Growth Simulator"
        description="Test assumptions about daily returns, loss days and compounding. Outputs are projections — they never touch actual balances, deposits or the ledger."
        meta={
          <div className="ml-1 flex items-center gap-1.5">
            <Badge variant="sim">Simulation</Badge>
            <Badge variant="outline">{account.currency}</Badge>
          </div>
        }
        actions={
          <Button variant="ghost" size="sm" icon={<RotateCcw size={13} strokeWidth={1.5} />} onClick={reset}>
            Reset
          </Button>
        }
      />

      <div className="grid grid-cols-12 gap-3 lg:gap-4">
        <Panel className="col-span-12 xl:col-span-4" innerClassName="p-5">
          <PanelHeader
            title="Parameters"
            subtitle="Draft the scenario, then run it"
            right={<Badge variant={dirty ? 'accent' : 'neutral'}>{dirty ? 'Draft' : 'Applied'}</Badge>}
          />

          <div className="mt-4">
            <div className="mb-2 flex items-center gap-1.5 text-[8.5px] font-medium uppercase tracking-[0.16em] text-faint">
              <Sparkles size={10} strokeWidth={1.5} className="text-accent" />
              Saved presets
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {savedScenarios.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => loadScenario(scenario)}
                  className="rounded-lg border border-line bg-elevated/40 px-2.5 py-2 text-left transition-all duration-200 hover:border-accent/30 hover:bg-accent/[0.06]"
                >
                  <div className="text-[10px] font-medium text-ink">{scenario.name}</div>
                  <div className="mt-0.5 text-[8px] leading-tight text-faint">{scenario.description}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <Field
              label="Initial balance"
              hint={
                <button
                  onClick={useActiveBalance}
                  className="text-[9px] text-accent transition-colors hover:text-ink"
                >
                  Use active balance
                </button>
              }
            >
              <div className="relative">
                <Input
                  inputMode="decimal"
                  value={draft.initial}
                  onChange={(event) =>
                    update('initial', Math.max(0, Number(event.target.value) || 0))
                  }
                  className="num pr-14 text-[14px]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9.5px] uppercase tracking-[0.1em] text-faint">
                  {account.currency}
                </span>
              </div>
            </Field>

            <RangeField
              label="Daily return"
              value={draft.dailyReturn}
              min={-5}
              max={5}
              step={0.1}
              suffix="%"
              hint="Negative values test losing streaks. Base case uses the full rate."
              onChange={(value) => update('dailyReturn', value)}
            />

            <RangeField
              label="Trading days / month"
              value={draft.tradingDays}
              min={1}
              max={23}
              step={1}
              suffix="d"
              onChange={(value) => update('tradingDays', value)}
            />

            <RangeField
              label="Duration"
              value={draft.months}
              min={1}
              max={36}
              step={1}
              suffix="mo"
              onChange={(value) => update('months', value)}
            />

            <div className="flex items-start justify-between gap-3 rounded-xl border border-line bg-elevated/30 p-3">
              <div>
                <div className="text-[10.5px] font-medium text-ink">Compounding</div>
                <div className="mt-0.5 text-[9px] leading-relaxed text-faint">
                  {draft.compounding
                    ? 'Profit is calculated on the latest balance.'
                    : 'Profit is calculated on the initial capital.'}
                </div>
              </div>
              <Toggle
                checked={draft.compounding}
                onChange={(value) => update('compounding', value)}
                label="Compounding"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Monthly deposit">
                <Input
                  inputMode="decimal"
                  value={draft.monthlyDeposit}
                  onChange={(event) =>
                    update('monthlyDeposit', Math.max(0, Number(event.target.value) || 0))
                  }
                  className="num text-[11.5px]"
                />
              </Field>
              <Field label="Monthly withdrawal">
                <Input
                  inputMode="decimal"
                  value={draft.monthlyWithdrawal}
                  onChange={(event) =>
                    update('monthlyWithdrawal', Math.max(0, Number(event.target.value) || 0))
                  }
                  className="num text-[11.5px]"
                />
              </Field>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="mt-5 w-full"
            icon={<Calculator size={15} strokeWidth={1.6} />}
            onClick={run}
          >
            Run simulation
          </Button>
          <div
            className={cn(
              'mt-2 text-center text-[9px] transition-colors',
              dirty ? 'text-accent' : 'text-faint',
            )}
          >
            {dirty ? 'Parameters changed — run to update results' : 'Results match the applied parameters'}
          </div>

          <div className="mt-4">
            <InfoNote title="Isolated by design.">
              This module cannot create transactions, deposits or withdrawals. Actual accounts remain
              untouched.
            </InfoNote>
          </div>
        </Panel>

        <div className="col-span-12 space-y-3 xl:col-span-8 lg:space-y-4">
          <Panel innerClassName="relative overflow-hidden p-5 lg:p-6">
            <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-accent/[0.07] blur-3xl" />
            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="eyebrow">Projected final balance</span>
                  <Badge variant="sim">Simulation</Badge>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="num text-[36px] font-medium leading-none tracking-[-0.04em] text-ink sm:text-[42px]">
                    {fmtNumber(result.final, 2)}
                  </span>
                  <span className="text-[12px] font-medium text-muted">{account.currency}</span>
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px]">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-2 py-0.5',
                      result.roi >= 0
                        ? 'border-profit/20 bg-profit/10 text-profit'
                        : 'border-loss/20 bg-loss/10 text-loss',
                    )}
                  >
                    {result.roi >= 0 ? (
                      <TrendingUp size={11} strokeWidth={1.8} />
                    ) : (
                      <TrendingDown size={11} strokeWidth={1.8} />
                    )}
                    <span className="num">{fmtPct(result.roi)}</span>
                  </span>
                  <span className="text-faint">ROI over {applied.months} months</span>
                  <span className="text-line">·</span>
                  <span className="text-muted">{result.tradingDays} trading days</span>
                  <span className="text-line">·</span>
                  <span className="text-muted">{applied.compounding ? 'Compounded' : 'Simple'}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant="outline">Not actual</Badge>
                <div className="text-right text-[9px] text-faint">
                  Monthly target at this rate
                  <div className="num mt-0.5 text-[11px] text-muted">{fmtPct(monthlyTarget)}</div>
                </div>
              </div>
            </div>

            <div className="relative mt-5 grid grid-cols-2 gap-3 border-t border-line-soft pt-4 sm:grid-cols-4">
              {[
                {
                  label: 'Total trading profit',
                  value: fmtMoney(result.totalPnl, account.currency, { signed: true }),
                  tone: result.totalPnl >= 0 ? 'text-profit' : 'text-loss',
                },
                {
                  label: 'Max drawdown',
                  value: `−${result.maxDrawdown.toFixed(2)}%`,
                  tone: 'text-loss',
                },
                {
                  label: 'Net cash added',
                  value: fmtMoney(netCash, account.currency, { signed: true }),
                  tone: 'text-muted',
                },
                {
                  label: 'Final vs initial',
                  value: `${fmtNumber(result.final / Math.max(applied.initial, 1), 2)}×`,
                  tone: 'text-ink',
                },
              ].map((item) => (
                <div key={item.label}>
                  <div className="text-[8px] uppercase tracking-[0.14em] text-faint">{item.label}</div>
                  <div className={cn('num mt-1 text-[11.5px]', item.tone)}>{item.value}</div>
                </div>
              ))}
            </div>

            {result.stopped && (
              <div className="relative mt-3 flex items-center gap-2 rounded-lg border border-loss/25 bg-loss/5 px-3 py-2 text-[9.5px] text-loss">
                <Info size={12} strokeWidth={1.5} />
                Scenario stopped because the projected balance reached zero.
              </div>
            )}
          </Panel>

          <Panel innerClassName="p-5">
            <PanelHeader
              title="Projection path"
              subtitle="Balances shown are month-end projections"
              right={
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-[9.5px] text-muted">
                    Compare
                    <Toggle checked={compare} onChange={setCompare} label="Compare scenarios" />
                  </label>
                </div>
              }
            />
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[9px] text-faint">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-4 rounded-full bg-accent" /> Base case
              </span>
              {compare && (
                <>
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-4 rounded-full bg-profit/70" /> Best case (1.5×)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-4 rounded-full bg-loss/70" /> Worst case (0.5×)
                  </span>
                </>
              )}
            </div>
            <div className="mt-2">
              <ProjectionChart
                series={series}
                currency={account.currency}
                compare={compare}
                height={286}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line-soft pt-3 text-[9.5px] text-faint">
              <span>
                Best case final{' '}
                <span className="num text-profit">{fmtMoney(lastSeries?.best ?? result.final, account.currency, { decimals: 0 })}</span>
                {' · '}Worst case final{' '}
                <span className="num text-loss">{fmtMoney(lastSeries?.worst ?? result.final, account.currency, { decimals: 0 })}</span>
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck size={10} strokeWidth={1.5} />
                Labels: SIMULATION
              </span>
            </div>
          </Panel>

          <Panel innerClassName="p-5">
            <PanelHeader
              title="Monthly breakdown"
              subtitle="Assumes the same return on every trading day"
              right={<Badge variant="outline">{result.months.length} periods</Badge>}
            />
            <div className="mt-4 max-h-[360px] overflow-auto">
              <table className="w-full min-w-[620px] text-left">
                <thead className="sticky top-0 bg-surface">
                  <tr className="border-b border-line-soft">
                    {['Month', 'Opening', 'P/L', 'Net cash', 'Closing', 'Return', 'Max DD'].map((header) => (
                      <th
                        key={header}
                        className={cn(
                          'pb-2 pr-3 text-[8px] font-medium uppercase tracking-[0.14em] text-faint last:pr-0',
                          header !== 'Month' && 'text-right',
                        )}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-soft">
                  {result.months.map((month) => (
                    <tr key={month.month} className="transition-colors hover:bg-elevated/30">
                      <td className="py-2.5 pr-3 text-[10px] text-muted">M{month.month}</td>
                      <td className="num py-2.5 pr-3 text-right text-[10px] text-muted">
                        {fmtMoney(month.opening, account.currency, { decimals: 0 })}
                      </td>
                      <td
                        className={cn(
                          'num py-2.5 pr-3 text-right text-[10px]',
                          month.pnl >= 0 ? 'text-profit' : 'text-loss',
                        )}
                      >
                        {fmtMoney(month.pnl, account.currency, { signed: true, decimals: 0 })}
                      </td>
                      <td className="num py-2.5 pr-3 text-right text-[10px] text-muted">
                        {fmtMoney(month.deposit - month.withdrawal, account.currency, { signed: true, decimals: 0 })}
                      </td>
                      <td className="num py-2.5 pr-3 text-right text-[10px] text-ink">
                        {fmtMoney(month.closing, account.currency, { decimals: 0 })}
                      </td>
                      <td
                        className={cn(
                          'num py-2.5 pr-3 text-right text-[10px]',
                          month.returnPct >= 0 ? 'text-profit' : 'text-loss',
                        )}
                      >
                        {fmtPct(month.returnPct)}
                      </td>
                      <td className="num py-2.5 text-right text-[10px] text-muted">
                        {month.drawdown.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-line bg-elevated/30">
                    <td className="py-2.5 pr-3 text-[10px] font-medium text-ink">Total</td>
                    <td className="num py-2.5 pr-3 text-right text-[10px] text-muted">
                      {fmtMoney(applied.initial, account.currency, { decimals: 0 })}
                    </td>
                    <td
                      className={cn(
                        'num py-2.5 pr-3 text-right text-[10px]',
                        result.totalPnl >= 0 ? 'text-profit' : 'text-loss',
                      )}
                    >
                      {fmtMoney(result.totalPnl, account.currency, { signed: true, decimals: 0 })}
                    </td>
                    <td className="num py-2.5 pr-3 text-right text-[10px] text-muted">
                      {fmtMoney(netCash, account.currency, { signed: true, decimals: 0 })}
                    </td>
                    <td className="num py-2.5 pr-3 text-right text-[10px] text-ink">
                      {fmtMoney(result.final, account.currency, { decimals: 0 })}
                    </td>
                    <td
                      className={cn(
                        'num py-2.5 pr-3 text-right text-[10px]',
                        result.roi >= 0 ? 'text-profit' : 'text-loss',
                      )}
                    >
                      {fmtPct(result.roi)}
                    </td>
                    <td className="num py-2.5 text-right text-[10px] text-muted">
                      {result.maxDrawdown.toFixed(1)}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Panel>

          <div className="rounded-xl border border-dashed border-accent/25 bg-accent/[0.03] px-4 py-3 text-[9.5px] leading-relaxed text-muted">
            <span className="flex items-center gap-1.5 font-medium uppercase tracking-[0.12em] text-accent">
              <ShieldCheck size={11} strokeWidth={1.5} /> Simulation only
            </span>
            <p className="mt-1">
              The projection is based strictly on the assumptions above. It is not a prediction, a promise
              of returns, or a change to the actual Journey ledger.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
