<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExpenseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'expense_number' => $this->expense_number,
            'expense_category_id' => $this->expense_category_id,
            'category' => new ExpenseCategoryResource($this->whenLoaded('category')),
            'user_id' => $this->user_id,
            'user_name' => $this->user?->name,
            'cash_session_id' => $this->cash_session_id,
            'description' => $this->description,
            'title' => $this->description, // Alias for frontend
            'amount' => $this->amount,
            'tax_amount' => $this->tax_amount,
            'payment_method' => $this->payment_method,
            'expense_date' => $this->expense_date?->toDateString(),
            'reference_number' => $this->reference_number,
            'receipt_image' => $this->receipt_image,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
