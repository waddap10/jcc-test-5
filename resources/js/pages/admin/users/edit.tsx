import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

interface Department {
    id: number;
    name: string;
}

interface Role {
    id: number;
    name: string;
    display_name?: string;
}

interface User {
    id: number;
    name: string;
    username: string;
    phone?: string;
    department?: Department;
    roles: Role[];
    is_active?: boolean;
    created_at: string;
    updated_at: string;
}

interface PageProps {
    user: User;
    departments: Department[];
    roles: Role[];
}

export default function Edit() {
    const { user, departments, roles } = usePage().props as unknown as PageProps;
    
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Users', href: '/users' },
        { title: user.name, href: `/users/${user.id}` },
        { title: 'Edit', href: `/users/${user.id}/edit` }
    ];

    const { data, setData, patch, processing, errors } = useForm({
        name: user.name || '',
        username: user.username || '',
        phone: user.phone || '',
        department_id: user.department?.id?.toString() || '',
        role: user.roles[0]?.name || '',
        password: '',
        password_confirmation: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('admin.users.update', user.id));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getRoleDescription = (roleName: string) => {
        const descriptions = {
            'admin': 'Full system access with all permissions',
            'manager': 'Department management and user oversight',
            'staff': 'Standard user with limited administrative access',
            'user': 'Basic user access with minimal permissions'
        };
        return descriptions[roleName.toLowerCase()] || 'Standard system access';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${user.name}`} />

            <div className="max-w-4xl mx-auto px-6 py-4">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
                    <p className="text-sm text-gray-600 mt-1">Update user information and settings</p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Personal Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter full name"
                                        required
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter phone number"
                                    />
                                    {errors.phone && (
                                        <p className="mt-1 text-xs text-red-600">{errors.phone}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Account Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
                            
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                                    Username *
                                </label>
                                <input
                                    type="text"
                                    id="username"
                                    value={data.username}
                                    onChange={(e) => setData('username', e.target.value.toLowerCase())}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                                    placeholder="Enter username (lowercase, no spaces)"
                                    required
                                />
                                {errors.username && (
                                    <p className="mt-1 text-xs text-red-600">{errors.username}</p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">
                                    Must be unique. Only lowercase letters, numbers, and underscores allowed.
                                </p>
                            </div>
                        </div>

                        {/* Password Change (Optional) */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                            <p className="text-sm text-gray-600">Leave blank to keep current password</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        id="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter new password"
                                        minLength={8}
                                    />
                                    {errors.password && (
                                        <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirm New Password
                                    </label>
                                    <input
                                        type="password"
                                        id="password_confirmation"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Confirm new password"
                                        minLength={8}
                                    />
                                    {errors.password_confirmation && (
                                        <p className="mt-1 text-xs text-red-600">{errors.password_confirmation}</p>
                                    )}
                                </div>
                            </div>
                            
                            {data.password && (
                                <p className="text-xs text-gray-500">
                                    Password must be at least 8 characters long and contain a mix of letters, numbers, and symbols.
                                </p>
                            )}
                        </div>

                        {/* Role Assignment */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">Role Assignment *</h3>
                            <p className="text-sm text-gray-600">Select the user's role to determine their access level</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {roles.map((role) => (
                                    <div
                                        key={role.id}
                                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                                            data.role === role.name
                                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                                : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                        onClick={() => setData('role', role.name)}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="radio"
                                                id={`role-${role.id}`}
                                                name="role"
                                                value={role.name}
                                                checked={data.role === role.name}
                                                onChange={(e) => setData('role', e.target.value)}
                                                className="h-4 w-4 text-blue-600"
                                            />
                                            <div className="flex-1">
                                                <label htmlFor={`role-${role.id}`} className="block text-sm font-medium text-gray-900 cursor-pointer">
                                                    {role.display_name || role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                                                </label>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {getRoleDescription(role.name)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {errors.role && (
                                <p className="text-sm text-red-600">{errors.role}</p>
                            )}
                        </div>

                        {/* Department Assignment */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">Department Assignment</h3>
                            <p className="text-sm text-gray-600">Optionally assign the user to a department</p>
                            
                            <div>
                                <label htmlFor="department_id" className="block text-sm font-medium text-gray-700 mb-1">
                                    Department
                                </label>
                                <select
                                    id="department_id"
                                    value={data.department_id}
                                    onChange={(e) => setData('department_id', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Select a department (optional)</option>
                                    {departments.map((department) => (
                                        <option key={department.id} value={department.id}>
                                            {department.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.department_id && (
                                    <p className="mt-1 text-xs text-red-600">{errors.department_id}</p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">
                                    Current: {user.department?.name || 'No department assigned'}
                                </p>
                            </div>
                        </div>

                        {/* User Statistics */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-800 mb-3">User Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Account Status</p>
                                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                        user.is_active !== false 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {user.is_active !== false ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Created</p>
                                    <p className="text-sm text-gray-900">{formatDate(user.created_at)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Last Updated</p>
                                    <p className="text-sm text-gray-900">{formatDate(user.updated_at)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Current Role Info */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h4 className="text-sm font-medium text-blue-800">Current Role & Department</h4>
                                    <div className="mt-1 text-sm text-blue-700">
                                        <p>
                                            <strong>Role:</strong> {user.roles[0]?.name.charAt(0).toUpperCase() + user.roles[0]?.name.slice(1) || 'No role assigned'}
                                        </p>
                                        <p>
                                            <strong>Department:</strong> {user.department?.name || 'No department assigned'}
                                        </p>
                                        <p className="mt-2">
                                            Changing the role will update the user's permissions immediately. 
                                            Changing the department will move them to a new organizational unit.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                            <Link href={route('admin.users.index', user.id)}>
                                <Button variant="outline" type="button">
                                    Cancel
                                </Button>
                            </Link>
                            <Button 
                                type="submit" 
                                disabled={processing || !data.name.trim() || !data.username.trim() || !data.role}
                            >
                                {processing ? 'Updating...' : 'Update User'}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Quick Actions */}
                <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>
                    <div className="flex flex-wrap gap-2">
                        
                        <Link href={route('admin.users.toggle-status', user.id)} method="patch" as="button">
                            <Button variant="outline" size="sm">
                                {user.is_active !== false ? 'Deactivate User' : 'Activate User'}
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}