<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'timezone' => ['nullable', 'string', 'max:50'],
            'locale' => ['nullable', 'string', 'max:10'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'timezone' => $validated['timezone'] ?? 'Asia/Jakarta',
            'locale' => $validated['locale'] ?? 'en',
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'timezone' => $user->timezone,
                'locale' => $user->locale,
            ],
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string'],
        ]);

        $throttleKey = Str::transliterate(Str::lower($validated['email']).'|'.$request->ip());

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            throw ValidationException::withMessages([
                'email' => ["Too many login attempts. Please try again in {$seconds} seconds."],
            ]);
        }

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            RateLimiter::hit($throttleKey, 60);

            throw ValidationException::withMessages([
                'email' => ['The provided credentials do not match our records.'],
            ]);
        }

        RateLimiter::clear($throttleKey);

        $token = $user->createToken($validated['device_name'] ?? 'auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'timezone' => $user->timezone,
                'locale' => $user->locale,
            ],
        ]);
    }

    public function gmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'credential' => ['required', 'string'],
        ]);

        $clientId = config('services.google.client_id');

        if (! $clientId) {
            throw ValidationException::withMessages(['credential' => ['Google authentication is not configured.']]);
        }

        $googleResponse = Http::acceptJson()
            ->timeout(5)
            ->get('https://oauth2.googleapis.com/tokeninfo', ['id_token' => $validated['credential']]);

        $payload = $googleResponse->json();

        if (! $googleResponse->successful()
            || ! is_array($payload)
            || ($payload['aud'] ?? null) !== $clientId
            || ($payload['iss'] ?? null) !== 'https://accounts.google.com'
            || ($payload['email_verified'] ?? null) !== 'true'
            || empty($payload['email'])
        ) {
            throw ValidationException::withMessages(['credential' => ['Google token verification failed.']]);
        }

        $email = strtolower((string) $payload['email']);
        $name = $payload['name'] ?? ucfirst(str($email)->before('@'));
        $picture = $payload['picture'] ?? null;

        $user = User::firstOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make(Str::random(40)),
                'timezone' => 'Asia/Jakarta',
                'locale' => 'en',
            ],
        );

        if ($user->tradingAccounts()->count() === 0) {
            $user->tradingAccounts()->create([
                'id' => (string) Str::uuid(),
                'account_name' => 'Exness Live',
                'broker_name' => 'Exness',
                'account_number' => (string) rand(7000000, 7999999),
                'account_type' => 'Standard',
                'currency_code' => 'USD',
                'source_currency' => 'USD',
                'cent_ratio' => 1,
                'initial_capital' => 1000,
                'initial_exchange_rate' => 1,
                'initial_balance' => 1000,
                'starting_date' => now()->toDateString(),
                'daily_target_percent' => 1.0,
                'status' => 'Active',
            ]);
        }

        $token = $user->createToken('google-web')->plainTextToken;

        return response()->json([
            'message' => 'Google sign-in successful',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'picture' => $picture,
                'timezone' => $user->timezone,
                'locale' => $user->locale,
            ],
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'timezone' => $user->timezone,
                'locale' => $user->locale,
            ],
        ]);
    }
}
