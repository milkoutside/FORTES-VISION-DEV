<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'isActive',
        'createdAt',
        'nextBatchId',
        'endDate',
        'startDate',
        'clientName',
        'deadlineType'
    ];

    protected $casts = [
        'isActive' => 'boolean',
        'createdAt' => 'datetime',
        'endDate' => 'date',
        'startDate' => 'date',
    ];

    public function batches()
    {
        return $this->hasMany(Batch::class);
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'project_user')
            ->withPivot('role')
            ->withTimestamps();
    }
} 