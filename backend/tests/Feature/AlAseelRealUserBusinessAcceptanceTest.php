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
 * Phase 8.3: Real User Business Acceptance Test for "الأصيل للمنظفات"
 */
class AlAseelRealUserBusinessAcceptanceTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $cashier;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'name' => 'مدير المحل',
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
    }

    public function test_complete_real_user_business_acceptance_flow(): void
    {
        // =============================================================
        // STEP 2 & 3: Login & Store Setup Verification
        // =============================================================
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

        // =============================================================
        // STEP 4: Create Category & Products
        // =============================================================
        $unit = Unit::create(['name' => 'حبة', 'short_name' => 'حبة', 'allow_decimal' => false]);
        $cat = Category::create(['name' => 'منظفات', 'is_active' => true]);

        // 1. سائل جلي: Cost 8, Sell 12, Stock 20, Barcode 100001
        $p1Res = $this->actingAs($this->admin, 'sanctum')->postJson('/api/products', [
            'category_id' => $cat->id,
            'unit_id' => $unit->id,
            'barcode' => '100001',
            'name' => 'سائل جلي',
            'cost_price' => 8.00,
            'selling_price' => 12.00,
            'tax_percent' => 0.00,
            'stock_quantity' => 20,
            'min_stock_level' => 5,
        ]);
        $p1Res->assertStatus(201);
        $p1Id = $p1Res->json('data.id');

        // 2. مسحوق غسيل: Cost 18, Sell 25, Stock 15, Barcode 100002
        $p2Res = $this->actingAs($this->admin, 'sanctum')->postJson('/api/products', [
            'category_id' => $cat->id,
            'unit_id' => $unit->id,
            'barcode' => '100002',
            'name' => 'مسحوق غسيل',
            'cost_price' => 18.00,
            'selling_price' => 25.00,
            'tax_percent' => 0.00,
            'stock_quantity' => 15,
            'min_stock_level' => 5,
        ]);
        $p2Res->assertStatus(201);
        $p2Id = $p2Res->json('data.id');

        // 3. كلور: Cost 5, Sell 8, Stock 30, Barcode 100003
        $p3Res = $this->actingAs($this->admin, 'sanctum')->postJson('/api/products', [
            'category_id' => $cat->id,
            'unit_id' => $unit->id,
            'barcode' => '100003',
            'name' => 'كلور',
            'cost_price' => 5.00,
            'selling_price' => 8.00,
            'tax_percent' => 0.00,
            'stock_quantity' => 30,
            'min_stock_level' => 5,
        ]);
        $p3Res->assertStatus(201);
        $p3Id = $p3Res->json('data.id');

        // 4. منظف أرضيات: Cost 10, Sell 15, Stock 20, Barcode 100004
        $p4Res = $this->actingAs($this->admin, 'sanctum')->postJson('/api/products', [
            'category_id' => $cat->id,
            'unit_id' => $unit->id,
            'barcode' => '100004',
            'name' => 'منظف أرضيات',
            'cost_price' => 10.00,
            'selling_price' => 15.00,
            'tax_percent' => 0.00,
            'stock_quantity' => 20,
            'min_stock_level' => 5,
        ]);
        $p4Res->assertStatus(201);
        $p4Id = $p4Res->json('data.id');

        // =============================================================
        // STEP 5: Create Supplier & Purchase On Credit
        // =============================================================
        $suppRes = $this->actingAs($this->admin, 'sanctum')->postJson('/api/suppliers', [
            'name' => 'شركة النور للمنظفات',
            'phone' => '0590000000',
        ]);
        $suppRes->assertStatus(201);
        $supplierId = $suppRes->json('data.id');

        // Buy: 10x سائل جلي (80) + 5x مسحوق غسيل (90) + 10x كلور (50) = 220 ₪
        $purchaseRes = $this->actingAs($this->admin, 'sanctum')->postJson('/api/purchases', [
            'supplier_id' => $supplierId,
            'payment_method' => 'credit',
            'invoice_date' => now()->toDateString(),
            'items' => [
                ['product_id' => $p1Id, 'quantity' => 10, 'unit_cost' => 8.00, 'tax_percent' => 0],
                ['product_id' => $p2Id, 'quantity' => 5, 'unit_cost' => 18.00, 'tax_percent' => 0],
                ['product_id' => $p3Id, 'quantity' => 10, 'unit_cost' => 5.00, 'tax_percent' => 0],
            ],
            'payments' => [
                ['payment_method' => 'credit', 'amount' => 0.00],
            ],
        ]);
        $purchaseRes->assertStatus(201);

        // Verify stocks increased:
        // سائل جلي: 20 + 10 = 30
        // مسحوق غسيل: 15 + 5 = 20
        // كلور: 30 + 10 = 40
        // منظف أرضيات: 20
        $this->assertEquals(30, (float) Product::find($p1Id)->stock_quantity);
        $this->assertEquals(20, (float) Product::find($p2Id)->stock_quantity);
        $this->assertEquals(40, (float) Product::find($p3Id)->stock_quantity);
        $this->assertEquals(20, (float) Product::find($p4Id)->stock_quantity);

        // Verify supplier debt = 220 ₪
        $this->assertEquals(220.00, (float) Supplier::find($supplierId)->current_balance);

        // =============================================================
        // STEP 6: Supplier Payment
        // =============================================================
        $suppPayRes = $this->actingAs($this->admin, 'sanctum')->postJson("/api/suppliers/{$supplierId}/payment", [
            'amount' => 100.00,
            'payment_method' => 'cash',
            'notes' => 'سداد دفعة نقدية للمورد',
        ]);
        $suppPayRes->assertStatus(200);

        // Supplier balance: 220 - 100 = 120 ₪
        $this->assertEquals(120.00, (float) Supplier::find($supplierId)->current_balance);

        // =============================================================
        // STEP 7: Create Customer
        // =============================================================
        $custRes = $this->actingAs($this->cashier, 'sanctum')->postJson('/api/customers', [
            'name' => 'أحمد محمد',
            'phone' => '0591111111',
            'credit_limit' => 500.00,
        ]);
        $custRes->assertStatus(201);
        $customerId = $custRes->json('data.id');
        $this->assertEquals(0.00, (float) Customer::find($customerId)->current_balance);

        // =============================================================
        // STEP 8: Open Cash Session (500 ₪)
        // =============================================================
        $openSessionRes = $this->actingAs($this->cashier, 'sanctum')->postJson('/api/cash-sessions/open', [
            'opening_cash' => 500.00,
            'notes' => 'جلسة محل الأصيل للمنظفات',
        ]);
        $openSessionRes->assertStatus(201);
        $sessionId = $openSessionRes->json('data.id');

        // =============================================================
        // STEP 9: Cash Sale (2x سائل جلي @ 12 = 24 + 3x كلور @ 8 = 24 -> 48 ₪)
        // =============================================================
        $cashSaleRes = $this->actingAs($this->cashier, 'sanctum')->postJson('/api/sales', [
            'payment_method' => 'cash',
            'items' => [
                ['product_id' => $p1Id, 'quantity' => 2],
                ['product_id' => $p3Id, 'quantity' => 3],
            ],
            'payments' => [
                ['payment_method' => 'cash', 'amount' => 48.00],
            ],
        ]);
        $cashSaleRes->assertStatus(201);

        // Verify stocks:
        // سائل جلي: 30 - 2 = 28
        // كلور: 40 - 3 = 37
        $this->assertEquals(28, (float) Product::find($p1Id)->stock_quantity);
        $this->assertEquals(37, (float) Product::find($p3Id)->stock_quantity);

        // =============================================================
        // STEP 10: Card Sale (2x مسحوق غسيل @ 25 = 50 ₪)
        // =============================================================
        $cardSaleRes = $this->actingAs($this->cashier, 'sanctum')->postJson('/api/sales', [
            'payment_method' => 'card',
            'items' => [
                ['product_id' => $p2Id, 'quantity' => 2],
            ],
            'payments' => [
                ['payment_method' => 'card', 'amount' => 50.00, 'reference_number' => 'CARD-1234'],
            ],
        ]);
        $cardSaleRes->assertStatus(201);

        // Stock: مسحوق غسيل: 20 - 2 = 18
        $this->assertEquals(18, (float) Product::find($p2Id)->stock_quantity);

        // =============================================================
        // STEP 11: Credit Sale (2x منظف أرضيات @ 15 = 30 ₪ to أحمد محمد)
        // =============================================================
        $creditSaleRes = $this->actingAs($this->cashier, 'sanctum')->postJson('/api/sales', [
            'customer_id' => $customerId,
            'payment_method' => 'credit',
            'items' => [
                ['product_id' => $p4Id, 'quantity' => 2],
            ],
            'payments' => [
                ['payment_method' => 'credit', 'amount' => 0.00],
            ],
        ]);
        $creditSaleRes->assertStatus(201);

        // Stock: منظف أرضيات: 20 - 2 = 18
        $this->assertEquals(18, (float) Product::find($p4Id)->stock_quantity);

        // Customer debt balance: 30 ₪
        $this->assertEquals(30.00, (float) Customer::find($customerId)->current_balance);

        // =============================================================
        // STEP 12: Customer Debt Payment (20 ₪ cash)
        // =============================================================
        $custPayRes = $this->actingAs($this->cashier, 'sanctum')->postJson("/api/customers/{$customerId}/payment", [
            'amount' => 20.00,
            'payment_method' => 'cash',
            'notes' => 'سداد نقدي من العميل أحمد',
        ]);
        $custPayRes->assertStatus(200);

        // Customer remaining balance: 30 - 20 = 10 ₪
        $this->assertEquals(10.00, (float) Customer::find($customerId)->current_balance);

        // =============================================================
        // STEP 13: Operating Expense (30 ₪ نقل)
        // =============================================================
        $expCat = ExpenseCategory::create(['name' => 'نقل', 'is_active' => true]);
        $expRes = $this->actingAs($this->cashier, 'sanctum')->postJson('/api/expenses', [
            'expense_category_id' => $expCat->id,
            'amount' => 30.00,
            'payment_method' => 'cash',
            'description' => 'أجرة نقل منظفات',
        ]);
        $expRes->assertStatus(201);

        // =============================================================
        // STEP 14: Cash Movements (Cash In 50 ₪, Cash Out 20 ₪)
        // =============================================================
        $inRes = $this->actingAs($this->cashier, 'sanctum')->postJson("/api/cash-sessions/{$sessionId}/cash-movement", [
            'type' => 'in',
            'amount' => 50.00,
            'reason' => 'إيداع نقدي',
        ]);
        $inRes->assertStatus(201);

        $outRes = $this->actingAs($this->cashier, 'sanctum')->postJson("/api/cash-sessions/{$sessionId}/cash-movement", [
            'type' => 'out',
            'amount' => 20.00,
            'reason' => 'سحب نقدي',
        ]);
        $outRes->assertStatus(201);

        // =============================================================
        // STEP 15: Calculate Expected Cash Verification
        // Opening (500) + Cash Sales (48) + Cust Payment (20) + Cash In (50) - Expense (30) - Cash Out (20) = 568 ₪
        // =============================================================

        // =============================================================
        // STEP 16: Sale Cancellation (Void Sale)
        // =============================================================
        $tempSale = $this->actingAs($this->cashier, 'sanctum')->postJson('/api/sales', [
            'payment_method' => 'cash',
            'items' => [
                ['product_id' => $p1Id, 'quantity' => 1],
            ],
            'payments' => [
                ['payment_method' => 'cash', 'amount' => 12.00],
            ],
        ]);
        $tempSaleId = $tempSale->json('data.id');

        // Stock decreased: 28 - 1 = 27
        $this->assertEquals(27, (float) Product::find($p1Id)->stock_quantity);

        // Void the sale
        $voidRes = $this->actingAs($this->cashier, 'sanctum')->postJson("/api/sales/{$tempSaleId}/void", [
            'reason' => 'إلغاء تجريبي',
        ]);
        $voidRes->assertStatus(200);

        // Stock restored back to 28
        $this->assertEquals(28, (float) Product::find($p1Id)->stock_quantity);

        // =============================================================
        // STEP 17 & 18: Close Cash Session with 568 ₪ & Z-Report
        // =============================================================
        $closeRes = $this->actingAs($this->cashier, 'sanctum')->postJson("/api/cash-sessions/{$sessionId}/close", [
            'closing_cash_actual' => 568.00,
            'notes' => 'إغلاق وردية متطابقة تماماً',
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
                    'total_expenses' => 30.0,
                    'total_cash_in' => 50.0,
                    'total_cash_out' => 20.0,
                ],
            ]);

        // =============================================================
        // STEP 19: Reports (P&L, COGS, Net Profit)
        // Revenue: 48 (Cash) + 50 (Card) + 30 (Credit) = 128 ₪
        // COGS: (2*8 + 3*5) + (2*18) + (2*10) = (16+15) + 36 + 20 = 31 + 36 + 20 = 87 ₪
        // Gross Profit: 128 - 87 = 41 ₪
        // Operating Expenses: 30 ₪
        // Net Profit: 41 - 30 = 11 ₪
        // =============================================================
        $plRes = $this->actingAs($this->admin, 'sanctum')->getJson('/api/reports/profit-loss');
        $plRes->assertStatus(200);
        $pl = $plRes->json('data');

        $this->assertEquals(128.00, (float) $pl['total_revenue']);
        $this->assertEquals(87.00, (float) $pl['cost_of_goods_sold']);
        $this->assertEquals(41.00, (float) $pl['gross_profit']);
        $this->assertEquals(30.00, (float) $pl['total_operating_expenses']);
        $this->assertEquals(11.00, (float) $pl['net_profit']);

        // =============================================================
        // STEP 20: Final Inventory Reconciliation
        // =============================================================
        $this->assertEquals(28, (float) Product::find($p1Id)->stock_quantity);
        $this->assertEquals(18, (float) Product::find($p2Id)->stock_quantity);
        $this->assertEquals(37, (float) Product::find($p3Id)->stock_quantity);
        $this->assertEquals(18, (float) Product::find($p4Id)->stock_quantity);

        // =============================================================
        // STEP 21: Final Customer Reconciliation
        // =============================================================
        $this->assertEquals(10.00, (float) Customer::find($customerId)->current_balance);

        // =============================================================
        // STEP 22: Final Supplier Reconciliation
        // =============================================================
        $this->assertEquals(120.00, (float) Supplier::find($supplierId)->current_balance);

        // =============================================================
        // STEP 24: Permissions Test (Cashier cannot export backup or modify store settings)
        // =============================================================
        $cashierBackup = $this->actingAs($this->cashier, 'sanctum')->getJson('/api/backup/export');
        $cashierBackup->assertStatus(403);

        $cashierSettings = $this->actingAs($this->cashier, 'sanctum')->postJson('/api/settings', [
            'store_name' => 'اختراق محظور',
        ]);
        $cashierSettings->assertStatus(403);

        // Admin can export backup
        $adminBackup = $this->actingAs($this->admin, 'sanctum')->get('/api/backup/export');
        $adminBackup->assertStatus(200);
    }
}
