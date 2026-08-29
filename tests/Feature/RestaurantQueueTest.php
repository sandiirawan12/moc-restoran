<?php

namespace Tests\Feature;

use App\Models\DiningSession;
use App\Models\RestaurantTable;
use App\Models\WaitingQueue;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class RestaurantQueueTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();

        // Clear waiting queues & dining sessions, reset table statuses
        WaitingQueue::query()->delete();
        DiningSession::query()->delete();
        RestaurantTable::query()->update(['status' => 'available']);
    }

    /** Test 1: Validation fails for invalid party size */
    public function test_customer_arrival_validation_fails_for_invalid_party_size(): void
    {
        $response = $this->postJson('/api/arrive', [
            'customer_name' => 'Alice',
            'party_size' => 10, // Invalid (> 8)
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['party_size']);
    }

    /** Test 2: Validation fails when customer name is missing */
    public function test_customer_arrival_validation_fails_when_name_missing(): void
    {
        $response = $this->postJson('/api/arrive', [
            'party_size' => 4,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['customer_name']);
    }

    /** Test 3: Table assignment selects closest matching capacity (non-oversize) */
    public function test_table_assignment_selects_closest_matching_capacity(): void
    {
        // Party of 3 should get Table B (capacity 4), not C(6) or D(8)
        $response = $this->postJson('/api/arrive', [
            'customer_name' => 'Bob',
            'party_size' => 3,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'status' => 'seated',
            ]);

        $tableB = RestaurantTable::where('code', 'B')->first();
        $this->assertEquals('occupied', $tableB->status);

        $this->assertDatabaseHas('dining_sessions', [
            'table_id' => $tableB->id,
            'customer_name' => 'Bob',
            'party_size' => 3,
            'status' => 'active',
        ]);
    }

    /** Test 4: Party pushed to queue when fitting tables are occupied or held by Dynamic Holding */
    public function test_party_pushed_to_queue_when_fitting_tables_occupied(): void
    {
        // Occupy Table A (capacity 2)
        $tableA = RestaurantTable::where('code', 'A')->first();
        $tableA->update(['status' => 'occupied']);

        // Party of 2 arrives -> Table A is occupied, Table B (cap 4) has waste 50%, so gets queued for 15 minutes to save Meja B!
        $response1 = $this->postJson('/api/arrive', [
            'customer_name' => 'Party2_First',
            'party_size' => 2,
        ]);

        $response1->assertStatus(201)
            ->assertJson(['status' => 'queued']);

        // Occupy Table B, C, D as well
        RestaurantTable::query()->update(['status' => 'occupied']);
        sleep(1);

        // Now party of 2 arrives -> No tables available -> Pushed to queue
        $response2 = $this->postJson('/api/arrive', [
            'customer_name' => 'Party2_Queued',
            'party_size' => 2,
        ]);

        $response2->assertStatus(201)
            ->assertJson([
                'status' => 'queued',
                'position' => 2,
            ]);

        $this->assertDatabaseHas('waiting_queues', [
            'customer_name' => 'Party2_Queued',
            'status' => 'waiting',
        ]);
    }

    /** Test 5: Waiting queue prioritizes largest party size first (NOT FIFO) */
    public function test_waiting_queue_prioritizes_largest_party_first(): void
    {
        // Occupy all tables
        RestaurantTable::query()->update(['status' => 'occupied']);

        // First customer: party of 2 arrives
        $this->postJson('/api/arrive', [
            'customer_name' => 'Small Party',
            'party_size' => 2,
        ]);

        // Second customer: party of 6 arrives later
        $this->postJson('/api/arrive', [
            'customer_name' => 'Large Party',
            'party_size' => 6,
        ]);

        // Check GET /api/status queue ordering
        $response = $this->getJson('/api/status');
        $response->assertStatus(200);

        $queue = $response->json('queue');
        $this->assertCount(2, $queue);

        // Priority order must put Large Party (size 6) FIRST over Small Party (size 2)!
        $this->assertEquals('Large Party', $queue[0]['customer_name']);
        $this->assertEquals(6, $queue[0]['party_size']);

        $this->assertEquals('Small Party', $queue[1]['customer_name']);
        $this->assertEquals(2, $queue[1]['party_size']);
    }

    /** Test 6: Force complete frees table and auto-assigns next eligible queue customer */
    public function test_force_complete_frees_table_and_auto_assigns_queue_customer(): void
    {
        $tableB = RestaurantTable::where('code', 'B')->first(); // capacity 4

        // Create active session on Table B
        DiningSession::create([
            'table_id' => $tableB->id,
            'customer_name' => 'Current Seated',
            'party_size' => 4,
            'seated_at' => Carbon::now(),
            'duration_minutes' => 60,
            'expected_finish_at' => Carbon::now()->addMinutes(60),
            'status' => 'active',
        ]);
        $tableB->update(['status' => 'occupied']);

        // Add waiting customer in queue (party size 4)
        $queueItem = WaitingQueue::create([
            'customer_name' => 'Queued Customer',
            'party_size' => 4,
            'status' => 'waiting',
            'arrived_at' => Carbon::now(),
        ]);

        // Trigger POST /api/serve with force action
        $response = $this->postJson('/api/serve', [
            'table_id' => $tableB->id,
            'action' => 'force',
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true, 'auto_assigned' => true]);

        // Previous session should be force_completed
        $this->assertDatabaseHas('dining_sessions', [
            'customer_name' => 'Current Seated',
            'status' => 'force_completed',
        ]);

        // Queue item should be seated
        $this->assertDatabaseHas('waiting_queues', [
            'id' => $queueItem->id,
            'status' => 'seated',
        ]);

        // Table B should still be occupied by the auto-assigned customer!
        $this->assertEquals('occupied', $tableB->fresh()->status);
    }

    /** Test 7: Manual queue assignment to table validates capacity */
    public function test_manual_queue_assignment_validates_capacity(): void
    {
        $tableA = RestaurantTable::where('code', 'A')->first(); // capacity 2

        $queueItem = WaitingQueue::create([
            'customer_name' => 'Big Group',
            'party_size' => 5,
            'status' => 'waiting',
            'arrived_at' => Carbon::now(),
        ]);

        // Attempt manual assignment of party of 5 to Table A (cap 2)
        $response = $this->postJson('/api/serve', [
            'table_id' => $tableA->id,
            'queue_id' => $queueItem->id,
            'action' => 'assign',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Party size (5) melebihi kapasitas Meja A (2).');
    }

    /** Test 8: History endpoint returns completed sessions with search & sorting */
    public function test_history_endpoint_returns_completed_sessions_with_filters_and_sort(): void
    {
        $tableA = RestaurantTable::where('code', 'A')->first();

        DiningSession::create([
            'table_id' => $tableA->id,
            'customer_name' => 'John Doe',
            'party_size' => 2,
            'seated_at' => Carbon::now()->subHour(),
            'duration_minutes' => 30,
            'expected_finish_at' => Carbon::now()->subMinutes(30),
            'completed_at' => Carbon::now()->subMinutes(30),
            'status' => 'completed',
        ]);

        DiningSession::create([
            'table_id' => $tableA->id,
            'customer_name' => 'Jane Smith',
            'party_size' => 2,
            'seated_at' => Carbon::now()->subHours(2),
            'duration_minutes' => 45,
            'expected_finish_at' => Carbon::now()->subHours(1),
            'completed_at' => Carbon::now()->subHours(1),
            'status' => 'force_completed',
        ]);

        $response = $this->getJson('/api/history?search=John');

        $response->assertStatus(200)
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.customer_name', 'John Doe');
    }

    /** Test 9: Existing queue item gets seated before new arrival if table is available */
    public function test_existing_queue_seated_before_new_arrival_when_table_available(): void
    {
        $tableA = RestaurantTable::where('code', 'A')->first();

        // Queue customer waiting
        $existingQueue = WaitingQueue::create([
            'customer_name' => 'Existing Queue Doni',
            'party_size' => 2,
            'status' => 'waiting',
            'arrived_at' => Carbon::now()->subMinutes(10),
        ]);

        // New arrival comes in
        $response = $this->postJson('/api/arrive', [
            'customer_name' => 'New Arrival Eka',
            'party_size' => 2,
        ]);

        // Existing queue customer should be seated first at Meja A!
        $this->assertDatabaseHas('dining_sessions', [
            'table_id' => $tableA->id,
            'customer_name' => 'Existing Queue Doni',
            'status' => 'active',
        ]);

        $this->assertDatabaseHas('waiting_queues', [
            'id' => $existingQueue->id,
            'status' => 'seated',
        ]);
    }

    /** Test 10: Dynamic holding preserves Meja D (cap 8) for large party when small party arrives */
    public function test_dynamic_holding_preserves_large_table_for_large_party(): void
    {
        $tableA = RestaurantTable::where('code', 'A')->first();
        $tableB = RestaurantTable::where('code', 'B')->first();
        $tableC = RestaurantTable::where('code', 'C')->first();

        // Occupy Meja A(2), B(4), C(6)
        $tableA->update(['status' => 'occupied']);
        $tableB->update(['status' => 'occupied']);
        $tableC->update(['status' => 'occupied']);

        // Meja D(8) is available.
        // Customer "Angel" (Party 2) arrives.
        // Waste ratio on Meja D = 75% >= 50%. Small party Angel should NOT take Meja D.
        $response = $this->postJson('/api/arrive', [
            'customer_name' => 'Angel',
            'party_size' => 2,
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('status', 'queued');

        // Verify Angel is queued to preserve Meja D(8)
        $this->assertDatabaseHas('waiting_queues', [
            'customer_name' => 'Angel',
            'party_size' => 2,
            'status' => 'waiting',
        ]);

        // Now large party "Sandi" (Party 8) arrives: Meja D(8) is available!
        $sandiResponse = $this->postJson('/api/arrive', [
            'customer_name' => 'Sandi',
            'party_size' => 8,
        ]);

        $sandiResponse->assertStatus(201)
            ->assertJsonPath('status', 'seated');

        $this->assertDatabaseHas('dining_sessions', [
            'customer_name' => 'Sandi',
            'party_size' => 8,
            'status' => 'active',
        ]);
    }

    /** Test 11: Queue item can be cancelled via DELETE /api/queue/{id} */
    public function test_cancel_queue_endpoint_cancels_waiting_customer(): void
    {
        $queueItem = WaitingQueue::create([
            'customer_name' => 'Cancel Me Customer',
            'party_size' => 4,
            'status' => 'waiting',
            'arrived_at' => Carbon::now(),
        ]);

        $response = $this->deleteJson("/api/queue/{$queueItem->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('waiting_queues', [
            'id' => $queueItem->id,
            'status' => 'cancelled',
        ]);
    }

    /** Test 12: Small party in queue gets auto-seated to Meja D (cap 8) after waiting 15 minutes with no large party */
    public function test_dynamic_holding_auto_seats_small_party_after_15_minutes_if_no_large_party(): void
    {
        $tableD = RestaurantTable::where('code', 'D')->first();

        // Small party Angel (Party 2) has been waiting for 16 minutes
        $waitingAngel = WaitingQueue::create([
            'customer_name' => 'Angel 15 Mnt',
            'party_size' => 2,
            'status' => 'waiting',
            'arrived_at' => Carbon::now()->subMinutes(16),
        ]);

        // Call status/auto-assign check
        $service = app(\App\Services\RestaurantService::class);
        $session = $service->autoAssignNextInQueue($tableD);

        $this->assertNotNull($session);
        $this->assertEquals('Angel 15 Mnt', $session->customer_name);
        $this->assertEquals($tableD->id, $session->table_id);

        $this->assertDatabaseHas('waiting_queues', [
            'id' => $waitingAngel->id,
            'status' => 'seated',
        ]);
    }
}
