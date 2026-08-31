<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SaleItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sale_id' => $this->sale_id,
            'product_id' => $this->product_id,
            'product_name' => $this->product_name,
            'unit_cost' => $this->unit_cost,
            'unit_price' => $this->unit_price,
            'quantity' => $this->quantity,
            'tax_percent' => $this->tax_percent,
            'tax_amount' => $this->tax_amount,
            'discount_amount' => $this->discount_amount,
            'subtotal' => $this->subtotal,
        ];
    }
}
