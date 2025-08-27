import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import { isWithinInterval, parseISO, format } from 'date-fns';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CustomerCombobox } from '@/components/customer-combobox';
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft, ArrowRight } from 'lucide-react';

type Venue = {
    id: number;
    name: string;
};

type Booking = {
    venue_id: number;
    start_date: string;
    end_date: string;
};

type Customer = {
    id: number;
    organizer: string;
};

type Event = {
    id: number;
    event_type: string;
    code: string;
};

type CustomerData = {
    organizer: string;
    address: string;
    contact_person: string;
    phone: string;
    email: string;
    kl_status: boolean;
};

type OrderFormData = {
    venues: number[];
    start_date: string;
    end_date: string;
    customerOption: 'existing' | 'new';
    existing_customer_id: number | '';
    event_name: string;
    event_id: number | '';
    discount: number;
    customer: CustomerData;
};

type Props = {
    venues: Venue[];
    bookings: Booking[];
    customers: Customer[];
    events: Event[];
    flash?: { message?: string; error?: string };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Orders', href: route('sales.orders.index') },
    { title: 'Create', href: '' },
];

export default function OrdersCreate({ venues, bookings, customers, events, flash }: Props) {
    const [step, setStep] = useState(1);
    const [conflictError, setConflictError] = useState<string | null>(null);

    const { data, setData, processing, errors } = useForm<OrderFormData>({
        venues: [],
        start_date: '',
        end_date: '',
        customerOption: 'existing',
        existing_customer_id: '',
        event_name: '',
        event_id: '',
        discount: 0,
        customer: {
            organizer: '',
            address: '',
            contact_person: '',
            phone: '',
            email: '',
            kl_status: false,
        },
    });

    // Type the errors object properly
    const formErrors = errors as Record<string, string>;

    const blockedMap = bookings.reduce<Record<number, { start: Date; end: Date }[]>>((acc, b) => {
        const start = parseISO(b.start_date);
        const end = parseISO(b.end_date);
        acc[b.venue_id] = acc[b.venue_id] || [];
        acc[b.venue_id].push({ start, end });
        return acc;
    }, {});

    const globalRange: [Date, Date] | null = data.start_date && data.end_date
        ? [parseISO(data.start_date), parseISO(data.end_date)]
        : null;

    const hasBookingConflicts = (): { hasConflict: boolean; conflictingVenues: string[] } => {
        if (!data.start_date || !data.end_date || !data.venues.length) {
            return { hasConflict: false, conflictingVenues: [] };
        }

        const startDate = parseISO(data.start_date);
        const endDate = parseISO(data.end_date);
        const conflictingVenues: string[] = [];

        data.venues.forEach(venueId => {
            const venueBookings = blockedMap[venueId] || [];
            const hasConflict = venueBookings.some(booking => {
                return (
                    (startDate >= booking.start && startDate <= booking.end) ||
                    (endDate >= booking.start && endDate <= booking.end) ||
                    (startDate <= booking.start && endDate >= booking.end)
                );
            });

            if (hasConflict) {
                const venueName = venues.find(v => v.id === venueId)?.name || `Venue ${venueId}`;
                conflictingVenues.push(venueName);
            }
        });

        return { hasConflict: conflictingVenues.length > 0, conflictingVenues };
    };

    const handleNext = () => {
        const { hasConflict, conflictingVenues } = hasBookingConflicts();

        if (hasConflict) {
            setConflictError(`Booking conflict with: ${conflictingVenues.join(', ')}`);
            return;
        }

        setConflictError(null);
        setStep(2);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            venues: data.venues,
            start_date: data.start_date,
            end_date: data.end_date,
            event_name: data.event_name,
            event_id: data.event_id,
            discount: data.discount,
            customerOption: data.customerOption,
            ...(data.customerOption === 'existing'
                ? { existing_customer_id: data.existing_customer_id }
                : { customer: data.customer }
            )
        };

        router.post(route('sales.orders.store'), payload);
    };

    const discountOptions = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    const customerFields = ['organizer', 'address', 'contact_person', 'phone', 'email'] as const;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Order" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {flash?.message && (
                    <Alert>
                        <AlertTitle>Success</AlertTitle>
                        <AlertDescription>{flash.message}</AlertDescription>
                    </Alert>
                )}

                {flash?.error && (
                    <Alert variant="destructive">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{flash.error}</AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Create New Order - Step {step} of 2</CardTitle>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-[#C38154] h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(step / 2) * 100}%` }}
                            />
                        </div>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {step === 1 && (
                                <div className="space-y-6">
                                    <div>
                                        <Label className="text-base font-medium">Select Venues</Label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                                            {venues.map((venue) => (
                                                <div key={venue.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`venue-${venue.id}`}
                                                        checked={data.venues.includes(venue.id)}
                                                        onCheckedChange={(checked) => {
                                                            setData('venues', checked
                                                                ? [...data.venues, venue.id]
                                                                : data.venues.filter(id => id !== venue.id)
                                                            );
                                                        }}
                                                    />
                                                    <Label htmlFor={`venue-${venue.id}`}>{venue.name}</Label>
                                                </div>
                                            ))}
                                        </div>
                                        {formErrors.venues && <p className="text-sm text-red-600 mt-1">{formErrors.venues}</p>}
                                    </div>

                                    {data.venues.length > 0 && (
                                        <div>
                                            <Label className="text-base font-medium">Select Date Range</Label>
                                            <div className="grid gap-4 mt-3" style={{ gridTemplateColumns: `repeat(${Math.min(data.venues.length, 3)}, minmax(0, 1fr))` }}>
                                                {data.venues.map((venueId) => {
                                                    const blocked = blockedMap[venueId] || [];
                                                    const venueName = venues.find(v => v.id === venueId)?.name;

                                                    return (
                                                        <div key={venueId} className="border rounded-lg p-4">
                                                            <h4 className="font-medium mb-3">{venueName}</h4>
                                                            <Calendar
                                                                selectRange
                                                                value={globalRange}
                                                                onChange={(value) => {
                                                                    setConflictError(null);
                                                                    if (!Array.isArray(value) || value.length !== 2) return;
                                                                    const [start, end] = value as [Date, Date];
                                                                    setData('start_date', format(start, 'yyyy-MM-dd'));
                                                                    setData('end_date', format(end, 'yyyy-MM-dd'));
                                                                }}
                                                                tileClassName={({ date, view }) => {
                                                                    if (view !== 'month') return undefined;
                                                                    const isBlocked = blocked.some(({ start, end }) =>
                                                                        isWithinInterval(date, { start, end })
                                                                    );
                                                                    return isBlocked ? 'bg-red-200 text-red-800 cursor-not-allowed' : undefined;
                                                                }}
                                                                tileDisabled={({ date, view }) =>
                                                                    view === 'month' && blocked.some(({ start, end }) =>
                                                                        isWithinInterval(date, { start, end })
                                                                    )
                                                                }
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {conflictError && (
                                        <Alert variant="destructive">
                                            <AlertTitle>Booking Conflict</AlertTitle>
                                            <AlertDescription>{conflictError}</AlertDescription>
                                        </Alert>
                                    )}

                                    <div className="flex justify-end">
                                        <Button
                                            type="button"
                                            onClick={handleNext}
                                            disabled={!data.venues.length || !data.start_date || !data.end_date}
                                        >
                                            Next <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="event_name">Event Name</Label>
                                            <Input
                                                id="event_name"
                                                value={data.event_name}
                                                onChange={e => setData('event_name', e.target.value)}
                                                placeholder="Enter event name"
                                            />
                                            {formErrors.event_name && <p className="text-sm text-red-600">{formErrors.event_name}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="event_id">Event Type</Label>
                                            <Select value={data.event_id.toString()} onValueChange={(value) => setData('event_id', parseInt(value))}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select event type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {events.map((event) => (
                                                        <SelectItem key={event.id} value={event.id.toString()}>
                                                            <div className="flex justify-between items-center w-full">
                                                                <span>{event.event_type}</span>
                                                                <span className="text-sm text-muted-foreground ml-2">({event.code})</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {formErrors.event_id && <p className="text-sm text-red-600">{formErrors.event_id}</p>}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="discount">Discount (%)</Label>
                                            <Select value={data.discount.toString()} onValueChange={(value) => setData('discount', parseInt(value))}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select discount" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {discountOptions.map((percentage) => (
                                                        <SelectItem key={percentage} value={percentage.toString()}>
                                                            {percentage}%
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="text-base font-medium">Customer Information</Label>
                                        <RadioGroup
                                            value={data.customerOption}
                                            onValueChange={(value: 'existing' | 'new') => setData('customerOption', value)}
                                            className="flex space-x-6"
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="existing" id="existing" />
                                                <Label htmlFor="existing">Use Existing Customer</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="new" id="new" />
                                                <Label htmlFor="new">Add New Customer</Label>
                                            </div>
                                        </RadioGroup>

                                        {data.customerOption === 'existing' ? (
                                            <div className="space-y-2">
                                                <Label>Select Customer</Label>
                                                <CustomerCombobox
                                                    customers={customers}
                                                    value={data.existing_customer_id}
                                                    onChange={(id) => setData('existing_customer_id', id)}
                                                />
                                                {formErrors.existing_customer_id && <p className="text-sm text-red-600">{formErrors.existing_customer_id}</p>}
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {customerFields.map((field) => (
                                                    <div key={field} className="space-y-2">
                                                        <Label htmlFor={field}>
                                                            {field.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                                        </Label>
                                                        <Input
                                                            id={field}
                                                            value={data.customer[field]}
                                                            onChange={(e) => setData('customer', { ...data.customer, [field]: e.target.value })}
                                                            placeholder={`Enter ${field.replace('_', ' ')}`}
                                                        />
                                                        {formErrors[`customer.${field}`] && <p className="text-sm text-red-600">{formErrors[`customer.${field}`]}</p>}
                                                    </div>
                                                ))}

                                                <div className="space-y-2 md:col-span-2">
                                                    <Label>K/L Status</Label>
                                                    <RadioGroup
                                                        value={data.customer.kl_status.toString()}
                                                        onValueChange={(value) => setData('customer', { ...data.customer, kl_status: value === 'true' })}
                                                        className="flex space-x-6"
                                                    >
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem value="true" id="kl-yes" />
                                                            <Label htmlFor="kl-yes" className="text-green-600">Yes</Label>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <RadioGroupItem value="false" id="kl-no" />
                                                            <Label htmlFor="kl-no" className="text-red-600">No</Label>
                                                        </div>
                                                    </RadioGroup>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between pt-6">
                                        <Button type="button" variant="outline" onClick={() => setStep(1)}>
                                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                                        </Button>
                                        <Button type="submit" disabled={processing}>
                                            {processing ? 'Creating...' : 'Create Order'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}