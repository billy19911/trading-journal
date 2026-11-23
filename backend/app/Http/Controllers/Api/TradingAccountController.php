<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TradingAccountResource;
use App\Models\TradingAccount;
use App\Services\LedgerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class TradingAccountController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $accounts = $request->user()->tradingAccounts()->latest()->get();

        return TradingAccountResource::collection($accounts)->response();
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'account_name' => ['required', 'string', 'max:255'],
            'broker_name' => ['required', 'string', 'max:255'],
            'account_number' => ['nullable', 'string', 'max:100'],
            'account_type' => ['required', 'string', 'max:50'],
            'currency_code' => ['required', 'string', 'size:3'],
            'source_currency' => ['required', 'string', 'size:3'],
            'cent_ratio' => ['required', 'numeric', 'gt:0'],
            'initial_capital' => ['required', 'numeric', 'gt:0'],
            'initial_exchange_rate' => ['required', 'numeric', 'gt:0'],
            'initial_balance' => ['required', 'numeric', 'gt:0'],
            'starting_date' => ['required', 'date'],
            'daily_target_percent' => ['required', 'numeric', 'between:0.1,10'],
            'status' => ['sometimes', 'string', 'in:Active,Paused'],
        ]);

        $account = DB::transaction(function () use ($request, $validated): TradingAccount {
            $account = $request->user()->tradingAccounts()->create([
                ...$validated,
                'id' => (string) Str::uuid(),
                'status' => $validated['status'] ?? 'Active',
            ]);

            app(LedgerService::class)->record($account, [
                'transaction_type' => 'INITIAL_CAPITAL',
                'amount' => $validated['initial_balance'],
                'currency_code' => $validated['currency_code'],
                'transaction_date' => $validated['starting_date'],
                'description' => 'Initial account capital',
                'idempotency_key' => 'initial-'.$account->id,
            ]);

            return $account;
        });

        return (new TradingAccountResource($account))->response()->setStatusCode(201);
    }

    public function show(Request $request, TradingAccount $tradingAccount): TradingAccountResource
    {
        abort_unless($tradingAccount->user_id === $request->user()->id, 404);

        return new TradingAccountResource($tradingAccount->load(['journals', 'transactions', 'milestones']));
    }

    public function update(Request $request, TradingAccount $tradingAccount): TradingAccountResource
    {
        abort_unless($tradingAccount->user_id === $request->user()->id, 404);

        $validated = $request->validate([
            'account_name' => ['sometimes', 'string', 'max:255'],
            'broker_name' => ['sometimes', 'string', 'max:255'],
            'account_number' => ['nullable', 'string', 'max:100'],
            'account_type' => ['sometimes', 'string', 'max:50'],
            'currency_code' => ['sometimes', 'string', 'size:3'],
            'source_currency' => ['sometimes', 'string', 'size:3'],
            'cent_ratio' => ['sometimes', 'numeric', 'gt:0'],
            'initial_capital' => ['sometimes', 'numeric', 'gt:0'],
            'initial_exchange_rate' => ['sometimes', 'numeric', 'gt:0'],
            'initial_balance' => ['sometimes', 'numeric', 'gt:0'],
            'starting_date' => ['sometimes', 'date'],
            'daily_target_percent' => ['sometimes', 'numeric', 'between:0.1,10'],
            'status' => ['sometimes', 'string', 'in:Active,Paused'],
        ]);

        DB::transaction(function () use ($tradingAccount, $validated): void {
            $tradingAccount->update($validated);

            if (isset($validated['initial_balance'])) {
                $tradingAccount->transactions()
                    ->where('transaction_type', 'INITIAL_CAPITAL')
                    ->update([
                        'amount' => $validated['initial_balance'],
                        'currency_code' => $validated['currency_code'] ?? $tradingAccount->currency_code,
                        'transaction_date' => $validated['starting_date'] ?? $tradingAccount->starting_date,
                    ]);

                // Update opening and closing balances of journals if any exist
                $journals = $tradingAccount->journals()->orderBy('journal_date', 'asc')->get();
                if ($journals->isNotEmpty()) {
                    $runningBalance = (float) $validated['initial_balance'];
                    foreach ($journals as $journal) {
                        $pnl = (float) $journal->daily_profit_loss;
                        $closing = $runningBalance + $pnl;
                        $dailyReturn = $runningBalance == 0.0 ? 0.0 : ($pnl / $runningBalance) * 100;
                        $journal->update([
                            'opening_balance' => $runningBalance,
                            'closing_balance' => $closing,
                            'daily_return' => $dailyReturn,
                        ]);
                        $runningBalance = $closing;
                    }
                }
            }
        });

        return new TradingAccountResource($tradingAccount->refresh());
    }

    public function destroy(Request $request, TradingAccount $tradingAccount): JsonResponse
    {
        abort_unless($tradingAccount->user_id === $request->user()->id, 404);
        $tradingAccount->delete();

        return response()->json(['message' => 'Account deleted']);
    }
}
