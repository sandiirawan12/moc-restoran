<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('waiting_queues', function (Blueprint $table) {
            $table->id();
            $table->string('customer_name');
            $table->integer('party_size');
            $table->enum('status', ['waiting', 'seated', 'cancelled'])->default('waiting');
            $table->timestamp('arrived_at');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('waiting_queues');
    }
};
