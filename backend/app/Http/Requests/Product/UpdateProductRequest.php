<?php

namespace App\Http\Requests\Product;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $productId = $this->route('product') instanceof \App\Models\Product 
            ? $this->route('product')->id 
            : $this->route('product');

        return [
            'name' => ['required', 'string', 'max:255'],
            'barcode' => ['nullable', 'string', 'max:100', Rule::unique('products', 'barcode')->ignore($productId)],
            'sku' => ['nullable', 'string', 'max:100'],
            'category_id' => ['nullable', 'exists:product_categories,id'],
            'unit_id' => ['nullable', 'exists:product_units,id'],
            'cost_price' => ['required', 'numeric', 'min:0'],
            'selling_price' => ['required', 'numeric', 'min:0', 'gte:cost_price'],
            'tax_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'min_stock_alert' => ['nullable', 'numeric', 'min:0'],
            'description' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'اسم المنتج مطلوب.',
            'barcode.unique' => 'الباركود مسجل مسبقاً لمنتج آخر.',
            'cost_price.required' => 'سعر التكلفة مطلوب.',
            'selling_price.required' => 'سعر البيع مطلوب.',
            'selling_price.gte' => 'سعر البيع يجب ألا يكون أقل من سعر التكلفة.',
            'category_id.exists' => 'التصنيف المختار غير صالح.',
            'unit_id.exists' => 'الوحدة المختارة غير صالحة.',
        ];
    }
}
