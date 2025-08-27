import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Packages', href: '/packages' },
    { title: 'Create', href: '/packages/create' }
];

interface Department {
    id: number;
    name: string;
}

interface PageProps {
    departments: Department[];
}

export default function Create() {
    const { departments } = usePage().props as unknown as PageProps;
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        description: '',
        department_id: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.packages.store'), {
            onSuccess: () => reset()
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Package" />

            <div className="max-w-2xl mx-auto px-6 py-4">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Create New Package</h1>
                    <p className="text-sm text-gray-600 mt-1">Add a new package to the system</p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">Package Information</h3>
                            
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                    Package Name *
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                                    placeholder="Enter package name"
                                    required
                                    autoFocus
                                />
                                {errors.name && (
                                    <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                                )}
                                <p className="mt-2 text-sm text-gray-500">
                                    Choose a clear, descriptive name for the package
                                </p>
                            </div>

                            <div>
                                <label htmlFor="department_id" className="block text-sm font-medium text-gray-700 mb-2">
                                    Department *
                                </label>
                                <select
                                    id="department_id"
                                    value={data.department_id}
                                    onChange={(e) => setData('department_id', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                                    required
                                >
                                    <option value="">Select a department</option>
                                    {departments.map((department) => (
                                        <option key={department.id} value={department.id}>
                                            {department.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.department_id && (
                                    <p className="mt-2 text-sm text-red-600">{errors.department_id}</p>
                                )}
                                <p className="mt-2 text-sm text-gray-500">
                                    Select the department that will manage this package
                                </p>
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Describe the package purpose, contents, or features"
                                />
                                {errors.description && (
                                    <p className="mt-2 text-sm text-red-600">{errors.description}</p>
                                )}
                                <p className="mt-2 text-sm text-gray-500">
                                    Optional: Provide additional details about this package
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
                                    <h4 className="text-sm font-medium text-blue-800">About Packages</h4>
                                    <div className="mt-1 text-sm text-blue-700">
                                        <ul className="list-disc list-inside space-y-1">
                                            <li>Packages are organized under specific departments</li>
                                            <li>Each package must belong to exactly one department</li>
                                            <li>Package names should be unique across the system</li>
                                            <li>Descriptions help users understand the package purpose</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Package Examples */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-800 mb-2">Package Name Examples:</h4>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    'Basic Event Package', 'Premium Wedding Package', 'Corporate Meeting Package',
                                    'Conference Package', 'Birthday Party Package', 'Holiday Event Package',
                                    'Training Session Package', 'Product Launch Package'
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
                            <Link href={route('admin.packages.index')}>
                                <Button variant="outline" type="button">
                                    Cancel
                                </Button>
                            </Link>
                            <Button type="submit" disabled={processing || !data.name.trim() || !data.department_id}>
                                {processing ? 'Creating...' : 'Create Package'}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Quick Actions */}
                <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">After Creating the Package</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                            <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span>Configure package details and pricing</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span>Add package components and services</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span>Assign package to events and orders</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            <span>Monitor package usage and analytics</span>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}