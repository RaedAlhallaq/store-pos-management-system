<?php

namespace App\Services;

use App\Models\Setting;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SettingService
{
    /**
     * Get all settings as associative array.
     */
    public function getAllSettings(): array
    {
        $settings = Setting::all();
        $map = [
            'store_name' => 'الأصيل للمنظفات',
            'company_name' => 'مؤسسة الأصيل للمنظفات والمستلزمات المنزلية',
            'phone' => '0551122334',
            'email' => 'info@alaseel-cleaning.com',
            'tax_number' => 'TEST-VAT-300998877600003',
            'commercial_register' => 'TEST-CR-1010998877',
            'address' => 'شارع القدس الرئيسي',
            'currency' => 'ILS',
            'currency_symbol' => '₪',
            'default_tax_percent' => '15.00',
            'receipt_footer' => 'شكراً لزيارتكم محل الأصيل للمنظفات! نتشرف بخدمتكم دائماً',
            'enable_sound' => 'true',
            'low_stock_threshold' => '5',
        ];

        foreach ($settings as $s) {
            $map[$s->key] = $s->value;
        }

        return $map;
    }

    /**
     * Update multiple settings.
     */
    public function updateSettings(array $data): array
    {
        foreach ($data as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => is_bool($value) ? ($value ? 'true' : 'false') : (string) $value]
            );
        }

        return $this->getAllSettings();
    }

    /**
     * Generate SQL Dump of all application tables.
     */
    public function exportDatabaseDump(): string
    {
        $tables = [
            'users',
            'product_categories',
            'product_units',
            'products',
            'customers',
            'customer_transactions',
            'customer_payments',
            'suppliers',
            'supplier_transactions',
            'supplier_payments',
            'cash_sessions',
            'cash_movements',
            'sales',
            'sale_items',
            'sale_payments',
            'purchases',
            'purchase_items',
            'purchase_payments',
            'stock_movements',
            'expense_categories',
            'expenses',
            'settings',
        ];

        $output = "-- --------------------------------------------------------\n";
        $output .= "-- Store POS Database Backup\n";
        $output .= "-- Generated At: " . now()->toIso8601String() . "\n";
        $output .= "-- --------------------------------------------------------\n\n";
        $output .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

        foreach ($tables as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            $rows = DB::table($table)->get();
            $output .= "-- Table: `{$table}` (" . count($rows) . " rows)\n";

            if ($rows->isNotEmpty()) {
                foreach ($rows as $row) {
                    $rowArray = (array) $row;
                    $columns = array_keys($rowArray);
                    $escapedValues = array_map(function ($val) {
                        if ($val === null) {
                            return 'NULL';
                        }
                        return "'" . addslashes((string) $val) . "'";
                    }, array_values($rowArray));

                    $colList = implode('`, `', $columns);
                    $valList = implode(', ', $escapedValues);
                    $output .= "INSERT INTO `{$table}` (`{$colList}`) VALUES ({$valList});\n";
                }
                $output .= "\n";
            }
        }

        $output .= "SET FOREIGN_KEY_CHECKS=1;\n";

        return $output;
    }

    /**
     * Restore database from SQL dump content.
     */
    public function restoreDatabaseDump(string $sqlContent): bool
    {
        DB::unprepared("SET FOREIGN_KEY_CHECKS=0;");
        DB::unprepared($sqlContent);
        DB::unprepared("SET FOREIGN_KEY_CHECKS=1;");

        return true;
    }
}
