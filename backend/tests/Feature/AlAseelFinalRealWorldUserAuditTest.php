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
 * Phase 8.4: Final Real-World User Test & Comprehensive Audit for Al-Aseel Cleaning Supplies
 */
class AlAseelFinalRealWorldUserAuditTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $cashier;
    protected User $manager;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'name' => 'مدير المحل العام',
            'email' => 'admin@alaseel.local',
            'role' => 'admin',
            'status' => 'active',
        ]);

        $this->cashier = User::factory()->create([
            'name' => 'كاشير المحل',
            'email' => 'cashier@alaseel.local',
            'role' => 'cashier',
            'status' => 'active',
        ]);

        $this->manager = User::factory()->create([
            'name' => 'مشرف المحل',
            'email' => 'manager@alaseel.local',
            'role' => 'manager',
            'status' => 'active',
        ]);
    }

    public function test_full_real_world_user_business_cycle_and_audit(): void
    {
        // 1. Store settings verification (Al-Aseel, ILS / ₪)
        $settingsRes = $this->actingAs($this->admin, 'sanctum')->getJson('/api/settings');
        $settingsRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'store_name' => 'الأصيل للمنظفات',
                    'currency' => 'ILS',
                    'currency_symbol' => '₪',
                ],
            ]);

        // 2. Create Category & Products
        $unit = Unit::create(['name' => 'حبة', 'short_name' => 'حبة', 'allow_decimal' => false]);
        $cat = Category::create(['name' => 'منظفات منزلية', 'is_active' => true]);

        $pDish = Product::create([
            'category_id' => $cat->id,
            'unit_id' => $unit->id,
            'barcode' => '200001',
            'name' => 'سائل جلي ليمون',
            'cost_price' => 8.00,
            'selling_price' => 12.00,
            'tax_percent' => 0.00,
            'stock_quantity' => 20,
            'is_active' => true,
        ]);

        $pPowder = Product::create([
            'category_id' => $cat->id,
            'unit_id' => $unit->id,
            'barcode' => '200002',
            'name' => 'مسحوق غسيل ممتاز',
            'cost_price' => 18.00,
            'selling_price' => 25.00,
            'tax_percent' => 0.00,
            'stock_quantity' => 15,
            'is_active' => true,
        ]);

        $pBleach = Product::create([
            'category_id' => $cat->id,
            'unit_id' => $unit->id,
            'barcode' => '200003',
            'name' => 'كلور مبيض',
            'cost_price' => 5.00,
            'selling_price' => 8.00,
            'tax_percent' => 0.00,
            'stock_quantity' => 30,
            'is_active' => true,
        ]);

        $pFloor = Product::create([
            'category_id' => $cat->id,
            'unit_id' => $unit->id,
            'barcode' => '200004',
            'name' => 'منظف أرضيات معطر',
            'cost_price' => 10.00,
            'selling_price' => 15.00,
            'tax_percent' => 0.00,
            'stock_quantity' => 20,
            'is_active' => true,
        ]);

        // 3. Create Supplier & Inward Purchase on Credit
        $supplier = Supplier::create([
            'name' => 'شركة النور للمنظفات والتوريدات',
            'phone' => '0590000000',
            'current_balance' => 0.00,
            'is_active' => true,
        ]);

        // Purchase: 10x سائل جلي (80) + 5x مسحوق غسيل (90) + 10x كلور (50) = 220 ₪
        $purchaseRes = $this->actingAs($this->admin, 'sanctum')->postJson('/api/purchases', [
            'supplier_id' => $supplier->id,
            'payment_method' => 'credit',
            'invoice_date' => now()->toDateString(),
            'items' => [
                ['product_id' => $pDish->id, 'quantity' => 10, 'unit_cost' => 8.00, 'tax_percent' => 0],
                ['product_id' => $pPowder->id, 'quantity' => 5, 'unit_cost' => 18.00, 'tax_percent' => 0],
                ['product_id' => $pBleach->id, 'quantity' => 10, 'unit_cost' => 5.00, 'tax_percent' => 0],
            ],
            'payments' => [
                ['payment_method' => 'credit', 'amount' => 0.00],
            ],
        ]);
        $purchaseRes->assertStatus(201);

        // Verify inward stock increase:
        $this->assertEquals(30, (float) $pDish->fresh()->stock_quantity);
        $this->assertEquals(20, (float) $pPowder->fresh()->stock_quantity);
        $this->assertEquals(40, (float) $pBleach->fresh()->stock_quantity);
        $this->assertEquals(220.00, (float) $supplier->fresh()->current_balance);

        // 4. Supplier Partial Payment: 100 ₪
        $this->actingAs($this->admin, 'sanctum')->postJson("/api/suppliers/{$supplier->id}/payment", [
            'amount' => 100.00,
            'payment_method' => 'cash',
            'notes' => 'سداد دفعة أولى نقدية',
        ])->assertStatus(200);

        $this->assertEquals(120.00, (float) $supplier->fresh()->current_balance);

        // 5. Create Customer: أحمد محمد
        $customer = Customer::create([
            'name' => 'أحمد محمد',
            'phone' => '0591111111',
            'credit_limit' => 1000.00,
            'current_balance' => 0.00,
            'is_active' => true,
        ]);

        // 6. Open Cash Session with 500 ₪
        $openSession = $this->actingAs($this->cashier, 'sanctum')->postJson('/api/cash-sessions/open', [
            'opening_cash' => 500.00,
            'notes' => 'وردية الصباح لمحل الأصيل',
        ]);
        $openSession->assertStatus(201);
        $sessionId = $openSession->json('data.id');

        // 7. Cash Sale: 2x سائل جلي (24) + 3x كلور (24) = 48 ₪
        $this->actingAs($this->cashier, 'sanctum')->postJson('/api/sales', [
            'payment_method' => 'cash',
            'items' => [
                ['product_id' => $pDish->id, 'quantity' => 2],
                ['product_id' => $pBleach->id, 'quantity' => 3],
            ],
            'payments' => [
                ['payment_method' => 'cash', 'amount' => 48.00],
            ],
        ])->assertStatus(201);

        // 8. Card Sale: 2x مسحوق غسيل = 50 ₪
        $this->actingAs($this->cashier, 'sanctum')->postJson('/api/sales', [
            'payment_method' => 'card',
            'items' => [
                ['product_id' => $pPowder->id, 'quantity' => 2],
            ],
            'payments' => [
                ['payment_method' => 'card', 'amount' => 50.00, 'reference_number' => 'MADA-7788'],
            ],
        ])->assertStatus(201);

        // 9. Credit Sale to أحمد محمد: 2x منظف أرضيات = 30 ₪
        $this->actingAs($this->cashier, 'sanctum')->postJson('/api/sales', [
            'customer_id' => $customer->id,
            'payment_method' => 'credit',
            'items' => [
                ['product_id' => $pFloor->id, 'quantity' => 2],
            ],
            'payments' => [
                ['payment_method' => 'credit', 'amount' => 0.00],
            ],
        ])->assertStatus(201);

        $this->assertEquals(30.00, (float) $customer->fresh()->current_balance);

        // 10. Customer Partial Debt Payment: 20 ₪
        $this->actingAs($this->cashier, 'sanctum')->postJson("/api/customers/{$customer->id}/payment", [
            'amount' => 20.00,
            'payment_method' => 'cash',
            'notes' => 'سداد جزء من الحساب',
        ])->assertStatus(200);

        $this->assertEquals(10.00, (float) $customer->fresh()->current_balance);

        // 11. Operating Expense: 30 ₪ نقل
        $expCat = ExpenseCategory::create(['name' => 'نقل وتوصيل', 'is_active' => true]);
        $this->actingAs($this->cashier, 'sanctum')->postJson('/api/expenses', [
            'expense_category_id' => $expCat->id,
            'amount' => 30.00,
            'payment_method' => 'cash',
            'description' => 'أجرة نقل منظفات',
        ])->assertStatus(201);

        // 12. Cash Movements: IN 50 ₪, OUT 20 ₪
        $this->actingAs($this->cashier, 'sanctum')->postJson("/api/cash-sessions/{$sessionId}/cash-movement", [
            'type' => 'in',
            'amount' => 50.00,
            'reason' => 'إيداع نقدي إضافي',
        ])->assertStatus(201);

        $this->actingAs($this->cashier, 'sanctum')->postJson("/api/cash-sessions/{$sessionId}/cash-movement", [
            'type' => 'out',
            'amount' => 20.00,
            'reason' => 'سحب نقدي لمصاريف صغيرة',
        ])->assertStatus(201);

        // 13. Void Sale Test (Create and Cancel)
        $voidSale = $this->actingAs($this->cashier, 'sanctum')->postJson('/api/sales', [
            'payment_method' => 'cash',
            'items' => [
                ['product_id' => $pDish->id, 'quantity' => 1],
            ],
            'payments' => [
                ['payment_method' => 'cash', 'amount' => 12.00],
            ],
        ]);
        $voidSaleId = $voidSale->json('data.id');

        $this->actingAs($this->cashier, 'sanctum')->postJson("/api/sales/{$voidSaleId}/void", [
            'reason' => 'إلغاء لطلب الزبون',
        ])->assertStatus(200);

        // Verify stock restored: 30 - 2 (sale) - 1 (temp) + 1 (void) = 28
        $this->assertEquals(28, (float) $pDish->fresh()->stock_quantity);

        // 14. Cash Session Closing & Reconciliation:
        // Expected = 500 (Open) + 48 (Cash Sales) + 20 (Cust Pay) + 50 (Cash IN) - 30 (Expense) - 20 (Cash OUT) = 568 ₪
        $closeRes = $this->actingAs($this->cashier, 'sanctum')->postJson("/api/cash-sessions/{$sessionId}/close", [
            'closing_cash_actual' => 568.00,
            'notes' => 'إقفال وردية متطابق',
        ]);
        $closeRes->assertStatus(200)
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

        // 15. Financial Reports & P&L Statement Verification:
        $plRes = $this->actingAs($this->admin, 'sanctum')->getJson('/api/reports/profit-loss');
        $plRes->assertStatus(200);
        $pl = $plRes->json('data');

        // Revenue = 48 + 50 + 30 = 128 ₪
        $this->assertEquals(128.00, (float) $pl['total_revenue']);
        // COGS = (2*8 + 3*5) + (2*18) + (2*10) = 31 + 36 + 20 = 87 ₪
        $this->assertEquals(87.00, (float) $pl['cost_of_goods_sold']);
        // Gross Profit = 128 - 87 = 41 ₪
        $this->assertEquals(41.00, (float) $pl['gross_profit']);
        // Expenses = 30 ₪
        $this->assertEquals(30.00, (float) $pl['total_operating_expenses']);
        // Net Profit = 41 - 30 = 11 ₪
        $this->assertEquals(11.00, (float) $pl['net_profit']);

        // 16. Inventory Ledger Totals:
        $this->assertEquals(28, (float) $pDish->fresh()->stock_quantity);
        $this->assertEquals(18, (float) $pPowder->fresh()->stock_quantity);
        $this->assertEquals(37, (float) $pBleach->fresh()->stock_quantity);
        $this->assertEquals(18, (float) $pFloor->fresh()->stock_quantity);

        // 17. Security & Role Constraints:
        // Cashier cannot access DB export or change store settings
        $this->actingAs($this->cashier, 'sanctum')->getJson('/api/backup/export')->assertStatus(403);
        $this->actingAs($this->cashier, 'sanctum')->postJson('/api/settings', ['store_name' => 'hack'])->assertStatus(403);

        // Admin can access both
        $this->actingAs($this->admin, 'sanctum')->get('/api/backup/export')->assertStatus(200);
    }

    /**
     * Test Cash Drawer Variance Handling (Balanced, Deficit / Shortage, Surplus / Overage)
     */
    public function test_cash_drawer_variance_handling(): void
    {
        // 1. Deficit scenario
        $s1 = $this->actingAs($this->cashier, 'sanctum')->postJson('/api/cash-sessions/open', ['opening_cash' => 200.00]);
        $s1Id = $s1->json('data.id');

        $closeDeficit = $this->actingAs($this->cashier, 'sanctum')->postJson("/api/cash-sessions/{$s1Id}/close", [
            'closing_cash_actual' => 190.00, // 10 ₪ shortage
        ]);
        $closeDeficit->assertStatus(200)
            ->assertJson([
                'data' => [
                    'closing_cash_expected' => '200.00',
                    'closing_cash_actual' => '190.00',
                    'difference_amount' => '-10.00',
                ],
                'z_report' => [
                    'variance_status' => 'deficit',
                    'difference' => -10.0,
                ],
            ]);

        // 2. Surplus scenario
        $s2 = $this->actingAs($this->cashier, 'sanctum')->postJson('/api/cash-sessions/open', ['opening_cash' => 200.00]);
        $s2Id = $s2->json('data.id');

        $closeSurplus = $this->actingAs($this->cashier, 'sanctum')->postJson("/api/cash-sessions/{$s2Id}/close", [
            'closing_cash_actual' => 215.00, // 15 ₪ overage
        ]);
        $closeSurplus->assertStatus(200)
            ->assertJson([
                'data' => [
                    'closing_cash_expected' => '200.00',
                    'closing_cash_actual' => '215.00',
                    'difference_amount' => '15.00',
                ],
                'z_report' => [
                    'variance_status' => 'surplus',
                    'difference' => 15.0,
                ],
            ]);
    }
}
