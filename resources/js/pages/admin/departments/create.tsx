import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Departments', href: '/departments' },
    { title: 'Create', href: '/departments/create' }
];

export default function Create() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.departments.store'), {
            onSuccess: () => reset()
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Department" />

            <div className="max-w-2xl mx-auto px-6 py-4">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Create New Department</h1>
                    <p className="text-sm text-gray-600 mt-1">Add a new department to organize your team structure</p>
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
                                    placeholder="Enter department name (e.g., Human Resources, Marketing, IT)"
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

                        {/* Information Card */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h4 className="text-sm font-medium text-blue-800">About Departments</h4>
                                    <div className="mt-1 text-sm text-blue-700">
                                        <ul className="list-disc list-inside space-y-1">
                                            <li>Departments help organize users into logical groups</li>
                                            <li>Users can be assigned to departments for better management</li>
                                            <li>Department names must be unique across the system</li>
                                            <li>You can view and manage department users after creation</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

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
                                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {example}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                            <Link href={route('admin.departments.index')}>
                                <Button variant="outline" type="button">
                                    Cancel
                                </Button>
                            </Link>
                            <Button type="submit" disabled={processing || !data.name.trim()}>
                                {processing ? 'Creating...' : 'Create Department'}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Quick Actions */}
                <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions After Creation</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                            <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span>Assign users to the department</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span>View department users and analytics</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span>Create additional departments as needed</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span>Manage department hierarchy</span>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}