import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../context/AuthContext';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'البريد الإلكتروني مطلوب' })
    .email({ message: 'صيغة البريد الإلكتروني غير صحيحة' }),
  password: z
    .string()
    .min(6, { message: 'كلمة المرور يجب أن لا تقل عن 6 أحرف' }),
});

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'owner@storepos.local',
      password: 'password123',
    },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await login(data);
      navigate('/');
    } catch {
      // Error handled by AuthContext toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="البريد الإلكتروني"
        type="email"
        placeholder="owner@storepos.local"
        dir="ltr"
        className="text-left"
        rightIcon={<Mail className="w-4 h-4 text-slate-400" />}
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="كلمة المرور"
        type="password"
        placeholder="••••••••"
        dir="ltr"
        className="text-left"
        rightIcon={<Lock className="w-4 h-4 text-slate-400" />}
        error={errors.password?.message}
        {...register('password')}
      />

      <div className="pt-2">
        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isSubmitting}
          rightIcon={<LogIn className="w-4 h-4" />}
        >
          تسجيل الدخول للنظام
        </Button>
      </div>

      <div className="mt-4 p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-center text-xs text-slate-400 space-y-1">
        <p className="font-semibold text-brand-400">حساب المدير الافتراضي:</p>
        <p dir="ltr" className="font-mono text-slate-300">
          owner@storepos.local | password123
        </p>
      </div>
    </form>
  );
}
