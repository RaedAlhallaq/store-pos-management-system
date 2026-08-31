<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('name')->index();
            $table->string('company_name')->nullable();
            $table->string('phone', 50)->nullable()->index();
            $table->string('email')->nullable();
            $table->string('tax_number', 50)->nullable();
            $table->text('address')->nullable();
            $table->decimal('current_balance', 12, 2)->default(0.00);
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('suppliers');
    }
};
