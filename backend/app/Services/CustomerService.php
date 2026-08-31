<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\CustomerTransaction;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class CustomerService
{
    /**
     * Get paginated customers with search.
     */
    public function getPaginatedCustomers(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Customer::latest();

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
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
     * Get all active customers for quick selection.
     */
    public function getQuickList(): Collection
    {
        return Customer::where('is_active', true)->orderBy('name')->get();
    }

    /**
     * Create a customer.
     */
    public function createCustomer(array $data): Customer
    {
        return Customer::create($data);
    }

    /**
     * Update customer details.
     */
    public function updateCustomer(Customer $customer, array $data): Customer
    {
        // Prevent manual current_balance modification
        unset($data['current_balance']);

        $customer->update($data);

        return $customer;
    }

    /**
     * Generate unique customer payment sequence number: CPAY-YYYYMMDD-0001.
     */
    public function generatePaymentNumber(): string
    {
        $todayPrefix = 'CPAY-' . date('Ymd') . '-';
        $latest = \App\Models\CustomerPayment::where('payment_number', 'like', "{$todayPrefix}%")
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
     * Record payment received from customer to settle debt.
     */
    public function recordPayment(Customer $customer, float $amount, string $method, ?string $notes, User $user): CustomerTransaction
    {
        if ($amount <= 0) {
            throw new InvalidArgumentException('مبلغ الدفعة يجب أن يكون أكبر من الصفر.');
        }

        return DB::transaction(function () use ($customer, $amount, $method, $notes, $user) {
            $lockedCustomer = Customer::where('id', $customer->id)->lockForUpdate()->first();
            $balanceBefore = (float) $lockedCustomer->current_balance;
            $balanceAfter = $balanceBefore - $amount;

            $lockedCustomer->current_balance = $balanceAfter;
            $lockedCustomer->save();

            $activeCashSession = \App\Models\CashSession::where('user_id', $user->id)
                ->where('status', 'open')
                ->latest()
                ->first();

            $paymentNumber = $this->generatePaymentNumber();

            $payment = \App\Models\CustomerPayment::create([
                'payment_number' => $paymentNumber,
                'customer_id' => $lockedCustomer->id,
                'user_id' => $user->id,
                'cash_session_id' => $activeCashSession?->id,
                'amount' => $amount,
                'payment_method' => $method,
                'payment_date' => now()->toDateString(),
                'notes' => $notes,
            ]);

            return CustomerTransaction::create([
                'customer_id' => $lockedCustomer->id,
                'user_id' => $user->id,
                'type' => 'payment',
                'amount' => $amount,
                'balance_before' => $balanceBefore,
                'balance_after' => $balanceAfter,
                'reference_type' => \App\Models\CustomerPayment::class,
                'reference_id' => $payment->id,
                'notes' => $notes ?: "سند قبض دفعة نقداً/سداد ({$method}) - {$paymentNumber}",
            ]);
        });
    }
}
