<?php

namespace App\Notifications;

use App\Models\Order;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\DatabaseMessage;
use Illuminate\Notifications\Notification;

class OrderApprovedByKanit extends Notification implements ShouldQueue
{
    use Queueable;

    protected $order;
    protected $approvedBy;

    public function __construct(Order $order, User $approvedBy)
    {
        $this->order = $order;
        $this->approvedBy = $approvedBy;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via($notifiable): array
    {
        return ['database']; // Add 'broadcast' for real-time notifications
    }

    /**
     * Get the mail representation of the notification.
     */
    /* public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Order Approved by Kanit - ' . $this->order->custom_code)
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line("Order {$this->order->custom_code} has been approved by Kanit.")
            ->line("**Event:** {$this->order->event_name}")
            ->line("**Approved by:** {$this->approvedBy->name}")
            ->line("**Event Date:** {$this->order->start_date} - {$this->order->end_date}")
            ->when($this->isPicNotification($notifiable), function ($mail) {
                return $mail->line("You have been assigned as PIC for this order.")
                           ->line("Please coordinate with your department to prepare for the event.");
            })
            ->action('View Order', $this->getViewOrderUrl($notifiable))
            ->line('The PDF document has been generated and is ready for download.')
            ->salutation('Best regards, BEO System');
    } */

    /**
     * Get the array representation of the notification (for database).
     */
    public function toArray($notifiable): array
    {
        $isPic = $this->isPicNotification($notifiable);
        
        return [
            'type' => $isPic ? 'order_approved_pic' : 'order_approved',
            'title' => $isPic ? 'You\'re assigned as PIC - Order Approved' : 'Order Approved by Kanit',
            'message' => $isPic 
                ? "You've been assigned as PIC for order {$this->order->custom_code}. The order has been approved by Kanit."
                : "Order {$this->order->custom_code} has been approved by Kanit.",
            'order_id' => $this->order->id,
            'order_code' => $this->order->custom_code,
            'event_name' => $this->order->event_name,
            'approved_by' => $this->approvedBy->name,
            'approved_by_id' => $this->approvedBy->id,
            'is_pic_notification' => $isPic,
            'pic_department' => $isPic ? $this->getPicDepartment($notifiable) : null,
            'action_url' => $this->getViewOrderUrl($notifiable),
            'icon' => $isPic ? 'user-check' : 'check-circle',
            'color' => $isPic ? 'blue' : 'green'
        ];
    }

    /**
     * Check if this is a PIC notification
     */
    private function isPicNotification($notifiable): bool
    {
        if (!isset($this->order->beos)) {
            $this->order->load('beos.user');
        }
        
        return $this->order->beos->contains(function ($beo) use ($notifiable) {
            return $beo->user && $beo->user->id === $notifiable->id;
        });
    }

    /**
     * Get PIC department name
     */
    private function getPicDepartment($notifiable): ?string
    {
        if (!isset($this->order->beos)) {
            $this->order->load('beos.user', 'beos.department');
        }
        
        $beo = $this->order->beos->first(function ($beo) use ($notifiable) {
            return $beo->user && $beo->user->id === $notifiable->id;
        });
        
        return $beo ? $beo->department->name : null;
    }

    /**
     * Get appropriate view order URL based on user role
     */
    private function getViewOrderUrl($notifiable): string
    {
        // Check if it's a PIC notification
        if ($this->isPicNotification($notifiable)) {
            // For PICs, use a general order view or their department-specific route
            if (method_exists($notifiable, 'hasRole')) {
                if ($notifiable->hasRole('sales')) {
                    return route('sales.orders.show', $this->order->id);
                }
                // Add other role-specific routes here
            }
            
            // Default PIC view (you might want to create a specific route for PICs)
            return route('pic.dashboard', $this->order->id); // Adjust this route as needed
        }
        
        // For sales users
        if (method_exists($notifiable, 'hasRole') && $notifiable->hasRole('sales')) {
            return route('sales.orders.show', $this->order->id);
        }
        
        // Default to kanit view
        return route('kanit.orders.show', $this->order->id);
    }

    /**
     * Get the database representation of the notification.
     */
    public function toDatabase($notifiable): array
    {
        return $this->toArray($notifiable);
    }
}