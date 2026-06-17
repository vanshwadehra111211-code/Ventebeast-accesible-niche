'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Award, Truck, Shield, Clock, Gift, Waves, Leaf, Lock } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { api } from '@/lib/api';

const HERO_IMG = 'https://images.unsplash.com/photo-1643797517714-a273548abc3c?crop=entropy&cs=srgb&fm=jpg&q=85&w=2400';
const HERO_VIDEO = process.env.NEXT_PUBLIC_HERO_VIDEO;
const EDITORIAL_W = 'https://images.unsplash.com/photo-1583442801251-5ce051ed7cb3?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600';
const EDITORIAL_M = 'https://images.unsplash.com/photo-1544006593-1a0b9255782d?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600';

const BUNDLES = [
  { label: '1 PERFUME', price: 899, save: 0, popular: false },
  { label: '3 PERFUMES', price: 1799, save: 73, popular: true },
  { label: '5 PERFUMES', price: 2499, save: 81, bestValue: true },
];

const HomePage = () => {
  const [women, setWomen] = useState([]);
  const [men, setMen] = useState([]);

  useEffect(() => {
    api('products?gender=Women&limit=6').then(d => setWomen(d.products));
    api('products?gender=Men&limit=6').then(d => setMen(d.products));
  }, []);

  return (
    <div>
      {/* HERO — navy gradient with logo */}
      <section className="relative h-[100vh] min-h-[640px] overflow-hidden grain navy-gradient">
        <div className="absolute inset-0">
          {HERO_VIDEO ? (
            <video src={HERO_VIDEO} poster={HERO_IMG} className="w-full h-full object-cover" autoPlay muted loop playsInline />
          ) : (
            <img src={HERO_IMG} alt="VENTEBEAST" className="w-full h-full object-cover opacity-50" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-navy-900/70 via-navy-900/40 to-navy-900" />
        </div>
        <div className="relative h-full flex flex-col justify-center px-6 lg:px-12 max-w-[1600px] mx-auto text-white">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: [0.22,1,0.36,1] }}>
            <div className="text-[10px] tracking-[0.4em] uppercase text-jungle-400 mb-6">Maison Olfactive · Est. 2025</div>
            <h1 className="font-display text-[14vw] md:text-[8vw] leading-[0.95] tracking-[0.05em] mb-6">
              OCEAN<br/>
              <span className="text-jungle-400">&amp; FOREST</span>
            </h1>
            <p className="max-w-md text-base text-white/80 mb-10 font-serif text-xl leading-relaxed">
              Niche perfumery composed in small batches. Six compositions drawn from the deep blue and pine green.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link href="/collections" className="btn-luxury bg-white text-navy-900 px-10 py-4 text-[11px] tracking-[0.3em] uppercase font-bold hover:bg-jungle-500 hover:text-white inline-flex items-center gap-3 rounded">
                Discover The Collection <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/collections?newArrival=true" className="border border-white/40 px-10 py-4 text-[11px] tracking-[0.3em] uppercase hover:bg-white hover:text-navy-900 transition-colors rounded">
                New Arrivals
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* BUNDLE OFFERS */}
      <section className="bg-white py-20 border-y border-navy-200">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <div className="text-[10px] tracking-[0.4em] uppercase text-jungle-700 mb-3 font-bold">The Offer</div>
          <h2 className="font-display text-5xl md:text-6xl mb-3 text-navy-900">VENTEBEAST</h2>
          <div className="text-[11px] tracking-[0.3em] uppercase text-jungle-700 mb-4">Choose any 3 premium perfumes for ₹1799</div>
          <div className="text-[10px] tracking-[0.4em] uppercase text-navy-600 mb-6">Accessibilis Niche Perfumery</div>
          <div className="grid md:grid-cols-3 gap-6">
            {BUNDLES.map((b, i) => (
              <motion.div
                key={b.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className={`relative p-8 border-2 rounded-lg ${b.popular ? 'border-jungle-600 bg-jungle-50' : b.bestValue ? 'border-navy-900 bg-navy-50' : 'border-navy-200 bg-white'}`}
              >
                {b.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-jungle-600 text-white px-4 py-1 text-[9px] tracking-[0.3em] uppercase font-bold rounded">Most Popular</div>}
                {b.bestValue && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-navy-900 text-white px-4 py-1 text-[9px] tracking-[0.3em] uppercase font-bold rounded">Best Value</div>}
                <div className="text-[11px] tracking-[0.4em] uppercase text-navy-700 mb-3 pb-3 border-b border-navy-200 font-bold">{b.label}</div>
                <div className="font-display text-7xl text-navy-900">
                  <span className="text-3xl align-top">₹</span>{b.price}
                </div>
                {b.save > 0 && <div className="mt-2 text-jungle-700 text-sm font-bold">SAVE {b.save}%</div>}
              </motion.div>
            ))}
          </div>
          <div className="mt-10 grid grid-cols-3 gap-4 max-w-2xl mx-auto text-[10px] tracking-[0.3em] uppercase text-navy-700 font-semibold">
            <div className="flex items-center gap-2 justify-center"><Clock className="w-4 h-4 text-jungle-600" /> Long Lasting</div>
            <div className="flex items-center gap-2 justify-center"><Sparkles className="w-4 h-4 text-jungle-600" /> Premium Quality</div>
            <div className="flex items-center gap-2 justify-center"><Gift className="w-4 h-4 text-jungle-600" /> Made For You</div>
          </div>
          <Link href="/collections" className="mt-10 inline-block bg-jungle-600 text-white px-12 py-4 text-[11px] tracking-[0.3em] uppercase font-bold hover:bg-jungle-700 rounded">
            Shop The Offer →
          </Link>
        </div>
      </section>

      {/* USP STRIP */}
      <section className="bg-navy-50 border-b border-navy-200">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { icon: Sparkles, t: 'Hand Composed', d: 'Small batches' },
            { icon: Leaf, t: 'Naturals First', d: 'UK & France oils' },
            { icon: Truck, t: 'Free Shipping', d: 'On orders above ₹500' },
            { icon: Lock, t: 'Razorpay Secure', d: 'Prepaid online payment' },
          ].map((u, i) => (
            <div key={i} className="flex items-center gap-4">
              <u.icon className="w-5 h-5 text-jungle-600" />
              <div>
                <div className="text-[11px] tracking-[0.25em] uppercase font-bold text-navy-900">{u.t}</div>
                <div className="text-[10px] text-navy-600">{u.d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* WOMEN */}
      <section className="py-24 bg-white">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="flex justify-between items-end mb-12 flex-wrap gap-4">
            <div>
              <div className="text-[10px] tracking-[0.4em] uppercase text-jungle-700 mb-3 font-bold">For Her</div>
              <h2 className="font-display text-5xl md:text-7xl text-navy-900">Women</h2>
              <p className="text-navy-700 mt-3 max-w-md">British & French couture botanical oils, blended in small batches.</p>
            </div>
            <Link href="/collections?gender=Women" className="inline-flex items-center gap-3 text-[11px] tracking-[0.25em] uppercase hover:text-jungle-700 border-b border-navy-300 pb-1 text-navy-900">Shop Women <ArrowRight className="w-4 h-4" /></Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10">
            {women.slice(0, 3).map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
          </div>
        </div>
      </section>

      {/* EDITORIAL */}
      <section className="py-24 navy-gradient text-white">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.9 }} className="relative aspect-[4/5] overflow-hidden rounded">
            <img src={EDITORIAL_M} alt="Editorial" className="w-full h-full object-cover" />
          </motion.div>
          <div>
            <div className="text-[10px] tracking-[0.4em] uppercase text-jungle-400 mb-4 font-bold">The Philosophy</div>
            <h2 className="font-display text-5xl md:text-6xl mb-8 leading-tight">A fragrance should be remembered, not announced.</h2>
            <p className="text-white/80 text-lg leading-relaxed font-serif mb-6">VENTEBEAST is for those who prefer the quiet luxury of a scent that unfolds across hours, not seconds. Each composition begins with the rarest raw materials — Cambodian oud, Bulgarian rose absolute, Mysore sandalwood — then aged in glass for three months before bottling.</p>
            <p className="text-white/80 text-lg leading-relaxed font-serif mb-10">We do not chase trends. We compose for the long sillage.</p>
            <Link href="/collections" className="text-[11px] tracking-[0.3em] uppercase border-b border-jungle-400 pb-1 text-jungle-400 hover:text-white hover:border-white">Explore The Atelier</Link>
          </div>
        </div>
      </section>

      {/* MEN */}
      <section className="py-24 bg-white">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="flex justify-between items-end mb-12 flex-wrap gap-4">
            <div>
              <div className="text-[10px] tracking-[0.4em] uppercase text-jungle-700 mb-3 font-bold">For Him</div>
              <h2 className="font-display text-5xl md:text-7xl text-navy-900">Men</h2>
              <p className="text-navy-700 mt-3 max-w-md">Smoke, leather, and oud — compositions for the long night.</p>
            </div>
            <Link href="/collections?gender=Men" className="inline-flex items-center gap-3 text-[11px] tracking-[0.25em] uppercase hover:text-jungle-700 border-b border-navy-300 pb-1 text-navy-900">Shop Men <ArrowRight className="w-4 h-4" /></Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10">
            {men.slice(0, 3).map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
          </div>
        </div>
      </section>

      {/* QUOTE */}
      <section className="py-32 bg-jungle-50 border-y border-jungle-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Waves className="w-10 h-10 mx-auto text-jungle-600 mb-6" />
          <blockquote className="font-serif text-3xl md:text-5xl leading-tight text-navy-900">
            &ldquo;A house that treats the deep blue and pine green as raw material. Genuinely unlike anything else launching this year.&rdquo;
          </blockquote>
          <div className="mt-8 text-[11px] tracking-[0.3em] uppercase text-navy-600">— Fragrance Quarterly</div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
