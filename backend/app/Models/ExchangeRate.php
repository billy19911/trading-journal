<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

final class ExchangeRate extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'exchange_rates';

    protected $fillable = ['base_currency', 'quote_currency', 'rate', 'provider', 'fetched_at'];

    protected function casts(): array
    {
        return [
            'rate' => 'decimal:12',
            'fetched_at' => 'datetime',
        ];
    }
}
