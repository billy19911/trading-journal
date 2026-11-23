<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AccountMilestone;
use App\Models\TradingAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class MilestoneController extends Controller
{
    public function index(Request $request, TradingAccount $tradingAccount): JsonResponse
    {
        $this->authorizeAccount($request, $tradingAccount);

        $milestones = $tradingAccount->milestones()->orderBy('target_balance')->get();

        return response()->json(['data' => $milestones]);
    }

    public function store(Request $request, TradingAccount $tradingAccount): JsonResponse
    {
        $this->authorizeAccount($request, $tradingAccount);

        $validated = $request->validate([
            'target_balance' => ['required', 'numeric', 'gt:0'],
            'currency_code' => ['required', 'string', 'size:3'],
        ]);

        $milestone = $tradingAccount->milestones()->create($validated);

        return response()->json(['data' => $milestone], 201);
    }

    public function destroy(Request $request, TradingAccount $tradingAccount, AccountMilestone $accountMilestone): JsonResponse
    {
        $this->authorizeAccount($request, $tradingAccount);
        abort_unless($accountMilestone->account_id === $tradingAccount->id, 404);

        $accountMilestone->delete();

        return response()->json(['message' => 'Milestone deleted']);
    }

    private function authorizeAccount(Request $request, TradingAccount $account): void
    {
        abort_unless($account->user_id === $request->user()->id, 404);
    }
}
