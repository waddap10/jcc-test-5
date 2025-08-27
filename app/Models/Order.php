<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'custom_code',
        'event_id',
        'event_name',
        'start_date',
        'end_date',
        'status',
        'status_beo',
        'customer_id',
        'discount',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($order) {
            if (empty($order->custom_code)) {
                $order->custom_code = self::generateCustomCode($order->event_id);
            }
        });
    }

    public static function generateCustomCode($eventId)
{
    $event = Event::find($eventId);
    if (!$event) {
        throw new \Exception('Event not found');
    }

    // Get event code
    $eventCode = $event->code;

    // Get all existing custom codes for this event (including soft-deleted)
    $existingCodes = self::withTrashed()
        ->where('event_id', $eventId)
        ->whereNotNull('custom_code')
        ->pluck('custom_code')
        ->map(function ($code) use ($eventCode) {
            // Extract the numeric part
            return (int) substr($code, strlen($eventCode));
        })
        ->sort()
        ->values()
        ->toArray();

    // Find the first gap in the sequence or use the next number
    $nextNumber = 1;
    foreach ($existingCodes as $number) {
        if ($number == $nextNumber) {
            $nextNumber++;
        } else {
            break; // Found a gap
        }
    }

    // Format as 5-digit number with leading zeros
    $formattedNumber = str_pad($nextNumber, 5, '0', STR_PAD_LEFT);
    return $eventCode . $formattedNumber;
}

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function getCustomCodeNumberAttribute()
    {
        if (!$this->custom_code || !$this->event) {
            return null;
        }

        return (int) substr($this->custom_code, strlen($this->event->code));
    }

    public function scopeByEventType($query, $eventType)
    {
        return $query->whereHas('event', function ($q) use ($eventType) {
            $q->where('event_type', $eventType);
        });
    }

    public function scopeByCodePattern($query, $pattern)
    {
        return $query->where('custom_code', 'LIKE', $pattern . '%');
    }


    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function venues()
    {
        return $this->belongsToMany(Venue::class);
    }

    public function schedules()
    {
        return $this->hasMany(Schedule::class);
    }

    public function beos()
    {
        return $this->hasMany(Beo::class);
    }

    public function attachments()
    {
        return $this->hasMany(OrderAttachment::class);
    }

    public function beoFile(): HasOne
    {
        return $this->hasOne(BeoFile::class);
    }
}