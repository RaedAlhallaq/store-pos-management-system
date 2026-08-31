<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Unit\UnitRequest;
use App\Http\Resources\UnitResource;
use App\Models\Unit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class UnitController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return UnitResource::collection(Unit::all());
    }

    public function store(UnitRequest $request): JsonResponse
    {
        $unit = Unit::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'تمت إضافة وحدة القياس بنجاح.',
            'data' => new UnitResource($unit),
        ], 201);
    }

    public function show(Unit $unit): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => new UnitResource($unit),
        ]);
    }

    public function update(UnitRequest $request, Unit $unit): JsonResponse
    {
        $unit->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'تم تحديث وحدة القياس بنجاح.',
            'data' => new UnitResource($unit),
        ]);
    }

    public function destroy(Unit $unit): JsonResponse
    {
        if ($unit->products()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'لا يمكن حذف هذه الوحدة لوجود منتجات مرتبطة بها.',
            ], 422);
        }

        $unit->delete();

        return response()->json([
            'success' => true,
            'message' => 'تم حذف وحدة القياس بنجاح.',
        ]);
    }
}
