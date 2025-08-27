<?php
namespace App\Http\Controllers;

use App\Http\Requests\ScheduleRequest;
use App\Models\Order;
use App\Models\Schedule;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    public function create(Order $order): Response
    {
        return Inertia::render('sales/orders/schedules/create', [
            'order' => $order->only(['id', 'event_name', 'custom_code', 'start_date', 'end_date']),
        ]);
    }

    public function store(ScheduleRequest $request, Order $order): RedirectResponse
    {
        $validated = $request->validated();
        $order->schedules()->createMany($validated['schedules']);
        
        return redirect()
            ->route('sales.orders.show', $order->id)
            ->with('flash', ['message' => 'Schedules added successfully.']);
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
        
        try {
            // Use database transaction to ensure data integrity
            \DB::transaction(function () use ($order, $validated) {
                // Delete existing schedules
                $order->schedules()->delete();
                
                // Create new schedules
                $order->schedules()->createMany($validated['schedules']);
            });
            
            return redirect()
                ->route('sales.orders.show', $order->id)
                ->with('flash', ['message' => 'Schedules updated successfully.']);
                
        } catch (\Exception $e) {
            \Log::error('Schedule update failed: ' . $e->getMessage());
            
            return back()
                ->withErrors(['error' => 'Failed to update schedules. Please try again.'])
                ->withInput();
        }
    }

    public function destroy(Order $order, Schedule $schedule): RedirectResponse
    {
        abort_if($schedule->order_id !== $order->id, 404);
        
        try {
            $schedule->delete();
            
            return back()->with('flash', ['message' => 'Schedule deleted successfully.']);
            
        } catch (\Exception $e) {
            \Log::error('Schedule deletion failed: ' . $e->getMessage());
            
            return back()->withErrors(['error' => 'Failed to delete schedule. Please try again.']);
        }
    }
}