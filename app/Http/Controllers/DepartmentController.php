<?php

namespace App\Http\Controllers;

use App\Http\Requests\DepartmentRequest;
use App\Models\Department;

use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DepartmentController extends Controller
{
    public function index(): Response
    {
        $departments = Department::withCount('users')
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('admin/departments/index', [
            'departments' => $departments
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/departments/create');
    }

    public function store(DepartmentRequest $request): RedirectResponse
    {
        Department::create($request->validated());

        return redirect()->route('admin.departments.index')
            ->with('message', 'Department created successfully.');
    }

    public function show(Department $department): Response
    {
        $department->load(['users.roles']);

        return Inertia::render('admin/departments/show', [
            'department' => $department
        ]);
    }

    public function edit(Department $department): Response
    {
        $department->loadCount('users');

        return Inertia::render('admin/departments/edit', [
            'department' => $department
        ]);
    }

    public function update(DepartmentRequest $request, Department $department): RedirectResponse
    {
        $department->update($request->validated());

        return redirect()->route('admin.departments.show', $department)
            ->with('message', 'Department updated successfully.');
    }

    public function destroy(Department $department): RedirectResponse
    {
        // Check if department has users
        if ($department->users()->count() > 0) {
            return redirect()->route('admin.departments.index')
                ->with('error', 'Cannot delete department with existing users. Please reassign users first.');
        }

        $department->delete();

        return redirect()->route('admin.departments.index')
            ->with('message', 'Department deleted successfully.');
    }
    public function users(Department $department): Response
    {
        $users = $department->users()
            ->with('roles')
            ->paginate(15);

        return Inertia::render('admin.departments/users', [
            'department' => $department,
            'users' => $users
        ]);
    }
}