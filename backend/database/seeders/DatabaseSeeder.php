<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Default Store Owner
        User::updateOrCreate(
            ['email' => 'owner@storepos.local'],
            [
                'name' => 'Store Owner (مدير المتجر)',
                'password' => bcrypt('password123'),
                'role' => 'admin',
                'status' => 'active',
            ]
        );

        // 2. Call Domain Seeders in Logical Order
        $this->call([
            CategorySeeder::class,
            UnitSeeder::class,
            ProductSeeder::class,
            CustomerSeeder::class,
            SupplierSeeder::class,
            ExpenseCategorySeeder::class,
            SettingSeeder::class,
        ]);
    }
}
