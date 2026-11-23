<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class SimulationResult extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'simulation_results';

    protected $fillable = [
        'scenario_id',
        'period_number',
        'opening_balance',
        'total_profit_loss',
        'closing_balance',
        'return_percentage',
        'drawdown_percentage',
    ];

    protected function casts(): array
    {
        return [
            'period_number' => 'integer',
            'opening_balance' => 'decimal:12',
            'total_profit_loss' => 'decimal:12',
            'closing_balance' => 'decimal:12',
            'return_percentage' => 'decimal:10',
            'drawdown_percentage' => 'decimal:10',
        ];
    }

    public function scenario(): BelongsTo
    {
        return $this->belongsTo(SimulationScenario::class, 'scenario_id');
    }
}
