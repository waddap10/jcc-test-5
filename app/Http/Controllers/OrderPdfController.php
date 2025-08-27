<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\BeoFile;
use App\Services\OrderPdfService;
use App\Services\PdfGenerationService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class OrderPdfController extends Controller
{
    protected $pdfService;

    public function __construct(PdfGenerationService $pdfService)
    {
        $this->pdfService = $pdfService;
    }

    /**
     * Generate PDF for an order
     */
    public function generatePdf(Request $request, Order $order)
    {
        try {
            // Check if PDF already exists for this order
            $existingPdf = BeoFile::where('order_id', $order->id)->first();

            if ($existingPdf && $request->get('regenerate') !== 'true') {
                return response()->json([
                    'success' => true,
                    'message' => 'PDF already exists',
                    'data' => [
                        'file_code' => $existingPdf->file_code,
                        'file_path' => $existingPdf->file_path,
                        'download_url' => route('order.pdf.download', $existingPdf->id),
                        'created_at' => $existingPdf->created_at
                    ]
                ]);
            }

            // Generate new PDF
            $beoFile = $this->pdfService->generateOrderPdf($order, [
                'additional_notes' => $request->get('notes', ''),
                'include_attachments' => $request->get('include_attachments', false)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'PDF generated successfully',
                'data' => [
                    'file_code' => $beoFile->file_code,
                    'file_path' => $beoFile->file_path,
                    'download_url' => route('order.pdf.download', $beoFile->id),
                    'file_size' => $beoFile->file_size,
                    'created_at' => $beoFile->created_at
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate PDF',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function downloadOrderPdf(Order $order)
    {


        // Check if order status allows download
        if ($order->status_beo !== 2) {
            return redirect()->back()->with('error', 'PDF can only be downloaded for approved orders.');
        }

        // Get the BeoFile for this order
        $beoFile = BeoFile::where('order_id', $order->id)->first();

        if (!$beoFile) {
            return redirect()->back()->with('error', 'No PDF file found for this order.');
        }

        // Check if physical file exists
        if (!$beoFile->fileExists()) {
            return redirect()->back()->with('error', 'PDF file not found on server. Please regenerate the PDF.');
        }

        try {
            // Log the download activity
            Log::info('PDF downloaded by sales user', [
                'user_id' => auth()->id(),
                'user_name' => auth()->user()->name,
                'order_id' => $order->id,
                'custom_code' => $order->custom_code,
                'file_code' => $beoFile->file_code,
                'file_path' => $beoFile->file_path
            ]);

            // Update download metadata
            $metadata = $beoFile->metadata ?? [];
            $metadata['downloads'] = $metadata['downloads'] ?? [];
            $metadata['downloads'][] = [
                'downloaded_at' => now()->toISOString(),
                'downloaded_by' => auth()->user()->name,
                'user_id' => auth()->id(),
                'ip_address' => request()->ip()
            ];
            $metadata['last_downloaded_at'] = now()->toISOString();
            $metadata['download_count'] = count($metadata['downloads']);

            $beoFile->update(['metadata' => $metadata]);

            // Return the file for download
            return Storage::download(
                $beoFile->file_path,
                $beoFile->original_filename,
                [
                    'Content-Type' => 'application/pdf',
                    'Content-Disposition' => 'attachment; filename="' . $beoFile->original_filename . '"'
                ]
            );

        } catch (\Exception $e) {
            Log::error('PDF download failed', [
                'user_id' => auth()->id(),
                'order_id' => $order->id,
                'file_code' => $beoFile->file_code,
                'error' => $e->getMessage()
            ]);

            return redirect()->back()->with('error', 'Failed to download PDF file.');
        }
    }

    /**
     * Preview PDF in browser (Sales only)
     */
    public function previewOrderPdf(Order $order)
    {
        // Check if user is sales role
        if (!$this->isSalesUser()) {
            abort(403, 'Only sales users can preview PDF files.');
        }

        // Check if order status allows preview
        if ($order->status_beo !== 2) {
            abort(403, 'PDF can only be previewed for approved orders.');
        }

        // Get the BeoFile for this order
        $beoFile = BeoFile::where('order_id', $order->id)->first();

        if (!$beoFile || !$beoFile->fileExists()) {
            abort(404, 'PDF file not found.');
        }

        try {
            $file = Storage::get($beoFile->file_path);

            return response($file, 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="' . $beoFile->original_filename . '"'
            ]);

        } catch (\Exception $e) {
            Log::error('PDF preview failed', [
                'user_id' => auth()->id(),
                'order_id' => $order->id,
                'error' => $e->getMessage()
            ]);

            abort(500, 'Failed to load PDF file.');
        }
    }

    /**
     * Get PDF info for an order
     */
    public function getPdfInfo(Order $order)
    {
        // Check if user is sales role
        if (!$this->isSalesUser()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $beoFile = BeoFile::where('order_id', $order->id)->first();

        if (!$beoFile) {
            return response()->json([
                'success' => false,
                'message' => 'No PDF found for this order'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'file_code' => $beoFile->file_code,
                'file_exists' => $beoFile->fileExists(),
                'file_size' => $beoFile->file_size,
                'created_at' => $beoFile->created_at,
                'updated_at' => $beoFile->updated_at,
                'download_count' => $beoFile->metadata['download_count'] ?? 0,
                'last_downloaded_at' => $beoFile->metadata['last_downloaded_at'] ?? null,
                'can_download' => $order->status_beo === 2,
                'download_url' => route('orders.pdf.download', $order->id),
                'preview_url' => route('orders.pdf.preview', $order->id)
            ]
        ]);
    }

    /**
     * Check if current user is sales
     */
    private function isSalesUser(): bool
    {
        $user = auth()->user();

        // Method 1: Check by role name (if you have roles)
        if (method_exists($user, 'hasRole')) {
            return $user->hasRole('sales') || $user->hasRole('Sales');
        }

        // Method 2: Check by role_id (if you have a role_id field)
        if (isset($user->role_id)) {
            // Assuming sales role_id is 3 (adjust according to your system)
            return $user->role_id === 3;
        }

        // Method 3: Check by email domain or specific users
        $salesEmails = [
            'sales@company.com',
            'sales1@company.com',
            'sales2@company.com',
            // Add your sales user emails here
        ];

        if (in_array($user->email, $salesEmails)) {
            return true;
        }

        // Method 4: Check by user department/group (if you have these fields)
        if (isset($user->department)) {
            return strtolower($user->department) === 'sales';
        }

        // Method 5: Check by specific user IDs (temporary solution)
        $salesUserIds = [1, 2, 3]; // Replace with actual sales user IDs
        return in_array($user->id, $salesUserIds);

        // Default: deny access
        return false;
    }

    public function testTemplateOnly(Order $order)
{
    try {
        $orderPdfService = app(OrderPdfService::class);
        
        // Test the template rendering in browser first
        return $orderPdfService->debugPdfHtml($order);
        
    } catch (\Throwable $e) {
        return response()->json([
            'step' => 'Template Rendering',
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
}

/**
 * Step 2: Test PDF generation with absolutely minimal data
 */
public function testMinimalPdf()
{
    try {
        ini_set('memory_limit', '512M');
        ini_set('max_execution_time', 300);
        
        // Create minimal test data
        $pdfData = [
            'file_code' => 'TEST-' . now()->format('YmdHis'),
            'title' => 'Test Document',
            'date' => now()->format('Y-m-d'),
            'time' => now()->format('H:i'),
            'department' => 'Test',
            'prepared_by' => 'Test User',
            'status' => 'Test Status',
            'order' => (object)[
                'id' => 1,
                'custom_code' => 'TEST-001',
                'event_name' => 'Test Event',
                'created_at' => now(),
                'customer' => [
                    'organizer' => 'Test Organizer',
                    'address' => 'Test Address',
                    'contact_person' => 'Test Contact',
                    'phone' => '123456789',
                    'email' => 'test@example.com'
                ],
                'schedules' => [],
                'beos' => [],
                'attachments' => []
            ],
            'logo_gbk_base64' => '',
            'logo_jicc_base64' => '',
        ];
        
        // Test PDF generation with minimal template
        $html = '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Test PDF</title>
    <style>
        body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 12px; margin: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        td { border: 1px solid #000; padding: 8px; }
    </style>
</head>
<body>
    <h1>Test PDF Document</h1>
    <table>
        <tr><td><strong>File Code:</strong></td><td>' . $pdfData['file_code'] . '</td></tr>
        <tr><td><strong>Date:</strong></td><td>' . $pdfData['date'] . '</td></tr>
        <tr><td><strong>Order ID:</strong></td><td>' . $pdfData['order']->id . '</td></tr>
    </table>
    <p>If you can see this PDF, basic generation is working!</p>
</body>
</html>';
        
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadHtml($html)
            ->setPaper('A4', 'portrait')
            ->setOptions([
                'defaultFont' => 'DejaVu Sans',
                'isRemoteEnabled' => false,
                'isHtml5ParserEnabled' => false,
            ]);
            
        $pdfOutput = $pdf->output();
        
        return response($pdfOutput)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'inline; filename="minimal-test.pdf"');
            
    } catch (\Throwable $e) {
        return response()->json([
            'step' => 'Minimal PDF Generation',
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
}

/**
 * Step 3: Test PDF generation without images
 */
public function testPdfNoImages(Order $order)
{
    try {
        ini_set('memory_limit', '512M');
        ini_set('max_execution_time', 300);
        
        $orderPdfService = app(OrderPdfService::class);
        $pdfContent = $orderPdfService->generateSimplePdf($order);
        
        return response($pdfContent)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'inline; filename="no-images-test.pdf"');
            
    } catch (\Throwable $e) {
        return response()->json([
            'step' => 'PDF Generation Without Images',
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
}

/**
 * Step 4: Test image processing only
 */
public function testImageProcessing(Order $order)
{
    try {
        $orderPdfService = app(OrderPdfService::class);
        
        // Use reflection to access private methods for testing
        $reflection = new \ReflectionClass($orderPdfService);
        
        // Test logo processing
        $logoMethod = $reflection->getMethod('getSafeImageAsBase64');
        $logoMethod->setAccessible(true);
        
        $logoGbk = $logoMethod->invoke($orderPdfService, 'images/logo_gbk.png');
        $logoJicc = $logoMethod->invoke($orderPdfService, 'images/logo_jicc.png');
        
        // Test order processing
        $processMethod = $reflection->getMethod('processOrderForPdf');
        $processMethod->setAccessible(true);
        
        $processedOrder = $processMethod->invoke($orderPdfService, $order);
        
        return response()->json([
            'step' => 'Image Processing Test',
            'logo_gbk_length' => strlen($logoGbk),
            'logo_jicc_length' => strlen($logoJicc),
            'logo_gbk_preview' => substr($logoGbk, 0, 50) . '...',
            'logo_jicc_preview' => substr($logoJicc, 0, 50) . '...',
            'order_attachments_count' => count($processedOrder->attachments ?? []),
            'beos_count' => count($processedOrder->beos ?? []),
            'processed_attachments' => collect($processedOrder->attachments ?? [])->map(function($att) {
                return [
                    'filename' => $att['file_name'] ?? 'unknown',
                    'has_base64' => isset($att['base64_data']) && !empty($att['base64_data']),
                    'base64_length' => isset($att['base64_data']) ? strlen($att['base64_data']) : 0
                ];
            })->toArray(),
        ]);
        
    } catch (\Throwable $e) {
        return response()->json([
            'step' => 'Image Processing Test',
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ], 500);
    }
}

/**
 * Step 5: Environment check
 */
public function testEnvironment()
{
    try {
        $checks = [
            'php_version' => PHP_VERSION,
            'memory_limit' => ini_get('memory_limit'),
            'max_execution_time' => ini_get('max_execution_time'),
            'dompdf_version' => class_exists('Dompdf\Dompdf') ? 'Available' : 'Not Available',
            'gd_extension' => extension_loaded('gd') ? 'Available' : 'Missing',
            'mbstring_extension' => extension_loaded('mbstring') ? 'Available' : 'Missing',
            'storage_writable' => is_writable(storage_path()) ? 'Yes' : 'No',
            'temp_dir_writable' => is_writable(sys_get_temp_dir()) ? 'Yes' : 'No',
        ];
        
        // Check if images exist
        $imageChecks = [
            'logo_gbk_exists' => file_exists(public_path('images/logo_gbk.png')) ? 'Yes' : 'No',
            'logo_jicc_exists' => file_exists(public_path('images/logo_jicc.png')) ? 'Yes' : 'No',
            'public_images_dir_exists' => is_dir(public_path('images')) ? 'Yes' : 'No',
            'storage_public_exists' => is_dir(storage_path('app/public')) ? 'Yes' : 'No',
        ];
        
        return response()->json([
            'step' => 'Environment Check',
            'system_checks' => $checks,
            'image_checks' => $imageChecks,
            'paths' => [
                'public_path' => public_path(),
                'storage_path' => storage_path(),
                'temp_path' => sys_get_temp_dir(),
            ]
        ]);
        
    } catch (\Throwable $e) {
        return response()->json([
            'step' => 'Environment Check',
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ], 500);
    }
}

/**
 * Step 6: Full debug with extensive logging
 */
public function testFullDebug(Order $order)
{
    try {
        Log::info('=== FULL DEBUG START ===', [
            'order_id' => $order->id,
            'memory_start' => memory_get_usage(true) / 1024 / 1024 . 'MB'
        ]);
        
        $orderPdfService = app(OrderPdfService::class);
        
        // Generate PDF with full debugging
        $beoFile = $orderPdfService->generateOrderPdf($order);
        
        Log::info('=== FULL DEBUG SUCCESS ===', [
            'beo_file_id' => $beoFile->id,
            'file_path' => $beoFile->file_path,
            'file_size' => $beoFile->file_size,
            'memory_end' => memory_get_usage(true) / 1024 / 1024 . 'MB',
            'memory_peak' => memory_get_peak_usage(true) / 1024 / 1024 . 'MB'
        ]);
        
        // Return the PDF
        $pdfContent = \Storage::get($beoFile->file_path);
        
        return response($pdfContent)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'inline; filename="full-debug-test.pdf"');
            
    } catch (\Throwable $e) {
        Log::error('=== FULL DEBUG FAILED ===', [
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString(),
            'memory_at_error' => memory_get_usage(true) / 1024 / 1024 . 'MB'
        ]);
        
        return response()->json([
            'step' => 'Full Debug Test',
            'error' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'suggestion' => 'Check storage/logs/laravel.log for detailed trace'
        ], 500);
    }
}
}