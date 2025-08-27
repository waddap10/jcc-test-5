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
import { Plus, Search, Edit, Trash2, Building, Maximize, Users, FileText } from 'lucide-react';

interface Venue {
    id: number;
    name: string;
    short: string;
    photo?: string;
    description?: string;
    dimension_m?: number;
    dimension_f?: number;
    setup_banquet?: number;
    setup_classroom?: number;
    setup_theater?: number;
    setup_reception?: number;
    floor_plan?: string;
    created_at: string;
    updated_at: string;
}

interface VenuesPageProps {
    venues: {
        data: Venue[];
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
        title: 'Venues',
        href: route('admin.venues.index'),
    },
];

export default function VenuesIndex({ venues, filters = {} }: VenuesPageProps) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [deleteVenue, setDeleteVenue] = useState<Venue | null>(null);
    const { delete: destroy, processing } = useForm();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.venues.index'), { search: searchTerm }, {
            preserveState: true,
            replace: true,
        });
    };

    const handleDelete = () => {
        if (deleteVenue) {
            destroy(route('admin.venues.destroy', deleteVenue.id), {
                onSuccess: () => {
                    setDeleteVenue(null);
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

    const formatDimensions = (length?: number, width?: number) => {
        if (!length && !width) return '—';
        if (length && width) return `${length}m × ${width}m`;
        return length ? `${length}m` : `${width}m`;
    };

    const getMaxCapacity = (venue: Venue) => {
        const capacities = [
            venue.setup_banquet || 0,
            venue.setup_classroom || 0,
            venue.setup_theater || 0,
            venue.setup_reception || 0
        ];
        return Math.max(...capacities);
    };

    const formatCapacity = (venue: Venue) => {
        const capacities = [];
        if (venue.setup_banquet) capacities.push(`Banquet: ${venue.setup_banquet}`);
        if (venue.setup_classroom) capacities.push(`Classroom: ${venue.setup_classroom}`);
        if (venue.setup_theater) capacities.push(`Theater: ${venue.setup_theater}`);
        if (venue.setup_reception) capacities.push(`Reception: ${venue.setup_reception}`);

        return capacities.length > 0 ? capacities.join(' | ') : '—';
    };

    const venuesWithDimensions = venues.data.filter(v => v.dimension_m || v.dimension_f).length;
    const venuesWithCapacity = venues.data.filter(v => v.setup_banquet || v.setup_classroom || v.setup_theater || v.setup_reception).length;
    const venuesWithDescription = venues.data.filter(v => v.description && v.description.trim() !== '').length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Venues" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <Building className="h-8 w-8 text-blue-600" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Venues</p>
                                    <p className="text-2xl font-bold text-blue-600">{venues.total}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <Maximize className="h-8 w-8 text-green-600" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">With Dimensions</p>
                                    <p className="text-2xl font-bold text-green-600">{venuesWithDimensions}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <Users className="h-8 w-8 text-purple-600" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">With Capacity</p>
                                    <p className="text-2xl font-bold text-purple-600">{venuesWithCapacity}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2">
                                <FileText className="h-8 w-8 text-orange-600" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">With Description</p>
                                    <p className="text-2xl font-bold text-orange-600">{venuesWithDescription}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold">Venues</CardTitle>
                            <p className="text-muted-foreground">
                                Showing {venues.from} to {venues.to} of {venues.total} venues
                            </p>
                        </div>
                        <Link href={route('admin.venues.create')}>
                            <Button variant="outline">
                                <Plus className="mr-2 h-4 w-4" />
                                New Venue
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
                                        placeholder="Search by venue name, short code, or description..."
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
                                            router.get(route('admin.venues.index'));
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
                                        <TableHead>Venue Name</TableHead>
                                        <TableHead>Short Code</TableHead>
                                        <TableHead>Dimensions</TableHead>
                                        <TableHead>Max Capacity</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Created At</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {venues.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                No venues found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        venues.data.map((venue) => (
                                            <TableRow key={venue.id}>
                                                <TableCell>
                                                    <div className="font-medium">
                                                        {venue.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-mono">
                                                        {venue.short}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm">
                                                        {formatDimensions(venue.dimension_m, venue.dimension_f)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {getMaxCapacity(venue) > 0 ? (
                                                        <Badge variant="secondary">
                                                            {getMaxCapacity(venue)} guests
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="max-w-xs truncate text-sm text-muted-foreground">
                                                        {venue.description ? (
                                                            <span title={venue.description}>
                                                                {venue.description}
                                                            </span>
                                                        ) : (
                                                            <span className="italic">No description</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {formatDate(venue.created_at)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Link href={route('admin.venues.edit', venue.id)}>
                                                            <Button variant="outline" size="sm">
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setDeleteVenue(venue)}
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
                        {venues.last_page > 1 && (
                            <div className="mt-6 flex justify-center">
                                <Pagination>
                                    <PaginationContent>
                                        {/* Previous Button */}
                                        <PaginationItem>
                                            <PaginationPrevious
                                                href="#"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    if (venues.current_page > 1) {
                                                        const prevUrl = venues.links.find(link =>
                                                            link.label.includes('Previous')
                                                        )?.url;
                                                        if (prevUrl) handlePageChange(prevUrl);
                                                    }
                                                }}
                                                className={venues.current_page === 1 ? 'pointer-events-none opacity-50' : ''}
                                            />
                                        </PaginationItem>

                                        {/* Page Numbers */}
                                        {venues.links
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
                                                    if (venues.current_page < venues.last_page) {
                                                        const nextUrl = venues.links.find(link =>
                                                            link.label.includes('Next')
                                                        )?.url;
                                                        if (nextUrl) handlePageChange(nextUrl);
                                                    }
                                                }}
                                                className={venues.current_page === venues.last_page ? 'pointer-events-none opacity-50' : ''}
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
            <AlertDialog open={!!deleteVenue} onOpenChange={() => setDeleteVenue(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will delete the venue "{deleteVenue?.name}" (code: {deleteVenue?.short}).
                            This action cannot be undone and may affect related orders or bookings.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={processing}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {processing ? 'Deleting...' : 'Delete Venue'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}