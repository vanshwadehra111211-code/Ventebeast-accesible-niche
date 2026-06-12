'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Search, ShoppingBag, User, Heart, Menu, X } from 'lucide-react';
import { useStore, cartCount } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

// Inline logo SVG — navy whale crest with brand mark
const Logo = ({ className = 'h-9' }) => (
  <svg viewBox="0 0 240 60" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="navyG" x1="0" x2="1">
        <stop offset="0" stopColor="#1c3052"/>
        <stop offset="0.5" stopColor="#2e4a78"/>
        <stop offset="1" stopColor="#1c3052"/>
      </linearGradient>
    </defs>
    {/* Whale mark */}
    <g transform="translate(0,4)">
      <circle cx="26" cy="26" r="24" stroke="currentColor" strokeWidth="1.2" fill="none" />
      <path d="M14 30 Q18 22 26 22 Q34 22 40 26 Q42 28 40 30 Q34 34 26 32 Q20 31 18 34 Q16 35 14 30 Z" fill="currentColor" />
      <path d="M40 26 L46 22 L44 28 Z" fill="currentColor" />
      <circle cx="34" cy="26" r="1" fill="#fff" />
      <path d="M10 36 Q18 32 26 36 Q34 40 42 36" stroke="currentColor" strokeWidth="0.8" fill="none" opacity="0.5" />
    </g>
    {/* Wordmark */}
    <text x="60" y="30" fontFamily="Italiana, serif" fontSize="22" letterSpacing="4" fill="currentColor">VENTEBEAST</text>
    <text x="60" y="46" fontFamily="Inter, sans-serif" fontSize="7" letterSpacing="4" fill="currentColor" opacity="0.55">ACCESSIBILIS NICHE PERFUMERY</text>
  </svg>
);

export default function Header() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [q, setQ] = useState('');
  const cart = useStore(s => s.cart);
  const user = useStore(s => s.user);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
      {/* Top yellow strip */}
      <div className="bg-gold-400 text-black text-[10px] tracking-[0.3em] uppercase py-1.5 text-center font-bold">
        USE WELCOME10 FOR 10% OFF FIRST ORDER · FREE SHIPPING ABOVE ₹999
      </div>
      <header className={`sticky top-0 z-40 transition-all duration-500 ${scrolled ? 'bg-black/95 backdrop-blur-xl border-b border-white/10' : 'bg-black/30 backdrop-blur-sm'}`}>
        <div className="max-w-[1600px] mx-auto px-4 lg:px-12 h-20 flex items-center justify-between gap-6">
          <div className="flex items-center gap-6 flex-1">
            <button className="lg:hidden" onClick={() => setMenuOpen(true)}><Menu className="w-5 h-5" /></button>
            <Link href="/" className="text-navy-100 hover:text-white transition-colors">
              <Logo className="h-9 md:h-10" />
            </Link>
          </div>
          <nav className="hidden lg:flex items-center gap-8 text-[11px] tracking-[0.25em] uppercase font-medium">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} className="hover:text-gold-400 transition-colors">{l.label}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-5 flex-1 justify-end">
            <button onClick={() => setSearchOpen(true)} aria-label="Search"><Search className="w-5 h-5" /></button>
            <Link href={user ? '/account' : '/login'} aria-label="Account"><User className="w-5 h-5" /></Link>
            <Link href="/account?tab=wishlist" aria-label="Wishlist" className="hidden md:block"><Heart className="w-5 h-5" /></Link>
            <Link href="/cart" className="relative" aria-label="Cart">
              <ShoppingBag className="w-5 h-5" />
              {cartCount(cart) > 0 && <span className="absolute -top-1.5 -right-2 bg-gold-400 text-black text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{cartCount(cart)}</span>}
            </Link>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      </header>

      <AnimatePresence>
        {searchOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl">
            <div className="max-w-[1600px] mx-auto px-6 lg:px-12 pt-32">
              <button onClick={() => setSearchOpen(false)} className="absolute top-8 right-8"><X className="w-6 h-6" /></button>
              <form onSubmit={onSearch}>
                <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Search fragrances, notes, collections..." className="w-full bg-transparent border-b border-white/30 pb-4 text-3xl md:text-5xl font-display placeholder:text-white/30 outline-none" />
              </form>
              <div className="mt-8 text-[11px] tracking-[0.25em] uppercase text-white/50">Popular: Oud · Rose · Leather · Incense · Amber</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {menuOpen && (
          <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ duration: 0.4, ease: [0.4,0,0.2,1] }} className="fixed inset-0 z-50 bg-black">
            <div className="p-6 flex justify-between items-center">
              <Logo className="h-8 text-white" />
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
