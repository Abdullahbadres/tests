<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesPage extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'product_name',
        'product_description',
        'key_features',
        'target_audience',
        'price',
        'unique_selling_points',
        'template',
        'generated_content',
        'status',
    ];

    protected $casts = [
        'key_features' => 'array',
        'generated_content' => 'array',
    ];
}
