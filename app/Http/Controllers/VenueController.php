<?php

namespace App\Http\Controllers;

use App\Models\Venue;
use App\Http\Requests\VenueRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class VenueController extends Controller
{
    public function index(Request $request): Response
{
    $query = Venue::query();

    // Search functionality
    if ($request->has('search') && !empty($request->search)) {
        $search = $request->search;
        $query->where(function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%")
              ->orWhere('short', 'like', "%{$search}%")
              ->orWhere('description', 'like', "%{$search}%");
        });
    }

    $venues = $query->orderBy('created_at', 'desc')
                   ->paginate(15)
                   ->withQueryString();

    return Inertia::render('admin/venues/index', [
        'venues' => $venues,
        'filters' => $request->only(['search'])
    ]);
}

    public function create(): Response
    {
        return Inertia::render('admin/venues/create');
    }

    public function store(VenueRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        // Handle file uploads
        if ($request->hasFile('photo')) {
            $validated['photo'] = $request->file('photo')->store('venues/photos', 'public');
        }

        if ($request->hasFile('floor_plan')) {
            $validated['floor_plan'] = $request->file('floor_plan')->store('venues/floor-plans', 'public');
        }

        Venue::create($validated);

        return redirect()->route('admin.venues.index')
            ->with('message', 'Venue created successfully.');
    }

    public function show(Venue $venue): Response
    {
        return Inertia::render('admin/venues/show', [
            'venue' => $venue
        ]);
    }

    public function edit(Venue $venue): Response
    {
        return Inertia::render('admin/venues/edit', [
            'venue' => $venue
        ]);
    }

    public function update(VenueRequest $request, Venue $venue): RedirectResponse
    {
        $validated = $request->validated();

        // Handle photo upload
        if ($request->hasFile('photo')) {
            // Delete old photo if exists
            if ($venue->photo) {
                Storage::disk('public')->delete($venue->photo);
            }
            $validated['photo'] = $request->file('photo')->store('venues/photos', 'public');
        }

        // Handle floor plan upload
        if ($request->hasFile('floor_plan')) {
            // Delete old floor plan if exists
            if ($venue->floor_plan) {
                Storage::disk('public')->delete($venue->floor_plan);
            }
            $validated['floor_plan'] = $request->file('floor_plan')->store('venues/floor-plans', 'public');
        }

        $venue->update($validated);

        return redirect()->route('admin.venues.show', $venue)
            ->with('message', 'Venue updated successfully.');
    }

    public function destroy(Venue $venue): RedirectResponse
    {
        // Delete associated files
        if ($venue->photo) {
            Storage::disk('public')->delete($venue->photo);
        }
        if ($venue->floor_plan) {
            Storage::disk('public')->delete($venue->floor_plan);
        }

        $venue->delete();

        return redirect()->route('admin.venues.index')
            ->with('message', 'Venue deleted successfully.');
    }
}
