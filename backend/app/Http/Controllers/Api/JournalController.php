<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\DailyJournalResource;
use App\Http\Resources\LedgerTransactionResource;
use App\Models\DailyJournal;
use App\Models\TradingAccount;
use App\Services\LedgerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class JournalController extends Controller
{
    public function index(Request $request, TradingAccount $tradingAccount): JsonResponse
    {
        $this->authorizeAccount($request, $tradingAccount);

        $journals = $tradingAccount->journals()->orderBy('journal_date')->get();

        return DailyJournalResource::collection($journals)->response();
    }

    public function store(Request $request, TradingAccount $tradingAccount, LedgerService $ledger): JsonResponse
    {
        $this->authorizeAccount($request, $tradingAccount);

        $validated = $request->validate([
            'journal_date' => ['required', 'date'],
            'daily_profit_loss' => ['required', 'numeric'],
            'trading_status' => ['nullable', 'string', 'in:Profit,Loss,Breakeven,No Trade'],
            'notes' => ['nullable', 'string', 'max:10000'],
        ]);

        $journal = $ledger->upsertJournal($tradingAccount, $validated);

        return (new DailyJournalResource($journal))->response()->setStatusCode(201);
    }

    public function show(Request $request, TradingAccount $tradingAccount, DailyJournal $dailyJournal): DailyJournalResource
    {
        $this->authorizeAccount($request, $tradingAccount);
        abort_unless($dailyJournal->account_id === $tradingAccount->id, 404);

        return new DailyJournalResource($dailyJournal);
    }

    public function transactions(Request $request, TradingAccount $tradingAccount): JsonResponse
    {
        $this->authorizeAccount($request, $tradingAccount);

        $transactions = $tradingAccount->transactions()->latest('transaction_date')->get();

        return LedgerTransactionResource::collection($transactions)->response();
    }

    public function recordTransaction(Request $request, TradingAccount $tradingAccount, LedgerService $ledger): JsonResponse
    {
        $this->authorizeAccount($request, $tradingAccount);

        $validated = $request->validate([
            'transaction_type' => ['required', 'string', 'in:INITIAL_CAPITAL,TRADING_PROFIT,TRADING_LOSS,DEPOSIT,WITHDRAWAL,ADJUSTMENT,REVERSAL'],
            'amount' => ['required', 'numeric', 'gt:0'],
            'currency_code' => ['nullable', 'string', 'size:3'],
            'transaction_date' => ['required', 'date'],
            'description' => ['nullable', 'string', 'max:10000'],
            'idempotency_key' => ['required', 'string', 'max:255', 'unique:ledger_transactions,idempotency_key'],
        ]);

        $transaction = $ledger->record($tradingAccount, $validated);

        return (new LedgerTransactionResource($transaction))->response()->setStatusCode(201);
    }

    private function authorizeAccount(Request $request, TradingAccount $account): void
    {
        abort_unless($account->user_id === $request->user()->id, 404);
    }
}
