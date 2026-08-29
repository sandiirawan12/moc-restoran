<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class RestaurantTable extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'capacity',
        'status',
    ];

    public function diningSessions(): HasMany
    {
        return $tableSessions = $this->hasMany(DiningSession::class, 'table_id');
    }

    public function activeSession(): HasOne
    {
        return $this->hasOne(DiningSession::class, 'table_id')->where('status', 'active');
    }
}
