<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Beo extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'order_id',
        'department_id',
        'user_id',
        'package_id',
        'notes',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function attachments()
    {
        return $this->hasMany(BeoAttachment::class);
    }

    public function package()
    {
        return $this->belongsTo(Package::class);
    }
}