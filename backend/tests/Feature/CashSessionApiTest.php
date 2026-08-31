<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CashSessionApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create(['status' => 'active']);
    }

    public function test_can_open_and_close_cash_session_with_variance_calculation(): void
    {
        // 1. Open session with 200.00 Float
        $openResponse = $this->actingAs($this->user, 'sanctum')->postJson('/api/cash-sessions/open', [
            'opening_cash' => 200.00,
            'notes' => 'جلسة صباحية',
        ]);

        $openResponse->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'opening_cash' => '200.00',
                    'status' => 'open',
                ],
            ]);

        $sessionId = $openResponse->json('data.id');

        // 2. Record Cash In (+50)
        $inResponse = $this->actingAs($this->user, 'sanctum')->postJson("/api/cash-sessions/{$sessionId}/cash-movement", [
            'type' => 'in',
            'amount' => 50.00,
            'reason' => 'فكة نقدية إضافية',
        ]);
        $inResponse->assertStatus(201);

        // 3. Record Cash Out (-30)
        $outResponse = $this->actingAs($this->user, 'sanctum')->postJson("/api/cash-sessions/{$sessionId}/cash-movement", [
            'type' => 'out',
            'amount' => 30.00,
            'reason' => 'سحب نقدي مؤقت',
        ]);
        $outResponse->assertStatus(201);

        // Expected cash: 200 + 50 - 30 = 220.00
        // 4. Close session with Actual 225.00 (+5.00 surplus)
        $closeResponse = $this->actingAs($this->user, 'sanctum')->postJson("/api/cash-sessions/{$sessionId}/close", [
            'closing_cash_actual' => 225.00,
            'notes' => 'جرد نهاية الوردية',
        ]);

        $closeResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'closed',
                    'closing_cash_expected' => '220.00',
                    'closing_cash_actual' => '225.00',
                    'difference_amount' => '5.00',
                ],
                'z_report' => [
                    'variance_status' => 'surplus',
                    'difference' => 5.0,
                ],
            ]);
    }
}
