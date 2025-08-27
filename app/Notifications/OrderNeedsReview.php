<?php

namespace App\Notifications;

use App\Models\Order;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Messages\DatabaseMessage;
use Illuminate\Notifications\Notification;

class OrderNeedsReview extends Notification implements ShouldQueue
{
    use Queueable;

    protected $order;
    protected $editedBy;
    protected $changedFields;

    public function __construct(Order $order, User $editedBy, array $changedFields = [])
    {
        $this->order = $order;
        $this->editedBy = $editedBy;
        $this->changedFields = $changedFields;
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
        $mail = (new MailMessage)
            ->subject('Order Requires Re-Review - ' . $this->order->custom_code)
            ->greeting('Hello ' . $notifiable->name . ',')
            ->line("Order {$this->order->custom_code} has been modified and requires your review.")
            ->line("**Event:** {$this->order->event_name}")
            ->line("**Modified by:** {$this->editedBy->name}")
            ->line("**Event Date:** {$this->order->start_date} - {$this->order->end_date}");

        if (!empty($this->changedFields)) {
            $mail->line("**Changed sections:** " . implode(', ', $this->changedFields));
        }

        return $mail->action('Review Order', route('kanit.orders.show', $this->order->id))
            ->line('Please review the changes and approve if everything looks correct.')
            ->salutation('Best regards, BEO System');
    }

    /**
     * Get the array representation of the notification (for database).
     */
    public function toArray($notifiable): array
    {
        return [
            'type' => 'order_needs_review',
            'title' => 'Order Requires Re-Review',
            'message' => "Order {$this->order->custom_code} has been modified and needs your review.",
            'order_id' => $this->order->id,
            'order_code' => $this->order->custom_code,
            'event_name' => $this->order->event_name,
            'edited_by' => $this->editedBy->name,
            'edited_by_id' => $this->editedBy->id,
            'changed_fields' => $this->changedFields,
            'action_url' => route('kanit.orders.show', $this->order->id),
            'icon' => 'alert-circle',
            'color' => 'yellow'
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