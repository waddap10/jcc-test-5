<?php
namespace App\Models;
use App\Traits\HasFileStorage;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class BeoAttachment extends Model
{
    use SoftDeletes, HasFileStorage;
    
    protected $fillable = [
        'beo_id',
        'file_name'
    ];

    // Change this from getFileNameUrlAttribute to getUrlAttribute
    public function getUrlAttribute()
    {
        return $this->getFileUrl('file_name');
    }

    public function storeAttachment($file)
    {
        return $this->storeFile($file, 'file_name', 'beos/attachments');
    }

    public function beo()
    {
        return $this->belongsTo(Beo::class);
    }
}