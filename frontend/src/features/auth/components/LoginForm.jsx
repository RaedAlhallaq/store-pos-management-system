import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../context/AuthContext';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: 'البريد الإلكتروني مطلوب' })
    .email({ message: 'صيغة البريد الإلكتروني غير صحيحة' }),
  password: z
    .string()
    .min(1, { message: 'كلمة المرور مطلوبة' }),
});

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
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

      <div className="relative">
        <Input
          label="كلمة المرور"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          dir="ltr"
          className="text-left pr-10"
          rightIcon={<Lock className="w-4 h-4 text-slate-400" />}
          error={errors.password?.message}
          {...register('password')}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute left-10 top-[38px] text-slate-400 hover:text-slate-200 transition-colors z-10"
          tabIndex={-1}
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

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
    </form>
  );
}
