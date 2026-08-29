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
        if (! Schema::hasTable('dining_sessions')) {
            Schema::create('dining_sessions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('table_id')->constrained('restaurant_tables')->onDelete('cascade');
                $table->foreignId('waiting_queue_id')->nullable()->constrained('waiting_queues')->onDelete('set null');
                $table->string('customer_name');
                $table->integer('party_size');
                $table->timestamp('seated_at');
                $table->integer('duration_minutes');
                $table->timestamp('expected_finish_at');
                $table->timestamp('completed_at')->nullable();
                $table->enum('status', ['active', 'completed', 'force_completed'])->default('active');
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dining_sessions');
    }
};
