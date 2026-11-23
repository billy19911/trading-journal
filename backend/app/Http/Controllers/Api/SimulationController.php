<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SimulationScenarioResource;
use App\Models\SimulationScenario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class SimulationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $scenarios = $request->user()
            ->simulationScenarios()
            ->latest()
            ->get();

        return SimulationScenarioResource::collection($scenarios)->response();
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'account_id' => ['nullable', 'string', 'uuid', 'exists:trading_accounts,id'],
            'scenario_name' => ['required', 'string', 'max:255'],
            'initial_balance' => ['required', 'numeric', 'gt:0'],
            'currency_code' => ['required', 'string', 'size:3'],
            'daily_return' => ['required', 'numeric', 'between:-100,100'],
            'trading_days_per_month' => ['required', 'integer', 'between:1,31'],
            'duration_months' => ['required', 'integer', 'between:1,120'],
            'compounding' => ['boolean'],
            'simulation_mode' => ['nullable', 'string', 'in:fixed,dynamic,monte_carlo'],
            'configuration' => ['nullable', 'array'],
            'results' => ['nullable', 'array'],
            'results.*.period_number' => ['required_with:results', 'integer', 'min:1'],
            'results.*.opening_balance' => ['required_with:results', 'numeric'],
            'results.*.total_profit_loss' => ['required_with:results', 'numeric'],
            'results.*.closing_balance' => ['required_with:results', 'numeric'],
            'results.*.return_percentage' => ['required_with:results', 'numeric'],
            'results.*.drawdown_percentage' => ['nullable', 'numeric'],
        ]);

        $scenario = DB::transaction(function () use ($request, $validated): SimulationScenario {
            $scenario = $request->user()->simulationScenarios()->create([
                'id' => (string) Str::uuid(),
                'account_id' => $validated['account_id'] ?? null,
                'scenario_name' => $validated['scenario_name'],
                'initial_balance' => $validated['initial_balance'],
                'currency_code' => $validated['currency_code'],
                'daily_return' => $validated['daily_return'],
                'trading_days_per_month' => $validated['trading_days_per_month'],
                'duration_months' => $validated['duration_months'],
                'compounding' => $validated['compounding'] ?? true,
                'simulation_mode' => $validated['simulation_mode'] ?? 'fixed',
                'configuration' => $validated['configuration'] ?? null,
            ]);

            if (! empty($validated['results'])) {
                foreach ($validated['results'] as $res) {
                    $scenario->results()->create([
                        'id' => (string) Str::uuid(),
                        'period_number' => $res['period_number'],
                        'opening_balance' => $res['opening_balance'],
                        'total_profit_loss' => $res['total_profit_loss'],
                        'closing_balance' => $res['closing_balance'],
                        'return_percentage' => $res['return_percentage'],
                        'drawdown_percentage' => $res['drawdown_percentage'] ?? 0.0,
                    ]);
                }
            }

            return $scenario;
        });

        return (new SimulationScenarioResource($scenario->load('results')))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, SimulationScenario $simulationScenario): SimulationScenarioResource
    {
        abort_unless($simulationScenario->user_id === $request->user()->id, 404);

        return new SimulationScenarioResource($simulationScenario->load('results'));
    }

    public function destroy(Request $request, SimulationScenario $simulationScenario): JsonResponse
    {
        abort_unless($simulationScenario->user_id === $request->user()->id, 404);
        $simulationScenario->delete();

        return response()->json(['message' => 'Scenario deleted']);
    }
}
