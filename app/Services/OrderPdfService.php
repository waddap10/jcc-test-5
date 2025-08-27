<?php

namespace App\Services;

use App\Models\BeoFile;
use App\Models\Order;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class OrderPdfService
{
    /**
     * Main method called from controller - Enhanced for DomPDF 3.1
     */
    public function generateOrderPdf(Order $order, array $additionalData = []): BeoFile
    {
        try {
            // Add memory and time limits for image processing
            ini_set('memory_limit', '1G'); // Increased for 2MB images
            ini_set('max_execution_time', 600); // Increased timeout

            Log::info('Starting PDF generation with image processing', [
                'order_id' => $order->id,
                'memory_usage' => memory_get_usage(true) / 1024 / 1024 . 'MB'
            ]);

            $existingBeoFile = BeoFile::where('order_id', $order->id)->first();

            if ($existingBeoFile) {
                return $this->regeneratePdf($existingBeoFile, $order, $additionalData);
            } else {
                return $this->generateNewPdf($order, $additionalData);
            }

        } catch (\Exception $e) {
            Log::error('PDF generation failed', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            throw new \Exception('Failed to generate PDF: ' . $e->getMessage());
        }
    }

    /**
     * #4A: Generate completely new PDF with new code (FIRST TIME)
     */
    private function generateNewPdf(Order $order, array $additionalData = []): BeoFile
    {
        $fileCode = BeoFile::generateFileCode();
        $pdfContent = $this->createPdfContent($order, $fileCode, $additionalData);
        $filename = $this->generateSafeFilename($fileCode);
        $filePath = 'pdfs/orders/' . date('Y/m/') . $filename;

        Storage::put($filePath, $pdfContent);

        $beoFile = BeoFile::create([
            'order_id' => $order->id,
            'file_code' => $fileCode,
            'file_path' => $filePath,
            'original_filename' => $filename,
            'file_size' => strlen($pdfContent),
            'mime_type' => 'application/pdf',
            'metadata' => [
                'generated_at' => now()->toISOString(),
                'template_version' => '3.0', // Updated for multi-image support
                'generation_type' => 'new',
                'order_data' => $this->getOrderMetadata($order)
            ]
        ]);

        Log::info('New PDF generated successfully', [
            'file_code' => $fileCode,
            'order_id' => $order->id,
            'file_path' => $filePath
        ]);

        return $beoFile;
    }

    /**
     * #4B: Regenerate PDF with existing code (AFTER EDITS)
     */
    private function regeneratePdf(BeoFile $existingBeoFile, Order $order, array $additionalData = []): BeoFile
    {
        $fileCode = $existingBeoFile->file_code;

        if ($existingBeoFile->fileExists()) {
            Storage::delete($existingBeoFile->file_path);
            Log::info('Old PDF file deleted for regeneration', [
                'file_code' => $fileCode,
                'old_path' => $existingBeoFile->file_path
            ]);
        }

        $pdfContent = $this->createPdfContent($order, $fileCode, $additionalData);
        $filename = $this->generateSafeFilename($fileCode);
        $filePath = 'pdfs/orders/' . date('Y/m/') . $filename;

        Storage::put($filePath, $pdfContent);

        $existingBeoFile->update([
            'file_path' => $filePath,
            'original_filename' => $filename,
            'file_size' => strlen($pdfContent),
            'metadata' => [
                'generated_at' => now()->toISOString(),
                'template_version' => '3.0',
                'generation_type' => 'regenerated',
                'regenerated_count' => ($existingBeoFile->metadata['regenerated_count'] ?? 0) + 1,
                'previous_path' => $existingBeoFile->getOriginal('file_path'),
                'order_data' => $this->getOrderMetadata($order)
            ]
        ]);

        return $existingBeoFile->refresh();
    }

    /**
     * Enhanced PDF content creation with multi-type image processing
     */
    private function createPdfContent(Order $order, string $fileCode, array $additionalData = []): string
    {
        try {
            Log::info('Starting PDF content creation with multi-image support', [
                'order_id' => $order->id,
                'file_code' => $fileCode
            ]);

            // Process all image types
            $imageProcessingStart = microtime(true);
            
            // 1. Logo images from public/images/
            $logoGbk = $this->getLogoImage('images/logo_gbk.png');
            $logoJicc = $this->getLogoImage('images/logo_jicc.png');

            // 2. Process BEO images and add to order data
            $processedOrder = $this->processBeoImages($order);

            // 3. Process order attachment images
            $processedOrder = $this->processOrderImages($processedOrder);

            $imageProcessingTime = round((microtime(true) - $imageProcessingStart) * 1000, 2);

            Log::info('All images processed', [
                'processing_time_ms' => $imageProcessingTime,
                'logo_gbk_loaded' => !empty($logoGbk),
                'logo_jicc_loaded' => !empty($logoJicc),
                'beo_images_processed' => $this->countBeoImagesWithBase64($processedOrder),
                'order_images_processed' => $this->countOrderImagesWithBase64($processedOrder)
            ]);

            $pdfData = [
                'file_code' => $fileCode,
                'order' => $processedOrder, // Use processed order with base64 images
                'document_id' => $fileCode,
                'title' => "Order #{$order->custom_code} - BEO Document",
                'date' => now()->format('Y-m-d'),
                'time' => now()->format('H:i'),
                'department' => 'Operations',
                'prepared_by' => auth()->user()->name ?? 'System',
                'status' => $this->getStatusText($order->status_beo),
                // Logo images
                'logo_gbk_base64' => $logoGbk,
                'logo_jicc_base64' => $logoJicc,
            ];

            $pdfData = array_merge($pdfData, $additionalData);

            // Optimized DomPDF settings for handling multiple large images
            $pdf = Pdf::loadView('pdf.order-template', $pdfData)
                ->setPaper('A4', 'portrait')
                ->setOptions([
                    'defaultFont' => 'DejaVu Sans',
                    'isRemoteEnabled' => false,
                    'isHtml5ParserEnabled' => true, // Essential for image support
                    'isFontSubsettingEnabled' => true,
                    'debugPng' => false, // Disable in production for performance
                    'debugKeepTemp' => false,
                    'debugCss' => false,
                    'enable_php' => false,
                    'dpi' => 72, // Lower DPI for better performance with large images
                    'chroot' => storage_path(),
                ]);

            Log::info('PDF object created with multi-image support');

            $pdfOutput = $pdf->output();

            Log::info('PDF generation completed successfully', [
                'pdf_size_bytes' => strlen($pdfOutput),
                'pdf_size_mb' => round(strlen($pdfOutput) / (1024 * 1024), 2)
            ]);

            return $pdfOutput;

        } catch (\Exception $e) {
            Log::error('Enhanced PDF content creation failed', [
                'order_id' => $order->id,
                'file_code' => $fileCode,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            throw new \Exception('PDF content creation failed: ' . $e->getMessage());
        }
    }

    /**
     * Get logo images from public/images/ directory
     */
    private function getLogoImage(string $imagePath): string
    {
        try {
            $possiblePaths = [
                public_path($imagePath),
                public_path('storage/' . $imagePath),
                resource_path($imagePath),
            ];

            foreach ($possiblePaths as $fullPath) {
                if (file_exists($fullPath) && is_readable($fullPath)) {
                    return $this->convertImageToBase64($fullPath, 'logo');
                }
            }

            Log::info('Logo image not found', ['path' => $imagePath]);
            return $this->getTransparentPlaceholder();

        } catch (\Exception $e) {
            Log::error('Logo image processing failed', [
                'path' => $imagePath,
                'error' => $e->getMessage()
            ]);
            return $this->getTransparentPlaceholder();
        }
    }

    /**
     * Process BEO images from storage/app/public/beos/attachments/
     */
    private function processBeoImages(Order $order): Order
    {
        try {
            $processedBeos = [];

            foreach ($order->beos ?? [] as $beo) {
                $processedAttachments = [];

                foreach ($beo['attachments'] ?? [] as $attachment) {
                    $processedAttachment = $attachment;
                    
                    if (isset($attachment['file_name'])) {
                        $imagePath = storage_path('app/public/' . $attachment['file_name']);
                        
                        if (file_exists($imagePath) && $this->isImageFile($imagePath)) {
                            $base64Data = $this->convertImageToBase64($imagePath, 'beo');
                            if (!empty($base64Data)) {
                                $processedAttachment['base64_data'] = $base64Data;
                            }
                        }
                    }
                    
                    $processedAttachments[] = $processedAttachment;
                }

                $beo['attachments'] = $processedAttachments;
                $processedBeos[] = $beo;
            }

            $order->beos = $processedBeos;
            return $order;

        } catch (\Exception $e) {
            Log::error('BEO image processing failed', [
                'order_id' => $order->id,
                'error' => $e->getMessage()
            ]);
            return $order; // Return original order on error
        }
    }

    /**
     * Process order images from storage/app/public/orders/attachments/
     */
    private function processOrderImages(Order $order): Order
    {
        try {
            $processedAttachments = [];

            foreach ($order->attachments ?? [] as $attachment) {
                $processedAttachment = $attachment;
                
                if (isset($attachment['file_name'])) {
                    $imagePath = storage_path('app/public/' . $attachment['file_name']);
                    
                    if (file_exists($imagePath) && $this->isImageFile($imagePath)) {
                        $base64Data = $this->convertImageToBase64($imagePath, 'order');
                        if (!empty($base64Data)) {
                            $processedAttachment['base64_data'] = $base64Data;
                        }
                    }
                }
                
                $processedAttachments[] = $processedAttachment;
            }

            $order->attachments = $processedAttachments;
            return $order;

        } catch (\Exception $e) {
            Log::error('Order image processing failed', [
                'order_id' => $order->id,
                'error' => $e->getMessage()
            ]);
            return $order; // Return original order on error
        }
    }

    /**
     * Convert image file to base64 with optimization for PDF
     */
    private function convertImageToBase64(string $filePath, string $imageType): string
    {
        try {
            $fileSize = filesize($filePath);
            
            // 2MB limit as specified
            if ($fileSize > 2 * 1024 * 1024) {
                Log::warning('Image file too large', [
                    'path' => $filePath,
                    'size_mb' => round($fileSize / (1024 * 1024), 2),
                    'type' => $imageType
                ]);
                return '';
            }

            $imageData = file_get_contents($filePath);
            if ($imageData === false) {
                Log::warning('Failed to read image file', ['path' => $filePath]);
                return '';
            }

            // Detect MIME type
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_file($finfo, $filePath);
            finfo_close($finfo);

            // Support all common image formats
            $supportedTypes = [
                'image/jpeg',
                'image/jpg',
                'image/png', 
                'image/gif',
                'image/webp',
                'image/bmp',
                'image/tiff'
            ];

            if (!in_array($mimeType, $supportedTypes)) {
                Log::warning('Unsupported image type', [
                    'path' => $filePath,
                    'mime_type' => $mimeType,
                    'type' => $imageType
                ]);
                return '';
            }

            // Validate image integrity
            $imageInfo = getimagesizefromstring($imageData);
            if ($imageInfo === false) {
                Log::warning('Invalid image data', ['path' => $filePath]);
                return '';
            }

            // For large images, consider resizing to optimize PDF size
            if ($fileSize > 500 * 1024) { // 500KB threshold
                $imageData = $this->optimizeImageForPdf($imageData, $mimeType, $imageInfo);
            }

            $base64String = 'data:' . $mimeType . ';base64,' . base64_encode($imageData);

            Log::info('Image converted successfully', [
                'path' => basename($filePath),
                'type' => $imageType,
                'original_size_kb' => round($fileSize / 1024, 2),
                'optimized_size_kb' => round(strlen($imageData) / 1024, 2),
                'dimensions' => $imageInfo[0] . 'x' . $imageInfo[1],
                'mime_type' => $mimeType
            ]);

            return $base64String;

        } catch (\Exception $e) {
            Log::error('Image conversion failed', [
                'path' => $filePath,
                'type' => $imageType,
                'error' => $e->getMessage()
            ]);
            return '';
        }
    }

    /**
     * Optimize large images for PDF rendering
     */
    private function optimizeImageForPdf(string $imageData, string $mimeType, array $imageInfo): string
    {
        try {
            // Only optimize JPEG and PNG for now
            if (!in_array($mimeType, ['image/jpeg', 'image/png'])) {
                return $imageData;
            }

            $maxWidth = 800; // Max width for PDF images
            $maxHeight = 600; // Max height for PDF images
            $quality = 85; // JPEG quality

            $originalWidth = $imageInfo[0];
            $originalHeight = $imageInfo[1];

            // Skip if image is already small enough
            if ($originalWidth <= $maxWidth && $originalHeight <= $maxHeight) {
                return $imageData;
            }

            // Calculate new dimensions maintaining aspect ratio
            $ratio = min($maxWidth / $originalWidth, $maxHeight / $originalHeight);
            $newWidth = round($originalWidth * $ratio);
            $newHeight = round($originalHeight * $ratio);

            // Create image resource from string
            $sourceImage = null;
            if ($mimeType === 'image/jpeg') {
                $sourceImage = imagecreatefromstring($imageData);
            } elseif ($mimeType === 'image/png') {
                $sourceImage = imagecreatefromstring($imageData);
            }

            if (!$sourceImage) {
                return $imageData; // Return original on failure
            }

            // Create resized image
            $resizedImage = imagecreatetruecolor($newWidth, $newHeight);
            
            // Preserve transparency for PNG
            if ($mimeType === 'image/png') {
                imagealphablending($resizedImage, false);
                imagesavealpha($resizedImage, true);
                $transparent = imagecolorallocatealpha($resizedImage, 255, 255, 255, 127);
                imagefill($resizedImage, 0, 0, $transparent);
            }

            // Resize image
            imagecopyresampled($resizedImage, $sourceImage, 0, 0, 0, 0, $newWidth, $newHeight, $originalWidth, $originalHeight);

            // Output optimized image
            ob_start();
            if ($mimeType === 'image/jpeg') {
                imagejpeg($resizedImage, null, $quality);
            } elseif ($mimeType === 'image/png') {
                imagepng($resizedImage, null, 6); // Compression level 6
            }
            $optimizedData = ob_get_contents();
            ob_end_clean();

            // Clean up memory
            imagedestroy($sourceImage);
            imagedestroy($resizedImage);

            Log::info('Image optimized for PDF', [
                'original_size_kb' => round(strlen($imageData) / 1024, 2),
                'optimized_size_kb' => round(strlen($optimizedData) / 1024, 2),
                'original_dimensions' => $originalWidth . 'x' . $originalHeight,
                'new_dimensions' => $newWidth . 'x' . $newHeight
            ]);

            return $optimizedData;

        } catch (\Exception $e) {
            Log::error('Image optimization failed', ['error' => $e->getMessage()]);
            return $imageData; // Return original on error
        }
    }

    /**
     * Check if file is an image based on MIME type
     */
    private function isImageFile(string $filePath): bool
    {
        if (!file_exists($filePath)) {
            return false;
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $filePath);
        finfo_close($finfo);

        return str_starts_with($mimeType, 'image/');
    }

    /**
     * Get transparent placeholder image
     */
    private function getTransparentPlaceholder(): string
    {
        return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    }

    /**
     * Count BEO images that have base64 data
     */
    private function countBeoImagesWithBase64(Order $order): int
    {
        $count = 0;
        foreach ($order->beos ?? [] as $beo) {
            foreach ($beo['attachments'] ?? [] as $attachment) {
                if (isset($attachment['base64_data']) && !empty($attachment['base64_data'])) {
                    $count++;
                }
            }
        }
        return $count;
    }

    /**
     * Count order images that have base64 data
     */
    private function countOrderImagesWithBase64(Order $order): int
    {
        $count = 0;
        foreach ($order->attachments ?? [] as $attachment) {
            if (isset($attachment['base64_data']) && !empty($attachment['base64_data'])) {
                $count++;
            }
        }
        return $count;
    }

    /**
     * Test all image types processing
     */
    public function testAllImageTypes(Order $order): array
    {
        $results = [
            'logos' => [],
            'beo_images' => [],
            'order_images' => [],
            'summary' => []
        ];

        // Test logos
        $results['logos']['gbk'] = [
            'path' => 'images/logo_gbk.png',
            'exists' => file_exists(public_path('images/logo_gbk.png')),
            'base64_loaded' => !empty($this->getLogoImage('images/logo_gbk.png'))
        ];

        $results['logos']['jicc'] = [
            'path' => 'images/logo_jicc.png', 
            'exists' => file_exists(public_path('images/logo_jicc.png')),
            'base64_loaded' => !empty($this->getLogoImage('images/logo_jicc.png'))
        ];

        // Test BEO images
        foreach ($order->beos ?? [] as $index => $beo) {
            foreach ($beo['attachments'] ?? [] as $attIndex => $attachment) {
                if (isset($attachment['file_name'])) {
                    $path = storage_path('app/public/beos/attachments/' . $attachment['file_name']);
                    $results['beo_images'][$index . '_' . $attIndex] = [
                        'file_name' => $attachment['file_name'],
                        'path' => $path,
                        'exists' => file_exists($path),
                        'is_image' => $this->isImageFile($path),
                        'size_mb' => file_exists($path) ? round(filesize($path) / (1024 * 1024), 2) : 0
                    ];
                }
            }
        }

        // Test order images
        foreach ($order->attachments ?? [] as $index => $attachment) {
            if (isset($attachment['file_name'])) {
                $path = storage_path('app/public/orders/attachments/' . $attachment['file_name']);
                $results['order_images'][$index] = [
                    'file_name' => $attachment['file_name'],
                    'path' => $path,
                    'exists' => file_exists($path),
                    'is_image' => $this->isImageFile($path),
                    'size_mb' => file_exists($path) ? round(filesize($path) / (1024 * 1024), 2) : 0
                ];
            }
        }

        // Summary
        $results['summary'] = [
            'logos_working' => array_sum(array_column($results['logos'], 'base64_loaded')),
            'beo_images_found' => count(array_filter($results['beo_images'], fn($img) => $img['exists'] && $img['is_image'])),
            'order_images_found' => count(array_filter($results['order_images'], fn($img) => $img['exists'] && $img['is_image'])),
            'total_images' => count($results['beo_images']) + count($results['order_images']) + 2
        ];

        return $results;
    }

    // ... Keep all existing helper methods
    
    private function getStatusText(int $statusBeo): string
    {
        return match ($statusBeo) {
            1 => 'Sudah Kirim Ke Kanit',
            2 => 'Sudah Acc Kanit', 
            3 => 'Di edit',
            default => 'Planning'
        };
    }

    private function generateSafeFilename(string $fileCode): string
    {
        $safeCode = preg_replace('/[^a-zA-Z0-9\-_]/', '-', $fileCode);
        return $safeCode . '.pdf';
    }

    private function getOrderMetadata(Order $order): array
    {
        return [
            'order_id' => $order->id,
            'custom_code' => $order->custom_code,
            'status_beo' => $order->status_beo,
            'created_at' => $order->created_at->toISOString(),
            'updated_at' => $order->updated_at->toISOString(),
        ];
    }

    public function debugOrderImages(Order $order): array
{
    $debug = [
        'order_id' => $order->id,
        'logos' => [],
        'beo_attachments' => [],
        'order_attachments' => [],
        'file_system_check' => []
    ];

    // 1. Check logo files
    $logoFiles = ['images/logo_gbk.png', 'images/logo_jicc.png'];
    foreach ($logoFiles as $logo) {
        $path = public_path($logo);
        $debug['logos'][$logo] = [
            'expected_path' => $path,
            'exists' => file_exists($path),
            'readable' => file_exists($path) ? is_readable($path) : false,
            'size_bytes' => file_exists($path) ? filesize($path) : 0,
            'base64_result' => $this->getLogoImage($logo)
        ];
    }

    // 2. Check BEO attachment paths and processing
    foreach ($order->beos ?? [] as $beoIndex => $beo) {
        $debug['beo_attachments'][$beoIndex] = [
            'department' => $beo['department']['name'] ?? 'Unknown',
            'attachments_count' => count($beo['attachments'] ?? []),
            'files' => []
        ];

        foreach ($beo['attachments'] ?? [] as $attIndex => $attachment) {
            $fileName = $attachment['file_name'] ?? 'no_filename';
            $expectedPath = storage_path('app/public/beos/attachments/' . $fileName);
            
            $fileDebug = [
                'file_name' => $fileName,
                'expected_path' => $expectedPath,
                'exists' => file_exists($expectedPath),
                'readable' => file_exists($expectedPath) ? is_readable($expectedPath) : false,
                'size_bytes' => file_exists($expectedPath) ? filesize($expectedPath) : 0,
                'is_image' => file_exists($expectedPath) ? $this->isImageFile($expectedPath) : false,
                'mime_type' => null,
                'conversion_result' => 'not_attempted'
            ];

            // Try to detect MIME type if file exists
            if ($fileDebug['exists']) {
                $finfo = finfo_open(FILEINFO_MIME_TYPE);
                $fileDebug['mime_type'] = finfo_file($finfo, $expectedPath);
                finfo_close($finfo);

                // Try conversion
                try {
                    $base64Result = $this->convertImageToBase64($expectedPath, 'beo');
                    $fileDebug['conversion_result'] = empty($base64Result) ? 'failed' : 'success';
                    $fileDebug['base64_length'] = strlen($base64Result);
                } catch (\Exception $e) {
                    $fileDebug['conversion_result'] = 'error: ' . $e->getMessage();
                }
            }

            $debug['beo_attachments'][$beoIndex]['files'][$attIndex] = $fileDebug;
        }
    }

    // 3. Check order attachments
    foreach ($order->attachments ?? [] as $attIndex => $attachment) {
        $fileName = $attachment['file_name'] ?? 'no_filename';
        $expectedPath = storage_path('app/public/orders/attachments/' . $fileName);
        
        $debug['order_attachments'][$attIndex] = [
            'file_name' => $fileName,
            'expected_path' => $expectedPath,
            'exists' => file_exists($expectedPath),
            'readable' => file_exists($expectedPath) ? is_readable($expectedPath) : false,
            'size_bytes' => file_exists($expectedPath) ? filesize($expectedPath) : 0,
            'is_image' => file_exists($expectedPath) ? $this->isImageFile($expectedPath) : false,
        ];
    }

    // 4. Check file system structure
    $storagePaths = [
        'storage/app/public/beos/attachments' => storage_path('app/public/beos/attachments'),
        'storage/app/public/orders/attachments' => storage_path('app/public/orders/attachments'),
        'public/images' => public_path('images'),
    ];

    foreach ($storagePaths as $label => $path) {
        $debug['file_system_check'][$label] = [
            'path' => $path,
            'exists' => is_dir($path),
            'readable' => is_dir($path) ? is_readable($path) : false,
            'writable' => is_dir($path) ? is_writable($path) : false,
            'files_count' => is_dir($path) ? count(scandir($path)) - 2 : 0, // -2 for . and ..
            'sample_files' => is_dir($path) ? array_slice(scandir($path), 2, 5) : []
        ];
    }

    return $debug;
}

/**
 * Fix common image path issues
 */
public function fixImagePaths(Order $order): array
{
    $fixes = [];
    
    // Check if BEO images are in wrong location
    foreach ($order->beos ?? [] as $beoIndex => $beo) {
        foreach ($beo['attachments'] ?? [] as $attIndex => $attachment) {
            $fileName = $attachment['file_name'] ?? '';
            if (!$fileName) continue;

            $expectedPath = storage_path('app/public/beos/attachments/' . $fileName);
            
            if (!file_exists($expectedPath)) {
                // Check alternative locations
                $alternativePaths = [
                    storage_path('app/public/attachments/beos/' . $fileName),
                    storage_path('app/public/beo/attachments/' . $fileName),
                    storage_path('app/beos/attachments/' . $fileName),
                    public_path('storage/beos/attachments/' . $fileName),
                ];

                foreach ($alternativePaths as $altPath) {
                    if (file_exists($altPath)) {
                        $fixes[] = [
                            'type' => 'beo_attachment',
                            'file_name' => $fileName,
                            'expected_path' => $expectedPath,
                            'found_at' => $altPath,
                            'suggestion' => 'Move file or update path logic'
                        ];
                        break;
                    }
                }
            }
        }
    }

    return $fixes;
}

/**
 * Test image processing with detailed logging
 */
public function testImageProcessingDetailed(Order $order): void
{
    Log::info('=== DETAILED IMAGE PROCESSING TEST START ===');
    
    // Test logo processing
    Log::info('Testing logo processing...');
    $logoGbk = $this->getLogoImage('images/logo_gbk.png');
    $logoJicc = $this->getLogoImage('images/logo_jicc.png');
    
    Log::info('Logo processing results', [
        'gbk_success' => !empty($logoGbk),
        'jicc_success' => !empty($logoJicc)
    ]);

    // Test BEO processing step by step
    Log::info('Testing BEO image processing...');
    foreach ($order->beos ?? [] as $beoIndex => $beo) {
        Log::info("Processing BEO {$beoIndex}", [
            'department' => $beo['department']['name'] ?? 'Unknown',
            'attachments_count' => count($beo['attachments'] ?? [])
        ]);

        foreach ($beo['attachments'] ?? [] as $attIndex => $attachment) {
            $fileName = $attachment['file_name'] ?? 'no_filename';
            $path = storage_path('app/public/beos/attachments/' . $fileName);
            
            Log::info("Processing BEO attachment {$beoIndex}-{$attIndex}", [
                'file_name' => $fileName,
                'path' => $path,
                'exists' => file_exists($path),
                'size' => file_exists($path) ? filesize($path) : 0
            ]);

            if (file_exists($path)) {
                try {
                    $base64 = $this->convertImageToBase64($path, 'beo_detailed');
                    Log::info("Conversion result for {$fileName}", [
                        'success' => !empty($base64),
                        'base64_length' => strlen($base64)
                    ]);
                } catch (\Exception $e) {
                    Log::error("Conversion failed for {$fileName}", [
                        'error' => $e->getMessage()
                    ]);
                }
            }
        }
    }

    Log::info('=== DETAILED IMAGE PROCESSING TEST END ===');
}

/**
 * Quick fix: Generate PDF with placeholder images to test template
 */
public function generateTestPdfWithPlaceholders(Order $order): string
{
    try {
        // Create simple test images
        $testImage = $this->createTestImage();
        
        // Clone order and add test base64 data
        $testOrder = clone $order;
        
        // Add test base64 to all BEO attachments
        foreach ($testOrder->beos ?? [] as &$beo) {
            foreach ($beo['attachments'] ?? [] as &$attachment) {
                $attachment['base64_data'] = $testImage;
            }
        }

        // Add test base64 to all order attachments  
        foreach ($testOrder->attachments ?? [] as &$attachment) {
            $attachment['base64_data'] = $testImage;
        }

        $fileCode = 'TEST-' . now()->format('YmdHis');
        $pdfData = [
            'file_code' => $fileCode,
            'order' => $testOrder,
            'document_id' => $fileCode,
            'title' => "TEST: Order #{$order->custom_code} - BEO Document",
            'date' => now()->format('Y-m-d'),
            'time' => now()->format('H:i'),
            'department' => 'Operations',
            'prepared_by' => 'Test System',
            'status' => $this->getStatusText($order->status_beo),
            'logo_gbk_base64' => $testImage,
            'logo_jicc_base64' => $testImage,
        ];

        $pdf = Pdf::loadView('pdf.order-template', $pdfData)
            ->setPaper('A4', 'portrait')
            ->setOptions([
                'defaultFont' => 'DejaVu Sans',
                'isRemoteEnabled' => false,
                'isHtml5ParserEnabled' => true,
                'debugPng' => true,
            ]);

        return $pdf->output();

    } catch (\Exception $e) {
        Log::error('Test PDF generation failed', [
            'error' => $e->getMessage()
        ]);
        throw $e;
    }
}

/**
 * Create a simple test image as base64
 */
private function createTestImage(): string
{
    // Create a 100x100 blue square
    $image = imagecreate(100, 100);
    $blue = imagecolorallocate($image, 0, 100, 200);
    $white = imagecolorallocate($image, 255, 255, 255);
    
    // Add text
    imagestring($image, 3, 30, 40, 'TEST', $white);
    
    ob_start();
    imagepng($image);
    $imageData = ob_get_contents();
    ob_end_clean();
    
    imagedestroy($image);
    
    return 'data:image/png;base64,' . base64_encode($imageData);
}

}