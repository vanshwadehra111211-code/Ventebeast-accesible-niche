'use client';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { toast } from 'sonner';
import GoogleSignIn from '@/components/GoogleSignIn';
import { InputOTP } from '@/components/ui/input-otp';

function LoginInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const login = useStore(s => s.login);
  const loginWithCode = useStore(s => s.loginWithCode);
  const user = useStore(s => s.user);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('password');
  const [codeSent, setCodeSent] = useState(false);

  useEffect(() => {
    if (user) router.push(sp.get('next') || '/account');
  }, [user]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(email, password);
      toast.success(`Welcome back, ${u.name}`);
      router.push(sp.get('next') || (u.role === 'admin' ? '/admin' : '/account'));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const sendCode = async () => {
    if (!email) return toast.error('Enter your email first');
    setLoading(true);
    try {
      await fetch('/api/auth/send-login-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }).then(async res => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Unable to send code');
      });
      toast.success('Verification code sent to your email');
      setCodeSent(true);
      setMode('code');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Enter your email first');
    if (code.length !== 6) return toast.error('Enter the 6-digit code');
    setLoading(true);
    try {
      const u = await loginWithCode(email, code);
      toast.success(`Welcome back, ${u.name}`);
      router.push(sp.get('next') || (u.role === 'admin' ? '/admin' : '/account'));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full rounded-[2rem] border border-white/10 bg-primary/95 p-8 shadow-2xl text-white">
        <div className="text-center mb-12">
          <div className="text-[10px] tracking-[0.4em] uppercase text-white/40 mb-4">Welcome Back</div>
          <h1 className="font-display text-5xl">Sign In</h1>
        </div>

        <GoogleSignIn />

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-[10px] tracking-[0.3em] uppercase text-white/40">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {mode === 'password' ? (
          <form onSubmit={submit} className="space-y-6">
            <div>
              <label className="text-[10px] tracking-[0.3em] uppercase text-white/50">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-transparent border-b border-white/20 py-3 outline-none focus:border-white" />
            </div>
            <div>
              <label className="text-[10px] tracking-[0.3em] uppercase text-white/50">Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-transparent border-b border-white/20 py-3 outline-none focus:border-white" />
            </div>
            <button disabled={loading} className="btn-luxury w-full bg-white text-black h-14 text-[11px] tracking-[0.3em] uppercase font-medium disabled:opacity-50">{loading ? 'Signing in...' : 'Sign In'}</button>
            <div className="flex items-center justify-between text-sm text-white/60">
              <button type="button" onClick={sendCode} disabled={loading} className="underline text-white/80 hover:text-white">Use verification code</button>
              <Link href="/register" className="underline text-white/80 hover:text-white">Create account</Link>
            </div>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="space-y-6">
            <div>
              <label className="text-[10px] tracking-[0.3em] uppercase text-white/50">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-transparent border-b border-white/20 py-3 outline-none focus:border-white" />
            </div>
            <div>
              <label className="text-[10px] tracking-[0.3em] uppercase text-white/50">Verification code</label>
              <InputOTP length={6} value={code} onChange={setCode} className="w-full bg-transparent" />
            </div>
            <button disabled={loading} className="btn-luxury w-full bg-white text-black h-14 text-[11px] tracking-[0.3em] uppercase font-medium disabled:opacity-50">{loading ? 'Verifying...' : 'Verify code'}</button>
            <div className="flex items-center justify-between text-sm text-white/60">
              <button type="button" onClick={() => { setMode('password'); setCode(''); }} className="underline text-white/80 hover:text-white">Back to password</button>
              <button type="button" onClick={sendCode} disabled={loading} className="underline text-white/80 hover:text-white">Resend code</button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}

export default function LoginPage() { return <Suspense fallback={null}><LoginInner /></Suspense>; }
