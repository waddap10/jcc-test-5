<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class VenueRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'short' => [
                'required',
                'string',
                'max:50',
                Rule::unique('venues', 'short')->ignore($this->venue?->id)
            ],
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'description' => 'nullable|string',
            'dimension_m' => 'nullable|numeric|min:0',
            'dimension_f' => 'nullable|numeric|min:0',
            'setup_banquet' => 'nullable|integer|min:0',
            'setup_classroom' => 'nullable|integer|min:0',
            'setup_theater' => 'nullable|integer|min:0',
            'setup_reception' => 'nullable|integer|min:0',
            'floor_plan' => 'nullable|file|mimes:jpeg,png,jpg,gif,pdf|max:5120'
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Venue name is required.',
            'short.required' => 'Short code is required.',
            'short.unique' => 'This short code is already taken.',
            'photo.image' => 'Photo must be a valid image file.',
            'photo.max' => 'Photo size must not exceed 2MB.',
            'floor_plan.max' => 'Floor plan size must not exceed 5MB.',
            'dimension_m.numeric' => 'Length must be a valid number.',
            'dimension_f.numeric' => 'Width must be a valid number.',
            'setup_banquet.integer' => 'Banquet capacity must be a valid number.',
            'setup_classroom.integer' => 'Classroom capacity must be a valid number.',
            'setup_theater.integer' => 'Theater capacity must be a valid number.',
            'setup_reception.integer' => 'Reception capacity must be a valid number.',
        ];
    }
}