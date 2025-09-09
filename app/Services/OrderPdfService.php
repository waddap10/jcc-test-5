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
            ini_set('memory_limit', '1G');
            ini_set('max_execution_time', 600);

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
     * Delete PDF files associated with an order
     */
    public function deleteOrderPdfFile(Order $order): bool
    {
        try {
            // Get all BEO files associated with this order
            $beoFiles = BeoFile::where('order_id', $order->id)->get();
            $deletedCount = 0;

            foreach ($beoFiles as $beoFile) {
                // Delete the physical file if it exists
                if ($beoFile->file_path && Storage::exists($beoFile->file_path)) {
                    Storage::delete($beoFile->file_path);
                    Log::info('Deleted PDF file', [
                        'order_id' => $order->id,
                        'file_path' => $beoFile->file_path
                    ]);
                    $deletedCount++;
                }

                // Delete the database record
                $beoFile->delete();
            }

            Log::info('Order PDF files deleted successfully', [
                'order_id' => $order->id,
                'files_deleted' => $deletedCount
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error('Failed to delete order PDF files', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return false;
        }
    }

    /**
     * Generate completely new PDF with new code (FIRST TIME)
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
                'template_version' => '3.0',
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
     * Regenerate PDF with existing code (AFTER EDITS)
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
     * UPDATED: Enable PHP for headers and page numbers
     */
    private function createPdfContent(Order $order, string $fileCode, array $additionalData = []): string
    {
        try {
            Log::info('Starting PDF content creation with headers and page numbers', [
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
                'order' => $processedOrder,
                'document_id' => $fileCode,
                'title' => "Order #{$order->custom_code} - BEO Document",
                'date' => now()->format('Y-m-d'),
                'time' => now()->format('H:i'),
                'department' => 'Operations',
                'prepared_by' => auth()->user()->name ?? 'System',
                'status' => $this->getStatusText($order->status_beo),
                'logo_gbk_base64' => $logoGbk,
                'logo_jicc_base64' => $logoJicc,
            ];

            $pdfData = array_merge($pdfData, $additionalData);

            $pdf = Pdf::loadView('pdf.order-template', $pdfData)
    ->setPaper('A4', 'portrait')
    ->setOptions([
        'defaultFont' => 'DejaVu Sans',
        'isRemoteEnabled' => false,
        'isHtml5ParserEnabled' => true,
        'isFontSubsettingEnabled' => true,
        'debugPng' => false,
        'debugKeepTemp' => false,
        'debugCss' => false,
        'enable_php' => true,
        'dpi' => 96, // Increase DPI for better border rendering
        'chroot' => storage_path(),
        'isPhpEnabled' => true,
        'tempDir' => storage_path('app/temp'),
        // Add these for better border handling
        'isJavascriptEnabled' => false,
        'debugLayout' => false,
        'debugLayoutLines' => false,
        'debugLayoutBlocks' => false,
        'debugLayoutInline' => false,
        'debugLayoutPaddingBox' => false,
    ]);

            Log::info('PDF object created with header/footer support enabled');

            $pdfOutput = $pdf->output();

            Log::info('PDF with headers and page numbers generated successfully', [
                'pdf_size_bytes' => strlen($pdfOutput),
                'pdf_size_mb' => round(strlen($pdfOutput) / (1024 * 1024), 2)
            ]);

            return $pdfOutput;

        } catch (\Exception $e) {
            Log::error('PDF content creation with headers failed', [
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
            return $order;
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
            return $order;
        }
    }

    /**
     * Convert image file to base64 with optimization for PDF
     */
    private function convertImageToBase64(string $filePath, string $imageType): string
    {
        try {
            $fileSize = filesize($filePath);

            // 2MB limit
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
            $sourceImage = imagecreatefromstring($imageData);
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
     * Get status text from status code
     */
    private function getStatusText(int $statusBeo): string
    {
        return match ($statusBeo) {
            1 => 'Sudah Kirim Ke Kanit',
            2 => 'Sudah Acc Kanit',
            3 => 'Di edit',
            default => 'Planning'
        };
    }

    /**
     * Generate safe filename from file code
     */
    private function generateSafeFilename(string $fileCode): string
    {
        $safeCode = preg_replace('/[^a-zA-Z0-9\-_]/', '-', $fileCode);
        return $safeCode . '.pdf';
    }

    /**
     * Get order metadata for storage
     */
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
}