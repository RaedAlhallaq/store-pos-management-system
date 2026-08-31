<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthTest extends TestCase
{
    /**
     * Test health check endpoint returns 200 and correct structure.
     */
    public function test_health_check_returns_ok_status(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'application',
                'version',
                'environment',
                'database' => [
                    'status',
                    'connection',
                ],
                'timestamp',
            ])
            ->assertJson([
                'status' => 'ok',
                'application' => 'Store POS API',
            ]);
    }
}
