<?php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
{
    return [
        'schedules' => ['required', 'array', 'min:1'],
        'schedules.*.start_date' => ['required', 'date', 'date_format:Y-m-d'],
        'schedules.*.end_date' => ['required', 'date', 'date_format:Y-m-d', 'after_or_equal:schedules.*.start_date'],
        'schedules.*.time_start' => ['required', 'date_format:H:i'],
        'schedules.*.time_end' => ['required', 'date_format:H:i'],
        'schedules.*.function' => ['required', 'in:1,2,3'],
        'schedules.*.people' => ['nullable', 'integer', 'min:1', 'max:9999'],
    ];
}

    public function messages(): array
    {
        return [
            'schedules.required' => 'At least one schedule is required.',
            'schedules.*.start_date.date' => 'Start date must be a valid date.',
            'schedules.*.start_date.date_format' => 'Start date must be in YYYY-MM-DD format.',
            'schedules.*.end_date.date' => 'End date must be a valid date.',
            'schedules.*.end_date.date_format' => 'End date must be in YYYY-MM-DD format.',
            'schedules.*.end_date.after_or_equal' => 'End date must be on or after the start date.',
            'schedules.*.time_start.date_format' => 'Start time must be in HH:MM format.',
            'schedules.*.time_end.date_format' => 'End time must be in HH:MM format.',
            'schedules.*.function.in' => 'Invalid function selected.',
            'schedules.*.people.integer' => 'Number of people must be a valid number.',
            'schedules.*.people.min' => 'Number of people must be at least 1.',
            'schedules.*.people.max' => 'Number of people may not exceed 9999.',
        ];
    }
}