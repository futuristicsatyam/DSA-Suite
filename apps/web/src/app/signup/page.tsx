export const dynamic = 'force-dynamic';

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, BookOpen, ArrowRight, CheckCircle2, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { authApi } from '@/lib/auth';
import { setAccessToken, apiError } from '@/lib/utils';

type Step = 'details' | 'email-otp' | 'phone-otp' | 'done';

export default function SignupPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [step, setStep] = useState<Step>('details');
  const [isBusy, setIsBusy] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // OTP
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const startCooldown = () => {
    setCooldown(60);
    const t = setInterval(() => setCooldown(n => { if (n <= 1) { clearInterval(t); return 0; } return n - 1; }), 1000);
  };

  const validateDetails = () => {
    const e: Record<string, string> = {};
    if (!name || name.length < 2) e.name = 'Name must be at least 2 characters';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Valid email required';
    if (!phone || !/^\+?[0-9]{7,15}$/.test(phone)) e.phone = 'Valid phone with country code required';
    if (!password || password.length < 8) e.password = 'Min 8 characters';
    else if (!/[A-Z]/.test(password)) e.password = 'Must contain uppercase letter';
    else if (!/[0-9]/.test(password)) e.password = 'Must contain a number';
    if (password !== confirmPassword) e.confirmPassword = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateDetails()) return;
    setIsBusy(true);
    try {
      const { data } = await authApi.signup({ name, email, phone, password });
      setAccessToken(data.accessToken);
      setUser(data.user);
      await authApi.sendEmailOtp(email);
      toast.success('Account created! Check your email.');
      setStep('email-otp');
      startCooldown();
    } catch (err) { toast.error(apiError(err)); }
    finally { setIsBusy(false); }
  };

  const handleVerifyEmail = async () => {
    if (emailOtp.length < 6) return;
    setIsBusy(true);
    try {
      await authApi.verifyEmailOtp(email, emailOtp);
      await authApi.sendPhoneOtp(phone);
      toast.success('Email verified!');
      setStep('phone-otp');
      startCooldown();
    } catch (err) { toast.error(apiError(err)); }
    finally { setIsBusy(false); }
  };

  const handleVerifyPhone = async () => {
    if (phoneOtp.length < 6) return;
    setIsBusy(true);
    try {
      await authApi.verifyPhoneOtp(phone, phoneOtp);
      toast.success("You're all set! 🎉");
      setStep('done');
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err) { toast.error(apiError(err)); }
    finally { setIsBusy(false); }
  };

  const OtpInput = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div className="flex gap-2">
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ''}
          onChange={e => {
            const d = e.target.value.replace(/\D/g, '');
            const arr = value.split('');
            arr[i] = d;
            onChange(arr.join('').slice(0, 6));
            if (d && i < 5) {
              const next = e.target.closest('div')?.querySelectorAll('input')[i + 1] as HTMLInputElement;
              next?.focus();
            }
          }}
          onKeyDown={e => {
            if (e.key === 'Backspace' && !value[i] && i > 0) {
              const prev = (e.target as HTMLInputElement).closest('div')?.querySelectorAll('input')[i - 1] as HTMLInputElement;
              prev?.focus();
            }
          }}
          className={`w-10 h-12 text-center text-lg font-semibold rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${value[i] ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30' : 'border-input bg-background'}`}
        />
      ))}
    </div>
  );

  return (
    <main className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-indigo-950 via-indigo-900 to-blue-900 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <Link href="/" className="relative flex items-center gap-2 text-white">
          <BookOpen className="w-7 h-7 text-indigo-300" />
          <span className="text-xl font-bold">DSA Suite</span>
        </Link>
        <div className="relative space-y-4">
          <h2 className="text-3xl font-bold text-white">Start your learning journey</h2>
          <ul className="space-y-2 pt-2">
            {['Structured topic roadmaps', 'Rich markdown editorials', 'Progress & streak tracking', 'Bookmark & revisit anytime'].map(f => (
              <li key={f} className="flex items-center gap-2 text-indigo-200 text-sm">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" /> {f}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-indigo-400 text-xs">© {new Date().getFullYear()} DSA Suite</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-md space-y-6">

          {/* Step 1 — Details */}
          {step === 'details' && (
            <>
              <div>
                <h1 className="text-2xl font-bold">Create your account</h1>
                <p className="text-muted-foreground text-sm mt-1">Free forever. No credit card needed.</p>
              </div>
              <form onSubmit={handleSignup} className="space-y-4" noValidate>
                {[
                  { id: 'name', label: 'Full name', value: name, setter: setName, type: 'text', placeholder: 'Alex Kumar' },
                  { id: 'email', label: 'Email', value: email, setter: setEmail, type: 'email', placeholder: 'alex@example.com' },
                  { id: 'phone', label: 'Phone', value: phone, setter: setPhone, type: 'tel', placeholder: '+919876543210' },
                ].map(f => (
                  <div key={f.id} className="space-y-1.5">
                    <label htmlFor={f.id} className="text-sm font-medium">{f.label}</label>
                    <input id={f.id} type={f.type} value={f.value} onChange={e => f.setter(e.target.value)} placeholder={f.placeholder}
                      className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    {errors[f.id] && <p className="text-destructive text-xs">{errors[f.id]}</p>}
                  </div>
                ))}
                {[
                  { id: 'password', label: 'Password', value: password, setter: setPassword, show: showPwd, toggle: () => setShowPwd(p => !p) },
                  { id: 'confirmPassword', label: 'Confirm password', value: confirmPassword, setter: setConfirmPassword, show: showPwd, toggle: () => setShowPwd(p => !p) },
                ].map(f => (
                  <div key={f.id} className="space-y-1.5">
                    <label htmlFor={f.id} className="text-sm font-medium">{f.label}</label>
                    <div className="relative">
                      <input id={f.id} type={f.show ? 'text' : 'password'} value={f.value} onChange={e => f.setter(e.target.value)}
                        className="w-full h-10 rounded-lg border border-input bg-background px-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      <button type="button" onClick={f.toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {f.show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors[f.id] && <p className="text-destructive text-xs">{errors[f.id]}</p>}
                  </div>
                ))}
                <button type="submit" disabled={isBusy}
                  className="w-full h-10 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                  {isBusy ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : <>Create account <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
              </p>
            </>
          )}

          {/* Step 2 — Email OTP */}
          {step === 'email-otp' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Check your email</h2>
                  <p className="text-sm text-muted-foreground">6-digit code sent to <span className="font-medium text-foreground">{email}</span></p>
                </div>
              </div>
              <OtpInput value={emailOtp} onChange={setEmailOtp} />
              <button onClick={handleVerifyEmail} disabled={emailOtp.length < 6 || isBusy}
                className="w-full h-10 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {isBusy ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</> : <>Verify email <ArrowRight className="w-4 h-4" /></>}
              </button>
              <div className="flex items-center justify-between text-sm">
                <button onClick={async () => { await authApi.sendEmailOtp(email); startCooldown(); }} disabled={cooldown > 0}
                  className="text-indigo-600 hover:underline disabled:opacity-40">
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                </button>
                <button onClick={() => router.push('/dashboard')} className="text-muted-foreground hover:underline">Skip for now</button>
              </div>
            </div>
          )}

          {/* Step 3 — Phone OTP */}
          {step === 'phone-otp' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Verify your phone</h2>
                  <p className="text-sm text-muted-foreground">Code sent to <span className="font-medium text-foreground">{phone}</span></p>
                </div>
              </div>
              <OtpInput value={phoneOtp} onChange={setPhoneOtp} />
              <button onClick={handleVerifyPhone} disabled={phoneOtp.length < 6 || isBusy}
                className="w-full h-10 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {isBusy ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</> : <>Verify phone <ArrowRight className="w-4 h-4" /></>}
              </button>
              <div className="flex items-center justify-between text-sm">
                <button onClick={async () => { await authApi.sendPhoneOtp(phone); startCooldown(); }} disabled={cooldown > 0}
                  className="text-indigo-600 hover:underline disabled:opacity-40">
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                </button>
                <button onClick={() => router.push('/dashboard')} className="text-muted-foreground hover:underline">Skip for now</button>
              </div>
            </div>
          )}

          {/* Step 4 — Done */}
          {step === 'done' && (
            <div className="text-center space-y-4 py-8">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold">You&apos;re all set!</h2>
              <p className="text-muted-foreground">Redirecting to your dashboard…</p>
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-indigo-600" />
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
