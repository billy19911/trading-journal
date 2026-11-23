<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class DailyJournalResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'account_id' => $this->account_id,
            'date' => $this->journal_date?->toDateString(),
            'opening_balance' => $this->opening_balance,
            'pnl' => $this->daily_profit_loss,
            'closing_balance' => $this->closing_balance,
            'daily_return' => $this->daily_return,
            'status' => $this->trading_status,
            'notes' => $this->notes,
            'revision' => $this->revision,
        ];
    }
}
