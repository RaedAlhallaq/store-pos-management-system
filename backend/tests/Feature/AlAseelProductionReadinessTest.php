<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Customer;
use App\Models\ExpenseCategory;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Phase 9: Production Readiness & Hardening Audit Test for Al-Aseel Cleaning Supplies
 */
class AlAseelProductionReadinessTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $manager;
    protected User $cashier;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'name' => 'مدير النظام',
            'email' => 'admin@alaseel.local',
            'role' => 'admin',
            'status' => 'active',
        ]);

        $this->manager = User::factory()->create([
            'name' => 'مشرف المحل',
            'email' => 'manager@alaseel.local',
            'role' => 'manager',
            'status' => 'active',
        ]);

        $this->cashier = User::factory()->create([
            'name' => 'كاشير المحل',
            'email' => 'cashier@alaseel.local',
            'role' => 'cashier',
            'status' => 'active',
        ]);
    }

    public function test_full_production_readiness_lifecycle(): void
    {
        // 1. Health Endpoint Check
        $health = $this->getJson('/api/health');
        $health->assertStatus(200)
            ->assertJson([
                'status' => 'ok',
            ]);

        // 2. Settings Endpoint Check (Al-Aseel, ₪, ILS)
        $settings = $this->actingAs($this->admin, 'sanctum')->getJson('/api/settings');
        $settings->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'store_name' => 'الأصيل للمنظفات',
                    'currency' => 'ILS',
                    'currency_symbol' => '₪',
                ],
            ]);

        // 3. Category & Unit setup
        $unit = Unit::create(['name' => 'حبة', 'short_name' => 'حبة', 'allow_decimal' => false]);
        $category = Category::create(['name' => 'منظفات ومعقمات', 'is_active' => true]);

        // 4. Input Validation: Reject negative price/stock
        $invalidProduct = $this->actingAs($this->admin, 'sanctum')->postJson('/api/products', [
            'category_id' => $category->id,
            'unit_id' => $unit->id,
            'barcode' => 'PROD-NEG',
            'name' => 'منتج غير صالح',
            'cost_price' => -10.00,
            'selling_price' => 15.00,
            'stock_quantity' => 10,
        ]);
        $invalidProduct->assertStatus(422);

        // 5. Valid Products Creation
        $p1 = Product::create([
            'category_id' => $category->id,
            'unit_id' => $unit->id,
            'barcode' => 'P-101',
            'name' => 'سائل جلي مركز',
            'cost_price' => 8.00,
            'selling_price' => 12.00,
            'tax_percent' => 0.00,
            'stock_quantity' => 20,
            'is_active' => true,
        ]);

        $p2 = Product::create([
            'category_id' => $category->id,
            'unit_id' => $unit->id,
            'barcode' => 'P-102',
            'name' => 'مسحوق غسيل أوتوماتيك',
            'cost_price' => 18.00,
            'selling_price' => 25.00,
            'tax_percent' => 0.00,
            'stock_quantity' => 15,
            'is_active' => true,
        ]);

        $p3 = Product::create([
            'category_id' => $category->id,
            'unit_id' => $unit->id,
            'barcode' => 'P-103',
            'name' => 'كلور تعقيم وتبييض',
            'cost_price' => 5.00,
            'selling_price' => 8.00,
            'tax_percent' => 0.00,
            'stock_quantity' => 30,
            'is_active' => true,
        ]);

        // 6. Supplier Purchase on Credit
        $supplier = Supplier::create([
            'name' => 'شركة النور للمنظفات',
            'phone' => '0590000000',
            'current_balance' => 0.00,
            'is_active' => true,
        ]);

        $purchase = $this->actingAs($this->admin, 'sanctum')->postJson('/api/purchases', [
            'supplier_id' => $supplier->id,
            'payment_method' => 'credit',
            'invoice_date' => now()->toDateString(),
            'items' => [
                ['product_id' => $p1->id, 'quantity' => 10, 'unit_cost' => 8.00, 'tax_percent' => 0],
                ['product_id' => $p2->id, 'quantity' => 5, 'unit_cost' => 18.00, 'tax_percent' => 0],
                ['product_id' => $p3->id, 'quantity' => 10, 'unit_cost' => 5.00, 'tax_percent' => 0],
            ],
            'payments' => [
                ['payment_method' => 'credit', 'amount' => 0.00],
            ],
        ]);
        $purchase->assertStatus(201);

        // Verify Inward Inventory & Supplier Debt
        $this->assertEquals(30, (float) $p1->fresh()->stock_quantity);
        $this->assertEquals(20, (float) $p2->fresh()->stock_quantity);
        $this->assertEquals(40, (float) $p3->fresh()->stock_quantity);
        $this->assertEquals(220.00, (float) $supplier->fresh()->current_balance);

        // 7. Supplier Payment (100 ₪)
        $suppPay = $this->actingAs($this->admin, 'sanctum')->postJson("/api/suppliers/{$supplier->id}/payment", [
            'amount' => 100.00,
            'payment_method' => 'cash',
            'notes' => 'دفعة نقدية لحساب التوريد',
        ]);
        $suppPay->assertStatus(200);
        $this->assertEquals(120.00, (float) $supplier->fresh()->current_balance);

        // 8. Customer Creation
        $customer = Customer::create([
            'name' => 'أحمد محمد',
            'phone' => '0591111111',
            'credit_limit' => 500.00,
            'current_balance' => 0.00,
            'is_active' => true,
        ]);

        // 9. Open Cash Session
        $openSession = $this->actingAs($this->cashier, 'sanctum')->postJson('/api/cash-sessions/open', [
            'opening_cash' => 500.00,
            'notes' => 'وردية عمل منتظمة',
        ]);
        $openSession->assertStatus(201);
        $sessionId = $openSession->json('data.id');

        // 10. Cash Sale (48 ₪)
        $cashSale = $this->actingAs($this->cashier, 'sanctum')->postJson('/api/sales', [
            'payment_method' => 'cash',
            'items' => [
                ['product_id' => $p1->id, 'quantity' => 2],
                ['product_id' => $p3->id, 'quantity' => 3],
            ],
            'payments' => [
                ['payment_method' => 'cash', 'amount' => 48.00],
            ],
        ]);
        $cashSale->assertStatus(201);

        // 11. Card Sale (50 ₪)
        $cardSale = $this->actingAs($this->cashier, 'sanctum')->postJson('/api/sales', [
            'payment_method' => 'card',
            'items' => [
                ['product_id' => $p2->id, 'quantity' => 2],
            ],
            'payments' => [
                ['payment_method' => 'card', 'amount' => 50.00, 'reference_number' => 'NET-9911'],
            ],
        ]);
        $cardSale->assertStatus(201);

        // 12. Credit Sale (30 ₪ to Ahmed)
        $p4 = Product::create([
            'category_id' => $category->id,
            'unit_id' => $unit->id,
            'barcode' => 'P-104',
            'name' => 'معطر أرضيات الورد',
            'cost_price' => 10.00,
            'selling_price' => 15.00,
            'tax_percent' => 0.00,
            'stock_quantity' => 20,
            'is_active' => true,
        ]);

        $creditSale = $this->actingAs($this->cashier, 'sanctum')->postJson('/api/sales', [
            'customer_id' => $customer->id,
            'payment_method' => 'credit',
            'items' => [
                ['product_id' => $p4->id, 'quantity' => 2],
            ],
            'payments' => [
                ['payment_method' => 'credit', 'amount' => 0.00],
            ],
        ]);
        $creditSale->assertStatus(201);
        $this->assertEquals(30.00, (float) $customer->fresh()->current_balance);

        // 13. Customer Debt Settlement (20 ₪)
        $custPay = $this->actingAs($this->cashier, 'sanctum')->postJson("/api/customers/{$customer->id}/payment", [
            'amount' => 20.00,
            'payment_method' => 'cash',
            'notes' => 'سداد نقدي من العميل أحمد',
        ]);
        $custPay->assertStatus(200);
        $this->assertEquals(10.00, (float) $customer->fresh()->current_balance);

        // 14. Expense (30 ₪)
        $expCat = ExpenseCategory::create(['name' => 'نقل وتوصيل', 'is_active' => true]);
        $expense = $this->actingAs($this->cashier, 'sanctum')->postJson('/api/expenses', [
            'expense_category_id' => $expCat->id,
            'amount' => 30.00,
            'payment_method' => 'cash',
            'description' => 'أجرة شحن وتوصيل منظفات',
        ]);
        $expense->assertStatus(201);

        // 15. Cash In / Out
        $this->actingAs($this->cashier, 'sanctum')->postJson("/api/cash-sessions/{$sessionId}/cash-movement", [
            'type' => 'in',
            'amount' => 50.00,
            'reason' => 'إيداع نقدي',
        ])->assertStatus(201);

        $this->actingAs($this->cashier, 'sanctum')->postJson("/api/cash-sessions/{$sessionId}/cash-movement", [
            'type' => 'out',
            'amount' => 20.00,
            'reason' => 'سحب نقدي',
        ])->assertStatus(201);

        // 16. Void Sale Test
        $tempSale = $this->actingAs($this->cashier, 'sanctum')->postJson('/api/sales', [
            'payment_method' => 'cash',
            'items' => [
                ['product_id' => $p1->id, 'quantity' => 1],
            ],
            'payments' => [
                ['payment_method' => 'cash', 'amount' => 12.00],
            ],
        ]);
        $tempSaleId = $tempSale->json('data.id');

        $this->actingAs($this->cashier, 'sanctum')->postJson("/api/sales/{$tempSaleId}/void", [
            'reason' => 'إلغاء بناء على طلب الزبون',
        ])->assertStatus(200);

        // Stock restored back to 28
        $this->assertEquals(28, (float) $p1->fresh()->stock_quantity);

        // 17. Close Session (Expected = 568 ₪, Actual = 568 ₪ -> Balanced)
        $closeSession = $this->actingAs($this->cashier, 'sanctum')->postJson("/api/cash-sessions/{$sessionId}/close", [
            'closing_cash_actual' => 568.00,
            'notes' => 'إغلاق ومطابقة نهاية الوردية',
        ]);
        $closeSession->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'closed',
                    'closing_cash_expected' => '568.00',
                    'closing_cash_actual' => '568.00',
                    'difference_amount' => '0.00',
                ],
                'z_report' => [
                    'variance_status' => 'balanced',
                    'difference' => 0.0,
                    'total_sales_cash' => 48.0,
                    'total_sales_card' => 50.0,
                    'total_sales_credit' => 30.0,
                    'total_customer_payments_cash' => 20.0,
                ],
            ]);

        // 18. P&L Statement Verification
        $plRes = $this->actingAs($this->admin, 'sanctum')->getJson('/api/reports/profit-loss');
        $plRes->assertStatus(200);
        $pl = $plRes->json('data');

        $this->assertEquals(128.00, (float) $pl['total_revenue']);
        $this->assertEquals(87.00, (float) $pl['cost_of_goods_sold']);
        $this->assertEquals(41.00, (float) $pl['gross_profit']);
        $this->assertEquals(30.00, (float) $pl['total_operating_expenses']);
        $this->assertEquals(11.00, (float) $pl['net_profit']);

        // 19. Security Barriers (RBAC)
        $this->actingAs($this->cashier, 'sanctum')->getJson('/api/backup/export')->assertStatus(403);
        $this->actingAs($this->cashier, 'sanctum')->postJson('/api/settings', ['store_name' => 'hacked'])->assertStatus(403);
        $this->actingAs($this->admin, 'sanctum')->get('/api/backup/export')->assertStatus(200);
    }
}
