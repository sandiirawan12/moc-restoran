<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DiningSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'table_id',
        'waiting_queue_id',
        'customer_name',
        'party_size',
        'seated_at',
        'duration_minutes',
        'expected_finish_at',
        'completed_at',
        'status',
    ];

    protected $casts = [
        'seated_at' => 'datetime',
        'expected_finish_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function table(): BelongsTo
    {
        return $this->belongsTo(RestaurantTable::class, 'table_id');
    }

    public function queueItem(): BelongsTo
    {
        return $this->belongsTo(WaitingQueue::class, 'waiting_queue_id');
    }
}
