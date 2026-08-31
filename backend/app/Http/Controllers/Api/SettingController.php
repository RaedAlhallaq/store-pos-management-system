<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SettingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function __construct(
        protected SettingService $settingService
    ) {}

    public function index(): JsonResponse
    {
        $settings = $this->settingService->getAllSettings();

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        if ($request->user() && ! in_array($request->user()->role, ['admin', 'manager'])) {
            abort(403, 'غير مصرح لك بتعديل إعدادات النظام.');
        }

        $updated = $this->settingService->updateSettings($request->all());

        return response()->json([
            'success' => true,
            'message' => 'تم حفظ الإعدادات بنجاح.',
            'data' => $updated,
        ]);
    }
}
