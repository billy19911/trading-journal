# Phase 1 cloud sync

## Scope

Connect React mock state to Laravel 13 for auth, account data, journals, ledger cash events, milestones, exchange rate settings and isolated simulation scenarios.

## Boundaries

- Sanctum bearer token protects user data routes.
- Every account, milestone, journal and scenario query is scoped to authenticated user ownership.
- Simulation scenarios/results use separate tables and never write ledger or journal balances.
- Financial values stay decimal on API/database; frontend converts display values to numbers.

## Security checkpoint

- Auth: `auth:sanctum` on private routes.
- Authz: explicit owner checks on nested resources.
- Input: Laravel request validation; client form guards remain convenience only.
- Output: API resources expose domain fields, never passwords or tokens except login/register token response.
- Abuse: login attempts throttled per email/IP.
- Audit: existing audit-log schema remains ready; event listeners deferred.

## Verification

- `php artisan test`
- `vendor\\bin\\pint --test`
- `npm run build`
