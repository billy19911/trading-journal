<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class TradingAccount extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'trading_accounts';

    protected $fillable = [
        'user_id', 'account_name', 'broker_name', 'account_number', 'account_type',
        'currency_code', 'source_currency', 'cent_ratio', 'initial_capital',
        'initial_exchange_rate', 'initial_balance', 'starting_date',
        'daily_target_percent', 'status',
    ];

    protected function casts(): array
    {
        return [
            'cent_ratio' => 'decimal:8',
            'initial_capital' => 'decimal:12',
            'initial_exchange_rate' => 'decimal:12',
            'initial_balance' => 'decimal:12',
            'daily_target_percent' => 'decimal:6',
            'starting_date' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function journals(): HasMany
    {
        return $this->hasMany(DailyJournal::class, 'account_id');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(LedgerTransaction::class, 'account_id');
    }

    public function milestones(): HasMany
    {
        return $this->hasMany(AccountMilestone::class, 'account_id');
    }
}
