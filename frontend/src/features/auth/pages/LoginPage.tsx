import React from 'react';
import { LoginForm } from '../components/LoginForm';
import { Store, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden" dir="rtl">
      {/* Subtle background glow effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-xl shadow-brand-500/20 text-slate-950 mb-4 ring-4 ring-brand-500/20">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">
            الأصيل للمنظفات
          </h1>
          <p className="text-sm text-slate-400 mt-1">نظام إدارة المبيعات والمخزون والحسابات</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-7 shadow-2xl ring-1 ring-white/5">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-100">تسجيل الدخول</h2>
            <p className="text-xs text-slate-400 mt-0.5">أدخل بيانات الاعتماد للدخول إلى النظام</p>
          </div>

          <LoginForm />
        </div>

        {/* Footer */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-brand-400" />
          <span>نظام المحل الآمن</span>
        </div>
      </div>
    </div>
  );
};
