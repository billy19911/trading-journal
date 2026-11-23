import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  ArrowUpRight,
  Bell,
  ChartLine,
  Check,
  ChevronDown,
  ChevronRight,
  Cloud,
  Ellipsis,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Moon,
  NotebookPen,
  RefreshCw,
  Route as RouteIcon,
  Settings,
  ShieldCheck,
  Sun,
  Target,
  Wallet,
  X,
} from 'lucide-react'
import { useActiveAccount, useAppStore } from '../store'
import { useJourneyMap } from '../hooks'
import { fmtMoney, fmtRate, relativeTime } from '../lib/format'
import { cn, IconButton, InfoNote, StatusDot, ToastViewport } from './ui'
import { AuthModal } from './AuthModal'

const NAV_GROUPS = [
  {
    label: 'Workspace',
    items: [
      { to: '/', label: 'Overview', icon: LayoutDashboard },
      { to: '/journey', label: 'Trading Journey', icon: RouteIcon },
      { to: '/journal', label: 'Daily Journal', icon: NotebookPen },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { to: '/simulator', label: 'Simulator', icon: FlaskConical, tag: 'SIM' },
      { to: '/analytics', label: 'Analytics', icon: ChartLine },
      { to: '/milestones', label: 'Milestones', icon: Target },
    ],
  },
  {
    label: 'Manage',
    items: [
      { to: '/accounts', label: 'Accounts', icon: Wallet },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

const PAGE_TITLES: Record<string, string> = Object.fromEntries(
  NAV_GROUPS.flatMap((group) => group.items.map((item) => [item.to, item.label])),
)

function initials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <div
      className="grid place-items-center rounded-[11px] border border-accent/25 bg-accent/10"
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M3.5 17.5 9.5 11l4 3.2L20.5 6"
          stroke="var(--accent)"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="20.5" cy="6" r="1.9" fill="var(--accent)" />
      </svg>
    </div>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      <div className="min-w-0">
        <div className="truncate text-[13px] font-medium tracking-[-0.02em] text-ink">
          Trading Journey
        </div>
        <div className="text-[8.5px] font-medium uppercase tracking-[0.18em] text-faint">
          Personal ledger
        </div>
      </div>
    </div>
  )
}

function AccountSwitcher({ compact = false }: { compact?: boolean }) {
  const accounts = useAppStore((state) => state.accounts)
  const setActive = useAppStore((state) => state.setActiveAccount)
  const pushToast = useAppStore((state) => state.pushToast)
  const active = useActiveAccount()
  const journeys = useJourneyMap()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const balance = journeys[active.id]?.currentBalance ?? active.initialBalance

  if (compact) {
    return (
      <div ref={ref} className="relative min-w-0">
        <button
          onClick={() => setOpen((value) => !value)}
          className="flex w-full min-w-0 items-center gap-2 rounded-full border border-line bg-elevated/50 py-1 pl-1 pr-2.5 text-left transition-colors duration-300 ease-expo hover:bg-elevated"
          aria-label="Switch account"
        >
          <span
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[8.5px] font-semibold"
            style={{ background: `color-mix(in srgb, ${active.accent} 16%, transparent)`, color: active.accent }}
          >
            {initials(active.name)}
          </span>
          <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-ink">{active.name}</span>
          <ChevronDown
            size={13}
            strokeWidth={1.5}
            className={cn('shrink-0 text-faint transition-transform duration-300', open && 'rotate-180')}
          />
        </button>
        {open && (
          <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-[272px] animate-scale-in rounded-2xl border border-line bg-surface p-1.5 shadow-[0_24px_60px_-16px_var(--shadow)]">
            <div className="px-2 pb-1.5 pt-1 text-[9px] uppercase tracking-[0.18em] text-faint">
              Accounts
            </div>
            {accounts.map((account) => {
              const amount = journeys[account.id]?.currentBalance ?? account.initialBalance
              const isActive = account.id === active.id
              return (
                <button
                  key={account.id}
                  onClick={() => {
                    setActive(account.id)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors duration-200',
                    isActive ? 'bg-elevated' : 'hover:bg-elevated/60',
                  )}
                >
                  <span
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[8.5px] font-semibold"
                    style={{
                      background: `color-mix(in srgb, ${account.accent} 14%, transparent)`,
                      color: account.accent,
                    }}
                  >
                    {initials(account.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11.5px] font-medium text-ink">
                      {account.name}
                    </span>
                    <span className="block text-[9px] uppercase tracking-[0.1em] text-faint">
                      {account.broker} · {account.type} · {account.currency}
                    </span>
                  </span>
                  <span className="num shrink-0 text-[10px] text-muted">
                    {fmtMoney(amount, account.currency, { decimals: 0 })}
                  </span>
                  {isActive && <Check size={13} strokeWidth={2} className="shrink-0 text-accent" />}
                </button>
              )
            })}
            <div className="hairline my-1.5" />
            <NavLink
              to="/accounts"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-xl px-2 py-2 text-[10.5px] text-muted transition-colors hover:bg-elevated/60 hover:text-ink"
            >
              Manage accounts
              <ArrowUpRight size={12} strokeWidth={1.5} />
            </NavLink>
          </div>
        )}
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2.5 rounded-xl border border-line bg-elevated/40 p-2 text-left transition-colors duration-300 ease-expo hover:bg-elevated/80"
        aria-label="Switch account"
      >
        <span
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[9px] font-semibold"
          style={{ background: `color-mix(in srgb, ${active.accent} 15%, transparent)`, color: active.accent }}
        >
          {initials(active.name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[11.5px] font-medium text-ink">{active.name}</span>
            <span className="num shrink-0 text-[9.5px] text-muted">
              {fmtMoney(balance, active.currency, { decimals: 0 })}
            </span>
          </span>
          <span className="mt-0.5 block text-[8.5px] uppercase tracking-[0.12em] text-faint">
            {active.broker} · {active.type} · {active.currency}
          </span>
        </span>
        <ChevronDown
          size={13}
          strokeWidth={1.5}
          className={cn('shrink-0 text-faint transition-transform duration-300', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 animate-scale-in rounded-2xl border border-line bg-surface p-1.5 shadow-[0_24px_60px_-16px_var(--shadow)]">
          <div className="px-2 pb-1.5 pt-1 text-[9px] uppercase tracking-[0.18em] text-faint">Accounts</div>
          {accounts.map((account) => {
            const amount = journeys[account.id]?.currentBalance ?? account.initialBalance
            const isActive = account.id === active.id
            return (
              <button
                key={account.id}
                onClick={() => {
                  setActive(account.id)
                  setOpen(false)
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors duration-200',
                  isActive ? 'bg-elevated' : 'hover:bg-elevated/60',
                )}
              >
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[8.5px] font-semibold"
                  style={{
                    background: `color-mix(in srgb, ${account.accent} 14%, transparent)`,
                    color: account.accent,
                  }}
                >
                  {initials(account.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11px] font-medium text-ink">{account.name}</span>
                  <span className="block text-[8.5px] uppercase tracking-[0.1em] text-faint">
                    {account.broker} · {account.type}
                  </span>
                </span>
                <span className="num shrink-0 text-[9.5px] text-muted">
                  {fmtMoney(amount, account.currency, { decimals: 0 })}
                </span>
                {isActive && <Check size={12} strokeWidth={2} className="shrink-0 text-accent" />}
              </button>
            )
          })}
          <div className="hairline my-1.5" />
          <NavLink
            to="/accounts"
            onClick={() => setOpen(false)}
            className="flex items-center justify-between rounded-xl px-2 py-2 text-[10px] text-muted transition-colors hover:bg-elevated/60 hover:text-ink"
          >
            Manage accounts
            <ArrowUpRight size={11} strokeWidth={1.5} />
          </NavLink>
        </div>
      )}
    </div>
  )
}

function Sidebar() {
  const userEmail = useAppStore((state) => state.userEmail)
  const [authOpen, setAuthOpen] = useState(false)

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-line-soft bg-[color-mix(in_srgb,var(--surface)_38%,var(--bg))] backdrop-blur-xl lg:flex">
      <div className="px-5 pb-5 pt-6">
        <NavLink to="/" aria-label="Trading Journey home">
          <Brand />
        </NavLink>
      </div>

      <div className="px-3">
        <AccountSwitcher />
      </div>

      <nav className="mt-6 flex-1 overflow-y-auto px-3 pb-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5">
            <div className="mb-2 px-3 text-[8.5px] font-medium uppercase tracking-[0.2em] text-faint">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[11.5px] transition-all duration-300 ease-expo',
                        isActive
                          ? 'bg-elevated text-ink ring-1 ring-line-soft'
                          : 'text-muted hover:bg-elevated/50 hover:text-ink',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-accent" />
                        )}
                        <Icon
                          size={16}
                          strokeWidth={1.5}
                          className={isActive ? 'text-accent' : 'text-faint group-hover:text-muted'}
                        />
                        <span className="flex-1">{item.label}</span>
                        {item.tag && (
                          <span className="rounded border border-dashed border-accent/30 px-1 py-0.5 text-[7.5px] font-medium uppercase tracking-[0.14em] text-accent/80">
                            {item.tag}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-3 border-t border-line-soft p-3">
        <div className="rounded-xl border border-dashed border-accent/20 bg-accent/[0.025] p-3">
          <div className="flex items-center gap-1.5 text-[8.5px] font-medium uppercase tracking-[0.16em] text-accent">
            <ShieldCheck size={11} strokeWidth={1.6} />
            Simulator isolated
          </div>
          <p className="mt-1.5 text-[9.5px] leading-relaxed text-faint">
            Projections never write to actual balances or the ledger.
          </p>
        </div>

        <button
          onClick={() => setAuthOpen(true)}
          className="flex w-full items-center justify-between rounded-lg px-1 py-1 text-[9.5px] text-muted transition-colors hover:text-ink"
        >
          <span className="flex items-center gap-1.5">
            <StatusDot tone="profit" pulse />
            API connected
          </span>
          <span className="flex items-center gap-1 text-faint">
            <Cloud size={11} strokeWidth={1.5} />
            Cloud
          </span>
        </button>

        <div
          onClick={() => setAuthOpen(true)}
          className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-line-soft bg-elevated/30 p-2 transition-colors hover:bg-elevated/50"
        >
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent/15 text-[9px] font-semibold text-accent">
            {userEmail ? userEmail[0].toUpperCase() : 'B'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[10.5px] font-medium text-ink">
              {userEmail ?? 'Trader'}
            </div>
            <div className="text-[8.5px] uppercase tracking-[0.12em] text-faint">
              Laravel API
            </div>
          </div>
          <IconButton
            aria-label="Account status"
            className="pointer-events-none h-7 w-7"
          >
            <LogOut size={13} strokeWidth={1.5} />
          </IconButton>
        </div>
      </div>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </aside>
  )
}

function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [read, setRead] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDoc = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const notifications = [
    {
      title: 'Milestone reached',
      body: 'Exness Gold crossed 12,500 USC.',
      time: '2 hr ago',
      tone: 'profit' as const,
    },
    {
      title: 'Journal reminder',
      body: 'Log today’s result before the session closes.',
      time: '5 hr ago',
      tone: 'accent' as const,
    },
    {
      title: 'Sync complete',
      body: '3 local changes uploaded to the cloud.',
      time: 'Yesterday',
      tone: 'neutral' as const,
    },
  ]

  return (
    <div ref={ref} className="relative">
      <IconButton
        aria-label="Notifications"
        onClick={() => {
          setOpen((value) => !value)
          setRead(true)
        }}
      >
        <Bell size={16} strokeWidth={1.5} />
        {!read && (
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent ring-2 ring-bg" />
        )}
      </IconButton>
      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[300px] animate-scale-in rounded-2xl border border-line bg-surface p-1.5 shadow-[0_24px_60px_-16px_var(--shadow)]">
          <div className="flex items-center justify-between px-2 pb-2 pt-1">
            <span className="text-[9px] uppercase tracking-[0.18em] text-faint">Notifications</span>
            <span className="text-[9px] text-faint">{notifications.length} new</span>
          </div>
          {notifications.map((notification) => (
            <div
              key={notification.title}
              className="flex gap-2.5 rounded-xl px-2 py-2.5 transition-colors hover:bg-elevated/60"
            >
              <StatusDot
                tone={
                  notification.tone === 'profit'
                    ? 'profit'
                    : notification.tone === 'accent'
                      ? 'accent'
                      : 'neutral'
                }
              />
              <div className="min-w-0">
                <div className="text-[10.5px] font-medium text-ink">{notification.title}</div>
                <div className="mt-0.5 text-[10px] leading-relaxed text-muted">{notification.body}</div>
                <div className="mt-1 text-[9px] text-faint">{notification.time}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Topbar() {
  const location = useLocation()
  const theme = useAppStore((state) => state.theme)
  const toggleTheme = useAppStore((state) => state.toggleTheme)
  const rate = useAppStore((state) => state.usdIdrRate)
  const rateUpdatedAt = useAppStore((state) => state.rateUpdatedAt)
  const refreshRate = useAppStore((state) => state.refreshRate)
  const pushToast = useAppStore((state) => state.pushToast)
  const userEmail = useAppStore((state) => state.userEmail)
  const [authOpen, setAuthOpen] = useState(false)
  const pageTitle = PAGE_TITLES[location.pathname] ?? 'Overview'

  return (
    <header className="sticky top-0 z-30 border-b border-line-soft bg-[color-mix(in_srgb,var(--bg)_84%,transparent)] backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 lg:hidden">
          <LogoMark size={30} />
        </div>
        <div className="hidden items-center gap-1.5 text-[10.5px] text-faint lg:flex">
          <span>Workspace</span>
          <ChevronRight size={11} strokeWidth={1.5} />
          <span className="text-muted">{pageTitle}</span>
        </div>

        <div className="min-w-0 flex-1 lg:hidden">
          <AccountSwitcher compact />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1.5">
          <button
            onClick={refreshRate}
            title={`Last updated ${relativeTime(rateUpdatedAt)}`}
            className="hidden items-center gap-2 rounded-full border border-line bg-elevated/40 px-3 py-1.5 text-[10px] text-muted transition-colors duration-300 hover:bg-elevated hover:text-ink md:flex"
          >
            <span className="text-faint">USD/IDR</span>
            <span className="num text-ink">{fmtRate(rate)}</span>
            <RefreshCw size={10} strokeWidth={1.5} className="text-faint" />
          </button>

          <button
            onClick={() =>
              pushToast({
                title: 'All changes synced',
                message: 'No pending operations in the outbox.',
                tone: 'success',
              })
            }
            className="hidden items-center gap-1.5 rounded-full border border-line bg-elevated/40 px-3 py-1.5 text-[10px] text-muted transition-colors hover:bg-elevated hover:text-ink sm:flex"
          >
            <StatusDot tone="profit" pulse />
            Synced
          </button>

          <IconButton
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? (
              <Sun size={16} strokeWidth={1.5} />
            ) : (
              <Moon size={16} strokeWidth={1.5} />
            )}
          </IconButton>

          <NotificationBell />

          <button
            className="ml-1 hidden items-center gap-2 border-l border-line pl-3 sm:flex"
            onClick={() => setAuthOpen(true)}
            aria-label="Open account login"
          >
            <div className="grid h-7 w-7 place-items-center rounded-full bg-accent/15 text-[9px] font-semibold text-accent">
              {userEmail ? userEmail[0].toUpperCase() : 'B'}
            </div>
          </button>
        </div>
      </div>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </header>
  )
}

function MobileNav() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const location = useLocation()
  const theme = useAppStore((state) => state.theme)
  const toggleTheme = useAppStore((state) => state.toggleTheme)
  const items = [
    { to: '/', label: 'Home', icon: LayoutDashboard },
    { to: '/journey', label: 'Journey', icon: RouteIcon },
    { to: '/simulator', label: 'Simulator', icon: FlaskConical },
    { to: '/analytics', label: 'Analytics', icon: ChartLine },
  ]
  const moreActive = ['/journal', '/milestones', '/accounts', '/settings'].includes(location.pathname)

  useEffect(() => {
    if (!sheetOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [sheetOpen])

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line-soft bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid h-16 grid-cols-5">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center gap-1 text-[8.5px] font-medium transition-colors duration-300',
                    isActive ? 'text-accent' : 'text-faint hover:text-muted',
                  )
                }
              >
                <Icon size={18} strokeWidth={1.5} />
                {item.label}
              </NavLink>
            )
          })}
          <button
            onClick={() => setSheetOpen(true)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 text-[8.5px] font-medium transition-colors',
              moreActive ? 'text-accent' : 'text-faint',
            )}
          >
            <Ellipsis size={18} strokeWidth={1.5} />
            More
          </button>
        </div>
      </nav>

      {sheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 animate-fade bg-black/55 backdrop-blur-sm"
            onClick={() => setSheetOpen(false)}
          />
          <div
            className="absolute inset-x-0 bottom-0 animate-sheet rounded-t-[26px] border-t border-line bg-surface px-5 pb-[calc(env(safe-area-inset-bottom)+24px)] pt-3"
            role="dialog"
            aria-modal="true"
            aria-label="More navigation"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-[15px] font-medium tracking-tight text-ink">More</div>
                <div className="mt-0.5 text-[10.5px] text-faint">Tools, accounts and preferences</div>
              </div>
              <IconButton aria-label="Close menu" onClick={() => setSheetOpen(false)}>
                <X size={16} strokeWidth={1.5} />
              </IconButton>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { to: '/journal', label: 'Daily Journal', icon: NotebookPen },
                { to: '/milestones', label: 'Milestones', icon: Target },
                { to: '/accounts', label: 'Accounts', icon: Wallet },
                { to: '/settings', label: 'Settings', icon: Settings },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSheetOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl border border-line bg-elevated/40 px-3 py-3 text-[11.5px] font-medium text-ink transition-colors active:bg-elevated"
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent/10 text-accent">
                      <Icon size={15} strokeWidth={1.5} />
                    </span>
                    {item.label}
                  </NavLink>
                )
              })}
            </div>

            <div className="mt-3">
              <InfoNote title="Simulations stay isolated.">
                Projections never touch actual balances, deposits or withdrawals.
              </InfoNote>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-xl border border-line px-3 py-3">
              <div className="text-[11.5px] text-muted">Appearance</div>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 rounded-full border border-line bg-elevated/50 px-3 py-1.5 text-[10.5px] text-ink"
              >
                {theme === 'dark' ? (
                  <Moon size={12} strokeWidth={1.5} />
                ) : (
                  <Sun size={12} strokeWidth={1.5} />
                )}
                {theme === 'dark' ? 'Dark' : 'Light'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function AppShell() {
  const location = useLocation()

  return (
    <div className="min-h-dvh bg-bg text-ink">
      <Sidebar />
      <div className="lg:pl-[264px]">
        <Topbar />
        <main className="mx-auto w-full max-w-[1440px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
          <div key={location.pathname} className="animate-rise">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileNav />
      <ToastViewport />
    </div>
  )
}
