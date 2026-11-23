<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\DailyJournal;
use App\Models\LedgerTransaction;
use App\Models\TradingAccount;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;

final class LedgerService
{
    /** @var array<string, int> */
    private const SIGN = [
        'INITIAL_CAPITAL' => 1,
        'TRADING_PROFIT' => 1,
        'TRADING_LOSS' => -1,
        'DEPOSIT' => 1,
        'WITHDRAWAL' => -1,
        'ADJUSTMENT' => 1,
        'REVERSAL' => -1,
    ];

    /** @param array<string, mixed> $data */
    public function record(TradingAccount $account, array $data): LedgerTransaction
    {
        $type = (string) ($data['transaction_type'] ?? '');
        $amount = (float) ($data['amount'] ?? 0);

        if (! isset(self::SIGN[$type]) || $amount <= 0) {
            throw new InvalidArgumentException('Invalid transaction type or amount.');
        }

        return DB::transaction(function () use ($account, $data, $type, $amount): LedgerTransaction {
            $transaction = $account->transactions()->create([
                'id' => $data['id'] ?? (string) Str::uuid(),
                'transaction_type' => $type,
                'amount' => $amount,
                'currency_code' => $data['currency_code'] ?? $account->currency_code,
                'transaction_date' => $data['transaction_date'] ?? now(),
                'description' => $data['description'] ?? null,
                'reference_id' => $data['reference_id'] ?? null,
                'idempotency_key' => $data['idempotency_key'] ?? (string) Str::uuid(),
                'revision' => 1,
            ]);

            return $transaction;
        });
    }

    /** @param array<string, mixed> $data */
    public function upsertJournal(TradingAccount $account, array $data): DailyJournal
    {
        $pnl = (float) ($data['daily_profit_loss'] ?? 0);
        $date = $data['journal_date'];

        return DB::transaction(function () use ($account, $data, $pnl, $date): DailyJournal {
            $prior = $account->journals()
                ->whereDate('journal_date', '<', $date)
                ->latest('journal_date')
                ->first();

            $opening = $prior?->closing_balance !== null
                ? (float) $prior->closing_balance
                : (float) $account->initial_balance;
            $closing = $opening + $pnl;
            $dailyReturn = $opening == 0.0 ? 0.0 : ($pnl / $opening) * 100;

            $existing = $account->journals()->whereDate('journal_date', $date)->first();
            $revision = $existing ? $existing->revision + 1 : 1;

            $journal = $account->journals()->updateOrCreate(
                ['journal_date' => $date],
                [
                    'opening_balance' => $opening,
                    'daily_profit_loss' => $pnl,
                    'closing_balance' => $closing,
                    'daily_return' => $dailyReturn,
                    'trading_status' => $data['trading_status'] ?? ($pnl > 0 ? 'Profit' : ($pnl < 0 ? 'Loss' : 'Breakeven')),
                    'notes' => $data['notes'] ?? null,
                    'revision' => $revision,
                ],
            );

            return $journal->refresh();
        });
    }
}
