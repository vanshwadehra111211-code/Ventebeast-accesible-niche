'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Search, ShoppingBag, User, Heart, Menu, X } from 'lucide-react';
import { useStore, cartCount } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const LOGO_URL = 'https://cdn.corenexis.com/f/c8lL883bHrO.png';

export default function Header() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [q, setQ] = useState('');
  const [settings, setSettings] = useState({ logoUrl: LOGO_URL, siteName: 'VENTEBEAST', promoBanner: '' });
  const cart = useStore(s => s.cart);
  const user = useStore(s => s.user);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => { api('settings').then(d => setSettings(d.settings)).catch(() => {}); }, []);

  const navLinks = [
    { href: '/collections?gender=Women', label: 'Women' },
    { href: '/collections?gender=Men', label: 'Men' },
    { href: '/collections', label: 'All' },
    { href: '/collections?newArrival=true', label: 'New' },
    { href: '/collections?bestseller=true', label: 'Bestsellers' },
  ];

  const onSearch = (e) => {
    e.preventDefault();
    if (q.trim()) { router.push(`/collections?q=${encodeURIComponent(q)}`); setSearchOpen(false); }
  };

  return (
    <>
      {/* Top jungle green strip */}
      <div className="bg-jungle-700 text-white text-[10px] tracking-[0.3em] uppercase py-2 text-center font-semibold">
        {settings.promoBanner || 'USE WELCOME10 FOR 10% OFF · FREE SHIPPING ABOVE ₹500 · CASH ON DELIVERY'}
      </div>
      <header className={`sticky top-0 z-40 transition-all duration-500 ${scrolled ? 'bg-navy-900 border-b border-navy-800' : 'bg-navy-900'}`}>
        <div className="max-w-[1600px] mx-auto px-4 lg:px-12 h-20 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 flex-1">
            <button className="lg:hidden text-white" onClick={() => setMenuOpen(true)}><Menu className="w-5 h-5" /></button>
            <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <img src={settings.logoUrl || LOGO_URL} alt="VENTEBEAST" className="h-12 md:h-14 w-auto" />
              <div className="hidden md:block leading-none text-white">
                <div className="font-display text-xl tracking-[0.25em]">{settings.siteName || 'VENTEBEAST'}</div>
                <div className="text-[8px] tracking-[0.3em] uppercase opacity-70 mt-1">Exclusive Parfum</div>
              </div>
            </Link>
          </div>
          <nav className="hidden lg:flex items-center gap-8 text-[11px] tracking-[0.25em] uppercase font-medium text-white">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} className="hover:text-jungle-400 transition-colors">{l.label}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-5 flex-1 justify-end text-white">
            <button onClick={() => setSearchOpen(true)} aria-label="Search"><Search className="w-5 h-5" /></button>
            <Link href={user ? '/account' : '/login'} aria-label="Account"><User className="w-5 h-5" /></Link>
            <Link href="/account?tab=wishlist" aria-label="Wishlist" className="hidden md:block"><Heart className="w-5 h-5" /></Link>
            <Link href="/cart" className="relative" aria-label="Cart">
              <ShoppingBag className="w-5 h-5" />
              {cartCount(cart) > 0 && <span className="absolute -top-1.5 -right-2 bg-jungle-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{cartCount(cart)}</span>}
            </Link>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {searchOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-navy-900/97 backdrop-blur-2xl text-white">
            <div className="max-w-[1600px] mx-auto px-6 lg:px-12 pt-32">
              <button onClick={() => setSearchOpen(false)} className="absolute top-8 right-8"><X className="w-6 h-6" /></button>
              <form onSubmit={onSearch}>
                <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search fragrances, notes, collections..." className="w-full bg-transparent border-b border-white/30 pb-4 text-3xl md:text-5xl font-display placeholder:text-white/40 outline-none" />
              </form>
              <div className="mt-8 text-[11px] tracking-[0.25em] uppercase text-white/60">Popular: Oud · Rose · Leather · Incense · Amber</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ duration: 0.4, ease: [0.4,0,0.2,1] }} className="fixed inset-0 z-50 bg-navy-900 text-white">
            <div className="p-6 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <img src={settings.logoUrl || LOGO_URL} alt="" className="h-10" />
                <span className="font-display text-lg tracking-[0.25em]">VENTEBEAST</span>
              </div>
              <button onClick={() => setMenuOpen(false)}><X className="w-6 h-6" /></button>
            </div>
            <nav className="px-6 mt-8 space-y-6">
              {navLinks.map(l => (
                <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)} className="block font-display text-3xl tracking-wider">{l.label}</Link>
              ))}
              <div className="pt-8 border-t border-white/10 space-y-4">
                <Link href={user ? '/account' : '/login'} onClick={() => setMenuOpen(false)} className="block text-sm tracking-[0.2em] uppercase">{user ? 'My Account' : 'Sign In'}</Link>
                <Link href="/cart" onClick={() => setMenuOpen(false)} className="block text-sm tracking-[0.2em] uppercase">Cart ({cartCount(cart)})</Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
