<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\TradingAccount;
use App\Models\User;
use App\Services\CurrencyService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class TradingJourneyTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_registration_and_login(): void
    {
        $registerRes = $this->postJson('/api/auth/register', [
            'name' => 'Trader One',
            'email' => 'trader@example.com',
            'password' => 'secret1234',
        ]);

        $registerRes->assertCreated()
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email']]);

        $loginRes = $this->postJson('/api/auth/login', [
            'email' => 'trader@example.com',
            'password' => 'secret1234',
        ]);

        $loginRes->assertOk()
            ->assertJsonStructure(['token', 'user']);

        $token = $loginRes->json('token');

        $this->withToken($token)
            ->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('user.email', 'trader@example.com');
    }

    public function test_currency_conversion_usd_pivot(): void
    {
        $service = new CurrencyService;

        // 1,670,000 IDR @ 16,700 rate -> 100 USD
        $usd = $service->convert(1670000.0, 'IDR', 'USD', 16700.0, 100.0);
        $this->assertEquals(100.0, $usd);

        // 100 USD @ 100 cent ratio -> 10,000 USC
        $usc = $service->convert(100.0, 'USD', 'USC', 16700.0, 100.0);
        $this->assertEquals(10000.0, $usc);

        // Direct IDR -> USC via USD pivot
        $directUsc = $service->convert(1670000.0, 'IDR', 'USC', 16700.0, 100.0);
        $this->assertEquals(10000.0, $directUsc);
    }

    public function test_trading_account_crud_and_isolation(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $accountData = [
            'account_name' => 'Exness Gold Cent',
            'broker_name' => 'Exness',
            'account_number' => '7021884',
            'account_type' => 'Cent',
            'currency_code' => 'USC',
            'source_currency' => 'IDR',
            'cent_ratio' => 100,
            'initial_capital' => 1670000,
            'initial_exchange_rate' => 16700,
            'initial_balance' => 10000,
            'starting_date' => '2026-08-03',
            'daily_target_percent' => 1.5,
        ];

        // User 1 creates account
        $res = $this->actingAs($user1)->postJson('/api/accounts', $accountData);
        $res->assertCreated()->assertJsonPath('data.name', 'Exness Gold Cent');

        $accountId = $res->json('data.id');

        // User 1 can see their account
        $this->actingAs($user1)->getJson('/api/accounts')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        // User 2 cannot see or access User 1's account
        $this->actingAs($user2)->getJson('/api/accounts')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        $this->actingAs($user2)->getJson("/api/accounts/{$accountId}")
            ->assertNotFound();
    }

    public function test_journal_entry_updates_balance_and_records_ledger(): void
    {
        $user = User::factory()->create();
        $account = TradingAccount::create([
            'user_id' => $user->id,
            'account_name' => 'Exness Gold',
            'broker_name' => 'Exness',
            'account_type' => 'Cent',
            'currency_code' => 'USC',
            'source_currency' => 'USD',
            'cent_ratio' => 100,
            'initial_capital' => 100,
            'initial_exchange_rate' => 1,
            'initial_balance' => 10000,
            'starting_date' => '2026-08-03',
            'daily_target_percent' => 1.5,
            'status' => 'Active',
        ]);

        $res = $this->actingAs($user)->postJson("/api/accounts/{$account->id}/journals", [
            'journal_date' => '2026-08-04',
            'daily_profit_loss' => 150.0,
            'trading_status' => 'Profit',
            'notes' => 'First trade win',
        ]);

        $res->assertCreated()
            ->assertJsonPath('data.opening_balance', '10000.000000000000')
            ->assertJsonPath('data.pnl', '150.000000000000')
            ->assertJsonPath('data.closing_balance', '10150.000000000000');

        // Milestone creation
        $milestoneRes = $this->actingAs($user)->postJson("/api/accounts/{$account->id}/milestones", [
            'target_balance' => 15000,
            'currency_code' => 'USC',
        ]);
        $milestoneRes->assertCreated();
    }

    public function test_external_cash_deposit_and_withdrawal_ledger(): void
    {
        $user = User::factory()->create();
        $account = TradingAccount::create([
            'user_id' => $user->id,
            'account_name' => 'Exness BTC',
            'broker_name' => 'Exness',
            'account_type' => 'Standard',
            'currency_code' => 'USD',
            'source_currency' => 'USD',
            'cent_ratio' => 1,
            'initial_capital' => 500,
            'initial_exchange_rate' => 1,
            'initial_balance' => 500,
            'starting_date' => '2026-08-03',
            'daily_target_percent' => 1.0,
            'status' => 'Active',
        ]);

        // Record deposit
        $dep = $this->actingAs($user)->postJson("/api/accounts/{$account->id}/transactions", [
            'transaction_type' => 'DEPOSIT',
            'amount' => 200,
            'transaction_date' => '2026-08-10',
            'description' => 'Top up',
            'idempotency_key' => 'tx-dep-1',
        ]);
        $dep->assertCreated()->assertJsonPath('data.type', 'DEPOSIT');

        // Record withdrawal
        $wd = $this->actingAs($user)->postJson("/api/accounts/{$account->id}/transactions", [
            'transaction_type' => 'WITHDRAWAL',
            'amount' => 50,
            'transaction_date' => '2026-08-15',
            'description' => 'Profit draw',
            'idempotency_key' => 'tx-wd-1',
        ]);
        $wd->assertCreated()->assertJsonPath('data.type', 'WITHDRAWAL');

        // List transactions
        $this->actingAs($user)->getJson("/api/accounts/{$account->id}/transactions")
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_simulation_scenarios_isolation_and_results(): void
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        $scenarioRes = $this->actingAs($user1)->postJson('/api/scenarios', [
            'scenario_name' => 'Conservative 1% Compounding',
            'initial_balance' => 10000,
            'currency_code' => 'USC',
            'daily_return' => 1.0,
            'trading_days_per_month' => 20,
            'duration_months' => 6,
            'compounding' => true,
            'results' => [
                [
                    'period_number' => 1,
                    'opening_balance' => 10000,
                    'total_profit_loss' => 2201.9,
                    'closing_balance' => 12201.9,
                    'return_percentage' => 22.019,
                    'drawdown_percentage' => 0.0,
                ],
            ],
        ]);

        $scenarioRes->assertCreated()
            ->assertJsonPath('data.name', 'Conservative 1% Compounding')
            ->assertJsonCount(1, 'data.results');

        $scenarioId = $scenarioRes->json('data.id');

        // User 2 cannot access or delete User 1 scenario
        $this->actingAs($user2)->getJson("/api/scenarios/{$scenarioId}")
            ->assertNotFound();

        $this->actingAs($user2)->deleteJson("/api/scenarios/{$scenarioId}")
            ->assertNotFound();

        // User 1 can delete
        $this->actingAs($user1)->deleteJson("/api/scenarios/{$scenarioId}")
            ->assertOk();
    }

    public function test_exchange_rate_settings(): void
    {
        $user = User::factory()->create();

        $rateRes = $this->getJson('/api/exchange-rates/latest');
        $rateRes->assertOk()->assertJsonPath('rate', 16700);

        $saveRes = $this->actingAs($user)->postJson('/api/exchange-rates/manual', [
            'rate' => 16850,
        ]);
        $saveRes->assertOk()->assertJsonPath('data.rate', 16850);

        $userRateRes = $this->actingAs($user)->getJson('/api/exchange-rates/latest');
        $userRateRes->assertOk()
            ->assertJsonPath('rate', 16850)
            ->assertJsonPath('source', 'manual');
    }
}
