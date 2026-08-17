'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Shield, ArrowLeft } from 'lucide-react';

const emailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetSchema = z.object({
  otp: z.string().min(4, 'OTP is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password is required'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type EmailFormValues = z.infer<typeof emailSchema>;
type ResetFormValues = z.infer<typeof resetSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
  });

  const resetForm = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
  });

  const onEmailSubmit = async (values: EmailFormValues) => {
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: values.email });
      setEmail(values.email);
      toast.success('OTP sent to your email');
      setStep(2);
    } catch {
      toast.error('Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const onResetSubmit = async (values: ResetFormValues) => {
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email,
        otp: values.otp,
        newPassword: values.newPassword,
      });
      toast.success('Password reset successfully');
      router.push('/login');
    } catch {
      toast.error('Failed to reset password. Check your OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f1a] relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 mb-4 shadow-lg shadow-violet-500/30">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            ConfidenceUp
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Admin Panel</p>
        </div>

        <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-2">
            {step === 1 ? 'Forgot Password' : 'Reset Password'}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {step === 1
              ? 'Enter your email to receive a reset OTP'
              : `Enter the OTP sent to ${email}`}
          </p>

          {step === 1 ? (
            <form
              onSubmit={emailForm.handleSubmit(onEmailSubmit)}
              className="space-y-5"
            >
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm text-muted-foreground">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@confidenceup.com"
                  className="bg-white/5 border-white/10 focus-visible:border-violet-500 focus-visible:ring-violet-500/20 h-10"
                  {...emailForm.register('email')}
                />
                {emailForm.formState.errors.email && (
                  <p className="text-xs text-destructive">
                    {emailForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white border-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  'Send OTP'
                )}
              </Button>
            </form>
          ) : (
            <form
              onSubmit={resetForm.handleSubmit(onResetSubmit)}
              className="space-y-5"
            >
              <div className="space-y-1.5">
                <Label htmlFor="otp" className="text-sm text-muted-foreground">
                  OTP Code
                </Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  className="bg-white/5 border-white/10 focus-visible:border-violet-500 h-10"
                  {...resetForm.register('otp')}
                />
                {resetForm.formState.errors.otp && (
                  <p className="text-xs text-destructive">
                    {resetForm.formState.errors.otp.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="newPassword"
                  className="text-sm text-muted-foreground"
                >
                  New Password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  className="bg-white/5 border-white/10 focus-visible:border-violet-500 h-10"
                  {...resetForm.register('newPassword')}
                />
                {resetForm.formState.errors.newPassword && (
                  <p className="text-xs text-destructive">
                    {resetForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="confirmPassword"
                  className="text-sm text-muted-foreground"
                >
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  className="bg-white/5 border-white/10 focus-visible:border-violet-500 h-10"
                  {...resetForm.register('confirmPassword')}
                />
                {resetForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-destructive">
                    {resetForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white border-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting…
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
