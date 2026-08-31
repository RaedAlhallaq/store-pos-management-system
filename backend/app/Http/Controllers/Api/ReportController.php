<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\ReportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(
        protected ReportService $reportService
    ) {}

    public function profitLoss(Request $request): JsonResponse
    {
        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');

        $report = $this->reportService->getProfitLossReport($dateFrom, $dateTo);

        return response()->json([
            'success' => true,
            'data' => $report,
        ]);
    }

    public function salesTax(Request $request): JsonResponse
    {
        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');

        $report = $this->reportService->getSalesTaxReport($dateFrom, $dateTo);

        return response()->json([
            'success' => true,
            'data' => $report,
        ]);
    }

    public function topProducts(Request $request): JsonResponse
    {
        $limit = (int) $request->get('limit', 10);
        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');

        $products = $this->reportService->getTopProducts($limit, $dateFrom, $dateTo);

        return response()->json([
            'success' => true,
            'data' => $products,
        ]);
    }
}
