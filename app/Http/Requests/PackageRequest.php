<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PackageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('packages', 'name')->ignore($this->package?->id)
            ],
            'description' => 'nullable|string',
            'department_id' => 'required|exists:departments,id'
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Package name is required.',
            'name.unique' => 'This package name already exists.',
            'name.max' => 'Package name must not exceed 255 characters.',
            'department_id.required' => 'Department selection is required.',
            'department_id.exists' => 'Selected department does not exist.',
        ];
    }
}