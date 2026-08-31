<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Unit extends Model
{
    use HasFactory;

    protected $table = 'product_units';

    protected $fillable = [
        'name',
        'short_name',
        'allow_decimal',
    ];

    protected $casts = [
        'allow_decimal' => 'boolean',
    ];

    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'unit_id');
    }
}
