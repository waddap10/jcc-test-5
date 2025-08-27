import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, Edit, Trash2, Package, Building2, FileText } from 'lucide-react';

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

interface PackagesPageProps {
    packages: {
        data: Package[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    filters?: {
        search?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Packages',
        href: route('admin.packages.index'),
    },
];

export default function PackagesIndex({ packages, filters = {} }: PackagesPageProps) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [deletePackage, setDeletePackage] = useState<Package | null>(null);
    const { delete: destroy, processing } = useForm();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.packages.index'), { search: searchTerm }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDelete = () => {
        if (deletePackage) {
            destroy(route('admin.packages.destroy', deletePackage.id), {
                onSuccess: () => {
                    setDeletePackage(null);
                },
            });
        }
    };

    const handlePageChange = (url: string) => {
        router.get(url);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const uniqueDepartments = new Set(packages.data.map(p => p.department.id)).size;
    const packagesWithDescription = packages.data.filter(p => p.description && p.description.trim() !== '').length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Packages" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <Package className="h-8 w-8 text-blue-600" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Packages</p>
                                    <p className="text-2xl font-bold text-blue-600">{packages.total}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-8 w-8 text-green-600" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Departments</p>
                                    <p className="text-2xl font-bold text-green-600">{uniqueDepartments}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <FileText className="h-8 w-8 text-purple-600" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">With Description</p>
                                    <p className="text-2xl font-bold text-purple-600">{packagesWithDescription}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold">Packages</CardTitle>
                            <p className="text-muted-foreground">
                                Showing {packages.from} to {packages.to} of {packages.total} packages
                            </p>
                        </div>
                        <Link href={route('admin.packages.create')}>
                            <Button variant="outline">
                                <Plus className="mr-2 h-4 w-4" />
                                New Package
                            </Button>
                        </Link>
                    </CardHeader>

                    <CardContent>
                        {/* Search Form */}
                        <form onSubmit={handleSearch} className="mb-6">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Search by package name, description, or department..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <Button type="submit" variant="outline">
                                    Search
                                </Button>
                                {filters?.search && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => {
                                            setSearchTerm('');
                                            router.get(route('admin.packages.index'));
                                        }}
                                    >
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </form>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>No</TableHead>
                                        <TableHead>Package Name</TableHead>
                                        <TableHead>Department</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Created At</TableHead>
                                        <TableHead>Updated At</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {packages.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                No packages found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        packages.data.map((pkg, index) => (
                                            <TableRow key={pkg.id}>
                                                <TableCell className="font-medium">
                                                    {(packages.current_page - 1) * packages.per_page + index + 1}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {pkg.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200">
                                                        {pkg.department.name}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="max-w-xs truncate text-sm text-muted-foreground">
                                                        {pkg.description ? (
                                                            <span title={pkg.description}>
                                                                {pkg.description}
                                                            </span>
                                                        ) : (
                                                            <span className="italic">No description</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {formatDate(pkg.created_at)}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {formatDate(pkg.updated_at)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link href={route('admin.packages.edit', pkg.id)}>
                                                            <Button variant="outline" size="sm">
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setDeletePackage(pkg)}
                                                            disabled={processing}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {packages.last_page > 1 && (
                            <div className="mt-6 flex justify-center">
                                <Pagination>
                                    <PaginationContent>
                                        {/* Previous Button */}
                                        <PaginationItem>
                                            <PaginationPrevious
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (packages.current_page > 1) {
                                                        const prevUrl = packages.links.find(link =>
                                                            link.label.includes('Previous')
                                                        )?.url;
                                                        if (prevUrl) handlePageChange(prevUrl);
                                                    }
                                                }}
                                                className={packages.current_page === 1 ? 'pointer-events-none opacity-50' : ''}
                                            />
                                        </PaginationItem>

                                        {/* Page Numbers */}
                                        {packages.links
                                            .filter(link => !link.label.includes('Previous') && !link.label.includes('Next'))
                                            .map((link, index) => (
                                                <PaginationItem key={index}>
                                                    {link.label === '...' ? (
                                                        <PaginationEllipsis />
                                                    ) : (
                                                        <PaginationLink
                                                            href="#"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                if (link.url) handlePageChange(link.url);
                                                            }}
                                                            isActive={link.active}
                                                        >
                                                            {link.label}
                                                        </PaginationLink>
                                                    )}
                                                </PaginationItem>
                                            ))}

                                        {/* Next Button */}
                                        <PaginationItem>
                                            <PaginationNext
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (packages.current_page < packages.last_page) {
                                                        const nextUrl = packages.links.find(link =>
                                                            link.label.includes('Next')
                                                        )?.url;
                                                        if (nextUrl) handlePageChange(nextUrl);
                                                    }
                                                }}
                                                className={packages.current_page === packages.last_page ? 'pointer-events-none opacity-50' : ''}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deletePackage} onOpenChange={() => setDeletePackage(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will delete the package "{deletePackage?.name}" from department "{deletePackage?.department.name}".
                            This action cannot be undone and may affect related orders or services.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={processing}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {processing ? 'Deleting...' : 'Delete Package'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}