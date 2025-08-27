<?php

namespace App\Http\Controllers;

use App\Models\Package;
use App\Models\Department;
use App\Http\Requests\PackageRequest;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PackageController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Package::with('department');

        // Search functionality
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('department', function ($dept) use ($search) {
                        $dept->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $packages = $query->orderBy('created_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/packages/index', [
            'packages' => $packages,
            'filters' => $request->only(['search'])
        ]);
    }

    public function create(): Response
    {
        $departments = Department::orderBy('name')->get();

        return Inertia::render('admin/packages/create', [
            'departments' => $departments
        ]);
    }

    public function store(PackageRequest $request): RedirectResponse
    {
        Package::create($request->validated());

        return redirect()->route('admin.packages.index')
            ->with('message', 'Package created successfully.');
    }

    public function show(Package $package): Response
    {
        $package->load('department');

        return Inertia::render('admin/packages/show', [
            'package' => $package
        ]);
    }

    public function edit(Package $package): Response
    {
        $package->load('department');
        $departments = Department::orderBy('name')->get();

        return Inertia::render('admin/packages/edit', [
            'package' => $package,
            'departments' => $departments
        ]);
    }

    public function update(PackageRequest $request, Package $package): RedirectResponse
    {
        $package->update($request->validated());

        return redirect()->route('admin.packages.show', $package)
            ->with('message', 'Package updated successfully.');
    }

    public function destroy(Package $package): RedirectResponse
    {
        $package->delete();

        return redirect()->route('admin.packages.index')
            ->with('message', 'Package deleted successfully.');
    }

    // API Methods
    public function apiIndex(Request $request)
    {
        $query = Package::with('department');

        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%')
                ->orWhere('description', 'like', '%' . $request->search . '%');
        }

        if ($request->has('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        return response()->json($query->get());
    }

    public function apiShow(Package $package)
    {
        $package->load('department');
        return response()->json($package);
    }

    public function search(string $query)
    {
        $packages = Package::with('department')
            ->where('name', 'like', '%' . $query . '%')
            ->orWhere('description', 'like', '%' . $query . '%')
            ->get();

        return response()->json($packages);
    }

    public function byDepartment(Department $department)
    {
        $packages = $department->packages()->get();
        return response()->json($packages);
    }
}