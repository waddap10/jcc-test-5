<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;

class BeoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'beos' => 'required|array|min:1',
            'beos.*.id' => 'sometimes|nullable|integer|exists:beos,id',
            'beos.*.department_id' => 'required|integer|exists:departments,id',
            'beos.*.package_id' => 'nullable|integer|exists:packages,id',
            'beos.*.user_id' => 'nullable|integer|exists:users,id',
            'beos.*.notes' => 'nullable|string|max:1000',
            'new_attachments.*.*' => 'nullable|image|mimes:jpg,jpeg,png,gif,webp|max:10240', // 10MB max, images only
            'delete_attachments.*' => 'integer|exists:beo_attachments,id',
        ];
    }

    public function messages(): array
    {
        return [
            'beos.required' => 'At least one BEO is required.',
            'beos.array' => 'BEOs must be an array.',
            'beos.min' => 'At least one BEO is required.',
            'beos.*.department_id.required' => 'Department is required for all BEOs.',
            'beos.*.department_id.exists' => 'Selected department is invalid.',
            'beos.*.package_id.exists' => 'Selected package is invalid.',
            'beos.*.user_id.exists' => 'Selected user is invalid.',
            'beos.*.notes.max' => 'Notes may not be greater than 1000 characters.',
            'new_attachments.*.*.image' => 'Attachment must be an image file.',
            'new_attachments.*.*.mimes' => 'Attachment must be an image of type: jpg, jpeg, png, gif, webp.',
            'new_attachments.*.*.max' => 'Image may not be greater than 10MB.',
            'delete_attachments.*.exists' => 'Selected attachment is invalid.',
        ];
    }

    public function attributes(): array
    {
        return [
            'beos.*.department_id' => 'department',
            'beos.*.package_id' => 'package',
            'beos.*.user_id' => 'user',
            'beos.*.notes' => 'notes',
        ];
    }

    protected function prepareForValidation()
    {
        // Clean up empty values
        $beos = $this->input('beos', []);
        foreach ($beos as $index => $beo) {
            // Convert empty strings to null for nullable fields
            if (isset($beo['package_id']) && $beo['package_id'] === '') {
                $beos[$index]['package_id'] = null;
            }
            if (isset($beo['user_id']) && $beo['user_id'] === '') {
                $beos[$index]['user_id'] = null;
            }
            if (isset($beo['department_id']) && $beo['department_id'] === '') {
                $beos[$index]['department_id'] = null;
            }
        }
        $this->merge(['beos' => $beos]);
    }
}
