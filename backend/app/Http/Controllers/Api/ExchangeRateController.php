<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExchangeRate;
use App\Models\ExchangeRateSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

final class ExchangeRateController extends Controller
{
    public function latest(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'base' => ['nullable', 'string', 'size:3', 'regex:/^[A-Za-z]{3}$/'],
            'quote' => ['nullable', 'string', 'size:3', 'regex:/^[A-Za-z]{3}$/'],
            'force' => ['nullable'],
        ]);
        $base = strtoupper($validated['base'] ?? 'USD');
        $quote = strtoupper($validated['quote'] ?? 'IDR');
        $force = filter_var($request->query('force', false), FILTER_VALIDATE_BOOLEAN);

        $setting = $request->user()
            ? ExchangeRateSetting::where('user_id', $request->user()->id)->first()
            : null;

        // Jika user mengatur manual dan tidak dipaksa refresh auto
        if (! $force && $setting?->mode === 'manual' && $setting->manual_rate !== null) {
            return response()->json([
                'base' => $base,
                'quote' => $quote,
                'rate' => (float) $setting->manual_rate,
                'mode' => 'manual',
                'source' => 'manual',
                'updated_at' => $setting->updated_at?->toIso8601String(),
            ]);
        }

        // Cari exchange rate tersimpan yang masih fresh (< 12 jam) jika tidak dipaksa
        $latest = ExchangeRate::where('base_currency', $base)
            ->where('quote_currency', $quote)
            ->latest('fetched_at')
            ->first();

        $shouldFetchLive = $request->user() !== null
            && ($force
                || ! $latest
                || $latest->fetched_at->diffInHours(now()) >= 12);

        if ($shouldFetchLive && $base === 'USD') {
            try {
                $response = Http::timeout(4)->acceptJson()->get('https://open.er-api.com/v6/latest/USD');
                if ($response->successful()) {
                    $liveRates = $response->json('rates');
                    if (is_array($liveRates) && isset($liveRates[$quote])) {
                        $liveRateVal = (float) $liveRates[$quote];
                        $latest = ExchangeRate::create([
                            'id' => (string) Str::uuid(),
                            'base_currency' => $base,
                            'quote_currency' => $quote,
                            'rate' => $liveRateVal,
                            'provider' => 'open.er-api',
                            'fetched_at' => now(),
                        ]);
                    }
                }
            } catch (\Throwable) {
                // Gunakan rate tersimpan jika ada masalah jaringan
            }
        }

        $rate = $latest ? (float) $latest->rate : ($base === 'USD' && $quote === 'IDR' ? 16700.0 : 1.0);

        return response()->json([
            'base' => $base,
            'quote' => $quote,
            'rate' => $rate,
            'mode' => $setting?->mode ?? 'auto',
            'source' => $latest?->provider ?? 'default',
            'updated_at' => $latest?->fetched_at?->toIso8601String() ?? now()->toIso8601String(),
        ]);
    }

    public function setMode(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'mode' => ['required', 'string', 'in:manual,auto,automatic'],
            'rate' => ['nullable', 'numeric', 'gt:0'],
        ]);

        $mode = $validated['mode'] === 'automatic' ? 'auto' : $validated['mode'];

        $setting = ExchangeRateSetting::updateOrCreate(
            ['user_id' => $request->user()->id],
            [
                'id' => (string) Str::uuid(),
                'mode' => $mode,
                'manual_rate' => $mode === 'manual' && isset($validated['rate']) ? $validated['rate'] : null,
                'provider' => $mode === 'auto' ? 'open.er-api' : 'manual',
            ],
        );

        return response()->json([
            'message' => 'Rate mode updated successfully',
            'data' => [
                'mode' => $setting->mode,
                'provider' => $setting->provider,
                'manual_rate' => $setting->manual_rate ? (float) $setting->manual_rate : null,
            ],
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
