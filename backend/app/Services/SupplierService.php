<?php

namespace App\Services;

use App\Models\Supplier;
use App\Models\SupplierTransaction;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class SupplierService
{
    /**
     * Get paginated suppliers with search and filters.
     */
    public function getPaginatedSuppliers(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Supplier::latest();

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('company_name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('tax_number', 'like', "%{$search}%");
            });
        }

        if (isset($filters['has_debt']) && filter_var($filters['has_debt'], FILTER_VALIDATE_BOOLEAN)) {
            $query->where('current_balance', '>', 0);
        }

        return $query->paginate($perPage);
    }

    /**
     * Get all active suppliers for dropdowns.
     */
    public function getQuickList(): Collection
    {
        return Supplier::where('is_active', true)->orderBy('name')->get();
    }

    /**
     * Create a new supplier.
     */
    public function createSupplier(array $data): Supplier
    {
        return Supplier::create($data);
    }

    /**
     * Update supplier details.
     */
    public function updateSupplier(Supplier $supplier, array $data): Supplier
    {
        unset($data['current_balance']);
        $supplier->update($data);

        return $supplier;
    }

    /**
     * Generate unique supplier payment sequence number: SPAY-YYYYMMDD-0001.
     */
    public function generatePaymentNumber(): string
    {
        $todayPrefix = 'SPAY-' . date('Ymd') . '-';
        $latest = \App\Models\SupplierPayment::where('payment_number', 'like', "{$todayPrefix}%")
            ->orderBy('id', 'desc')
            ->first();

        $sequence = 1;
        if ($latest) {
            $parts = explode('-', $latest->payment_number);
            $sequence = isset($parts[2]) ? (int) $parts[2] + 1 : 1;
        }

        return $todayPrefix . str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Record payment to supplier to settle payables.
     */
    public function recordPayment(Supplier $supplier, float $amount, string $method, ?string $notes, User $user): SupplierTransaction
    {
        if ($amount <= 0) {
            throw new InvalidArgumentException('مبلغ الدفعة يجب أن يكون أكبر من الصفر.');
        }

        return DB::transaction(function () use ($supplier, $amount, $method, $notes, $user) {
            $lockedSupplier = Supplier::where('id', $supplier->id)->lockForUpdate()->first();
            $balanceBefore = (float) $lockedSupplier->current_balance;
            $balanceAfter = $balanceBefore - $amount;

            $lockedSupplier->current_balance = $balanceAfter;
            $lockedSupplier->save();

            $activeCashSession = \App\Models\CashSession::where('user_id', $user->id)
                ->where('status', 'open')
                ->latest()
                ->first();

            $paymentNumber = $this->generatePaymentNumber();

            $payment = \App\Models\SupplierPayment::create([
                'payment_number' => $paymentNumber,
                'supplier_id' => $lockedSupplier->id,
                'user_id' => $user->id,
                'cash_session_id' => $activeCashSession?->id,
                'amount' => $amount,
                'payment_method' => $method,
                'payment_date' => now()->toDateString(),
                'notes' => $notes,
            ]);

            return SupplierTransaction::create([
                'supplier_id' => $lockedSupplier->id,
                'user_id' => $user->id,
                'type' => 'payment',
                'amount' => $amount,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'reference_type' => \App\Models\SupplierPayment::class,
                'reference_id' => $payment->id,
                'notes' => $notes ?: "سند صرف دفعة مورد ({$method}) - {$paymentNumber}",
            ]);
        });
    }
}
