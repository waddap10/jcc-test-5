<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Schedule extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'start_date',
        'end_date',
        'time_start',
        'time_end',
        'function',
        'people',
        'order_id',
    ];

    protected $casts = [
    'start_date' => 'date:Y-m-d',
    'end_date' => 'date:Y-m-d', 
    'time_start' => 'datetime:H:i',
    'time_end' => 'datetime:H:i',
        'people'    => 'integer',
    ];

    public function venue()
    {
        return $this->belongsTo(Venue::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}