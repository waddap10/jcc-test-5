<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PicController extends Controller
{
    public function index(): Response
    {
        $currentUserId = Auth::id();

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
            ->where('status_beo', 2) // Only show orders that are not in planning status
            ->whereHas('beos', function ($query) use ($currentUserId) {
            })
            ->orderBy('start_date', 'asc')
            ->paginate(10);

        return Inertia::render('pic/index', compact('orders'));
    }

    public function show(Order $order)
    {
        $currentUserId = Auth::id(); // Get the current logged-in user ID

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
                'customer:id,organizer,address,contact_person,phone,email',
                'venues:id,name,short',
                'schedules:id,order_id,start_date,end_date,time_start,time_end,function,setup,people,date_range',
                'attachments:id,order_id,file_name,created_at', // Remove 'url' from select
                // Filter beos by current user
                'beos' => function ($query) use ($currentUserId) {
                    $query->where('user_id', $currentUserId)
                        ->with([
                            'department:id,name',
                            'package:id,name,description',
                            'user:id,name',
                            'attachments:id,beo_id,file_name,created_at'
                        ]);
                }
            ])
            ->findOrFail($order->id);

        // Add this debugging to see non-deleted BEOs only
        $nonDeletedBeos = DB::table('beos')
            ->where('order_id', $order->id)
            ->whereNull('deleted_at')
            ->where('user_id', $currentUserId)
            ->get();

        Log::info('Non-deleted BEOs for user ' . $currentUserId . ': ' . json_encode($nonDeletedBeos));

        return Inertia::render('pic/show', [
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
}
