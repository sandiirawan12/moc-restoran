<?php

use App\Http\Controllers\Api\QueueController;
use Illuminate\Support\Facades\Route;

Route::post('/arrive', [QueueController::class, 'arrive']);
Route::get('/status', [QueueController::class, 'status']);
Route::post('/serve', [QueueController::class, 'serve']);
Route::get('/history', [QueueController::class, 'history']);
Route::delete('/queue/{id}', [QueueController::class, 'cancelQueue']);
