<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use App\Notifications\OrderApprovedByKanit;
use App\Notifications\OrderNeedsReview;
use App\Notifications\OrderSentToKanit;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class OrderNotificationService
{
    /**
     * Send notification when order is sent to Kanit (status_beo = 1)
     */
    public function notifyOrderSentToKanit(Order $order, User $sentBy): void
    {
        Log::info('Starting order sent to Kanit notification process', [
            'order_id' => $order->id,
            'sent_by' => $sentBy->id
        ]);

        $kanitUsers = $this->getKanitUsers();

        if ($kanitUsers->isEmpty()) {
            Log::warning('No Kanit users found to notify', ['order_id' => $order->id]);
            return;
        }

        // Send notification to all Kanit users
        Notification::send($kanitUsers, new OrderSentToKanit($order, $sentBy));

        Log::info('Order sent to Kanit notification sent successfully', [
            'order_id' => $order->id,
            'sent_by' => $sentBy->id,
            'kanit_users_count' => $kanitUsers->count(),
            'notified_user_ids' => $kanitUsers->pluck('id')->toArray()
        ]);
    }

    /**
     * Send notification when order is approved by Kanit (status_beo = 2)
     */
    public function notifyOrderApproved(Order $order, User $approvedBy): void
    {
        Log::info('Starting notification process', [
            'order_id' => $order->id,
            'approved_by' => $approvedBy->id
        ]);

        // Load relationships needed for notifications
        $order->load('beos.user', 'beos.department');

        // Get sales users who should be notified
        $salesUsers = $this->getSalesUsers();
        Log::info('Found sales users', ['count' => $salesUsers->count()]);

        // Get PIC users from the order's BEOs
        $picUsers = $this->getPicUsersFromOrder($order);
        Log::info('PIC vs Sales user analysis', [
    'pic_user_ids' => $picUsers->pluck('id')->toArray(),
    'sales_user_ids' => $salesUsers->pluck('id')->toArray(),
    'user_4_details' => User::find(4) ? [
        'id' => User::find(4)->id,
        'name' => User::find(4)->name,
        'roles' => User::find(4)->getRoleNames()->toArray(),
        'is_in_sales' => $salesUsers->contains('id', 4),
        'is_in_pic' => $picUsers->contains('id', 4)
    ] : 'User 4 not found',
    'overlap_users' => $salesUsers->whereIn('id', $picUsers->pluck('id'))->pluck('id')->toArray(),
]);

        // Combine sales and PIC users, removing duplicates
        $allUsersToNotify = $salesUsers->merge($picUsers)->unique('id');

        if ($allUsersToNotify->isEmpty()) {
            Log::warning('No users found to notify for order approval', ['order_id' => $order->id]);
            return;
        }

        // Send notification to all relevant users (sales + PICs)
        Notification::send($allUsersToNotify, new OrderApprovedByKanit($order, $approvedBy));

        Log::info('Order approved notification sent', [
            'order_id' => $order->id,
            'approved_by' => $approvedBy->id,
            'sales_users_count' => $salesUsers->count(),
            'pic_users_count' => $picUsers->count(),
            'total_notified' => $allUsersToNotify->count(),
            'notified_user_ids' => $allUsersToNotify->pluck('id')->toArray(),
            'pic_details' => $picUsers->map(function ($user) use ($order) {
                // Convert to collection if it's an array to ensure we can use first()
                $beos = collect($order->beos);
                $beo = $beos->first(function ($beo) use ($user) {
                    return $beo->user && $beo->user->id === $user->id;
                });
                return [
                    'user_id' => $user->id,
                    'user_name' => $user->name,
                    'department' => $beo ? $beo->department->name : 'Unknown'
                ];
            })->toArray()
        ]);
    }

    /**
     * Send notification when order needs review (status_beo = 3)
     */
    public function notifyOrderNeedsReview(Order $order, User $editedBy, array $changedFields = []): void
    {
        $kanitUsers = $this->getKanitUsers();

        if ($kanitUsers->isEmpty()) {
            Log::warning('No Kanit users found to notify', ['order_id' => $order->id]);
            return;
        }

        // Send notification to Kanit users
        Notification::send($kanitUsers, new OrderNeedsReview($order, $editedBy, $changedFields));

        Log::info('Order needs review notification sent', [
            'order_id' => $order->id,
            'edited_by' => $editedBy->id,
            'changed_fields' => $changedFields,
            'notified_users' => $kanitUsers->pluck('id')->toArray()
        ]);
    }

    /**
     * Get all Kanit users
     */
    private function getKanitUsers()
    {
        // Method 1: If you have roles system
        if (class_exists('Spatie\Permission\Models\Role')) {
            return User::role('kanit')->get();
        }

        // Method 2: If you have role_id field
        // Assuming kanit role_id is 2 (adjust according to your system)
        if (\Schema::hasColumn('users', 'role_id')) {
            return User::where('role_id', 2)->get();
        }

        // Method 3: If you have department field
        if (\Schema::hasColumn('users', 'department')) {
            return User::where('department', 'kanit')
                      ->orWhere('department', 'Kanit')
                      ->get();
        }

        // Method 4: Hardcoded emails (temporary solution)
        $kanitEmails = [
            'kanit@company.com',
            'kanit1@company.com',
            'kanit2@company.com',
            // Add your kanit user emails here
        ];

        return User::whereIn('email', $kanitEmails)->get();

        // Method 5: Hardcoded user IDs (for testing)
        // $kanitUserIds = [4, 5, 6]; // Replace with actual kanit user IDs
        // return User::whereIn('id', $kanitUserIds)->get();
    }

    /**
     * Get all Sales users
     */
    private function getSalesUsers()
    {
        // Method 1: If you have roles system
        if (class_exists('Spatie\Permission\Models\Role')) {
            return User::role('sales')->get();
        }

        // Method 2: If you have role_id field
        // Assuming sales role_id is 3 (adjust according to your system)
        if (\Schema::hasColumn('users', 'role_id')) {
            return User::where('role_id', 3)->get();
        }

        // Method 3: If you have department field
        if (\Schema::hasColumn('users', 'department')) {
            return User::where('department', 'sales')
                      ->orWhere('department', 'Sales')
                      ->get();
        }

        // Method 4: Hardcoded emails (temporary solution)
        $salesEmails = [
            'sales@company.com',
            'sales1@company.com',
            'sales2@company.com',
            // Add your sales user emails here
        ];

        return User::whereIn('email', $salesEmails)->get();

        // Method 5: Hardcoded user IDs (for testing)
        // $salesUserIds = [1, 2, 3]; // Replace with actual sales user IDs
        // return User::whereIn('id', $salesUserIds)->get();
    }

    /**
     * Get PIC users from order's BEOs
     */
    private function getPicUsersFromOrder(Order $order)
    {
        // Make sure relationships are loaded
        if (!$order->relationLoaded('beos')) {
            $order->load('beos.user');
        }

        // Get all unique users assigned as PICs in BEOs
        $picUsers = collect();

        // Convert to collection to ensure consistent behavior
        $beos = collect($order->beos);

        foreach ($beos as $beo) {
            if ($beo->user) {
                $picUsers->push($beo->user);
            }
        }

        // Remove duplicates and return as collection
        return $picUsers->unique('id');
    }
}
