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
 * Phase 8: Comprehensive End-to-End Business Flow for "محل الأصيل للمنظفات"
 */
class AlAseelFullBusinessFlowTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $cashier;
    protected User $manager;

    protected Category $catLaundry;
    protected Category $catDishes;
    protected Category $catFloors;
    protected Category $catSanitizers;
    protected Category $catTools;

    protected Unit $unitPcs;
    protected Unit $unitCtn;
    protected Unit $unitKg;

    protected array $products = [];
    protected array $suppliers = [];
    protected array $customers = [];

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Users & Roles
        $this->admin = User::factory()->create(['name' => 'المدير العام', 'role' => 'admin', 'status' => 'active']);
        $this->cashier = User::factory()->create(['name' => 'كاشير الوردية الأولى', 'role' => 'cashier', 'status' => 'active']);
        $this->manager = User::factory()->create(['name' => 'مشرف الفرع', 'role' => 'manager', 'status' => 'active']);

        // 2. Units
        $this->unitPcs = Unit::create(['name' => 'حبة', 'short_name' => 'حبة', 'allow_decimal' => false]);
        $this->unitCtn = Unit::create(['name' => 'كرتون', 'short_name' => 'كرتون', 'allow_decimal' => false]);
        $this->unitKg = Unit::create(['name' => 'كيلوغرام', 'short_name' => 'كغم', 'allow_decimal' => true]);

        // 3. Categories
        $this->catLaundry = Category::create(['name' => 'منظفات الغسيل', 'is_active' => true]);
        $this->catDishes = Category::create(['name' => 'منظفات الأواني', 'is_active' => true]);
        $this->catFloors = Category::create(['name' => 'منظفات الأرضيات والأسطح', 'is_active' => true]);
        $this->catSanitizers = Category::create(['name' => 'مطهرات ومعقمات', 'is_active' => true]);
        $this->catTools = Category::create(['name' => 'أدوات التنظيف المنزلية', 'is_active' => true]);

        // 4. Products Catalog (15 Cleaning Supply items)
        $catalog = [
            ['name' => 'مسحوق غسيل أوتوماتيك 3 كغم', 'cat' => $this->catLaundry, 'unit' => $this->unitKg, 'cost' => 20.00, 'sell' => 35.00, 'stock' => 50, 'barcode' => '62810001'],
            ['name' => 'سائل جلي ليمون 1 لتر', 'cat' => $this->catDishes, 'unit' => $this->unitPcs, 'cost' => 5.00, 'sell' => 8.50, 'stock' => 100, 'barcode' => '62810002'],
            ['name' => 'كلور مبيض 1 لتر', 'cat' => $this->catLaundry, 'unit' => $this->unitPcs, 'cost' => 3.50, 'sell' => 6.00, 'stock' => 80, 'barcode' => '62810003'],
            ['name' => 'منظف أرضيات لافندر 1 لتر', 'cat' => $this->catFloors, 'unit' => $this->unitPcs, 'cost' => 8.00, 'sell' => 14.00, 'stock' => 60, 'barcode' => '62810004'],
            ['name' => 'منظف زجاج ملمع 750 مل', 'cat' => $this->catFloors, 'unit' => $this->unitPcs, 'cost' => 4.00, 'sell' => 7.00, 'stock' => 40, 'barcode' => '62810005'],
            ['name' => 'معطر أرضيات وجو 1 لتر', 'cat' => $this->catFloors, 'unit' => $this->unitPcs, 'cost' => 9.00, 'sell' => 16.00, 'stock' => 30, 'barcode' => '62810006'],
            ['name' => 'منعم ومعطر ملابس 2 لتر', 'cat' => $this->catLaundry, 'unit' => $this->unitPcs, 'cost' => 12.00, 'sell' => 22.00, 'stock' => 35, 'barcode' => '62810007'],
            ['name' => 'مطهر ومعقم ديتول 1 لتر', 'cat' => $this->catSanitizers, 'unit' => $this->unitPcs, 'cost' => 15.00, 'sell' => 26.00, 'stock' => 45, 'barcode' => '62810008'],
            ['name' => 'صابون سائل لليدين 500 مل', 'cat' => $this->catSanitizers, 'unit' => $this->unitPcs, 'cost' => 4.50, 'sell' => 8.00, 'stock' => 70, 'barcode' => '62810009'],
            ['name' => 'إسفنج جلي أواني سلكي (طقم)', 'cat' => $this->catDishes, 'unit' => $this->unitPcs, 'cost' => 2.00, 'sell' => 4.00, 'stock' => 120, 'barcode' => '62810010'],
            ['name' => 'أكياس نفايات 50 جالون', 'cat' => $this->catTools, 'unit' => $this->unitPcs, 'cost' => 6.00, 'sell' => 11.00, 'stock' => 90, 'barcode' => '62810011'],
            ['name' => 'ممسحة أرضيات مايكروفايبر', 'cat' => $this->catTools, 'unit' => $this->unitPcs, 'cost' => 18.00, 'sell' => 30.00, 'stock' => 25, 'barcode' => '62810012'],
            ['name' => 'مكنسة منزلية مع عصا', 'cat' => $this->catTools, 'unit' => $this->unitPcs, 'cost' => 10.00, 'sell' => 18.00, 'stock' => 30, 'barcode' => '62810013'],
            ['name' => 'فرشاة تنظيف حمامات وبلاط', 'cat' => $this->catTools, 'unit' => $this->unitPcs, 'cost' => 3.00, 'sell' => 6.00, 'stock' => 50, 'barcode' => '62810014'],
            ['name' => 'سائل غسيل ملابس مركز 2 لتر', 'cat' => $this->catLaundry, 'unit' => $this->unitPcs, 'cost' => 14.00, 'sell' => 25.00, 'stock' => 40, 'barcode' => '62810015'],
        ];

        foreach ($catalog as $item) {
            $this->products[$item['name']] = Product::create([
                'category_id' => $item['cat']->id,
                'unit_id' => $item['unit']->id,
                'barcode' => $item['barcode'],
                'name' => $item['name'],
                'cost_price' => $item['cost'],
                'selling_price' => $item['sell'],
                'tax_percent' => 15.00,
                'stock_quantity' => $item['stock'],
                'min_stock_level' => 10,
                'is_active' => true,
            ]);
        }

        // 5. Suppliers
        $this->suppliers['nukhba'] = Supplier::create([
            'name' => '[TEST] شركة النخبة للمنظفات',
            'company_name' => 'شركة النخبة للتوريدات الكيميائية',
            'phone' => '0551122001',
            'tax_number' => 'TEST-TAX-SUP-01',
            'current_balance' => 0.00,
            'is_active' => true,
        ]);

        $this->suppliers['clean_house'] = Supplier::create([
            'name' => '[TEST] شركة البيت النظيف',
            'company_name' => 'البيت النظيف للمستلزمات',
            'phone' => '0551122002',
            'tax_number' => 'TEST-TAX-SUP-02',
            'current_balance' => 0.00,
            'is_active' => true,
        ]);

        // 6. Customers
        $this->customers['ahmed'] = Customer::create([
            'name' => '[TEST] أحمد محمد',
            'phone' => '0501234561',
            'credit_limit' => 1500.00,
            'current_balance' => 0.00,
            'is_active' => true,
        ]);

        $this->customers['cash_customer'] = Customer::create([
            'name' => '[TEST] زبون نقدي عام',
            'phone' => '0500000000',
            'credit_limit' => 0.00,
            'current_balance' => 0.00,
            'is_active' => true,
        ]);
    }

    /**
     * Test complete Al-Aseel Store Journey:
     * Setup -> Purchases -> Supplier Payment -> Cash Session -> Sales (Cash, Card, Credit)
     * -> Customer Payment -> Expenses -> Cash In/Out -> Inventory Reconciliation -> Void Sale
     * -> Closing & Z-Report -> P&L & VAT Statements -> DB Backup.
     */
    public function test_complete_al_aseel_store_business_workflow(): void
    {
        // -------------------------------------------------------------
        // STEP 1: Store Setup & Profile Verification
        // -------------------------------------------------------------
        $settingsRes = $this->actingAs($this->admin, 'sanctum')->getJson('/api/settings');
        $settingsRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'store_name' => 'الأصيل للمنظفات',
                    'currency' => 'ILS',
                    'default_tax_percent' => '15.00',
                ],
            ]);

        // -------------------------------------------------------------
        // STEP 2: Inward Purchase from Supplier (Restocking)
        // -------------------------------------------------------------
        // Buy: 20x مسحوق غسيل (Cost 20.00), 50x سائل جلي (Cost 5.00)
        // Subtotal = (20*20 = 400) + (50*5 = 250) = 650.00 SAR
        // Tax 15% = 97.50 SAR -> Total = 747.50 SAR on credit (due)
        $purchasePayload = [
            'supplier_id' => $this->suppliers['nukhba']->id,
            'payment_method' => 'credit',
            'invoice_date' => now()->toDateString(),
            'items' => [
                ['product_id' => $this->products['مسحوق غسيل أوتوماتيك 3 كغم']->id, 'quantity' => 20, 'unit_cost' => 20.00, 'tax_percent' => 15.00],
                ['product_id' => $this->products['سائل جلي ليمون 1 لتر']->id, 'quantity' => 50, 'unit_cost' => 5.00, 'tax_percent' => 15.00],
            ],
            'payments' => [
                ['payment_method' => 'credit', 'amount' => 0.00],
            ],
        ];

        $purchaseRes = $this->actingAs($this->admin, 'sanctum')->postJson('/api/purchases', $purchasePayload);
        $purchaseRes->assertStatus(201);

        // Verify inventory increased:
        // مسحوق غسيل: 50 initial + 20 = 70
        // سائل جلي: 100 initial + 50 = 150
        $this->assertEquals(70, (float) $this->products['مسحوق غسيل أوتوماتيك 3 كغم']->fresh()->stock_quantity);
        $this->assertEquals(150, (float) $this->products['سائل جلي ليمون 1 لتر']->fresh()->stock_quantity);

        // Verify supplier credit debt increased to 747.50 SAR
        $this->assertEquals(747.50, (float) $this->suppliers['nukhba']->fresh()->current_balance);

        // -------------------------------------------------------------
        // STEP 3: Supplier Payment Voucher
        // -------------------------------------------------------------
        // Pay 200.00 SAR via bank transfer to supplier
        $suppPayRes = $this->actingAs($this->admin, 'sanctum')->postJson("/api/suppliers/{$this->suppliers['nukhba']->id}/payment", [
            'amount' => 200.00,
            'payment_method' => 'bank_transfer',
            'notes' => 'سداد دفعة أولى من فاتورة التوريد',
        ]);
        $suppPayRes->assertStatus(200);

        // Supplier balance: 747.50 - 200.00 = 547.50 SAR
        $this->assertEquals(547.50, (float) $this->suppliers['nukhba']->fresh()->current_balance);

        // -------------------------------------------------------------
        // STEP 4: Open Daily Cash Session (Float = 500.00 SAR)
        // -------------------------------------------------------------
        $openSessionRes = $this->actingAs($this->cashier, 'sanctum')->postJson('/api/cash-sessions/open', [
            'opening_cash' => 500.00,
            'notes' => 'جلسة صباحية - محل الأصيل للمنظفات',
        ]);
        $openSessionRes->assertStatus(201);
        $sessionId = $openSessionRes->json('data.id');

        // -------------------------------------------------------------
        // STEP 5: Cash Sale at POS
        // -------------------------------------------------------------
        // 2x سائل جلي (2*8.50 = 17) + 1x مسحوق غسيل (1*35 = 35) + 3x كلور (3*6 = 18)
        // Subtotal = 17 + 35 + 18 = 70.00 SAR
        // Tax 15% = 10.50 SAR -> Grand Total = 80.50 SAR (Paid in CASH)
        $cashSaleRes = $this->actingAs($this->cashier, 'sanctum')->postJson('/api/sales', [
            'customer_id' => $this->customers['cash_customer']->id,
            'payment_method' => 'cash',
            'items' => [
                ['product_id' => $this->products['سائل جلي ليمون 1 لتر']->id, 'quantity' => 2],
                ['product_id' => $this->products['مسحوق غسيل أوتوماتيك 3 كغم']->id, 'quantity' => 1],
                ['product_id' => $this->products['كلور مبيض 1 لتر']->id, 'quantity' => 3],
            ],
            'payments' => [
                ['payment_method' => 'cash', 'amount' => 80.50],
            ],
        ]);
        $cashSaleRes->assertStatus(201);

        // Stock decreased:
        // سائل جلي: 150 - 2 = 148
        // مسحوق غسيل: 70 - 1 = 69
        // كلور: 80 - 3 = 77
        $this->assertEquals(148, (float) $this->products['سائل جلي ليمون 1 لتر']->fresh()->stock_quantity);
        $this->assertEquals(69, (float) $this->products['مسحوق غسيل أوتوماتيك 3 كغم']->fresh()->stock_quantity);
        $this->assertEquals(77, (float) $this->products['كلور مبيض 1 لتر']->fresh()->stock_quantity);

        // -------------------------------------------------------------
        // STEP 6: Card Sale at POS
        // -------------------------------------------------------------
        // 1x مطهر ديتول (26.00) + 2x صابون يدين (2*8 = 16.00)
        // Subtotal = 42.00 SAR -> Tax = 6.30 SAR -> Grand Total = 48.30 SAR (Paid by CARD)
        $cardSaleRes = $this->actingAs($this->cashier, 'sanctum')->postJson('/api/sales', [
            'customer_id' => $this->customers['cash_customer']->id,
            'payment_method' => 'card',
            'items' => [
                ['product_id' => $this->products['مطهر ومعقم ديتول 1 لتر']->id, 'quantity' => 1],
                ['product_id' => $this->products['صابون سائل لليدين 500 مل']->id, 'quantity' => 2],
            ],
            'payments' => [
                ['payment_method' => 'card', 'amount' => 48.30, 'reference_number' => 'MADA-998811'],
            ],
        ]);
        $cardSaleRes->assertStatus(201);

        // -------------------------------------------------------------
        // STEP 7: Credit Sale (Customer Debt)
        // -------------------------------------------------------------
        // Customer: أحمد محمد
        // 3x منظف أرضيات (3*14 = 42) + 2x منعم ملابس (2*22 = 44)
        // Subtotal = 86.00 SAR -> Tax = 12.90 SAR -> Grand Total = 98.90 SAR on Credit
        $creditSaleRes = $this->actingAs($this->cashier, 'sanctum')->postJson('/api/sales', [
            'customer_id' => $this->customers['ahmed']->id,
            'payment_method' => 'credit',
            'items' => [
                ['product_id' => $this->products['منظف أرضيات لافندر 1 لتر']->id, 'quantity' => 3],
                ['product_id' => $this->products['منعم ومعطر ملابس 2 لتر']->id, 'quantity' => 2],
            ],
            'payments' => [
                ['payment_method' => 'credit', 'amount' => 0.00],
            ],
        ]);
        $creditSaleRes->assertStatus(201);

        // Customer debt balance should now be 98.90 SAR
        $this->assertEquals(98.90, (float) $this->customers['ahmed']->fresh()->current_balance);

        // -------------------------------------------------------------
        // STEP 8: Customer Debt Payment
        // -------------------------------------------------------------
        // Customer pays 40.00 SAR cash towards debt
        $custPayRes = $this->actingAs($this->cashier, 'sanctum')->postJson("/api/customers/{$this->customers['ahmed']->id}/payment", [
            'amount' => 40.00,
            'payment_method' => 'cash',
            'notes' => 'سداد جزء من حساب المنظفات',
        ]);
        $custPayRes->assertStatus(200);

        // Customer remaining balance: 98.90 - 40.00 = 58.90 SAR
        $this->assertEquals(58.90, (float) $this->customers['ahmed']->fresh()->current_balance);

        // -------------------------------------------------------------
        // STEP 9: Operating Expense from Drawer
        // -------------------------------------------------------------
        $expCat = ExpenseCategory::create(['name' => 'نقل وتوصيل بضائع', 'is_active' => true]);
        $expRes = $this->actingAs($this->cashier, 'sanctum')->postJson('/api/expenses', [
            'expense_category_id' => $expCat->id,
            'amount' => 50.00,
            'description' => 'مصاريف نقل وتعتيق كراتين المنظفات',
            'payment_method' => 'cash',
        ]);
        $expRes->assertStatus(201);

        // -------------------------------------------------------------
        // STEP 10: Cash Movements (IN & OUT)
        // -------------------------------------------------------------
        // Cash IN: +100.00 SAR
        $inRes = $this->actingAs($this->cashier, 'sanctum')->postJson("/api/cash-sessions/{$sessionId}/cash-movement", [
            'type' => 'in',
            'amount' => 100.00,
            'reason' => 'إضافة رأس مال للصندوق [TEST]',
        ]);
        $inRes->assertStatus(201);

        // Cash OUT: -30.00 SAR
        $outRes = $this->actingAs($this->cashier, 'sanctum')->postJson("/api/cash-sessions/{$sessionId}/cash-movement", [
            'type' => 'out',
            'amount' => 30.00,
            'reason' => 'سحب نقدي لمشتريات سريعة [TEST]',
        ]);
        $outRes->assertStatus(201);

        // -------------------------------------------------------------
        // STEP 11: Create a Sale and Void it (Cancellation Regression Test)
        // -------------------------------------------------------------
        $initialMopStock = (float) $this->products['ممسحة أرضيات مايكروفايبر']->fresh()->stock_quantity;
        $voidTestSale = $this->actingAs($this->cashier, 'sanctum')->postJson('/api/sales', [
            'payment_method' => 'cash',
            'items' => [
                ['product_id' => $this->products['ممسحة أرضيات مايكروفايبر']->id, 'quantity' => 2],
            ],
            'payments' => [
                ['payment_method' => 'cash', 'amount' => 69.00],
            ],
        ]);
        $voidSaleId = $voidTestSale->json('data.id');

        // Stock decreased: 25 - 2 = 23
        $this->assertEquals($initialMopStock - 2, (float) $this->products['ممسحة أرضيات مايكروفايبر']->fresh()->stock_quantity);

        // Void the sale
        $voidAction = $this->actingAs($this->cashier, 'sanctum')->postJson("/api/sales/{$voidSaleId}/void", [
            'reason' => 'الزبون تراجع عن الشراء وتم إرجاع الكاش',
        ]);
        $voidAction->assertStatus(200);

        // Stock restored back to 25
        $this->assertEquals($initialMopStock, (float) $this->products['ممسحة أرضيات مايكروفايبر']->fresh()->stock_quantity);

        // -------------------------------------------------------------
        // STEP 12: Cash Drawer Calculation & Daily Closing
        // -------------------------------------------------------------
        // Expected Cash Formula:
        // Opening Float (500) + Cash Sales (80.50) + Customer Payment (40) + Cash IN (100) - Cash OUT (30) - Cash Expenses (50)
        // Expected Cash = 500 + 80.50 + 40 + 100 - 30 - 50 = 640.50 SAR

        // Close session with 640.50 SAR (Exact match - Balanced)
        $closeRes = $this->actingAs($this->cashier, 'sanctum')->postJson("/api/cash-sessions/{$sessionId}/close", [
            'closing_cash_actual' => 640.50,
            'notes' => 'إقفال وردية متطابقة بنجاح لمحل الأصيل',
        ]);
        $closeRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'closed',
                    'closing_cash_expected' => '640.50',
                    'closing_cash_actual' => '640.50',
                    'difference_amount' => '0.00',
                ],
                'z_report' => [
                    'variance_status' => 'balanced',
                    'difference' => 0.0,
                    'total_sales_cash' => 80.5,
                    'total_sales_card' => 48.3,
                    'total_sales_credit' => 98.9,
                ],
            ]);

        // -------------------------------------------------------------
        // STEP 13: Financial Reports (P&L, VAT, Top Products)
        // -------------------------------------------------------------
        $plRes = $this->actingAs($this->admin, 'sanctum')->getJson('/api/reports/profit-loss');
        $plRes->assertStatus(200);
        $pl = $plRes->json('data');

        // Revenue subtotal: 70 (Cash sale) + 42 (Card sale) + 86 (Credit sale) = 198.00 SAR
        $this->assertEquals(198.00, (float) $pl['subtotal_before_tax']);

        // COGS:
        // Sale 1: (2*5) + (1*20) + (3*3.50) = 10 + 20 + 10.5 = 40.50
        // Sale 2: (1*15) + (2*4.50) = 15 + 9 = 24.00
        // Sale 3: (3*8) + (2*12) = 24 + 24 = 48.00
        // Total COGS = 40.50 + 24.00 + 48.00 = 112.50 SAR
        $this->assertEquals(112.50, (float) $pl['cost_of_goods_sold']);

        // Gross Profit = 198.00 - 112.50 = 85.50 SAR
        $this->assertEquals(85.50, (float) $pl['gross_profit']);

        // Operating Expenses = 50.00 SAR
        $this->assertEquals(50.00, (float) $pl['total_operating_expenses']);

        // Net Profit = 85.50 - 50.00 = 35.50 SAR
        $this->assertEquals(35.50, (float) $pl['net_profit']);

        // VAT Report Check:
        $taxRes = $this->actingAs($this->admin, 'sanctum')->getJson('/api/reports/sales-tax');
        $taxRes->assertStatus(200);
        $tax = $taxRes->json('data');
        $this->assertEquals(80.50, (float) $tax['payments_breakdown']['cash']);
        $this->assertEquals(48.30, (float) $tax['payments_breakdown']['card']);
        $this->assertEquals(98.90, (float) $tax['payments_breakdown']['credit']);

        // Top Products Check:
        $topRes = $this->actingAs($this->admin, 'sanctum')->getJson('/api/reports/top-products?limit=5');
        $topRes->assertStatus(200);
        $this->assertNotEmpty($topRes->json('data'));

        // -------------------------------------------------------------
        // STEP 14: Database Backup Export
        // -------------------------------------------------------------
        $backupRes = $this->actingAs($this->admin, 'sanctum')->get('/api/backup/export');
        $backupRes->assertStatus(200);
        $this->assertStringContainsString('Store POS Database Backup', $backupRes->streamedContent());
    }
}
