import React from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { format, parseISO, isValid } from 'date-fns';
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
import { Download, ArrowLeft, Check, ImageIcon } from 'lucide-react';

interface Venue {
    id: number;
    name: string;
    short?: string;
}

interface Department {
    id: number;
    name: string;
}

interface Package {
    id: number;
    name: string;
    description?: string;
}

interface User {
    id: number;
    name: string;
    email?: string;
    phone?: string;
}

interface Attachment {
    id: number;
    file_name: string;
    created_at: string;
    url: string;
    mime_type?: string;
}

interface BeoAttachment {
    id: number;
    file_name: string;
    created_at: string;
    url: string;
    mime_type?: string;
}

interface Beo {
    id: number;
    notes?: string;
    department: Department;
    package?: Package;
    user?: User;
    attachments: BeoAttachment[];
}

interface Schedule {
    id: number;
    start_date?: string;
    end_date?: string;
    time_start?: string;
    time_end?: string;
    function?: string;
    notes?: string;
    setup?: string;
    people?: number;
    is_single_day?: boolean;
    date_range?: string;
}

interface Customer {
    id: number;
    organizer: string;
    address: string;
    contact_person: string;
    phone: string;
    email: string;
    kl_status: boolean;
}

interface Order {
    id: number;
    custom_code: string;
    event_name: string;
    created_at: string | null;
    start_date: string | null;
    end_date: string | null;
    status: number;
    status_beo: number;
    discount?: number;
    customer: Customer;
    beos: Beo[];
    schedules: Schedule[];
    venues: Venue[];
    attachments: Attachment[];
}

interface PageProps {
    order: Order;
    flash?: { message?: string };
}

const functionLabels: Record<string, string> = {
    '1': 'Loading In',
    '2': 'Show',
    '3': 'Loading Out',
};

export default function PicOrderShow() {
    const { order, flash } = usePage<PageProps>().props;
    const { processing, patch } = useForm();

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'PIC Dashboard', href: route('pic.dashboard') },
        { title: order.event_name, href: '#' },
    ];

    const formatDate = (dateString: string | null | undefined, formatStr: string = 'dd-MM-yyyy'): string => {
        if (!dateString) return 'N/A';
        try {
            const parsedDate = parseISO(dateString);
            return isValid(parsedDate) ? format(parsedDate, formatStr) : 'Invalid Date';
        } catch {
            return 'Invalid Date';
        }
    };

    const formatTime = (timeString: string | undefined): string => {
        if (!timeString) return 'N/A';
        return timeString.match(/^\d{2}:\d{2}(:\d{2})?$/) 
            ? timeString.substring(0, 5)
            : timeString;
    };

    const formatDateRange = (schedule: Schedule): string => {
        if (schedule.date_range) return schedule.date_range;
        
        const startDate = schedule.start_date ? parseISO(schedule.start_date) : null;
        const endDate = schedule.end_date ? parseISO(schedule.end_date) : null;

        if (!startDate && !endDate) return 'N/A';
        if (!endDate) return startDate ? format(startDate, 'dd/MM/yy') : 'N/A';
        if (!startDate) return format(endDate, 'dd/MM/yy');

        return startDate.getTime() === endDate.getTime()
            ? format(startDate, 'dd/MM/yy')
            : `${format(startDate, 'dd/MM/yy')} – ${format(endDate, 'dd/MM/yy')}`;
    };

    const isImage = (fileName: string, mimeType?: string) => {
        if (mimeType) {
            return mimeType.startsWith('image/');
        }
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
        return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
    };

    const getImageUrl = (attachment: Attachment | BeoAttachment) => {
        // Use the URL if it exists, otherwise construct from file_name
        if (attachment.url) {
            return attachment.url;
        }
        return `/storage/${attachment.file_name}`;
    };

    // Filter attachments to only include images
    const getImageAttachments = (attachments: Attachment[] | BeoAttachment[]) => {
        return attachments.filter(attachment => 
            isImage(attachment.file_name, attachment.mime_type)
        );
    };

    const getStatusProps = (status: number) => {
        switch (status) {
            case 0: return { label: 'New Inquiry', bgcolor: '#A5D6A7' };
            case 1: return { label: 'Sudah Konfirmasi', bgcolor: '#FFF59D' };
            case 2: return { label: 'Sudah dilaksanakan', bgcolor: '#90CAF9' };
            default: return { label: 'Unknown', bgcolor: '#E0E0E0' };
        }
    };

    const getStatusBeoProps = (status_beo: number) => {
        switch (status_beo) {
            case 0: return { label: 'Planning', bgcolor: '#A5D6A7' };
            case 1: return { label: 'Sudah Kirim Ke Kanit', bgcolor: '#FFF59D' };
            case 2: return { label: 'Sudah Acc Kanit', bgcolor: '#90CAF9' };
            case 3: return { label: 'Di edit', bgcolor: '#ff9100ff' };
            default: return { label: 'Unknown', bgcolor: '#E0E0E0' };
        }
    };

    const statusProps = getStatusProps(order.status);
    const statusBeoProps = getStatusBeoProps(order.status_beo);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Order: ${order.event_name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {flash?.message && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        {flash.message}
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold">{order.event_name}</h1>
                    <div className="flex items-center gap-2">
                        <Badge
                            style={{ backgroundColor: statusProps.bgcolor }}
                            className="text-black"
                        >
                            {statusProps.label}
                        </Badge>
                        <Badge
                            style={{ backgroundColor: statusBeoProps.bgcolor }}
                            className="text-black"
                        >
                            {statusBeoProps.label}
                        </Badge>
                    </div>
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="grid grid-cols-[120px_10px_1fr] items-center gap-1">
                            <span className="font-medium">Order Code</span>
                            <span>:</span>
                            <span>{order.custom_code}</span>
                        </div>
                        <div className="grid grid-cols-[120px_10px_1fr] items-center gap-1">
                            <span className="font-medium">Created</span>
                            <span>:</span>
                            <span>{formatDate(order.created_at, 'dd-MM-yyyy HH:mm')}</span>
                        </div>
                        <div className="grid grid-cols-[120px_10px_1fr] items-center gap-1">
                            <span className="font-medium">Event Date</span>
                            <span>:</span>
                            <span>{formatDate(order.start_date)} – {formatDate(order.end_date)}</span>
                        </div>
                        {order.venues.length > 0 && (
                            <div className="grid grid-cols-[120px_10px_1fr] items-start gap-1">
                                <span className="font-medium">Venues</span>
                                <span>:</span>
                                <div className="flex flex-wrap gap-1">
                                    {order.venues.map((venue) => (
                                        <Badge key={venue.id} variant="outline">
                                            {venue.short || venue.name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                        {order.discount !== null && order.discount !== undefined && (
    <div className="grid grid-cols-[120px_10px_1fr] items-center gap-1">
        <span className="font-medium">Discount</span>
        <span>:</span>
        <span>{order.discount}%</span>
    </div>
)}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Customer Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="grid grid-cols-[120px_10px_1fr] items-center gap-1">
                            <span className="font-medium">Organizer</span>
                            <span>:</span>
                            <span>{order.customer.organizer}</span>
                        </div>
                        <div className="grid grid-cols-[120px_10px_1fr] items-center gap-1">
                            <span className="font-medium">Contact Person</span>
                            <span>:</span>
                            <span>{order.customer.contact_person}</span>
                        </div>
                        <div className="grid grid-cols-[120px_10px_1fr] items-center gap-1">
                            <span className="font-medium">Phone</span>
                            <span>:</span>
                            <span>{order.customer.phone}</span>
                        </div>
                        <div className="grid grid-cols-[120px_10px_1fr] items-center gap-1">
                            <span className="font-medium">Email</span>
                            <span>:</span>
                            <span>{order.customer.email}</span>
                        </div>
                        <div className="grid grid-cols-[120px_10px_1fr] items-start gap-1">
                            <span className="font-medium">Address</span>
                            <span>:</span>
                            <span>{order.customer.address}</span>
                        </div>
                        <div className="grid grid-cols-[120px_10px_1fr] items-center gap-1">
                            <span className="font-medium">K/L Status</span>
                            <span>:</span>
                            <Badge 
                                variant={order.customer.kl_status ? "default" : "secondary"}
                                className={order.customer.kl_status ? "bg-green-100 text-green-800 border-green-300" : "bg-gray-100 text-gray-800 border-gray-300"}
                            >
                                {order.customer.kl_status ? "KL" : "Non-KL"}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Schedule</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date Range</TableHead>
                                        <TableHead>Time Range</TableHead>
                                        <TableHead>Function</TableHead>
                                        <TableHead>Setup</TableHead>
                                        <TableHead className="text-right">People</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {order.schedules?.length > 0 ? (
                                        order.schedules.map((schedule) => (
                                            <TableRow key={schedule.id}>
                                                <TableCell>{formatDateRange(schedule)}</TableCell>
                                                <TableCell>
                                                    {schedule.time_start && schedule.time_end 
                                                        ? `${formatTime(schedule.time_start)} – ${formatTime(schedule.time_end)}`
                                                        : 'N/A'
                                                    }
                                                </TableCell>
                                                <TableCell>
                                                    {schedule.function 
                                                        ? (functionLabels[schedule.function] || schedule.function)
                                                        : '—'
                                                    }
                                                </TableCell>
                                                <TableCell>{schedule.setup || '—'}</TableCell>
                                                <TableCell className="text-right">
                                                    {schedule.people ? `${schedule.people} people` : '—'}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                No schedules found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">BEO Departments</h2>
                </div>
                <div className="space-y-4">
                    {order.beos?.length > 0 ? (
                        order.beos.map((beo) => (
                            <Card key={beo.id} className="overflow-hidden border-l-4 border-l-[#C38154] shadow-md hover:shadow-lg transition-shadow duration-200">
                                <CardHeader className="bg-gradient-to-r from-[#C38154]/10 to-[#C38154]/5 border-b border-[#C38154]/20">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-[#C38154]"></div>
                                                <Badge 
                                                    variant="outline" 
                                                    className="border-[#C38154] text-[#C38154] bg-[#C38154]/5 font-semibold"
                                                >
                                                    {beo.department.name}
                                                </Badge>
                                            </div>
                                            {beo.user && (
                                                <div className="flex items-center gap-3 text-sm">
                                                    <span className="text-gray-500">•</span>
                                                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[#C38154] font-medium">PIC:</span>
                                                            <span className="text-gray-700 font-medium">{beo.user.name}</span>
                                                        </div>
                                                        {beo.user.phone && (
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-gray-500 hidden sm:inline">•</span>
                                                                <span className="text-[#C38154] font-medium">📞</span>
                                                                <span className="text-gray-600 font-medium">{beo.user.phone}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                
                                <CardContent className="p-6">
                                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                                        {/* Package Details Section */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="w-2 h-2 rounded-full bg-[#C38154]"></div>
                                                <h4 className="font-semibold text-gray-800">Package Details</h4>
                                            </div>
                                            
                                            {beo.package ? (
                                                <div className="space-y-3">
                                                    <div className="p-3 bg-[#C38154]/5 border border-[#C38154]/20 rounded-lg">
                                                        <Badge 
                                                            variant="secondary" 
                                                            className="bg-[#C38154] text-white hover:bg-[#C38154]/90 mb-2"
                                                        >
                                                            {beo.package.name}
                                                        </Badge>
                                                        {beo.package.description && (
                                                            <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                                                                {beo.package.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
                                                    <span className="text-gray-500 text-sm">No package assigned</span>
                                                </div>
                                            )}

                                            {/* Notes Section */}
                                            {beo.notes && (
                                                <div className="mt-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="w-2 h-2 rounded-full bg-[#C38154]"></div>
                                                        <h4 className="font-semibold text-gray-800">Notes</h4>
                                                    </div>
                                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                                        <p className="text-sm text-gray-700 leading-relaxed">{beo.notes}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Images Section */}
                                        <div className="xl:col-span-2">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="w-2 h-2 rounded-full bg-[#C38154]"></div>
                                                <h4 className="font-semibold text-gray-800">Images</h4>
                                                {(() => {
                                                    const imageAttachments = getImageAttachments(beo.attachments);
                                                    return imageAttachments.length > 0 && (
                                                        <Badge 
                                                            variant="outline" 
                                                            className="border-[#C38154]/30 text-[#C38154] text-xs"
                                                        >
                                                            {imageAttachments.length} image{imageAttachments.length !== 1 ? 's' : ''}
                                                        </Badge>
                                                    );
                                                })()}
                                            </div>
                                            
                                            {(() => {
                                                const imageAttachments = getImageAttachments(beo.attachments);
                                                return imageAttachments.length > 0 ? (
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                                        {imageAttachments.map((attachment) => (
                                                            <div key={attachment.id} className="group">
                                                                <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border-2 border-gray-200 hover:border-[#C38154]/50 transition-all duration-200">
                                                                    <img
                                                                        src={getImageUrl(attachment)}
                                                                        alt={attachment.file_name}
                                                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 cursor-pointer"
                                                                        loading="lazy"
                                                                        onClick={() => window.open(getImageUrl(attachment), '_blank')}
                                                                        onError={(e) => {
                                                                            console.error('Failed to load BEO image:', getImageUrl(attachment));
                                                                            const target = e.currentTarget;
                                                                            target.style.display = 'none';
                                                                            const fallback = target.nextElementSibling as HTMLElement;
                                                                            if (fallback) fallback.style.display = 'flex';
                                                                        }}
                                                                    />
                                                                    <div 
                                                                        className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent flex items-center justify-center text-white" 
                                                                        style={{display: 'none'}}
                                                                    >
                                                                        <div className="text-center">
                                                                            <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-60" />
                                                                            <p className="text-xs opacity-80">Image not found</p>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {/* Image overlay with filename */}
                                                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                                        <p className="text-white text-xs font-medium truncate" title={attachment.file_name}>
                                                                            {attachment.file_name}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                
                                                                {/* Image metadata */}
                                                                <div className="mt-2 px-1">
                                                                    <p className="text-xs text-gray-600 truncate font-medium" title={attachment.file_name}>
                                                                        {attachment.file_name}
                                                                    </p>
                                                                    <div className="flex items-center gap-1 mt-1">
                                                                        <div className="w-1 h-1 rounded-full bg-[#C38154]"></div>
                                                                        <p className="text-xs text-[#C38154] font-medium">
                                                                            {formatDate(attachment.created_at, 'dd/MM/yy')}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                                                        <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                                                        <p className="text-gray-500 text-sm font-medium">No images found</p>
                                                        <p className="text-gray-400 text-xs mt-1">Images will appear here once uploaded</p>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Card>
                            <CardContent className="text-center py-8">
                                <p className="text-gray-500">No BEO departments found.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Order Images</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {(() => {
                            const imageAttachments = getImageAttachments(order.attachments);
                            return imageAttachments.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {imageAttachments.map((attachment) => (
                                        <div key={attachment.id} className="group">
                                            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border">
                                                <img
                                                    src={getImageUrl(attachment)}
                                                    alt={attachment.file_name}
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-105 cursor-pointer"
                                                    loading="lazy"
                                                    onClick={() => window.open(getImageUrl(attachment), '_blank')}
                                                    onError={(e) => {
                                                        console.error('Failed to load order image:', getImageUrl(attachment));
                                                        const target = e.currentTarget;
                                                        target.style.display = 'none';
                                                        const fallback = target.nextElementSibling as HTMLElement;
                                                        if (fallback) fallback.style.display = 'flex';
                                                    }}
                                                />
                                                <div 
                                                    className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm" 
                                                    style={{display: 'none'}}
                                                >
                                                    <div className="text-center">
                                                        <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                                                        <p>Image not found</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="mt-2 text-xs text-gray-600 truncate" title={attachment.file_name}>
                                                {attachment.file_name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatDate(attachment.created_at, 'dd/MM/yy')}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                                    <p className="text-gray-500">No images found</p>
                                </div>
                            );
                        })()}
                    </CardContent>
                </Card>

                <div className="flex items-center gap-3">
                    
                    <Link href={route('pic.dashboard')}>
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Button>
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
}