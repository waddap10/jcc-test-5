<?php

namespace App\Http\Controllers;

use App\Http\Requests\BeoRequest;
use App\Models\Order;
use App\Models\Beo;
use App\Models\BeoAttachment;
use App\Models\Department;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class BeoController extends Controller
{
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

            // Update order status if needed
            if ($order->status_beo == 2) {
                $order->update(['status_beo' => 3]);
            }

            return redirect()
                ->route('sales.orders.show', $order->id)
                ->with('flash', ['message' => 'BEOs created successfully.']);

        } catch (\Exception $e) {
            //\Log::error('Error creating BEOs: ' . $e->getMessage());

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
                    $beo->update([
                        'department_id' => $beoData['department_id'] ?: null,
                        'package_id' => $beoData['package_id'] ?: null,
                        'user_id' => $beoData['user_id'] ?: null,
                        'notes' => $beoData['notes'] ?? '',
                    ]);
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
        }
        
        // Handle attachment deletions
        if ($request->has('delete_attachments')) {
            foreach ($request->get('delete_attachments') as $attachmentId) {
                if (is_numeric($attachmentId)) {
                    $attachment = BeoAttachment::find($attachmentId);
                    if ($attachment && $attachment->beo && $attachment->beo->order_id == $order->id) {
                        $attachment->deleteFile('file_name');
                        $attachment->delete();
                    }
                }
            }
        }

        if ($order->status_beo == 2) {
            $order->update(['status_beo' => 3]);
        }
        
        return redirect()
            ->route('sales.orders.show', $order->id)
            ->with('flash', ['message' => 'BEOs updated successfully.']);
            
    } catch (\Exception $e) {
        /* \Log::error('Error updating BEOs: ' . $e->getMessage(), [
            'order_id' => $order->id,
            'request_data' => $request->all(),
            'exception' => $e
        ]); */
        
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
            // Delete attachment files
            foreach ($beo->attachments as $attachment) {
                $attachment->deleteFile('file_name');
                $attachment->delete();
            }

            $beo->delete();

            return redirect()
                ->route('sales.orders.show', $order->id)
                ->with('flash', ['message' => 'BEO deleted successfully.']);

        } catch (\Exception $e) {
            //\Log::error('Error deleting BEO: ' . $e->getMessage());

            return redirect()
                ->back()
                ->withErrors(['error' => 'Failed to delete BEO. Please try again.']);
        }
    }
}