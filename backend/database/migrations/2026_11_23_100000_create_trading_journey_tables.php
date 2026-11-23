<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trading_accounts', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('account_name');
            $table->string('broker_name');
            $table->string('account_number')->nullable();
            $table->string('account_type');
            $table->string('currency_code', 3);
            $table->string('source_currency', 3);
            $table->decimal('cent_ratio', 20, 8)->default(1);
            $table->decimal('initial_capital', 30, 12);
            $table->decimal('initial_exchange_rate', 30, 12)->default(1);
            $table->decimal('initial_balance', 30, 12);
            $table->date('starting_date');
            $table->decimal('daily_target_percent', 12, 6)->default(0);
            $table->string('status')->default('Active');
            $table->timestamps();
            $table->index(['user_id', 'status']);
        });

        Schema::create('exchange_rates', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('base_currency', 3);
            $table->string('quote_currency', 3);
            $table->decimal('rate', 30, 12);
            $table->string('provider');
            $table->timestampTz('fetched_at');
            $table->timestamps();
            $table->unique(['base_currency', 'quote_currency', 'fetched_at']);
        });

        Schema::create('ledger_transactions', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('account_id')->constrained('trading_accounts')->cascadeOnDelete();
            $table->string('transaction_type');
            $table->decimal('amount', 30, 12);
            $table->string('currency_code', 3);
            $table->timestampTz('transaction_date');
            $table->text('description')->nullable();
            $table->uuid('reference_id')->nullable();
            $table->string('idempotency_key')->unique();
            $table->unsignedInteger('revision')->default(1);
            $table->softDeletes();
            $table->timestamps();
            $table->index(['account_id', 'transaction_date']);
        });

        Schema::create('daily_journals', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('account_id')->constrained('trading_accounts')->cascadeOnDelete();
            $table->date('journal_date');
            $table->decimal('opening_balance', 30, 12);
            $table->decimal('daily_profit_loss', 30, 12);
            $table->decimal('closing_balance', 30, 12);
            $table->decimal('daily_return', 18, 10);
            $table->string('trading_status');
            $table->text('notes')->nullable();
            $table->unsignedInteger('revision')->default(1);
            $table->timestamps();
            $table->unique(['account_id', 'journal_date']);
        });

        Schema::create('simulation_scenarios', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('account_id')->nullable()->constrained('trading_accounts')->nullOnDelete();
            $table->string('scenario_name');
            $table->decimal('initial_balance', 30, 12);
            $table->string('currency_code', 3);
            $table->decimal('daily_return', 18, 10);
            $table->unsignedSmallInteger('trading_days_per_month');
            $table->unsignedSmallInteger('duration_months');
            $table->boolean('compounding')->default(true);
            $table->string('simulation_mode')->default('fixed');
            $table->json('configuration')->nullable();
            $table->timestamps();
        });

        Schema::create('simulation_results', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('scenario_id')->constrained('simulation_scenarios')->cascadeOnDelete();
            $table->unsignedSmallInteger('period_number');
            $table->decimal('opening_balance', 30, 12);
            $table->decimal('total_profit_loss', 30, 12);
            $table->decimal('closing_balance', 30, 12);
            $table->decimal('return_percentage', 18, 10);
            $table->decimal('drawdown_percentage', 18, 10);
            $table->timestamps();
            $table->unique(['scenario_id', 'period_number']);
        });

        Schema::create('account_milestones', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('account_id')->constrained('trading_accounts')->cascadeOnDelete();
            $table->decimal('target_balance', 30, 12);
            $table->string('currency_code', 3);
            $table->timestampTz('achieved_at')->nullable();
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('account_id')->nullable()->constrained('trading_accounts')->nullOnDelete();
            $table->string('entity_type');
            $table->uuid('entity_id');
            $table->string('action');
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->timestampTz('created_at');
            $table->index(['user_id', 'entity_type', 'entity_id']);
        });

        Schema::create('user_devices', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('device_key')->unique();
            $table->string('ip_address', 45)->nullable();
            $table->timestampTz('last_seen_at')->nullable();
            $table->timestamps();
        });

        Schema::create('user_preferences', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('theme')->default('dark');
            $table->string('language', 10)->default('en');
            $table->string('display_currency', 3)->nullable();
            $table->json('preferences')->nullable();
            $table->timestamps();
        });

        Schema::create('exchange_rate_settings', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('provider')->default('manual');
            $table->string('mode')->default('manual');
            $table->decimal('manual_rate', 30, 12)->nullable();
            $table->string('refresh_interval')->default('daily');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exchange_rate_settings');
        Schema::dropIfExists('user_preferences');
        Schema::dropIfExists('user_devices');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('account_milestones');
        Schema::dropIfExists('simulation_results');
        Schema::dropIfExists('simulation_scenarios');
        Schema::dropIfExists('daily_journals');
        Schema::dropIfExists('ledger_transactions');
        Schema::dropIfExists('exchange_rates');
        Schema::dropIfExists('trading_accounts');
    }
};
