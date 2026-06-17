'use client';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { toast } from 'sonner';
import GoogleSignIn from '@/components/GoogleSignIn';

function RegisterInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const register = useStore(s => s.register);
  const user = useStore(s => s.user);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) router.push(sp.get('next') || '/account'); }, [user]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await register(email, password, name);
      toast.success(`Welcome, ${u.name}`);
      router.push(sp.get('next') || (u.role === 'admin' ? '/admin' : '/account'));
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full rounded-[2rem] border border-white/10 bg-primary/95 p-8 shadow-2xl text-white">
        <div className="text-center mb-12">
          <div className="text-[10px] tracking-[0.4em] uppercase text-white/40 mb-4">Join VENTEBEAST</div>
          <h1 className="font-display text-5xl">Create Account</h1>
        </div>

        <GoogleSignIn />

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-[10px] tracking-[0.3em] uppercase text-white/40">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={submit} className="space-y-6">
          <div>
            <label className="text-[10px] tracking-[0.3em] uppercase text-white/50">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-transparent border-b border-white/20 py-3 outline-none focus:border-white" />
          </div>
          <div>
            <label className="text-[10px] tracking-[0.3em] uppercase text-white/50">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-transparent border-b border-white/20 py-3 outline-none focus:border-white" />
          </div>
          <div>
            <label className="text-[10px] tracking-[0.3em] uppercase text-white/50">Password</label>
            <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-transparent border-b border-white/20 py-3 outline-none focus:border-white" />
          </div>
          <button disabled={loading} className="btn-luxury w-full bg-white text-black h-14 text-[11px] tracking-[0.3em] uppercase font-medium disabled:opacity-50">{loading ? 'Creating...' : 'Create Account'}</button>
        </form>
        <p className="text-center mt-8 text-sm text-white/60">Already a member? <Link href="/login" className="text-white border-b border-white/40">Sign in</Link></p>
      </div>
    </div>
  );
}

export default function RegisterPage() { return <Suspense fallback={null}><RegisterInner /></Suspense>; }
