<?php

namespace Database\Seeders;

use App\Models\ExpenseCategory;
use Illuminate\Database\Seeder;

class ExpenseCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'إيجار المحل والمستودع', 'description' => 'دفعات الإيجار الدورية للمحل والمستودعات التابعة'],
            ['name' => 'فواتير الكهرباء والمياه', 'description' => 'الخدمات والمرافق العامة واستهلاك الطاقة'],
            ['name' => 'رواتب وأجور الموظفين', 'description' => 'رواتب الكاشيرات والعمال والمكافآت الشهرية'],
            ['name' => 'صيانة ونظافة وأدوات تشغيل', 'description' => 'صيانة أجهزة نقاط البيع، التكييف، وأدوات التنظيف'],
            ['name' => 'ضيافة ونثريات المتجر', 'description' => 'مشتريات الشاي والقهوة والمستلزمات اليومية للعمل'],
            ['name' => 'إنترنت واتصالات وباقات', 'description' => 'فواتير خطوط الاتصال وأجهزة الدفع الإلكتروني'],
        ];

        foreach ($categories as $cat) {
            ExpenseCategory::updateOrCreate(['name' => $cat['name']], $cat);
        }
    }
}
