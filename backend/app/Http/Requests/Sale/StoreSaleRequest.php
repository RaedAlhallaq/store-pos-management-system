<?php

namespace App\Http\Requests\Sale;

use Illuminate\Foundation\Http\FormRequest;

class StoreSaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['nullable', 'exists:customers,id'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:500'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.001'],
            'items.*.unit_price' => ['nullable', 'numeric', 'min:0'],
            'items.*.discount_amount' => ['nullable', 'numeric', 'min:0'],
            'payments' => ['nullable', 'array'],
            'payments.*.payment_method' => ['required', 'in:cash,card,bank_transfer,credit'],
            'payments.*.amount' => ['required', 'numeric', 'min:0'],
            'payments.*.reference_number' => ['nullable', 'string', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'items.required' => 'سلة الفاتورة فارغة، يرجى إضافة أصناف.',
            'items.min' => 'سلة الفاتورة يجب أن تحتوي على صنف واحد على الأقل.',
            'items.*.product_id.required' => 'معرف الصنف مطلوب.',
            'items.*.product_id.exists' => 'أحد الأصناف المحددة غير موجود.',
            'items.*.quantity.required' => 'كمية الصنف مطلوبة.',
            'items.*.quantity.min' => 'الكمية يجب أن تكون أكبر من الصفر.',
            'customer_id.exists' => 'العميل المحدد غير صالح.',
        ];
    }
}
