<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Sale\StoreSaleRequest;
use App\Http\Resources\SaleResource;
use App\Models\Sale;
use App\Services\SaleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SaleController extends Controller
{
    public function __construct(
        protected SaleService $saleService
    ) {}

    /**
     * List historical sales and invoices with filters.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = (int) $request->get('per_page', 15);
        $filters = $request->only([
            'search',
            'payment_status',
            'invoice_status',
            'payment_method',
            'date_from',
            'date_to',
        ]);

        $sales = $this->saleService->getPaginatedSales($filters, $perPage);

        return SaleResource::collection($sales);
    }

    /**
     * Process and commit a new POS sale.
     */
    public function store(StoreSaleRequest $request): JsonResponse
    {
        $sale = $this->saleService->processSale($request->validated(), $request->user());

        return response()->json([
            'success' => true,
            'message' => 'تم إصدار الفاتورة بنجاح.',
            'data' => new SaleResource($sale),
        ], 201);
    }

    /**
     * Display the specified sale / invoice.
     */
    public function show(Sale $sale): JsonResponse
    {
        $sale->load(['customer', 'items.product', 'payments', 'user']);

        return response()->json([
            'success' => true,
            'data' => new SaleResource($sale),
        ]);
    }

    /**
     * Void an invoice (reverse stock & debt).
     */
    public function void(Request $request, Sale $sale): JsonResponse
    {
        $request->validate([
            'reason' => ['required', 'string', 'max:255'],
        ], [
            'reason.required' => 'يرجى توضيح سبب إلغاء الفاتورة.',
        ]);

        $voidedSale = $this->saleService->voidSale($sale, $request->get('reason'), $request->user());

        return response()->json([
            'success' => true,
            'message' => 'تم إلغاء الفاتورة بنجاح وعكس رصيد المخزون.',
            'data' => new SaleResource($voidedSale),
        ]);
    }
}
