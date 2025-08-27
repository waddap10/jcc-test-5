<?php

namespace App\Http\Controllers;

use App\Http\Requests\OrderAttachmentRequest;
use App\Models\Order;
use App\Models\OrderAttachment;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class OrderAttachmentController extends Controller
{
    public function create(Order $order): Response
    {
        return Inertia::render('sales/orders/attachments/create', [
            'order' => $order->only(['id', 'event_name', 'custom_code']),
        ]);
    }

    public function store(OrderAttachmentRequest $request, Order $order): RedirectResponse
    {
        $validated = $request->validated();

        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $attachment = $order->attachments()->create([
                    'file_name' => $file->getClientOriginalName(),
                ]);
                $attachment->storeAttachment($file);
            }
        }

        return redirect()
            ->route('sales.orders.show', $order->id)
            ->with('flash', ['message' => 'Attachments uploaded successfully.']);
    }

    public function edit(Order $order): Response
    {
        $order->load('attachments:id,order_id,file_name,created_at');

        return Inertia::render('sales/orders/attachments/edit', [
            'order' => $order->only(['id', 'event_name', 'custom_code']),
            'attachments' => $order->attachments,
        ]);
    }

    public function update(OrderAttachmentRequest $request, Order $order): RedirectResponse
    {
        $validated = $request->validated();

        // Delete marked attachments
        if (!empty($validated['delete_attachments'])) {
            foreach ($validated['delete_attachments'] as $attachmentId) {
                $attachment = OrderAttachment::where('id', $attachmentId)
                    ->where('order_id', $order->id)
                    ->first();
                
                if ($attachment) {
                    $attachment->deleteFile('file_name');
                    $attachment->delete();
                }
            }
        }

        // Add new attachments
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $attachment = $order->attachments()->create([
                    'file_name' => $file->getClientOriginalName(),
                ]);
                $attachment->storeAttachment($file);
            }
        }

        return redirect()
            ->route('sales.orders.show', $order->id)
            ->with('flash', ['message' => 'Attachments updated successfully.']);
    }

    public function destroy(Order $order, OrderAttachment $attachment): RedirectResponse
    {
        abort_if($attachment->order_id !== $order->id, 404);

        $attachment->deleteFile('file_name');
        $attachment->delete();

        return back()->with('flash', ['message' => 'Attachment deleted successfully.']);
    }
}