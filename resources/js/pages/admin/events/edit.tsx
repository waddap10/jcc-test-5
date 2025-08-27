import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';

interface Event {
    id: number;
    event_type: string;
    code: string;
    created_at: string;
    updated_at: string;
}

interface EventsEditProps {
    event: Event;
}

export default function EventsEdit({ event }: EventsEditProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Events',
            href: route('admin.events.index'),
        },
        {
            title: event.event_type,
            href: route('admin.events.edit', event.id),
        },
        {
            title: 'Edit',
            href: route('admin.events.edit', event.id),
        },
    ];

    const { data, setData, put, processing, errors } = useForm({
        event_type: event.event_type,
        code: event.code,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.events.update', event.id));
    };

    const hasChanges = data.event_type !== event.event_type || data.code !== event.code;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Event - ${event.event_type}`} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold">Edit Event</CardTitle>
                            <p className="text-muted-foreground">
                                Modify event type "{event.event_type}" (ID: {event.id})
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Link href={route('admin.events.index')}>
                                <Button variant="outline">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Events
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Event Type Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="event_type">
                                        Event Type <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="event_type"
                                        type="text"
                                        value={data.event_type}
                                        onChange={(e) => setData('event_type', e.target.value)}
                                        placeholder="e.g., conference, workshop, seminar"
                                        className={errors.event_type ? 'border-red-500' : ''}
                                        maxLength={50}
                                    />
                                    {errors.event_type && (
                                        <p className="text-sm text-red-500">{errors.event_type}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Unique identifier for this event type (max 50 characters)
                                    </p>
                                </div>

                                {/* Code Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="code">
                                        Event Code <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="code"
                                        type="text"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                        placeholder="e.g., CNF, WS, SEM"
                                        className={errors.code ? 'border-red-500' : ''}
                                        maxLength={10}
                                        style={{ textTransform: 'uppercase' }}
                                    />
                                    {errors.code && (
                                        <p className="text-sm text-red-500">{errors.code}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        Short code for this event type (uppercase letters and numbers only, max 10 characters)
                                    </p>
                                </div>
                            </div>

                            {/* Changes Indicator */}
                            {hasChanges && (
                                <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4">
                                    <div className="flex">
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-yellow-800">
                                                Unsaved Changes
                                            </h3>
                                            <div className="mt-2 text-sm text-yellow-700">
                                                <ul className="list-disc list-inside space-y-1">
                                                    {data.event_type !== event.event_type && (
                                                        <li>
                                                            Event Type: "{event.event_type}" → "{data.event_type}"
                                                        </li>
                                                    )}
                                                    {data.code !== event.code && (
                                                        <li>
                                                            Code: "{event.code}" → "{data.code}"
                                                        </li>
                                                    )}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Form Actions */}
                            <div className="flex items-center justify-end gap-4 pt-4 border-t">
                                <Link href={route('admin.events.index')}>
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </Link>
                                <Button 
                                    type="submit" 
                                    disabled={processing || !hasChanges}
                                >
                                    {processing ? (
                                        <>Updating...</>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Update Event
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Event Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Event Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Created At</Label>
                                <p className="text-sm">
                                    {new Date(event.created_at).toLocaleDateString('id-ID', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                                <p className="text-sm">
                                    {new Date(event.updated_at).toLocaleDateString('id-ID', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Guidelines Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Guidelines</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 text-sm">
                            <div>
                                <strong>Event Type:</strong>
                                <ul className="mt-1 ml-4 list-disc space-y-1 text-muted-foreground">
                                    <li>Must be unique across all events</li>
                                    <li>Use lowercase for consistency (e.g., "conference", "workshop")</li>
                                    <li>Be descriptive but concise</li>
                                    <li>Maximum 50 characters allowed</li>
                                </ul>
                            </div>
                            <div>
                                <strong>Event Code:</strong>
                                <ul className="mt-1 ml-4 list-disc space-y-1 text-muted-foreground">
                                    <li>Short abbreviation of the event type</li>
                                    <li>Use 2-4 characters for best results</li>
                                    <li>Only uppercase letters and numbers allowed</li>
                                    <li>Maximum 10 characters allowed</li>
                                    <li>Examples: CNF (Conference), WS (Workshop), SEM (Seminar)</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}