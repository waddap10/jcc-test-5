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
import { Plus, Search, Edit, Trash2, Users, Building2, Phone, Mail } from 'lucide-react';

interface Customer {
    id: number;
    organizer: string;
    address: string;
    contact_person: string;
    phone: string;
    email: string;
    kl_status: number; // Changed from string to number (0 or 1)
    orders_count?: number;
    created_at: string;
    updated_at: string;
}

interface CustomersPageProps {
    customers: {
        data: Customer[];
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
        title: 'Customers',
        href: route('sales.customers.index'),
    },
];

export default function CustomersIndex({ customers, filters = {} }: CustomersPageProps) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null);
    const { delete: destroy, processing } = useForm();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('sales.customers.index'), { search: searchTerm }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDelete = () => {
        if (deleteCustomer) {
            destroy(route('sales.customers.destroy', deleteCustomer.id), {
                onSuccess: () => {
                    setDeleteCustomer(null);
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

    const getKlStatusBadge = (status: number | null | undefined) => {
        return (
            <Badge
                variant={status ? "default" : "secondary"}
                className={status ? "bg-green-100 text-green-800 border-green-300" : "bg-gray-100 text-gray-800 border-gray-300"}
            >
                {status ? "KL" : "Non-KL"}
            </Badge>
        );
    };

    const customersWithEmail = customers.data.filter(c => c.email && c.email.trim() !== '').length;
    const customersWithPhone = customers.data.filter(c => c.phone && c.phone.trim() !== '').length;
    const activeCustomers = customers.data.filter(c => c.kl_status === 1).length;
    const totalOrders = customers.data.reduce((sum, customer) => sum + (customer.orders_count || 0), 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Customers" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <Users className="h-8 w-8 text-blue-600" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Customers</p>
                                    <p className="text-2xl font-bold text-blue-600">{customers.total}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-8 w-8 text-green-600" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">KL</p>
                                    <p className="text-2xl font-bold text-green-600">{activeCustomers}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <Mail className="h-8 w-8 text-purple-600" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">With Email</p>
                                    <p className="text-2xl font-bold text-purple-600">{customersWithEmail}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <Phone className="h-8 w-8 text-orange-600" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">With Phone</p>
                                    <p className="text-2xl font-bold text-orange-600">{customersWithPhone}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold">Customers</CardTitle>
                            <p className="text-muted-foreground">
                                Showing {customers.from} to {customers.to} of {customers.total} customers
                            </p>
                        </div>
                    </CardHeader>

                    <CardContent>
                        {/* Search Form */}
                        <form onSubmit={handleSearch} className="mb-6">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Search by organizer, contact person, email, or phone..."
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
                                            router.get(route('sales.customers.index'));
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
                                        <TableHead>Organizer</TableHead>
                                        <TableHead>Contact Person</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead>Address</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Orders</TableHead>
                                        <TableHead>Created At</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {customers.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="h-24 text-center">
                                                No customers found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        customers.data.map((customer) => (
                                            <TableRow key={customer.id}>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {customer.organizer}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        {customer.contact_person || '—'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {customer.email ? (
                                                        <a 
                                                            href={`mailto:${customer.email}`}
                                                            className="text-blue-600 hover:underline text-sm"
                                                        >
                                                            {customer.email}
                                                        </a>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {customer.phone ? (
                                                        <a 
                                                            href={`tel:${customer.phone}`}
                                                            className="text-green-600 hover:underline text-sm"
                                                        >
                                                            {customer.phone}
                                                        </a>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="max-w-xs truncate text-sm text-muted-foreground">
                                                        {customer.address ? (
                                                            <span title={customer.address}>
                                                                {customer.address}
                                                            </span>
                                                        ) : (
                                                            <span className="italic">No address</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getKlStatusBadge(customer.kl_status)}
                                                </TableCell>
                                                <TableCell>
                                                    {customer.orders_count !== undefined ? (
                                                        <Badge variant="outline">
                                                            {customer.orders_count} orders
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {formatDate(customer.created_at)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link href={route('sales.customers.edit', customer.id)}>
                                                            <Button variant="outline" size="sm">
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setDeleteCustomer(customer)}
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
                        {customers.last_page > 1 && (
                            <div className="mt-6 flex justify-center">
                                <Pagination>
                                    <PaginationContent>
                                        {/* Previous Button */}
                                        <PaginationItem>
                                            <PaginationPrevious
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (customers.current_page > 1) {
                                                        const prevUrl = customers.links.find(link =>
                                                            link.label.includes('Previous')
                                                        )?.url;
                                                        if (prevUrl) handlePageChange(prevUrl);
                                                    }
                                                }}
                                                className={customers.current_page === 1 ? 'pointer-events-none opacity-50' : ''}
                                            />
                                        </PaginationItem>

                                        {/* Page Numbers */}
                                        {customers.links
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
                                                    if (customers.current_page < customers.last_page) {
                                                        const nextUrl = customers.links.find(link =>
                                                            link.label.includes('Next')
                                                        )?.url;
                                                        if (nextUrl) handlePageChange(nextUrl);
                                                    }
                                                }}
                                                className={customers.current_page === customers.last_page ? 'pointer-events-none opacity-50' : ''}
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
            <AlertDialog open={!!deleteCustomer} onOpenChange={() => setDeleteCustomer(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will delete the customer "{deleteCustomer?.organizer}" and contact person "{deleteCustomer?.contact_person}".
                            This action cannot be undone and may affect related orders.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={processing}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {processing ? 'Deleting...' : 'Delete Customer'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}