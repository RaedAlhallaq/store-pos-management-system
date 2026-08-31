<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SaleApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $cashier;
    protected Product $product;
    protected Customer $customer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->cashier = User::factory()->create(['status' => 'active']);
        $cat = Category::create(['name' => 'تصنيف مبيعات']);
        $unit = Unit::create(['name' => 'حبة', 'short_name' => 'حبة']);

        $this->product = Product::create([
            'category_id' => $cat->id,
            'unit_id' => $unit->id,
            'name' => 'حليب نيدو 2.5 كغ',
            'barcode' => '7613035987654',
            'cost_price' => 70.00,
            'selling_price' => 85.00,
            'tax_percent' => 15.00,
            'stock_quantity' => 20.000,
            'min_stock_alert' => 5.000,
        ]);

        $this->customer = Customer::create([
            'name' => 'فهد المنصور',
            'phone' => '0559988776',
            'credit_limit' => 1000.00,
            'current_balance' => 0.00,
        ]);
    }

    public function test_cash_sale_deducts_inventory_and_creates_invoice(): void
    {
        $response = $this->actingAs($this->cashier, 'sanctum')->postJson('/api/sales', [
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 2,
                    'unit_price' => 85.00,
                ],
            ],
            'payments' => [
                [
                    'payment_method' => 'cash',
                    'amount' => 195.50, // 2 * 85 = 170 + 15% tax (25.50) = 195.50
                ],
            ],
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'subtotal' => '170.00',
                    'tax_amount' => '25.50',
                    'grand_total' => '195.50',
                    'paid_amount' => '195.50',
                    'due_amount' => '0.00',
                    'payment_status' => 'paid',
                ],
            ]);

        // Verify stock deducted: 20 - 2 = 18
        $this->assertDatabaseHas('products', [
            'id' => $this->product->id,
            'stock_quantity' => 18.000,
        ]);

        // Verify stock movement created
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $this->product->id,
            'type' => 'sale',
            'quantity' => -2.000,
        ]);
    }

    public function test_credit_sale_updates_customer_balance_and_ledger(): void
    {
        $response = $this->actingAs($this->cashier, 'sanctum')->postJson('/api/sales', [
            'customer_id' => $this->customer->id,
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 1,
                    'unit_price' => 85.00,
                ],
            ],
            'payments' => [
                [
                    'payment_method' => 'credit',
                    'amount' => 97.75, // 85 + 15% (12.75) = 97.75
                ],
            ],
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'grand_total' => '97.75',
                    'paid_amount' => '0.00',
                    'due_amount' => '97.75',
                    'payment_status' => 'due',
                ],
            ]);

        // Verify Customer Debt increased
        $this->assertDatabaseHas('customers', [
            'id' => $this->customer->id,
            'current_balance' => 97.75,
        ]);

        // Verify Customer Transaction created
        $this->assertDatabaseHas('customer_transactions', [
            'customer_id' => $this->customer->id,
            'type' => 'sale_credit',
            'amount' => 97.75,
            'balance_after' => 97.75,
        ]);
    }

    public function test_void_sale_reverts_inventory_and_customer_debt(): void
    {
        // 1. Create a credit sale
        $sale = $this->actingAs($this->cashier, 'sanctum')->postJson('/api/sales', [
            'customer_id' => $this->customer->id,
            'items' => [
                [
                    'product_id' => $this->product->id,
                    'quantity' => 3,
                ],
            ],
            'payments' => [
                [
                    'payment_method' => 'credit',
                    'amount' => 293.25,
                ],
            ],
        ])->json('data');

        $this->assertEquals('17.000', $this->product->fresh()->stock_quantity);
        $this->assertEquals('293.25', $this->customer->fresh()->current_balance);

        // 2. Void the sale
        $voidResponse = $this->actingAs($this->cashier, 'sanctum')->postJson("/api/sales/{$sale['id']}/void", [
            'reason' => 'خطأ في الأصناف المدخلة',
        ]);

        $voidResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'invoice_status' => 'void',
                ],
            ]);

        // Stock restored back to 20
        $this->assertEquals('20.000', $this->product->fresh()->stock_quantity);

        // Customer debt restored back to 0
        $this->assertEquals('0.00', $this->customer->fresh()->current_balance);
    }
}
