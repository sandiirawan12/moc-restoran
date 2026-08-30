<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\RestaurantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QueueController extends Controller
{
    protected RestaurantService $restaurantService;

    public function __construct(RestaurantService $restaurantService)
    {
        $this->restaurantService = $restaurantService;
    }

    /**
     * POST /api/arrive
     * Mendaftarkan kedatangan pelanggan baru.
     */
    public function arrive(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'customer_name' => 'required|string|max:100',
            'party_size' => 'required|integer|min:1|max:8',
        ], [
            'customer_name.required' => 'Nama pelanggan wajib diisi.',
            'party_size.required' => 'Jumlah party wajib diisi.',
            'party_size.min' => 'Party size minimal 1 orang.',
            'party_size.max' => 'Party size maksimal 8 orang.',
        ]);

        try {
            $result = $this->restaurantService->handleArrival(
                $validated['customer_name'],
                (int) $validated['party_size']
            );

            return response()->json($result, 201);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * GET /api/status
     * Mengambil status real-time 4 meja (terisi/kosong/sisa waktu) dan daftar antrean prioritas.
     */
    public function status(Request $request): JsonResponse
    {
        $refresh = $request->boolean('refresh') || $request->has('refresh');
        $status = $this->restaurantService->getStatus($refresh);
        return response()->json($status);
    }

    /**
     * POST /api/serve
     * Mengosongkan meja (force complete) atau menempatkan antrean manual ke meja (drag & drop).
     */
    public function serve(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'table_id' => 'required|integer|exists:restaurant_tables,id',
            'queue_id' => 'nullable|integer|exists:waiting_queues,id',
            'action' => 'nullable|string|in:complete,force,assign',
        ]);

        try {
            $result = $this->restaurantService->serveOrComplete($validated);
            return response()->json($result);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * GET /api/history
     * Mengambil riwayat makan yang sudah selesai dengan pencarian, filter status & party, serta multi-column sort.
     */
    public function history(Request $request): JsonResponse
    {
        $params = $request->only(['search', 'status', 'party_size', 'sort_by', 'sort_dir', 'page', 'per_page']);
        $refresh = $request->boolean('refresh') || $request->has('refresh');
        $history = $this->restaurantService->getHistory($params, $refresh);
        return response()->json($history);
    }

    /**
     * DELETE /api/queue/{id}
     * Membatalkan antrean jika pelanggan tidak jadi makan.
     */
    public function cancelQueue(int $id): JsonResponse
    {
        try {
            $result = $this->restaurantService->cancelQueue($id);
            return response()->json($result);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Antrean tidak ditemukan atau sudah diproses.',
            ], 404);
        }
    }
}
