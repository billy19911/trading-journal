<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class SimulationScenario extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'simulation_scenarios';

    protected $fillable = [
        'user_id',
        'account_id',
        'scenario_name',
        'initial_balance',
        'currency_code',
        'daily_return',
        'trading_days_per_month',
        'duration_months',
        'compounding',
        'simulation_mode',
        'configuration',
    ];

    protected function casts(): array
    {
        return [
            'initial_balance' => 'decimal:12',
            'daily_return' => 'decimal:10',
            'trading_days_per_month' => 'integer',
            'duration_months' => 'integer',
            'compounding' => 'boolean',
            'configuration' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(TradingAccount::class, 'account_id');
    }

    public function results(): HasMany
    {
        return $this->hasMany(SimulationResult::class, 'scenario_id');
    }
}
