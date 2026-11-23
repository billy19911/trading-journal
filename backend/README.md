# Trading Journey API

Laravel 13 API backend for Trading Journey.

## Stack

- Laravel 13.43
- PHP 8.4+
- Laravel Sanctum 4
- PostgreSQL target database
- SQLite used for local smoke tests until PostgreSQL service is configured

## Setup

```bash
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate
```

Configure PostgreSQL in `.env`:

```dotenv
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=trading_journey
DB_USERNAME=postgres
DB_PASSWORD=your-password
```

PHP must have `pdo_pgsql` enabled.

## Run

```bash
php artisan serve --host=127.0.0.1 --port=8000
```

## API

Public:

- `POST /api/auth/register`
- `POST /api/auth/login`

Sanctum-protected:

- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET|POST|PUT|PATCH|DELETE /api/accounts`
- `GET|POST /api/accounts/{account}/journals`
- `GET /api/accounts/{account}/journals/{journal}`
- `GET|POST /api/accounts/{account}/transactions`
- `GET|POST /api/accounts/{account}/milestones`
- `DELETE /api/accounts/{account}/milestones/{milestone}`

## Checks

```bash
php artisan test
vendor/bin/pint --test
php artisan route:list --path=api
```

Current checks: 7 tests, 34 assertions, all passing.

## Scope

Implemented foundation: UUID schema, account isolation, Sanctum auth, accounts, journal balance calculation, ledger cash/trading transactions, milestones, currency service and API resources.

Skipped: frontend API wiring, exchange-rate provider job, audit event listeners, sync queue, PostgreSQL runtime validation. Add after PostgreSQL service credentials are available.
