import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

interface Department {
    id: number;
    name: string;
}

interface Package {
    id: number;
    name: string;
    description?: string;
    department: Department;
    created_at: string;
    updated_at: string;
}

interface PageProps {
    package: Package;
    departments: Department[];
}

export default function Edit() {
    const { package: pkg, departments } = usePage().props as unknown as PageProps;
    
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Packages', href: '/packages' },
        { title: pkg.name, href: `/packages/${pkg.id}` },
        { title: 'Edit', href: `/packages/${pkg.id}/edit` }
    ];

    const { data, setData, patch, processing, errors } = useForm({
        name: pkg.name || '',
        description: pkg.description || '',
        department_id: pkg.department?.id?.toString() || ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('admin.packages.update', pkg.id));
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
            <Head title={`Edit ${pkg.name}`} />

            <div className="max-w-2xl mx-auto px-6 py-4">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Edit Package</h1>
                    <p className="text-sm text-gray-600 mt-1">Update package information and settings</p>
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
                                    Current: {pkg.department.name}
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

                        {/* Package Statistics */}
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-800 mb-3">Package Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Package ID</p>
                                    <p className="text-lg font-semibold text-gray-900">#{pkg.id}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Current Department</p>
                                    <span className="inline-flex rounded-md bg-blue-100 px-2 py-1 text-sm font-medium text-blue-800">
                                        {pkg.department.name}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Created</p>
                                    <p className="text-sm text-gray-900">{formatDate(pkg.created_at)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Last Updated</p>
                                    <p className="text-sm text-gray-900">{formatDate(pkg.updated_at)}</p>
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
                                            <li>Changing the package name will update it across all associated records</li>
                                            <li>Moving to a different department may affect package availability</li>
                                            <li>The package name must remain unique in the system</li>
                                            <li>Updates will be reflected immediately in ongoing orders</li>
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

                        {/* Department Change Warning */}
                        {data.department_id !== pkg.department.id.toString() && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-amber-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h4 className="text-sm font-medium text-amber-800">Department Change Warning</h4>
                                        <p className="mt-1 text-sm text-amber-700">
                                            You are changing this package from <strong>{pkg.department.name}</strong> to{' '}
                                            <strong>{departments.find(d => d.id.toString() === data.department_id)?.name}</strong>.
                                            This may affect how the package is managed and who has access to it.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                            <Link href={route('admin.packages.index', pkg.id)}>
                                <Button variant="outline" type="button">
                                    Cancel
                                </Button>
                            </Link>
                            <Button type="submit" disabled={processing || !data.name.trim() || !data.department_id}>
                                {processing ? 'Updating...' : 'Update Package'}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Quick Actions */}
                <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>
                    <div className="flex flex-wrap gap-2">
                        
                        
                        <Link href={route('admin.departments.index', pkg.department.id)}>
                            <Button variant="outline" size="sm">
                                Manage Department
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}