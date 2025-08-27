<?php

namespace App\Http\Controllers;

use App\Http\Requests\OrderRequest;
use App\Models\Customer;
use App\Models\Event;
use App\Models\Order;
use App\Models\Venue;
use App\Services\OrderNotificationService;
use App\Services\OrderPdfService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class OrderController extends Controller
{
    protected $notificationService;
    protected $pdfService;

    public function __construct(OrderNotificationService $notificationService, OrderPdfService $pdfService)
    {
        $this->notificationService = $notificationService;
        $this->pdfService = $pdfService;
    }

    public function index()
    {
        $orders = Order::with([
            'customer:id,organizer',
            'venues:id,short',
            'event:id,event_type'
        ])
            ->select([
                'id',
                'custom_code',
                'event_name',
                'start_date',
                'end_date',
                'status',
                'status_beo',
                'customer_id',
                'event_id'
            ])
            ->orderBy('start_date', 'asc')
            ->paginate(10);

        // Get notifications for current user
        $notifications = $this->getUserNotifications();
            
        return Inertia::render('sales/orders/index', [
            'orders' => $orders,
            'notifications' => $notifications
        ]);
    }

    public function create()
    {
        $venues = Venue::select('id', 'name')->get();
        $events = Event::select('id', 'event_type', 'code')->orderBy('event_type', 'asc')->get();
        $customers = Customer::select('id', 'organizer')->orderBy('organizer', 'asc')->get();

        $bookings = [];
        $orders = Order::with('venues')->get(['id', 'start_date', 'end_date']);

        foreach ($orders as $order) {
            foreach ($order->venues as $venue) {
                $bookings[] = [
                    'venue_id' => $venue->id,
                    'start_date' => optional($order->start_date)->toDateString(),
                    'end_date' => optional($order->end_date)->toDateString(),
                ];
            }
        }

        // Get notifications for current user
        $notifications = $this->getUserNotifications();

        return Inertia::render('sales/orders/create', [
            'venues' => $venues,
            'events' => $events,
            'bookings' => $bookings,
            'customers' => $customers,
            'notifications' => $notifications,
            'flash' => session('flash', []),
        ]);
    }

    public function store(OrderRequest $request)
    {
        $data = $request->validated();

        try {
            DB::beginTransaction();

            $custId = $data['customerOption'] === 'new'
                ? Customer::create($data['customer'])->id
                : $data['existing_customer_id'];

            $order = Order::create([
                'event_id' => $data['event_id'],
                'event_name' => $data['event_name'],
                'customer_id' => $custId,
                'discount' => $data['discount'] ?? 0,
                'status' => 0,
                'status_beo' => 0,
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'],
            ]);

            $order->venues()->sync($data['venues']);
            $order->load('event');

            DB::commit();

            return redirect()
                ->route('sales.orders.index')
                ->with('flash', [
                    'message' => "Order created successfully with code: {$order->custom_code} ({$order->event->event_type})"
                ]);

        } catch (\Exception $e) {
            DB::rollBack();

            return redirect()
                ->back()
                ->withInput()
                ->with('flash', [
                    'error' => 'Failed to create order: ' . $e->getMessage()
                ]);
        }
    }

    public function show(Order $order)
    {
        // Load only necessary fields from the start
        $order = Order::select([
            'id',
            'custom_code',
            'event_name',
            'created_at',
            'start_date',
            'end_date',
            'status',
            'status_beo',
            'discount',
            'customer_id'
        ])
            ->with([
                'customer:id,organizer,address,contact_person,phone,email,kl_status',
                'venues:id,name,short',
                'schedules:id,order_id,start_date,end_date,time_start,time_end,function,people',
                'attachments:id,order_id,file_name,created_at',
                'beos:id,order_id,department_id,package_id,user_id,notes',
                'beos.department:id,name',
                'beos.package:id,name,description',
                'beos.user:id,name,phone',
                'beos.attachments:id,beo_id,file_name,created_at'
            ])
            ->findOrFail($order->id);

        // Get notifications for current user
        $notifications = $this->getUserNotifications();

        return Inertia::render('sales/orders/show', [
            'order' => [
                'id' => $order->id,
                'custom_code' => $order->custom_code,
                'event_name' => $order->event_name,
                'created_at' => $order->created_at,
                'start_date' => $order->start_date,
                'end_date' => $order->end_date,
                'status' => $order->status,
                'status_beo' => $order->status_beo,
                'discount' => $order->discount,
                'customer' => $order->customer,
                'venues' => $order->venues,
                'schedules' => $order->schedules,
                'attachments' => $order->attachments,
                'beos' => $order->beos,
            ],
            'notifications' => $notifications
        ]);
    }

    public function destroy(Order $order)
    {
        try {
            $order->load('event');
            $customCode = $order->custom_code;
            $eventType = $order->event?->event_type ?? 'Unknown';

            DB::transaction(function () use ($order) {
                $order->venues()->detach();
                $order->delete();
            });

            return redirect()
                ->route('sales.orders.index')
                ->with('flash', [
                    'type' => 'success',
                    'message' => "Order {$customCode} ({$eventType}) has been deleted successfully."
                ]);

        } catch (\Exception $e) {
            return redirect()
                ->route('sales.orders.index')
                ->with('flash', [
                    'type' => 'error',
                    'message' => 'Failed to delete order. Please try again.'
                ]);
        }
    }

    public function updateStatus(Order $order)
    {
        try {
            $order->load('event');

            if ($order->status !== 0) {
                return redirect()
                    ->route('orders.index')
                    ->with('flash', [
                        'type' => 'warning',
                        'message' => "Order {$order->custom_code} has already been processed."
                    ]);
            }

            DB::transaction(function () use ($order) {
                $order->update([
                    'status' => 1,
                ]);
            });

            return redirect()
                ->route('sales.orders.index')
                ->with('flash', [
                    'type' => 'success',
                    'message' => "Order {$order->custom_code} ({$order->event->event_type}) has been confirmed successfully."
                ]);

        } catch (\Exception $e) {
            return redirect()
                ->route('orders.index')
                ->with('flash', [
                    'type' => 'error',
                    'message' => 'Failed to confirm order. Please try again.'
                ]);
        }
    }

    public function accKanit(Order $order): RedirectResponse
    {
        // Load event for better messaging
        $order->load('event');
        
        // Update status to "Sudah Kirim Ke Kanit"
        $order->update(['status_beo' => 1]);
        
        // Send notification to Kanit users
        $currentUser = auth()->user();
        if ($currentUser) {
            $this->notificationService->notifyOrderSentToKanit($order, $currentUser);
        }
        
        return redirect()
            ->route('sales.orders.index')
            ->with('flash', [
                'message' => "Order {$order->custom_code} ({$order->event->event_type}) sent to Kanit for approval."
            ]);
    }

    public function downloadPdf(Order $order)
    {
        try {
            // Generate or get existing PDF
            $orderFile = $this->pdfService->generateOrderPdf($order);

            // Check if file exists
            if (!Storage::exists($orderFile->file_path)) {
                abort(404, 'PDF file not found');
            }

            // Generate download filename
            $downloadName = "Order_{$order->custom_code}_{$orderFile->file_code}.pdf";

            // Return file download
            return Storage::download($orderFile->file_path, $downloadName);

        } catch (\Exception $e) {
            abort(500, 'Error generating PDF');
        }
    }

   public function debugPdfHtml(Order $order, string $fileCode = null, array $additionalData = [])
{
    $fileCode = $fileCode ?? 'DEBUG-' . now()->format('YmdHis');
    
    $pdfData = [
        'file_code' => $fileCode,
        'order' => $order,
        'document_id' => $fileCode,
        'title' => "Order #{$order->custom_code} - BEO Document",
        'date' => now()->format('Y-m-d'),
        'time' => now()->format('H:i'),
        'department' => 'Operations',
        'prepared_by' => auth()->user()->name ?? 'System',
        'status' => $this->getStatusText($order->status_beo),
        // Add debug info for images
        'debug_asset_url' => asset('images/'),
        'debug_storage_url' => Storage::url('images/'),
        'debug_public_path' => public_path('images/'),
    ];
   
    $pdfData = array_merge($pdfData, $additionalData);
   
    return view('pdf.order-template', $pdfData);
}

private function getStatusText(int $statusBeo): string
    {
        return match($statusBeo) {
            1 => 'Sudah Kirim Ke Kanit',
            2 => 'Sudah Acc Kanit',
            3 => 'Di edit',
            default => 'Planning'
        };
    }

    /**
     * Get notifications for current user
     */
    private function getUserNotifications()
    {
        if (!auth()->check()) {
            return [];
        }

        return auth()->user()
            ->notifications()
            ->latest()
            ->take(10)
            ->get()
            ->map(function ($notification) {
                return [
                    'id' => $notification->id,
                    'type' => $notification->type,
                    'data' => $notification->data,
                    'created_at' => $notification->created_at,
                    'read_at' => $notification->read_at,
                ];
            });
    }
}