import { useRef, useState, type ReactNode } from 'react'
import {
  ArrowLeftRight,
  BadgeDollarSign,
  Check,
  CircleCheck,
  Cloud,
  CloudOff,
  Database,
  Download,
  FileDown,
  FileSpreadsheet,
  Globe,
  HardDriveDownload,
  KeyRound,
  Languages,
  Laptop,
  Lock,
  Monitor,
  Moon,
  Palette,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Sun,
  Tablet,
  Trash,
  Upload,
  Users,
} from 'lucide-react'
import { useAppStore, type Theme } from '../store'
import { useJourney } from '../hooks'
import { backupAll, exportAccountJson, exportJournalsCsv, type BackupPayload } from '../lib/export'
import { fmtDate, fmtNumber, fmtRate, relativeTime, todayISO } from '../lib/format'
import {
  cn,
  Badge,
  Button,
  Field,
  Input,
  Modal,
  PageHeader,
  Panel,
  PanelHeader,
  Segmented,
  Select,
  StatusDot,
  Toggle,
} from '../components/ui'
import type { CurrencyCode } from '../types'

function useLocalChoice<T extends string>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored) return stored as T
    } catch {
      /* ignore */
    }
    return initial
  })
  const update = (next: T) => {
    setValue(next)
    try {
      localStorage.setItem(key, next)
    } catch {
      /* ignore */
    }
  }
  return [value, update] as const
}

function SectionRow({
  icon,
  title,
  description,
  children,
  stack = false,
}: {
  icon: ReactNode
  title: string
  description?: string
  children: ReactNode
  stack?: boolean
}) {
  return (
    <div
      className={cn(
        'flex gap-3 border-b border-line-soft py-3.5 last:border-0 last:pb-0 first:pt-0',
        stack ? 'flex-col sm:flex-row sm:items-start' : 'items-center',
      )}
    >
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-line bg-elevated/40 text-faint">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-medium text-ink">{title}</div>
        {description && <div className="mt-0.5 text-[9.5px] leading-relaxed text-faint">{description}</div>}
      </div>
      <div className={cn('shrink-0', stack ? 'w-full sm:w-auto' : '')}>{children}</div>
    </div>
  )
}

const DEVICES = [
  {
    id: 'device-windows',
    name: 'Windows · Chrome',
    meta: 'Jakarta, ID · current device',
    icon: Monitor,
    current: true,
    last: 'Active now',
  },
  {
    id: 'device-android',
    name: 'Android · PWA',
    meta: 'Jakarta, ID · last active 2 days ago',
    icon: Smartphone,
    current: false,
    last: '2 days ago',
  },
  {
    id: 'device-ipad',
    name: 'iPad · Safari',
    meta: 'Bandung, ID · last active Oct 30',
    icon: Tablet,
    current: false,
    last: 'Oct 30',
  },
]

function ThemeOption({
  value,
  active,
  onSelect,
  label,
  swatches,
}: {
  value: Theme
  active: boolean
  onSelect: () => void
  label: string
  swatches: string[]
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={cn(
        'group relative flex-1 overflow-hidden rounded-xl border p-2.5 text-left transition-all duration-300 ease-expo',
        active
          ? 'border-accent/40 bg-accent/[0.05] shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_20%,transparent)]'
          : 'border-line bg-elevated/20 hover:border-line hover:bg-elevated/40',
      )}
    >
      <div
        className="relative h-[70px] overflow-hidden rounded-lg border"
        style={{ background: swatches[0], borderColor: swatches[3] }}
      >
        <div className="absolute inset-y-0 left-0 w-[22%] border-r" style={{ background: swatches[1], borderColor: swatches[3] }} />
        <div className="absolute left-[28%] right-2 top-2 space-y-1.5">
          <div className="h-1.5 w-1/2 rounded-full" style={{ background: swatches[4] }} />
          <div className="h-1 w-2/3 rounded-full" style={{ background: swatches[3] }} />
          <div className="mt-2 flex gap-1">
            <div className="h-7 flex-1 rounded" style={{ background: swatches[2], border: `1px solid ${swatches[3]}` }} />
            <div className="h-7 flex-1 rounded" style={{ background: swatches[2], border: `1px solid ${swatches[3]}` }} />
          </div>
          <div className="h-3 w-1/3 rounded-full" style={{ background: swatches[5] }} />
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between px-0.5">
        <span className="flex items-center gap-1.5 text-[10.5px] font-medium text-ink">
          {value === 'dark' ? <Moon size={11} strokeWidth={1.6} /> : <Sun size={11} strokeWidth={1.6} />}
          {label}
        </span>
        {active ? (
          <span className="grid h-4 w-4 place-items-center rounded-full bg-accent text-white">
            <Check size={9} strokeWidth={2.5} />
          </span>
        ) : (
          <span className="h-4 w-4 rounded-full border border-line" />
        )}
      </div>
    </button>
  )
}

export default function Settings() {
  const theme = useAppStore((state) => state.theme)
  const setTheme = useAppStore((state) => state.setTheme)
  const rate = useAppStore((state) => state.usdIdrRate)
  const rateUpdatedAt = useAppStore((state) => state.rateUpdatedAt)
  const setRate = useAppStore((state) => state.setUsdIdrRate)
  const refreshRate = useAppStore((state) => state.refreshRate)
  const pushToast = useAppStore((state) => state.pushToast)
  const accounts = useAppStore((state) => state.accounts)
  const journals = useAppStore((state) => state.journals)
  const cashEvents = useAppStore((state) => state.cashEvents)
  const milestones = useAppStore((state) => state.milestones)
  const restoreBackup = useAppStore((state) => state.restoreBackup)
  const fetchCloudData = useAppStore((state) => state.fetchCloudData)
  const { account, journey } = useJourney()

  const [language, setLanguage] = useLocalChoice<string>('tj-language', 'en')
  const [displayCurrency, setDisplayCurrency] = useLocalChoice<CurrencyCode | 'account'>(
    'tj-display-currency',
    'account',
  )
  const [rateProvider, setRateProvider] = useLocalChoice<string>('tj-rate-provider', 'manual')
  const [rateMode, setRateMode] = useLocalChoice<'manual' | 'automatic'>('tj-rate-mode', 'manual')
  const [refreshInterval, setRefreshInterval] = useLocalChoice<string>('tj-rate-interval', 'daily')
  const [rateDraft, setRateDraft] = useState(String(rate))
  const [autoSync, setAutoSync] = useLocalChoice<'on' | 'off'>('tj-auto-sync', 'on')
  const [syncInterval, setSyncInterval] = useLocalChoice<string>('tj-sync-interval', 'realtime')
  const [devices, setDevices] = useState(DEVICES)
  const [twoFactor, setTwoFactor] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useLocalChoice<string>('tj-session-timeout', '60')
  const [restoreName, setRestoreName] = useState<string | null>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleRateSave = () => {
    const parsed = Number(rateDraft.replace(/,/g, ''))
    if (!Number.isFinite(parsed) || parsed < 1000 || parsed > 100000) {
      pushToast({
        title: 'Rate looks off',
        message: 'Enter a plausible USD/IDR rate between 1,000 and 100,000.',
        tone: 'error',
      })
      return
    }
    setRate(parsed)
  }

  const handleBackup = () => {
    backupAll(accounts, journals, cashEvents, milestones)
    pushToast({
      title: 'Backup downloaded',
      message: `${accounts.length} accounts · journals, cash events and milestones`,
      tone: 'success',
    })
  }

  const handleRestore = async (file: File) => {
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as BackupPayload
      if (!parsed || !Array.isArray(parsed.accounts) || parsed.accounts.length === 0) {
        throw new Error('Invalid backup')
      }
      restoreBackup(parsed)
      setRestoreName(file.name)
    } catch {
      pushToast({
        title: 'Restore failed',
        message: 'The file is not a valid Trading Journey backup.',
        tone: 'error',
      })
    }
  }

  const handleReset = () => {
    void fetchCloudData()
    setRestoreName(null)
    setResetOpen(false)
    pushToast({
      title: 'Data re-synced from server',
      message: 'All local data refreshed from cloud.',
      tone: 'success',
    })
  }

  const handleExportCsv = () => {
    exportJournalsCsv(account, journals[account.id] ?? [])
    pushToast({ title: 'CSV downloaded', message: `${account.name} journal history`, tone: 'success' })
  }

  const handleExportJson = () => {
    exportAccountJson(
      account,
      journals[account.id] ?? [],
      cashEvents.filter((event) => event.accountId === account.id),
      journey.transactions,
    )
    pushToast({ title: 'JSON downloaded', message: `${account.name} full account record`, tone: 'success' })
  }

  const activeDevices = devices.filter((device) => !device.current).length

  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader
        eyebrow="Manage · preferences"
        title="Settings"
        description="Appearance, regional preferences, exchange rates, sync and data controls. Changes here never alter journal entries or account history."
        meta={
          <div className="ml-1 flex items-center gap-1.5">
            <Badge variant="outline">Local profile</Badge>
            <Badge variant="neutral">Prototype</Badge>
          </div>
        }
        actions={
          <>
            <Button
              variant="secondary"
              size="sm"
              icon={<Upload size={13} strokeWidth={1.5} />}
              onClick={() => fileRef.current?.click()}
            >
              Restore
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Download size={13} strokeWidth={1.5} />}
              onClick={handleBackup}
            >
              Backup
            </Button>
          </>
        }
      />

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void handleRestore(file)
          event.target.value = ''
        }}
      />

      <div className="grid grid-cols-12 gap-3 lg:gap-4">
        <Panel className="col-span-12 xl:col-span-7" innerClassName="p-5">
          <PanelHeader
            title="Appearance"
            subtitle="Theme applies instantly and persists on this device"
            right={<Palette size={14} strokeWidth={1.5} className="text-faint" />}
          />
          <div className="mt-4 flex gap-2.5">
            <ThemeOption
              value="dark"
              active={theme === 'dark'}
              onSelect={() => setTheme('dark')}
              label="Dark"
              swatches={['#0b0f14', '#10161f', '#151d28', '#222c39', '#e8ecf2', '#3b82f6']}
            />
            <ThemeOption
              value="light"
              active={theme === 'light'}
              onSelect={() => setTheme('light')}
              label="Light"
              swatches={['#f4f5f7', '#ffffff', '#f5f7fa', '#e1e5eb', '#0c1420', '#2563eb']}
            />
          </div>

          <div className="mt-4 border-t border-line-soft pt-1">
            <SectionRow
              icon={<Languages size={13} strokeWidth={1.5} />}
              title="Language"
              description="Copy is English in this prototype. Locale formatting is wired to English (US)."
            >
              <Select
                value={language}
                onChange={(event) => {
                  setLanguage(event.target.value)
                  pushToast({
                    title: 'Language preference saved',
                    message: event.target.value === 'id' ? 'Bahasa Indonesia arrives with localization.' : 'English (US)',
                  })
                }}
                className="w-[168px] py-1.5 text-[10px]"
              >
                <option value="en">English (US)</option>
                <option value="id">Bahasa Indonesia</option>
              </Select>
            </SectionRow>

            <SectionRow
              icon={<Globe size={13} strokeWidth={1.5} />}
              title="Display currency"
              description="Account-native amounts stay canonical. Display preference only affects summaries."
            >
              <Select
                value={displayCurrency}
                onChange={(event) => {
                  setDisplayCurrency(event.target.value as CurrencyCode | 'account')
                  pushToast({ title: 'Display preference saved', message: 'Account-native values remain unchanged.' })
                }}
                className="w-[168px] py-1.5 text-[10px]"
              >
                <option value="account">Account native</option>
                <option value="USD">USD (converted)</option>
                <option value="IDR">IDR (converted)</option>
              </Select>
            </SectionRow>

            <SectionRow
              icon={<BadgeDollarSign size={13} strokeWidth={1.5} />}
              title="Number format"
              description="Thousands separator and decimals follow account currency."
            >
              <span className="num rounded-full border border-line bg-elevated/40 px-2.5 py-1 text-[9.5px] text-muted">
                1,234.56
              </span>
            </SectionRow>
          </div>
        </Panel>

        <Panel className="col-span-12 xl:col-span-5" innerClassName="p-5">
          <PanelHeader
            title="Exchange rate"
            subtitle="USD → IDR · stored with each funding event"
            right={
              <button
                onClick={refreshRate}
                className="flex items-center gap-1 text-[9px] text-faint transition-colors hover:text-ink"
              >
                <RefreshCw size={10} strokeWidth={1.5} />
                {relativeTime(rateUpdatedAt)}
              </button>
            }
          />
          <div className="mt-4 rounded-xl border border-line-soft bg-elevated/30 p-4">
            <div className="flex items-end justify-between gap-2">
              <div>
                <div className="text-[8.5px] uppercase tracking-[0.14em] text-faint">Active rate</div>
                <div className="num mt-1.5 text-[26px] font-medium leading-none text-ink">
                  {fmtRate(rate)}
                </div>
                <div className="mt-1 text-[8.5px] text-faint">IDR per 1 USD</div>
              </div>
              <Badge variant={rateMode === 'manual' ? 'outline' : 'accent'}>
                {rateMode === 'manual' ? 'Manual' : 'Automatic'}
              </Badge>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-[8.5px] text-faint">
              <ArrowLeftRight size={9.5} strokeWidth={1.5} />
              1 USC = {fmtNumber(rate / 100, 0)} IDR at a 100:1 cent ratio
            </div>
          </div>

          <div className="mt-4 border-t border-line-soft pt-1">
            <SectionRow
              icon={<RefreshCw size={13} strokeWidth={1.5} />}
              title="Rate mode"
              description="Manual for the prototype. Auto refresh needs a provider."
            >
              <Segmented
                value={rateMode}
                onChange={(value) => {
                  setRateMode(value)
                  if (value === 'automatic') {
                    pushToast({
                      title: 'Automatic mode queued',
                      message: 'Provider sync arrives with the backend. Manual rate stays active.',
                    })
                  }
                }}
                size="sm"
                options={[
                  { value: 'manual', label: 'Manual' },
                  { value: 'automatic', label: 'Auto' },
                ]}
              />
            </SectionRow>

            <SectionRow
              icon={<Globe size={13} strokeWidth={1.5} />}
              title="Provider"
              description="Where the automatic rate would come from."
            >
              <Select
                value={rateProvider}
                onChange={(event) => setRateProvider(event.target.value)}
                className="w-[142px] py-1.5 text-[10px]"
              >
                <option value="manual">Manual entry</option>
                <option value="exchangerate">exchangerate.host</option>
                <option value="bank">Bank Indonesia</option>
              </Select>
            </SectionRow>

            <SectionRow
              icon={<RefreshCw size={13} strokeWidth={1.5} />}
              title="Refresh interval"
              description="Automatic fetch cadence once connected."
            >
              <Select
                value={refreshInterval}
                onChange={(event) => setRefreshInterval(event.target.value)}
                className="w-[142px] py-1.5 text-[10px]"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </Select>
            </SectionRow>

            <div className="mt-3 flex items-end gap-2">
              <Field label="Manual rate" className="flex-1">
                <Input
                  inputMode="decimal"
                  value={rateDraft}
                  onChange={(event) => setRateDraft(event.target.value)}
                  className="num text-[11.5px]"
                />
              </Field>
              <Button variant="secondary" size="sm" icon={<Check size={13} strokeWidth={1.8} />} onClick={handleRateSave}>
                Save
              </Button>
            </div>
            <div className="mt-2 text-[8.5px] leading-relaxed text-faint">
              Historical funding snapshots are never rewritten by a new rate.
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-12 gap-3 lg:gap-4">
        <Panel className="col-span-12 xl:col-span-7" innerClassName="p-5">
          <PanelHeader
            title="Sync & devices"
            subtitle="Cloud copy is separate from the local ledger"
            right={
              <span className="flex items-center gap-1.5 text-[9.5px] text-profit">
                <StatusDot tone="profit" pulse /> Connected
              </span>
            }
          />
          <div className="mt-4">
            <SectionRow
              icon={<Cloud size={13} strokeWidth={1.5} />}
              title="Automatic sync"
              description="Queue local changes and upload them when online."
            >
              <Toggle
                checked={autoSync === 'on'}
                onChange={(value) => {
                  setAutoSync(value ? 'on' : 'off')
                  pushToast({
                    title: value ? 'Auto sync enabled' : 'Auto sync paused',
                    message: value ? 'Local changes will upload in the background.' : 'Changes stay local until you sync.',
                  })
                }}
                label="Automatic sync"
              />
            </SectionRow>

            <SectionRow
              icon={<RefreshCw size={13} strokeWidth={1.5} />}
              title="Sync interval"
              description="Prototype sync is simulated — no network calls are made."
            >
              <Select
                value={syncInterval}
                onChange={(event) => setSyncInterval(event.target.value)}
                className="w-[150px] py-1.5 text-[10px]"
              >
                <option value="realtime">Real time</option>
                <option value="5min">Every 5 minutes</option>
                <option value="hourly">Hourly</option>
                <option value="manual">Manual only</option>
              </Select>
            </SectionRow>

            <SectionRow
              icon={<Database size={13} strokeWidth={1.5} />}
              title="Outbox"
              description="No pending operations. Every local change is committed."
            >
              <Button
                variant="secondary"
                size="xs"
                icon={<RefreshCw size={11} strokeWidth={1.6} />}
                onClick={() =>
                  pushToast({
                    title: 'Sync complete',
                    message: '0 pending changes · cloud copy is current.',
                    tone: 'success',
                  })
                }
              >
                Sync now
              </Button>
            </SectionRow>
          </div>

          <div className="mt-4 border-t border-line-soft pt-3.5">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-faint">
                Devices · {devices.length}
              </div>
              <span className="text-[8.5px] text-faint">{activeDevices} other sessions</span>
            </div>
            <div className="mt-2.5 space-y-1.5">
              {devices.map((device) => {
                const Icon = device.icon
                return (
                  <div
                    key={device.id}
                    className="flex items-center gap-3 rounded-xl border border-line-soft bg-elevated/20 px-3 py-2.5"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-elevated text-faint">
                      <Icon size={13} strokeWidth={1.5} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-[10.5px] text-ink">{device.name}</span>
                        {device.current && <Badge variant="accent">This device</Badge>}
                      </div>
                      <div className="mt-0.5 truncate text-[8.5px] text-faint">{device.meta}</div>
                    </div>
                    <span className="hidden text-[8.5px] text-faint sm:block">{device.last}</span>
                    {!device.current && (
                      <button
                        onClick={() => {
                          setDevices((current) => current.filter((item) => item.id !== device.id))
                          pushToast({
                            title: 'Device signed out',
                            message: `${device.name} will need to sign in again.`,
                            tone: 'success',
                          })
                        }}
                        aria-label={`Sign out ${device.name}`}
                        className="grid h-6 w-6 place-items-center rounded-md text-faint transition-colors hover:bg-loss/10 hover:text-loss"
                      >
                        <Trash size={11.5} strokeWidth={1.5} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
            {activeDevices === 0 && (
              <div className="mt-2 flex items-center gap-1.5 text-[9px] text-faint">
                <CloudOff size={10} strokeWidth={1.5} />
                Only this device remains signed in.
              </div>
            )}
          </div>
        </Panel>

        <Panel className="col-span-12 xl:col-span-5" innerClassName="p-5">
          <PanelHeader
            title="Security"
            subtitle="Frontend settings now; backend enforcement in Phase 1"
            right={<ShieldCheck size={14} strokeWidth={1.5} className="text-faint" />}
          />
          <div className="mt-4">
            <SectionRow
              icon={<Lock size={13} strokeWidth={1.5} />}
              title="Two-factor authentication"
              description="Placeholder switch. TOTP setup requires the auth backend."
            >
              <Toggle
                checked={twoFactor}
                onChange={(value) => {
                  setTwoFactor(value)
                  pushToast({
                    title: value ? '2FA preference noted' : '2FA disabled',
                    message: value
                      ? 'Enrollment is not available until authentication is wired.'
                      : 'Preference saved locally.',
                    tone: value ? 'default' : 'success',
                  })
                }}
                label="Two-factor authentication"
              />
            </SectionRow>

            <SectionRow
              icon={<KeyRound size={13} strokeWidth={1.5} />}
              title="Password"
              description="Last changed 32 days ago · managed by the backend later."
            >
              <Button
                variant="secondary"
                size="xs"
                onClick={() =>
                  pushToast({
                    title: 'Password change unavailable',
                    message: 'Password hashing and rotation arrive with the Laravel Phase 1 build.',
                  })
                }
              >
                Change
              </Button>
            </SectionRow>

            <SectionRow
              icon={<Users size={13} strokeWidth={1.5} />}
              title="Session timeout"
              description="Inactivity before the local session locks."
            >
              <Select
                value={sessionTimeout}
                onChange={(event) => setSessionTimeout(event.target.value)}
                className="w-[112px] py-1.5 text-[10px]"
              >
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
              </Select>
            </SectionRow>

            <SectionRow
              icon={<ShieldCheck size={13} strokeWidth={1.5} />}
              title="Audit trail"
              description="Every journal revision is append-only by design. Backend audit log ships with Phase 1."
            >
              <Badge variant="outline">Planned</Badge>
            </SectionRow>
          </div>

          <Button
            variant="danger"
            size="sm"
            className="mt-4 w-full"
            icon={<Lock size={12.5} strokeWidth={1.6} />}
            onClick={() =>
              pushToast({
                title: 'All sessions would be revoked',
                message: 'Session revocation is a backend action in Phase 1.',
              })
            }
          >
            Sign out all other devices
          </Button>
        </Panel>
      </div>

      <Panel innerClassName="p-5">
        <PanelHeader
          title="Data & backup"
          subtitle="Export CSV or JSON, restore a full backup, or reset the demo"
          right={<Database size={14} strokeWidth={1.5} className="text-faint" />}
        />

        <div className="mt-4 grid gap-2.5 md:grid-cols-3">
          {[
            {
              icon: <FileSpreadsheet size={17} strokeWidth={1.4} />,
              title: 'Journal CSV',
              body: `${account.name} · daily entries, tags and notes`,
              action: handleExportCsv,
              label: 'Download CSV',
            },
            {
              icon: <FileDown size={17} strokeWidth={1.4} />,
              title: 'Account JSON',
              body: 'Account, journals, cash events and the ledger',
              action: handleExportJson,
              label: 'Download JSON',
            },
            {
              icon: <HardDriveDownload size={17} strokeWidth={1.4} />,
              title: 'Full backup',
              body: `${accounts.length} accounts · all relationships preserved`,
              action: handleBackup,
              label: 'Download backup',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex flex-col rounded-xl border border-line bg-elevated/20 p-4 transition-colors hover:bg-elevated/40"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/10 text-accent">
                {item.icon}
              </span>
              <div className="mt-2.5 text-[11px] font-medium text-ink">{item.title}</div>
              <div className="mt-1 flex-1 text-[9px] leading-relaxed text-faint">{item.body}</div>
              <button
                onClick={item.action}
                className="mt-3 flex items-center gap-1.5 self-start text-[9.5px] text-accent transition-colors hover:text-ink"
              >
                {item.label}
                <Download size={10} strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-3 grid gap-2.5 md:grid-cols-2">
          <div className="rounded-xl border border-dashed border-line p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-[10.5px] font-medium text-ink">
                  <Upload size={12} strokeWidth={1.5} className="text-faint" />
                  Restore from backup
                </div>
                <div className="mt-1 text-[9px] leading-relaxed text-faint">
                  Accepts a JSON backup. Accounts, journals, cash events and milestones are restored
                  together.
                </div>
              </div>
              <Button
                variant="secondary"
                size="xs"
                onClick={() => fileRef.current?.click()}
              >
                Choose file
              </Button>
            </div>
            {restoreName && (
              <div className="mt-2.5 flex items-center gap-1.5 text-[9px] text-profit">
                <CircleCheck size={10} strokeWidth={1.7} />
                Restored {restoreName}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-loss/20 bg-loss/[0.02] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 text-[10.5px] font-medium text-ink">
                  <RotateCcw size={12} strokeWidth={1.5} className="text-loss" />
                  Reset demo data
                </div>
                <div className="mt-1 text-[9px] leading-relaxed text-faint">
                  Restores the seeded accounts, journals and targets. This cannot be undone.
                </div>
              </div>
              <Button variant="danger" size="xs" onClick={() => setResetOpen(true)}>
                Reset
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line-soft px-3 py-2.5 text-[8.5px] text-faint">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={10} strokeWidth={1.5} className="text-accent" />
            Exports include everything needed to rebuild balances from the ledger.
          </span>
          <span className="num">Snapshot {fmtDate(todayISO(), 'medium')}</span>
        </div>
      </Panel>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line-soft px-4 py-3 text-[9px] text-faint">
        <span className="flex items-center gap-1.5">
          <Laptop size={11} strokeWidth={1.5} />
          Prototype stores state in memory. Theme and preferences persist locally, journal edits reset on
          reload.
        </span>
        <span className="flex items-center gap-1.5">
          <InfoDot /> Phase 1 adds PostgreSQL, authentication and real sync.
        </span>
      </div>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset demo data?"
        description="Every locally added journal, account and milestone is discarded."
        footer={
          <div className="flex items-center justify-between gap-3">
            <span className="text-[9px] text-faint">Seeded ledger will be restored exactly.</span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setResetOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={<RotateCcw size={12.5} strokeWidth={1.6} />}
                onClick={handleReset}
              >
                Reset everything
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-3 text-[10.5px] leading-relaxed text-muted">
          <p>
            The seeded data includes three accounts, their journal history, cash events and configured
            milestones. It is the same state you saw on first load.
          </p>
          <div className="rounded-xl border border-loss/20 bg-loss/5 px-3.5 py-2.5 text-[9.5px] text-loss">
            Export a backup first if you want to keep any local changes.
          </div>
        </div>
      </Modal>
    </div>
  )
}

function InfoDot() {
  return <span className="inline-block h-1 w-1 rounded-full bg-accent" />
}
