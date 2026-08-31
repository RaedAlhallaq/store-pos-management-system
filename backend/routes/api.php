<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BackupController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CashSessionController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\ExpenseCategoryController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\HealthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\PurchaseController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SaleController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\StockMovementController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\UnitController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Store POS & Management System
|--------------------------------------------------------------------------
*/

// Public Health Check Endpoint
Route::get('/health', [HealthController::class, 'index']);

// Authentication Routes
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/user', [AuthController::class, 'user']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

// Protected Business Routes
Route::middleware('auth:sanctum')->group(function () {
    // Products & Inventory Module
    Route::get('/products/metrics', [ProductController::class, 'metrics']);
    Route::get('/products/barcode/{barcode}', [ProductController::class, 'findByBarcode']);
    Route::post('/products/{product}/adjust-stock', [ProductController::class, 'adjustStock']);
    Route::apiResource('products', ProductController::class);

    // Categories & Units
    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('units', UnitController::class);

    // Stock Movement Ledger
    Route::get('/stock-movements', [StockMovementController::class, 'index']);

    // Customers & Receivables
    Route::get('/customers/quick-list', [CustomerController::class, 'quickList']);
    Route::post('/customers/{customer}/payment', [CustomerController::class, 'recordPayment']);
    Route::apiResource('customers', CustomerController::class);

    // Sales & POS Invoicing
    Route::post('/sales/{sale}/void', [SaleController::class, 'void']);
    Route::apiResource('sales', SaleController::class)->only(['index', 'store', 'show']);

    // Suppliers & Payables
    Route::get('/suppliers/quick-list', [SupplierController::class, 'quickList']);
    Route::post('/suppliers/{supplier}/payment', [SupplierController::class, 'recordPayment']);
    Route::apiResource('suppliers', SupplierController::class);

    // Purchases & Stock Inward
    Route::post('/purchases/{purchase}/void', [PurchaseController::class, 'void']);
    Route::apiResource('purchases', PurchaseController::class)->only(['index', 'store', 'show']);

    // Expenses & Expense Categories
    Route::apiResource('expense-categories', ExpenseCategoryController::class);
    Route::apiResource('expenses', ExpenseController::class)->only(['index', 'store', 'destroy']);

    // Cash Drawer Sessions & Daily Closing (Z-Report)
    Route::get('/cash-sessions/active', [CashSessionController::class, 'active']);
    Route::post('/cash-sessions/open', [CashSessionController::class, 'open']);
    Route::post('/cash-sessions/{session}/cash-movement', [CashSessionController::class, 'recordMovement']);
    Route::post('/cash-sessions/{session}/close', [CashSessionController::class, 'close']);
    Route::get('/cash-sessions/{session}/z-report', [CashSessionController::class, 'zReport']);
    Route::apiResource('cash-sessions', CashSessionController::class)->only(['index']);

    // Financial Reports & Analytics
    Route::get('/reports/profit-loss', [ReportController::class, 'profitLoss']);
    Route::get('/reports/sales-tax', [ReportController::class, 'salesTax']);
    Route::get('/reports/top-products', [ReportController::class, 'topProducts']);

    // Store Settings
    Route::get('/settings', [SettingController::class, 'index']);
    Route::post('/settings', [SettingController::class, 'update']);

    // Database Backup & Restore
    Route::get('/backup/export', [BackupController::class, 'export']);
    Route::post('/backup/restore', [BackupController::class, 'restore']);
});
