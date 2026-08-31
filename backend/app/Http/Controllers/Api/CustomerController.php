<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\CustomerRequest;
use App\Http\Resources\CustomerResource;
use App\Models\Customer;
use App\Services\CustomerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CustomerController extends Controller
{
    public function __construct(
        protected CustomerService $customerService
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = (int) $request->get('per_page', 15);
        $filters = $request->only(['search', 'has_debt']);

        $customers = $this->customerService->getPaginatedCustomers($filters, $perPage);

        return CustomerResource::collection($customers);
    }

    public function quickList(): JsonResponse
    {
        $customers = $this->customerService->getQuickList();

        return response()->json([
            'success' => true,
            'data' => CustomerResource::collection($customers),
        ]);
    }

    public function store(CustomerRequest $request): JsonResponse
    {
        $customer = $this->customerService->createCustomer($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'تمت إضافة العميل بنجاح.',
            'data' => new CustomerResource($customer),
        ], 201);
    }

    public function show(Customer $customer): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => new CustomerResource($customer),
        ]);
    }

    public function update(CustomerRequest $request, Customer $customer): JsonResponse
    {
        $updatedCustomer = $this->customerService->updateCustomer($customer, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث بيانات العميل بنجاح.',
            'data' => new CustomerResource($updatedCustomer),
        ]);
    }

    public function recordPayment(Request $request, Customer $customer): JsonResponse
    {
        $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'payment_method' => ['required', 'in:cash,card,bank_transfer'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        $transaction = $this->customerService->recordPayment(
            $customer,
            (float) $request->get('amount'),
            $request->get('payment_method'),
            $request->get('notes'),
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'تم تسجيل دفعة السداد بنجاح.',
            'data' => [
                'transaction' => $transaction,
                'customer' => new CustomerResource($customer->fresh()),
            ],
        ]);
    }

    public function destroy(Customer $customer): JsonResponse
    {
        if ($customer->sales()->exists()) {
            $customer->update(['is_active' => false]);

            return response()->json([
                'success' => true,
                'message' => 'تم تعطيل حساب العميل لوجود فواتير سابقة مرتبطة به.',
            ]);
        }

        $customer->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف العميل بنجاح.',
        ]);
    }
}
