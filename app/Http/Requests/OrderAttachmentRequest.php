<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OrderAttachmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

   public function rules(): array
{
    return [
        'attachments' => ['nullable', 'array'],
        'attachments.*' => ['file', 'image', 'mimes:jpg,jpeg,png', 'max:10240'], // Only images
        'delete_attachments' => ['nullable', 'array'],
        'delete_attachments.*' => ['exists:order_attachments,id'],
    ];
}

public function messages(): array
{
    return [
        'attachments.array' => 'Attachments must be an array.',
        'attachments.*.file' => 'Each attachment must be a file.',
        'attachments.*.image' => 'Each attachment must be an image.',
        'attachments.*.mimes' => 'Image must be of type: jpg, jpeg, png.',
        'attachments.*.max' => 'Image may not be greater than 10MB.',
        'delete_attachments.array' => 'Delete attachments must be an array.',
        'delete_attachments.*.exists' => 'Selected attachment is invalid.',
    ];
}

    public function attributes(): array
    {
        return [
            'attachments.*' => 'attachment',
            'delete_attachments.*' => 'attachment',
        ];
    }
}