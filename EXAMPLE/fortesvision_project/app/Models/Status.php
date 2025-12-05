<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Status extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'color',
        'text_color'
    ];

    public function coloredCells()
    {
        return $this->hasMany(ColoredCell::class);
    }
} 