<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class BeoFile extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'order_id',
        'file_code',
        'file_path',
        'original_filename',
        'file_size',
        'mime_type',
        'metadata'
    ];

    protected $casts = [
        'metadata' => 'array'
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Generate the next file code for the current month
     */
    public static function generateFileCode(): string
    {
        $currentMonth = date('m');
        $currentYear = date('Y');
        
        // Count files in current month (not orders)
        $monthlyCount = self::whereYear('created_at', $currentYear)
            ->whereMonth('created_at', $currentMonth)
            ->count();
        
        $nextNumber = str_pad($monthlyCount + 1, 3, '0', STR_PAD_LEFT);
        
        return "BEO-{$nextNumber}/PPKGBK/JICC/{$currentMonth}/{$currentYear}";
    }

    /**
     * Generate filename based on file code
     */
    public function generateFilename(): string
    {
        $safeCode = str_replace(['/', '\\'], '-', $this->file_code);
        return $safeCode . '.pdf';
    }

    /**
     * Get the full file path
     */
    public function getFullPathAttribute(): string
    {
        return Storage::path($this->file_path);
    }

    /**
     * Get the file URL (for download)
     */
    public function getFileUrlAttribute(): string
    {
        return Storage::url($this->file_path);
    }

    /**
     * Check if file exists
     */
    public function fileExists(): bool
    {
        return Storage::exists($this->file_path);
    }

    /**
     * Delete the physical file
     */
    public function deleteFile(): bool
    {
        if ($this->fileExists()) {
            return Storage::delete($this->file_path);
        }
        return true;
    }

    /**
     * Boot method to handle file deletion
     */
    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($beoFile) {
            $beoFile->deleteFile();
        });
    }
}