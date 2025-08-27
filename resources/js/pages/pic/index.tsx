import React from 'react';
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
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { Eye, CheckCircle } from 'lucide-react';

interface Order {
    id: number;
    custom_code: string;
    event_name: string;
    start_date: string;
    end_date: string;
    status: number;
    status_beo: number;
    customer: {
        organizer: string;
    };
    venues: Array<{
        id: number;
        short: string;
    }>;
    event: {
        event_type: string;
        code: string;
    };
}

interface OrdersPageProps {
    orders: {
        data: Order[];
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
    flash?: { message?: string };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'PIC Dashboard',
        href: route('pic.dashboard'),
    },
];

export default function KanitDashboard({ orders, flash }: OrdersPageProps) {
    const { patch, processing } = useForm();

    // Map status codes to label + background color
    const getStatusProps = (status: number) => {
        switch (status) {
            case 0:
                return { label: 'New Inquiry', bgcolor: '#A5D6A7' }; // light green
            case 1:
                return { label: 'Sudah Konfirmasi', bgcolor: '#FFF59D' }; // light yellow
            case 2:
                return { label: 'Sudah dilaksanakan', bgcolor: '#90CAF9' }; // light blue
            default:
                return { label: 'Unknown', bgcolor: '#E0E0E0' }; // gray
        }
    };

    const getStatusBeoProps = (status_beo: number) => {
        switch (status_beo) {
            case 0:
                return { label: 'Planning', bgcolor: '#A5D6A7' }; // light green
            case 1:
                return { label: 'Sudah Kirim Ke Kanit', bgcolor: '#FFF59D' }; // light yellow
            case 2:
                return { label: 'Sudah Acc Kanit', bgcolor: '#90CAF9' }; // light blue
            case 3:
                return { label: 'Di edit', bgcolor: '#ff9100ff' }; // orange
            default:
                return { label: 'Unknown', bgcolor: '#E0E0E0' }; // gray
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const handlePageChange = (url: string) => {
        router.get(url);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Kanit Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                {flash?.message && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        {flash.message}
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <div>
                            <CardTitle className="text-2xl font-bold">Orders for Review</CardTitle>
                            <p className="text-muted-foreground">
                                Showing {orders.from} to {orders.to} of {orders.total} orders
                            </p>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Event Name</TableHead>
                                        <TableHead>Organizer</TableHead>
                                        <TableHead>Venues</TableHead>
                                        <TableHead>Event Type</TableHead>
                                        <TableHead>Start Date</TableHead>
                                        <TableHead>End Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>BEO Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={10} className="h-24 text-center">
                                                No orders found for review.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        orders.data.map((order) => {
                                            const statusProps = getStatusProps(order.status);
                                            const statusBeoProps = getStatusBeoProps(order.status_beo);

                                            return (
                                                <TableRow key={order.id}>
                                                    <TableCell className="font-medium">
                                                        {order.custom_code}
                                                    </TableCell>
                                                    <TableCell className="max-w-xs">
                                                        <div className="truncate" title={order.event_name}>
                                                            {order.event_name}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{order.customer.organizer}</TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-wrap gap-1">
                                                            {order.venues.map((venue) => (
                                                                <Badge
                                                                    key={venue.id}
                                                                    variant="outline"
                                                                    className="text-xs"
                                                                >
                                                                    {venue.short}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">
                                                            {order.event.event_type}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>{formatDate(order.start_date)}</TableCell>
                                                    <TableCell>{formatDate(order.end_date)}</TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            style={{ backgroundColor: statusProps.bgcolor }}
                                                            className="text-black"
                                                        >
                                                            {statusProps.label}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            style={{ backgroundColor: statusBeoProps.bgcolor }}
                                                            className="text-black"
                                                        >
                                                            {statusBeoProps.label}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {/* View Order Details */}
                                                            <Link href={route('pic.orders.show', order.id)}>
                                                                <Button variant="outline" size="sm">
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {orders.last_page > 1 && (
                            <div className="mt-6 flex justify-center">
                                <Pagination>
                                    <PaginationContent>
                                        {/* Previous Button */}
                                        <PaginationItem>
                                            <PaginationPrevious
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (orders.current_page > 1) {
                                                        const prevUrl = orders.links.find(link =>
                                                            link.label.includes('Previous')
                                                        )?.url;
                                                        if (prevUrl) handlePageChange(prevUrl);
                                                    }
                                                }}
                                                className={orders.current_page === 1 ? 'pointer-events-none opacity-50' : ''}
                                            />
                                        </PaginationItem>

                                        {/* Page Numbers */}
                                        {orders.links
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
                                                    if (orders.current_page < orders.last_page) {
                                                        const nextUrl = orders.links.find(link =>
                                                            link.label.includes('Next')
                                                        )?.url;
                                                        if (nextUrl) handlePageChange(nextUrl);
                                                    }
                                                }}
                                                className={orders.current_page === orders.last_page ? 'pointer-events-none opacity-50' : ''}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}