# قائمة التحقق من الجاهزية للإنتاج (Production Readiness Checklist)
# نظام الأصيل للمنظفات

| حالة التحقق | بند الفحص الفني والتشغيلي | التفاصيل والملاحظات |
|:---:|---|---|
| [x] | **MySQL Database Engine** | محرك MySQL متصل ومهيأ مع جداول المحاسبة والمخزون والعلاقات |
| [x] | **Environment Variables (.env)** | فصل إعدادات التطوير والإنتاج واستخدام قوالب `.env.example` الآمنة |
| [x] | **Production Security (APP_DEBUG=false)** | حظر إظهار تتبع الأخطاء البرمجية للمستخدمين في الإنتاج |
| [x] | **App Key Configuration** | توليد مفتاح تشفير عشوائي آمن (AES-256-CBC) عبر `php artisan key:generate` |
| [x] | **API URL Dynamic Configuration** | اعتماد `VITE_API_URL` عبر متغيرات البيئة بدلاً من العناوين الثابتة |
| [x] | **CORS & Sanctum Security** | حصر الوصول على النطاق المصرح به ودعم التوثيق عبر Bearer Token |
| [x] | **RBAC Authorization Enforcement** | فرض الصلاحيات في الـ Backend لمنع الكاشير من النسخ أو تعديل الإعدادات |
| [x] | **Database Integrity & Decimal Fields** | استخدام حقول `DECIMAL(12,2)` لمنع أخطاء التقريب المالي في المبيعات والصندوق |
| [x] | **Frontend Build (Vite + TypeScript)** | اجتياز بناء حزمة الإنتاج بنجاح دون أي خطأ (0 Build Errors) |
| [x] | **Backend Test Suite (PHPUnit)** | اجتياز 32 اختباراً آلياً شاملاً بنسبة 100% (305 Assertions) |
| [x] | **Backup & Restore Validation** | التحقق من صحة امتداد ملف الـ SQL وصلاحيات المدير فقط للنسخ والاستعادة |
| [x] | **Cash Drawer Reconciliation** | مطابقة معادلة رصيد الصندوق ومعالجة حالات التطابق والعجز والفائض بدقة |
| [x] | **Inventory Ledger Invariants** | مطابقة معادلة حركة المخزون الفيزيائي في الشراء والبيع والإلغاء |
| [x] | **Customer Debt Tracking** | تتبع المبيعات الآجلة وسندات القبض النقدية وتخفيض الذمم آلياً |
| [x] | **Supplier Payable Tracking** | تتبع فواتير التوريد الآجلة وسندات الصرف النقدية بدقة |
| [x] | **Profit & Loss (P&L) Reports** | مطابقة الإيرادات، وتكلفة البضاعة المباعة (COGS)، والمصروفات، وصافي الأرباح |
| [x] | **Thermal Invoice Printing** | قوالب طباعة حرارية أنيقة (80mm) باسم "الأصيل للمنظفات" والعملة "₪" |
| [x] | **Arabic UI & UX** | واجهة عربية أصيلة 100% خالية تماماً من المصطلحات التقنية الإنجليزية |
| [x] | **Currency Uniformity (₪)** | توحيد رمز العملة إلى الشيكل (₪) في كافة الشاشات والجداول والتقارير |
