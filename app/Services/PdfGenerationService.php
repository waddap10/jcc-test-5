<?php

namespace App\Services;

use App\Models\BeoFile;
use App\Models\Order;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class PdfGenerationService
{
    /**
     * Generate PDF for an order
     */
    public function generateOrderPdf(Order $order, array $additionalData = []): BeoFile
    {
        try {
            // 1. Generate file code first
            $fileCode = BeoFile::generateFileCode();
            
            // 2. Prepare PDF data
            $pdfData = $this->preparePdfData($order, $fileCode, $additionalData);
            
            // 3. Generate PDF
            $pdf = Pdf::loadView('pdf.order-template', $pdfData)
                ->setPaper('A4', 'portrait')
                ->setOptions([
                    'dpi' => 150,
                    'defaultFont' => 'Arial',
                    'isRemoteEnabled' => true,
                    'isHtml5ParserEnabled' => true,
                ]);
            
            // 4. Generate filename and path
            $filename = $this->generateSafeFilename($fileCode);
            $filePath = 'pdfs/orders/' . date('Y/m/') . $filename;
            
            // 5. Save PDF to storage
            $pdfContent = $pdf->output();
            Storage::put($filePath, $pdfContent);
            
            // 6. Create BeoFile record
            $beoFile = BeoFile::create([
                'order_id' => $order->id,
                'file_code' => $fileCode,
                'file_path' => $filePath,
                'original_filename' => $filename,
                'file_size' => strlen($pdfContent),
                'mime_type' => 'application/pdf',
                'metadata' => [
                    'generated_at' => now()->toISOString(),
                    'template_version' => '1.0',
                    'order_data' => $this->getOrderMetadata($order)
                ]
            ]);
            
            Log::info('PDF generated successfully', [
                'file_code' => $fileCode,
                'order_id' => $order->id,
                'file_path' => $filePath
            ]);
            
            return $beoFile;
            
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
     * Prepare data for PDF generation
     */
    private function preparePdfData(Order $order, string $fileCode, array $additionalData = []): array
    {
        $baseData = [
            // Header data (appears on every page)
            'document_id' => $fileCode,
            'document_type' => 'BEO Document',
            'date' => now()->format('Y-m-d'),
            'time' => now()->format('H:i'),
            'department' => 'Operations',
            'prepared_by' => auth()->user()->name ?? 'System',
            'status' => 'Final',
            'title' => "Order #{$order->id} - BEO Document",
            
            // Order specific data
            'order' => $order,
            'order_id' => $order->id,
            'file_code' => $fileCode,
            
            // Content sections (similar to show.tsx structure)
            'sections' => [
                [
                    'title' => 'Order Information',
                    'content' => $this->getOrderInfoSection($order),
                    'page_break' => false
                ],
                [
                    'title' => 'Customer Details',
                    'content' => $this->getCustomerSection($order),
                    'page_break' => false
                ],
                [
                    'title' => 'Items & Services',
                    'content' => $this->getItemsSection($order),
                    'page_break' => false
                ],
                [
                    'title' => 'Summary & Notes',
                    'content' => $this->getSummarySection($order),
                    'page_break' => false
                ]
            ]
        ];

        return array_merge($baseData, $additionalData);
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
            'customer_name' => $order->customer_name ?? null,
            'total_amount' => $order->total_amount ?? null,
            'status' => $order->status ?? null,
            'created_at' => $order->created_at->toISOString(),
        ];
    }

    /**
     * Get order information section content
     */
    private function getOrderInfoSection(Order $order): string
    {
        return "
            <div class='order-info'>
                <p><strong>Order ID:</strong> {$order->id}</p>
                <p><strong>Date Created:</strong> {$order->created_at->format('Y-m-d H:i')}</p>
                <p><strong>Status:</strong> {$order->status}</p>
                <!-- Add more order fields as needed -->
            </div>
        ";
    }

    /**
     * Get customer section content
     */
    private function getCustomerSection(Order $order): string
    {
        return "
            <div class='customer-info'>
                <p><strong>Customer:</strong> {$order->customer_name}</p>
                <!-- Add more customer fields as needed -->
            </div>
        ";
    }

    /**
     * Get items section content
     */
    private function getItemsSection(Order $order): string
    {
        $content = "<div class='items-list'>";
        // Add logic to display order items
        $content .= "<p>Items and services will be listed here</p>";
        $content .= "</div>";
        return $content;
    }

    /**
     * Get summary section content
     */
    private function getSummarySection(Order $order): string
    {
        return "
            <div class='summary'>
                <p><strong>Total Amount:</strong> {$order->total_amount}</p>
                <p><strong>Notes:</strong> {$order->notes}</p>
            </div>
        ";
    }
}