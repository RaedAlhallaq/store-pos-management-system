<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Category $category;
    protected Unit $unit;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['status' => 'active']);
        $this->category = Category::create(['name' => 'تصنيف تجريبي']);
        $this->unit = Unit::create(['name' => 'قطعة', 'short_name' => 'حبة']);
    }

    public function test_can_list_products(): void
    {
        Product::create([
            'category_id' => $this->category->id,
            'unit_id' => $this->unit->id,
            'name' => 'منتج 1',
            'cost_price' => 10.00,
            'selling_price' => 15.00,
            'stock_quantity' => 10.000,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')->getJson('/api/products');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'cost_price',
                        'selling_price',
                        'stock_quantity',
                        'profit_margin',
                    ],
                ],
                'links',
                'meta',
            ]);
    }

    public function test_can_create_product_with_initial_stock(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')->postJson('/api/products', [
            'name' => 'شاي ربيع 100 خيط',
            'barcode' => '6281009988776',
            'category_id' => $this->category->id,
            'unit_id' => $this->unit->id,
            'cost_price' => 12.00,
            'selling_price' => 16.50,
            'tax_percent' => 15.00,
            'stock_quantity' => 20.000,
            'min_stock_alert' => 5.000,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'شاي ربيع 100 خيط',
                    'barcode' => '6281009988776',
                    'stock_quantity' => '20.000',
                ],
            ]);

        $product = Product::where('barcode', '6281009988776')->first();
        $this->assertNotNull($product);

        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'type' => 'initial',
            'quantity' => 20.000,
        ]);
    }

    public function test_can_adjust_product_stock_and_record_movement(): void
    {
        $product = Product::create([
            'category_id' => $this->category->id,
            'unit_id' => $this->unit->id,
            'name' => 'عصير برتقال المراعي 1.4 لتر',
            'cost_price' => 7.00,
            'selling_price' => 9.50,
            'stock_quantity' => 15.000,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')->postJson("/api/products/{$product->id}/adjust-stock", [
            'type' => 'damage',
            'quantity' => -2.000,
            'notes' => 'عبوة مكسورة أثناء التفريغ',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'product' => [
                        'stock_quantity' => '13.000',
                    ],
                ],
            ]);

        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'type' => 'damage',
            'quantity' => -2.000,
            'balance_before' => 15.000,
            'balance_after' => 13.000,
        ]);
    }

    public function test_can_find_product_by_barcode(): void
    {
        $product = Product::create([
            'category_id' => $this->category->id,
            'unit_id' => $this->unit->id,
            'name' => 'شوكولاتة جلاكسي 40 غرام',
            'barcode' => '7622210424567',
            'cost_price' => 3.00,
            'selling_price' => 4.50,
            'stock_quantity' => 50.000,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')->getJson("/api/products/barcode/{$product->barcode}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $product->id,
                    'name' => 'شوكولاتة جلاكسي 40 غرام',
                ],
            ]);
    }

    public function test_can_get_inventory_metrics(): void
    {
        Product::create([
            'name' => 'منتج 1',
            'cost_price' => 10.00,
            'selling_price' => 15.00,
            'stock_quantity' => 10.000,
        ]);

        Product::create([
            'name' => 'منتج 2',
            'cost_price' => 20.00,
            'selling_price' => 30.00,
            'stock_quantity' => 5.000,
        ]);

        $response = $this->actingAs($this->user, 'sanctum')->getJson('/api/products/metrics');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'total_products' => 2,
                    'total_cost_value' => 200.00, // 10*10 + 20*5
                    'total_retail_value' => 300.00, // 15*10 + 30*5
                ],
            ]);
    }
}
