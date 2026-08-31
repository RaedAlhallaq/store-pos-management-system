<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            [
                'key' => 'store_name',
                'value' => 'الأصيل للمنظفات',
                'group' => 'store',
                'type' => 'string',
                'description' => 'الاسم التجاري للمتجر في الفواتير والتقارير',
            ],
            [
                'key' => 'store_phone',
                'value' => '0551122334',
                'group' => 'store',
                'type' => 'string',
                'description' => 'رقم هاتف المتجر للتواصل',
            ],
            [
                'key' => 'store_address',
                'value' => 'الرياض - حي السلام - شارع الملك فهد',
                'group' => 'store',
                'type' => 'string',
                'description' => 'عنوان المتجر المطبوع على الفاتورة',
            ],
            [
                'key' => 'tax_number',
                'value' => '300998877600003',
                'group' => 'tax',
                'type' => 'string',
                'description' => 'الرقم الضريبي للمنشأة',
            ],
            [
                'key' => 'default_tax_rate',
                'value' => '15.00',
                'group' => 'tax',
                'type' => 'decimal',
                'description' => 'نسبة ضريبة القيمة المضافة الافتراضية (%)',
            ],
            [
                'key' => 'currency_symbol',
                'value' => 'ر.س',
                'group' => 'finance',
                'type' => 'string',
                'description' => 'رمز العملة الأساسية',
            ],
            [
                'key' => 'currency_code',
                'value' => 'SAR',
                'group' => 'finance',
                'type' => 'string',
                'description' => 'رمز العملة القياسي ISO',
            ],
            [
                'key' => 'receipt_header',
                'value' => 'أهلاً بكم في متجر الريادة — نسعد بخدمتكم دائماً',
                'group' => 'receipt',
                'type' => 'string',
                'description' => 'رسالة الترويسة العلوية في الفاتورة الحرارية',
            ],
            [
                'key' => 'receipt_footer',
                'value' => 'البضاعة المباعة ترد وتستبدل خلال 3 أيام مع إحضار أصل الفاتورة',
                'group' => 'receipt',
                'type' => 'string',
                'description' => 'رسالة تذييل الفاتورة وسياسة الاسترجاع',
            ],
            [
                'key' => 'low_stock_threshold',
                'value' => '5.000',
                'group' => 'inventory',
                'type' => 'decimal',
                'description' => 'الحد الأدنى الافتراضي لتنبيه انخفاض المخزون',
            ],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(['key' => $setting['key']], $setting);
        }
    }
}
