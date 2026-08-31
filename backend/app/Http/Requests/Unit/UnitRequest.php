<?php

namespace App\Http\Requests\Unit;

use Illuminate\Foundation\Http\FormRequest;

class UnitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'short_name' => ['required', 'string', 'max:30'],
            'allow_decimal' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'اسم الوحدة مطلوب.',
            'short_name.required' => 'رمز الوحدة المختصر مطلوب.',
        ];
    }
}
