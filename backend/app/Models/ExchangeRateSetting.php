<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class ExchangeRateSetting extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'exchange_rate_settings';

    protected $fillable = [
        'user_id',
        'provider',
        'mode',
        'manual_rate',
        'refresh_interval',
    ];

    protected function casts(): array
    {
        return [
            'manual_rate' => 'decimal:12',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
