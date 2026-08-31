<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CashSessionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'cashier_name' => $this->user?->name,
            'opening_cash' => $this->opening_cash,
            'closing_cash_expected' => $this->closing_cash_expected,
            'closing_cash_actual' => $this->closing_cash_actual,
            'difference_amount' => $this->difference_amount,
            'total_sales_cash' => $this->total_sales_cash,
            'total_sales_card' => $this->total_sales_card,
            'total_sales_credit' => $this->total_sales_credit,
            'total_expenses_cash' => $this->total_expenses_cash,
            'status' => $this->status,
            'opened_at' => $this->opened_at?->toIso8601String(),
            'closed_at' => $this->closed_at?->toIso8601String(),
            'notes' => $this->notes,
            'movements' => CashMovementResource::collection($this->whenLoaded('movements')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
