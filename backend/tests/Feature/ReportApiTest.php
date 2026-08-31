<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create(['status' => 'active']);
    }

    public function test_can_fetch_profit_loss_and_tax_reports(): void
    {
        $plResponse = $this->actingAs($this->user, 'sanctum')->getJson('/api/reports/profit-loss');
        $plResponse->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'total_revenue',
                    'subtotal_before_tax',
                    'total_tax_collected',
                    'cost_of_goods_sold',
                    'gross_profit',
                    'total_operating_expenses',
                    'net_profit',
                ],
            ]);

        $taxResponse = $this->actingAs($this->user, 'sanctum')->getJson('/api/reports/sales-tax');
        $taxResponse->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'total_sales',
                    'taxable_amount',
                    'tax_amount',
                    'payments_breakdown',
                ],
            ]);
    }
}
