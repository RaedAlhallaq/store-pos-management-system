<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CashMovementResource;
use App\Http\Resources\CashSessionResource;
use App\Models\CashSession;
use App\Services\CashSessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CashSessionController extends Controller
{
    public function __construct(
        protected CashSessionService $sessionService
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = (int) $request->get('per_page', 15);
        $filters = $request->only(['status', 'date_from', 'date_to']);

        $sessions = $this->sessionService->getPaginatedSessions($filters, $perPage);

        return CashSessionResource::collection($sessions);
    }

    public function active(Request $request): JsonResponse
    {
        $session = $this->sessionService->getActiveSession($request->user());

        return response()->json([
            'success' => true,
            'data' => $session ? new CashSessionResource($session) : null,
        ]);
    }

    public function open(Request $request): JsonResponse
    {
        $request->validate([
            'opening_cash' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:255'],
        ], [
            'opening_cash.required' => 'الرصيد الافتتاحي للصندوق مطلوب.',
        ]);

        $session = $this->sessionService->openSession(
            (float) $request->get('opening_cash'),
            $request->get('notes'),
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'تم فتح جلسة الصندوق بنجاح.',
            'data' => new CashSessionResource($session),
        ], 201);
    }

    public function recordMovement(Request $request, CashSession $session): JsonResponse
    {
        $this->authorizeSessionAccess($request, $session);

        $request->validate([
            'type' => ['required', 'in:in,out'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'reason' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ], [
            'amount.required' => 'مبلغ الحركة مطلوب.',
            'reason.required' => 'سبب الحركة مطلوب.',
        ]);

        $movement = $this->sessionService->recordMovement(
            $session,
            (float) $request->get('amount'),
            $request->get('type'),
            $request->get('reason'),
            $request->get('notes'),
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'تم تسجيل الحركة النقدية في الصندوق بنجاح.',
            'data' => new CashMovementResource($movement),
        ], 201);
    }

    public function close(Request $request, CashSession $session): JsonResponse
    {
        $this->authorizeSessionAccess($request, $session);

        $request->validate([
            'closing_cash_actual' => ['required', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ], [
            'closing_cash_actual.required' => 'المبلغ الفعلي في الصندوق مطلوب للإقفال.',
        ]);

        $closedSession = $this->sessionService->closeSession(
            $session,
            (float) $request->get('closing_cash_actual'),
            $request->get('notes'),
            $request->user()
        );

        return response()->json([
            'success' => true,
            'message' => 'تم إقفال جلسة الصندوق بنجاح.',
            'data' => new CashSessionResource($closedSession),
            'z_report' => $this->sessionService->getZReport($closedSession),
        ]);
    }

    public function zReport(Request $request, CashSession $session): JsonResponse
    {
        $this->authorizeSessionAccess($request, $session);

        $report = $this->sessionService->getZReport($session);

        return response()->json([
            'success' => true,
            'data' => $report,
        ]);
    }

    /**
     * Prevent IDOR access between cashiers.
     */
    protected function authorizeSessionAccess(Request $request, CashSession $session): void
    {
        $user = $request->user();
        if ($user && ! in_array($user->role, ['admin', 'manager']) && $session->user_id !== $user->id) {
            abort(403, 'غير مصرح لك بالوصول إلى جلسة صندوق خاصة بمستخدم آخر.');
        }
    }
}
