<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class SimulationResultResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'period' => $this->period_number,
            'opening_balance' => $this->opening_balance,
            'pnl' => $this->total_profit_loss,
            'closing_balance' => $this->closing_balance,
            'return_percentage' => $this->return_percentage,
            'drawdown_percentage' => $this->drawdown_percentage,
        ];
    }
}
