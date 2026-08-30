<?php

namespace App\Services;

use App\Models\DiningSession;
use App\Models\RestaurantTable;
use App\Models\WaitingQueue;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class RestaurantService
{
    // Handle kedatangan customer (assign ke meja atau masuk queue)
    public function handleArrival(string $customerName, int $partySize): array
    {
        if ($partySize < 1 || $partySize > 8) {
            throw new \InvalidArgumentException('Jumlah party harus 1 sampai 8 orang.');
        }

        // 1. Proses antrean yang sudah menunggu sebelumnya untuk meja-meja yang tersedia
        $availableTables = RestaurantTable::where('status', 'available')->orderBy('capacity', 'asc')->get();
        foreach ($availableTables as $availTable) {
            $this->autoAssignNextInQueue($availTable);
        }

        // 2. Cari meja kosong yang kapasitasnya cukup (paling mendekati)
        $table = RestaurantTable::where('status', 'available')
            ->where('capacity', '>=', $partySize)
            ->orderBy('capacity', 'asc')
            ->first();

        // 3. Evaluasi Dynamic Holding Threshold (Optimasi Revenue Bagian 3):
        // Jika meja yang tersedia mengalami pemborosan kapasitas >= 50% (berlaku untuk semua 4 meja),
        // tahan pelanggan kecil di antrean selama 15 menit agar meja kapasitas lebih besar tetap terjaga untuk rombongan yang pas.
        if ($table) {
            $wasteRatio = ($table->capacity - $partySize) / $table->capacity;

            if ($wasteRatio >= 0.5) {
                $hasSmallerTables = RestaurantTable::where('capacity', '<', $table->capacity)
                    ->where('capacity', '>=', $partySize)
                    ->exists();

                if ($hasSmallerTables) {
                    $table = null; // Simpan meja untuk rombongan yang lebih pas
                }
            }
        }

        // Jika meja tersedia, langsung dudukkan customer
        if ($table) {
            $now = Carbon::now();
            $durationMinutes = ($partySize * 15) + rand(5, 15);
            $expectedFinish = (clone $now)->addMinutes($durationMinutes);

            $session = DiningSession::create([
                'table_id' => $table->id,
                'waiting_queue_id' => null,
                'customer_name' => $customerName,
                'party_size' => $partySize,
                'seated_at' => $now,
                'duration_minutes' => $durationMinutes,
                'expected_finish_at' => $expectedFinish,
                'status' => 'active',
            ]);

            $table->update(['status' => 'occupied']);

            $this->invalidateStatusCache();

            return [
                'status' => 'seated',
                'message' => "Pelanggan {$customerName} (Party: {$partySize}) duduk di Meja {$table->code}.",
                'table' => $table->fresh(['activeSession']),
                'session' => $session,
            ];
        }

        // Jika meja penuh, masukkan ke antrean prioritas
        $now = Carbon::now();
        $queueItem = WaitingQueue::create([
            'customer_name' => $customerName,
            'party_size' => $partySize,
            'status' => 'waiting',
            'arrived_at' => $now,
        ]);

        // Hitung urutan posisi berdasarkan prioritas party terbesar
        $position = WaitingQueue::where('status', 'waiting')
            ->where(function ($query) use ($partySize, $now) {
                $query->where('party_size', '>', $partySize)
                    ->orWhere(function ($q) use ($partySize, $now) {
                        $q->where('party_size', '=', $partySize)
                            ->where('arrived_at', '<', $now);
                    });
            })->count() + 1;

        $this->invalidateStatusCache();

        return [
            'status' => 'queued',
            'message' => "Meja besar diamankan 15 menit untuk rombongan besar. {$customerName} (Party: {$partySize}) masuk antrean urutan ke-{$position}.",
            'queue' => $queueItem,
            'position' => $position,
        ];
    }

    // Auto-assign antrean teratas yang muat ke meja yang baru kosong
    public function autoAssignNextInQueue(RestaurantTable $table): ?DiningSession
    {
        $nextInQueue = WaitingQueue::where('status', 'waiting')
            ->where('party_size', '<=', $table->capacity)
            ->orderBy('party_size', 'desc')
            ->orderBy('arrived_at', 'asc')
            ->first();

        if (! $nextInQueue) {
            return null;
        }

        // Terapkan Dynamic Holding 15 Menit untuk semua 4 meja: Jangan burn meja besar untuk antrean kecil jika waste >= 50%
        // KECUALI jika pelanggan kecil sudah menunggu selama 15 menit atau lebih.
        $wasteRatio = ($table->capacity - $nextInQueue->party_size) / $table->capacity;
        if ($wasteRatio >= 0.5) {
            $now = Carbon::now();
            $arrivedAt = $nextInQueue->arrived_at ? Carbon::parse($nextInQueue->arrived_at) : $now;
            $waitedMinutes = $arrivedAt->diffInMinutes($now);

            // Jika belum 15 menit menunggu, tahan antrean kecil agar meja kapasitas lebih besar tetap terjaga
            if ($waitedMinutes < 15) {
                return null;
            }
        }

        $now = Carbon::now();
        $durationMinutes = ($nextInQueue->party_size * 15) + rand(5, 15);
        $expectedFinish = (clone $now)->addMinutes($durationMinutes);

        $session = DiningSession::create([
            'table_id' => $table->id,
            'waiting_queue_id' => $nextInQueue->id,
            'customer_name' => $nextInQueue->customer_name,
            'party_size' => $nextInQueue->party_size,
            'seated_at' => $now,
            'duration_minutes' => $durationMinutes,
            'expected_finish_at' => $expectedFinish,
            'status' => 'active',
        ]);

        $nextInQueue->update(['status' => 'seated']);
        $table->update(['status' => 'occupied']);

        return $session;
    }

    // Force complete sesi makan atau manual assign dari antrean (Drag & Drop)
    public function serveOrComplete(array $payload): array
    {
        $tableId = $payload['table_id'] ?? null;
        $queueId = $payload['queue_id'] ?? null;
        $action = $payload['action'] ?? 'complete';

        $table = RestaurantTable::findOrFail($tableId);

        // Manual assign antrean ke meja
        if ($action === 'assign' && $queueId) {
            $queueItem = WaitingQueue::where('status', 'waiting')->findOrFail($queueId);

            if ($queueItem->party_size > $table->capacity) {
                throw new \InvalidArgumentException("Party size ({$queueItem->party_size}) melebihi kapasitas Meja {$table->code} ({$table->capacity}).");
            }

            if ($table->status === 'occupied') {
                throw new \InvalidArgumentException("Meja {$table->code} sedang terisi.");
            }

            $now = Carbon::now();
            $durationMinutes = ($queueItem->party_size * 15) + rand(5, 15);
            $expectedFinish = (clone $now)->addMinutes($durationMinutes);

            $session = DiningSession::create([
                'table_id' => $table->id,
                'waiting_queue_id' => $queueItem->id,
                'customer_name' => $queueItem->customer_name,
                'party_size' => $queueItem->party_size,
                'seated_at' => $now,
                'duration_minutes' => $durationMinutes,
                'expected_finish_at' => $expectedFinish,
                'status' => 'active',
            ]);

            $queueItem->update(['status' => 'seated']);
            $table->update(['status' => 'occupied']);

            $this->invalidateStatusCache();

            return [
                'success' => true,
                'message' => "Pelanggan {$queueItem->customer_name} berhasil di-assign ke Meja {$table->code}.",
                'session' => $session,
            ];
        }

        // Complete / Force complete meja
        $activeSession = DiningSession::where('table_id', $table->id)
            ->where('status', 'active')
            ->first();

        if ($activeSession) {
            $completedAt = Carbon::now();
            $actualDuration = max(1, (int) round($activeSession->seated_at->diffInSeconds($completedAt) / 60));

            $activeSession->update([
                'completed_at' => $completedAt,
                'duration_minutes' => $actualDuration,
                'status' => $action === 'force' ? 'force_completed' : 'completed',
            ]);
        }

        $table->update(['status' => 'available']);

        // Cek antrean berikutnya untuk langsung menduduki meja yang baru kosong
        $autoSession = $this->autoAssignNextInQueue($table);

        $this->invalidateStatusCache();

        $msg = "Meja {$table->code} telah dikosongkan.";
        if ($autoSession) {
            $msg .= " Antrean selanjutnya ({$autoSession->customer_name}) langsung menduduki Meja {$table->code}.";
        }

        return [
            'success' => true,
            'message' => $msg,
            'auto_assigned' => (bool) $autoSession,
        ];
    }

    /**
     * Invalidate status cache in Redis
     */
    public function invalidateStatusCache(): void
    {
        try {
            Cache::forget('restaurant:status');
        } catch (\Throwable $e) {
            // Fallback jika Redis service offline
        }
    }

    /**
     * Status real-time 4 meja & list antrean dengan Redis caching & fallback
     */
    public function getStatus(): array
    {
        try {
            $cached = Cache::get('restaurant:status');
            if (is_array($cached) && !empty($cached['tables']) && isset($cached['queue']) && is_array($cached['queue'])) {
                $now = Carbon::now();
                $cached['server_time'] = $now->toIso8601String();
                $cached['cached_in_redis'] = true;

                return $cached;
            }
        } catch (\Throwable $e) {
            // Fallback jika Redis tidak dapat diakses
        }

        $result = $this->calculateStatus();

        if (!empty($result['tables'])) {
            try {
                Cache::put('restaurant:status', $result, 5); // 5 detik TTL di Redis Cache
            } catch (\Throwable $e) {
                // Fallback jika Redis tidak dapat diakses
            }
        }

        $result['cached_in_redis'] = false;

        return $result;
    }

    /**
     * Kalkulasi status meja dan antrean secara murni dari database
     */
    public function calculateStatus(): array
    {
        $now = Carbon::now();

        // 1. Auto-complete sesi makan yang waktunya sudah habis (expected_finish_at <= now)
        // dan langsung dudukkan antrean berikutnya yang menunggu.
        $expiredSessions = DiningSession::where('status', 'active')
            ->where('expected_finish_at', '<=', $now)
            ->get();

        foreach ($expiredSessions as $expired) {
            $actualDuration = max(1, (int) round($expired->seated_at->diffInSeconds($now) / 60));

            $expired->update([
                'completed_at' => $now,
                'duration_minutes' => $actualDuration,
                'status' => 'completed',
            ]);

            $table = RestaurantTable::find($expired->table_id);
            if ($table) {
                $table->update(['status' => 'available']);
                $this->autoAssignNextInQueue($table);
            }
        }

        $tables = RestaurantTable::orderBy('code')->get()->map(function ($t) use ($now) {
            $activeSession = DiningSession::where('table_id', $t->id)
                ->where('status', 'active')
                ->first();

            $sessionData = null;
            if ($activeSession) {
                $remainingSeconds = max(0, $activeSession->expected_finish_at->timestamp - $now->timestamp);
                $elapsedSeconds = max(0, $now->timestamp - $activeSession->seated_at->timestamp);

                // Warna status:
                // green = tersedia
                // blue = baru duduk (< 3 mnt)
                // yellow = sedang makan (> 5 mnt sisa)
                // red = hampir selesai (<= 5 mnt sisa)
                $color = 'yellow';
                if ($remainingSeconds <= 300) {
                    $color = 'red';
                } elseif ($elapsedSeconds < 180) {
                    $color = 'blue';
                }

                $sessionData = [
                    'id' => $activeSession->id,
                    'customer_name' => $activeSession->customer_name,
                    'party_size' => $activeSession->party_size,
                    'seated_at' => $activeSession->seated_at->toIso8601String(),
                    'duration_minutes' => $activeSession->duration_minutes,
                    'expected_finish_at' => $activeSession->expected_finish_at->toIso8601String(),
                    'remaining_seconds' => $remainingSeconds,
                    'elapsed_seconds' => $elapsedSeconds,
                    'color_status' => $color,
                ];
            }

            return [
                'id' => $t->id,
                'code' => $t->code,
                'capacity' => $t->capacity,
                'status' => $t->status,
                'active_session' => $sessionData,
            ];
        });

        // Queue list diprioritaskan party_size DESC
        $queue = WaitingQueue::where('status', 'waiting')
            ->orderBy('party_size', 'desc')
            ->orderBy('arrived_at', 'asc')
            ->get()
            ->values()
            ->map(function ($q, $index) use ($now) {
                // Cari estimasi waktu tercepat dari meja terisi yang muat untuk party ini
                $earliestSession = DiningSession::where('status', 'active')
                    ->whereHas('table', function ($tblQuery) use ($q) {
                        $tblQuery->where('capacity', '>=', $q->party_size);
                    })
                    ->orderBy('expected_finish_at', 'asc')
                    ->first();

                $estSeatedAt = $earliestSession ? $earliestSession->expected_finish_at : null;
                $estRemainingMinutes = $estSeatedAt ? max(1, (int) ceil($now->diffInSeconds($estSeatedAt) / 60)) : null;

                return [
                    'id' => $q->id,
                    'customer_name' => $q->customer_name,
                    'party_size' => $q->party_size,
                    'arrived_at' => $q->arrived_at->toIso8601String(),
                    'position' => $index + 1,
                    'estimated_seated_at' => $estSeatedAt ? $estSeatedAt->toIso8601String() : null,
                    'estimated_time_formatted' => $estSeatedAt ? $estSeatedAt->format('H:i') : null,
                    'estimated_remaining_minutes' => $estRemainingMinutes,
                    'target_table_code' => $earliestSession && $earliestSession->table ? $earliestSession->table->code : null,
                ];
            });

        return [
            'tables' => $tables,
            'queue' => $queue,
            'server_time' => $now->toIso8601String(),
        ];
    }

    // Riwayat makan dengan search, filter, dan sort
    public function getHistory(array $params = []): array
    {
        // Pastikan durasi aktual tercatat untuk semua data yang sudah selesai
        DiningSession::whereIn('status', ['completed', 'force_completed'])
            ->whereNotNull('completed_at')
            ->get()
            ->each(function ($session) {
                if ($session->seated_at && $session->completed_at) {
                    $actual = max(1, (int) round($session->seated_at->diffInSeconds($session->completed_at) / 60));
                    if ($session->duration_minutes !== $actual) {
                        $session->update(['duration_minutes' => $actual]);
                    }
                }
            });

        $query = DiningSession::with('table')
            ->whereIn('status', ['completed', 'force_completed']);

        if (! empty($params['search']) && trim($params['search']) !== '') {
            $searchTerm = trim($params['search']);
            $query->where('customer_name', 'like', '%'.$searchTerm.'%');
        }

        if (! empty($params['status']) && $params['status'] !== 'all') {
            $query->where('status', $params['status']);
        }

        if (! empty($params['party_size']) && is_numeric($params['party_size'])) {
            $query->where('party_size', (int) $params['party_size']);
        }

        $sortBy = $params['sort_by'] ?? 'completed_at';
        $sortDir = strtolower($params['sort_dir'] ?? 'desc') === 'asc' ? 'asc' : 'desc';

        $allowedSorts = ['customer_name', 'party_size', 'table_id', 'seated_at', 'completed_at', 'duration_minutes', 'status'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir);
            if ($sortBy !== 'completed_at') {
                $query->orderBy('completed_at', 'desc');
            }
            $query->orderBy('id', 'desc');
        } else {
            $query->orderBy('completed_at', 'desc')->orderBy('id', 'desc');
        }

        $history = $query->paginate($params['per_page'] ?? 20);

        return [
            'data' => $history->items(),
            'current_page' => $history->currentPage(),
            'last_page' => $history->lastPage(),
            'total' => $history->total(),
        ];
    }

    // Pembatalan antrean jika pelanggan tidak jadi makan / meninggalkan antrean
    public function cancelQueue(int $queueId): array
    {
        $queueItem = WaitingQueue::where('status', 'waiting')->findOrFail($queueId);
        $customerName = $queueItem->customer_name;
        $partySize = $queueItem->party_size;

        $queueItem->update(['status' => 'cancelled']);

        $this->invalidateStatusCache();

        return [
            'success' => true,
            'message' => "Antrean {$customerName} (Party: {$partySize}) telah dibatalkan.",
        ];
    }
}
