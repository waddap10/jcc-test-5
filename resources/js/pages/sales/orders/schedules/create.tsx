import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { parseISO, format, isWithinInterval, parse, addHours, startOfDay, endOfDay } from 'date-fns';
import Calendar, { CalendarProps } from 'react-calendar';
import DatePicker from 'react-datepicker';
import 'react-calendar/dist/Calendar.css';
import 'react-datepicker/dist/react-datepicker.css';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

interface Schedule {
    id: number;
    start_date: string;
    end_date: string;
}

interface Order {
    id: number;
    event_name: string;
    custom_code: string;
    start_date: string;
    end_date: string;
    schedules?: Schedule[];
}

interface ScheduleForm {
    [key: string]: string;
    start_date: string;
    end_date: string;
    time_start: string;
    time_end: string;
    function: string;
    setup: string;
    people: string;
}

interface PageProps {
    order: Order;
    flash?: { message?: string };
    errors: Record<string, string>;
    [key: string]: unknown;
}

export default function ScheduleCreate() {
    const { order, flash = {}, errors = {} } = usePage<PageProps>().props;

    const { data, setData, post, processing } = useForm<{
        schedules: ScheduleForm[];
    }>({
        schedules: [{
            start_date: '',
            end_date: '',
            time_start: '',
            time_end: '',
            function: '',
            setup: '',
            people: '',
        }],
    });

    const [selectedRanges, setSelectedRanges] = useState<[Date | null, Date | null][]>(
        data.schedules.map((sch) => [
            sch.start_date ? parseISO(sch.start_date) : null,
            sch.end_date ? parseISO(sch.end_date) : null,
        ])
    );

    useEffect(() => {
        setSelectedRanges((prev) => {
            const next: [Date | null, Date | null][] = data.schedules.map(
                (sch, i) => prev[i] || [
                    sch.start_date ? parseISO(sch.start_date) : null,
                    sch.end_date ? parseISO(sch.end_date) : null,
                ]
            );
            return next;
        });
    }, [data.schedules.length]);

    const blockedIntervals = (order.schedules ?? []).map((s) => ({
        start: parseISO(s.start_date),
        end: parseISO(s.end_date)
    }));

    // Parse event date range
    const eventStartDate = order.start_date ? startOfDay(parseISO(order.start_date)) : null;
    const eventEndDate = order.end_date ? endOfDay(parseISO(order.end_date)) : null;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Orders', href: route('sales.orders.index') },
        { title: order.event_name, href: route('sales.orders.show', order.id) },
        { title: 'Add Schedule', href: '#' },
    ];

    const updateSchedule = (idx: number, field: keyof ScheduleForm, value: string) => {
        const next = data.schedules.map((row, i) =>
            i === idx ? { ...row, [field]: value } : row
        );
        setData('schedules', next);
    };

    const setEntireRange = (idx: number, start: Date, end: Date) => {
        const s = format(start, 'yyyy-MM-dd');
        const e = format(end, 'yyyy-MM-dd');

        const nextSchedules = data.schedules.map((row, i) =>
            i === idx ? { ...row, start_date: s, end_date: e } : row
        );

        setData('schedules', nextSchedules);

        setSelectedRanges((prev) => {
            const copy = [...prev];
            copy[idx] = [start, end];
            return copy;
        });
    };

    const handleRangeChange = (idx: number): CalendarProps['onChange'] => {
        return (value) => {
            if (value instanceof Date) {
                setEntireRange(idx, value, value);
            } else if (
                Array.isArray(value) &&
                value[0] instanceof Date &&
                value[1] instanceof Date
            ) {
                setEntireRange(idx, value[0], value[1]);
            }
        };
    };

    const filterEndTimes = (time: Date, startTime: string) => {
        if (!startTime) return false;
        
        const startDate = parse(startTime, 'HH:mm', new Date());
        const maxEndDate = addHours(startDate, 12);
        
        if (maxEndDate.getDate() > startDate.getDate()) {
            return time > startDate || time <= maxEndDate;
        } else {
            return time > startDate && time <= maxEndDate;
        }
    };

    const addSchedule = () => {
        setData('schedules', [
            ...data.schedules,
            {
                start_date: '',
                end_date: '',
                time_start: '',
                time_end: '',
                function: '',
                setup: '',
                people: '',
            },
        ]);
        setSelectedRanges((prev) => [...prev, [null, null]]);
    };

    const removeSchedule = (idx: number) => {
        setData('schedules', data.schedules.filter((_, i) => i !== idx));
        setSelectedRanges((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('sales.orders.schedules.store', order.id));
    };

    const isDateDisabled = (date: Date) => {
        if (!eventStartDate || !eventEndDate) return false;
        
        const checkDate = startOfDay(date);
        return checkDate < eventStartDate || checkDate > eventEndDate;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Add Schedule - ${order.event_name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {flash?.message && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        {flash.message}
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Add Schedule</h1>
                        <p className="text-muted-foreground">{order.event_name} ({order.custom_code})</p>
                        {eventStartDate && eventEndDate && (
                            <p className="text-sm text-blue-600 mt-1">
                                Event Period: {format(eventStartDate, 'dd/MM/yyyy')} - {format(eventEndDate, 'dd/MM/yyyy')}
                            </p>
                        )}
                    </div>
                    <Link href={route('sales.orders.show', order.id)}>
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Order
                        </Button>
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {data.schedules.map((sch, idx) => (
                        <Card key={idx}>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Schedule #{idx + 1}</CardTitle>
                                {data.schedules.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => removeSchedule(idx)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div>
                                        <Label className="text-base font-semibold">Select Date Range</Label>
                                        <p className="text-xs text-muted-foreground mb-2">
                                            Dates outside the event period are disabled
                                        </p>
                                        <div className="mt-2">
                                            <Calendar
                                                selectRange
                                                value={selectedRanges[idx] as any}
                                                onChange={handleRangeChange(idx)}
                                                minDate={eventStartDate || undefined}
                                                maxDate={eventEndDate || undefined}
                                                className="rounded-md border"
                                                tileDisabled={({ date, view }) => {
                                                    if (view !== 'month') return false;
                                                    return isDateDisabled(date);
                                                }}
                                                tileClassName={({ date, view }) => {
                                                    if (view !== 'month') return '';
                                                    
                                                    // Style disabled dates
                                                    if (isDateDisabled(date)) {
                                                        return 'react-calendar__tile--disabled opacity-25 cursor-not-allowed bg-gray-100 text-gray-400';
                                                    }
                                                    
                                                    // Style existing schedule dates
                                                    if (blockedIntervals.some((i) => isWithinInterval(date, i))) {
                                                        return 'bg-yellow-200 text-yellow-800';
                                                    }
                                                    
                                                    // Style currently selected range
                                                    const [s, e] = selectedRanges[idx] || [];
                                                    if (s && e && date >= s && date <= e) {
                                                        return 'bg-blue-200 text-blue-800';
                                                    }
                                                    
                                                    return '';
                                                }}
                                            />
                                        </div>
                                        {errors[`schedules.${idx}.start_date`] && (
                                            <p className="text-red-600 text-sm mt-1">
                                                {errors[`schedules.${idx}.start_date`]}
                                            </p>
                                        )}
                                        {errors[`schedules.${idx}.end_date`] && (
                                            <p className="text-red-600 text-sm mt-1">
                                                {errors[`schedules.${idx}.end_date`]}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor={`start-time-${idx}`}>Start Time</Label>
                                                <DatePicker
                                                    id={`start-time-${idx}`}
                                                    selected={
                                                        sch.time_start
                                                            ? parse(sch.time_start, 'HH:mm', new Date())
                                                            : null
                                                    }
                                                    onChange={(date) => {
                                                        if (date) {
                                                            const timeString = format(date, 'HH:mm');
                                                            const next = data.schedules.map((row, i) =>
                                                                i === idx 
                                                                    ? { ...row, time_start: timeString, time_end: '' }
                                                                    : row
                                                            );
                                                            setData('schedules', next);
                                                        }
                                                    }}
                                                    showTimeSelect
                                                    showTimeSelectOnly
                                                    timeIntervals={15}
                                                    dateFormat="HH:mm"
                                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                    placeholderText="Select start time"
                                                />
                                                {errors[`schedules.${idx}.time_start`] && (
                                                    <p className="text-red-600 text-sm mt-1">
                                                        {errors[`schedules.${idx}.time_start`]}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <Label htmlFor={`end-time-${idx}`}>End Time</Label>
                                                <DatePicker
                                                    id={`end-time-${idx}`}
                                                    selected={
                                                        sch.time_end
                                                            ? parse(sch.time_end, 'HH:mm', new Date())
                                                            : null
                                                    }
                                                    onChange={(date) => {
                                                        if (date) {
                                                            updateSchedule(idx, 'time_end', format(date, 'HH:mm'));
                                                        }
                                                    }}
                                                    showTimeSelect
                                                    showTimeSelectOnly
                                                    timeIntervals={15}
                                                    dateFormat="HH:mm"
                                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                    placeholderText="Select end time"
                                                    disabled={!sch.time_start}
                                                    filterTime={(time) => filterEndTimes(time, sch.time_start)}
                                                />
                                                {errors[`schedules.${idx}.time_end`] && (
                                                    <p className="text-red-600 text-sm mt-1">
                                                        {errors[`schedules.${idx}.time_end`]}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <Label>Selected Range</Label>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {sch.start_date && sch.end_date 
                                                    ? `${format(parseISO(sch.start_date), 'dd/MM/yyyy')} - ${format(parseISO(sch.end_date), 'dd/MM/yyyy')}`
                                                    : 'No date selected'
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor={`function-${idx}`}>Function</Label>
                                            <Select
                                                value={sch.function}
                                                onValueChange={(value) => updateSchedule(idx, 'function', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select function" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="1">Loading In</SelectItem>
                                                    <SelectItem value="2">Show</SelectItem>
                                                    <SelectItem value="3">Loading Out</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors[`schedules.${idx}.function`] && (
                                                <p className="text-red-600 text-sm mt-1">
                                                    {errors[`schedules.${idx}.function`]}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <Label htmlFor={`people-${idx}`}>Number of People</Label>
                                            <Input
                                                id={`people-${idx}`}
                                                type="number"
                                                min="1"
                                                value={sch.people}
                                                onChange={(e) => updateSchedule(idx, 'people', e.target.value)}
                                                placeholder="Enter number of people"
                                            />
                                            {errors[`schedules.${idx}.people`] && (
                                                <p className="text-red-600 text-sm mt-1">
                                                    {errors[`schedules.${idx}.people`]}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    <div className="flex items-center justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={addSchedule}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Another Schedule
                        </Button>

                        <div className="flex items-center gap-3">
                            <Link href={route('sales.orders.show', order.id)}>
                                <Button variant="outline">Cancel</Button>
                            </Link>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Creating...' : 'Create Schedules'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}