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
import { Plus, Search, Edit, Trash2, Building2 } from 'lucide-react';

interface Department {
    id: number;
    name: string;
    users_count: number;
    created_at: string;
    updated_at: string;
}

interface DepartmentsPageProps {
    departments: {
        data: Department[];
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
        title: 'Departments',
        href: route('admin.departments.index'),
    },
];

export default function DepartmentsIndex({ departments, filters = {} }: DepartmentsPageProps) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [deleteDepartment, setDeleteDepartment] = useState<Department | null>(null);
    const { delete: destroy, processing } = useForm();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.departments.index'), { search: searchTerm }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDelete = () => {
        if (deleteDepartment) {
            destroy(route('admin.departments.destroy', deleteDepartment.id), {
                onSuccess: () => {
                    setDeleteDepartment(null);
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

    const activeDepartments = departments.data.filter(d => d.users_count > 0).length;
    const emptyDepartments = departments.data.filter(d => d.users_count === 0).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Departments" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-8 w-8 text-blue-600" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Departments</p>
                                    <p className="text-2xl font-bold text-blue-600">{departments.total}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-8 w-8 text-green-600" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Active Departments</p>
                                    <p className="text-2xl font-bold text-green-600">{activeDepartments}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-8 w-8 text-orange-600" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Empty Departments</p>
                                    <p className="text-2xl font-bold text-orange-600">{emptyDepartments}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold">Departments</CardTitle>
                            <p className="text-muted-foreground">
                                Showing {departments.from} to {departments.to} of {departments.total} departments
                            </p>
                        </div>
                        <Link href={route('admin.departments.create')}>
                            <Button variant="outline">
                                <Plus className="mr-2 h-4 w-4" />
                                New Department
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
                                        placeholder="Search by department name..."
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
                                            router.get(route('admin.departments.index'));
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
                                        <TableHead>ID</TableHead>
                                        <TableHead>Department Name</TableHead>
                                        <TableHead>Users Count</TableHead>
                                        <TableHead>Created At</TableHead>
                                        <TableHead>Updated At</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {departments.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-24 text-center">
                                                No departments found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        departments.data.map((department) => (
                                            <TableRow key={department.id}>
                                                <TableCell className="font-medium">
                                                    {department.id}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {department.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Badge 
                                                            variant={department.users_count > 0 ? "default" : "secondary"}
                                                        >
                                                            {department.users_count} users
                                                        </Badge>
                                                        {department.users_count > 0 && (
                                                            <Link href={route('admin.departments.users', department.id)}>
                                                                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                                                                    View Users
                                                                </Button>
                                                            </Link>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {formatDate(department.created_at)}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {formatDate(department.updated_at)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link href={route('admin.departments.edit', department.id)}>
                                                            <Button variant="outline" size="sm">
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setDeleteDepartment(department)}
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
                        {departments.last_page > 1 && (
                            <div className="mt-6 flex justify-center">
                                <Pagination>
                                    <PaginationContent>
                                        {/* Previous Button */}
                                        <PaginationItem>
                                            <PaginationPrevious
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (departments.current_page > 1) {
                                                        const prevUrl = departments.links.find(link =>
                                                            link.label.includes('Previous')
                                                        )?.url;
                                                        if (prevUrl) handlePageChange(prevUrl);
                                                    }
                                                }}
                                                className={departments.current_page === 1 ? 'pointer-events-none opacity-50' : ''}
                                            />
                                        </PaginationItem>

                                        {/* Page Numbers */}
                                        {departments.links
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
                                                    if (departments.current_page < departments.last_page) {
                                                        const nextUrl = departments.links.find(link =>
                                                            link.label.includes('Next')
                                                        )?.url;
                                                        if (nextUrl) handlePageChange(nextUrl);
                                                    }
                                                }}
                                                className={departments.current_page === departments.last_page ? 'pointer-events-none opacity-50' : ''}
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
            <AlertDialog open={!!deleteDepartment} onOpenChange={() => setDeleteDepartment(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will delete the department "{deleteDepartment?.name}".
                            {deleteDepartment?.users_count ? (
                                <span className="block mt-2 text-red-600 font-semibold">
                                    Warning: This department has {deleteDepartment.users_count} users and cannot be deleted.
                                    Please reassign users first.
                                </span>
                            ) : (
                                <span className="block mt-2">
                                    This action cannot be undone.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={processing || (deleteDepartment?.users_count ?? 0) > 0}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {processing ? 'Deleting...' : 'Delete Department'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}