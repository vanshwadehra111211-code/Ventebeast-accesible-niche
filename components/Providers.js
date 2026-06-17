'use client';
import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { useStore } from '@/lib/store';
import '@/lib/firebaseClient';

export default function Providers({ children }) {
  const initAuth = useStore(s => s.initAuth);
  useEffect(() => { initAuth(); }, []);
  return (
    <>
      {children}
      <Toaster theme="dark" position="top-center" toastOptions={{ style: { background: '#0a0a0a', border: '1px solid #2a2a2a', color: '#fff' } }} />
    </>
  );
}
