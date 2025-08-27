<?php

namespace App\Notifications;

use App\Models\Order;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OrderApprovedPicAssigned extends Notification implements ShouldQueue
{
    use Queueable;

    protected $order;
    protected $approvedBy;
    protected $department;

    public function __construct(Order $order, User $approvedBy, string $department)
    {
        $this->order = $order;
        $this->approvedBy = $approvedBy;
        $this->department = $department;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via($notifiable): array
    {
        return ['database', 'mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('You\'re assigned as PIC - Order Approved - ' . $this->order->custom_code)
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line("Great news! Order {$this->order->custom_code} has been approved by Kanit.")
            ->line("**You have been assigned as Person in Charge (PIC) for this order.**")
            ->line("**Event:** {$this->order->event_name}")
            ->line("**Your Department:** {$this->department}")
            ->line("**Approved by:** {$this->approvedBy->name}")
            ->line("**Event Date:** {$this->order->start_date} - {$this->order->end_date}")
            ->line('**Your Responsibilities:**')
            ->line('• Coordinate with your department team')
            ->line('• Prepare necessary equipment and resources')
            ->line('• Ensure everything is ready for the event dates')
            ->line('• Communicate with sales team if any issues arise')
            ->action('View Order Details', route('orders.show', $this->order->id))
            ->line('Please review the order details and start preparing for the event.')
            ->salutation('Best regards, BEO System');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray($notifiable): array
    {
        return [
            'type' => 'pic_assigned',
            'title' => 'You\'re assigned as PIC - Order Approved',
            'message' => "You've been assigned as PIC for {$this->department} department for order {$this->order->custom_code}. The order has been approved and is ready for execution.",
            'order_id' => $this->order->id,
            'order_code' => $this->order->custom_code,
            'event_name' => $this->order->event_name,
            'department' => $this->department,
            'approved_by' => $this->approvedBy->name,
            'approved_by_id' => $this->approvedBy->id,
            'event_start_date' => $this->order->start_date,
            'event_end_date' => $this->order->end_date,
            'action_url' => route('orders.show', $this->order->id),
            'icon' => 'user-check',
            'color' => 'blue',
            'priority' => 'high'
        ];
    }
}