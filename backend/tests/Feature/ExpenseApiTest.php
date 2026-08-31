<?php

namespace Tests\Feature;

use App\Models\ExpenseCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExpenseApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected ExpenseCategory $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['status' => 'active']);
        $this->category = ExpenseCategory::create([
            'name' => 'فواتير كهرباء ومياه',
            'is_active' => true,
        ]);
    }

    public function test_can_record_expense(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')->postJson('/api/expenses', [
            'expense_category_id' => $this->category->id,
            'description' => 'فاتورة كهرباء شهر أغسطس',
            'amount' => 450.00,
            'payment_method' => 'cash',
            'expense_date' => now()->toDateString(),
            'notes' => 'سداد نقدي من الصندوق',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'description' => 'فاتورة كهرباء شهر أغسطس',
                    'amount' => '450.00',
                    'payment_method' => 'cash',
                ],
            ]);

        $this->assertDatabaseHas('expenses', [
            'expense_category_id' => $this->category->id,
            'description' => 'فاتورة كهرباء شهر أغسطس',
            'amount' => 450.00,
        ]);
    }
}
