<?php

namespace Database\Seeders;

use App\Models\Unit;
use Illuminate\Database\Seeder;

class UnitSeeder extends Seeder
{
    public function run(): void
    {
        $units = [
            ['name' => 'قطعة / حبة', 'short_name' => 'حبة', 'allow_decimal' => false],
            ['name' => 'كرتون / شدّة', 'short_name' => 'كرتون', 'allow_decimal' => false],
            ['name' => 'كيلوجرام', 'short_name' => 'كغ', 'allow_decimal' => true],
            ['name' => 'غرام', 'short_name' => 'غ', 'allow_decimal' => true],
            ['name' => 'لتر', 'short_name' => 'لتر', 'allow_decimal' => true],
            ['name' => 'علبة / عبوة', 'short_name' => 'علبة', 'allow_decimal' => false],
            ['name' => 'ربطة / دستة', 'short_name' => 'ربطة', 'allow_decimal' => false],
        ];

        foreach ($units as $unit) {
            Unit::updateOrCreate(['name' => $unit['name']], $unit);
        }
    }
}
