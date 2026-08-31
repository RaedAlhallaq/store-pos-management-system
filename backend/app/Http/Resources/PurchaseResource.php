<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'purchase_number' => $this->purchase_number,
            'invoice_number' => $this->purchase_number, // Alias for frontend convenience
            'user_id' => $this->user_id,
            'purchaser_name' => $this->user?->name,
            'supplier_id' => $this->supplier_id,
            'supplier' => new SupplierResource($this->whenLoaded('supplier')),
            'subtotal' => $this->subtotal,
            'tax_amount' => $this->tax_amount,
            'discount_amount' => $this->discount_amount,
            'grand_total' => $this->grand_total,
            'paid_amount' => $this->paid_amount,
            'due_amount' => $this->due_amount,
            'payment_status' => $this->payment_status,
            'payment_method' => $this->payment_method,
            'purchase_status' => $this->purchase_status,
            'invoice_date' => $this->invoice_date?->toDateString(),
            'notes' => $this->notes,
            'items_count' => $this->items?->count() ?? 0,
            'items' => PurchaseItemResource::collection($this->whenLoaded('items')),
            'payments' => PurchasePaymentResource::collection($this->whenLoaded('payments')),
            'created_at' => $this->created_at?->toIso8601String(),
            'formatted_date' => $this->created_at?->format('Y-m-d H:i:s'),
        ];
    }
}
