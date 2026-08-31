<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\SettingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BackupController extends Controller
{
    public function __construct(
        protected SettingService $settingService
    ) {}

    public function export(Request $request): StreamedResponse
    {
        if ($request->user() && $request->user()->role !== 'admin') {
            abort(403, 'غير مصرح لك بتصدير النسخة الاحتياطية. هذه الصلاحية خاصة بالمدير فقط.');
        }

        $dumpSql = $this->settingService->exportDatabaseDump();
        $filename = 'store_pos_backup_' . date('Y-m-d_H-i-s') . '.sql';

        return response()->streamDownload(function () use ($dumpSql) {
            echo $dumpSql;
        }, $filename, [
            'Content-Type' => 'application/sql',
        ]);
    }

    public function restore(Request $request): JsonResponse
    {
        if ($request->user() && $request->user()->role !== 'admin') {
            abort(403, 'غير مصرح لك باستعادة النسخة الاحتياطية. هذه الصلاحية خاصة بالمدير فقط.');
        }

        $request->validate([
            'backup_file' => ['required', 'file', 'max:51200', 'mimes:sql,txt'],
        ], [
            'backup_file.required' => 'ملف النسخة الاحتياطية مطلوب.',
            'backup_file.mimes' => 'يجب أن يكون ملف النسخة الاحتياطية بصيغة SQL (.sql).',
        ]);

        $content = file_get_contents($request->file('backup_file')->getRealPath());
        $this->settingService->restoreDatabaseDump($content);

        return response()->json([
            'success' => true,
            'message' => 'تمت استعادة قاعدة البيانات بنجاح.',
        ]);
    }
}
