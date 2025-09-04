<?php

namespace App\Http\Controllers;

use App\Http\Requests\OrderAttachmentRequest;
use App\Models\Order;
use App\Models\OrderAttachment;
use App\Services\OrderNotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class OrderAttachmentController extends Controller
{
    protected $notificationService;

    public function __construct(OrderNotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function create(Order $order): Response
    {
        return Inertia::render('sales/orders/attachments/create', [
            'order' => $order->only(['id', 'event_name', 'custom_code']),
        ]);
    }

    public function store(OrderAttachmentRequest $request, Order $order): RedirectResponse
    {
        try {
            $validated = $request->validated();
            $originalStatus = $order->status_beo;
            $uploadedCount = 0;

            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $attachment = $order->attachments()->create([
                        'file_name' => $file->getClientOriginalName(),
                    ]);
                    $attachment->storeAttachment($file);
                    $uploadedCount++;
                }
            }

            // Update order status and send notification if needed
            if ($originalStatus == 2 && $uploadedCount > 0) {
                $order->update(['status_beo' => 3]);
                
                $currentUser = auth()->user();
                if ($currentUser) {
                    $this->notificationService->notifyOrderNeedsReview(
                        $order, 
                        $currentUser, 
                        ["{$uploadedCount} attachment(s) added"]
                    );
                    
                    Log::info('Order needs review notification sent for attachment upload', [
                        'order_id' => $order->id,
                        'attachments_added' => $uploadedCount
                    ]);
                }
            }

            return redirect()
                ->route('sales.orders.show', $order->id)
                ->with('flash', ['message' => 'Attachments uploaded successfully.']);

        } catch (\Exception $e) {
            Log::error('Error uploading attachments: ' . $e->getMessage());
            
            return redirect()
                ->back()
                ->withInput()
                ->withErrors(['error' => 'Failed to upload attachments. Please try again.']);
        }
    }

    public function edit(Order $order): Response
    {
        $order->load('attachments:id,order_id,file_name,created_at');
        
        return Inertia::render('sales/orders/attachments/edit', [
            'order' => $order->only(['id', 'event_name', 'custom_code']),
            'attachments' => $order->attachments,
        ]);
    }

    public function update(OrderAttachmentRequest $request, Order $order): RedirectResponse
    {
        try {
            $validated = $request->validated();
            $originalStatus = $order->status_beo;
            $changedFields = [];
            $deletedCount = 0;
            $uploadedCount = 0;

            // Delete marked attachments
            if (!empty($validated['delete_attachments'])) {
                foreach ($validated['delete_attachments'] as $attachmentId) {
                    $attachment = OrderAttachment::where('id', $attachmentId)
                        ->where('order_id', $order->id)
                        ->first();
                    
                    if ($attachment) {
                        $attachment->deleteFile('file_name');
                        $attachment->delete();
                        $deletedCount++;
                    }
                }
                
                if ($deletedCount > 0) {
                    $changedFields[] = "{$deletedCount} attachment(s) deleted";
                }
            }

            // Add new attachments
            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $attachment = $order->attachments()->create([
                        'file_name' => $file->getClientOriginalName(),
                    ]);
                    $attachment->storeAttachment($file);
                    $uploadedCount++;
                }
                
                if ($uploadedCount > 0) {
                    $changedFields[] = "{$uploadedCount} attachment(s) added";
                }
            }

            // Update order status and send notification if needed
            if ($originalStatus == 2 && !empty($changedFields)) {
                $order->update(['status_beo' => 3]);
                
                $currentUser = auth()->user();
                if ($currentUser) {
                    $this->notificationService->notifyOrderNeedsReview(
                        $order, 
                        $currentUser, 
                        $changedFields
                    );
                    
                    Log::info('Order needs review notification sent for attachment update', [
                        'order_id' => $order->id,
                        'changes' => $changedFields
                    ]);
                }
            }

            return redirect()
                ->route('sales.orders.show', $order->id)
                ->with('flash', ['message' => 'Attachments updated successfully.']);

        } catch (\Exception $e) {
            Log::error('Error updating attachments: ' . $e->getMessage());
            
            return redirect()
                ->back()
                ->withInput()
                ->withErrors(['error' => 'Failed to update attachments. Please try again.']);
        }
    }

    public function destroy(Order $order, OrderAttachment $attachment): RedirectResponse
    {
        abort_if($attachment->order_id !== $order->id, 404);
        
        try {
            $originalStatus = $order->status_beo;
            
            $attachment->deleteFile('file_name');
            $attachment->delete();

            // Update order status and send notification if needed
            if ($originalStatus == 2) {
                $order->update(['status_beo' => 3]);
                
                $currentUser = auth()->user();
                if ($currentUser) {
                    $this->notificationService->notifyOrderNeedsReview(
                        $order, 
                        $currentUser, 
                        ['Attachment deleted']
                    );
                    
                    Log::info('Order needs review notification sent for attachment deletion', [
                        'order_id' => $order->id,
                        'attachment_id' => $attachment->id
                    ]);
                }
            }

            return back()->with('flash', ['message' => 'Attachment deleted successfully.']);

        } catch (\Exception $e) {
            Log::error('Error deleting attachment: ' . $e->getMessage());
            
            return back()->withErrors(['error' => 'Failed to delete attachment. Please try again.']);
        }
    }
}