<?php

declare(strict_types=1);

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ExchangeRateController;
use App\Http\Controllers\Api\JournalController;
use App\Http\Controllers\Api\MilestoneController;
use App\Http\Controllers\Api\SimulationController;
use App\Http\Controllers\Api\TradingAccountController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function (): void {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/gmail', [AuthController::class, 'gmail']);

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

Route::get('exchange-rates/latest', [ExchangeRateController::class, 'latest']);

Route::middleware('auth:sanctum')->group(function (): void {
    Route::apiResource('accounts', TradingAccountController::class)
        ->parameters(['accounts' => 'tradingAccount']);

    Route::get('accounts/{tradingAccount}/journals', [JournalController::class, 'index']);
    Route::post('accounts/{tradingAccount}/journals', [JournalController::class, 'store']);
    Route::get('accounts/{tradingAccount}/journals/{dailyJournal}', [JournalController::class, 'show']);
    Route::get('accounts/{tradingAccount}/transactions', [JournalController::class, 'transactions']);
    Route::post('accounts/{tradingAccount}/transactions', [JournalController::class, 'recordTransaction']);

    Route::get('accounts/{tradingAccount}/milestones', [MilestoneController::class, 'index']);
    Route::post('accounts/{tradingAccount}/milestones', [MilestoneController::class, 'store']);
    Route::delete('accounts/{tradingAccount}/milestones/{accountMilestone}', [MilestoneController::class, 'destroy']);

    Route::apiResource('scenarios', SimulationController::class)
        ->except(['update'])
        ->parameters(['scenarios' => 'simulationScenario']);

    Route::post('exchange-rates/manual', [ExchangeRateController::class, 'storeManual']);
});
