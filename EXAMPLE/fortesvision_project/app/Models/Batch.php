<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Batch extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'project_id'
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function images()
    {
        return $this->hasMany(Image::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'batch_user')
            ->withPivot('role')
            ->withTimestamps();
    }
} 