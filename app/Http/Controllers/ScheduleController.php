<?php

namespace App\Http\Controllers;

use App\Http\Requests\ScheduleRequest;
use App\Models\Order;
use App\Models\Schedule;
use App\Services\OrderNotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    protected $notificationService;

    public function __construct(OrderNotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function create(Order $order): Response
    {
        return Inertia::render('sales/orders/schedules/create', [
            'order' => $order->only(['id', 'event_name', 'custom_code', 'start_date', 'end_date']),
        ]);
    }

    public function store(ScheduleRequest $request, Order $order): RedirectResponse
    {
        try {
            $validated = $request->validated();
            $originalStatus = $order->status_beo;
            
            $order->schedules()->createMany($validated['schedules']);

            // Update order status and send notification if needed
            if ($originalStatus == 2) {
                $order->update(['status_beo' => 3]);
                
                $currentUser = auth()->user();
                if ($currentUser) {
                    $this->notificationService->notifyOrderNeedsReview(
                        $order, 
                        $currentUser, 
                        ['Schedules added']
                    );
                    
                    Log::info('Order needs review notification sent for schedule creation', [
                        'order_id' => $order->id,
                        'schedules_added' => count($validated['schedules'])
                    ]);
                }
            }

            return redirect()
                ->route('sales.orders.show', $order->id)
                ->with('flash', ['message' => 'Schedules added successfully.']);
                
        } catch (\Exception $e) {
            Log::error('Error creating schedules: ' . $e->getMessage());
            
            return redirect()
                ->back()
                ->withInput()
                ->withErrors(['error' => 'Failed to create schedules. Please try again.']);
        }
    }

    public function edit(Order $order): Response
    {
        $order->load('schedules');

        return Inertia::render('sales/orders/schedules/edit', [
            'order' => $order->only(['id', 'event_name', 'custom_code', 'start_date', 'end_date']),
            'schedules' => $order->schedules->map(function ($schedule) {
                return [
                    'id' => $schedule->id,
                    // Send dates as simple YYYY-MM-DD format
                    'start_date' => $schedule->start_date instanceof \Carbon\Carbon
                        ? $schedule->start_date->format('Y-m-d')
                        : $schedule->start_date,
                    'end_date' => $schedule->end_date instanceof \Carbon\Carbon
                        ? $schedule->end_date->format('Y-m-d')
                        : $schedule->end_date,
                    // Send times as HH:mm format
                    'time_start' => $schedule->time_start instanceof \Carbon\Carbon
                        ? $schedule->time_start->format('H:i')
                        : ($schedule->time_start ? substr($schedule->time_start, 0, 5) : ''),
                    'time_end' => $schedule->time_end instanceof \Carbon\Carbon
                        ? $schedule->time_end->format('H:i')
                        : ($schedule->time_end ? substr($schedule->time_end, 0, 5) : ''),
                    'function' => $schedule->function,
                    'people' => $schedule->people,
                ];
            }),
        ]);
    }

    public function update(ScheduleRequest $request, Order $order): RedirectResponse
    {
        $validated = $request->validated();
        $originalStatus = $order->status_beo;
        
        try {
            // Store existing schedules for change detection
            $existingSchedules = $order->schedules()->get()->toArray();
            
            // Use database transaction to ensure data integrity
            DB::transaction(function () use ($order, $validated) {
                // Delete existing schedules
                $order->schedules()->delete();
                
                // Create new schedules
                $order->schedules()->createMany($validated['schedules']);
            });

            // Update order status and send notification if needed
            if ($originalStatus == 2) {
                $order->update(['status_beo' => 3]);
                
                $currentUser = auth()->user();
                if ($currentUser) {
                    // Determine what changed
                    $changedFields = $this->getScheduleChanges($existingSchedules, $validated['schedules']);
                    
                    $this->notificationService->notifyOrderNeedsReview(
                        $order, 
                        $currentUser, 
                        $changedFields
                    );
                    
                    Log::info('Order needs review notification sent for schedule update', [
                        'order_id' => $order->id,
                        'changes' => $changedFields
                    ]);
                }
            }

            return redirect()
                ->route('sales.orders.show', $order->id)
                ->with('flash', ['message' => 'Schedules updated successfully.']);

        } catch (\Exception $e) {
            Log::error('Schedule update failed: ' . $e->getMessage());

            return back()
                ->withErrors(['error' => 'Failed to update schedules. Please try again.'])
                ->withInput();
        }
    }

    public function destroy(Order $order, Schedule $schedule): RedirectResponse
    {
        abort_if($schedule->order_id !== $order->id, 404);
        $originalStatus = $order->status_beo;

        try {
            $schedule->delete();

            // Update order status and send notification if needed
            if ($originalStatus == 2) {
                $order->update(['status_beo' => 3]);
                
                $currentUser = auth()->user();
                if ($currentUser) {
                    $this->notificationService->notifyOrderNeedsReview(
                        $order, 
                        $currentUser, 
                        ['Schedule deleted']
                    );
                    
                    Log::info('Order needs review notification sent for schedule deletion', [
                        'order_id' => $order->id,
                        'schedule_id' => $schedule->id
                    ]);
                }
            }

            return back()->with('flash', ['message' => 'Schedule deleted successfully.']);

        } catch (\Exception $e) {
            Log::error('Schedule deletion failed: ' . $e->getMessage());

            return back()->withErrors(['error' => 'Failed to delete schedule. Please try again.']);
        }
    }

    /**
     * Compare existing schedules with new schedules to determine changes
     */
    private function getScheduleChanges(array $existingSchedules, array $newSchedules): array
    {
        $changes = [];
        
        $existingCount = count($existingSchedules);
        $newCount = count($newSchedules);
        
        if ($existingCount != $newCount) {
            if ($newCount > $existingCount) {
                $diff = $newCount - $existingCount;
                $changes[] = "{$diff} schedule(s) added";
            } else {
                $diff = $existingCount - $newCount;
                $changes[] = "{$diff} schedule(s) removed";
            }
        }
        
        // Check for modifications (simplified - could be more detailed)
        $minCount = min($existingCount, $newCount);
        $modifiedCount = 0;
        
        for ($i = 0; $i < $minCount; $i++) {
            if (isset($existingSchedules[$i]) && isset($newSchedules[$i])) {
                // Compare relevant fields (excluding id, timestamps)
                $existing = array_intersect_key($existingSchedules[$i], array_flip([
                    'start_date', 'end_date', 'time_start', 'time_end', 'function', 'people'
                ]));
                
                $new = array_intersect_key($newSchedules[$i], array_flip([
                    'start_date', 'end_date', 'time_start', 'time_end', 'function', 'people'
                ]));
                
                if ($existing != $new) {
                    $modifiedCount++;
                }
            }
        }
        
        if ($modifiedCount > 0) {
            $changes[] = "{$modifiedCount} schedule(s) modified";
        }
        
        // If no specific changes detected but method was called, add generic message
        if (empty($changes)) {
            $changes[] = "Schedules updated";
        }
        
        return $changes;
    }
}