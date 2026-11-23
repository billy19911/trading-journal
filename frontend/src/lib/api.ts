import type { Account, JournalEntry, Milestone, TxType } from '../types'

const API_URL = import.meta.env.VITE_API_URL ?? '/api'
const TOKEN_KEY = 'tj-api-token'

export interface ApiUser {
  id: string
  name: string
  email: string
  timezone: string
  locale: string
}

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiAccount {
  id: string
  name?: string
  account_name?: string
  broker?: string
  broker_name?: string
  accountNumber?: string | null
  account_number?: string | null
  type?: Account['type']
  account_type?: Account['type']
  currency?: Account['currency']
  currency_code?: Account['currency']
  centRatio?: number | string
  cent_ratio?: number | string
  initialCapital?: number | string
  initial_capital?: number | string
  sourceCurrency?: Account['sourceCurrency']
  source_currency?: Account['sourceCurrency']
  exchangeRate?: number | string
  initial_exchange_rate?: number | string
  initialBalance?: number | string
  initial_balance?: number | string
  startDate?: string
  starting_date?: string
  dailyTarget?: number | string
  daily_target_percent?: number | string
  status?: Account['status']
  accent?: string
}

export interface ApiJournal extends JournalEntry {
  opening_balance: number | string
  closing_balance: number | string
  daily_return: number | string
  revision: number
}

export interface ApiTransaction {
  id: string
  account_id: string
  type: TxType
  amount: number | string
  currency: string
  date: string
  description?: string | null
  reference_id?: string | null
  revision: number
}

export interface ApiMilestone extends Milestone {
  target_balance: number | string
  currency_code: string
}

export function getApiToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setApiToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore storage failures */
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  headers.set('Content-Type', 'application/json')

  const token = getApiToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(`${API_URL}${path}`, { ...init, headers })
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>

  if (!response.ok) {
    const message = typeof body.message === 'string' ? body.message : `API request failed (${response.status})`
    throw new Error(message)
  }

  return body as T
}

function asNumber(value: number | string | undefined, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function mapAccount(input: ApiAccount): Account {
  return {
    id: input.id,
    name: input.name ?? input.account_name ?? 'Trading Account',
    broker: input.broker ?? input.broker_name ?? 'Broker',
    accountNumber: input.accountNumber ?? input.account_number ?? '',
    type: input.type ?? input.account_type ?? 'Standard',
    currency: (input.currency ?? input.currency_code ?? 'USD') as Account['currency'],
    centRatio: asNumber(input.centRatio ?? input.cent_ratio, 1),
    initialCapital: asNumber(input.initialCapital ?? input.initial_capital),
    sourceCurrency: (input.sourceCurrency ?? input.source_currency ?? 'USD') as Account['sourceCurrency'],
    exchangeRate: asNumber(input.exchangeRate ?? input.initial_exchange_rate, 1),
    initialBalance: asNumber(input.initialBalance ?? input.initial_balance),
    startDate: input.startDate ?? input.starting_date ?? new Date().toISOString().slice(0, 10),
    dailyTarget: asNumber(input.dailyTarget ?? input.daily_target_percent, 1),
    status: (input.status ?? 'Active') as Account['status'],
    accent: input.accent ?? '#3B82F6',
  }
}

export const api = {
  async register(payload: {
    name: string
    email: string
    password: string
    timezone?: string
    locale?: string
  }): Promise<{ token: string; user: ApiUser }> {
    return request('/auth/register', { method: 'POST', body: JSON.stringify(payload) })
  },

  async login(payload: { email: string; password: string; device_name?: string }): Promise<{
    token: string
    user: ApiUser
  }> {
    return request('/auth/login', { method: 'POST', body: JSON.stringify(payload) })
  },

  async loginGmail(credential: string): Promise<{
    token: string
    user: ApiUser & { picture?: string }
  }> {
    return request('/auth/google', { method: 'POST', body: JSON.stringify({ credential }) })
  },

  async me(): Promise<{ user: ApiUser }> {
    return request('/auth/me')
  },

  async logout(): Promise<void> {
    await request('/auth/logout', { method: 'POST' })
  },

  async accounts(): Promise<{ data: ApiAccount[] }> {
    return request('/accounts')
  },

  async createAccount(payload: Record<string, unknown>): Promise<ApiResponse<ApiAccount>> {
    return request('/accounts', { method: 'POST', body: JSON.stringify(payload) })
  },

  async updateAccount(id: string, payload: Record<string, unknown>): Promise<ApiResponse<ApiAccount>> {
    return request(`/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
  },

  async deleteAccount(id: string): Promise<void> {
    await request(`/accounts/${id}`, { method: 'DELETE' })
  },

  async journals(accountId: string): Promise<{ data: ApiJournal[] }> {
    return request(`/accounts/${accountId}/journals`)
  },

  async saveJournal(
    accountId: string,
    payload: { journal_date: string; daily_profit_loss: number; trading_status: string; notes?: string },
  ): Promise<ApiResponse<ApiJournal>> {
    return request(`/accounts/${accountId}/journals`, { method: 'POST', body: JSON.stringify(payload) })
  },

  async transactions(accountId: string): Promise<{ data: ApiTransaction[] }> {
    return request(`/accounts/${accountId}/transactions`)
  },

  async recordTransaction(accountId: string, payload: Record<string, unknown>): Promise<ApiResponse<ApiTransaction>> {
    return request(`/accounts/${accountId}/transactions`, { method: 'POST', body: JSON.stringify(payload) })
  },

  async milestones(accountId: string): Promise<{ data: ApiMilestone[] }> {
    return request(`/accounts/${accountId}/milestones`)
  },

  async createMilestone(accountId: string, payload: { target_balance: number; currency_code: string }): Promise<ApiResponse<ApiMilestone>> {
    return request(`/accounts/${accountId}/milestones`, { method: 'POST', body: JSON.stringify(payload) })
  },

  async deleteMilestone(accountId: string, milestoneId: string): Promise<void> {
    await request(`/accounts/${accountId}/milestones/${milestoneId}`, { method: 'DELETE' })
  },

  async latestRate(force = false): Promise<{
    base: string
    quote: string
    rate: number
    mode: 'manual' | 'auto'
    source: string
    updated_at: string
  }> {
    return request(`/exchange-rates/latest?base=USD&quote=IDR${force ? '&force=1' : ''}`)
  },

  async setRateMode(mode: 'manual' | 'auto'): Promise<ApiResponse<{ mode: 'manual' | 'auto'; provider: string; manual_rate: number | null }>> {
    return request('/exchange-rates/mode', { method: 'POST', body: JSON.stringify({ mode }) })
  },

  async saveRate(rate: number): Promise<{ data: { rate: number } }> {
    return request('/exchange-rates/manual', { method: 'POST', body: JSON.stringify({ rate }) })
  },

  async scenarios(): Promise<{ data: Array<Record<string, unknown>> }> {
    return request('/scenarios')
  },

  async createScenario(payload: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> {
    return request('/scenarios', { method: 'POST', body: JSON.stringify(payload) })
  },

  async deleteScenario(id: string): Promise<void> {
    await request(`/scenarios/${id}`, { method: 'DELETE' })
  },
}
