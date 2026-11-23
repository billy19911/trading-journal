<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class TradingAccountResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->account_name,
            'broker' => $this->broker_name,
            'account_number' => $this->account_number,
            'type' => $this->account_type,
            'currency' => $this->currency_code,
            'source_currency' => $this->source_currency,
            'cent_ratio' => $this->cent_ratio,
            'initial_capital' => $this->initial_capital,
            'initial_exchange_rate' => $this->initial_exchange_rate,
            'initial_balance' => $this->initial_balance,
            'starting_date' => $this->starting_date?->toDateString(),
            'daily_target_percent' => $this->daily_target_percent,
            'status' => $this->status,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
