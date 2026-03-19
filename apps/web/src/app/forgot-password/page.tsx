'use client';

export const dynamic = 'force-dynamic';

import { Suspense, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, BookOpen, ArrowRight, ArrowLeft, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { authApi } from '@/lib/auth';
import { apiError } from '@/lib/utils';

type Step = 'request' | 'verify';

function ForgotPasswordContent() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('request');
  const [identifier, setIdentifier] = useState('');
  const [target, setTarget] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const startCooldown = () => {
    setCooldown(60);
    const t = setInterval(() => setCooldown(n => {
      if (n <= 1) { clearInterval(t); return 0; }
      return n - 1;
    }), 1000);
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    pasted.split('').forEach((d, i) => { newOtp[i] = d; });
    setOtp(newOtp);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const otpValue = otp.join('');

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim()) { setError('Enter your email or phone'); return; }
    setIsBusy(true);
    try {
      await authApi.forgotPassword(identifier.trim());
      setTarget(identifier.trim());
      setStep('verify');
      startCooldown();
      toast.success('Reset code sent!');
    } catch (err) {
      setError(apiError(err));
    } finally {
      setIsBusy(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otpValue.length < 6) { setError('Enter the 6-digit code'); return; }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (!/[A-Z]/.test(newPassword)) { setError('Must contain an uppercase letter'); return; }
    if (!/[0-9]/.test(newPassword)) { setError('Must contain a number'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    setIsBusy(true);
    try {
      await authApi.resetPassword(target, otpValue, newPassword);
      toast.success('Password reset successfully!');
      router.push('/login');
    } catch (err) {
      setError(apiError(err));
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-sm space-y-8">

        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-indigo-600" />
          <span className="font-bold text-indigo-600">DSA Suite</span>
        </div>

        {step === 'request' && (
          <>
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                <KeyRound className="w-6 h-6 text-indigo-600" />
              </div>
              <h1 className="text-2xl font-bold">Forgot password?</h1>
              <p className="text-muted-foreground text-sm">
                Enter your email or phone and we&apos;ll send you a reset code.
              </p>
            </div>

            <form onSubmit={handleRequest} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <label htmlFor="identifier" className="text-sm font-medium">Email or Phone</label>
                <input
                  id="identifier"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="you@example.com or +919876543210"
                  autoFocus
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {error && <p className="text-destructive text-xs">{error}</p>}
              </div>
              <button type="submit" disabled={isBusy}
                className="w-full h-10 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                {isBusy ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : <>Send reset code <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>
          </>
        )}

        {step === 'verify' && (
          <>
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                <KeyRound className="w-6 h-6 text-indigo-600" />
              </div>
              <h1 className="text-2xl font-bold">Reset password</h1>
              <p className="text-muted-foreground text-sm">
                Enter the 6-digit code sent to{' '}
                <span className="font-medium text-foreground">{target}</span> and your new password.
              </p>
            </div>

            <form onSubmit={handleReset} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Reset code</label>
                <div className="flex gap-2" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className={`w-10 h-12 text-center text-lg font-semibold rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        digit ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30' : 'border-input bg-background'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="newPassword" className="text-sm font-medium">New password</label>
                <input id="newPassword" type="password" value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm password</label>
                <input id="confirmPassword" type="password" value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              {error && <p className="text-destructive text-xs">{error}</p>}

              <button type="submit" disabled={isBusy || otpValue.length < 6}
                className="w-full h-10 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                {isBusy ? <><Loader2 className="w-4 h-4 animate-spin" /> Resetting…</> : <>Reset password <ArrowRight className="w-4 h-4" /></>}
              </button>
            </form>

            <div className="flex items-center justify-between text-sm">
              <button onClick={async () => { await authApi.forgotPassword(identifier); startCooldown(); toast.success('Code resent!'); }}
                disabled={cooldown > 0}
                className="text-indigo-600 hover:underline disabled:opacity-40 disabled:no-underline text-xs">
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </button>
              <button onClick={() => { setStep('request'); setOtp(['','','','','','']); setError(''); }}
                className="text-xs text-muted-foreground hover:underline flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Change email/phone
              </button>
            </div>
          </>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Remember your password?{' '}
          <Link href="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </main>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
