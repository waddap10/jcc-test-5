import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Events',
        href: route('admin.events.index'),
    },
    {
        title: 'Create Event',
        href: route('admin.events.create'),
    },
];

export default function EventsCreate() {
    const { data, setData, post, processing, errors } = useForm({
        event_type: '',
        code: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.events.store'));
    };

    const handleEventTypeChange = (value: string) => {
        setData('event_type', value);
        // Auto-suggest code based on event type
        if (value) {
            const suggestedCode = value.toUpperCase().substring(0, 3);
            setData('code', suggestedCode);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Event" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold">Create New Event</CardTitle>
                            <p className="text-muted-foreground">
                                Add a new event type to the system
                            </p>
                        </div>
                        <Link href={route('admin.events.index')}>
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Events
                            </Button>
                        </Link>
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
                                        onChange={(e) => handleEventTypeChange(e.target.value)}
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

                            {/* Form Actions */}
                            <div className="flex items-center justify-end gap-4 pt-4 border-t">
                                <Link href={route('admin.events.index')}>
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </Link>
                                <Button type="submit" disabled={processing}>
                                    {processing ? (
                                        <>Processing...</>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Create Event
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Helper Card */}
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