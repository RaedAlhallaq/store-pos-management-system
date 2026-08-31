<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Expense\ExpenseRequest;
use App\Http\Resources\ExpenseResource;
use App\Models\Expense;
use App\Services\ExpenseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ExpenseController extends Controller
{
    public function __construct(
        protected ExpenseService $expenseService
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = (int) $request->get('per_page', 15);
        $filters = $request->only([
            'search',
            'expense_category_id',
            'payment_method',
            'date_from',
            'date_to',
        ]);

        $expenses = $this->expenseService->getPaginatedExpenses($filters, $perPage);

        return ExpenseResource::collection($expenses);
    }

    public function store(ExpenseRequest $request): JsonResponse
    {
        $expense = $this->expenseService->recordExpense($request->validated(), $request->user());

        return response()->json([
            'success' => true,
            'message' => 'تم تسجيل المصروف بنجاح.',
            'data' => new ExpenseResource($expense),
        ], 201);
    }

    public function destroy(Expense $expense): JsonResponse
    {
        $this->expenseService->deleteExpense($expense);

        return response()->json([
            'success' => true,
            'message' => 'تم حذف المصروف بنجاح.',
        ]);
    }
}
