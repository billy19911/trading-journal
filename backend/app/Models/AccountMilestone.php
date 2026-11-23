<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class AccountMilestone extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'account_milestones';

    protected $fillable = ['account_id', 'target_balance', 'currency_code', 'achieved_at'];

    protected function casts(): array
    {
        return [
            'target_balance' => 'decimal:12',
            'achieved_at' => 'datetime',
        ];
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(TradingAccount::class, 'account_id');
    }
}
