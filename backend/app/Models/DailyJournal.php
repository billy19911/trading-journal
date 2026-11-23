<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class DailyJournal extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'daily_journals';

    protected $fillable = [
        'account_id', 'journal_date', 'opening_balance', 'daily_profit_loss',
        'closing_balance', 'daily_return', 'trading_status', 'notes', 'revision',
    ];

    protected function casts(): array
    {
        return [
            'journal_date' => 'date',
            'opening_balance' => 'decimal:12',
            'daily_profit_loss' => 'decimal:12',
            'closing_balance' => 'decimal:12',
            'daily_return' => 'decimal:10',
            'revision' => 'integer',
        ];
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(TradingAccount::class, 'account_id');
    }
}
