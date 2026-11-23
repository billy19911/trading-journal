import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeftRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  CircleDollarSign,
  Coins,
  Globe,
  Hash,
  Landmark,
  Pencil,
  Plus,
  Trash2,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from 'lucide-react'
import { useAppStore } from '../store'
import { useJourney, useJourneyMap } from '../hooks'
import { convertCapital, conversionPath } from '../lib/currency'
import { newAccountId } from '../data/mock'
import { fmtDate, fmtMoney, fmtNumber, fmtPct, fmtRate, relativeTime, todayISO } from '../lib/format'
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
  Segmented,
  Select,
  Sparkline,
} from '../components/ui'
import type { Account, AccountStatus, AccountType, CurrencyCode } from '../types'

const ACCENTS = ['#3B82F6', '#F59E0B', '#8B5CF6', '#22C55E', '#EF4444', '#06B6D4']
const SOURCE_CURRENCIES: CurrencyCode[] = ['IDR', 'USD']

function accountStatusTone(status: AccountStatus) {
  return status === 'Active' ? ('profit' as const) : ('neutral' as const)
}

function AccountCard({
  account,
  balance,
  netPnl,
  totalReturn,
  spark,
  active,
  onActivate,
  onEdit,
  onOpen,
}: {
  account: Account
  balance: number
  netPnl: number
  totalReturn: number
  spark: number[]
  active: boolean
  onActivate: () => void
  onEdit: () => void
  onOpen: () => void
}) {
  return (
    <Panel
      className={cn('h-full transition-all duration-300', active && 'ring-1 ring-accent/30')}
      innerClassName="relative flex h-full flex-col overflow-hidden p-5"
    >
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full blur-3xl"
        style={{ background: `color-mix(in srgb, ${account.accent} 8%, transparent)` }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border text-[10px] font-semibold"
            style={{
              background: `color-mix(in srgb, ${account.accent} 13%, transparent)`,
              borderColor: `color-mix(in srgb, ${account.accent} 28%, transparent)`,
              color: account.accent,
            }}
          >
            {account.name
              .split(' ')
              .map((word) => word[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[13px] font-medium text-ink">{account.name}</span>
              {active && <Badge variant="accent">Active</Badge>}
            </div>
            <div className="mt-0.5 text-[8.5px] uppercase tracking-[0.12em] text-faint">
              {account.broker} · {account.type} · {account.currency}
            </div>
          </div>
        </div>
        <Badge variant={accountStatusTone(account.status)} dot>
          {account.status}
        </Badge>
      </div>

      <div className="relative mt-5">
        <div className="text-[8.5px] uppercase tracking-[0.14em] text-faint">Current balance</div>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="num text-[26px] font-medium leading-none tracking-[-0.035em] text-ink">
            {fmtNumber(balance, account.currency === 'IDR' ? 0 : 2)}
          </span>
          <span className="text-[10.5px] font-medium text-muted">{account.currency}</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[9.5px]">
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5',
              totalReturn >= 0
                ? 'border-profit/20 bg-profit/10 text-profit'
                : 'border-loss/20 bg-loss/10 text-loss',
            )}
          >
            <ArrowUpRight
              size={9}
              strokeWidth={1.8}
              className={totalReturn >= 0 ? '' : 'rotate-90'}
            />
            <span className="num">{fmtPct(totalReturn)}</span>
          </span>
          <span className="text-faint">since funding</span>
          <span className="text-line">·</span>
          <span className={cn('num', netPnl >= 0 ? 'text-profit' : 'text-loss')}>
            {fmtMoney(netPnl, account.currency, { signed: true })}
          </span>
        </div>
      </div>

      <div className="relative mt-4">
        <Sparkline
          values={spark}
          tone={netPnl >= 0 ? 'profit' : 'loss'}
          width={260}
          height={38}
          className="w-full"
        />
      </div>

      <div className="relative mt-4 grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-line-soft pt-3.5 text-[9.5px]">
        <div className="flex items-center gap-1.5 text-faint">
          <Hash size={10} strokeWidth={1.5} />
          <span className="num text-muted">{account.accountNumber}</span>
        </div>
        <div className="flex items-center gap-1.5 text-faint">
          <CalendarDays size={10} strokeWidth={1.5} />
          Started {fmtDate(account.startDate, 'short')}
        </div>
        <div className="flex items-center gap-1.5 text-faint">
          <CircleDollarSign size={10} strokeWidth={1.5} />
          Target {account.dailyTarget.toFixed(1)}% / day
        </div>
        <div className="flex items-center gap-1.5 text-faint">
          <Coins size={10} strokeWidth={1.5} />
          Ratio {account.centRatio}:1
        </div>
      </div>

      <div className="relative mt-3 rounded-xl border border-line-soft bg-elevated/30 px-3 py-2.5">
        <div className="text-[8px] uppercase tracking-[0.14em] text-faint">Funding snapshot</div>
        <div className="mt-1 flex items-center justify-between gap-2 text-[9.5px]">
          <span className="num text-muted">
            {fmtMoney(account.initialCapital, account.sourceCurrency)}
          </span>
          <ArrowLeftRight size={10} strokeWidth={1.5} className="shrink-0 text-faint" />
          <span className="num text-ink">
            {fmtMoney(account.initialBalance, account.currency)}
          </span>
        </div>
        <div className="mt-1 text-[8px] text-faint">
          {account.sourceCurrency === account.currency
            ? 'Funded directly in account currency'
            : conversionPath(account.sourceCurrency, account.currency, account.centRatio)}
        </div>
      </div>

      <div className="relative mt-auto flex items-center gap-2 pt-4">
        {active ? (
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            icon={<ArrowUpRight size={13} strokeWidth={1.6} />}
            onClick={onOpen}
          >
            Open journey
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            icon={<Check size={13} strokeWidth={1.7} />}
            onClick={onActivate}
          >
            Set active
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          icon={<Pencil size={12.5} strokeWidth={1.6} />}
          onClick={onEdit}
        >
          Edit
        </Button>
      </div>
    </Panel>
  )
}

interface AccountFormState {
  name: string
  broker: string
  accountNumber: string
  type: AccountType
  sourceCurrency: CurrencyCode
  capital: string
  exchangeRate: string
  dailyTarget: string
  startDate: string
  centRatio: string
  status: AccountStatus
}

function AccountModal({
  mode,
  account,
  onClose,
}: {
  mode: 'create' | 'edit'
  account?: Account
  onClose: () => void
}) {
  const accounts = useAppStore((state) => state.accounts)
  const usdIdrRate = useAppStore((state) => state.usdIdrRate)
  const addAccount = useAppStore((state) => state.addAccount)
  const updateAccount = useAppStore((state) => state.updateAccount)
  const deleteAccount = useAppStore((state) => state.deleteAccount)
  const pushToast = useAppStore((state) => state.pushToast)

  const [form, setForm] = useState<AccountFormState>({
    name: account?.name ?? '',
    broker: account?.broker ?? '',
    accountNumber: account?.accountNumber ?? '',
    type: account?.type ?? 'Standard',
    sourceCurrency: account?.sourceCurrency ?? 'IDR',
    capital: account ? String(account.initialCapital) : '',
    exchangeRate: account ? String(account.exchangeRate) : String(usdIdrRate),
    dailyTarget: account ? String(account.dailyTarget) : '1',
    startDate: account?.startDate ?? todayISO(),
    centRatio: account ? String(account.centRatio) : '100',
    status: account?.status ?? 'Active',
  })
  const [submitted, setSubmitted] = useState(false)

  const update = <K extends keyof AccountFormState>(key: K, value: AccountFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const capital = Number(form.capital.replace(/,/g, '')) || 0
  const ratio = form.type === 'Cent' ? Number(form.centRatio) || 100 : 1
  const exchangeRate = Number(form.exchangeRate.replace(/,/g, '')) || 0
  const targetCurrency: CurrencyCode = form.type === 'Cent' ? 'USC' : 'USD'
  const usdValue = convertCapital(capital, form.sourceCurrency, 'USD', exchangeRate, ratio)
  const balance = convertCapital(capital, form.sourceCurrency, targetCurrency, exchangeRate, ratio)
  const target = Number(form.dailyTarget) || 0
  const overviewBalance = balance

  const nameError = form.name.trim().length < 2
  const brokerError = form.broker.trim().length < 2
  const numberError = form.accountNumber.trim().length < 3
  const capitalError = capital <= 0
  const targetError = target <= 0 || target > 10
  const ratioError = form.type === 'Cent' && (Number(form.centRatio) <= 0 || Number(form.centRatio) > 1000)
  const rateError = form.sourceCurrency === 'IDR' && exchangeRate <= 0
  const dateError = !/^\d{4}-\d{2}-\d{2}$/.test(form.startDate)

  const valid = !nameError && !brokerError && !numberError && !capitalError && !targetError && !ratioError && !rateError && !dateError

  const remove = async () => {
    if (!account || !window.confirm(`Delete ${account.name}? This removes its journals, transactions, and milestones.`)) return
    await deleteAccount(account.id)
    onClose()
  }

  const save = () => {
    setSubmitted(true)
    if (!valid) {
      pushToast({
        title: 'Check the account details',
        message: 'Required fields are missing or a value is out of range.',
        tone: 'error',
      })
      return
    }

    if (mode === 'edit' && account) {
      updateAccount({
        ...account,
        name: form.name.trim(),
        broker: form.broker.trim(),
        accountNumber: form.accountNumber.trim(),
        type: form.type,
        currency: targetCurrency,
        centRatio: ratio,
        initialCapital: capital,
        sourceCurrency: form.sourceCurrency,
        exchangeRate: form.sourceCurrency === 'IDR' ? exchangeRate : 1,
        initialBalance: balance,
        startDate: form.startDate,
        dailyTarget: target,
        status: form.status,
      })
    } else {
      addAccount({
        id: newAccountId(),
        name: form.name.trim(),
        broker: form.broker.trim(),
        accountNumber: form.accountNumber.trim(),
        type: form.type,
        currency: targetCurrency,
        centRatio: ratio,
        initialCapital: capital,
        sourceCurrency: form.sourceCurrency,
        exchangeRate: form.sourceCurrency === 'IDR' ? exchangeRate : 1,
        initialBalance: balance,
        startDate: form.startDate,
        dailyTarget: target,
        status: 'Active',
        accent: ACCENTS[accounts.length % ACCENTS.length],
      })
    }
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={mode === 'edit' ? `Edit ${account?.name}` : 'Create account'}
      description={
        mode === 'edit'
          ? 'Edit account details, funding amount, and exchange-rate snapshot.'
          : 'Set up a broker account and fund it through USD. The snapshot rate is preserved.'
      }
      width="max-w-2xl"
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="hidden text-[9.5px] text-faint sm:block">
            {mode === 'edit' ? 'Balances remain ledger-derived' : 'Currency conversion is applied on create'}
          </span>
          <div className="flex items-center gap-2">
            {mode === 'edit' && (
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 size={12.5} strokeWidth={1.6} />}
                onClick={() => void remove()}
              >
                Delete account
              </Button>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={mode === 'edit' ? <Check size={13} strokeWidth={2} /> : <Plus size={13} strokeWidth={2} />}
              onClick={save}
              disabled={submitted && !valid}
            >
              {mode === 'edit' ? 'Save changes' : 'Create account'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid gap-5 md:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Account name" htmlFor="acc-name">
              <Input
                id="acc-name"
                value={form.name}
                placeholder="Exness Gold"
                onChange={(event) => update('name', event.target.value)}
                className={cn(submitted && nameError && 'border-loss/60')}
              />
            </Field>
            <Field label="Broker" htmlFor="acc-broker">
              <Input
                id="acc-broker"
                value={form.broker}
                placeholder="Exness"
                onChange={(event) => update('broker', event.target.value)}
                className={cn(submitted && brokerError && 'border-loss/60')}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Account number" htmlFor="acc-number">
              <Input
                id="acc-number"
                value={form.accountNumber}
                placeholder="7021 884"
                onChange={(event) => update('accountNumber', event.target.value)}
                className={cn(submitted && numberError && 'border-loss/60')}
              />
            </Field>
            <Field label="Account status">
              <Segmented
                value={form.status}
                onChange={(value) => update('status', value)}
                options={[
                  { value: 'Active', label: 'Active' },
                  { value: 'Paused', label: 'Paused' },
                ]}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Account type" hint="Cent = USC">
              <Select
                value={form.type}
                onChange={(event) => {
                  const nextType = event.target.value as AccountType
                  update('type', nextType)
                  if (nextType === 'Cent') update('centRatio', '100')
                }}
              >
                {(['Standard', 'Cent', 'Micro', 'Custom'] as AccountType[]).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Source currency"
              hint={form.sourceCurrency === 'IDR' ? 'Converted via USD/IDR' : 'Direct USD'}
            >
              <Select
                value={form.sourceCurrency}
                onChange={(event) => update('sourceCurrency', event.target.value as CurrencyCode)}
              >
                {SOURCE_CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Initial capital"
              htmlFor="acc-capital"
              hint={`Account currency: ${targetCurrency}`}
            >
              <div className="relative">
                <Input
                  id="acc-capital"
                  inputMode="decimal"
                  placeholder="1,670,000"
                  value={form.capital}
                  onChange={(event) => update('capital', event.target.value)}
                  className={cn('num pr-12', submitted && capitalError && 'border-loss/60')}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] uppercase tracking-[0.1em] text-faint">
                  {form.sourceCurrency}
                </span>
              </div>
            </Field>
            <Field
              label="Target daily return"
              htmlFor="acc-target"
              hint="0.1 – 10%"
            >
              <div className="relative">
                <Input
                  id="acc-target"
                  inputMode="decimal"
                  value={form.dailyTarget}
                  onChange={(event) => update('dailyTarget', event.target.value)}
                  className={cn('num pr-10', submitted && targetError && 'border-loss/60')}
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] text-faint">%</span>
              </div>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Funding exchange rate"
              htmlFor="acc-rate"
              hint={form.sourceCurrency === 'IDR' ? 'IDR per 1 USD' : 'Not required for USD'}
            >
              <Input
                id="acc-rate"
                inputMode="decimal"
                value={form.exchangeRate}
                disabled={form.sourceCurrency !== 'IDR'}
                onChange={(event) => update('exchangeRate', event.target.value)}
                className={cn(
                  'num',
                  form.sourceCurrency !== 'IDR' && 'bg-elevated/40 text-muted opacity-70',
                  submitted && rateError && 'border-loss/60',
                )}
              />
            </Field>
            <Field label="Start date" htmlFor="acc-start">
              <Input
                id="acc-start"
                type="date"
                value={form.startDate}
                onChange={(event) => update('startDate', event.target.value)}
                className="num"
              />
            </Field>
            <Field label="Cent ratio" hint="USC per USD">
              <Input
                inputMode="numeric"
                value={form.type === 'Cent' ? form.centRatio : '1'}
                disabled={form.type !== 'Cent'}
                onChange={(event) => update('centRatio', event.target.value)}
                className={cn(
                  'num',
                  form.type !== 'Cent' && 'bg-elevated/40 text-muted opacity-70',
                  submitted && ratioError && 'border-loss/60',
                )}
              />
            </Field>
          </div>

          {submitted && !valid && (
            <div className="rounded-xl border border-loss/25 bg-loss/5 px-3.5 py-2.5 text-[10px] text-loss">
              Complete all required fields. Targets must stay between 0.1% and 10%.
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-line bg-elevated/30 p-4">
            <div className="flex items-center gap-1.5 text-[8.5px] font-medium uppercase tracking-[0.16em] text-faint">
              <ArrowLeftRight size={11} strokeWidth={1.5} className="text-accent" />
              Conversion preview
            </div>
            <div className="mt-3 space-y-2.5 text-[10px]">
              <div className="flex items-center justify-between">
                <span className="text-faint">Source capital</span>
                <span className="num text-ink">{fmtMoney(capital, form.sourceCurrency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-faint">USD equivalent</span>
                <span className="num text-muted">{fmtMoney(usdValue, 'USD')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-faint">Snapshot rate</span>
                <span className="num text-muted">
                  {form.sourceCurrency === 'IDR' ? `1 USD = ${fmtRate(usdIdrRate)} IDR` : 'Not required'}
                </span>
              </div>
              <div className="hairline my-1" />
              <div className="flex items-end justify-between gap-2">
                <span className="text-faint">Account balance</span>
                <span className="num text-right text-[15px] font-medium text-ink">
                  {fmtNumber(balance, 2)}
                  <span className="ml-1 text-[9.5px] font-normal text-muted">{targetCurrency}</span>
                </span>
              </div>
              <div className="rounded-lg bg-surface/60 px-2.5 py-2 text-[8.5px] leading-relaxed text-faint">
                {conversionPath(form.sourceCurrency, targetCurrency, ratio)}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-line-soft p-4">
            <div className="text-[8.5px] uppercase tracking-[0.14em] text-faint">Daily target value</div>
            <div className="num mt-1 text-[16px] font-medium text-ink">
              {fmtMoney((overviewBalance * target) / 100, account?.currency ?? targetCurrency)}
            </div>
            <p className="mt-1.5 text-[9px] leading-relaxed text-faint">
              At {target.toFixed(1)}% of the opening balance. Compounding is never assumed automatically.
            </p>
          </div>

          <div className="rounded-xl border border-dashed border-accent/25 bg-accent/[0.03] px-3.5 py-3 text-[9px] leading-relaxed text-muted">
            <span className="flex items-center gap-1.5 font-medium uppercase tracking-[0.12em] text-accent">
              <ShieldCheck size={10} strokeWidth={1.6} />
              Funding is immutable
            </span>
            <p className="mt-1">
              Initial capital and its exchange-rate snapshot stay part of the ledger record. Later
              deposits are separate cash events.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function Converter() {
  const usdIdrRate = useAppStore((state) => state.usdIdrRate)
  const pushToast = useAppStore((state) => state.pushToast)
  const [amount, setAmount] = useState('100')
  const [from, setFrom] = useState<CurrencyCode>('USD')
  const [to, setTo] = useState<CurrencyCode>('USC')
  const [ratio, setRatio] = useState('100')

  const numeric = Number(amount.replace(/,/g, '')) || 0
  const centRatio = Number(ratio) || 100
  const result = convertCapital(numeric, from, to, usdIdrRate, centRatio)

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-[8.5px] uppercase tracking-[0.14em] text-faint">Manual converter</div>
          <div className="mt-1 text-[10px] text-muted">USD pivot · snapshot aware</div>
        </div>
        <Badge variant="outline">{from} → {to}</Badge>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <div>
          <div className="mb-1.5 text-[9px] text-faint">Amount</div>
          <Input
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="num text-[11.5px]"
          />
          <Select
            value={from}
            onChange={(event) => setFrom(event.target.value as CurrencyCode)}
            className="mt-1.5 py-1.5 text-[10px]"
          >
            {(['IDR', 'USD', 'USC'] as CurrencyCode[]).map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </Select>
        </div>
        <button
          onClick={() => {
            setFrom(to)
            setTo(from)
          }}
          aria-label="Swap currencies"
          className="mb-8 grid h-7 w-7 place-items-center rounded-full border border-line bg-elevated text-faint transition-colors hover:text-ink"
        >
          <ArrowLeftRight size={12} strokeWidth={1.5} />
        </button>
        <div>
          <div className="mb-1.5 text-[9px] text-faint">Converted</div>
          <div className="num flex h-[38px] items-center rounded-xl border border-line bg-bg/40 px-3 text-[11.5px] text-ink">
            {fmtNumber(result, to === 'IDR' ? 0 : 2)}
          </div>
          <Select
            value={to}
            onChange={(event) => setTo(event.target.value as CurrencyCode)}
            className="mt-1.5 py-1.5 text-[10px]"
          >
            {(['IDR', 'USD', 'USC'] as CurrencyCode[]).map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-line-soft bg-elevated/30 px-2.5 py-2">
        <span className="text-[8.5px] text-faint">Cent ratio</span>
        <div className="flex items-center gap-1.5">
          <input
            inputMode="numeric"
            value={ratio}
            onChange={(event) => setRatio(event.target.value)}
            className="num w-14 rounded-md border border-line bg-surface px-2 py-1 text-right text-[10px] text-ink outline-none focus:border-accent/60"
          />
          <span className="text-[8.5px] text-faint">USC / USD</span>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[8.5px] text-faint">{conversionPath(from, to, centRatio)}</span>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(String(result)).catch(() => undefined)
            pushToast({ title: 'Copied', message: `${fmtNumber(result, to === 'IDR' ? 0 : 2)} ${to}`, tone: 'success' })
          }}
          className="text-[8.5px] text-accent transition-colors hover:text-ink"
        >
          Copy result
        </button>
      </div>
    </div>
  )
}

export default function Accounts() {
  const navigate = useNavigate()
  const accounts = useAppStore((state) => state.accounts)
  const activeAccountId = useAppStore((state) => state.activeAccountId)
  const setActive = useAppStore((state) => state.setActiveAccount)
  const usdIdrRate = useAppStore((state) => state.usdIdrRate)
  const rateUpdatedAt = useAppStore((state) => state.rateUpdatedAt)
  const refreshRate = useAppStore((state) => state.refreshRate)
  const journeys = useJourneyMap()
  const { journey: activeJourney } = useJourney()

  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; account?: Account } | null>(null)

  const compiled = useMemo(
    () =>
      accounts.map((account) => {
        const journey = journeys[account.id]
        return {
          account,
          balance: journey?.currentBalance ?? account.initialBalance,
          netPnl: journey?.stats.netPnl ?? 0,
          totalReturn: journey?.stats.totalReturn ?? 0,
          spark: (journey?.points ?? []).slice(-30).map((point) => point.closing),
        }
      }),
    [accounts, journeys],
  )

  const totalUsd = compiled.reduce(
    (sum, item) =>
      sum + convertCapital(item.balance, item.account.currency, 'USD', usdIdrRate, item.account.centRatio),
    0,
  )
  const totalPnlUsd = compiled.reduce(
    (sum, item) =>
      sum + convertCapital(item.netPnl, item.account.currency, 'USD', usdIdrRate, item.account.centRatio),
    0,
  )
  const totalInitialUsd = totalUsd - totalPnlUsd
  const portfolioReturn = totalInitialUsd > 0 ? (totalPnlUsd / totalInitialUsd) * 100 : 0
  const allocation = compiled.map((item) => {
    const usdValue = convertCapital(
      item.balance,
      item.account.currency,
      'USD',
      usdIdrRate,
      item.account.centRatio,
    )
    return {
      ...item,
      usdValue,
      share: totalUsd > 0 ? (usdValue / totalUsd) * 100 : 0,
    }
  })

  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader
        eyebrow="Manage · actual accounts"
        title="Accounts"
        description="Each broker account keeps its own currency, cent ratio and ledger. Balances aggregate to USD only for comparison — never for rewriting an account."
        meta={
          <div className="ml-1 flex items-center gap-1.5">
            <Badge variant="outline">{accounts.length} accounts</Badge>
            <Badge variant="accent">USD view</Badge>
          </div>
        }
        actions={
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={14} strokeWidth={1.8} />}
            onClick={() => setModal({ mode: 'create' })}
          >
            New account
          </Button>
        }
      />

      <div className="grid grid-cols-12 gap-3 lg:gap-4">
        <Panel className="col-span-12 xl:col-span-8" innerClassName="p-5">
          <PanelHeader
            title="Portfolio summary"
            subtitle="Informational USD view · converted at each funding snapshot"
            right={
              <button
                onClick={refreshRate}
                className="flex items-center gap-1.5 text-[9px] text-faint transition-colors hover:text-ink"
              >
                <RefreshCw size={10} strokeWidth={1.5} />
                {relativeTime(rateUpdatedAt)}
              </button>
            }
          />
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <div className="text-[8.5px] uppercase tracking-[0.14em] text-faint">Total value</div>
              <div className="num mt-1.5 text-[22px] font-medium leading-none text-ink">
                ${fmtNumber(totalUsd, 2)}
              </div>
              <div className="mt-1 text-[8.5px] text-faint">USD equivalent</div>
            </div>
            <div>
              <div className="text-[8.5px] uppercase tracking-[0.14em] text-faint">Combined P/L</div>
              <div
                className={cn(
                  'num mt-1.5 text-[18px] font-medium leading-none',
                  totalPnlUsd >= 0 ? 'text-profit' : 'text-loss',
                )}
              >
                {totalPnlUsd >= 0 ? '+' : '−'}${fmtNumber(Math.abs(totalPnlUsd), 2)}
              </div>
              <div className="mt-1 text-[8.5px] text-faint">net trading only</div>
            </div>
            <div>
              <div className="text-[8.5px] uppercase tracking-[0.14em] text-faint">Portfolio return</div>
              <div
                className={cn(
                  'num mt-1.5 text-[18px] font-medium leading-none',
                  portfolioReturn >= 0 ? 'text-profit' : 'text-loss',
                )}
              >
                {fmtPct(portfolioReturn)}
              </div>
              <div className="mt-1 text-[8.5px] text-faint">vs. aggregate funding</div>
            </div>
            <div>
              <div className="text-[8.5px] uppercase tracking-[0.14em] text-faint">Active account</div>
              <div className="mt-1.5 truncate text-[12px] font-medium text-ink">
                {accounts.find((item) => item.id === activeAccountId)?.name ?? '—'}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[8.5px] text-faint">
                <span className="h-1 w-1 rounded-full bg-profit" />
                {fmtMoney(activeJourney.currentBalance, accounts.find((item) => item.id === activeAccountId)?.currency ?? 'USD', { decimals: 0 })}
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-dashed border-line px-3 py-2 text-[9px] leading-relaxed text-faint">
            Aggregation uses each account&apos;s own cent ratio and the saved funding snapshot. It does not
            revalue historical balances with today&apos;s rate.
          </div>

          <div className="mt-4 border-t border-line-soft pt-3.5">
            <div className="flex items-center justify-between text-[8.5px] uppercase tracking-[0.14em] text-faint">
              <span>Allocation</span>
              <span>USD value · share</span>
            </div>
            <div className="mt-2.5 flex h-1.5 overflow-hidden rounded-full bg-elevated">
              {allocation.map((item) => (
                <div
                  key={item.account.id}
                  style={{ width: `${item.share}%`, background: item.account.accent }}
                  title={`${item.account.name} · ${item.share.toFixed(1)}%`}
                />
              ))}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {allocation.map((item) => (
                <div key={item.account.id} className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: item.account.accent }}
                    />
                    <span className="truncate text-[9px] text-muted">{item.account.name}</span>
                  </div>
                  <div className="num mt-0.5 text-[10px] text-ink">
                    ${fmtNumber(item.usdValue, 2)}
                    <span className="ml-1.5 text-[8.5px] text-faint">{item.share.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel className="col-span-12 xl:col-span-4" innerClassName="flex h-full flex-col p-5">
          <PanelHeader
            title="Exchange rate"
            subtitle="USD → IDR snapshot"
            right={<Globe size={14} strokeWidth={1.5} className="text-faint" />}
          />
          <div className="mt-4 flex items-end justify-between gap-3">
            <div>
              <div className="text-[8.5px] uppercase tracking-[0.14em] text-faint">Current rate</div>
              <div className="num mt-1.5 text-[24px] font-medium leading-none text-ink">
                {fmtRate(usdIdrRate)}
              </div>
              <div className="mt-1 text-[8.5px] text-faint">IDR per 1 USD</div>
            </div>
            <Badge variant="outline">Manual</Badge>
          </div>
          <div className="mt-4">
            <Converter />
          </div>
          <div className="mt-auto flex items-center gap-1.5 border-t border-line-soft pt-3 text-[8.5px] text-faint">
            <Landmark size={10} strokeWidth={1.5} className="text-accent" />
            Rates are saved with each funding event
          </div>
        </Panel>
      </div>

      <div className="grid gap-3 lg:grid-cols-3 lg:gap-4">
        {compiled.map((item) => (
          <AccountCard
            key={item.account.id}
            account={item.account}
            balance={item.balance}
            netPnl={item.netPnl}
            totalReturn={item.totalReturn}
            spark={item.spark}
            active={item.account.id === activeAccountId}
            onActivate={() => setActive(item.account.id)}
            onEdit={() => setModal({ mode: 'edit', account: item.account })}
            onOpen={() => navigate('/journey')}
          />
        ))}
        <button
          onClick={() => setModal({ mode: 'create' })}
          className="group flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-[20px] border border-dashed border-line bg-elevated/10 p-6 text-center transition-colors duration-300 hover:border-accent/30 hover:bg-accent/[0.02]"
        >
          <span className="grid h-11 w-11 place-items-center rounded-full border border-line bg-elevated/40 text-faint transition-colors group-hover:border-accent/30 group-hover:text-accent">
            <Plus size={19} strokeWidth={1.5} />
          </span>
          <span>
            <span className="block text-[12px] font-medium text-ink">Add a broker account</span>
            <span className="mt-1 block max-w-[220px] text-[9.5px] leading-relaxed text-faint">
              Fund in IDR or USD. Cent accounts are converted through USD into USC.
            </span>
          </span>
          <span className="flex items-center gap-1 text-[9px] text-accent">
            Create account <ArrowUpRight size={10} strokeWidth={1.5} />
          </span>
        </button>
      </div>

      <div className="grid grid-cols-12 gap-3 lg:gap-4">
        <Panel className="col-span-12 xl:col-span-7" innerClassName="p-5">
          <PanelHeader
            title="Account health"
            subtitle="Latest actual balance against each funding base"
            right={<Wallet size={14} strokeWidth={1.5} className="text-faint" />}
          />
          <div className="mt-4 space-y-4">
            {compiled.map((item) => {
              const progress =
                item.account.initialBalance > 0
                  ? (item.balance / item.account.initialBalance) * 100
                  : 0
              return (
                <div key={item.account.id}>
                  <div className="mb-1.5 flex items-center justify-between gap-3 text-[10px]">
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: item.account.accent }}
                      />
                      <span className="truncate text-muted">{item.account.name}</span>
                      {item.account.id === activeAccountId && <Badge variant="accent">Active</Badge>}
                    </span>
                    <span className="num shrink-0 text-ink">
                      {fmtMoney(item.balance, item.account.currency, { decimals: 0 })}
                      <span className="ml-1 text-faint">
                        / {fmtMoney(item.account.initialBalance, item.account.currency, { decimals: 0 })}
                      </span>
                    </span>
                  </div>
                  <Progress
                    value={Math.min(progress, 140)}
                    tone={item.balance >= item.account.initialBalance ? 'profit' : 'loss'}
                    height={5}
                  />
                  <div className="mt-1 flex items-center justify-between text-[8.5px] text-faint">
                    <span>{fmtPct(item.totalReturn)} from funding</span>
                    <span>{progress.toFixed(1)}% of base</span>
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>

        <Panel className="col-span-12 xl:col-span-5" innerClassName="flex h-full flex-col p-5">
          <PanelHeader
            title="Ledger discipline"
            subtitle="How accounts relate to the rest of the app"
          />
          <div className="mt-4 space-y-3">
            {[
              {
                icon: <ShieldCheck size={13} strokeWidth={1.5} />,
                title: 'No cross-account balance',
                body: 'Switching accounts never moves money. Each ledger recomputes from its own opening capital.',
              },
              {
                icon: <CircleDollarSign size={13} strokeWidth={1.5} />,
                title: 'Snapshot exchange rates',
                body: 'The rate used at funding is stored with the account, so later rate changes cannot rewrite history.',
              },
              {
                icon: <Hash size={13} strokeWidth={1.5} />,
                title: 'Cent ratio is explicit',
                body: 'USC is not assumed to be 100 per USD. The ratio stays visible and editable before funding.',
              },
              {
                icon: <Coins size={13} strokeWidth={1.5} />,
                title: 'External cash stays separate',
                body: 'Deposits and withdrawals are events, never trading profit. Analytics excludes them from returns.',
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-2.5 rounded-xl border border-line-soft bg-elevated/20 p-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
                  {item.icon}
                </span>
                <div>
                  <div className="text-[10.5px] font-medium text-ink">{item.title}</div>
                  <div className="mt-0.5 text-[9px] leading-relaxed text-faint">{item.body}</div>
                </div>
              </div>
            ))}
          </div>
          <InfoNote className="mt-3" title="Creating an account is not a deposit.">
            Funding is recorded as the initial capital entry with its own snapshot rate.
          </InfoNote>
        </Panel>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[9.5px] text-faint">
        <span className="flex items-center gap-1.5">
          <CalendarDays size={11} strokeWidth={1.5} />
          Account start dates anchor the Journey — no entries are accepted before funding.
        </span>
        <span>
          {fmtMoney(totalUsd, 'USD')} informational USD value
        </span>
      </div>

      {modal && (
        <AccountModal
          mode={modal.mode}
          account={modal.account}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
