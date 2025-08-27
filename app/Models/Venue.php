<?php

namespace App\Models;

use App\Traits\HasFileStorage;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Venue extends Model
{
    use SoftDeletes, HasFactory, HasFileStorage;

    protected $fillable = [
        'name',
        'short',
        'photo',
        'description',
        'dimension_m',
        'dimension_f',
        'setup_banquet',
        'setup_classroom',
        'setup_theater',
        'setup_reception',
        'floor_plan'
    ];

    // Specific accessors for your image fields
    public function getPhotoUrlAttribute()
    {
        return $this->getFileUrl('photo');
    }

    public function getFloorPlanUrlAttribute()
    {
        return $this->getFileUrl('floor_plan');
    }

    // Convenience methods
    public function storePhoto($file)
    {
        return $this->storeFile($file, 'photo', 'venues/photos');
    }

    public function storeFloorPlan($file)
    {
        return $this->storeFile($file, 'floor_plan', 'venues/floor-plans');
    }

    public function orders()
    {
        return $this->belongsToMany(Order::class);
    }
}