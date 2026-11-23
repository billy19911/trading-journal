<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

final class LedgerTransaction extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $table = 'ledger_transactions';

    protected $fillable = [
        'account_id', 'transaction_type', 'amount', 'currency_code',
        'transaction_date', 'description', 'reference_id', 'idempotency_key', 'revision',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:12',
            'transaction_date' => 'datetime',
            'revision' => 'integer',
        ];
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(TradingAccount::class, 'account_id');
    }
}
