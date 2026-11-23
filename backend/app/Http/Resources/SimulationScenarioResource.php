<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

final class SimulationScenarioResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'account_id' => $this->account_id,
            'name' => $this->scenario_name,
            'initial_balance' => $this->initial_balance,
            'currency_code' => $this->currency_code,
            'daily_return' => $this->daily_return,
            'trading_days_per_month' => $this->trading_days_per_month,
            'duration_months' => $this->duration_months,
            'compounding' => $this->compounding,
            'simulation_mode' => $this->simulation_mode,
            'configuration' => $this->configuration,
            'results' => SimulationResultResource::collection($this->whenLoaded('results')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
