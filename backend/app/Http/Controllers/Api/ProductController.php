<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StockAdjustmentRequest;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use App\Http\Resources\StockMovementResource;
use App\Models\Product;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    public function __construct(
        protected ProductService $productService
    ) {}

    /**
     * Display a listing of products with filters.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = (int) $request->get('per_page', 15);
        $filters = $request->only(['search', 'category_id', 'stock_status', 'is_active']);

        $products = $this->productService->getPaginatedProducts($filters, $perPage);

        return ProductResource::collection($products);
    }

    /**
     * Store a newly created product.
     */
    public function store(StoreProductRequest $request): JsonResponse
    {
        $product = $this->productService->createProduct($request->validated(), $request->user());

        return response()->json([
            'success' => true,
            'message' => 'تمت إضافة المنتج بنجاح.',
            'data' => new ProductResource($product),
        ], 201);
    }

    /**
     * Display the specified product.
     */
    public function show(Product $product): JsonResponse
    {
        $product->load(['category', 'unit']);

        return response()->json([
            'success' => true,
            'data' => new ProductResource($product),
        ]);
    }

    /**
     * Find product by barcode (optimized for POS scanner).
     */
    public function findByBarcode(string $barcode): JsonResponse
    {
        $product = Product::with(['category', 'unit'])
            ->where('barcode', $barcode)
            ->where('is_active', true)
            ->first();

        if (! $product) {
            return response()->json([
                'success' => false,
                'message' => 'لم يتم العثور على أي منتج بهذا الباركود.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new ProductResource($product),
        ]);
    }

    /**
     * Update the specified product.
     */
    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        $updatedProduct = $this->productService->updateProduct($product, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث بيانات المنتج بنجاح.',
            'data' => new ProductResource($updatedProduct),
        ]);
    }

    /**
     * Adjust stock quantity.
     */
    public function adjustStock(StockAdjustmentRequest $request, Product $product): JsonResponse
    {
        $stockMovement = $this->productService->adjustStock($product, $request->validated(), $request->user());

        return response()->json([
            'success' => true,
            'message' => 'تمت تسوية رصيد المخزون بنجاح.',
            'data' => [
                'movement' => new StockMovementResource($stockMovement->load('product')),
                'product' => new ProductResource($product->fresh(['category', 'unit'])),
            ],
        ]);
    }

    /**
     * Soft toggle active state or delete.
     */
    public function destroy(Product $product): JsonResponse
    {
        // Safe toggle instead of hard destructive delete if product has relations
        if ($product->saleItems()->exists() || $product->purchaseItems()->exists()) {
            $product->update(['is_active' => false]);

            return response()->json([
                'success' => true,
                'message' => 'تم تعطيل المنتج لربطه بفواتير سابقة بدلاً من حذفه نهائياً.',
            ]);
        }

        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف المنتج بنجاح.',
        ]);
    }

    /**
     * Get inventory valuation summary & metrics.
     */
    public function metrics(): JsonResponse
    {
        $metrics = $this->productService->getInventoryMetrics();

        return response()->json([
            'success' => true,
            'data' => $metrics,
        ]);
    }
}
