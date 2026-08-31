<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PurchaseApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Product $product;
    protected Supplier $supplier;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['status' => 'active']);
        $cat = Category::create(['name' => 'تصنيف تجريبي']);
        $unit = Unit::create(['name' => 'كرتون', 'short_name' => 'كرتون']);

        $this->product = Product::create([
            'category_id' => $cat->id,
            'unit_id' => $unit->id,
            'name' => 'عصير برتقال 1 لتر',
            'cost_price' => 4.00,
            'selling_price' => 6.00,
            'tax_percent' => 15.00,
            'stock_quantity' => 10.000,
        ]);

        $this->supplier = Supplier::create([
            'name' => 'شركة المراعي',
            'company_name' => 'المراعي المحدودة',
            'phone' => '0112233445',
            'current_balance' => 0.00,
        ]);
    }

    public function test_purchase_restocks_inventory_and_updates_cost_price(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')->postJson('/api/purchases', [
            'supplier_id' => $this->supplier->id,
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 50,
                    'unit_cost' => 4.50, // Updated cost price
                    'selling_price' => 7.00, // Updated selling price
                    'tax_percent' => 15.00,
                ],
            ],
            'payments' => [
                [
                    'payment_method' => 'cash',
                    'amount' => 258.75, // 50 * 4.50 = 225 + 15% (33.75) = 258.75
                ],
            ],
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'subtotal' => '225.00',
                    'tax_amount' => '33.75',
                    'grand_total' => '258.75',
                    'payment_status' => 'paid',
                ],
            ]);

        // Stock quantity increased from 10 to 60
        $this->assertEquals('60.000', $this->product->fresh()->stock_quantity);
        // Cost price updated to 4.50
        $this->assertEquals('4.50', $this->product->fresh()->cost_price);
        // Selling price updated to 7.00
        $this->assertEquals('7.00', $this->product->fresh()->selling_price);

        // Stock movement created
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $this->product->id,
            'type' => 'purchase',
            'quantity' => 50.000,
        ]);
    }

    public function test_credit_purchase_updates_supplier_balance(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')->postJson('/api/purchases', [
            'supplier_id' => $this->supplier->id,
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 20,
                    'unit_cost' => 5.00,
                ],
            ],
            'payments' => [
                [
                    'payment_method' => 'credit',
                    'amount' => 115.00, // 20 * 5.00 = 100 + 15% = 115.00
                ],
            ],
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'due_amount' => '115.00',
                    'payment_status' => 'due',
                ],
            ]);

        // Supplier balance updated
        $this->assertEquals('115.00', $this->supplier->fresh()->current_balance);
    }
}
