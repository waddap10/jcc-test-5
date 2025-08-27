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
import { Plus, Eye, Check, Download, Trash2 } from 'lucide-react';
import { NotificationContainer } from '@/components/ui/notification';
import { useNotifications } from '@/hooks/useNotifications';

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
    flash?: {
        success?: string;
        error?: string;
        warning?: string;
        info?: string;
    };
    notifications?: any[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Orders',
        href: route('sales.orders.index'),
    },
];

export default function OrdersIndex({ orders, flash, notifications = [] }: OrdersPageProps) {
    const { patch } = useForm();
    const { removeNotification, success, error, warning, info } = useNotifications();

    // Add console debugging
    console.log('OrdersIndex received:', {
        notificationsCount: notifications?.length || 0,
        notifications: notifications
    });

    // Handle flash messages
    React.useEffect(() => {
        if (flash?.success) {
            success('Success', flash.success);
        }
        if (flash?.error) {
            error('Error', flash.error);
        }
        if (flash?.warning) {
            warning('Warning', flash.warning);
        }
        if (flash?.info) {
            info('Info', flash.info);
        }
    }, [flash, success, error, warning, info]);

    // Map status codes to label + background color
    const getStatusProps = (status: number) => {
        switch (status) {
            case 0:
                return { label: 'New Inquiry', bgcolor: '#A5D6A7' };
            case 1:
                return { label: 'Sudah Konfirmasi', bgcolor: '#FFF59D' };
            case 2:
                return { label: 'Sudah dilaksanakan', bgcolor: '#90CAF9' };
            default:
                return { label: 'Unknown', bgcolor: '#E0E0E0' };
        }
    };

    const getStatusBeoProps = (status_beo: number) => {
        switch (status_beo) {
            case 0:
                return { label: 'Planning', bgcolor: '#A5D6A7' };
            case 1:
                return { label: 'Sudah Kirim Ke Kanit', bgcolor: '#FFF59D' };
            case 2:
                return { label: 'Sudah Acc Kanit', bgcolor: '#90CAF9' };
            case 3:
                return { label: 'Di edit', bgcolor: '#ff9100ff' };
            default:
                return { label: 'Unknown', bgcolor: '#E0E0E0' };
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const handleConfirm = (o: Order) => {
        if (confirm(`Konfirmasi pesanan #${o.custom_code}?`)) {
            patch(route('sales.orders.status.update', o.id), {
                onSuccess: () => {
                    success(
                        'Order Confirmed',
                        `Order #${o.custom_code} has been successfully confirmed.`
                    );
                },
                onError: (errors) => {
                    error(
                        'Confirmation Failed',
                        'Failed to confirm the order. Please try again.'
                    );
                    console.error('Confirmation errors:', errors);
                }
            });
        }
    };

    const handlePageChange = (url: string) => {
        router.get(url);
    };

    const handleDelete = (order: Order) => {
        if (confirm(`Are you sure you want to delete order "${order.event_name}" (${order.custom_code})? This action cannot be undone.`)) {
            router.delete(route('sales.orders.destroy', order.id), {
                onSuccess: () => {
                    success(
                        'Order Deleted',
                        `Order "${order.event_name}" has been successfully deleted.`
                    );
                },
                onError: (errors) => {
                    error(
                        'Delete Failed',
                        'Failed to delete order. Please try again.'
                    );
                    console.error('Failed to delete order:', errors);
                }
            });
        }
    };

    const handleDownload = (order: Order) => {
        try {
            window.open(route('sales.orders.pdf.download', order.id), '_blank');
            info(
                'Download Started',
                `PDF for order #${order.custom_code} is being prepared.`
            );
        } catch (error) {
            error(
                'Download Failed',
                'Unable to download PDF. Please try again.'
            );
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs} notifications={notifications}>
            <Head title="Orders" />
            
            {/* Notification Container for flash messages */}
            <NotificationContainer 
                notifications={[]} // This is for your flash notifications hook
                onClose={removeNotification}
            />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold">Orders</CardTitle>
                            <p className="text-muted-foreground">
                                Showing {orders.from} to {orders.to} of {orders.total} orders
                            </p>
                        </div>
                        <Link href={route('sales.orders.create')}>
                            <Button variant="outline">
                                <Plus className="mr-2 h-4 w-4" />
                                New Order
                            </Button>
                        </Link>
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
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={10} className="h-24 text-center">
                                                No orders found.
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
                                                        <div className="flex flex-col items-end gap-2">
                                                            {/* Confirm Button */}
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleConfirm(order)}
                                                                disabled={order.status !== 0}
                                                                title={order.status !== 0 ? 'Order already confirmed' : 'Confirm order'}
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </Button>

                                                            {/* View Order Details */}
                                                            <Link href={route('sales.orders.show', order.id)}>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    disabled={order.status === 0}
                                                                    title={order.status === 0 ? 'Confirm order first' : 'View order details'}
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </Link>

                                                            {/* Download PDF */}
                                                            <Button
                                                                onClick={() => handleDownload(order)}
                                                                variant="outline"
                                                                size="sm"
                                                                disabled={order.status_beo !== 2}
                                                                title={order.status_beo !== 2 ? 'PDF not ready yet' : 'Download PDF'}
                                                            >
                                                                <Download className="h-4 w-4" />
                                                            </Button>

                                                            {/* Delete Button */}
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleDelete(order)}
                                                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                                                title="Delete order"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
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