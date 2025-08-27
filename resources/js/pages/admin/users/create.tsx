import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Users', href: '/users' },
    { title: 'Create', href: '/users/create' }
];

interface Department {
    id: number;
    name: string;
}

interface Role {
    id: number;
    name: string;
    display_name?: string;
}

interface PageProps {
    departments: Department[];
    roles: Role[];
}

export default function Create() {
    const { departments, roles } = usePage().props as unknown as PageProps;
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        username: '',
        password: '',
        password_confirmation: '',
        phone: '',
        department_id: '',
        role: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.users.store'), {
            onSuccess: () => reset()
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
            <Head title="Create User" />

            <div className="max-w-4xl mx-auto px-6 py-4">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Create New User</h1>
                    <p className="text-sm text-gray-600 mt-1">Add a new user account to the system</p>
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
                                        autoFocus
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                        Password *
                                    </label>
                                    <input
                                        type="password"
                                        id="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter password"
                                        required
                                        minLength={8}
                                    />
                                    {errors.password && (
                                        <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirm Password *
                                    </label>
                                    <input
                                        type="password"
                                        id="password_confirmation"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Confirm password"
                                        required
                                        minLength={8}
                                    />
                                    {errors.password_confirmation && (
                                        <p className="mt-1 text-xs text-red-600">{errors.password_confirmation}</p>
                                    )}
                                </div>
                            </div>
                            
                            <p className="text-xs text-gray-500">
                                Password must be at least 8 characters long and contain a mix of letters, numbers, and symbols.
                            </p>
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
                            <p className="text-sm text-gray-600">Optionally assign the user to a department (can be changed later)</p>
                            
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
                                    Users can work without being assigned to a department
                                </p>
                            </div>
                        </div>

                        {/* Security Notice */}
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-amber-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h4 className="text-sm font-medium text-amber-800">Security Guidelines</h4>
                                    <div className="mt-1 text-sm text-amber-700">
                                        <ul className="list-disc list-inside space-y-1">
                                            <li>Choose a strong, unique password for the user</li>
                                            <li>Assign the appropriate role based on job responsibilities</li>
                                            <li>The user should change their password on first login</li>
                                            <li>Review and update user permissions regularly</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                            <Link href={route('admin.users.index')}>
                                <Button variant="outline" type="button">
                                    Cancel
                                </Button>
                            </Link>
                            <Button 
                                type="submit" 
                                disabled={processing || !data.name.trim() || !data.username.trim() || !data.password.trim() || !data.role}
                            >
                                {processing ? 'Creating...' : 'Create User'}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Quick Info */}
                <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">After Creating the User</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                            <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span>User can log in immediately</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span>Send login credentials securely</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span>Modify roles and permissions as needed</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span>Update department assignment later</span>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}