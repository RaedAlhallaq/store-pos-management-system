<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;

class StockAdjustmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => ['required', 'in:adjustment,damage,initial,purchase_return,sale_return'],
            'quantity' => ['required', 'numeric', 'not_in:0'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'type.required' => 'نوع حركة التسوية مطلوب.',
            'type.in' => 'نوع الحركة المختار غير صالح.',
            'quantity.required' => 'كمية التعديل مطلوبة.',
            'quantity.not_in' => 'كمية التعديل لا يمكن أن تكون صفراً.',
        ];
    }
}
