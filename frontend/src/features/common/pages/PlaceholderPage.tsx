import React from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { type LucideIcon, ArrowRight, Construction, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PlaceholderPageProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  plannedFeatures: string[];
  nextPhase?: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({
  title,
  subtitle,
  icon: Icon,
  plannedFeatures,
  nextPhase = 'المرحلة القادمة: تطبيق جداول البيانات والواجهات',
}) => {
  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <Link to="/" className="hover:text-brand-400">الرئيسية</Link>
            <span>/</span>
            <span className="text-slate-200 font-semibold">{title}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
              <Icon className="w-5 h-5" />
            </div>
            <span>{title}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
        </div>

        <Link to="/">
          <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-4 h-4 rotate-180" />}>
            العودة للرئيسية
          </Button>
        </Link>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="flex flex-col items-center justify-center p-10 text-center space-y-4">
            <div className="p-4 rounded-3xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
              <Construction className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">تم تهيئة الهيكل الأساسي للشاشة</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                تم تجهيز المسار (Route) والمكونات الأساسية وجلسة المصادقة بنجاح. سيتم تفعيل منطق الأعمال
                وقواعد البيانات التفصيلية في المرحلة التالية.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 text-xs text-slate-300 font-medium border border-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>{nextPhase}</span>
            </div>
          </Card>
        </div>

        <div>
          <Card className="space-y-4">
            <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2">
              الميزات المخطط تنفيذها
            </h3>
            <ul className="space-y-2.5">
              {plannedFeatures.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};
