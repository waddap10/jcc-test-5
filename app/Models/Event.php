<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Event extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'event_type',
        'code'
    ];
    
    const EVENT_TYPE_CODES = [
        'conference' => 'CNF',
        'workshop' => 'WS',
        'seminar' => 'SEM',
        'webinar' => 'WEB',
        'training' => 'TRN',
        'meeting' => 'MTG',
        'exhibition' => 'EXH',
        'competition' => 'CMP',
        'festival' => 'FST',
        'concert' => 'CNT',
        'sports' => 'SPT',
        'networking' => 'NET'
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($event) {
            if (empty($event->code)) {
                $event->code = self::getEventTypeCode($event->event_type);
            }
        });
    }

    public static function getEventTypeCode($eventType)
    {
        return self::EVENT_TYPE_CODES[strtolower($eventType)] ?? 'EVT';
    }

    public static function getEventTypes()
    {
        return array_keys(self::EVENT_TYPE_CODES);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}