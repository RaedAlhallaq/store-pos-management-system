<?php

namespace App\Services;

use App\Models\CashMovement;
use App\Models\CashSession;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class CashSessionService
{
    /**
     * Get active/open session for user or store.
     */
    public function getActiveSession(?User $user = null): ?CashSession
    {
        $query = CashSession::where('status', 'open')->with(['user', 'movements', 'sales']);

        if ($user) {
            $query->where('user_id', $user->id);
        }

        return $query->latest('opened_at')->first();
    }

    /**
     * Get paginated cash sessions history.
     */
    public function getPaginatedSessions(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = CashSession::with(['user', 'movements'])->latest('opened_at');

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('opened_at', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('opened_at', '<=', $filters['date_to']);
        }

        return $query->paginate($perPage);
    }

    /**
     * Open a new cash drawer session.
     */
    public function openSession(float $openingCash, ?string $notes, User $user): CashSession
    {
        $existing = CashSession::where('user_id', $user->id)->where('status', 'open')->first();
        if ($existing) {
            throw new InvalidArgumentException('توجد جلسة صندوق مفتوحة مسبقاً لهذا المستخدم. يرجى إغلاقها أولاً.');
        }

        return CashSession::create([
            'user_id' => $user->id,
            'opening_cash' => $openingCash,
            'status' => 'open',
            'opened_at' => now(),
            'notes' => $notes,
        ]);
    }

    /**
     * Record cash movement (in/out) in active session.
     */
    public function recordMovement(CashSession $session, float $amount, string $type, string $reason, ?string $notes, User $user): CashMovement
    {
        if ($session->status !== 'open') {
            throw new InvalidArgumentException('لا يمكن تسجيل حركة نقدية في جلسة صندوق مغلقة.');
        }

        if ($amount <= 0) {
            throw new InvalidArgumentException('مبلغ الحركة النقدية يجب أن يكون أكبر من الصفر.');
        }

        return CashMovement::create([
            'cash_session_id' => $session->id,
            'user_id' => $user->id,
            'type' => $type,
            'amount' => $amount,
            'reason' => $reason,
            'notes' => $notes,
        ]);
    }

    /**
     * Close cash session and calculate variance (Shortage/Overage).
     */
    public function closeSession(CashSession $session, float $closingCashActual, ?string $notes, User $user): CashSession
    {
        if ($session->status !== 'open') {
            throw new InvalidArgumentException('جلسة الصندوق مغلقة مسبقاً.');
        }

        return DB::transaction(function () use ($session, $closingCashActual, $notes) {
            $totalIn = (float) $session->movements()->where('type', 'in')->sum('amount');
            $totalOut = (float) $session->movements()->where('type', 'out')->sum('amount');
            $totalCustPay = (float) $session->customerPayments()->where('payment_method', 'cash')->sum('amount');
            $totalSuppPay = (float) $session->supplierPayments()->where('payment_method', 'cash')->sum('amount');

            $expectedCash = (float) $session->opening_cash +
                            (float) $session->total_sales_cash +
                            $totalCustPay +
                            $totalIn -
                            $totalOut -
                            $totalSuppPay -
                            (float) $session->total_expenses_cash;

            $difference = round($closingCashActual - $expectedCash, 2);

            $session->closing_cash_expected = $expectedCash;
            $session->closing_cash_actual = $closingCashActual;
            $session->difference_amount = $difference;
            $session->status = 'closed';
            $session->closed_at = now();
            if ($notes) {
                $session->notes = ($session->notes ? $session->notes . " | " : "") . $notes;
            }
            $session->save();

            return $session->fresh(['user', 'movements', 'sales']);
        });
    }

    /**
     * Generate full Z-Report data array for a session.
     */
    public function getZReport(CashSession $session): array
    {
        $session->load(['user', 'movements', 'sales.items', 'expenses', 'customerPayments', 'supplierPayments']);

        $totalIn = (float) $session->movements()->where('type', 'in')->sum('amount');
        $totalOut = (float) $session->movements()->where('type', 'out')->sum('amount');
        $totalCustPay = (float) $session->customerPayments()->where('payment_method', 'cash')->sum('amount');
        $totalSuppPay = (float) $session->supplierPayments()->where('payment_method', 'cash')->sum('amount');

        $completedSalesQuery = $session->sales()->where('invoice_status', 'completed');
        $salesCount = $completedSalesQuery->count();
        $totalSales = (float) (clone $completedSalesQuery)->sum('grand_total');
        $totalTax = (float) (clone $completedSalesQuery)->sum('tax_amount');
        $totalDiscounts = (float) (clone $completedSalesQuery)->sum('discount_amount');

        $expectedCash = (float) $session->opening_cash +
                        (float) $session->total_sales_cash +
                        $totalCustPay +
                        $totalIn -
                        $totalOut -
                        $totalSuppPay -
                        (float) $session->total_expenses_cash;

        $actualCash = $session->closing_cash_actual !== null ? (float) $session->closing_cash_actual : $expectedCash;
        $difference = $session->difference_amount !== null ? (float) $session->difference_amount : 0.0;

        return [
            'session_id' => $session->id,
            'cashier_name' => $session->user?->name,
            'status' => $session->status,
            'opened_at' => $session->opened_at?->toIso8601String(),
            'closed_at' => $session->closed_at?->toIso8601String(),
            'duration_hours' => $session->opened_at && $session->closed_at
                ? round($session->opened_at->diffInMinutes($session->closed_at) / 60, 2)
                : null,
            'opening_cash' => (float) $session->opening_cash,
            'total_sales' => $totalSales,
            'sales_count' => $salesCount,
            'total_sales_cash' => (float) $session->total_sales_cash,
            'total_sales_card' => (float) $session->total_sales_card,
            'total_sales_credit' => (float) $session->total_sales_credit,
            'total_tax' => $totalTax,
            'total_discounts' => $totalDiscounts,
            'total_expenses' => (float) $session->total_expenses_cash,
            'total_cash_in' => $totalIn,
            'total_cash_out' => $totalOut,
            'total_customer_payments_cash' => $totalCustPay,
            'total_supplier_payments_cash' => $totalSuppPay,
            'closing_cash_expected' => $expectedCash,
            'closing_cash_actual' => $actualCash,
            'difference' => $difference,
            'variance_status' => $difference === 0.0 ? 'balanced' : ($difference > 0 ? 'surplus' : 'deficit'),
            'movements' => $session->movements,
        ];
    }
}
