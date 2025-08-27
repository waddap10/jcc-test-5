import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

interface Department {
    id: number;
    name: string;
    users_count: number;
    created_at: string;
    updated_at: string;
}

interface PageProps {
    department: Department;
}

export default function Edit() {
    const { department } = usePage().props as unknown as PageProps;
    
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Departments', href: '/departments' },
        { title: department.name, href: `/departments/${department.id}` },
        { title: 'Edit', href: `/departments/${department.id}/edit` }
    ];

    const { data, setData, patch, processing, errors } = useForm({
        name: department.name || ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('admin.departments.update', department.id));
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${department.name}`} />

            <div className="max-w-2xl mx-auto px-6 py-4">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Edit Department</h1>
                    <p className="text-sm text-gray-600 mt-1">Update department information</p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">Department Information</h3>
                            
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                    Department Name *
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                                    placeholder="Enter department name"
                                    required
                                    autoFocus
                                />
                                {errors.name && (
                                    <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                                )}
                                <p className="mt-2 text-sm text-gray-500">
                                    Choose a clear, descriptive name for the department
                                </p>
                            </div>
                        </div>

                        {/* Department Statistics */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-800 mb-3">Department Statistics</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Total Users</p>
                                    <p className="text-lg font-semibold text-gray-900">{department.users_count}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Created</p>
                                    <p className="text-sm text-gray-900">{formatDate(department.created_at)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Last Updated</p>
                                    <p className="text-sm text-gray-900">{formatDate(department.updated_at)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Status</p>
                                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                        department.users_count > 0 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {department.users_count > 0 ? 'Active' : 'Empty'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Information Card */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h4 className="text-sm font-medium text-blue-800">Important Notes</h4>
                                    <div className="mt-1 text-sm text-blue-700">
                                        <ul className="list-disc list-inside space-y-1">
                                            <li>Changing the department name will update it for all assigned users</li>
                                            <li>The department name must be unique across the system</li>
                                            <li>Users will continue to have access to their current permissions</li>
                                            {department.users_count > 0 && (
                                                <li>This department currently has {department.users_count} assigned {department.users_count === 1 ? 'user' : 'users'}</li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        {department.users_count > 0 && (
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h4 className="text-sm font-medium text-gray-800 mb-3">Quick Actions</h4>
                                <div className="flex flex-wrap gap-2">
                                    <Link href={route('admin.departments.users', department.id)}>
                                        <Button variant="outline" size="sm">
                                            View Users ({department.users_count})
                                        </Button>
                                    </Link>
                                    <Link href={route('admin.users.index', { department_id: department.id })}>
                                        <Button variant="outline" size="sm">
                                            Manage Users
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Examples */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-800 mb-2">Common Department Examples:</h4>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    'Human Resources', 'Marketing', 'Information Technology', 'Finance', 
                                    'Operations', 'Sales', 'Customer Service', 'Research & Development',
                                    'Legal', 'Administration'
                                ].map((example) => (
                                    <button
                                        key={example}
                                        type="button"
                                        onClick={() => setData('name', example)}
                                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                                            data.name === example
                                                ? 'bg-blue-100 text-blue-800 border-blue-300'
                                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    >
                                        {example}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Warning for departments with users */}
                        {department.users_count > 0 && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-amber-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h4 className="text-sm font-medium text-amber-800">Department Has Users</h4>
                                        <p className="mt-1 text-sm text-amber-700">
                                            This department currently has {department.users_count} assigned {department.users_count === 1 ? 'user' : 'users'}. 
                                            Renaming this department will update the department name for all these users.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                            <Link href={route('admin.departments.show', department.id)}>
                                <Button variant="outline" type="button">
                                    Cancel
                                </Button>
                            </Link>
                            <Button type="submit" disabled={processing || !data.name.trim()}>
                                {processing ? 'Updating...' : 'Update Department'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}