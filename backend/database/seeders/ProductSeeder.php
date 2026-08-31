<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $pieceUnit = Unit::where('short_name', 'حبة')->first();
        $kgUnit = Unit::where('short_name', 'كغ')->first();
        $cartonUnit = Unit::where('short_name', 'كرتون')->first();

        $foodCat = Category::where('code', 'FOOD')->first();
        $bevCat = Category::where('code', 'BEV')->first();
        $dairyCat = Category::where('code', 'DAIRY')->first();
        $cansCat = Category::where('code', 'CANS')->first();
        $cleanCat = Category::where('code', 'CLEAN')->first();

        $owner = User::where('role', 'admin')->first();

        $products = [
            [
                'name' => 'أرز بسمتي الشعلان 5 كغ',
                'barcode' => '6281001001011',
                'sku' => 'RICE-5KG',
                'category_id' => $foodCat?->id,
                'unit_id' => $pieceUnit?->id,
                'cost_price' => 38.50,
                'selling_price' => 45.00,
                'tax_percent' => 15.00,
                'stock_quantity' => 50.000,
                'min_stock_alert' => 10.000,
                'description' => 'أرز هندي أبيض فاخر طويل الحبة',
            ],
            [
                'name' => 'زيت دوار الشمس عافية 1.5 لتر',
                'barcode' => '6281001001028',
                'sku' => 'OIL-1.5L',
                'category_id' => $cansCat?->id,
                'unit_id' => $pieceUnit?->id,
                'cost_price' => 18.00,
                'selling_price' => 22.50,
                'tax_percent' => 15.00,
                'stock_quantity' => 40.000,
                'min_stock_alert' => 8.000,
                'description' => 'زيت نقي للطبخ والقلي',
            ],
            [
                'name' => 'حليب المراعي كامل الدسم 1 لتر',
                'barcode' => '6281001001035',
                'sku' => 'MILK-1L',
                'category_id' => $dairyCat?->id,
                'unit_id' => $pieceUnit?->id,
                'cost_price' => 5.20,
                'selling_price' => 6.50,
                'tax_percent' => 15.00,
                'stock_quantity' => 80.000,
                'min_stock_alert' => 15.000,
                'description' => 'حليب طازج معقم كامل الدسم',
            ],
            [
                'name' => 'مياه معدنية هنا 330 مل (كرتون 40 حبة)',
                'barcode' => '6281001001042',
                'sku' => 'WATER-330-CRT',
                'category_id' => $bevCat?->id,
                'unit_id' => $cartonUnit?->id,
                'cost_price' => 13.00,
                'selling_price' => 17.00,
                'tax_percent' => 15.00,
                'stock_quantity' => 35.000,
                'min_stock_alert' => 5.000,
                'description' => 'مياه شرب نقية معبأة',
            ],
            [
                'name' => 'سكر الأسرة ناعم 5 كغ',
                'barcode' => '6281001001059',
                'sku' => 'SUGAR-5KG',
                'category_id' => $foodCat?->id,
                'unit_id' => $pieceUnit?->id,
                'cost_price' => 21.00,
                'selling_price' => 25.00,
                'tax_percent' => 15.00,
                'stock_quantity' => 60.000,
                'min_stock_alert' => 10.000,
                'description' => 'سكر أبيض نقي سريع الذوبان',
            ],
            [
                'name' => 'مسحوق غسيل تايد أوتوماتيك 5 كغ',
                'barcode' => '6281001001066',
                'sku' => 'TIDE-5KG',
                'category_id' => $cleanCat?->id,
                'unit_id' => $pieceUnit?->id,
                'cost_price' => 46.00,
                'selling_price' => 55.00,
                'tax_percent' => 15.00,
                'stock_quantity' => 25.000,
                'min_stock_alert' => 5.000,
                'description' => 'مسحوق غسيل عالي الكفاءة للغسالات الأوتوماتيكية',
            ],
            [
                'name' => 'شاي ربيع فرط إكسبرس 400 غرام',
                'barcode' => '6281001001073',
                'sku' => 'TEA-400G',
                'category_id' => $bevCat?->id,
                'unit_id' => $pieceUnit?->id,
                'cost_price' => 14.50,
                'selling_price' => 18.00,
                'tax_percent' => 15.00,
                'stock_quantity' => 45.000,
                'min_stock_alert' => 10.000,
                'description' => 'شاي أسود سيلاني أصلي فاخر',
            ],
        ];

        foreach ($products as $prodData) {
            $product = Product::updateOrCreate(['barcode' => $prodData['barcode']], $prodData);

            // Create initial stock movement
            if ($owner && $product->stock_quantity > 0) {
                StockMovement::updateOrCreate(
                    [
                        'product_id' => $product->id,
                        'type' => 'initial',
                    ],
                    [
                        'user_id' => $owner->id,
                        'quantity' => $product->stock_quantity,
                        'unit_cost' => $product->cost_price,
                        'balance_before' => 0.000,
                        'balance_after' => $product->stock_quantity,
                        'notes' => 'رصيد افتتاحي لبداية التشغيل',
                    ]
                );
            }
        }
    }
}
