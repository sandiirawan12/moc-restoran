<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Schema;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Initial tables A, B, C, D are auto-created by Migration.
        // Hapus tabel migrations sehingga database hanya memiliki 3 tabel utama:
        // restaurant_tables, waiting_queues, dan dining_sessions.
        Schema::dropIfExists('migrations');
    }
}

