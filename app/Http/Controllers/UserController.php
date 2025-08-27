<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Department;
use App\Http\Requests\UserRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with(['department', 'roles'])
                    ->whereDoesntHave('roles', function ($q) {
                        $q->where('name', 'admin');
                    });

        // Search functionality
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('username', 'like', "%{$search}%")
                  ->orWhereHas('department', function ($dept) use ($search) {
                      $dept->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $users = $query->orderBy('created_at', 'desc')
                      ->paginate(10)
                      ->withQueryString();

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'filters' => $request->only(['search'])
        ]);
    }

    public function create(): Response
    {
        $departments = Department::orderBy('name')->get();
        $roles = Role::where('name', '!=', 'admin')->orderBy('name')->get();

        return Inertia::render('admin/users/create', [
            'departments' => $departments,
            'roles' => $roles
        ]);
    }

    public function store(UserRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        // Hash the password
        $validated['password'] = Hash::make($validated['password']);

        // Remove role from validated data as it's handled separately
        $role = $validated['role'];
        unset($validated['role']);

        // Create the user
        $user = User::create($validated);

        // Assign the role to the user
        $user->assignRole($role);

        return redirect()->route('admin.users.index')
            ->with('message', 'User created successfully.');
    }

    public function show(User $user): Response
    {
        $user->load(['department', 'roles']);

        return Inertia::render('admin/users/show', [
            'user' => $user
        ]);
    }

    public function edit(User $user): Response
    {
        $user->load(['department', 'roles']);
        $departments = Department::orderBy('name')->get();
        
        // For edit, we need to handle admin role differently
        // If the user being edited is an admin, include admin role
        // Otherwise, exclude it
        if ($user->hasRole('admin')) {
            $roles = Role::orderBy('name')->get();
        } else {
            $roles = Role::where('name', '!=', 'admin')->orderBy('name')->get();
        }

        return Inertia::render('admin/users/edit', [
            'user' => $user,
            'departments' => $departments,
            'roles' => $roles
        ]);
    }

    public function update(UserRequest $request, User $user): RedirectResponse
    {
        $validated = $request->validated();

        // Handle password update
        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        // Handle role update
        $role = $validated['role'];
        unset($validated['role']);

        // Update user data
        $user->update($validated);

        // Update role if changed
        if ($user->roles->first()?->name !== $role) {
            $user->syncRoles([$role]);
        }

        return redirect()->route('admin.users.show', $user)
            ->with('message', 'User updated successfully.');
    }

    public function destroy(User $user): RedirectResponse
    {
        // Prevent deleting the current authenticated user
        if (auth()->id() === $user->id) {
            return redirect()->route('admin.users.index')
                ->with('error', 'You cannot delete your own account.');
        }

        // Prevent deleting admin users
        if ($user->hasRole('admin')) {
            return redirect()->route('admin.users.index')
                ->with('error', 'Admin users cannot be deleted.');
        }

        // Remove all roles before deleting
        $user->roles()->detach();

        $user->delete();

        return redirect()->route('admin.users.index')
            ->with('message', 'User deleted successfully.');
    }

    public function toggleStatus(User $user): RedirectResponse
    {
        // Prevent deactivating the current authenticated user
        if (auth()->id() === $user->id) {
            return redirect()->back()
                ->with('error', 'You cannot deactivate your own account.');
        }

        // Prevent deactivating admin users
        if ($user->hasRole('admin')) {
            return redirect()->back()
                ->with('error', 'Admin users cannot be deactivated.');
        }

        $user->update(['is_active' => !$user->is_active]);

        return redirect()->back()
            ->with('message', 'User status updated successfully.');
    }

    public function byDepartment(Department $department)
    {
        $users = $department->users()
                           ->with('roles')
                           ->whereDoesntHave('roles', function ($q) {
                               $q->where('name', 'admin');
                           })
                           ->get();

        return response()->json($users);
    }

    public function byRole(Role $role)
    {
        // If requesting admin role, return empty collection
        if ($role->name === 'admin') {
            return response()->json([]);
        }

        $users = User::role($role->name)->with(['department', 'roles'])->get();

        return response()->json($users);
    }

    public function resetPassword(Request $request, User $user): RedirectResponse
{
    $request->validate([
        'password' => 'required|min:8|confirmed',
    ]);

    $user->update([
        'password' => Hash::make($request->password)
    ]);

    return redirect()->back()
        ->with('message', 'Password reset successfully.');
}
}