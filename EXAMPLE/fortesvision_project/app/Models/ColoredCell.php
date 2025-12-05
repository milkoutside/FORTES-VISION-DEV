<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ColoredCell extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'batch_id',
        'image_id',
        'status_id',
        'date',
        'completed'
    ];

    protected $casts = [
        'date' => 'date',
        'completed' => 'boolean'
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function batch()
    {
        return $this->belongsTo(Batch::class);
    }

    public function image()
    {
        return $this->belongsTo(Image::class);
    }

    public function status()
    {
        return $this->belongsTo(Status::class);
    }
} 