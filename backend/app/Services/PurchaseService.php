<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\PurchasePayment;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\SupplierTransaction;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class PurchaseService
{
    /**
     * Get paginated purchases with search and filters.
     */
    public function getPaginatedPurchases(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Purchase::with(['supplier', 'user', 'items.product', 'payments'])->latest();

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('purchase_number', 'like', "%{$search}%")
                  ->orWhereHas('supplier', function ($sq) use ($search) {
                      $sq->where('name', 'like', "%{$search}%")
                         ->orWhere('company_name', 'like', "%{$search}%");
                  });
            });
        }

        if (! empty($filters['payment_status'])) {
            $query->where('payment_status', $filters['payment_status']);
        }

        if (! empty($filters['purchase_status'])) {
            $query->where('purchase_status', $filters['purchase_status']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('invoice_date', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('invoice_date', '<=', $filters['date_to']);
        }

        return $query->paginate($perPage);
    }

    /**
     * Generate unique sequential purchase invoice number: PUR-YYYYMMDD-0001.
     */
    public function generatePurchaseNumber(): string
    {
        $todayPrefix = 'PUR-' . date('Ymd') . '-';
        $latest = Purchase::where('purchase_number', 'like', "{$todayPrefix}%")
            ->orderBy('id', 'desc')
            ->first();

        if ($latest) {
            $parts = explode('-', $latest->purchase_number);
            $sequence = isset($parts[2]) ? (int) $parts[2] + 1 : 1;
        } else {
            $sequence = 1;
        }

        return $todayPrefix . str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Process purchase transaction atomically and update inventory and supplier debt.
     */
    public function processPurchase(array $data, User $user): Purchase
    {
        return DB::transaction(function () use ($data, $user) {
            $itemsData = $data['items'] ?? [];
            if (empty($itemsData)) {
                throw new InvalidArgumentException('فاتورة الشراء يجب أن تحتوي على صنف واحد على الأقل.');
            }

            $supplierId = $data['supplier_id'] ?? null;
            $purchaseNumber = $this->generatePurchaseNumber();
            $overallDiscount = (float) ($data['discount_amount'] ?? 0.0);

            $calculatedSubtotal = 0.0;
            $calculatedTax = 0.0;
            $preparedItems = [];

            // 1. Validate and lock products to increase stock
            foreach ($itemsData as $item) {
                $productId = $item['product_id'];
                $quantity = (float) $item['quantity'];
                $unitCost = (float) $item['unit_cost'];

                if ($quantity <= 0) {
                    throw new InvalidArgumentException('كمية الشراء يجب أن تكون أكبر من الصفر.');
                }
                if ($unitCost < 0) {
                    throw new InvalidArgumentException('سعر التكلفة يجب ألا يكون سالباً.');
                }

                $product = Product::where('id', $productId)->lockForUpdate()->first();
                if (! $product) {
                    throw new InvalidArgumentException("المنتج ذو المعرف ({$productId}) غير موجود.");
                }

                $taxPercent = isset($item['tax_percent']) ? (float) $item['tax_percent'] : 15.0;
                $itemSubtotal = $unitCost * $quantity;
                $itemTax = round($itemSubtotal * ($taxPercent / 100), 2);
                $itemTotal = $itemSubtotal + $itemTax;

                $calculatedSubtotal += $itemSubtotal;
                $calculatedTax += $itemTax;

                $preparedItems[] = [
                    'product' => $product,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'unit_cost' => $unitCost,
                    'selling_price' => isset($item['selling_price']) ? (float) $item['selling_price'] : null,
                    'quantity' => $quantity,
                    'tax_percent' => $taxPercent,
                    'tax_amount' => $itemTax,
                    'subtotal' => $itemTotal,
                ];
            }

            $grandTotal = round($calculatedSubtotal + $calculatedTax - $overallDiscount, 2);
            if ($grandTotal < 0) {
                $grandTotal = 0.0;
            }

            // 2. Payments processing
            $paymentsData = $data['payments'] ?? [];
            $paidAmount = 0.0;
            $primaryPaymentMethod = 'cash';

            if (empty($paymentsData)) {
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
                $paidAmount = $grandTotal;
                $dueAmount = 0.0;
            }

            // Payment status
            if ($dueAmount <= 0) {
                $paymentStatus = 'paid';
            } elseif ($paidAmount > 0) {
                $paymentStatus = 'partial';
            } else {
                $paymentStatus = 'due';
            }

            if ($dueAmount > 0 && ! $supplierId) {
                throw new InvalidArgumentException('الشراء الآجل أو وجود رصيد متبقٍ للمورد يتطلب اختيار مورد مسجل.');
            }

            if (count($paymentsData) > 1) {
                $primaryPaymentMethod = 'multiple';
            } else {
                $primaryPaymentMethod = $paymentsData[0]['payment_method'] ?? 'cash';
            }

            // 3. Create Purchase Record
            $purchase = Purchase::create([
                'purchase_number' => $purchaseNumber,
                'supplier_id' => $supplierId,
                'user_id' => $user->id,
                'subtotal' => $calculatedSubtotal,
                'tax_amount' => $calculatedTax,
                'discount_amount' => $overallDiscount,
                'grand_total' => $grandTotal,
                'paid_amount' => $paidAmount,
                'due_amount' => $dueAmount,
                'payment_status' => $paymentStatus,
                'payment_method' => $primaryPaymentMethod,
                'purchase_status' => 'received',
                'invoice_date' => $data['invoice_date'] ?? now()->toDateString(),
                'notes' => $data['notes'] ?? null,
            ]);

            // 4. Create Items and Increment Stock & Update Cost Price
            foreach ($preparedItems as $prep) {
                /** @var Product $product */
                $product = $prep['product'];
                $qty = $prep['quantity'];

                $balanceBefore = (float) $product->stock_quantity;
                $balanceAfter = $balanceBefore + $qty;

                $product->stock_quantity = $balanceAfter;
                $product->cost_price = $prep['unit_cost'];
                if (! empty($prep['selling_price']) && $prep['selling_price'] > 0) {
                    $product->selling_price = $prep['selling_price'];
                }
                $product->save();

                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $product->id,
                    'product_name' => $prep['product_name'],
                    'unit_cost' => $prep['unit_cost'],
                    'quantity' => $qty,
                    'tax_percent' => $prep['tax_percent'],
                    'tax_amount' => $prep['tax_amount'],
                    'subtotal' => $prep['subtotal'],
                ]);

                StockMovement::create([
                    'product_id' => $product->id,
                    'user_id' => $user->id,
                    'type' => 'purchase',
                    'quantity' => $qty,
                    'unit_cost' => $prep['unit_cost'],
                    'balance_before' => $balanceBefore,
                    'balance_after' => $balanceAfter,
                    'reference_type' => Purchase::class,
                    'reference_id' => $purchase->id,
                    'notes' => "فاتورة مشتريات وتوريد {$purchaseNumber}",
                ]);
            }

            // 5. Create Payment Records
            foreach ($paymentsData as $pData) {
                PurchasePayment::create([
                    'purchase_id' => $purchase->id,
                    'payment_method' => $pData['payment_method'],
                    'amount' => (float) $pData['amount'],
                    'reference_number' => $pData['reference_number'] ?? null,
                ]);
            }

            // 6. Update Supplier Balance if credit
            if ($dueAmount > 0 && $supplierId) {
                $supplier = Supplier::where('id', $supplierId)->lockForUpdate()->first();
                if ($supplier) {
                    $suppBalanceBefore = (float) $supplier->current_balance;
                    $suppBalanceAfter = $suppBalanceBefore + $dueAmount;

                    $supplier->current_balance = $suppBalanceAfter;
                    $supplier->save();

                    SupplierTransaction::create([
                        'supplier_id' => $supplier->id,
                        'user_id' => $user->id,
                        'type' => 'purchase_credit',
                        'amount' => $dueAmount,
                        'balance_before' => $suppBalanceBefore,
                        'balance_after' => $suppBalanceAfter,
                        'reference_type' => Purchase::class,
                        'reference_id' => $purchase->id,
                        'notes' => "مستحق فاتورة مشتريات آجل {$purchaseNumber}",
                    ]);
                }
            }

            return $purchase->load(['supplier', 'items.product', 'payments', 'user']);
        });
    }

    /**
     * Void an existing purchase and reverse inventory & supplier debt.
     */
    public function voidPurchase(Purchase $purchase, string $reason, User $user): Purchase
    {
        if ($purchase->purchase_status === 'cancelled') {
            throw new InvalidArgumentException('هذه الفاتورة ملغاة مسبقاً.');
        }

        return DB::transaction(function () use ($purchase, $reason, $user) {
            $purchase->load(['items.product', 'supplier']);

            // 1. Revert Inventory for each item
            foreach ($purchase->items as $item) {
                if ($item->product) {
                    $product = Product::where('id', $item->product_id)->lockForUpdate()->first();
                    if ($product) {
                        $qty = (float) $item->quantity;
                        $balanceBefore = (float) $product->stock_quantity;
                        $balanceAfter = $balanceBefore - $qty;

                        $product->stock_quantity = $balanceAfter;
                        $product->save();

                        StockMovement::create([
                            'product_id' => $product->id,
                            'user_id' => $user->id,
                            'type' => 'purchase_return',
                            'quantity' => -$qty,
                            'unit_cost' => $item->unit_cost,
                            'balance_before' => $balanceBefore,
                            'balance_after' => $balanceAfter,
                            'reference_type' => Purchase::class,
                            'reference_id' => $purchase->id,
                            'notes' => "إلغاء فاتورة مشتريات {$purchase->purchase_number}: {$reason}",
                        ]);
                    }
                }
            }

            // 2. Revert Supplier debt if due amount was registered
            if ($purchase->due_amount > 0 && $purchase->supplier_id) {
                $supplier = Supplier::where('id', $purchase->supplier_id)->lockForUpdate()->first();
                if ($supplier) {
                    $suppBalanceBefore = (float) $supplier->current_balance;
                    $suppBalanceAfter = $suppBalanceBefore - (float) $purchase->due_amount;

                    $supplier->current_balance = $suppBalanceAfter;
                    $supplier->save();

                    SupplierTransaction::create([
                        'supplier_id' => $supplier->id,
                        'user_id' => $user->id,
                        'type' => 'return',
                        'amount' => (float) $purchase->due_amount,
                        'balance_before' => $suppBalanceBefore,
                        'balance_after' => $suppBalanceAfter,
                        'reference_type' => Purchase::class,
                        'reference_id' => $purchase->id,
                        'notes' => "إلغاء مستحق فاتورة مشتريات {$purchase->purchase_number}",
                    ]);
                }
            }

            $purchase->purchase_status = 'cancelled';
            $purchase->notes = ($purchase->notes ? $purchase->notes . " | " : "") . "تم الإلغاء: {$reason} بواسطة {$user->name}";
            $purchase->save();

            return $purchase->fresh(['supplier', 'items', 'payments', 'user']);
        });
    }
}
