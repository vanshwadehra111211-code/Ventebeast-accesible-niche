'use client';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { toast } from 'sonner';

function LoginInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const login = useStore(s => s.login);
  const user = useStore(s => s.user);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full">
        <div className="text-center mb-12">
          <div className="text-[10px] tracking-[0.4em] uppercase text-white/40 mb-4">Welcome Back</div>
          <h1 className="font-serif text-5xl">Sign In</h1>
        </div>
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
        </form>
        <p className="text-center mt-8 text-sm text-white/60">New to VENTEBEAST? <Link href="/register" className="text-white border-b border-white/40">Create an account</Link></p>
      </div>
    </div>
  );
}

export default function LoginPage() { return <Suspense fallback={null}><LoginInner /></Suspense>; }
