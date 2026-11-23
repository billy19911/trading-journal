# PRODUCT REQUIREMENTS DOCUMENT
# TRADING JOURNEY
### Personal Trading Performance & Growth Management System

**Version:** 1.0  
**Status:** Development Specification  
**Product Type:** Personal Finance / Trading Journal / Growth Simulator  
**Platforms:** Windows, Android, iOS, Web  
**Architecture:** Offline-first Progressive Web Application (PWA)

---

# 1. PRODUCT VISION

## 1.1 Tujuan Produk

Trading Journey adalah aplikasi personal untuk mencatat, memonitor, menganalisis, dan menyimulasikan perkembangan modal trading dari waktu ke waktu.

Aplikasi membantu pengguna menjawab pertanyaan:

1. Berapa modal awal trading saya?
2. Berapa saldo aktual sekarang?
3. Berapa profit atau loss setiap hari?
4. Berapa persentase pertumbuhan modal?
5. Apakah perkembangan aktual sesuai target?
6. Bagaimana jika saya menghasilkan profit 1%, 2%, atau 3% setiap hari?
7. Berapa kemungkinan saldo saya dalam 3, 6, 12, atau 24 bulan?
8. Berapa besar risiko penurunan modal yang pernah terjadi?
9. Kapan saya mencapai milestone modal berikutnya?

## 1.2 Prinsip Produk

Aplikasi harus memegang lima prinsip:

- Accuracy First: seluruh kalkulasi harus akurat dan dapat diaudit.
- Separation: data aktual tidak boleh tercampur dengan simulasi.
- Offline First: pencatatan tetap bisa dilakukan tanpa internet.
- Data Ownership: pengguna memiliki dan dapat mengekspor datanya.
- Minimalist UX: antarmuka bersih, profesional, dan tidak berlebihan.

## 1.3 Non-Goals

Versi pertama tidak mencakup:

- Eksekusi order trading.
- Trading otomatis.
- Integrasi EA MT5.
- Copy trading.
- Signal provider.
- Analisis teknikal market.
- AI trading prediction.
- Rekomendasi investasi otomatis.

Aplikasi merupakan alat pencatatan dan analisis, bukan alat pemberi jaminan keuntungan.

---

# 2. USER & ACCOUNT MANAGEMENT

## 2.1 Multi-Account

Pengguna dapat membuat beberapa akun trading independen.

Contoh:

| Account | Broker | Type | Currency |
|---|---|---|---|
| Exness Gold | Exness | Cent | USC |
| Exness BTC | Exness | Standard | USD |
| HFM Gold | HFM | Standard | USD |

Setiap akun memiliki:

- Nama akun.
- Broker.
- Jenis akun.
- Mata uang akun.
- Rasio konversi mata uang.
- Modal awal.
- Tanggal mulai.
- Balance aktual.
- Equity opsional.
- Target harian.
- Status akun.
- Riwayat transaksi.
- Statistik performa.

Satu akun tidak boleh memengaruhi saldo akun lainnya.

## 2.2 Account Types

Jenis akun yang didukung:

- Standard.
- Cent.
- Micro.
- Custom.

Pengguna dapat menentukan rasio konversi sendiri.

Contoh:
- 1 USD = 100 USC.
- 1 USD = 1000 unit akun micro.
- Custom conversion.

Rasio harus dapat diubah untuk akun baru. Perubahan konfigurasi tidak boleh mengubah transaksi historis.

---

# 3. CURRENCY & EXCHANGE RATE SYSTEM

## 3.1 Supported Currencies

Mata uang utama:

- IDR
- USD
- USC
- EUR
- GBP
- Custom currency

## 3.2 Automatic Exchange Rate

Sistem mengambil kurs IDR/USD secara otomatis dari penyedia kurs eksternal.

Ketentuan:

1. Kurs diperbarui ketika aplikasi online.
2. Kurs memiliki timestamp.
3. Pengguna dapat memilih kurs manual.
4. Kurs lama tetap disimpan sebagai histori.
5. Jika API gagal, gunakan kurs terakhir yang berhasil diambil.
6. Tampilkan peringatan jika kurs sudah kedaluwarsa.
7. Jangan mengubah histori modal akibat perubahan kurs terbaru.

Gunakan Exchange Rate Provider Adapter agar penyedia kurs dapat diganti tanpa mengubah business logic.

## 3.3 Currency Conversion

Contoh:

Modal awal: Rp1.000.000

Kurs: Rp16.700/USD

Rasio akun: 100 USC per USD.

Rumus:

USD = IDR / Exchange Rate

USC = USD × Cent Ratio

Hasil:

- USD = 59,8802395
- USC = 5.988,02395

Sistem menyimpan nilai konversi awal dan kurs yang digunakan sebagai snapshot.

**Penting:** USC bukan selalu berarti akun cent dengan rasio yang sama di semua broker. Rasio harus berdasarkan spesifikasi akun pengguna.

---

# 4. TRADING JOURNEY ENGINE

Ini adalah core system aplikasi.

## 4.1 Initial Capital

Ketika akun dibuat, pengguna mengisi:

- Initial capital.
- Currency sumber.
- Currency akun.
- Exchange rate.
- Conversion ratio.
- Starting date.
- Optional account description.

Sistem menghasilkan initial balance akun.

## 4.2 Daily Profit & Loss

Pengguna dapat mencatat profit/loss setiap hari.

Contoh:

| Date | Daily P/L | Balance |
|---|---:|---:|
| 1 Nov | +250 USC | 6.238 |
| 2 Nov | +180 USC | 6.418 |
| 3 Nov | -100 USC | 6.318 |
| 4 Nov | +300 USC | 6.618 |
| 5 Nov | -50 USC | 6.568 |

Input mendukung:
- Positive profit.
- Negative loss.
- Zero profit.
- No trading day.
- Optional notes.

## 4.3 Daily Percentage

Persentase profit/loss dihitung berdasarkan balance awal hari.

Daily Return (%) = Daily P/L / Opening Balance × 100

Contoh:

Opening Balance = USC 10.000

Daily P/L = USC 200

Daily Return = 2%.

## 4.4 Deposit & Withdrawal

Deposit dan withdrawal harus dicatat terpisah dari profit/loss.

Contoh:

| Type | Amount |
|---|---:|
| Initial Capital | 10.000 |
| Daily Profit | +500 |
| Deposit | +2.000 |
| Daily Loss | -200 |
| Withdrawal | -1.000 |

Closing Balance = 11.300 USC.

Deposit tidak boleh dianggap sebagai profit.

Withdrawal tidak boleh dianggap sebagai loss.

## 4.5 Daily Journal

Setiap hari dapat menyimpan:

- Date.
- Daily P/L.
- Percentage.
- Opening balance.
- Closing balance.
- Trading activity status.
- Notes.
- Tags.
- Optional screenshot attachment.

Status:
- Profit.
- Loss.
- Breakeven.
- No Trading.
- Pending Reconciliation.

## 4.6 Editing & Audit Trail

Setiap perubahan transaksi harus dicatat.

Audit log:
- Previous value.
- New value.
- User.
- Timestamp.
- Reason for modification.

Penghapusan transaksi aktual harus menggunakan reversal atau soft delete dengan histori audit.

Tidak boleh ada perubahan saldo tersembunyi.

---

# 5. TRADING SIMULATOR ENGINE

## 5.1 Objective

Simulator digunakan untuk menguji skenario perkembangan modal berdasarkan berbagai asumsi.

Simulator sepenuhnya terisolasi dari Trading Journey.

## 5.2 Simulation Parameters

Input:

| Parameter | Description |
|---|---|
| Initial Balance | Modal awal simulasi |
| Currency | Mata uang akun |
| Daily Profit | Target profit harian |
| Daily Loss | Skenario loss |
| Trading Days | Hari trading per bulan |
| Duration | Jumlah bulan |
| Compounding | ON/OFF |
| Deposit | Tambahan modal |
| Withdrawal | Pengambilan modal |
| Trading Calendar | Hari aktif trading |

## 5.3 Compounding ON

Profit harian dihitung berdasarkan balance terbaru.

Formula:

Ending Balance = Starting Balance × (1 + Daily Return)^N

Contoh:

Modal = USC 10.000  
Daily Return = 2%  
Trading Days = 20

Ending Balance:

10.000 × (1,02)^20

Hasil sekitar USC 14.859,47.

## 5.4 Compounding OFF

Profit dihitung berdasarkan modal awal tetap.

Ending Balance = Initial Capital + (Initial Capital × Daily Return × N)

Contoh:

Modal = USC 10.000  
Daily Return = 2%  
Trading Days = 20

Ending Balance = USC 14.000.

## 5.5 Variable Daily Returns

Simulator wajib mendukung profit dan loss berbeda setiap hari.

Contoh skenario:

| Day | Return |
|---|---:|
| 1 | +2% |
| 2 | +1% |
| 3 | -1% |
| 4 | +3% |
| 5 | 0% |
| 6 | -2% |

Formula compounding:

Balance(n) = Balance(n-1) × (1 + Return(n))

Skenario ini harus mendukung jadwal yang dapat diulang dan variasi yang ditentukan pengguna.

## 5.6 Simulation Modes

**Mode A — Fixed Daily Return**

Persentase profit sama setiap hari.

**Mode B — Custom Daily Return**

Pengguna menentukan profit/loss setiap hari.

**Mode C — Monthly Target**

Pengguna menentukan target profit bulanan.

**Mode D — Conservative Scenario**

Memasukkan hari loss, breakeven, dan profit dengan asumsi lebih konservatif.

**Mode E — Best / Base / Worst Case**

Tiga skenario dibandingkan sekaligus.

## 5.7 Multiple Simulations

Pengguna dapat menyimpan banyak skenario.

Contoh:

- Scenario A: Daily 1%.
- Scenario B: Daily 2%.
- Scenario C: Daily 3%.
- Scenario D: Daily 2%, dengan loss 3 hari per bulan.

Setiap simulasi memiliki:
- Nama.
- Deskripsi.
- Parameters.
- Results.
- Created date.
- Updated date.

## 5.8 Simulation Isolation Rules

Aturan wajib:

1. Simulator tidak boleh mengakses fungsi write Trading Journey.
2. Simulator tidak boleh mengubah balance akun aktual.
3. Mengubah modal simulasi tidak mengubah modal awal aktual.
4. Menghapus simulasi tidak menghapus data aktual.
5. Simulasi tidak boleh membuat deposit atau withdrawal aktual.
6. Dashboard aktual hanya menggunakan data Journey.
7. Semua hasil simulasi diberi label PROJECTION atau SIMULATION.

---

# 6. ANALYTICS ENGINE

## 6.1 Actual Performance

Metrik:

- Initial Balance.
- Current Balance.
- Total Net Trading P/L.
- Total Deposits.
- Total Withdrawals.
- Total Return.
- Average Daily Return.
- Best Trading Day.
- Worst Trading Day.
- Winning Days.
- Losing Days.
- Breakeven Days.
- Win Day Percentage.
- Maximum Drawdown.

## 6.2 Return Calculation

Total Return harus memperhitungkan perubahan modal eksternal.

Net Trading P/L = Closing Balance - Initial Balance - Net External Capital

Net External Capital = Deposits - Withdrawals

Total Return (%) = Net Trading P/L / Initial Balance × 100

Untuk periode tertentu, gunakan time-weighted return jika ada deposit atau withdrawal selama periode tersebut.

Jangan menggunakan persentase pertumbuhan saldo mentah sebagai profit apabila modal eksternal berubah.

## 6.3 Drawdown

Maximum Drawdown:

Drawdown (%) = (Peak Equity - Current Equity) / Peak Equity × 100

Gunakan equity jika tersedia secara konsisten. Jika tidak, gunakan balance dan beri label Balance Drawdown.

## 6.4 Actual vs Target

Perbandingan:

- Target daily return.
- Actual daily return.
- Monthly target.
- Actual monthly return.
- Target balance.
- Actual balance.
- Performance gap.

Status:
- Ahead of Target.
- On Track.
- Behind Target.

Status ini hanya menunjukkan perbandingan terhadap target pengguna, bukan prediksi keuntungan.

## 6.5 Milestones

Contoh:

| Milestone | Status |
|---|---|
| USC 10.000 | Completed |
| USC 20.000 | In Progress |
| USC 50.000 | Locked |
| USC 100.000 | Locked |

Milestone dapat dikonfigurasi per akun.

---

# 7. TECHNICAL ARCHITECTURE

## 7.1 Architecture Overview

```text
              USER DEVICES
       Windows / Android / iOS / Web
                    |
                    v
          React + TypeScript PWA
                    |
          Application Service Layer
                    |
        +-----------+-----------+
        |                       |
        v                       v
   Journey Module          Simulator Module
        |                       |
   Journey Repository     Simulation Repository
        |                       |
        v                       v
   IndexedDB / Dexie      IndexedDB / Dexie
        |                       |
        +-----------+-----------+
                    |
               Sync Engine
                    |
               HTTPS API
                    |
             Laravel Backend
                    |
          +---------+----------+
          |                    |
          v                    v
      PostgreSQL          Exchange Rate
          |                  Provider
          v
       Backup
```

## 7.2 Frontend

Technology:

- React.
- TypeScript.
- Vite.
- Tailwind CSS.
- shadcn/ui.
- TanStack Query.
- Zustand.
- Dexie.js.
- React Hook Form.
- Zod.
- Recharts.

Responsibilities:

- UI rendering.
- Local persistence.
- Form validation.
- Offline operations.
- Simulation calculations.
- Dashboard analytics.
- Synchronization state.

## 7.3 Backend

Technology:

- Laravel 13.
- PHP 8.4+.
- PostgreSQL.
- Laravel Sanctum.
- Laravel Queue.
- Laravel Scheduler.

Responsibilities:

- Authentication.
- Multi-account authorization.
- Cloud persistence.
- Data synchronization.
- Audit trail.
- Exchange rate proxy.
- Backup and export.
- Server-side validation.

## 7.4 Hosting

Recommended:

- Frontend: Static hosting / CDN.
- Backend: VPS or Laravel-compatible hosting.
- Database: Managed PostgreSQL or PostgreSQL on VPS.
- HTTPS mandatory.
- Automated database backup.
- Environment-based secrets.

Jangan menyimpan API key exchange-rate provider di frontend.

---

# 8. OFFLINE-FIRST & CLOUD SYNC

## 8.1 Local-First

Setiap perubahan dicatat ke IndexedDB terlebih dahulu.

Alur:

1. User melakukan input.
2. Frontend melakukan validasi.
3. Data disimpan lokal.
4. UI langsung memperbarui balance.
5. Sync Engine memasukkan operasi ke outbox.
6. Jika internet tersedia, data dikirim ke backend.
7. Backend mengonfirmasi penerimaan.
8. Operasi ditandai synced.

## 8.2 Sync Status

Status:

- Synced.
- Pending Sync.
- Syncing.
- Failed.
- Conflict.

Tampilkan indikator sinkronisasi yang mudah dipahami.

## 8.3 Conflict Resolution

Jangan menggunakan Last Write Wins untuk transaksi finansial.

Aturan:

- Setiap transaksi memiliki UUID.
- Setiap perubahan memiliki revision/version.
- Setiap operasi memiliki idempotency key.
- Perubahan pada objek sama dengan versi berbeda harus memunculkan conflict.
- Transaksi berbeda tetap dapat disinkronkan secara independen.
- Pengguna dapat memilih versi yang benar.
- Semua keputusan konflik masuk audit log.

## 8.4 Data Integrity

Backend harus menggunakan database transaction saat menyimpan perubahan finansial.

Balance dihitung ulang dari ledger, bukan dari nilai balance yang dikirim frontend.

Jika sync gagal, data lokal tidak boleh hilang.

---

# 9. DATABASE SCHEMA

Gunakan UUID sebagai primary key dan foreign key untuk entitas utama.

Semua nominal finansial disimpan menggunakan DECIMAL/NUMERIC, bukan floating-point.

## 9.1 users

| Column | Type |
|---|---|
| id | UUID |
| name | VARCHAR |
| email | VARCHAR |
| password | HASH |
| timezone | VARCHAR |
| locale | VARCHAR |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |

## 9.2 trading_accounts

| Column | Type |
|---|---|
| id | UUID |
| user_id | UUID |
| account_name | VARCHAR |
| broker_name | VARCHAR |
| account_type | VARCHAR |
| currency_code | VARCHAR |
| source_currency | VARCHAR |
| cent_ratio | DECIMAL |
| initial_capital | DECIMAL |
| initial_exchange_rate | DECIMAL |
| initial_balance | DECIMAL |
| starting_date | DATE |
| daily_target_percent | DECIMAL |
| status | VARCHAR |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |

## 9.3 exchange_rates

| Column | Type |
|---|---|
| id | UUID |
| base_currency | VARCHAR |
| quote_currency | VARCHAR |
| rate | DECIMAL |
| provider | VARCHAR |
| fetched_at | TIMESTAMP |
| created_at | TIMESTAMP |

Unique key: base_currency + quote_currency + fetched_at.

## 9.4 ledger_transactions

Tabel utama untuk seluruh pergerakan saldo.

| Column | Type |
|---|---|
| id | UUID |
| account_id | UUID |
| transaction_type | VARCHAR |
| amount | DECIMAL |
| currency_code | VARCHAR |
| transaction_date | TIMESTAMP |
| description | TEXT |
| reference_id | UUID NULL |
| idempotency_key | VARCHAR |
| revision | INTEGER |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |
| deleted_at | TIMESTAMP NULL |

Transaction types:

- INITIAL_CAPITAL.
- TRADING_PROFIT.
- TRADING_LOSS.
- DEPOSIT.
- WITHDRAWAL.
- ADJUSTMENT.
- REVERSAL.

Nominal amount selalu positif. Arah perubahan saldo ditentukan oleh transaction_type.

## 9.5 daily_journals

| Column | Type |
|---|---|
| id | UUID |
| account_id | UUID |
| journal_date | DATE |
| opening_balance | DECIMAL |
| daily_profit_loss | DECIMAL |
| closing_balance | DECIMAL |
| daily_return | DECIMAL |
| trading_status | VARCHAR |
| notes | TEXT |
| revision | INTEGER |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |

Unique constraint:

account_id + journal_date.

Satu akun memiliki satu daily journal per tanggal. Beberapa transaksi trading pada hari yang sama dapat diagregasikan ke jurnal tersebut.

## 9.6 simulation_scenarios

| Column | Type |
|---|---|
| id | UUID |
| user_id | UUID |
| account_id | UUID NULL |
| scenario_name | VARCHAR |
| initial_balance | DECIMAL |
| currency_code | VARCHAR |
| daily_return | DECIMAL |
| trading_days_per_month | INTEGER |
| duration_months | INTEGER |
| compounding | BOOLEAN |
| simulation_mode | VARCHAR |
| configuration | JSONB |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |

## 9.7 simulation_results

| Column | Type |
|---|---|
| id | UUID |
| scenario_id | UUID |
| period_number | INTEGER |
| opening_balance | DECIMAL |
| total_profit_loss | DECIMAL |
| closing_balance | DECIMAL |
| return_percentage | DECIMAL |
| drawdown_percentage | DECIMAL |
| created_at | TIMESTAMP |

## 9.8 account_milestones

| Column | Type |
|---|---|
| id | UUID |
| account_id | UUID |
| target_balance | DECIMAL |
| currency_code | VARCHAR |
| achieved_at | TIMESTAMP NULL |
| created_at | TIMESTAMP |

## 9.9 audit_logs

| Column | Type |
|---|---|
| id | UUID |
| user_id | UUID |
| account_id | UUID NULL |
| entity_type | VARCHAR |
| entity_id | UUID |
| action | VARCHAR |
| old_values | JSONB |
| new_values | JSONB |
| created_at | TIMESTAMP |

## 9.10 sync_operations

| Column | Type |
|---|---|
| id | UUID |
| user_id | UUID |
| device_id | UUID |
| entity_type | VARCHAR |
| entity_id | UUID |
| operation | VARCHAR |
| payload | JSONB |
| idempotency_key | VARCHAR |
| sync_status | VARCHAR |
| created_at | TIMESTAMP |
| synced_at | TIMESTAMP NULL |

Additional tables:

- user_devices.
- user_preferences.
- journal_attachments.
- account_currency_history.
- exchange_rate_settings.

---

# 10. BUSINESS RULES & CALCULATION ENGINE

## 10.1 Balance Calculation

Closing Balance:

Opening Balance + Profit/Loss + Deposits - Withdrawals + Adjustments.

Contoh:

Opening Balance: 10.000

Profit: 500

Deposit: 1.000

Withdrawal: 200

Closing Balance: 11.300.

## 10.2 Daily Return

Daily Return:

Daily P/L / Opening Balance × 100.

Deposit dan withdrawal tidak termasuk daily trading profit.

## 10.3 Monthly Performance

Monthly Net Trading P/L:

Jumlah seluruh profit/loss trading dalam bulan tersebut.

Monthly Return menggunakan time-weighted return agar deposit dan withdrawal tidak menciptakan pertumbuhan palsu.

## 10.4 Compounding

Compounding ON:

Balance berikutnya = Balance sebelumnya × (1 + Return).

Compounding OFF:

Profit dihitung berdasarkan initial balance tetap.

## 10.5 Negative Balance

Sistem mengizinkan saldo negatif dalam perhitungan jika diperlukan untuk mencatat koreksi historis, tetapi memberikan warning.

Simulator secara default menghentikan skenario ketika saldo mencapai nol atau negatif, kecuali pengguna mengaktifkan mode khusus untuk pengujian.

## 10.6 Rounding

- Kalkulasi menggunakan decimal precision tinggi.
- Jangan melakukan pembulatan pada setiap langkah perhitungan internal.
- Pembulatan tampilan mengikuti mata uang akun.
- Konversi awal menyimpan kurs dan rasio yang digunakan.
- Semua kalkulasi harus menggunakan satu standar rounding yang konsisten.

---

# 11. UI/UX SPECIFICATION

## 11.1 Design Direction

Style: Premium Minimal Financial Dashboard.

Karakter desain:

- Clean.
- Modern.
- Professional.
- Data-oriented.
- Responsive.
- Minimal animation.
- No excessive gradients.
- No unnecessary decorative cards.

## 11.2 Color Palette

| Color | Hex | Usage |
|---|---|---|
| Background | #0B0F14 | Dark background |
| Surface | #141A22 | Cards |
| Elevated | #1B2430 | Panels |
| Primary | #E5E7EB | Main text |
| Secondary | #8B95A5 | Secondary text |
| Profit | #16A34A | Positive |
| Loss | #DC2626 | Negative |
| Accent | #3B82F6 | Interactive elements |
| Border | #293241 | Dividers |

Dark mode menjadi tema utama.

Light mode tersedia sebagai alternatif.

## 11.3 Main Navigation

Desktop sidebar:

1. Overview.
2. Trading Journey.
3. Daily Journal.
4. Simulator.
5. Analytics.
6. Milestones.
7. Accounts.
8. Settings.

Mobile bottom navigation:

1. Home.
2. Journey.
3. Simulator.
4. Analytics.
5. More.

## 11.4 Page 1 — Overview Dashboard

Komponen:

- Account selector.
- Current balance.
- Total trading P/L.
- Growth percentage.
- Daily P/L.
- Trading days.
- Win/Loss days.
- Balance chart.
- Monthly performance.
- Actual vs target.
- Recent transactions.

## 11.5 Page 2 — Trading Journey

Komponen:

- Balance timeline.
- Daily performance.
- Transaction history.
- Deposit/withdrawal history.
- Calendar view.
- Daily notes.

Pengguna dapat memilih tanggal untuk membuka detail hari tersebut.

## 11.6 Page 3 — Daily Journal

Komponen:

- Date selector.
- Profit/loss input.
- Currency display.
- Daily percentage.
- Notes.
- Tags.
- Save entry.

Validasi harus menampilkan balance sebelum dan sesudah pencatatan.

## 11.7 Page 4 — Simulator

Komponen:

- Initial balance.
- Target daily percentage.
- Trading days.
- Duration.
- Compounding toggle.
- Variable profit/loss.
- Scenario selector.
- Calculate button.
- Projection chart.
- Monthly breakdown.
- Final balance.
- Total profit.
- ROI.
- Maximum simulated drawdown.

Setiap hasil harus menampilkan label SIMULATION.

## 11.8 Page 5 — Analytics

Komponen:

- Performance overview.
- Daily return chart.
- Monthly P/L.
- Equity curve.
- Drawdown chart.
- Winning/losing days.
- Average daily return.
- Best/worst trading day.
- Actual vs target.

## 11.9 Page 6 — Accounts

Komponen:

- Account list.
- Create account.
- Edit account.
- Broker information.
- Currency settings.
- Initial capital.
- Current balance.
- Account status.

## 11.10 Page 7 — Settings

- Theme.
- Language.
- Currency preferences.
- Exchange-rate provider.
- Automatic/manual exchange rate.
- Sync configuration.
- Device management.
- Data export.
- Backup and restore.
- Security settings.

---

# 12. SECURITY & DATA MANAGEMENT

Mandatory requirements:

1. HTTPS.
2. Secure authentication.
3. Password hashing.
4. Backend authorization per user.
5. Database access isolation.
6. API rate limiting.
7. Input validation.
8. Audit trail.
9. Encrypted backup.
10. No API secrets in frontend.
11. Secure local session management.
12. Data export in CSV and JSON.

Pengguna harus dapat mengekspor seluruh histori akun.

Format export:

- CSV.
- JSON.
- PDF report.

Backup dan restore harus mempertahankan hubungan antara akun, transaksi, dan jurnal.

---

# 13. TESTING & QUALITY ASSURANCE

## 13.1 Unit Testing

Wajib menguji:

- Currency conversion.
- Cent ratio.
- Daily P/L.
- Daily percentage.
- Balance calculation.
- Compounding.
- Non-compounding.
- Deposit.
- Withdrawal.
- Monthly return.
- Drawdown.
- Time-weighted return.
- Rounding.

## 13.2 Integration Testing

Wajib menguji:

- Account creation.
- Journal creation.
- Ledger update.
- Offline entry.
- Sync operation.
- Conflict resolution.
- Duplicate operation prevention.
- Backup and restore.

## 13.3 Critical Isolation Test

Test case:

1. Buat akun aktual dengan balance USC 10.000.
2. Catat profit USC 500.
3. Balance aktual menjadi USC 10.500.
4. Buat simulasi dengan modal USC 10.000.
5. Ubah target simulasi dari 1% menjadi 5%.
6. Hapus simulasi.
7. Periksa balance aktual.

Expected result:

Balance aktual tetap USC 10.500 sepanjang pengujian.

Tidak boleh ada perubahan pada ledger aktual.

## 13.4 Offline Test

1. Matikan internet.
2. Catat daily profit.
3. Tutup aplikasi.
4. Buka kembali aplikasi.
5. Pastikan data tetap tersedia.
6. Aktifkan internet.
7. Pastikan data tersinkronisasi.
8. Periksa bahwa tidak ada duplikasi transaksi.

---

# 14. DEVELOPMENT ROADMAP

## Phase 1 — Foundation

- Project setup.
- Design system.
- Database setup.
- Authentication.
- Multi-account management.
- Currency system.

## Phase 2 — Trading Journey Core

- Initial capital.
- Ledger.
- Daily journal.
- Profit/loss.
- Deposit/withdrawal.
- Balance calculation.
- Audit trail.

## Phase 3 — Simulation Engine

- Fixed return.
- Compounding.
- Non-compounding.
- Variable daily return.
- Loss scenarios.
- Monthly projections.
- Scenario comparison.

## Phase 4 — Analytics

- Dashboard.
- Balance chart.
- Equity curve.
- Drawdown.
- Monthly report.
- Actual vs target.
- Milestones.

## Phase 5 — Offline & Synchronization

- IndexedDB.
- Offline-first operation.
- Outbox queue.
- Cloud synchronization.
- Conflict resolution.
- Multi-device support.

## Phase 6 — Polish & Release

- Responsive UI.
- PWA installation.
- Backup/restore.
- CSV/JSON/PDF export.
- Security audit.
- Testing.
- Production deployment.

---

# 15. ACCEPTANCE CRITERIA

Produk dinyatakan siap MVP apabila:

- [ ] Bisa membuat lebih dari satu akun.
- [ ] Setiap akun memiliki saldo independen.
- [ ] Bisa menginput modal awal IDR.
- [ ] Bisa mengonversi IDR ke USD dan USC.
- [ ] Kurs otomatis dapat diperbarui.
- [ ] Bisa menggunakan kurs manual.
- [ ] Bisa mencatat daily profit/loss.
- [ ] Balance dihitung otomatis.
- [ ] Deposit dan withdrawal tidak dianggap profit/loss trading.
- [ ] Daily return dihitung dengan benar.
- [ ] Simulator mendukung compounding ON/OFF.
- [ ] Simulator mendukung profit dan loss.
- [ ] Bisa membandingkan beberapa simulasi.
- [ ] Simulator tidak bisa mengubah data aktual.
- [ ] Dashboard menampilkan performa aktual.
- [ ] Mendukung offline.
- [ ] Mendukung cloud sync.
- [ ] Konflik sinkronisasi tidak menghilangkan transaksi.
- [ ] Bisa digunakan pada Windows dan smartphone.
- [ ] Data dapat diekspor dan dipulihkan.

---

# 16. FUTURE DEVELOPMENT

Fitur yang tidak perlu masuk MVP, tetapi arsitektur harus memungkinkan pengembangannya:

- MT5 Account Integration.
- Automatic Trade History Import.
- EA Performance Monitoring.
- Broker Balance Synchronization.
- Screenshot Trade Journal.
- Advanced Risk Management.
- Multiple Currency Portfolio.
- Trading Goal Planning.
- AI-assisted Journal Analysis.
- Automated Monthly Reports.

Integrasi MT5 nantinya hanya berfungsi mengambil data. Aplikasi tidak perlu memiliki kemampuan mengirim order.

---

# 17. FINAL TECHNICAL DECISIONS

| Component | Decision |
|---|---|
| Product | Trading Journey |
| Frontend | React + TypeScript |
| Build Tool | Vite |
| UI | Tailwind + shadcn/ui |
| Backend | Laravel 13 |
| Runtime | PHP 8.4+ |
| Database | PostgreSQL |
| Local Storage | IndexedDB + Dexie |
| Authentication | Laravel Sanctum |
| Sync | Offline-first sync engine |
| Chart | Recharts |
| Validation | Zod |
| State | Zustand |
| Deployment | PWA + Laravel API |
| Architecture | Modular monolith backend |
| Financial Precision | Decimal |
| Language | Indonesian / English |
| Theme | Dark / Light |

# 18. PRODUCT SUCCESS DEFINITION

Trading Journey bukan aplikasi untuk memprediksi bahwa modal pasti akan bertumbuh.

Tujuan utamanya adalah membuat pengguna mampu melihat perjalanan trading secara objektif.

**Actual Journey** menunjukkan apa yang benar-benar terjadi.

**Growth Simulator** menunjukkan apa yang mungkin terjadi berdasarkan asumsi.

**Analytics** menunjukkan seberapa baik performa aktual dibandingkan target.

Ketiganya harus selalu terpisah secara logis dan transparan.

**Final Product Principle:**

"Track What Happened. Simulate What Could Happen. Understand Your Progress."

---

**END OF PRD — TRADING JOURNEY V1.0**