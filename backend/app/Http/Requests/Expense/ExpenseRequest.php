<?php

namespace App\Http\Requests\Expense;

use Illuminate\Foundation\Http\FormRequest;

class ExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'expense_category_id' => ['required', 'exists:expense_categories,id'],
            'description' => ['required_without:title', 'nullable', 'string'],
            'title' => ['nullable', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'tax_amount' => ['nullable', 'numeric', 'min:0'],
            'payment_method' => ['required', 'in:cash,card,bank_transfer'],
            'expense_date' => ['nullable', 'date'],
            'reference_number' => ['nullable', 'string', 'max:100'],
            'receipt_image' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'description.required_without' => 'بيان أو وصف المصروف مطلوب.',
            'amount.required' => 'مبلغ المصروف مطلوب.',
            'expense_category_id.required' => 'تصنيف المصروف مطلوب.',
        ];
    }
}
