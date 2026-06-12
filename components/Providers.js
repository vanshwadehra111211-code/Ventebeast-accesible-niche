'use client';
import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useStore } from '@/lib/store';

export default function Providers({ children }) {
  const initAuth = useStore(s => s.initAuth);
  useEffect(() => { initAuth(); }, []);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
  const Wrap = clientId ? GoogleOAuthProvider : ({ children }) => <>{children}</>;
  return (
    <Wrap clientId={clientId}>
      {children}
      <Toaster theme="dark" position="top-center" toastOptions={{ style: { background: '#0a0a0a', border: '1px solid #2a2a2a', color: '#fff' } }} />
    </Wrap>
  );
}
