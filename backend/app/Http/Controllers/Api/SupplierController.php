<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Supplier\SupplierRequest;
use App\Http\Resources\SupplierResource;
use App\Models\Supplier;
use App\Services\SupplierService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SupplierController extends Controller
{
    public function __construct(
        protected SupplierService $supplierService
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = (int) $request->get('per_page', 15);
        $filters = $request->only(['search', 'has_debt']);

        $suppliers = $this->supplierService->getPaginatedSuppliers($filters, $perPage);

        return SupplierResource::collection($suppliers);
    }

    public function quickList(): JsonResponse
    {
        $suppliers = $this->supplierService->getQuickList();

        return response()->json([
            'success' => true,
            'data' => SupplierResource::collection($suppliers),
        ]);
    }

    public function store(SupplierRequest $request): JsonResponse
    {
        $supplier = $this->supplierService->createSupplier($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'تمت إضافة المورد بنجاح.',
            'data' => new SupplierResource($supplier),
        ], 201);
    }

    public function show(Supplier $supplier): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => new SupplierResource($supplier),
        ]);
    }

    public function update(SupplierRequest $request, Supplier $supplier): JsonResponse
    {
        $updatedSupplier = $this->supplierService->updateSupplier($supplier, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث بيانات المورد بنجاح.',
            'data' => new SupplierResource($updatedSupplier),
        ]);
    }

    public function recordPayment(Request $request, Supplier $supplier): JsonResponse
    {
        $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_method' => ['required', 'in:cash,card,bank_transfer'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        $transaction = $this->supplierService->recordPayment(
            $supplier,
            (float) $request->get('amount'),
            $request->get('payment_method'),
            $request->get('notes'),
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'تم تسجيل سند الصرف وسداد دفعة المورد بنجاح.',
            'data' => [
                'transaction' => $transaction,
                'supplier' => new SupplierResource($supplier->fresh()),
            ],
        ]);
    }

    public function destroy(Supplier $supplier): JsonResponse
    {
        if ($supplier->purchases()->exists()) {
            $supplier->update(['is_active' => false]);

            return response()->json([
                'success' => true,
                'message' => 'تم تعطيل حساب المورد لوجود فواتير مشتريات مرتبطة به.',
            ]);
        }

        $supplier->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف المورد بنجاح.',
        ]);
    }
}
