<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

class HealthController extends Controller
{
    /**
     * Get system health and connectivity status.
     */
    public function index(): JsonResponse
    {
        $dbStatus = 'disconnected';
        $dbLatencyMs = null;

        try {
            $start = microtime(true);
            DB::connection()->getPdo();
            $dbLatencyMs = round((microtime(true) - $start) * 1000, 2);
            $dbStatus = 'connected';
        } catch (Throwable $e) {
            $dbStatus = 'error: ' . $e->getMessage();
        }

        return response()->json([
            'status' => 'ok',
            'application' => 'Store POS API',
            'version' => '1.0.0',
            'environment' => config('app.env', 'local'),
            'database' => [
                'status' => $dbStatus,
                'latency_ms' => $dbLatencyMs,
                'connection' => config('database.default'),
            ],
            'timestamp' => now()->toIso8601String(),
        ]);
    }
}
