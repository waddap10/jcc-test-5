<?php

namespace App\Traits;

use Illuminate\Support\Facades\Storage;

trait HasFileStorage
{
    /**
     * Get file URL for a given field
     */
    public function getFileUrl($field)
    {
        $value = $this->getAttribute($field);
        return $value ? Storage::url($value) : null;
    }

    /**
     * Store file and update field
     */
    public function storeFile($file, $field, $directory = 'uploads')
    {
        // Delete old file if exists
        if ($this->$field) {
            Storage::disk('public')->delete($this->$field);
        }

        $path = $file->store($directory, 'public');
        $this->update([$field => $path]);
        return $path;
    }

    /**
     * Delete file from storage and clear field
     */
    public function deleteFile($field)
    {
        if ($this->$field) {
            Storage::disk('public')->delete($this->$field);
            $this->update([$field => null]);
        }
    }

    /**
     * Check if file exists for field
     */
    public function hasFile($field)
    {
        return !empty($this->$field);
    }
}