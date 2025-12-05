<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Image extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'batch_id'
    ];

    public function batch()
    {
        return $this->belongsTo(Batch::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'image_user')
            ->withPivot('role')
            ->withTimestamps();
    }
} 