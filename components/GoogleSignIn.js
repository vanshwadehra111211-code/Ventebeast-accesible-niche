 'use client';
import { useState } from 'react';
import { signInWithGooglePopup } from '@/lib/firebaseClient';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function GoogleSignIn({ onSuccess }) {
  const loginWithGoogle = useStore(s => s.loginWithGoogle);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const result = await signInWithGooglePopup();
      const idToken = await result.user.getIdToken();
      const u = await loginWithGoogle(idToken);
      toast.success(`Welcome, ${u.name}`);
      if (onSuccess) onSuccess(u); else router.push(u.role === 'admin' ? '/admin' : '/account');
    } catch (e) {
      console.error('Google sign-in error:', e);
      toast.error(e?.message || 'Google sign-in failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="flex justify-center">
      <button onClick={handleLogin} disabled={loading} className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded w-full">
        {loading ? 'Signing in…' : 'Continue with Google'}
      </button>
    </div>
  );
}
