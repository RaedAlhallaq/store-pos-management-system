<?php

namespace Database\Seeders;

use App\Models\Customer;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        $customers = [
            [
                'name' => 'عميل نقدي عام (Cash Customer)',
                'phone' => '0500000000',
                'credit_limit' => 0.00,
                'current_balance' => 0.00,
                'notes' => 'العميل النقدي الافتراضي لنقاط البيع السريعة',
            ],
            [
                'name' => 'محمد عبدالله الشمري',
                'phone' => '0551234567',
                'email' => 'm.shammari@example.com',
                'credit_limit' => 2000.00,
                'current_balance' => 0.00,
                'address' => 'حي الصحافة، الرياض',
                'notes' => 'عميل دائم بحساب آجل معتمد',
            ],
            [
                'name' => 'خالد بن ناصر العتيبي',
                'phone' => '0569876543',
                'credit_limit' => 1500.00,
                'current_balance' => 0.00,
                'address' => 'حي النرجس، الرياض',
                'notes' => 'عميل تجزئة',
            ],
            [
                'name' => 'مؤسسة أفق التقنية للتجارة',
                'phone' => '0114567890',
                'tax_number' => '300123456700003',
                'credit_limit' => 5000.00,
                'current_balance' => 0.00,
                'address' => 'حي الملز، الرياض',
                'notes' => 'مشتريات مكتبية وتموين دوري',
            ],
        ];

        foreach ($customers as $customer) {
            Customer::updateOrCreate(['name' => $customer['name']], $customer);
        }
    }
}
