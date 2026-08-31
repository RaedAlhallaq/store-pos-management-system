<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('expense_category_id')->constrained('expense_categories');
            $table->foreignId('user_id')->constrained('users');
            $table->foreignId('cash_session_id')->nullable()->constrained('cash_sessions')->nullOnDelete();
            $table->string('expense_number', 100)->unique()->index();
            $table->decimal('amount', 12, 2);
            $table->decimal('tax_amount', 12, 2)->default(0.00);
            $table->enum('payment_method', ['cash', 'card', 'bank_transfer'])->default('cash');
            $table->date('expense_date');
            $table->text('description');
            $table->string('reference_number', 100)->nullable();
            $table->string('receipt_image')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
