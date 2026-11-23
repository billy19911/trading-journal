<?php

declare(strict_types=1);

namespace App\Services;

final class CurrencyService
{
    /**
     * Convert capital using USD pivot per PRD Section 3 & 4.
     */
    public function convert(
        float $amount,
        string $source,
        string $target,
        float $usdIdrRate = 16700.0,
        float $centRatio = 100.0
    ): float {
        if ($amount === 0.0) {
            return 0.0;
        }

        $ratio = $centRatio > 0 ? $centRatio : 1.0;
        $rate = $usdIdrRate > 0 ? $usdIdrRate : 1.0;

        // Step 1: Normalize source to USD pivot
        $usd = match ($source) {
            'USD' => $amount,
            'IDR' => $amount / $rate,
            'USC' => $amount / $ratio,
            default => $amount,
        };

        // Step 2: Convert USD pivot to target
        return match ($target) {
            'USD' => $usd,
            'IDR' => $usd * $rate,
            'USC' => $usd * $ratio,
            default => $usd,
        };
    }
}
