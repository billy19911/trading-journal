export type CurrencyCode = 'USC' | 'USD' | 'IDR' | 'EUR' | 'GBP'
export type AccountType = 'Standard' | 'Cent' | 'Micro' | 'Custom'
export type AccountStatus = 'Active' | 'Paused'
export type JournalStatus = 'Profit' | 'Loss' | 'Breakeven' | 'No Trade'
export type TxType =
  | 'INITIAL_CAPITAL'
  | 'TRADING_PROFIT'
  | 'TRADING_LOSS'
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'ADJUSTMENT'
  | 'REVERSAL'

export interface Account {
  id: string
  name: string
  broker: string
  accountNumber: string
  type: AccountType
  currency: CurrencyCode
  centRatio: number
  /** Capital as entered by the user, in the source currency. */
  initialCapital: number
  sourceCurrency: CurrencyCode
  /** Snapshot of the exchange rate used at account creation. */
  exchangeRate: number
  /** Opening balance in the account currency. */
  initialBalance: number
  startDate: string
  dailyTarget: number
  status: AccountStatus
  accent: string
}

export interface JournalEntry {
  id: string
  accountId: string
  date: string
  pnl: number
  status: JournalStatus
  notes?: string
  tags?: string[]
  attachment?: string
}

export interface CashEvent {
  id: string
  accountId: string
  type: 'DEPOSIT' | 'WITHDRAWAL'
  amount: number
  date: string
  note?: string
}

export interface DayPoint {
  date: string
  opening: number
  pnl: number
  closing: number
  returnPct: number
  status: JournalStatus
  hasEntry: boolean
  cashIn: number
  cashOut: number
  notes?: string
  tags?: string[]
}

export interface Transaction {
  id: string
  date: string
  type: TxType
  amount: number
  balanceAfter: number
  description: string
  sync: 'Synced' | 'Pending' | 'Failed'
}

export interface Stats {
  currentBalance: number
  netPnl: number
  totalDeposits: number
  totalWithdrawals: number
  totalReturn: number
  avgDailyReturn: number
  winningDays: number
  losingDays: number
  breakevenDays: number
  tradingDays: number
  winRate: number
  maxDrawdown: number
  bestDay: DayPoint | null
  worstDay: DayPoint | null
  currentStreak: { type: 'win' | 'loss' | 'flat'; count: number }
  profitFactor: number
  avgWin: number
  avgLoss: number
}

export interface MonthStat {
  key: string
  label: string
  opening: number
  closing: number
  pnl: number
  returnPct: number
  deposits: number
  withdrawals: number
  tradingDays: number
  wins: number
  losses: number
  maxDrawdown: number
}

export interface Milestone {
  id: string
  accountId: string
  target: number
  currency: CurrencyCode
  createdAt?: string
}

export interface SimParams {
  initial: number
  dailyReturn: number
  tradingDays: number
  months: number
  compounding: boolean
  monthlyDeposit: number
  monthlyWithdrawal: number
}

export interface SimMonth {
  month: number
  opening: number
  deposit: number
  withdrawal: number
  pnl: number
  closing: number
  returnPct: number
  drawdown: number
  tradingDays: number
  stopped: boolean
}

export interface SimResult {
  months: SimMonth[]
  final: number
  totalPnl: number
  roi: number
  maxDrawdown: number
  totalDeposits: number
  totalWithdrawals: number
  tradingDays: number
  stopped: boolean
}
