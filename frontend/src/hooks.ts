import { useMemo } from 'react'
import { useActiveAccount, useAppStore } from './store'
import { buildJourney, type Journey } from './lib/journey'

export function useJourney(): { account: ReturnType<typeof useActiveAccount>; journey: Journey } {
  const account = useActiveAccount()
  const journals = useAppStore((state) => state.journals)
  const cashEvents = useAppStore((state) => state.cashEvents)

  const journey = useMemo(
    () => buildJourney(account, journals[account.id] ?? [], cashEvents),
    [account, journals, cashEvents],
  )

  return { account, journey }
}

export function useJourneyMap(): Record<string, Journey> {
  const accounts = useAppStore((state) => state.accounts)
  const journals = useAppStore((state) => state.journals)
  const cashEvents = useAppStore((state) => state.cashEvents)

  return useMemo(
    () =>
      Object.fromEntries(
        accounts.map((account) => [
          account.id,
          buildJourney(account, journals[account.id] ?? [], cashEvents),
        ]),
      ),
    [accounts, journals, cashEvents],
  )
}
