<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class EventController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Event::query();

        // Search functionality
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('event_type', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        $events = $query->orderBy('created_at', 'desc')
                       ->paginate(10)
                       ->withQueryString();

        return Inertia::render('admin/events/index', [
            'events' => $events,
            'filters' => $request->only(['search'])
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('admin/events/create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'event_type' => [
                'required',
                'string',
                'max:50',
                Rule::unique('events', 'event_type')->whereNull('deleted_at')
            ],
            'code' => [
                'required',
                'string',
                'max:10',
                'regex:/^[A-Z0-9]+$/', // Only uppercase letters and numbers
            ]
        ], [
            'event_type.required' => 'Event type is required.',
            'event_type.unique' => 'This event type already exists.',
            'event_type.max' => 'Event type cannot exceed 50 characters.',
            'code.required' => 'Event code is required.',
            'code.max' => 'Event code cannot exceed 10 characters.',
            'code.regex' => 'Event code must contain only uppercase letters and numbers.',
        ]);

        Event::create($validated);

        return redirect()
            ->route('admin.events.index')
            ->with('success', 'Event created successfully.');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Event $event)
    {
        return Inertia::render('admin/events/edit', [
            'event' => $event
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Event $event)
    {
        $validated = $request->validate([
            'event_type' => [
                'required',
                'string',
                'max:50',
                Rule::unique('events', 'event_type')
                    ->ignore($event->id)
                    ->whereNull('deleted_at')
            ],
            'code' => [
                'required',
                'string',
                'max:10',
                'regex:/^[A-Z0-9]+$/', // Only uppercase letters and numbers
            ]
        ], [
            'event_type.required' => 'Event type is required.',
            'event_type.unique' => 'This event type already exists.',
            'event_type.max' => 'Event type cannot exceed 50 characters.',
            'code.required' => 'Event code is required.',
            'code.max' => 'Event code cannot exceed 10 characters.',
            'code.regex' => 'Event code must contain only uppercase letters and numbers.',
        ]);

        $event->update($validated);

        return redirect()
            ->route('admin.events.index')
            ->with('success', 'Event updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Event $event)
    {
        // Check if event has related orders
        if ($event->orders()->count() > 0) {
            return redirect()
                ->route('events.index')
                ->with('error', 'Cannot delete event that has related orders.');
        }

        $event->delete();

        return redirect()
            ->route('admin.events.index')
            ->with('success', 'Event deleted successfully.');
    }

    /**
     * Restore the specified soft deleted resource.
     */
    public function restore($id)
    {
        $event = Event::withTrashed()->findOrFail($id);
        $event->restore();

        return redirect()
            ->route('admin.events.index')
            ->with('success', 'Event restored successfully.');
    }

    /**
     * Permanently delete the specified resource.
     */
    public function forceDelete($id)
    {
        $event = Event::withTrashed()->findOrFail($id);
        
        // Check if event has related orders
        if ($event->orders()->count() > 0) {
            return redirect()
                ->route('admin.events.index')
                ->with('error', 'Cannot permanently delete event that has related orders.');
        }

        $event->forceDelete();

        return redirect()
            ->route('admin.events.index')
            ->with('success', 'Event permanently deleted.');
    }
}