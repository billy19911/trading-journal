<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExchangeRate;
use App\Models\ExchangeRateSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

final class ExchangeRateController extends Controller
{
    public function latest(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'base' => ['nullable', 'string', 'size:3', 'regex:/^[A-Za-z]{3}$/'],
            'quote' => ['nullable', 'string', 'size:3', 'regex:/^[A-Za-z]{3}$/'],
        ]);
        $base = strtoupper($validated['base'] ?? 'USD');
        $quote = strtoupper($validated['quote'] ?? 'IDR');

        $setting = $request->user()
            ? ExchangeRateSetting::where('user_id', $request->user()->id)->first()
            : null;

        if ($setting?->mode === 'manual' && $setting->manual_rate !== null) {
            return response()->json([
                'base' => $base,
                'quote' => $quote,
                'rate' => (float) $setting->manual_rate,
                'source' => 'manual',
                'updated_at' => $setting->updated_at?->toIso8601String(),
            ]);
        }

        $latest = ExchangeRate::where('base_currency', $base)
            ->where('quote_currency', $quote)
            ->latest('fetched_at')
            ->first();

        $rate = $latest ? (float) $latest->rate : ($base === 'USD' && $quote === 'IDR' ? 16700.0 : 1.0);

        return response()->json([
            'base' => $base,
            'quote' => $quote,
            'rate' => $rate,
            'source' => $latest ? 'provider' : 'default',
            'updated_at' => $latest?->fetched_at?->toIso8601String() ?? now()->toIso8601String(),
        ]);
    }

    public function storeManual(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'rate' => ['required', 'numeric', 'gt:0'],
            'provider' => ['nullable', 'string', 'max:50'],
            'refresh_interval' => ['nullable', 'string', 'in:manual,hourly,daily'],
        ]);

        $setting = ExchangeRateSetting::updateOrCreate(
            ['user_id' => $request->user()->id],
            [
                'id' => (string) Str::uuid(),
                'provider' => $validated['provider'] ?? 'manual',
                'mode' => 'manual',
                'manual_rate' => $validated['rate'],
                'refresh_interval' => $validated['refresh_interval'] ?? 'manual',
            ],
        );

        return response()->json([
            'message' => 'Rate updated successfully',
            'data' => [
                'base' => 'USD',
                'quote' => 'IDR',
                'rate' => (float) $setting->manual_rate,
                'source' => 'manual',
                'updated_at' => $setting->updated_at?->toIso8601String(),
            ],
        ]);
    }
}
