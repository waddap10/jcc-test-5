import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { parseISO, format, isWithinInterval, parse, addHours } from 'date-fns';
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
import { ArrowLeft, Trash2 } from 'lucide-react';

interface Schedule {
    id: number;
    start_date: string;
    end_date: string;
    time_start: string;
    time_end: string;
    function: string;
    people: string;
}

interface Order {
    id: number;
    event_name: string;
    custom_code: string;
    start_date?: string;
    end_date?: string;
}

interface ScheduleForm {
    [key: string]: string;
    start_date: string;
    end_date: string;
    time_start: string;
    time_end: string;
    function: string;
    people: string;
}

interface PageProps {
    order: Order;
    schedules: Schedule[];
    flash?: { message?: string };
    errors: Record<string, string>;
}

export default function ScheduleEdit() {
    const { order, schedules, flash = {}, errors = {} } = usePage<PageProps>().props;

    // Convert existing schedules to form format with better handling
    const initialSchedules: ScheduleForm[] = schedules.length > 0 
        ? schedules.map(schedule => {
            console.log('Raw schedule from DB:', schedule); // Debug log
            
            // Handle time conversion from full DateTime to HH:mm
            let time_start = '';
            let time_end = '';
            
            if (schedule.time_start) {
                try {
                    if (typeof schedule.time_start === 'string') {
                        if (schedule.time_start.includes('T')) {
                            // Handle full DateTime format: "2025-08-21T01:15:00.000000Z"
                            const dateTime = parseISO(schedule.time_start);
                            time_start = format(dateTime, 'HH:mm');
                        } else if (schedule.time_start.includes(':')) {
                            // Handle time format: "08:15:00"
                            time_start = schedule.time_start.substring(0, 5);
                        }
                    }
                } catch (error) {
                    console.log('Error parsing start time:', error);
                    time_start = '';
                }
            }
            
            if (schedule.time_end) {
                try {
                    if (typeof schedule.time_end === 'string') {
                        if (schedule.time_end.includes('T')) {
                            // Handle full DateTime format: "2025-08-21T01:30:00.000000Z"
                            const dateTime = parseISO(schedule.time_end);
                            time_end = format(dateTime, 'HH:mm');
                        } else if (schedule.time_end.includes(':')) {
                            // Handle time format: "08:30:00"
                            time_end = schedule.time_end.substring(0, 5);
                        }
                    }
                } catch (error) {
                    console.log('Error parsing end time:', error);
                    time_end = '';
                }
            }

            // Handle date conversion from full DateTime to YYYY-MM-DD
            let start_date = '';
            let end_date = '';
            
            if (schedule.start_date) {
                try {
                    if (typeof schedule.start_date === 'string') {
                        if (schedule.start_date.includes('T')) {
                            // Handle full DateTime format
                            const dateTime = parseISO(schedule.start_date);
                            start_date = format(dateTime, 'yyyy-MM-dd');
                        } else {
                            // Handle date format: "2025-09-01"
                            start_date = schedule.start_date;
                        }
                    }
                } catch (error) {
                    console.log('Error parsing start date:', error);
                    start_date = '';
                }
            }
            
            if (schedule.end_date) {
                try {
                    if (typeof schedule.end_date === 'string') {
                        if (schedule.end_date.includes('T')) {
                            // Handle full DateTime format
                            const dateTime = parseISO(schedule.end_date);
                            end_date = format(dateTime, 'yyyy-MM-dd');
                        } else {
                            // Handle date format: "2025-09-01"
                            end_date = schedule.end_date;
                        }
                    }
                } catch (error) {
                    console.log('Error parsing end date:', error);
                    end_date = '';
                }
            }
            
            const result = {
                start_date: start_date,
                end_date: end_date,
                time_start: time_start,
                time_end: time_end,
                function: schedule.function?.toString() || '',
                people: schedule.people?.toString() || '',
            };
            
            console.log('Processed schedule:', result); // Debug log
            return result;
        })
        : [{
            start_date: '',
            end_date: '',
            time_start: '',
            time_end: '',
            function: '',
            people: '',
        }];

    console.log('Final initial schedules:', initialSchedules); // Debug log

    const { data, setData, put, processing } = useForm<{
        schedules: ScheduleForm[];
    }>({
        schedules: initialSchedules,
    });

    // Initialize selected ranges from the loaded data
    const [selectedRanges, setSelectedRanges] = useState<[Date | null, Date | null][]>(() => 
        initialSchedules.map((sch) => [
            sch.start_date && sch.start_date !== '' ? parseISO(sch.start_date) : null,
            sch.end_date && sch.end_date !== '' ? parseISO(sch.end_date) : null,
        ])
    );

    // Update selected ranges when schedules length changes
    useEffect(() => {
        if (selectedRanges.length !== data.schedules.length) {
            setSelectedRanges(prev => {
                const newRanges = [...prev];
                // Add missing ranges
                while (newRanges.length < data.schedules.length) {
                    const sch = data.schedules[newRanges.length];
                    newRanges.push([
                        sch.start_date && sch.start_date !== '' ? parseISO(sch.start_date) : null,
                        sch.end_date && sch.end_date !== '' ? parseISO(sch.end_date) : null,
                    ]);
                }
                // Remove extra ranges
                return newRanges.slice(0, data.schedules.length);
            });
        }
    }, [data.schedules.length]);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Orders', href: route('sales.orders.index') },
        { title: order.event_name, href: route('sales.orders.show', order.id) },
        { title: 'Edit Schedule', href: '#' },
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
        
        try {
            const startDate = parse(startTime, 'HH:mm', new Date());
            const maxEndDate = addHours(startDate, 12);
            
            if (maxEndDate.getDate() > startDate.getDate()) {
                return time > startDate || time <= maxEndDate;
            } else {
                return time > startDate && time <= maxEndDate;
            }
        } catch (error) {
            return false;
        }
    };

    const removeSchedule = (idx: number) => {
        if (data.schedules.length <= 1) return; // Prevent removing the last schedule
        setData('schedules', data.schedules.filter((_, i) => i !== idx));
        setSelectedRanges((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Ensure all required data is present before submitting
        const formattedSchedules = data.schedules.map(schedule => ({
            start_date: schedule.start_date || '',
            end_date: schedule.end_date || '',
            time_start: schedule.time_start || '',
            time_end: schedule.time_end || '',
            function: schedule.function || '',
            people: schedule.people || '',
        }));
        
        console.log('Submitting formatted schedules:', formattedSchedules);
        
        put(route('sales.orders.schedules.update', order.id), {
            data: {
                schedules: formattedSchedules
            },
            onSuccess: () => {
                console.log('Schedules updated successfully');
            },
            onError: (errors) => {
                console.log('Validation errors:', errors);
            }
        });
    };

    // Helper function to get function label
    const getFunctionLabel = (value: string) => {
        switch (value) {
            case '1': return 'Loading In';
            case '2': return 'Show';
            case '3': return 'Loading Out';
            default: return '';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Schedule - ${order.event_name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {flash?.message && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                        {flash.message}
                    </div>
                )}

                {/* Display validation errors */}
                {Object.keys(errors).length > 0 && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                        <h4 className="font-semibold">Please fix the following errors:</h4>
                        <ul className="list-disc list-inside mt-2">
                            {Object.entries(errors).map(([key, message]) => (
                                <li key={key}>{message}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Edit Schedule</h1>
                        <p className="text-muted-foreground">{order.event_name} ({order.custom_code})</p>
                        {order.start_date && order.end_date && (
                            <p className="text-sm text-muted-foreground">
                                Event Period: {format(parseISO(order.start_date), 'dd/MM/yyyy')} - {format(parseISO(order.end_date), 'dd/MM/yyyy')}
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
                    {data.schedules.map((sch, idx) => {
                        // Get original schedule data for comparison
                        const originalSchedule = schedules[idx];
                        
                        return (
                            <Card key={idx}>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>
                                        Schedule #{idx + 1}
                                        {sch.function && (
                                            <span className="ml-2 text-sm font-normal text-muted-foreground">
                                                - {getFunctionLabel(sch.function)}
                                            </span>
                                        )}
                                    </CardTitle>
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
                                    {/* Debug section - remove this after fixing */}
                                    {process.env.NODE_ENV === 'development' && (
                                        <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                                            <strong>Debug Info:</strong><br />
                                            Raw data: {JSON.stringify(originalSchedule, null, 2)}<br />
                                            Form data: {JSON.stringify(sch, null, 2)}
                                        </div>
                                    )}
                                    
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* Calendar Column */}
                                        <div>
                                            <Label className="text-base font-semibold">Select Date Range</Label>
                                            <div className="mt-2">
                                                <Calendar
                                                    key={`calendar-${idx}-${sch.start_date}-${sch.end_date}`} // Force re-render when dates change
                                                    selectRange
                                                    value={selectedRanges[idx] as any}
                                                    onChange={handleRangeChange(idx)}
                                                    minDate={order.start_date ? parseISO(order.start_date) : undefined}
                                                    maxDate={order.end_date ? parseISO(order.end_date) : undefined}
                                                    className="rounded-md border"
                                                    tileDisabled={({ date }) => {
                                                        // Only disable dates outside order period
                                                        if (order.start_date && order.end_date) {
                                                            const eventStart = parseISO(order.start_date);
                                                            const eventEnd = parseISO(order.end_date);
                                                            return date < eventStart || date > eventEnd;
                                                        }
                                                        return false;
                                                    }}
                                                    tileClassName={({ date, view }) => {
                                                        if (view !== 'month') return;
                                                        
                                                        // Highlight current selection
                                                        const [s, e] = selectedRanges[idx] || [];
                                                        if (s && e && date >= s && date <= e) {
                                                            return 'bg-blue-200 text-blue-800';
                                                        }
                                                    }}
                                                />
                                                <div className="mt-2 text-xs text-muted-foreground space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-3 h-3 bg-blue-200 rounded"></div>
                                                        <span>Selected dates</span>
                                                    </div>
                                                    {order.start_date && order.end_date && (
                                                        <div className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                                                            <strong>Event Period:</strong><br />
                                                            {format(parseISO(order.start_date), 'dd/MM/yyyy')} - {format(parseISO(order.end_date), 'dd/MM/yyyy')}
                                                        </div>
                                                    )}
                                                    {sch.start_date && sch.end_date && (
                                                        <div className="text-xs text-blue-600 mt-1 p-2 bg-blue-50 rounded">
                                                            <strong>Current Selection:</strong><br />
                                                            {format(parseISO(sch.start_date), 'dd/MM/yyyy')} - {format(parseISO(sch.end_date), 'dd/MM/yyyy')}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Time and Info Column */}
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label htmlFor={`start-time-${idx}`}>Start Time</Label>
                                                    <DatePicker
                                                        key={`start-time-${idx}-${sch.time_start}`}
                                                        id={`start-time-${idx}`}
                                                        selected={
                                                            sch.time_start && sch.time_start !== ''
                                                                ? (() => {
                                                                    try {
                                                                        console.log(`Parsing start time for ${idx}:`, sch.time_start);
                                                                        // Handle HH:mm format (should be already converted)
                                                                        if (sch.time_start.match(/^\d{1,2}:\d{2}$/)) {
                                                                            const parsed = parse(sch.time_start, 'HH:mm', new Date());
                                                                            console.log(`Parsed start time:`, parsed);
                                                                            return parsed;
                                                                        }
                                                                        return null;
                                                                    } catch (error) {
                                                                        console.log('Error parsing start time:', sch.time_start, error);
                                                                        return null;
                                                                    }
                                                                })()
                                                                : null
                                                        }
                                                        onChange={(date) => {
                                                            if (date) {
                                                                const timeString = format(date, 'HH:mm');
                                                                console.log('Start time changed to:', timeString);
                                                                updateSchedule(idx, 'time_start', timeString);
                                                            }
                                                        }}
                                                        showTimeSelect
                                                        showTimeSelectOnly
                                                        timeIntervals={15}
                                                        dateFormat="HH:mm"
                                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                        placeholderText="Select start time"
                                                    />
                                                    {sch.time_start && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Current: {sch.time_start}
                                                        </p>
                                                    )}
                                                    {errors[`schedules.${idx}.time_start`] && (
                                                        <p className="text-red-600 text-xs mt-1">
                                                            {errors[`schedules.${idx}.time_start`]}
                                                        </p>
                                                    )}
                                                </div>

                                                <div>
                                                    <Label htmlFor={`end-time-${idx}`}>End Time</Label>
                                                    <DatePicker
                                                        key={`end-time-${idx}-${sch.time_end}`}
                                                        id={`end-time-${idx}`}
                                                        selected={
                                                            sch.time_end && sch.time_end !== ''
                                                                ? (() => {
                                                                    try {
                                                                        console.log(`Parsing end time for ${idx}:`, sch.time_end);
                                                                        // Handle HH:mm format (should be already converted)
                                                                        if (sch.time_end.match(/^\d{1,2}:\d{2}$/)) {
                                                                            const parsed = parse(sch.time_end, 'HH:mm', new Date());
                                                                            console.log(`Parsed end time:`, parsed);
                                                                            return parsed;
                                                                        }
                                                                        return null;
                                                                    } catch (error) {
                                                                        console.log('Error parsing end time:', sch.time_end, error);
                                                                        return null;
                                                                    }
                                                                })()
                                                                : null
                                                        }
                                                        onChange={(date) => {
                                                            if (date) {
                                                                const timeString = format(date, 'HH:mm');
                                                                console.log('End time changed to:', timeString);
                                                                updateSchedule(idx, 'time_end', timeString);
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
                                                    {sch.time_end && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Current: {sch.time_end}
                                                        </p>
                                                    )}
                                                    {errors[`schedules.${idx}.time_end`] && (
                                                        <p className="text-red-600 text-xs mt-1">
                                                            {errors[`schedules.${idx}.time_end`]}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Original Schedule Display */}
                                            {originalSchedule && (
                                                <div>
                                                    <Label>Original Schedule</Label>
                                                    <div className="mt-1 p-2 bg-gray-50 rounded border text-sm">
                                                        <div className="font-medium text-gray-700">
                                                            {originalSchedule.start_date && originalSchedule.end_date
                                                                ? `${format(parseISO(originalSchedule.start_date), 'dd/MM/yyyy')} - ${format(parseISO(originalSchedule.end_date), 'dd/MM/yyyy')}`
                                                                : 'No dates set'
                                                            }
                                                        </div>
                                                        {originalSchedule.time_start && originalSchedule.time_end && (
                                                            <div className="text-muted-foreground text-xs">
                                                                {originalSchedule.time_start} - {originalSchedule.time_end}
                                                            </div>
                                                        )}
                                                        {originalSchedule.function && (
                                                            <div className="text-muted-foreground text-xs">
                                                                {getFunctionLabel(originalSchedule.function)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* New Selected Range Display */}
                                            <div>
                                                <Label>New Selected Range</Label>
                                                <div className="mt-1 p-2 bg-blue-50 rounded border text-sm">
                                                    {sch.start_date && sch.end_date && sch.start_date !== '' && sch.end_date !== ''
                                                        ? (
                                                            <div>
                                                                <div className="font-medium text-blue-800">
                                                                    {format(parseISO(sch.start_date), 'dd/MM/yyyy')} - {format(parseISO(sch.end_date), 'dd/MM/yyyy')}
                                                                </div>
                                                                {sch.time_start && sch.time_end && (
                                                                    <div className="text-blue-600 text-xs">
                                                                        {sch.time_start} - {sch.time_end}
                                                                    </div>
                                                                )}
                                                                {sch.function && (
                                                                    <div className="text-blue-600 text-xs">
                                                                        {getFunctionLabel(sch.function)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )
                                                        : <span className="text-muted-foreground">No date selected</span>
                                                    }
                                                </div>
                                                {errors[`schedules.${idx}.start_date`] && (
                                                    <p className="text-red-600 text-xs mt-1">
                                                        {errors[`schedules.${idx}.start_date`]}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Details Column */}
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor={`function-${idx}`}>Function *</Label>
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
                                                    <p className="text-red-600 text-xs mt-1">
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
                                                    max="9999"
                                                    value={sch.people}
                                                    onChange={(e) => updateSchedule(idx, 'people', e.target.value)}
                                                    placeholder="Enter number of people"
                                                />
                                                {errors[`schedules.${idx}.people`] && (
                                                    <p className="text-red-600 text-xs mt-1">
                                                        {errors[`schedules.${idx}.people`]}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Changes Summary */}
                                            {originalSchedule && (
                                                <div className="pt-2 border-t">
                                                    <Label className="text-sm text-muted-foreground">Changes Summary</Label>
                                                    <div className="mt-1 text-xs space-y-1">
                                                        {/* Date changes */}
                                                        {(sch.start_date !== originalSchedule.start_date || sch.end_date !== originalSchedule.end_date) && (
                                                            <div className="text-orange-600">
                                                                📅 Date range modified
                                                            </div>
                                                        )}
                                                        {/* Time changes */}
                                                        {(sch.time_start !== originalSchedule.time_start || sch.time_end !== originalSchedule.time_end) && (
                                                            <div className="text-orange-600">
                                                                ⏰ Time modified
                                                            </div>
                                                        )}
                                                        {/* Function changes */}
                                                        {sch.function !== originalSchedule.function && (
                                                            <div className="text-orange-600">
                                                                🔧 Function changed
                                                            </div>
                                                        )}
                                                        {/* People changes */}
                                                        {sch.people !== originalSchedule.people && (
                                                            <div className="text-orange-600">
                                                                👥 People count changed
                                                            </div>
                                                        )}
                                                        {/* No changes */}
                                                        {sch.start_date === originalSchedule.start_date && 
                                                         sch.end_date === originalSchedule.end_date &&
                                                         sch.time_start === originalSchedule.time_start &&
                                                         sch.time_end === originalSchedule.time_end &&
                                                         sch.function === originalSchedule.function &&
                                                         sch.people === originalSchedule.people && (
                                                            <div className="text-green-600">
                                                                ✅ No changes
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}

                    <div className="flex items-center justify-end">
                        <div className="flex items-center gap-3">
                            <Link href={route('sales.orders.show', order.id)}>
                                <Button variant="outline" disabled={processing}>Cancel</Button>
                            </Link>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Updating...' : 'Update Schedules'}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}