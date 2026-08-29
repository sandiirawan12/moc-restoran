<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('restaurant_tables')) {
            Schema::create('restaurant_tables', function (Blueprint $table) {
                $table->id();
                $table->string('code')->unique();
                $table->integer('capacity');
                $table->enum('status', ['available', 'occupied', 'reserved'])->default('available');
                $table->timestamps();
            });

            // Insert initial 4 standard tables A(2), B(4), C(6), D(8)
            DB::table('restaurant_tables')->insert([
                ['code' => 'A', 'capacity' => 2, 'status' => 'available', 'created_at' => now(), 'updated_at' => now()],
                ['code' => 'B', 'capacity' => 4, 'status' => 'available', 'created_at' => now(), 'updated_at' => now()],
                ['code' => 'C', 'capacity' => 6, 'status' => 'available', 'created_at' => now(), 'updated_at' => now()],
                ['code' => 'D', 'capacity' => 8, 'status' => 'available', 'created_at' => now(), 'updated_at' => now()],
            ]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('restaurant_tables');
    }
};
