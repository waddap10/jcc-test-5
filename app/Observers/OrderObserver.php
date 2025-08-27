<?php

namespace App\Observers;

use App\Models\Order;
use App\Services\OrderPdfService;
use App\Services\OrderNotificationService;
use Illuminate\Support\Facades\Log;

class OrderObserver
{
    protected $pdfService;
    protected $notificationService;

    public function __construct(OrderPdfService $pdfService, OrderNotificationService $notificationService)
    {
        $this->pdfService = $pdfService;
        $this->notificationService = $notificationService;
    }

    /**
     * Handle the Order "updated" event.
     * This is #7 from the workflow - automatically triggered when order is edited
     */
    public function updated(Order $order): void
    {
        // Check if status_beo was changed to 3 (edited/under revision)
        if ($order->isDirty('status_beo') && $order->status_beo === 3) {
            // Delete PDF file but keep the record with the same code
            $this->pdfService->deleteOrderPdfFile($order);
            
            Log::info('PDF file deleted due to status change to "edited"', [
                'order_id' => $order->id,
                'custom_code' => $order->custom_code,
                'new_status' => $order->status_beo
            ]);
        }

        // If you want to also handle when specific fields are updated
        // Add your actual field names here that should trigger file deletion and notifications
        $editableFields = [
            'event_name',           // If event name changes
            'start_date',           // If dates change
            'end_date',
            // Add fields that should trigger notifications:
            // 'beo_data',
            // 'schedule_data',
            // 'attachments_updated_at',
        ];
        
        $changedFields = [];
        foreach ($editableFields as $field) {
            if ($order->isDirty($field)) {
                $changedFields[] = $field;
            }
        }
        
        if (!empty($changedFields)) {
            // Set status to 3 (edited) and delete PDF file
            if ($order->status_beo !== 3) {
                $order->status_beo = 3;
                $order->saveQuietly(); // Save without triggering observer again
            }
            
            $this->pdfService->deleteOrderPdfFile($order);
            
            // Send notification to Kanit users - handle null auth
            $currentUser = auth()->user();
            if ($currentUser) {
                $this->notificationService->notifyOrderNeedsReview($order, $currentUser, $changedFields);
            } else {
                Log::warning('No authenticated user found for notification', [
                    'order_id' => $order->id,
                    'changed_fields' => $changedFields
                ]);
            }
            
            Log::info("PDF file deleted and notification sent due to field updates", [
                'order_id' => $order->id,
                'custom_code' => $order->custom_code,
                'updated_fields' => $changedFields
            ]);
        }
    }

    /**
     * Optional: Handle when order relationships are updated
     * If your schedules, beos, or attachments are separate models
     */
    public function saving(Order $order): void
    {
        // You can add logic here if needed for before-save operations
    }
}