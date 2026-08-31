<?php

namespace Database\Seeders;

use App\Models\Supplier;
use Illuminate\Database\Seeder;

class SupplierSeeder extends Seeder
{
    public function run(): void
    {
        $suppliers = [
            [
                'name' => 'شركة المراعي للتوزيع',
                'company_name' => 'شركة المراعي المحدودة',
                'phone' => '8001246688',
                'email' => 'sales@almarai.com',
                'tax_number' => '300055443300003',
                'address' => 'طريق الخرج، الرياض',
                'current_balance' => 0.00,
                'notes' => 'توريد يومي للألبان والعصائر',
            ],
            [
                'name' => 'مؤسسة الشعلان للمواد الغذائية',
                'company_name' => 'مجموعة الشعلان التجارية',
                'phone' => '0114981122',
                'email' => 'orders@alshalan.com',
                'tax_number' => '300099887700003',
                'address' => 'المستودعات المركزية، حي السلي، الرياض',
                'current_balance' => 0.00,
                'notes' => 'توريد أرز وبقوليات وسكر',
            ],
            [
                'name' => 'شركة مصنع مياه هنا المحدودة',
                'company_name' => 'مياه هنا',
                'phone' => '920000144',
                'email' => 'contact@hanafood.com',
                'tax_number' => '300011223300003',
                'address' => 'المنطقة الصناعية الثانية، الرياض',
                'current_balance' => 0.00,
                'notes' => 'توريد المياه المعبأة والكراتين',
            ],
        ];

        foreach ($suppliers as $supplier) {
            Supplier::updateOrCreate(['name' => $supplier['name']], $supplier);
        }
    }
}
