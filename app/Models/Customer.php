<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use SoftDeletes, HasFactory;

    protected $fillable = [
        'organizer',
        'address',
        'contact_person',
        'phone',
        'email',
        'kl_status',
    ];

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}