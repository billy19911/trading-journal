import type { Account, CashEvent, JournalEntry, Milestone, Transaction } from '../types'
import { todayISO } from './format'

export interface BackupPayload {
  format?: string
  exportedAt?: string
  accounts: Account[]
  journals: Record<string, JournalEntry[]>
  cashEvents: CashEvent[]
  milestones: Milestone[]
}

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function csvCell(value: unknown): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

export function exportJournalsCsv(account: Account, journals: JournalEntry[]) {
  const header = ['date', 'status', 'pnl', 'currency', 'tags', 'notes']
  const rows = [...journals]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((entry) => [
      entry.date,
      entry.status,
      entry.pnl,
      account.currency,
      (entry.tags ?? []).join(' | '),
      entry.notes ?? '',
    ])
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')
  downloadFile(
    `trading-journey-${slug(account.name)}-${todayISO()}.csv`,
    csv,
    'text/csv;charset=utf-8',
  )
}

export function exportAccountJson(
  account: Account,
  journals: JournalEntry[],
  cashEvents: CashEvent[],
  transactions: Transaction[],
) {
  const payload = {
    format: 'trading-journey.journey.v1',
    exportedAt: new Date().toISOString(),
    account,
    journals,
    cashEvents,
    transactions,
  }
  downloadFile(
    `trading-journey-${slug(account.name)}-${todayISO()}.json`,
    JSON.stringify(payload, null, 2),
    'application/json',
  )
}

export function backupAll(
  accounts: Account[],
  journals: Record<string, JournalEntry[]>,
  cashEvents: CashEvent[],
  milestones: Milestone[],
) {
  const payload: BackupPayload = {
    format: 'trading-journey.backup.v1',
    exportedAt: new Date().toISOString(),
    accounts,
    journals,
    cashEvents,
    milestones,
  }
  downloadFile(
    `trading-journey-backup-${todayISO()}.json`,
    JSON.stringify(payload, null, 2),
    'application/json',
  )
}
