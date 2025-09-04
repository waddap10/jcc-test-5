<?php

namespace App\Http\Controllers;

use App\Http\Requests\BeoRequest;
use App\Models\Order;
use App\Models\Beo;
use App\Models\BeoAttachment;
use App\Models\Department;
use App\Services\OrderNotificationService; // Add this import
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BeoController extends Controller
{
    protected $notificationService;

    // Inject the notification service
    public function __construct(OrderNotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function create(Order $order): Response
    {
        $departments = Department::with([
            'users:id,name,department_id',
            'packages:id,name,description,department_id'
        ])->get(['id', 'name']);

        return Inertia::render('sales/orders/beos/create', [
            'order' => $order->only(['id', 'event_name', 'custom_code']),
            'departments' => $departments,
        ]);
    }

    public function store(BeoRequest $request, Order $order): RedirectResponse
    {
        try {
            $validated = $request->validated();
            $originalStatus = $order->status_beo; // Store original status

            foreach ($validated['beos'] as $index => $beoData) {
                // Create the BEO record
                $beo = $order->beos()->create([
                    'department_id' => $beoData['department_id'],
                    'package_id' => $beoData['package_id'] ?? null,
                    'user_id' => $beoData['user_id'] ?? null,
                    'notes' => $beoData['notes'] ?? '',
                ]);

                // Handle file attachments for this BEO
                if ($request->hasFile("attachments.{$index}")) {
                    $files = $request->file("attachments.{$index}");

                    foreach ($files as $file) {
                        if ($file->isValid()) {
                            $attachment = $beo->attachments()->create([
                                'file_name' => $file->getClientOriginalName(),
                            ]);

                            // Store the file using your HasFileStorage trait
                            $attachment->storeAttachment($file);
                        }
                    }
                }
            }

            // Update order status if needed and send notification
            if ($originalStatus == 2) {
                $order->update(['status_beo' => 3]);
                
                // Send notification for status change from approved to needs review
                $currentUser = auth()->user();
                if ($currentUser) {
                    $this->notificationService->notifyOrderNeedsReview(
                        $order, 
                        $currentUser, 
                        ['BEOs created'] // Changed fields
                    );
                }
            }

            return redirect()
                ->route('sales.orders.show', $order->id)
                ->with('flash', ['message' => 'BEOs created successfully.']);

        } catch (\Exception $e) {
            Log::error('Error creating BEOs: ' . $e->getMessage());

            return redirect()
                ->back()
                ->withInput()
                ->withErrors(['error' => 'Failed to create BEOs. Please try again.']);
        }
    }

    public function edit(Order $order): Response
    {
        $departments = Department::with([
            'users:id,name,department_id',
            'packages:id,name,description,department_id'
        ])->get(['id', 'name']);

        $beos = $order->beos()->with([
            'department:id,name',
            'user:id,name',
            'package:id,name',
            'attachments:id,beo_id,file_name'
        ])->get();

        return Inertia::render('sales/orders/beos/edit', [
            'order' => $order->only(['id', 'event_name', 'custom_code']),
            'departments' => $departments,
            'beos' => $beos,
        ]);
    }

    public function update(BeoRequest $request, Order $order): RedirectResponse
    {
        try {
            $validated = $request->validated();
            $originalStatus = $order->status_beo; // Store original status
            $changedFields = []; // Track what changed
            
            // Get all current BEO IDs for this order
            $existingBeoIds = $order->beos()->pluck('id')->toArray();
            $submittedBeoIds = [];
            
            foreach ($validated['beos'] as $index => $beoData) {
                // If ID exists and is not empty, update existing BEO
                if (!empty($beoData['id']) && is_numeric($beoData['id'])) {
                    $beoId = (int) $beoData['id'];
                    $submittedBeoIds[] = $beoId;
                    
                    $beo = $order->beos()->where('id', $beoId)->first();
                    if ($beo) {
                        // Track changes
                        $originalBeoData = $beo->only(['department_id', 'package_id', 'user_id', 'notes']);
                        
                        $beo->update([
                            'department_id' => $beoData['department_id'] ?: null,
                            'package_id' => $beoData['package_id'] ?: null,
                            'user_id' => $beoData['user_id'] ?: null,
                            'notes' => $beoData['notes'] ?? '',
                        ]);

                        // Check what changed
                        $newBeoData = $beo->fresh()->only(['department_id', 'package_id', 'user_id', 'notes']);
                        if ($originalBeoData != $newBeoData) {
                            $changedFields[] = "BEO #{$beoId} updated";
                        }
                    }
                } else {
                    // Create new BEO if no valid ID
                    $beo = $order->beos()->create([
                        'department_id' => $beoData['department_id'] ?: null,
                        'package_id' => $beoData['package_id'] ?: null,
                        'user_id' => $beoData['user_id'] ?: null,
                        'notes' => $beoData['notes'] ?? '',
                    ]);
                    $submittedBeoIds[] = $beo->id;
                    $changedFields[] = "New BEO created";
                }
                
                // Handle new file attachments for this BEO
                if ($request->hasFile("new_attachments.{$index}")) {
                    $files = $request->file("new_attachments.{$index}");
                    foreach ($files as $file) {
                        if ($file->isValid()) {
                            $attachment = $beo->attachments()->create([
                                'file_name' => $file->getClientOriginalName(),
                            ]);
                            $attachment->storeAttachment($file);
                            $changedFields[] = "New attachment added";
                        }
                    }
                }
            }
            
            // Delete BEOs that were removed from the form
            $beosToDelete = array_diff($existingBeoIds, $submittedBeoIds);
            if (!empty($beosToDelete)) {
                $order->beos()->whereIn('id', $beosToDelete)->each(function($beo) {
                    // Delete attachments first
                    $beo->attachments->each(function($attachment) {
                        $attachment->deleteFile('file_name');
                        $attachment->delete();
                    });
                    $beo->delete();
                });
                $changedFields[] = count($beosToDelete) . " BEO(s) deleted";
            }
            
            // Handle attachment deletions
            if ($request->has('delete_attachments')) {
                $deletedCount = 0;
                foreach ($request->get('delete_attachments') as $attachmentId) {
                    if (is_numeric($attachmentId)) {
                        $attachment = BeoAttachment::find($attachmentId);
                        if ($attachment && $attachment->beo && $attachment->beo->order_id == $order->id) {
                            $attachment->deleteFile('file_name');
                            $attachment->delete();
                            $deletedCount++;
                        }
                    }
                }
                if ($deletedCount > 0) {
                    $changedFields[] = "{$deletedCount} attachment(s) deleted";
                }
            }

            // Update order status and send notification if needed
            if ($originalStatus == 2 && !empty($changedFields)) {
                $order->update(['status_beo' => 3]);
                
                // Send notification for status change from approved to needs review
                $currentUser = auth()->user();
                if ($currentUser) {
                    $this->notificationService->notifyOrderNeedsReview(
                        $order, 
                        $currentUser, 
                        $changedFields
                    );
                    
                    Log::info('Order needs review notification sent', [
                        'order_id' => $order->id,
                        'changed_fields' => $changedFields,
                        'status_changed_from' => $originalStatus,
                        'status_changed_to' => 3
                    ]);
                }
            }
            
            return redirect()
                ->route('sales.orders.show', $order->id)
                ->with('flash', ['message' => 'BEOs updated successfully.']);
                
        } catch (\Exception $e) {
            Log::error('Error updating BEOs: ' . $e->getMessage(), [
                'order_id' => $order->id,
                'request_data' => $request->all(),
                'exception' => $e
            ]);
            
            return redirect()
                ->back()
                ->withInput()
                ->withErrors(['error' => 'Failed to update BEOs. Please try again.']);
        }
    }

    // Helper method to handle individual BEO deletion if needed
    public function destroy(Order $order, Beo $beo): RedirectResponse
{
    try {
        Log::info('Starting BEO deletion', [
            'beo_id' => $beo->id,
            'order_id' => $order->id,
            'attachments_count' => $beo->attachments->count()
        ]);

        $originalStatus = $order->status_beo;
        
        // Delete attachment files and records
        foreach ($beo->attachments as $attachment) {
            Log::info('Deleting attachment', ['attachment_id' => $attachment->id]);
            
            // Delete the physical file first
            if ($attachment->file_name) {
                Storage::delete($attachment->file_name);
            }
            
            // Then delete the record
            $attachment->delete();
        }

        Log::info('About to delete BEO', ['beo_id' => $beo->id]);
        
        $deleteResult = $beo->delete();
        
        Log::info('BEO deletion completed', [
            'result' => $deleteResult,
            'deleted_at' => $beo->fresh()->deleted_at
        ]);

        // Update order status and send notification if needed
        if ($originalStatus == 2) {
            $order->update(['status_beo' => 3]);
           
            $currentUser = auth()->user();
            if ($currentUser) {
                $this->notificationService->notifyOrderNeedsReview(
                    $order,
                    $currentUser,
                    ['BEO deleted']
                );
            }
        }

        return redirect()
            ->route('sales.orders.show', $order->id)
            ->with('flash', ['message' => 'BEO deleted successfully.']);

    } catch (\Exception $e) {
        Log::error('Error deleting BEO', [
            'beo_id' => $beo->id,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        
        return redirect()
            ->back()
            ->withErrors(['error' => 'Failed to delete BEO: ' . $e->getMessage()]);
    }
}
}