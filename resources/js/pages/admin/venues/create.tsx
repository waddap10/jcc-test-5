import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Venues', href: '/venues' },
    { title: 'Create', href: '/venues/create' }
];

export default function Create() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        short: '',
        photo: null as File | null,
        description: '',
        dimension_m: '',
        dimension_f: '',
        setup_banquet: '',
        setup_classroom: '',
        setup_theater: '',
        setup_reception: '',
        floor_plan: null as File | null
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.venues.store'), {
            forceFormData: true,
            onSuccess: () => reset()
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Venue" />

            <div className="max-w-4xl mx-auto px-6 py-4">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Create New Venue</h1>
                    <p className="text-sm text-gray-600 mt-1">Add a new venue space to the system</p>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Basic Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                        Venue Name *
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="Enter venue name"
                                        required
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-xs text-red-600">{errors.name}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="short" className="block text-sm font-medium text-gray-700 mb-1">
                                        Short Code *
                                    </label>
                                    <input
                                        type="text"
                                        id="short"
                                        value={data.short}
                                        onChange={(e) => setData('short', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., HALL-A, CONF-1"
                                        maxLength={50}
                                        required
                                    />
                                    {errors.short && (
                                        <p className="mt-1 text-xs text-red-600">{errors.short}</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Describe the venue features and amenities"
                                />
                                {errors.description && (
                                    <p className="mt-1 text-xs text-red-600">{errors.description}</p>
                                )}
                            </div>
                        </div>

                        {/* Dimensions */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">Dimensions</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="dimension_m" className="block text-sm font-medium text-gray-700 mb-1">
                                        Length (meters)
                                    </label>
                                    <input
                                        type="number"
                                        id="dimension_m"
                                        value={data.dimension_m}
                                        onChange={(e) => setData('dimension_m', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="0"
                                        min="0"
                                        step="0.1"
                                    />
                                    {errors.dimension_m && (
                                        <p className="mt-1 text-xs text-red-600">{errors.dimension_m}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="dimension_f" className="block text-sm font-medium text-gray-700 mb-1">
                                        Width (meters)
                                    </label>
                                    <input
                                        type="number"
                                        id="dimension_f"
                                        value={data.dimension_f}
                                        onChange={(e) => setData('dimension_f', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="0"
                                        min="0"
                                        step="0.1"
                                    />
                                    {errors.dimension_f && (
                                        <p className="mt-1 text-xs text-red-600">{errors.dimension_f}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Setup Capacities */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">Setup Capacities</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <label htmlFor="setup_banquet" className="block text-sm font-medium text-gray-700 mb-1">
                                        Banquet Setup
                                    </label>
                                    <input
                                        type="number"
                                        id="setup_banquet"
                                        value={data.setup_banquet}
                                        onChange={(e) => setData('setup_banquet', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="0"
                                        min="0"
                                    />
                                    {errors.setup_banquet && (
                                        <p className="mt-1 text-xs text-red-600">{errors.setup_banquet}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="setup_classroom" className="block text-sm font-medium text-gray-700 mb-1">
                                        Classroom Setup
                                    </label>
                                    <input
                                        type="number"
                                        id="setup_classroom"
                                        value={data.setup_classroom}
                                        onChange={(e) => setData('setup_classroom', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="0"
                                        min="0"
                                    />
                                    {errors.setup_classroom && (
                                        <p className="mt-1 text-xs text-red-600">{errors.setup_classroom}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="setup_theater" className="block text-sm font-medium text-gray-700 mb-1">
                                        Theater Setup
                                    </label>
                                    <input
                                        type="number"
                                        id="setup_theater"
                                        value={data.setup_theater}
                                        onChange={(e) => setData('setup_theater', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="0"
                                        min="0"
                                    />
                                    {errors.setup_theater && (
                                        <p className="mt-1 text-xs text-red-600">{errors.setup_theater}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="setup_reception" className="block text-sm font-medium text-gray-700 mb-1">
                                        Reception Setup
                                    </label>
                                    <input
                                        type="number"
                                        id="setup_reception"
                                        value={data.setup_reception}
                                        onChange={(e) => setData('setup_reception', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="0"
                                        min="0"
                                    />
                                    {errors.setup_reception && (
                                        <p className="mt-1 text-xs text-red-600">{errors.setup_reception}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* File Uploads */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">Media & Documents</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="photo" className="block text-sm font-medium text-gray-700 mb-1">
                                        Venue Photo
                                    </label>
                                    <input
                                        type="file"
                                        id="photo"
                                        onChange={(e) => setData('photo', e.target.files?.[0] || null)}
                                        accept="image/jpeg,image/png,image/jpg,image/gif"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Supported: JPEG, PNG, JPG, GIF (max 2MB)</p>
                                    {errors.photo && (
                                        <p className="mt-1 text-xs text-red-600">{errors.photo}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="floor_plan" className="block text-sm font-medium text-gray-700 mb-1">
                                        Floor Plan
                                    </label>
                                    <input
                                        type="file"
                                        id="floor_plan"
                                        onChange={(e) => setData('floor_plan', e.target.files?.[0] || null)}
                                        accept="image/jpeg,image/png,image/jpg,image/gif,application/pdf"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Supported: JPEG, PNG, JPG, GIF, PDF (max 5MB)</p>
                                    {errors.floor_plan && (
                                        <p className="mt-1 text-xs text-red-600">{errors.floor_plan}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                            <Link href={route('admin.venues.index')}>
                                <Button variant="outline" type="button">
                                    Cancel
                                </Button>
                            </Link>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Creating...' : 'Create Venue'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}