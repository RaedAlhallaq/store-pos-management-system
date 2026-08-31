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

class ProductionAuditTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected User $cashierUser;
    protected Category $category;
    protected Unit $unit;
    protected Product $productA;
    protected Product $productB;
    protected Customer $customer;
    protected Supplier $supplier;
    protected ExpenseCategory $expenseCategory;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::factory()->create(['role' => 'admin', 'status' => 'active']);
        $this->cashierUser = User::factory()->create(['role' => 'cashier', 'status' => 'active']);

        $this->category = Category::create(['name' => 'المشروبات', 'is_active' => true]);
        $this->unit = Unit::create(['name' => 'حبة', 'short_name' => 'حبة', 'allow_decimal' => false]);

        $this->productA = Product::create([
            'category_id' => $this->category->id,
            'unit_id' => $this->unit->id,
            'barcode' => '6281001001',
            'name' => 'عصير برتقال طبيعي',
            'cost_price' => 5.00,
            'selling_price' => 10.00,
            'tax_percent' => 15.00,
            'stock_quantity' => 100,
            'is_active' => true,
        ]);

        $this->productB = Product::create([
            'category_id' => $this->category->id,
            'unit_id' => $this->unit->id,
            'barcode' => '6281001002',
            'name' => 'قهوة عربية مختصة',
            'cost_price' => 15.00,
            'selling_price' => 30.00,
            'tax_percent' => 15.00,
            'stock_quantity' => 50,
            'is_active' => true,
        ]);

        $this->customer = Customer::create([
            'name' => 'شركة الأفق للاستثمار',
            'phone' => '0559988771',
            'credit_limit' => 5000.00,
            'current_balance' => 0.00,
            'is_active' => true,
        ]);

        $this->supplier = Supplier::create([
            'name' => 'مؤسسة التوريدات الغذائية',
            'company_name' => 'التوريدات الغذائية',
            'phone' => '0501122334',
            'current_balance' => 0.00,
            'is_active' => true,
        ]);

        $this->expenseCategory = ExpenseCategory::create([
            'name' => 'نثريات وضيافة',
            'is_active' => true,
        ]);
    }

    /**
     * Test 1: Complete End-To-End Business Day Workflow
     */
    public function test_full_business_day_scenario_reconciles_perfectly(): void
    {
        // 1. Open session with 100.00 SAR Float
        $openRes = $this->actingAs($this->cashierUser, 'sanctum')->postJson('/api/cash-sessions/open', [
            'opening_cash' => 100.00,
            'notes' => 'جلسة اليوم الكامل',
        ]);
        $openRes->assertStatus(201);
        $sessionId = $openRes->json('data.id');

        // 2. Cash Sale: Product A (2 units @ 10 = 20 + 3 tax = 23.00 SAR)
        $cashSaleRes = $this->actingAs($this->cashierUser, 'sanctum')->postJson('/api/sales', [
            'payment_method' => 'cash',
            'items' => [
                ['product_id' => $this->productA->id, 'quantity' => 2],
            ],
            'payments' => [
                ['payment_method' => 'cash', 'amount' => 23.00],
            ],
        ]);
        $cashSaleRes->assertStatus(201);

        // 3. Card Sale: Product B (1 unit @ 30 = 30 + 4.5 tax = 34.50 SAR)
        $cardSaleRes = $this->actingAs($this->cashierUser, 'sanctum')->postJson('/api/sales', [
            'payment_method' => 'card',
            'items' => [
                ['product_id' => $this->productB->id, 'quantity' => 1],
            ],
            'payments' => [
                ['payment_method' => 'card', 'amount' => 34.50],
            ],
        ]);
        $cardSaleRes->assertStatus(201);

        // 4. Credit Sale (on account to Customer): Product A (1 unit @ 10 = 10 + 1.5 tax = 11.50 SAR)
        $creditSaleRes = $this->actingAs($this->cashierUser, 'sanctum')->postJson('/api/sales', [
            'customer_id' => $this->customer->id,
            'payment_method' => 'credit',
            'items' => [
                ['product_id' => $this->productA->id, 'quantity' => 1],
            ],
            'payments' => [
                ['payment_method' => 'credit', 'amount' => 0.00],
            ],
        ]);
        $creditSaleRes->assertStatus(201);
        $this->assertEquals(11.50, (float) $this->customer->fresh()->current_balance);

        // 5. Cash Expense from Drawer: 15.00 SAR
        $expenseRes = $this->actingAs($this->cashierUser, 'sanctum')->postJson('/api/expenses', [
            'expense_category_id' => $this->expenseCategory->id,
            'amount' => 15.00,
            'description' => 'ضيافة قهوة وشاي',
            'payment_method' => 'cash',
        ]);
        $expenseRes->assertStatus(201);

        // 6. Cash In Movement (Petty Cash Float Injection): 20.00 SAR
        $inRes = $this->actingAs($this->cashierUser, 'sanctum')->postJson("/api/cash-sessions/{$sessionId}/cash-movement", [
            'type' => 'in',
            'amount' => 20.00,
            'reason' => 'فكة نقدية من الإدارة',
        ]);
        $inRes->assertStatus(201);

        // 7. Cash Out Movement (Drop to Safe): 10.00 SAR
        $outRes = $this->actingAs($this->cashierUser, 'sanctum')->postJson("/api/cash-sessions/{$sessionId}/cash-movement", [
            'type' => 'out',
            'amount' => 10.00,
            'reason' => 'توريد للخزينة الرئيسية',
        ]);
        $outRes->assertStatus(201);

        // Calculation check:
        // Opening (100) + Cash Sales (23) + Cash In (20) - Cash Out (10) - Cash Expense (15)
        // Expected Cash = 100 + 23 + 20 - 10 - 15 = 118.00 SAR

        // 8. Close session with exact counted cash 118.00 SAR (Balanced)
        $closeRes = $this->actingAs($this->cashierUser, 'sanctum')->postJson("/api/cash-sessions/{$sessionId}/close", [
            'closing_cash_actual' => 118.00,
            'notes' => 'جرد نهاية اليوم متطابق',
        ]);
        $closeRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'closed',
                    'closing_cash_expected' => '118.00',
                    'closing_cash_actual' => '118.00',
                    'difference_amount' => '0.00',
                ],
                'z_report' => [
                    'variance_status' => 'balanced',
                    'difference' => 0.0,
                    'total_sales_cash' => 23.0,
                    'total_sales_card' => 34.5,
                    'total_sales_credit' => 11.5,
                ],
            ]);

        // 9. Verify Financial Reports P&L
        $plRes = $this->actingAs($this->adminUser, 'sanctum')->getJson('/api/reports/profit-loss');
        $plRes->assertStatus(200);
        $plData = $plRes->json('data');

        // Revenue without tax: (2*10) + (1*30) + (1*10) = 60.00 SAR
        $this->assertEquals(60.00, (float) $plData['subtotal_before_tax']);
        // COGS: (2*5) + (1*15) + (1*5) = 30.00 SAR
        $this->assertEquals(30.00, (float) $plData['cost_of_goods_sold']);
        // Gross Profit = 60 - 30 = 30.00 SAR
        $this->assertEquals(30.00, (float) $plData['gross_profit']);
        // Operating Expenses = 15.00 SAR
        $this->assertEquals(15.00, (float) $plData['total_operating_expenses']);
        // Net Profit = 30 - 15 = 15.00 SAR
        $this->assertEquals(15.00, (float) $plData['net_profit']);

        // 10. Verify VAT / Sales Tax Report breakdown
        $taxRes = $this->actingAs($this->adminUser, 'sanctum')->getJson('/api/reports/sales-tax');
        $taxRes->assertStatus(200);
        $taxData = $taxRes->json('data');
        $this->assertEquals(23.00, (float) $taxData['payments_breakdown']['cash']);
        $this->assertEquals(34.50, (float) $taxData['payments_breakdown']['card']);
        $this->assertEquals(11.50, (float) $taxData['payments_breakdown']['credit']);
    }

    /**
     * Test 2: Voiding sale reverts stock, debt, and cash session totals accurately
     */
    public function test_void_sale_reverts_all_ledgers_and_cash_session(): void
    {
        $openRes = $this->actingAs($this->cashierUser, 'sanctum')->postJson('/api/cash-sessions/open', [
            'opening_cash' => 50.00,
        ]);
        $sessionId = $openRes->json('data.id');

        $initialStock = (float) $this->productA->stock_quantity;

        // Sale: 2 units for cash 23.00
        $saleRes = $this->actingAs($this->cashierUser, 'sanctum')->postJson('/api/sales', [
            'payment_method' => 'cash',
            'items' => [
                ['product_id' => $this->productA->id, 'quantity' => 2],
            ],
        ]);
        $saleId = $saleRes->json('data.id');
        $this->assertEquals($initialStock - 2, (float) $this->productA->fresh()->stock_quantity);

        // Void the sale
        $voidRes = $this->actingAs($this->cashierUser, 'sanctum')->postJson("/api/sales/{$saleId}/void", [
            'reason' => 'خطأ في الطلب وإعادة المبلغ نقداً',
        ]);
        $voidRes->assertStatus(200);

        // Stock must be restored
        $this->assertEquals($initialStock, (float) $this->productA->fresh()->stock_quantity);

        // Cash session total_sales_cash must be decremented back to 0.00
        $zRes = $this->actingAs($this->cashierUser, 'sanctum')->getJson("/api/cash-sessions/{$sessionId}/z-report");
        $zRes->assertStatus(200);
        $this->assertEquals(0.00, (float) $zRes->json('data.total_sales_cash'));
        $this->assertEquals(50.00, (float) $zRes->json('data.closing_cash_expected'));
    }

    /**
     * Test 3: Security & Authorization - Cashier cannot export backup or access another cashier's session
     */
    public function test_security_authorization_guards(): void
    {
        // Cashier cannot export backup
        $cashierBackupRes = $this->actingAs($this->cashierUser, 'sanctum')->get('/api/backup/export');
        $cashierBackupRes->assertStatus(403);

        // Admin can export backup
        $adminBackupRes = $this->actingAs($this->adminUser, 'sanctum')->get('/api/backup/export');
        $adminBackupRes->assertStatus(200);

        // Cashier A session cannot be closed or modified by Cashier B
        $otherCashier = User::factory()->create(['role' => 'cashier', 'status' => 'active']);
        $sessionRes = $this->actingAs($this->cashierUser, 'sanctum')->postJson('/api/cash-sessions/open', [
            'opening_cash' => 100.00,
        ]);
        $sessionId = $sessionRes->json('data.id');

        $unauthClose = $this->actingAs($otherCashier, 'sanctum')->postJson("/api/cash-sessions/{$sessionId}/close", [
            'closing_cash_actual' => 100.00,
        ]);
        $unauthClose->assertStatus(403);
    }
}
