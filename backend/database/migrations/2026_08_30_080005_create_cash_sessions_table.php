<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cash_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->decimal('opening_cash', 12, 2)->default(0.00);
            $table->decimal('closing_cash_expected', 12, 2)->nullable();
            $table->decimal('closing_cash_actual', 12, 2)->nullable();
            $table->decimal('difference_amount', 12, 2)->nullable();
            $table->decimal('total_sales_cash', 12, 2)->default(0.00);
            $table->decimal('total_sales_card', 12, 2)->default(0.00);
            $table->decimal('total_sales_credit', 12, 2)->default(0.00);
            $table->decimal('total_expenses_cash', 12, 2)->default(0.00);
            $table->enum('status', ['open', 'closed'])->default('open');
            $table->timestamp('opened_at')->useCurrent();
            $table->timestamp('closed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cash_sessions');
    }
};
