import { create } from 'zustand'
import type { Account, CashEvent, JournalEntry, Milestone, SimParams } from './types'
import type { BackupPayload } from './lib/export'
import { api, getApiToken, mapAccount, setApiToken } from './lib/api'
import { initialUsdIdrRate } from './data/mock'

export type Theme = 'dark' | 'light'
export type ToastTone = 'default' | 'success' | 'error'

export interface Toast {
  id: string
  title: string
  message?: string
  tone: ToastTone
}

interface AppState {
  accounts: Account[]
  journals: Record<string, JournalEntry[]>
  cashEvents: CashEvent[]
  milestones: Milestone[]
  activeAccountId: string
  theme: Theme
  usdIdrRate: number
  rateMode: 'manual' | 'auto'
  rateUpdatedAt: string
  toasts: Toast[]
  userEmail: string | null
  token: string | null
  ready: boolean

  loginGoogle: (credential: string) => Promise<boolean>
  logout: () => Promise<void>
  fetchCloudData: () => Promise<void>

  setActiveAccount: (id: string) => void
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  addJournal: (accountId: string, entry: JournalEntry) => void
  addAccount: (account: Account) => void
  updateAccount: (account: Account) => void
  deleteAccount: (id: string) => Promise<void>
  addMilestone: (milestone: Milestone) => void
  removeMilestone: (id: string) => void
  addCashEvent: (accountId: string, event: CashEvent) => void
  restoreBackup: (backup: BackupPayload) => void
  refreshRate: () => Promise<void>
  setUsdIdrRate: (rate: number) => void
  setRateMode: (mode: 'manual' | 'auto') => Promise<void>
  pushToast: (toast: Omit<Toast, 'id' | 'tone'> & { tone?: ToastTone }) => void
  dismissToast: (id: string) => void
}

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem('tj-theme')
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    /* ignore */
  }
  return 'dark'
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  try {
    localStorage.setItem('tj-theme', theme)
  } catch {
    /* ignore */
  }
}

const initialTheme = typeof document !== 'undefined' ? readTheme() : 'dark'
if (typeof document !== 'undefined') applyTheme(initialTheme)

export const emptyAccount: Account = {
  id: '',
  name: 'Create your first account',
  broker: '—',
  accountNumber: '',
  type: 'Standard',
  currency: 'USD',
  centRatio: 1,
  initialCapital: 0,
  sourceCurrency: 'USD',
  exchangeRate: 1,
  initialBalance: 0,
  startDate: new Date().toISOString().slice(0, 10),
  dailyTarget: 1,
  status: 'Paused',
  accent: '#3B82F6',
}

export const useAppStore = create<AppState>((set, get) => ({
  accounts: [],
  journals: {},
  cashEvents: [],
  milestones: [],
  activeAccountId: '',
  theme: initialTheme,
  usdIdrRate: initialUsdIdrRate,
  rateMode: 'manual',
  rateUpdatedAt: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
  toasts: [],
  userEmail: null,
  token: getApiToken(),
  ready: false,

  loginGoogle: async (credential) => {
    try {
      const result = await api.loginGmail(credential)
      setApiToken(result.token)
      set({ token: result.token, userEmail: result.user.email })
      await get().fetchCloudData()
      get().pushToast({ title: 'Signed in with Google', message: result.user.email, tone: 'success' })
      return true
    } catch (error) {
      get().pushToast({ title: 'Google sign-in failed', message: error instanceof Error ? error.message : 'API unavailable', tone: 'error' })
      return false
    }
  },

  logout: async () => {
    try {
      if (get().token) await api.logout()
    } catch {
      /* clear local token even when API is unavailable */
    }
    setApiToken(null)
    set({ token: null, userEmail: null, accounts: [], journals: {}, cashEvents: [], milestones: [], activeAccountId: '', ready: false })
    get().pushToast({ title: 'Signed out', tone: 'success' })
  },

  fetchCloudData: async () => {
    try {
      const profile = await api.me()
      if (profile?.user?.email) {
        set({ userEmail: profile.user.email })
      }
    } catch {
      // token invalid — force logout
      setApiToken(null)
      set({ token: null, userEmail: null, ready: true })
      return
    }
    void api.latestRate().then((rateRes) => {
      set({ usdIdrRate: rateRes.rate, rateMode: rateRes.mode, rateUpdatedAt: rateRes.updated_at })
    }).catch(() => {
      /* ignore */
    })

    const accountResponse = await api.accounts()
    const cloudAccounts = accountResponse.data.map(mapAccount)
    if (cloudAccounts.length === 0) {
      set({ accounts: [], journals: {}, cashEvents: [], milestones: [], activeAccountId: '', ready: true })
      return
    }
    const accountData = await Promise.all(cloudAccounts.map(async (account) => {
      const [journalResult, transactionResult, milestoneResult] = await Promise.all([
        api.journals(account.id),
        api.transactions(account.id),
        api.milestones(account.id),
      ])
      return {
        account,
        journals: journalResult.data.map((item) => ({
          id: item.id,
          accountId: account.id,
          date: item.date,
          pnl: Number(item.pnl),
          status: item.status,
          notes: item.notes ?? undefined,
        })),
        cashEvents: transactionResult.data
          .filter((item) => item.type === 'DEPOSIT' || item.type === 'WITHDRAWAL')
          .map((item) => ({
            id: item.id,
            accountId: account.id,
            type: item.type as 'DEPOSIT' | 'WITHDRAWAL',
            amount: Number(item.amount),
            date: item.date.slice(0, 10),
            note: item.description ?? undefined,
          })),
        milestones: milestoneResult.data.map((item) => ({
          id: item.id,
          accountId: account.id,
          target: Number(item.target_balance),
          currency: item.currency_code as Account['currency'],
          createdAt: undefined,
        })),
      }
    }))
    set({
      accounts: cloudAccounts,
      journals: Object.fromEntries(accountData.map((item) => [item.account.id, item.journals])),
      cashEvents: accountData.flatMap((item) => item.cashEvents),
      milestones: accountData.flatMap((item) => item.milestones),
      activeAccountId: cloudAccounts[0].id,
      ready: true,
    })

  },

  setActiveAccount: (id) => set({ activeAccountId: id }),

  setTheme: (theme) => {
    applyTheme(theme)
    set({ theme })
  },

  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    set({ theme: next })
  },

  addJournal: (accountId, entry) => {
    set((state) => {
      const list = state.journals[accountId] ?? []
      const existing = list.findIndex((item) => item.date === entry.date)
      const next =
        existing >= 0
          ? list.map((item, index) => (index === existing ? entry : item))
          : [...list, entry].sort((a, b) => a.date.localeCompare(b.date))
      return { journals: { ...state.journals, [accountId]: next } }
    })
    get().pushToast({
      title: existingMessage(entry),
      message: `${entry.date} · ${entry.status}`,
      tone: 'success',
    })
    api
      .saveJournal(accountId, {
        journal_date: entry.date,
        daily_profit_loss: entry.pnl,
        trading_status: entry.status,
        notes: entry.notes,
      })
      .catch((error) => {
        get().pushToast({
          title: 'Cloud sync failed',
          message: error instanceof Error ? error.message : 'Save failed',
          tone: 'error',
        })
      })
  },

  addAccount: (account) => {
    set((state) => ({
      accounts: [...state.accounts, account],
      journals: { ...state.journals, [account.id]: [] },
      activeAccountId: account.id,
    }))
    get().pushToast({
      title: 'Account created',
      message: `${account.name} · ${account.currency}`,
      tone: 'success',
    })
    api
      .createAccount({
        account_name: account.name,
        broker_name: account.broker,
        account_number: account.accountNumber,
        account_type: account.type,
        currency_code: account.currency,
        source_currency: account.sourceCurrency,
        cent_ratio: account.centRatio,
        initial_capital: account.initialCapital,
        initial_exchange_rate: account.exchangeRate,
        initial_balance: account.initialBalance,
        starting_date: account.startDate,
        daily_target_percent: account.dailyTarget,
        status: account.status,
      })
      .then(({ data }) => {
        const serverId = data.id
        set((state) => ({
          accounts: state.accounts.map((a) => (a.id === account.id ? { ...a, id: serverId } : a)),
          journals: Object.fromEntries(
            Object.entries(state.journals).map(([k, v]) => [k === account.id ? serverId : k, v]),
          ),
          activeAccountId: state.activeAccountId === account.id ? serverId : state.activeAccountId,
        }))
      })
      .catch((error) => {
        get().pushToast({
          title: 'Cloud account creation failed',
          message: error instanceof Error ? error.message : 'Save failed',
          tone: 'error',
        })
      })
  },

  updateAccount: (account) => {
    set((state) => ({
      accounts: state.accounts.map((item) => (item.id === account.id ? account : item)),
    }))
    get().pushToast({
      title: 'Account updated',
      message: `${account.name} · ${account.status}`,
      tone: 'success',
    })
    api
      .updateAccount(account.id, {
        account_name: account.name,
        broker_name: account.broker,
        account_number: account.accountNumber,
        account_type: account.type,
        currency_code: account.currency,
        source_currency: account.sourceCurrency,
        cent_ratio: account.centRatio,
        initial_capital: account.initialCapital,
        initial_exchange_rate: account.exchangeRate,
        initial_balance: account.initialBalance,
        starting_date: account.startDate,
        daily_target_percent: account.dailyTarget,
        status: account.status,
      })
      .catch((error) => {
        get().pushToast({
          title: 'Cloud account update failed',
          message: error instanceof Error ? error.message : 'Save failed',
          tone: 'error',
        })
      })
  },

  deleteAccount: async (id) => {
    try {
      await api.deleteAccount(id)
      set((state) => {
        const nextJournals = { ...state.journals }
        delete nextJournals[id]
        const nextAccounts = state.accounts.filter((item) => item.id !== id)
        return {
          accounts: nextAccounts,
          journals: nextJournals,
          cashEvents: state.cashEvents.filter((item) => item.accountId !== id),
          milestones: state.milestones.filter((item) => item.accountId !== id),
          activeAccountId: state.activeAccountId === id ? (nextAccounts[0]?.id ?? '') : state.activeAccountId,
        }
      })
      get().pushToast({ title: 'Account deleted', tone: 'success' })
    } catch (error) {
      get().pushToast({
        title: 'Cloud delete failed',
        message: error instanceof Error ? error.message : 'Delete failed',
        tone: 'error',
      })
    }
  },

  addMilestone: (milestone) => {
    set((state) => ({ milestones: [...state.milestones, milestone] }))
    get().pushToast({ title: 'Milestone added', tone: 'success' })
    api
      .createMilestone(milestone.accountId, {
        target_balance: milestone.target,
        currency_code: milestone.currency,
      })
      .then(({ data }) => {
        set((state) => ({
          milestones: state.milestones.map((item) =>
            item.id === milestone.id ? { ...item, id: data.id } : item,
          ),
        }))
      })
      .catch((error) => {
        set((state) => ({ milestones: state.milestones.filter((item) => item.id !== milestone.id) }))
        get().pushToast({
          title: 'Cloud milestone creation failed',
          message: error instanceof Error ? error.message : 'Save failed',
          tone: 'error',
        })
      })
  },

  removeMilestone: (id) => {
    const milestone = get().milestones.find((item) => item.id === id)
    set((state) => ({ milestones: state.milestones.filter((item) => item.id !== id) }))
    get().pushToast({ title: 'Milestone removed', tone: 'success' })
    if (milestone) {
      api.deleteMilestone(milestone.accountId, id).catch((error) => {
        get().pushToast({
          title: 'Cloud milestone deletion failed',
          message: error instanceof Error ? error.message : 'Delete failed',
          tone: 'error',
        })
      })
    }
  },

  addCashEvent: (accountId, event) => {
    set((state) => ({ cashEvents: [...state.cashEvents, event].sort((a, b) => b.date.localeCompare(a.date)) }))
    get().pushToast({ title: event.type === 'DEPOSIT' ? 'Deposit recorded' : 'Withdrawal recorded', tone: 'success' })
    api.recordTransaction(accountId, {
      transaction_type: event.type,
      amount: event.amount,
      currency_code: get().accounts.find((account) => account.id === accountId)?.currency,
      transaction_date: event.date,
      description: event.note,
      idempotency_key: `frontend-${event.id}`,
    }).catch((error) => {
      set((state) => ({ cashEvents: state.cashEvents.filter((item) => item.id !== event.id) }))
      get().pushToast({ title: 'Cloud cash movement failed', message: error instanceof Error ? error.message : 'Save failed', tone: 'error' })
    })
  },

  restoreBackup: (backup) => {
    if (!Array.isArray(backup.accounts) || backup.accounts.length === 0) return
    set({
      accounts: backup.accounts,
      journals: backup.journals ?? {},
      cashEvents: backup.cashEvents ?? [],
      milestones: backup.milestones ?? [],
      activeAccountId: backup.accounts[0].id,
    })
    get().pushToast({
      title: 'Backup restored',
      message: `${backup.accounts.length} accounts · relationships preserved`,
      tone: 'success',
    })
  },

  refreshRate: async () => {
    try {
      const result = await api.latestRate(true)
      set({
        usdIdrRate: result.rate,
        rateMode: result.mode,
        rateUpdatedAt: result.updated_at,
      })
      get().pushToast({
        title: 'Exchange rate updated',
        message: `1 USD = ${result.rate.toLocaleString('en-US')} IDR (${result.source})`,
        tone: 'success',
      })
    } catch (error) {
      get().pushToast({
        title: 'Rate update failed',
        message: error instanceof Error ? error.message : 'API unavailable',
        tone: 'error',
      })
    }
  },

  setRateMode: async (mode) => {
    set({ rateMode: mode })
    try {
      await api.setRateMode(mode)
      if (mode === 'auto') {
        const result = await api.latestRate(true)
        set({
          usdIdrRate: result.rate,
          rateMode: 'auto',
          rateUpdatedAt: result.updated_at,
        })
        get().pushToast({
          title: 'Live rate activated',
          message: `1 USD = ${result.rate.toLocaleString('en-US')} IDR (live)`,
          tone: 'success',
        })
      } else {
        get().pushToast({
          title: 'Manual rate activated',
          message: `1 USD = ${get().usdIdrRate.toLocaleString('en-US')} IDR`,
          tone: 'success',
        })
      }
    } catch (error) {
      get().pushToast({
        title: 'Mode update failed',
        message: error instanceof Error ? error.message : 'Failed to update rate mode',
        tone: 'error',
      })
    }
  },

  setUsdIdrRate: (rate) => {
    set({ usdIdrRate: rate, rateMode: 'manual', rateUpdatedAt: new Date().toISOString() })
    get().pushToast({
      title: 'Manual rate saved',
      message: `1 USD = ${rate.toLocaleString('en-US')} IDR`,
      tone: 'success',
    })
    api.saveRate(rate).catch((error) => {
      get().pushToast({
        title: 'Cloud rate save failed',
        message: error instanceof Error ? error.message : 'Save failed',
        tone: 'error',
      })
    })
  },

  pushToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const next: Toast = {
      id,
      title: toast.title,
      message: toast.message,
      tone: toast.tone ?? 'default',
    }
    set((state) => ({ toasts: [...state.toasts, next] }))
    window.setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) }))
    }, 4200)
  },

  dismissToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) }))
  },
}))

// Auto-reconnect: if token exists, fetch cloud data on startup
if (typeof window !== 'undefined' && getApiToken()) {
  void useAppStore.getState().fetchCloudData().catch(() => {
    setApiToken(null)
    useAppStore.setState({ token: null, ready: true })
  })
} else if (typeof window !== 'undefined') {
  useAppStore.setState({ ready: true })
}

function existingMessage(entry: JournalEntry): string {
  if (entry.status === 'No Trade') return 'No-trade day saved'
  if (entry.pnl > 0) return 'Profit logged'
  if (entry.pnl < 0) return 'Loss logged'
  return 'Breakeven logged'
}

export function useActiveAccount(): Account {
  const accounts = useAppStore((state) => state.accounts)
  const activeId = useAppStore((state) => state.activeAccountId)
  return accounts.find((account) => account.id === activeId) ?? accounts[0] ?? emptyAccount
}

export interface SavedScenario {
  id: string
  name: string
  description: string
  params: Partial<SimParams>
}

export const savedScenarios: SavedScenario[] = [
  {
    id: 'scenario-base',
    name: 'Base case',
    description: '1.5% daily · 20 days · compounding',
    params: { dailyReturn: 1.5, compounding: true, tradingDays: 20 },
  },
  {
    id: 'scenario-conservative',
    name: 'Conservative',
    description: '0.5% daily · 22 days · compounding',
    params: { dailyReturn: 0.5, compounding: true, tradingDays: 22 },
  },
  {
    id: 'scenario-aggressive',
    name: 'Aggressive',
    description: '3% daily · 20 days · compounding',
    params: { dailyReturn: 3, compounding: true, tradingDays: 20 },
  },
  {
    id: 'scenario-fixed',
    name: 'Fixed lot (no compounding)',
    description: '2% daily · 20 days · simple',
    params: { dailyReturn: 2, compounding: false, tradingDays: 20 },
  },
]
