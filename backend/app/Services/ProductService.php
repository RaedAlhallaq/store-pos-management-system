<?php

namespace App\Services;

use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class ProductService
{
    /**
     * Get paginated products with filtering and searching.
     */
    public function getPaginatedProducts(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Product::with(['category', 'unit'])->latest();

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('barcode', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        if (isset($filters['stock_status'])) {
            if ($filters['stock_status'] === 'low') {
                $query->lowStock();
            } elseif ($filters['stock_status'] === 'out') {
                $query->where('stock_quantity', '<=', 0);
            } elseif ($filters['stock_status'] === 'in_stock') {
                $query->where('stock_quantity', '>', 0);
            }
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
        }

        return $query->paginate($perPage);
    }

    /**
     * Create a new product with optional initial stock.
     */
    public function createProduct(array $data, ?User $user = null): Product
    {
        return DB::transaction(function () use ($data, $user) {
            $initialStock = isset($data['stock_quantity']) ? (float) $data['stock_quantity'] : 0.0;
            $data['stock_quantity'] = 0.0; // will be updated via stock movement if > 0

            $product = Product::create($data);

            if ($initialStock > 0) {
                $product->stock_quantity = $initialStock;
                $product->save();

                StockMovement::create([
                    'product_id' => $product->id,
                    'user_id' => $user?->id,
                    'type' => 'initial',
                    'quantity' => $initialStock,
                    'unit_cost' => $product->cost_price,
                    'balance_before' => 0.000,
                    'balance_after' => $initialStock,
                    'notes' => 'رصيد افتتاحي عند إضافة الصنف',
                ]);
            }

            return $product->load(['category', 'unit']);
        });
    }

    /**
     * Update an existing product.
     */
    public function updateProduct(Product $product, array $data): Product
    {
        // Don't allow direct mutation of stock_quantity through general product update
        unset($data['stock_quantity']);

        $product->update($data);

        return $product->load(['category', 'unit']);
    }

    /**
     * Adjust stock quantity authoritative transaction.
     */
    public function adjustStock(Product $product, array $adjustmentData, User $user): StockMovement
    {
        return DB::transaction(function () use ($product, $adjustmentData, $user) {
            $type = $adjustmentData['type']; // 'adjustment', 'damage', 'initial', etc.
            $quantityChange = (float) $adjustmentData['quantity']; // Can be positive or negative
            $notes = $adjustmentData['notes'] ?? null;

            if ($quantityChange == 0) {
                throw new InvalidArgumentException('كمية التعديل لا يمكن أن تكون صفراً.');
            }

            // Lock product row for concurrency safety
            $lockedProduct = Product::where('id', $product->id)->lockForUpdate()->first();
            $balanceBefore = (float) $lockedProduct->stock_quantity;
            $balanceAfter = $balanceBefore + $quantityChange;

            if ($balanceAfter < 0 && $type === 'damage') {
                throw new InvalidArgumentException('الكمية التالفة تتجاوز رصيد المخزون المتوفر.');
            }

            $lockedProduct->stock_quantity = $balanceAfter;
            $lockedProduct->save();

            return StockMovement::create([
                'product_id' => $lockedProduct->id,
                'user_id' => $user->id,
                'type' => $type,
                'quantity' => $quantityChange,
                'unit_cost' => $lockedProduct->cost_price,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'notes' => $notes,
            ]);
        });
    }

    /**
     * Get inventory valuation summary.
     */
    public function getInventoryMetrics(): array
    {
        $totalProducts = Product::count();
        $lowStockCount = Product::lowStock()->count();
        $outOfStockCount = Product::where('stock_quantity', '<=', 0)->count();

        $valuation = Product::selectRaw('
            SUM(cost_price * stock_quantity) as total_cost_value,
            SUM(selling_price * stock_quantity) as total_retail_value,
            SUM(stock_quantity) as total_quantity
        ')->first();

        return [
            'total_products' => $totalProducts,
            'low_stock_count' => $lowStockCount,
            'out_of_stock_count' => $outOfStockCount,
            'total_quantity' => (float) ($valuation->total_quantity ?? 0),
            'total_cost_value' => (float) ($valuation->total_cost_value ?? 0),
            'total_retail_value' => (float) ($valuation->total_retail_value ?? 0),
            'potential_profit' => (float) (($valuation->total_retail_value ?? 0) - ($valuation->total_cost_value ?? 0)),
        ];
    }
}
