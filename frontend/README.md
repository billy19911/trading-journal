# Trading Journey frontend

UI prototype for Trading Journey. Mock data only. No backend, auth, or database.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Build

```bash
npm run build
```

Build runs TypeScript validation and Vite production bundling.

## Included

- 8 routed pages: Overview, Trading Journey, Daily Journal, Simulator, Analytics, Milestones, Accounts, Settings.
- Deterministic mock accounts, journal entries, cash events, milestones.
- In-memory Zustand state for account switching, journal saves, account creation/editing, milestones, theme and exchange rate.
- Actual ledger calculations separated from simulator projections.
- CSV journal export, account JSON export, full JSON backup and restore.
- Responsive desktop sidebar, mobile bottom navigation and mobile More sheet.

## Prototype limits

- Reload resets in-memory account, journal, cash and milestone changes.
- Theme and preference controls use local browser storage.
- Sync, auth, provider rate fetch, device sessions and security actions are UI simulations.
- PDF export, IndexedDB persistence, Laravel API and PostgreSQL belong to later phases.
