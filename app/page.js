'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Award, Truck, Shield } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { api } from '@/lib/api';

const HERO_IMG = 'https://images.unsplash.com/photo-1643797517714-a273548abc3c?crop=entropy&cs=srgb&fm=jpg&q=85&w=2400';
const EDITORIAL_1 = 'https://images.unsplash.com/photo-1643797519086-cc9a821fbcfe?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600';
const EDITORIAL_2 = 'https://images.unsplash.com/photo-1544006593-1a0b9255782d?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600';
const EDITORIAL_3 = 'https://images.unsplash.com/photo-1610461888750-10bfc601b874?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600';

const HomePage = () => {
  const [featured, setFeatured] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);

  useEffect(() => {
    api('products?featured=true&limit=8').then(d => setFeatured(d.products));
    api('products?newArrival=true&limit=4').then(d => setNewArrivals(d.products));
    api('products?bestseller=true&limit=4').then(d => setBestsellers(d.products));
  }, []);

  return (
    <div className="-mt-[80px]">
      {/* HERO */}
      <section className="relative h-[100vh] min-h-[700px] overflow-hidden grain">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="VENTEBEAST" className="w-full h-full object-cover scale-105" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black" />
        </div>
        <div className="relative h-full flex flex-col justify-end pb-24 px-6 lg:px-12 max-w-[1600px] mx-auto">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: [0.22,1,0.36,1] }}>
            <div className="text-[10px] tracking-[0.4em] uppercase text-white/60 mb-6">Maison Olfactive — Est. 2025</div>
            <h1 className="font-display text-[15vw] md:text-[10vw] leading-[0.9] tracking-[0.05em] mb-8">
              SHADOWS<br/>
              <span className="silver-gradient">IN GLASS</span>
            </h1>
            <p className="max-w-md text-base text-white/70 mb-10 font-serif text-xl leading-relaxed">
              A new chapter in niche perfumery. Six compositions. Each one a study in light and shadow.
            </p>
            <div className="flex gap-4">
              <Link href="/collections" className="btn-luxury bg-white text-black px-10 py-4 text-[11px] tracking-[0.3em] uppercase font-medium hover:bg-white/90 inline-flex items-center gap-3">
                Discover The Collection <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/collections?newArrival=true" className="border border-white/40 px-10 py-4 text-[11px] tracking-[0.3em] uppercase hover:bg-white hover:text-black transition-colors">
                New Arrivals
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* USP STRIP */}
      <section className="border-y border-white/10">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { icon: Sparkles, t: 'Hand Composed', d: 'In small batches' },
            { icon: Award, t: 'Naturals First', d: 'Grasse · Mysore · Sambava' },
            { icon: Truck, t: 'Complimentary', d: 'Shipping above ₹5,000' },
            { icon: Shield, t: 'Authenticity', d: 'Sealed & verified' },
          ].map((u, i) => (
            <div key={i} className="flex items-center gap-4">
              <u.icon className="w-5 h-5 text-white/60" />
              <div>
                <div className="text-[11px] tracking-[0.25em] uppercase">{u.t}</div>
                <div className="text-[10px] text-white/40">{u.d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="py-24 lg:py-32">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="flex justify-between items-end mb-16">
            <div>
              <div className="text-[10px] tracking-[0.4em] uppercase text-white/40 mb-4">The Collection</div>
              <h2 className="font-serif text-5xl md:text-7xl">Composed in Shadow</h2>
            </div>
            <Link href="/collections" className="hidden md:inline-flex items-center gap-3 text-[11px] tracking-[0.25em] uppercase hover:text-white/60">View All <ArrowRight className="w-4 h-4" /></Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
            {featured.slice(0, 8).map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
          </div>
        </div>
      </section>

      {/* EDITORIAL SPLIT */}
      <section className="py-24">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.9 }} className="relative aspect-[4/5] overflow-hidden">
            <img src={EDITORIAL_2} alt="Editorial" className="w-full h-full object-cover" />
          </motion.div>
          <div>
            <div className="text-[10px] tracking-[0.4em] uppercase text-white/40 mb-4">The Philosophy</div>
            <h2 className="font-serif text-5xl md:text-6xl mb-8 leading-tight">A fragrance should be remembered, not announced.</h2>
            <p className="text-white/60 text-lg leading-relaxed font-serif mb-6">VENTEBEAST exists for those who prefer the quiet luxury of a scent that unfolds across hours, not seconds. Each composition begins with the rarest raw materials — Cambodian oud, Bulgarian rose absolute, Mysore sandalwood — then is aged in glass for three months before bottling.</p>
            <p className="text-white/60 text-lg leading-relaxed font-serif mb-10">We do not chase trends. We compose for the long sillage.</p>
            <Link href="/collections" className="text-[11px] tracking-[0.3em] uppercase border-b border-white/30 pb-1 hover:border-white">Explore The Atelier</Link>
          </div>
        </div>
      </section>

      {/* NEW ARRIVALS */}
      {newArrivals.length > 0 && (
        <section className="py-24 bg-neutral-950/50">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
            <div className="text-center mb-16">
              <div className="text-[10px] tracking-[0.4em] uppercase text-white/40 mb-4">Just Released</div>
              <h2 className="font-serif text-5xl md:text-7xl">New Arrivals</h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
              {newArrivals.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
            </div>
          </div>
        </section>
      )}

      {/* COLLECTIONS GRID */}
      <section className="py-24">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <div className="text-[10px] tracking-[0.4em] uppercase text-white/40 mb-4">Explore</div>
            <h2 className="font-serif text-5xl md:text-7xl">By Olfactive Family</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Signature', img: EDITORIAL_1, slug: 'Signature' },
              { name: 'Sacred', img: EDITORIAL_2, slug: 'Sacred' },
              { name: 'Leathers', img: EDITORIAL_3, slug: 'Leathers' },
            ].map((c, i) => (
              <Link key={c.slug} href={`/collections?collection=${c.slug}`} className="relative aspect-[3/4] overflow-hidden group">
                <img src={c.img} alt={c.name} className="w-full h-full object-cover transition-transform duration-[1.4s] group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                <div className="absolute bottom-8 left-8">
                  <div className="text-[10px] tracking-[0.4em] uppercase text-white/60">Collection</div>
                  <h3 className="font-serif text-4xl mt-2">{c.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* QUOTE */}
      <section className="py-32 border-t border-white/10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="text-[10px] tracking-[0.4em] uppercase text-white/40 mb-8">In The Press</div>
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
