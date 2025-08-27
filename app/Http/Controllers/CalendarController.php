<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Order;
use App\Models\Venue;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CalendarController extends Controller
{
    public function index(Request $request)
    {
        $month = (int) $request->query('month', now()->month);
        $year = (int) $request->query('year', now()->year);

        $filterDate = $request->query('filter_date');
        $filterVenue = $request->query('filter_venue');
        $filterStatus = $request->query('filter_status');
        $filterEventType = $request->query('filter_event_type');

        $startOfMonth = \Carbon\Carbon::create($year, $month, 1)->startOfMonth();
        $endOfMonth = $startOfMonth->copy()->endOfMonth();

        $venues = Venue::select('id', 'name', 'short')->get();
        $events = Event::select('id', 'event_type', 'code')->orderBy('event_type', 'asc')->get();

        $ordersQuery = Order::with(['venues', 'schedules', 'event:id,event_type,code', 'customer:id,organizer'])
            ->whereHas('schedules', function ($query) use ($startOfMonth, $endOfMonth) {
                $query->whereDate('start_date', '<=', $endOfMonth)
                    ->whereDate('end_date', '>=', $startOfMonth);
            });

        if ($filterDate) {
            $ordersQuery->whereHas('schedules', function ($query) use ($filterDate) {
                $query->whereDate('start_date', '<=', $filterDate)
                    ->whereDate('end_date', '>=', $filterDate);
            });
        }

        if ($filterVenue) {
            $ordersQuery->whereHas('venues', function ($query) use ($filterVenue) {
                $query->where('venues.id', $filterVenue);
            });
        }

        if ($filterStatus !== null && $filterStatus !== '') {
            $ordersQuery->where('status', $filterStatus);
        }

        if ($filterEventType) {
            $ordersQuery->whereHas('event', function ($query) use ($filterEventType) {
                $query->where('event_type', $filterEventType);
            });
        }

        $orders = $ordersQuery->get();

        $calendarData = $venues
            ->keyBy('id')
            ->map(function ($venue) {
                return [
                    'name' => $venue->name,
                    'short' => $venue->short,
                    'slots' => [],
                ];
            })
            ->toArray();

        foreach ($orders as $order) {
            foreach ($order->venues as $venue) {
                if ($filterVenue && $venue->id != $filterVenue) {
                    continue;
                }

                foreach ($order->schedules as $schedule) {
                    $scheduleStart = \Carbon\Carbon::parse($schedule->start_date)->startOfDay();
                    $scheduleEnd = \Carbon\Carbon::parse($schedule->end_date)->startOfDay();

                    if (!($scheduleStart->lte($endOfMonth) && $scheduleEnd->gte($startOfMonth))) {
                        continue;
                    }

                    if ($filterDate) {
                        $filterDateCarbon = \Carbon\Carbon::parse($filterDate);
                        if (!($scheduleStart->lte($filterDateCarbon) && $scheduleEnd->gte($filterDateCarbon))) {
                            continue;
                        }
                    }

                    $isSingleDay = $scheduleStart->isSameDay($scheduleEnd);

                    $displayText = $order->custom_code . ' - ' . $order->event_name;
                    if ($order->event) {
                        $displayText .= ' (' . ucfirst($order->event->event_type) . ')';
                    }
                    if ($schedule->function) {
                        $displayText .= ' - ' . $schedule->function;
                    }

                    $dateRange = $isSingleDay
                        ? $scheduleStart->format('Y-m-d')
                        : $scheduleStart->format('Y-m-d') . ' to ' . $scheduleEnd->format('Y-m-d');

                    $calendarData[$venue->id]['slots'][] = [
                        'order_id' => $order->id,
                        'schedule_id' => $schedule->id,
                        'custom_code' => $order->custom_code,
                        'event_name' => $order->event_name,
                        'event_type' => $order->event ? $order->event->event_type : null,
                        'event_code' => $order->event ? $order->event->code : null,
                        'organizer' => $order->customer ? $order->customer->organizer : null,
                        'function' => $schedule->function,
                        'display_text' => $displayText,
                        'start' => $scheduleStart->format('Y-m-d'),
                        'end' => $scheduleEnd->format('Y-m-d'),
                        'is_single_day' => $isSingleDay,
                        'date_range' => $dateRange,
                        'status' => $order->status,
                        'status_beo' => $order->status_beo,
                        'date_span' => $this->generateDateSpan($scheduleStart, $scheduleEnd),
                    ];
                }
            }
        }

        $eventTypeOptions = $events->pluck('event_type')->unique()->sort()->map(function ($eventType) {
            return [
                'value' => $eventType,
                'label' => ucfirst($eventType)
            ];
        })->values();

        return Inertia::render('calendars/index', [
            'venues' => $venues,
            'events' => $events,
            'calendarData' => $calendarData,
            'month' => $month,
            'year' => $year,
            'filters' => [
                'date' => $filterDate,
                'venue' => $filterVenue ? (int) $filterVenue : null,
                'status' => $filterStatus !== null && $filterStatus !== '' ? (int) $filterStatus : null,
                'event_type' => $filterEventType,
            ],
            'statusOptions' => [
                ['value' => 0, 'label' => 'New Inquiry'],
                ['value' => 1, 'label' => 'Sudah Konfirmasi'],
                ['value' => 2, 'label' => 'Sudah dilaksanakan'],
            ],
            'statusBeoOptions' => [
                ['value' => 0, 'label' => 'Planning'],
                ['value' => 1, 'label' => 'Sudah Kirim Ke Kanit'],
                ['value' => 2, 'label' => 'Sudah Acc Kanit'],
                ['value' => 3, 'label' => 'Di edit'],
            ],
            'eventTypeOptions' => $eventTypeOptions,
        ]);
    }
    private function generateDateSpan(\Carbon\Carbon $start, \Carbon\Carbon $end): array
    {
        $dates = [];
        $current = $start->copy()->startOfDay();
        $endDate = $end->copy()->startOfDay();

        while ($current->lte($endDate)) {
            $dates[] = $current->format('Y-m-d');
            $current->addDay();
        }

        return $dates;
    }
}
