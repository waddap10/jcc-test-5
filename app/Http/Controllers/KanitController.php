<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\OrderNotificationService;
use App\Services\OrderPdfService;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class KanitController extends Controller
{


    public function index(): Response
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
            ->where('status_beo', '!=', 0) // Only show orders that are not in planning status
            ->orderBy('start_date', 'asc')
            ->paginate(10);

        return Inertia::render('kanit/index', compact('orders'));
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
                'attachments:id,order_id,file_name,created_at', // Remove 'url' from select
                'beos:id,order_id,department_id,package_id,user_id,notes',
                'beos.department:id,name',
                'beos.package:id,name,description',
                'beos.user:id,name,phone',
                'beos.attachments:id,beo_id,file_name,created_at' // Remove 'url' from select
            ])
            ->findOrFail($order->id);

        return Inertia::render('kanit/show', [
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
                'attachments' => $order->attachments, // The url accessor will work automatically
                'beos' => $order->beos, // The url accessor will work automatically
            ]
        ]);
    }

    protected $pdfService;

    public function __construct(OrderPdfService $pdfService)
    {
        $this->pdfService = $pdfService;
    }

    /**
     * Approve order by Kanit and generate/regenerate PDF
     */
    // In KanitController.php
// In KanitController.php
public function accKanit(Order $order): RedirectResponse
{
    try {
        // Update status_beo to "Sudah Acc Kanit" (status 2)
        $order->update(['status_beo' => 2]);
       
        // Generate or regenerate PDF file
        $beoFile = $this->pdfService->generateOrderPdf($order);
       
        // Send notification to sales users + PICs
        $currentUser = auth()->user();
        if ($currentUser) {
            $notificationService = app(OrderNotificationService::class);
            $notificationService->notifyOrderApproved($order, $currentUser);
        } else {
            Log::warning('No authenticated user found for notification', ['order_id' => $order->id]);
        }
       
        $message = "Order {$order->custom_code} approved successfully. PDF generated with code: {$beoFile->file_code}";
       
    } catch (\Exception $e) {
        Log::error('Kanit approval failed', [
            'order_id' => $order->id,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
       
        $message = "Order {$order->custom_code} approved successfully, but PDF generation failed: " . $e->getMessage();
    }
   
    // Force refresh of shared data for all users by using a different redirect method
    return redirect()
        ->back()
        ->with('flash', ['message' => $message])
        ->with('refresh_notifications', true);
}

    /**
     * Handle order edit (this should be called when schedule, beo, or attachments are edited)
     */
    public function handleOrderEdit(Order $order): void
    {
        // Update status to "Under Revision" (status 3)
        $order->update(['status_beo' => 3]);
        
        // Delete the PDF file but keep the BeoFile record with same code
        $this->pdfService->deleteOrderPdfFile($order);
        
        Log::info('Order edited - PDF file deleted', [
            'order_id' => $order->id,
            'custom_code' => $order->custom_code,
            'user_id' => auth()->id()
        ]);
    }

    /**
     * Get PDF status for an order
     */
    public function getPdfStatus(Order $order)
    {
        $beoFile = $this->pdfService->getOrderBeoFile($order);
        $hasFile = $this->pdfService->orderHasPdfFile($order);
        
        return response()->json([
            'has_beo_record' => $beoFile !== null,
            'has_pdf_file' => $hasFile,
            'file_code' => $beoFile?->file_code,
            'status_beo' => $order->status_beo,
            'can_generate_pdf' => $order->status_beo === 2,
            'needs_regeneration' => $beoFile && !$hasFile && $order->status_beo === 2,
        ]);
    }

    /**
     * Manually regenerate PDF (optional endpoint for manual regeneration)
     */
    public function regeneratePdf(Order $order): RedirectResponse
    {
        try {
            $beoFile = $this->pdfService->generateOrderPdf($order);
            
            $message = "PDF regenerated successfully with code: {$beoFile->file_code}";
            
        } catch (\Exception $e) {
            $message = "Failed to regenerate PDF: " . $e->getMessage();
        }
        
        return redirect()
            ->back()
            ->with('flash', ['message' => $message]);
    }
}