'use client';
import { GoogleLogin } from '@react-oauth/google';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function GoogleSignIn({ onSuccess }) {
  const loginWithGoogle = useStore(s => s.loginWithGoogle);
  const router = useRouter();
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  if (!clientId) {
    return (
      <div className="text-[10px] tracking-[0.2em] uppercase text-white/40 text-center py-3 border border-dashed border-white/20">
        Google Sign-In — add NEXT_PUBLIC_GOOGLE_CLIENT_ID to enable
      </div>
    );
  }

  return (
    <div className="flex justify-center [&>div]:!w-full">
      <GoogleLogin
        onSuccess={async (cr) => {
          try {
            const u = await loginWithGoogle(cr.credential);
            toast.success(`Welcome, ${u.name}`);
            if (onSuccess) onSuccess(u); else router.push(u.role === 'admin' ? '/admin' : '/account');
          } catch (e) { toast.error(e.message); }
        }}
        onError={() => toast.error('Google sign-in failed')}
        theme="filled_black"
        size="large"
        shape="rectangular"
        text="continue_with"
        width="360"
      />
    </div>
  );
}
