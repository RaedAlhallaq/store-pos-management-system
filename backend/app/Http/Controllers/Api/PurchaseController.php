<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Purchase\StorePurchaseRequest;
use App\Http\Resources\PurchaseResource;
use App\Models\Purchase;
use App\Services\PurchaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PurchaseController extends Controller
{
    public function __construct(
        protected PurchaseService $purchaseService
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = (int) $request->get('per_page', 15);
        $filters = $request->only([
            'search',
            'payment_status',
            'invoice_status',
            'date_from',
            'date_to',
        ]);

        $purchases = $this->purchaseService->getPaginatedPurchases($filters, $perPage);

        return PurchaseResource::collection($purchases);
    }

    public function store(StorePurchaseRequest $request): JsonResponse
    {
        $purchase = $this->purchaseService->processPurchase($request->validated(), $request->user());

        return response()->json([
            'success' => true,
            'message' => 'تم تسجيل فاتورة المشتريات وتوريد الأصناف للمخزون بنجاح.',
            'data' => new PurchaseResource($purchase),
        ], 201);
    }

    public function show(Purchase $purchase): JsonResponse
    {
        $purchase->load(['supplier', 'items.product', 'payments', 'user']);

        return response()->json([
            'success' => true,
            'data' => new PurchaseResource($purchase),
        ]);
    }

    public function void(Request $request, Purchase $purchase): JsonResponse
    {
        $request->validate([
            'reason' => ['required', 'string', 'max:255'],
        ], [
            'reason.required' => 'يرجى توضيح سبب إلغاء الفاتورة.',
        ]);

        $voidedPurchase = $this->purchaseService->voidPurchase($purchase, $request->get('reason'), $request->user());

        return response()->json([
            'success' => true,
            'message' => 'تم إلغاء فاتورة المشتريات وعكس رصيد المخزون ومستحقات المورد.',
            'data' => new PurchaseResource($voidedPurchase),
        ]);
    }
}
