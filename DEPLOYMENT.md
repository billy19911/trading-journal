# Trading Journey — Vercel & Production Deployment Guide

Panduan deploy Trading Journey ke **Vercel** (Frontend) dan hosting backend (Laravel 13 + PostgreSQL).

---

## 1. Arsitektur Deployment

Aplikasi ini menggunakan pola decoupled modern:

```
[ Browser / User ]
       │
       ├──► Frontend (React 19 + Vite) ──► Host di Vercel (Edge CDN)
       │
       └──► Backend API (Laravel 13)   ──► Host di Railway / Render / Fly.io / VPS
                 │
                 └──► Database PostgreSQL (Supabase / Neon / Railway)
```

> **Catatan Penting Vercel**: Vercel adalah platform statis & serverless (Node/Edge). Begitu dideploy ke Vercel, frontend langsung hidup 100% menggunakan deterministic mock engine (semua 8 fitur jalan penuh tanpa server). Untuk menghubungkannya ke database cloud yang persisten, hubungkan ke backend Laravel via environment variable `VITE_API_URL`.

---

## 2. Cara Deploy Frontend ke Vercel

### Opsi A: Menggunakan GitHub + Dashboard Vercel (Paling Mudah)

1. Push repository ini ke GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: complete trading journey fullstack"
   git branch -M main
   git remote add origin https://github.com/USERNAME/trading-journey.git
   git push -u origin main
   ```
2. Buka [vercel.com](https://vercel.com) dan login.
3. Klik **Add New Project** ➔ Pilih repository GitHub Anda.
4. Pada menu konfigurasi project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend` *(atau biarkan root, karena sudah ada `vercel.json`)*
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Tambahkan Environment Variable (opsional jika backend sudah live):
   - Key: `VITE_API_URL`
   - Value: `https://url-backend-anda.com/api` (default lokal: `http://127.0.0.1:8000/api`)
6. Klik **Deploy**.
7. Dalam 1-2 menit, URL Anda akan aktif: `https://trading-journey-xxx.vercel.app`.

### Opsi B: Menggunakan Vercel CLI

```bash
cd C:\xampp\htdocs\trading\frontend
npx vercel
```
Ikuti instruksi di terminal, pilih project name, dan deploy akan langsung berjalan.

---

## 3. Menghidupkan Backend Laravel di Cloud

Untuk backend Laravel 13, gunakan salah satu platform gratis/murah berikut:

### Pilihan 1: Railway (Paling Disarankan)
1. Buka [railway.com](https://railway.com).
2. Buat Project Baru ➔ Deploy from GitHub repo ➔ pilih folder `backend`.
3. Tambahkan plugin **PostgreSQL** di project yang sama.
4. Set Environment Variables di Railway:
   ```dotenv
   APP_ENV=production
   APP_DEBUG=false
   APP_KEY=generate-with-php-artisan-key:generate
   APP_URL=https://your-backend.up.railway.app
   DB_CONNECTION=pgsql
   DB_HOST=${{Postgres.PGHOST}}
   DB_PORT=${{Postgres.PGPORT}}
   DB_DATABASE=${{Postgres.PGDATABASE}}
   DB_USERNAME=${{Postgres.PGUSER}}
   DB_PASSWORD=${{Postgres.PGPASSWORD}}
   ```
5. Jalankan migrasi di Railway CLI / Deploy Command:
   ```bash
   php artisan migrate --force
   ```
6. Salin domain backend (misal `https://trading-backend.up.railway.app/api`) dan masukkan ke Environment Variable Vercel (`VITE_API_URL`).

---

## 4. File Konfigurasi yang Sudah Disiapkan

1. `frontend/vercel.json`:
   - SPA Rewrite (`/(.*)` ➔ `/index.html`) agar tidak terjadi 404 saat refresh halaman seperti `/journey` atau `/simulator`.
   - Immutable asset caching untuk performa maksimal.
2. `vercel.json` (root):
   - Auto-build folder `frontend` jika Anda mengimpor root repo di Vercel.
3. `.vercelignore`:
   - Mengabaikan folder `backend/`, `vendor/`, dan file lokal agar proses build Vercel cepat dan ringan.
4. `backend/config/cors.php`:
   - Sudah mendukung regex `http://localhost:*` dan domain Vercel.

---

## 5. Fitur yang Sudah 100% Beres

- [x] **8 Halaman Utama**:
  1. `Overview`: KPI dashboard, equity curve, win-rate breakdown, daily calendar matrix.
  2. `Journey`: Visual progression map, streak counters, balance log.
  3. `Journal`: Input profit/loss, status tag (Profit, Loss, Breakeven, No Trade), catatan evaluasi.
  4. `Simulator`: Pertumbuhan compounding, monthly cashflow, perbandingan skenario, isolasi mutlak dari saldo riil.
  5. `Analytics`: Profit factor, max drawdown, visualisasi return bulanan.
  6. `Milestones`: Target akun, progress bar dinamis, estimasi waktu pencapaian.
  7. `Accounts`: Multi-broker, konversi kurs 3 mata uang (USD, USC cent, IDR) dengan pivot USD.
  8. `Settings`: Theme switcher (dark/light), backup/restore JSON, export CSV, manajemen kurs.
- [x] **Backend API (Laravel 13 + PHP 8.4)**:
  - Sanctum Auth (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`)
  - Multi-account management (`/api/accounts`)
  - Journal & Ledger balance recomputation (`/api/accounts/{id}/journals`, `/api/accounts/{id}/transactions`)
  - Milestones API (`/api/accounts/{id}/milestones`)
  - Growth simulation storage (`/api/scenarios`)
  - Exchange rate override (`/api/exchange-rates/*`)
- [x] **Tes & Kualitas Kode**:
  - `php artisan test`: 9 tests, 47 assertions passing (100% green).
  - `vendor/bin/pint --test`: Standard PSR-12 code style passing.
  - `npm run build`: TypeScript & Vite production bundle 100% clean.
