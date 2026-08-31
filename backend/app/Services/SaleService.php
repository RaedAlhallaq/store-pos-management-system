<?php

namespace App\Services;

use App\Models\CashSession;
use App\Models\Customer;
use App\Models\CustomerTransaction;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SalePayment;
use App\Models\StockMovement;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class SaleService
{
    /**
     * Get paginated sales with search and filters.
     */
    public function getPaginatedSales(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Sale::with(['customer', 'user', 'items', 'payments'])->latest();

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('invoice_number', 'like', "%{$search}%")
                  ->orWhereHas('customer', function ($cq) use ($search) {
                      $cq->where('name', 'like', "%{$search}%")
                         ->orWhere('phone', 'like', "%{$search}%");
                  });
            });
        }

        if (! empty($filters['payment_status'])) {
            $query->where('payment_status', $filters['payment_status']);
        }

        if (! empty($filters['invoice_status'])) {
            $query->where('invoice_status', $filters['invoice_status']);
        }

        if (! empty($filters['payment_method'])) {
            $query->where('payment_method', $filters['payment_method']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        return $query->paginate($perPage);
    }

    /**
     * Generate unique sequential invoice number for the day: POS-YYYYMMDD-0001.
     */
    public function generateInvoiceNumber(): string
    {
        $todayPrefix = 'POS-' . date('Ymd') . '-';
        $latestSale = Sale::where('invoice_number', 'like', "{$todayPrefix}%")
            ->orderBy('id', 'desc')
            ->first();

        if ($latestSale) {
            $parts = explode('-', $latestSale->invoice_number);
            $sequence = isset($parts[2]) ? (int) $parts[2] + 1 : 1;
        } else {
            $sequence = 1;
        }

        return $todayPrefix . str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Process and commit sale transaction atomically.
     */
    public function processSale(array $data, User $user): Sale
    {
        return DB::transaction(function () use ($data, $user) {
            $itemsData = $data['items'] ?? [];
            if (empty($itemsData)) {
                throw new InvalidArgumentException('سلة المبيعات فارغة، يرجى إضافة منتج واحد على الأقل.');
            }

            // Check active cash session for user
            $activeCashSession = CashSession::where('user_id', $user->id)
                ->where('status', 'open')
                ->latest()
                ->first();

            $invoiceNumber = $this->generateInvoiceNumber();
            $customerId = $data['customer_id'] ?? null;
            $overallDiscount = (float) ($data['discount_amount'] ?? 0.0);

            $calculatedSubtotal = 0.0;
            $calculatedTax = 0.0;
            $calculatedItemsDiscount = 0.0;
            $preparedItems = [];

            // 1. Process and lock products for stock deduction
            foreach ($itemsData as $item) {
                $productId = $item['product_id'];
                $quantity = (float) $item['quantity'];

                if ($quantity <= 0) {
                    throw new InvalidArgumentException('كمية الصنف يجب أن تكون أكبر من الصفر.');
                }

                $product = Product::where('id', $productId)->lockForUpdate()->first();
                if (! $product) {
                    throw new InvalidArgumentException("المنتج ذو المعرف ({$productId}) غير موجود.");
                }

                $unitPrice = isset($item['unit_price']) ? (float) $item['unit_price'] : (float) $product->selling_price;
                $unitCost = (float) $product->cost_price;
                $itemDiscount = (float) ($item['discount_amount'] ?? 0.0);
                $taxPercent = (float) ($product->tax_percent ?? 15.0);

                $itemSubtotal = ($unitPrice * $quantity) - $itemDiscount;
                $itemTax = round($itemSubtotal * ($taxPercent / 100), 2);
                $itemTotal = $itemSubtotal + $itemTax;

                $calculatedSubtotal += $itemSubtotal;
                $calculatedTax += $itemTax;
                $calculatedItemsDiscount += $itemDiscount;

                $preparedItems[] = [
                    'product' => $product,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'unit_cost' => $unitCost,
                    'unit_price' => $unitPrice,
                    'quantity' => $quantity,
                    'tax_percent' => $taxPercent,
                    'tax_amount' => $itemTax,
                    'discount_amount' => $itemDiscount,
                    'subtotal' => $itemTotal,
                ];
            }

            $grandTotal = round($calculatedSubtotal + $calculatedTax - $overallDiscount, 2);
            if ($grandTotal < 0) {
                $grandTotal = 0.0;
            }

            // 2. Process Payments
            $paymentsData = $data['payments'] ?? [];
            $paidAmount = 0.0;
            $primaryPaymentMethod = 'cash';

            if (empty($paymentsData)) {
                // Default to cash paid in full if no explicit payments array passed
                $paymentsData = [
                    ['payment_method' => $data['payment_method'] ?? 'cash', 'amount' => $grandTotal]
                ];
            }

            foreach ($paymentsData as $p) {
                if ($p['payment_method'] !== 'credit') {
                    $paidAmount += (float) $p['amount'];
                }
            }

            $dueAmount = round($grandTotal - $paidAmount, 2);
            if ($dueAmount < 0) {
                // Customer paid more than total (change given), so invoice is settled
                $paidAmount = $grandTotal;
                $dueAmount = 0.0;
            }

            // Determine payment status
            if ($dueAmount <= 0) {
                $paymentStatus = 'paid';
            } elseif ($paidAmount > 0) {
                $paymentStatus = 'partial';
            } else {
                $paymentStatus = 'due';
            }

            // Validate Credit / Debt Customer Requirement
            if ($dueAmount > 0) {
                if (! $customerId) {
                    throw new InvalidArgumentException('البيع بالآجل أو وجود رصيد متبقٍ يتطلب تحديد عميل مسجل.');
                }

                $customer = Customer::where('id', $customerId)->lockForUpdate()->first();
                if (! $customer) {
                    throw new InvalidArgumentException('العميل المحدد غير موجود.');
                }

                // Check credit limit
                if ($customer->credit_limit > 0 && ($customer->current_balance + $dueAmount) > $customer->credit_limit) {
                    throw new InvalidArgumentException("المبلغ المتبقي يتجاوز الحد الائتماني المسموح به للعميل ({$customer->credit_limit} ر.س).");
                }
            }

            if (count($paymentsData) > 1) {
                $primaryPaymentMethod = 'multiple';
            } else {
                $primaryPaymentMethod = $paymentsData[0]['payment_method'] ?? 'cash';
            }

            // 3. Create Sale Record
            $sale = Sale::create([
                'invoice_number' => $invoiceNumber,
                'user_id' => $user->id,
                'customer_id' => $customerId,
                'cash_session_id' => $activeCashSession?->id,
                'subtotal' => $calculatedSubtotal,
                'tax_amount' => $calculatedTax,
                'discount_amount' => $overallDiscount + $calculatedItemsDiscount,
                'grand_total' => $grandTotal,
                'paid_amount' => $paidAmount,
                'due_amount' => $dueAmount,
                'payment_status' => $paymentStatus,
                'payment_method' => $primaryPaymentMethod,
                'invoice_status' => 'completed',
                'notes' => $data['notes'] ?? null,
            ]);

            // 4. Create Sale Items and Decrement Stock
            foreach ($preparedItems as $prep) {
                /** @var Product $product */
                $product = $prep['product'];
                $qty = $prep['quantity'];

                $balanceBefore = (float) $product->stock_quantity;
                $balanceAfter = $balanceBefore - $qty;

                $product->stock_quantity = $balanceAfter;
                $product->save();

                // Create Sale Item
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $product->id,
                    'product_name' => $prep['product_name'],
                    'unit_cost' => $prep['unit_cost'],
                    'unit_price' => $prep['unit_price'],
                    'quantity' => $qty,
                    'tax_percent' => $prep['tax_percent'],
                    'tax_amount' => $prep['tax_amount'],
                    'discount_amount' => $prep['discount_amount'],
                    'subtotal' => $prep['subtotal'],
                ]);

                // Create Stock Movement
                StockMovement::create([
                    'product_id' => $product->id,
                    'user_id' => $user->id,
                    'type' => 'sale',
                    'quantity' => -$qty,
                    'unit_cost' => $prep['unit_cost'],
                    'balance_before' => $balanceBefore,
                    'balance_after' => $balanceAfter,
                    'reference_type' => Sale::class,
                    'reference_id' => $sale->id,
                    'notes' => "فاتورة مبيعات {$invoiceNumber}",
                ]);
            }

            // 5. Create Payment Records
            foreach ($paymentsData as $pData) {
                SalePayment::create([
                    'sale_id' => $sale->id,
                    'payment_method' => $pData['payment_method'],
                    'amount' => (float) $pData['amount'],
                    'reference_number' => $pData['reference_number'] ?? null,
                ]);

                // Update cash session totals if session open
                if ($activeCashSession) {
                    if ($pData['payment_method'] === 'cash') {
                        $activeCashSession->total_sales_cash += (float) $pData['amount'];
                    } elseif ($pData['payment_method'] === 'card') {
                        $activeCashSession->total_sales_card += (float) $pData['amount'];
                    }
                }
            }

            // 6. Update Customer Balance and Ledger if credit/due
            if ($dueAmount > 0 && $customerId) {
                $customer = Customer::where('id', $customerId)->lockForUpdate()->first();
                $custBalanceBefore = (float) $customer->current_balance;
                $custBalanceAfter = $custBalanceBefore + $dueAmount;

                $customer->current_balance = $custBalanceAfter;
                $customer->save();

                CustomerTransaction::create([
                    'customer_id' => $customer->id,
                    'user_id' => $user->id,
                    'type' => 'sale_credit',
                    'amount' => $dueAmount,
                    'balance_before' => $custBalanceBefore,
                    'balance_after' => $custBalanceAfter,
                    'reference_type' => Sale::class,
                    'reference_id' => $sale->id,
                    'notes' => "متبقي فاتورة مبيعات آجل {$invoiceNumber}",
                ]);

                if ($activeCashSession) {
                    $activeCashSession->total_sales_credit += $dueAmount;
                }
            }

            if ($activeCashSession) {
                $activeCashSession->save();
            }

            return $sale->load(['customer', 'items.product', 'payments', 'user']);
        });
    }

    /**
     * Void an existing completed sale and reverse stock & debts.
     */
    public function voidSale(Sale $sale, string $reason, User $user): Sale
    {
        if ($sale->invoice_status === 'void') {
            throw new InvalidArgumentException('هذه الفاتورة ملغاة مسبقاً.');
        }

        return DB::transaction(function () use ($sale, $reason, $user) {
            $sale->load(['items.product', 'customer']);

            // 1. Revert Inventory for each item
            foreach ($sale->items as $item) {
                if ($item->product) {
                    $product = Product::where('id', $item->product_id)->lockForUpdate()->first();
                    if ($product) {
                        $qty = (float) $item->quantity;
                        $balanceBefore = (float) $product->stock_quantity;
                        $balanceAfter = $balanceBefore + $qty;

                        $product->stock_quantity = $balanceAfter;
                        $product->save();

                        StockMovement::create([
                            'product_id' => $product->id,
                            'user_id' => $user->id,
                            'type' => 'sale_return',
                            'quantity' => $qty,
                            'unit_cost' => $item->unit_cost,
                            'balance_before' => $balanceBefore,
                            'balance_after' => $balanceAfter,
                            'reference_type' => Sale::class,
                            'reference_id' => $sale->id,
                            'notes' => "إلغاء فاتورة مبيعات {$sale->invoice_number}: {$reason}",
                        ]);
                    }
                }
            }

            // 2. Revert Customer debt if due amount was registered
            if ($sale->due_amount > 0 && $sale->customer_id) {
                $customer = Customer::where('id', $sale->customer_id)->lockForUpdate()->first();
                if ($customer) {
                    $custBalanceBefore = (float) $customer->current_balance;
                    $custBalanceAfter = $custBalanceBefore - (float) $sale->due_amount;

                    $customer->current_balance = $custBalanceAfter;
                    $customer->save();

                    CustomerTransaction::create([
                        'customer_id' => $customer->id,
                        'user_id' => $user->id,
                        'type' => 'return',
                        'amount' => (float) $sale->due_amount,
                        'balance_before' => $custBalanceBefore,
                        'balance_after' => $custBalanceAfter,
                        'reference_type' => Sale::class,
                        'reference_id' => $sale->id,
                        'notes' => "إلغاء متبقي فاتورة {$sale->invoice_number}",
                    ]);
                }
            }

            // 3. Revert Cash Session totals if session was linked
            if ($sale->cash_session_id) {
                $session = CashSession::find($sale->cash_session_id);
                if ($session) {
                    foreach ($sale->payments as $payment) {
                        if ($payment->payment_method === 'cash') {
                            $session->total_sales_cash = max(0, (float) $session->total_sales_cash - (float) $payment->amount);
                        } elseif ($payment->payment_method === 'card') {
                            $session->total_sales_card = max(0, (float) $session->total_sales_card - (float) $payment->amount);
                        }
                    }
                    if ($sale->due_amount > 0) {
                        $session->total_sales_credit = max(0, (float) $session->total_sales_credit - (float) $sale->due_amount);
                    }
                    $session->save();
                }
            }

            // 4. Update Sale Status to VOID
            $sale->invoice_status = 'void';
            $sale->notes = ($sale->notes ? $sale->notes . " | " : "") . "تم الإلغاء: {$reason} بواسطة {$user->name}";
            $sale->save();

            return $sale->fresh(['customer', 'items', 'payments', 'user']);
        });
    }
}
