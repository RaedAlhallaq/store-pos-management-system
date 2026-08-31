<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Expense\ExpenseCategoryRequest;
use App\Http\Resources\ExpenseCategoryResource;
use App\Models\ExpenseCategory;
use App\Services\ExpenseService;
use Illuminate\Http\JsonResponse;

class ExpenseCategoryController extends Controller
{
    public function __construct(
        protected ExpenseService $expenseService
    ) {}

    public function index(): JsonResponse
    {
        $categories = $this->expenseService->getCategories();

        return response()->json([
            'success' => true,
            'data' => ExpenseCategoryResource::collection($categories),
        ]);
    }

    public function store(ExpenseCategoryRequest $request): JsonResponse
    {
        $category = $this->expenseService->createCategory($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'تمت إضافة تصنيف المصروفات بنجاح.',
            'data' => new ExpenseCategoryResource($category),
        ], 201);
    }

    public function update(ExpenseCategoryRequest $request, ExpenseCategory $category): JsonResponse
    {
        $updatedCategory = $this->expenseService->updateCategory($category, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث تصنيف المصروفات بنجاح.',
            'data' => new ExpenseCategoryResource($updatedCategory),
        ]);
    }

    public function destroy(ExpenseCategory $category): JsonResponse
    {
        $this->expenseService->deleteCategory($category);

        return response()->json([
            'success' => true,
            'message' => 'تم حذف التصنيف بنجاح.',
        ]);
    }
}
