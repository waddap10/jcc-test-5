<?php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'event_id' => ['required', 'exists:events,id'],
            'event_name' => ['required', 'string', 'max:255'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'venues' => ['required', 'array', 'min:1'],
            'venues.*' => ['exists:venues,id'],
           
            // Customer handling
            'customerOption' => ['required', 'in:new,existing'],
            'existing_customer_id' => ['required_if:customerOption,existing', 'exists:customers,id'],
           
            // New customer fields
            'customer.organizer' => ['required_if:customerOption,new', 'string', 'max:255'],
            'customer.contact_person' => ['nullable', 'string', 'max:255'],
            'customer.phone' => ['nullable', 'string', 'max:20'],
            'customer.email' => ['nullable', 'email', 'max:255'],
            'customer.address' => ['nullable', 'string'],
            'customer.kl_status' => ['nullable', 'boolean'], // Add validation for kl_status
           
            // Image attachments only
            'attachments.*' => ['nullable', 'image', 'mimes:jpg,jpeg,png,gif,webp', 'max:10240'], // 10MB max, images only
        ];
    }

    public function messages(): array
    {
        return [
            'event_id.required' => 'Please select an event type.',
            'event_id.exists' => 'Selected event type is invalid.',
            'venues.required' => 'Please select at least one venue.',
            'venues.min' => 'Please select at least one venue.',
            'end_date.after_or_equal' => 'End date must be after or equal to start date.',
            'existing_customer_id.required_if' => 'Please select an existing customer.',
            'customer.organizer.required_if' => 'Organizer name is required for new customer.',
            'customer.kl_status.boolean' => 'KL Status must be true or false.',
            'attachments.*.image' => 'Attachment must be an image file.',
            'attachments.*.mimes' => 'Attachment must be an image of type: jpg, jpeg, png, gif, webp.',
            'attachments.*.max' => 'Image may not be greater than 10MB.',
        ];
    }
}