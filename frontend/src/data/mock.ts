import type {
  Account,
  CashEvent,
  CurrencyCode,
  JournalEntry,
  JournalStatus,
  Milestone,
} from '../types'
import { convertCapital } from '../lib/currency'
import { parseISO, toISO } from '../lib/format'

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

export const initialUsdIdrRate = 16700

function mulberry32(seed: number) {
  let a = seed >>> 0
  return function random() {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const NOTES = [
  'London breakout on gold. Followed the plan, no early exit.',
  'News spike stopped me out. Size was too large for the setup.',
  'Clean scalps in the first two hours, then stepped away.',
  'Revenge trade after the morning loss. Needs work.',
  'Range day — waited for confirmation and took one A+ setup.',
  'Held through the FOMC release. Risky, but risk was defined.',
  'Missed the first entry, forced a second one. Lesson logged.',
  'Quiet session. Took one setup and closed the terminal.',
  'Let the winner run to the next liquidity pocket. Best execution this week.',
  'Cut the loser fast. Process was right, outcome was noise.',
  'Overtraded the afternoon session. Discipline slipped.',
  'Pre-market plan was clear. Executed exactly as written.',
  'Choppy conditions — reduced size and protected the account.',
  'Partial at 1R, trailed the rest. Textbook trade management.',
  'Two losses in a row, then stopped for the day. Good risk control.',
]

const TAGS = ['Gold', 'Breakout', 'News', 'Discipline', 'Overtrade', 'Scalp', 'Risk', 'London', 'NY session']

function pick<T>(list: T[], rng: () => number): T {
  return list[Math.floor(rng() * list.length)]
}

interface GeneratorConfig {
  accountId: string
  seed: number
  start: string
  end: string
  initial: number
  noTrade: number
  win: number
  loss: number
  winRange: [number, number]
  lossRange: [number, number]
}

function generateJournals(config: GeneratorConfig): JournalEntry[] {
  const rng = mulberry32(config.seed)
  const metaRng = mulberry32(config.seed + 97)
  const entries: JournalEntry[] = []
  let balance = config.initial

  const cursor = parseISO(config.start)
  const end = parseISO(config.end)

  while (cursor <= end) {
    const dow = cursor.getDay()
    if (dow !== 0 && dow !== 6) {
      const date = toISO(cursor)
      const roll = rng()
      let pnl = 0
      let status: JournalStatus = 'No Trade'

      if (roll < config.noTrade) {
        status = 'No Trade'
      } else if (roll < config.noTrade + config.win) {
        const pct =
          config.winRange[0] + rng() * (config.winRange[1] - config.winRange[0])
        pnl = round2(balance * pct)
        status = 'Profit'
      } else if (roll < config.noTrade + config.win + config.loss) {
        const pct =
          config.lossRange[0] + rng() * (config.lossRange[1] - config.lossRange[0])
        pnl = -round2(balance * pct)
        status = 'Loss'
      } else {
        status = 'Breakeven'
      }

      const noteRoll = metaRng()
      const tagRoll = metaRng()
      let notes: string | undefined
      if (status === 'No Trade') {
        notes = noteRoll < 0.35 ? 'No setup — stayed flat.' : undefined
      } else if (noteRoll < 0.44) {
        notes = pick(NOTES, metaRng)
      }

      const tags = tagRoll < 0.52 ? [pick(TAGS, metaRng)] : undefined

      entries.push({
        id: `j-${config.accountId}-${date}`,
        accountId: config.accountId,
        date,
        pnl,
        status,
        notes,
        tags,
      })

      balance = round2(balance + pnl)
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return entries
}

const goldInitial = round2(
  convertCapital(1670000, 'IDR', 'USC', initialUsdIdrRate, 100),
)

export const accountsSeed: Account[] = [
  {
    id: 'acc-gold',
    name: 'Exness Gold',
    broker: 'Exness',
    accountNumber: '7021 884',
    type: 'Cent',
    currency: 'USC',
    centRatio: 100,
    initialCapital: 1670000,
    sourceCurrency: 'IDR',
    exchangeRate: initialUsdIdrRate,
    initialBalance: goldInitial,
    startDate: '2026-08-03',
    dailyTarget: 1.0,
    status: 'Active',
    accent: '#3B82F6',
  },
  {
    id: 'acc-btc',
    name: 'Exness BTC',
    broker: 'Exness',
    accountNumber: '7021 992',
    type: 'Standard',
    currency: 'USD',
    centRatio: 1,
    initialCapital: 500,
    sourceCurrency: 'USD',
    exchangeRate: 1,
    initialBalance: 500,
    startDate: '2026-09-01',
    dailyTarget: 0.8,
    status: 'Active',
    accent: '#F59E0B',
  },
  {
    id: 'acc-hfm',
    name: 'HFM Gold',
    broker: 'HFM',
    accountNumber: '4410 207',
    type: 'Standard',
    currency: 'USD',
    centRatio: 1,
    initialCapital: 1000,
    sourceCurrency: 'USD',
    exchangeRate: 1,
    initialBalance: 1000,
    startDate: '2026-08-17',
    dailyTarget: 0.7,
    status: 'Active',
    accent: '#8B5CF6',
  },
]

const configs: GeneratorConfig[] = [
  {
    accountId: 'acc-gold',
    seed: 20260803,
    start: '2026-08-03',
    end: '2026-11-21',
    initial: goldInitial,
    noTrade: 0.05,
    win: 0.6,
    loss: 0.28,
    winRange: [0.004, 0.018],
    lossRange: [0.002, 0.011],
  },
  {
    accountId: 'acc-btc',
    seed: 20260901,
    start: '2026-09-01',
    end: '2026-11-21',
    initial: 500,
    noTrade: 0.06,
    win: 0.54,
    loss: 0.3,
    winRange: [0.004, 0.014],
    lossRange: [0.003, 0.01],
  },
  {
    accountId: 'acc-hfm',
    seed: 20260817,
    start: '2026-08-17',
    end: '2026-11-21',
    initial: 1000,
    noTrade: 0.08,
    win: 0.44,
    loss: 0.38,
    winRange: [0.003, 0.011],
    lossRange: [0.004, 0.015],
  },
]

export const journalsSeed: Record<string, JournalEntry[]> = Object.fromEntries(
  configs.map((config) => [config.accountId, generateJournals(config)]),
)

export const cashEventsSeed: CashEvent[] = [
  {
    id: 'ce-gold-1',
    accountId: 'acc-gold',
    type: 'DEPOSIT',
    amount: 1000,
    date: '2026-09-15',
    note: 'Bank transfer',
  },
  {
    id: 'ce-gold-2',
    accountId: 'acc-gold',
    type: 'WITHDRAWAL',
    amount: 500,
    date: '2026-10-20',
    note: 'Profit withdrawal',
  },
  {
    id: 'ce-btc-1',
    accountId: 'acc-btc',
    type: 'DEPOSIT',
    amount: 150,
    date: '2026-10-01',
    note: 'Top-up',
  },
  {
    id: 'ce-hfm-1',
    accountId: 'acc-hfm',
    type: 'WITHDRAWAL',
    amount: 100,
    date: '2026-09-28',
    note: 'Partial withdrawal',
  },
]

export const milestonesSeed: Milestone[] = [
  { id: 'ms-gold-1', accountId: 'acc-gold', target: 10000, currency: 'USC' },
  { id: 'ms-gold-2', accountId: 'acc-gold', target: 12500, currency: 'USC' },
  { id: 'ms-gold-3', accountId: 'acc-gold', target: 15000, currency: 'USC' },
  { id: 'ms-gold-4', accountId: 'acc-gold', target: 20000, currency: 'USC' },
  { id: 'ms-gold-5', accountId: 'acc-gold', target: 30000, currency: 'USC' },
  { id: 'ms-gold-6', accountId: 'acc-gold', target: 50000, currency: 'USC' },
  { id: 'ms-btc-1', accountId: 'acc-btc', target: 600, currency: 'USD' },
  { id: 'ms-btc-2', accountId: 'acc-btc', target: 750, currency: 'USD' },
  { id: 'ms-btc-3', accountId: 'acc-btc', target: 1000, currency: 'USD' },
  { id: 'ms-hfm-1', accountId: 'acc-hfm', target: 1000, currency: 'USD' },
  { id: 'ms-hfm-2', accountId: 'acc-hfm', target: 1200, currency: 'USD' },
]

export function newAccountId(): string {
  return `acc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export function currencyForAccountType(type: string): CurrencyCode {
  return type === 'Cent' ? 'USC' : 'USD'
}
