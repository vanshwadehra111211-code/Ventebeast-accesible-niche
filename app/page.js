'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Award, Truck, Shield, Clock, Gift } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { api } from '@/lib/api';

const HERO_IMG = 'https://images.unsplash.com/photo-1643797517714-a273548abc3c?crop=entropy&cs=srgb&fm=jpg&q=85&w=2400';
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
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    api('products?gender=Women&limit=6').then(d => setWomen(d.products));
    api('products?gender=Men&limit=6').then(d => setMen(d.products));
    api('products?featured=true&limit=8').then(d => setFeatured(d.products));
  }, []);

  return (
    <div className="-mt-[80px]">
      {/* HERO */}
      <section className="relative h-[100vh] min-h-[700px] overflow-hidden grain">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="VENTEBEAST" className="w-full h-full object-cover scale-105" />
          <div className="absolute inset-0 bg-gradient-to-b from-navy-950/80 via-black/40 to-black" />
        </div>
        <div className="relative h-full flex flex-col justify-end pb-24 px-6 lg:px-12 max-w-[1600px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: [0.22,1,0.36,1] }}>
            <div className="text-[10px] tracking-[0.4em] uppercase text-gold-400 mb-6">Maison Olfactive — Est. 2025</div>
            <h1 className="font-display text-[15vw] md:text-[10vw] leading-[0.9] tracking-[0.05em] mb-8">
              SHADOWS<br/>
              <span className="silver-gradient">IN GLASS</span>
            </h1>
            <p className="max-w-md text-base text-white/75 mb-10 font-serif text-xl leading-relaxed">
              A new chapter in niche perfumery. Six compositions. Each one a study in light and shadow.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link href="/collections" className="btn-luxury bg-white text-black px-10 py-4 text-[11px] tracking-[0.3em] uppercase font-bold hover:bg-gold-400 inline-flex items-center gap-3">
                Discover The Collection <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/collections?newArrival=true" className="border border-white/40 px-10 py-4 text-[11px] tracking-[0.3em] uppercase hover:bg-white hover:text-black transition-colors">
                New Arrivals
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* BUNDLE OFFERS — silver plaque */}
      <section className="bg-gradient-to-b from-black to-navy-950 py-20 border-y border-white/10">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <div className="text-[10px] tracking-[0.4em] uppercase text-gold-400 mb-3">The Offer</div>
          <h2 className="font-display text-5xl md:text-6xl mb-3 silver-gradient">VENTEBEAST</h2>
          <div className="text-[10px] tracking-[0.4em] uppercase text-white/50 mb-12">Accessibilis Niche Perfumery</div>
          <div className="grid md:grid-cols-3 gap-6">
            {BUNDLES.map((b, i) => (
              <motion.div
                key={b.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="relative p-8 bg-gradient-to-b from-white/10 via-white/5 to-transparent border border-white/15 rounded backdrop-blur"
              >
                {b.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold-500 text-black px-4 py-1 text-[9px] tracking-[0.3em] uppercase font-bold rounded">Most Popular</div>}
                {b.bestValue && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-jungle-500 text-black px-4 py-1 text-[9px] tracking-[0.3em] uppercase font-bold rounded">Best Value</div>}
                <div className="text-[11px] tracking-[0.4em] uppercase opacity-70 mb-3 pb-3 border-b border-white/10">{b.label}</div>
                <div className="font-display text-7xl">
                  <span className="text-3xl align-top">@ ₹</span>{b.price}
                </div>
                {b.save > 0 && <div className="mt-2 text-gold-400 text-sm font-bold">SAVE {b.save}%</div>}
              </motion.div>
            ))}
          </div>
          <div className="mt-10 grid grid-cols-3 gap-4 max-w-2xl mx-auto text-[10px] tracking-[0.3em] uppercase text-white/60">
            <div className="flex items-center gap-2 justify-center"><Clock className="w-4 h-4 text-gold-400" /> Long Lasting</div>
            <div className="flex items-center gap-2 justify-center"><Sparkles className="w-4 h-4 text-gold-400" /> Premium Quality</div>
            <div className="flex items-center gap-2 justify-center"><Gift className="w-4 h-4 text-gold-400" /> Made For You</div>
          </div>
          <Link href="/collections" className="mt-10 inline-block bg-gold-500 text-black px-12 py-4 text-[11px] tracking-[0.3em] uppercase font-bold hover:bg-gold-400 rounded">
            Shop The Offer →
          </Link>
        </div>
      </section>

      {/* USP STRIP */}
      <section className="border-y border-white/10 bg-jungle-800/30">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { icon: Sparkles, t: 'Hand Composed', d: 'Small batches' },
            { icon: Award, t: 'Naturals First', d: 'UK & France oils' },
            { icon: Truck, t: 'COD Available', d: 'No advance payment' },
            { icon: Shield, t: 'Authenticity', d: 'Sealed & verified' },
          ].map((u, i) => (
            <div key={i} className="flex items-center gap-4">
              <u.icon className="w-5 h-5 text-gold-400" />
              <div>
                <div className="text-[11px] tracking-[0.25em] uppercase">{u.t}</div>
                <div className="text-[10px] text-white/50">{u.d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* WOMEN SECTION */}
      <section className="py-24 bg-gradient-to-b from-black via-rose-950/20 to-black">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="flex justify-between items-end mb-12 flex-wrap gap-4">
            <div>
              <div className="text-[10px] tracking-[0.4em] uppercase text-rose-300 mb-3">For Her</div>
              <h2 className="font-display text-5xl md:text-7xl">Women</h2>
              <p className="text-white/60 mt-3 max-w-md">British & French couture botanical oils, blended in small batches.</p>
            </div>
            <Link href="/collections?gender=Women" className="inline-flex items-center gap-3 text-[11px] tracking-[0.25em] uppercase hover:text-rose-300 border-b border-white/30 pb-1">Shop Women <ArrowRight className="w-4 h-4" /></Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10">
            {women.slice(0, 3).map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
          </div>
        </div>
      </section>

      {/* EDITORIAL */}
      <section className="py-24 bg-navy-950">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.9 }} className="relative aspect-[4/5] overflow-hidden rounded">
            <img src={EDITORIAL_M} alt="Editorial" className="w-full h-full object-cover" />
          </motion.div>
          <div>
            <div className="text-[10px] tracking-[0.4em] uppercase text-gold-400 mb-4">The Philosophy</div>
            <h2 className="font-display text-5xl md:text-6xl mb-8 leading-tight">A fragrance should be remembered, not announced.</h2>
            <p className="text-white/70 text-lg leading-relaxed font-serif mb-6">VENTEBEAST is for those who prefer the quiet luxury of a scent that unfolds across hours, not seconds. Each composition begins with the rarest raw materials — Cambodian oud, Bulgarian rose absolute, Mysore sandalwood — then aged in glass for three months before bottling.</p>
            <p className="text-white/70 text-lg leading-relaxed font-serif mb-10">We do not chase trends. We compose for the long sillage.</p>
            <Link href="/collections" className="text-[11px] tracking-[0.3em] uppercase border-b border-gold-400 pb-1 text-gold-400 hover:border-white hover:text-white">Explore The Atelier</Link>
          </div>
        </div>
      </section>

      {/* MEN SECTION */}
      <section className="py-24 bg-gradient-to-b from-black via-navy-950 to-black">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="flex justify-between items-end mb-12 flex-wrap gap-4">
            <div>
              <div className="text-[10px] tracking-[0.4em] uppercase text-navy-300 mb-3">For Him</div>
              <h2 className="font-display text-5xl md:text-7xl">Men</h2>
              <p className="text-white/60 mt-3 max-w-md">Smoke, leather, and oud — compositions for the long night.</p>
            </div>
            <Link href="/collections?gender=Men" className="inline-flex items-center gap-3 text-[11px] tracking-[0.25em] uppercase hover:text-navy-300 border-b border-white/30 pb-1">Shop Men <ArrowRight className="w-4 h-4" /></Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10">
            {men.slice(0, 3).map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
          </div>
        </div>
      </section>

      {/* QUOTE */}
      <section className="py-32 border-t border-white/10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="text-[10px] tracking-[0.4em] uppercase text-gold-400 mb-8">In The Press</div>
          <blockquote className="font-serif text-3xl md:text-5xl leading-tight">
            &ldquo;A house that treats darkness as a raw material. Genuinely unlike anything else launching this year.&rdquo;
          </blockquote>
          <div className="mt-8 text-[11px] tracking-[0.3em] uppercase text-white/50">— Fragrance Quarterly</div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
