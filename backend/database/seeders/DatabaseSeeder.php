<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\TradingAccount;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

final class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::updateOrCreate(
            ['email' => 'demo@tradingjourney.local'],
            [
                'id' => '00000000-0000-0000-0000-000000000001',
                'name' => 'Demo Trader',
                'password' => Hash::make('password'),
                'timezone' => 'Asia/Jakarta',
                'locale' => 'en',
            ],
        );

        TradingAccount::updateOrCreate(
            ['id' => '00000000-0000-0000-0000-000000000101'],
            [
                'user_id' => $user->id,
                'account_name' => 'Exness Gold',
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
                'daily_target_percent' => 1.0,
                'status' => 'Active',
            ],
        );
    }
}
