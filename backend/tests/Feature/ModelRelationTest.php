<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\Setting;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ModelRelationTest extends TestCase
{
    use RefreshDatabase;

    public function test_category_and_unit_relationships_with_product(): void
    {
        $category = Category::create([
            'name' => 'تصنيف تجريبي',
            'code' => 'TEST_CAT',
        ]);

        $unit = Unit::create([
            'name' => 'حبة تجريبية',
            'short_name' => 'حبة',
            'allow_decimal' => false,
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'unit_id' => $unit->id,
            'name' => 'منتج تجريبي 1',
            'barcode' => '999000111222',
            'cost_price' => 10.00,
            'selling_price' => 15.00,
            'tax_percent' => 15.00,
            'stock_quantity' => 20.000,
            'min_stock_alert' => 5.000,
        ]);

        $this->assertEquals('تصنيف تجريبي', $product->category->name);
        $this->assertEquals('حبة', $product->unit->short_name);
        $this->assertCount(1, $category->products);
    }

    public function test_sale_with_items_and_payments_relationships(): void
    {
        $user = User::factory()->create();
        $customer = Customer::create([
            'name' => 'عميل اختبار',
            'phone' => '0501112233',
        ]);

        $sale = Sale::create([
            'invoice_number' => 'POS-TEST-001',
            'user_id' => $user->id,
            'customer_id' => $customer->id,
            'subtotal' => 100.00,
            'tax_amount' => 15.00,
            'discount_amount' => 0.00,
            'grand_total' => 115.00,
            'paid_amount' => 115.00,
            'due_amount' => 0.00,
            'payment_status' => 'paid',
            'payment_method' => 'cash',
        ]);

        $sale->items()->create([
            'product_name' => 'عنصر بيع 1',
            'unit_cost' => 30.00,
            'unit_price' => 50.00,
            'quantity' => 2.000,
            'tax_percent' => 15.00,
            'tax_amount' => 15.00,
            'discount_amount' => 0.00,
            'subtotal' => 115.00,
        ]);

        $sale->payments()->create([
            'payment_method' => 'cash',
            'amount' => 115.00,
        ]);

        $this->assertCount(1, $sale->items);
        $this->assertCount(1, $sale->payments);
        $this->assertEquals('عميل اختبار', $sale->customer->name);
        $this->assertEquals('115.00', $sale->grand_total);
    }

    public function test_settings_helper_get_and_set(): void
    {
        Setting::set('test_setting_key', 'قيمة الإعداد التجريبي', 'general', 'string');

        $this->assertEquals('قيمة الإعداد التجريبي', Setting::get('test_setting_key'));
    }
}
