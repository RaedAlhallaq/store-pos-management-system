<?php

namespace App\Services;

use App\Models\CashSession;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class ExpenseService
{
    /**
     * Get paginated expenses with filters.
     */
    public function getPaginatedExpenses(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Expense::with(['category', 'user'])->latest('expense_date');

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('expense_number', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('reference_number', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['expense_category_id'])) {
            $query->where('expense_category_id', $filters['expense_category_id']);
        }

        if (! empty($filters['payment_method'])) {
            $query->where('payment_method', $filters['payment_method']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('expense_date', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('expense_date', '<=', $filters['date_to']);
        }

        return $query->paginate($perPage);
    }

    /**
     * Get all active expense categories.
     */
    public function getCategories(): Collection
    {
        return ExpenseCategory::where('is_active', true)->withCount('expenses')->get();
    }

    /**
     * Generate unique expense sequence number: EXP-YYYYMMDD-0001.
     */
    public function generateExpenseNumber(): string
    {
        $todayPrefix = 'EXP-' . date('Ymd') . '-';
        $latest = Expense::where('expense_number', 'like', "{$todayPrefix}%")
            ->orderBy('id', 'desc')
            ->first();

        if ($latest) {
            $parts = explode('-', $latest->expense_number);
            $sequence = isset($parts[2]) ? (int) $parts[2] + 1 : 1;
        } else {
            $sequence = 1;
        }

        return $todayPrefix . str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Record a new operating expense.
     */
    public function recordExpense(array $data, User $user): Expense
    {
        $amount = (float) $data['amount'];
        if ($amount <= 0) {
            throw new InvalidArgumentException('مبلغ المصروف يجب أن يكون أكبر من الصفر.');
        }

        return DB::transaction(function () use ($data, $amount, $user) {
            $activeCashSession = CashSession::where('user_id', $user->id)
                ->where('status', 'open')
                ->latest()
                ->first();

            $expense = Expense::create([
                'expense_category_id' => $data['expense_category_id'],
                'user_id' => $user->id,
                'cash_session_id' => $activeCashSession?->id,
                'expense_number' => $this->generateExpenseNumber(),
                'description' => $data['description'] ?? $data['title'] ?? 'مصروف تشغيلي',
                'amount' => $amount,
                'tax_amount' => (float) ($data['tax_amount'] ?? 0.0),
                'payment_method' => $data['payment_method'] ?? 'cash',
                'expense_date' => $data['expense_date'] ?? now()->toDateString(),
                'reference_number' => $data['reference_number'] ?? null,
                'receipt_image' => $data['receipt_image'] ?? null,
            ]);

            // If paid from cash drawer, record into active session
            if ($activeCashSession && ($data['payment_method'] ?? 'cash') === 'cash') {
                $activeCashSession->total_expenses_cash = (float) $activeCashSession->total_expenses_cash + $amount;
                $activeCashSession->save();
            }

            return $expense->load(['category', 'user']);
        });
    }

    /**
     * Delete an expense and reverse cash session if applicable.
     */
    public function deleteExpense(Expense $expense): void
    {
        DB::transaction(function () use ($expense) {
            if ($expense->cash_session_id && $expense->payment_method === 'cash') {
                $session = CashSession::find($expense->cash_session_id);
                if ($session) {
                    $session->total_expenses_cash = max(0, (float) $session->total_expenses_cash - (float) $expense->amount);
                    $session->save();
                }
            }

            $expense->delete();
        });
    }

    /**
     * Category CRUD methods.
     */
    public function createCategory(array $data): ExpenseCategory
    {
        return ExpenseCategory::create($data);
    }

    public function updateCategory(ExpenseCategory $category, array $data): ExpenseCategory
    {
        $category->update($data);

        return $category;
    }

    public function deleteCategory(ExpenseCategory $category): void
    {
        if ($category->expenses()->exists()) {
            $category->update(['is_active' => false]);
            return;
        }

        $category->delete();
    }
}
