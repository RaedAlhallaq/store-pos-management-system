<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'مواد غذائية ومأكولات', 'code' => 'FOOD', 'description' => 'المواد التموينية الأساسية والحبوب'],
            ['name' => 'مشروبات وعصائر', 'code' => 'BEV', 'description' => 'المياه الغازية والعصائر والمياه المعدنية'],
            ['name' => 'ألبان وأجبان', 'code' => 'DAIRY', 'description' => 'منتجات الحليب والأجبان والزبادي الطازجة'],
            ['name' => 'معلبات وزيوت', 'code' => 'CANS', 'description' => 'زيوت الطبخ والمعلبات والبقوليات'],
            ['name' => 'شوكولاتة وسكاكر', 'code' => 'SWEET', 'description' => 'الحلويات والبسكويت والمقرمشات'],
            ['name' => 'منظفات وعناية منزلية', 'code' => 'CLEAN', 'description' => 'مساحيق الغسيل ومطهرات الأسطح'],
            ['name' => 'ورقيات وبلاستيك', 'code' => 'PAPER', 'description' => 'المناديل والأكياس والأكواب الاستهلاكية'],
        ];

        foreach ($categories as $cat) {
            Category::updateOrCreate(['name' => $cat['name']], $cat);
        }
    }
}
