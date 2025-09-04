<?php

namespace App\Notifications;

use App\Models\Order;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\DatabaseMessage;
use Illuminate\Notifications\Notification;

class OrderSentToKanit extends Notification implements ShouldQueue
{
    use Queueable;

    protected $order;
    protected $sentBy;

    public function __construct(Order $order, User $sentBy)
    {
        $this->order = $order;
        $this->sentBy = $sentBy;
    }

    /**
     * Get the notification's delivery channels.
     */
    public function via($notifiable): array
    {
        return ['database', 'mail']; // Add 'broadcast' for real-time notifications
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('New Order Awaiting Approval - ' . $this->order->custom_code)
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line("A new order {$this->order->custom_code} has been sent to Kanit for approval.")
            ->line("**Event:** {$this->order->event_name}")
            ->line("**Sent by:** {$this->sentBy->name}")
            ->line("**Event Date:** {$this->order->start_date} - {$this->order->end_date}")
            ->line("**Customer:** " . ($this->order->customer['organizer'] ?? 'N/A'))
            ->action('Review Order', route('kanit.orders.show', $this->order->id))
            ->line('Please review the order details and approve if everything looks correct.')
            ->salutation('Best regards, BEO System');
    }

    /**
     * Get the array representation of the notification (for database).
     */
    public function toArray($notifiable): array
    {
        return [
            'type' => 'order_sent_to_kanit',
            'title' => 'New Order Awaiting Approval',
            'message' => "Order {$this->order->custom_code} has been sent for your approval.",
            'order_id' => $this->order->id,
            'order_code' => $this->order->custom_code,
            'event_name' => $this->order->event_name,
            'sent_by' => $this->sentBy->name,
            'sent_by_id' => $this->sentBy->id,
            'customer_name' => $this->order->customer['organizer'] ?? 'N/A',
            'action_url' => route('kanit.orders.show', $this->order->id),
            'icon' => 'file-text',
            'color' => 'blue'
        ];
    }

    /**
     * Get the database representation of the notification.
     */
    public function toDatabase($notifiable): array
    {
        return $this->toArray($notifiable);
    }
}
