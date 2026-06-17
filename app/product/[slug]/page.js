'use client';
import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, ShoppingBag, Truck, Shield, RotateCcw, Star, ChevronDown, Lock, Clock, Sparkles, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import ProductCard from '@/components/ProductCard';
import { api, formatINR } from '@/lib/api';
import { useStore } from '@/lib/store';

const BUNDLES = [
  { id: 'pack-1', label: 'Pack of 1', qty: 1, price: 899, comparePrice: 2599, savePercent: 65, popular: true },
  { id: 'pack-3', label: 'Pack of 3', qty: 3, price: 1799, comparePrice: 7797, savePercent: 77 },
  { id: 'pack-5', label: 'Pack of 5', qty: 5, price: 2499, comparePrice: 12995, savePercent: 81, bestValue: true },
];

const ProductPage = () => {
  const { slug } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [bundleId, setBundleId] = useState('pack-3');
  const [reviews, setReviews] = useState([]);
  const [openSection, setOpenSection] = useState('desc');
  const [newReview, setNewReview] = useState({ rating: 5, title: '', body: '' });
  const [showSticky, setShowSticky] = useState(false);
  const [seconds, setSeconds] = useState(12 * 60);

  const addToCart = useStore(s => s.addToCart);
  const wishlist = useStore(s => s.wishlist);
  const user = useStore(s => s.user);
  const toggleWishlist = useStore(s => s.toggleWishlist);

  useEffect(() => { api(`products/${slug}`).then(setData); }, [slug]);
  useEffect(() => { if (data?.product?._id) api(`reviews/${data.product._id}`).then(d => setReviews(d.reviews)); }, [data?.product?._id]);
  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > 600);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    const t = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const bundle = useMemo(() => BUNDLES.find(b => b.id === bundleId), [bundleId]);

  if (!data) return <div className="min-h-screen flex items-center justify-center text-white/40">Composing...</div>;
  const p = data.product;
  const v = p.variants[0];
  const isWish = wishlist?.includes(p._id);
  const isWomen = p.gender === 'Women';

  // Theme tokens by gender
  const T = isWomen ? {
    pageBg: 'bg-gradient-to-b from-rose-100 via-blush-100 to-rose-50 text-neutral-900',
    band: 'bg-yellow-400 text-neutral-900',
    promo: 'bg-rose-300/60 text-rose-900 border-rose-400/40',
    surface: 'bg-white/70 backdrop-blur',
    cardBorder: 'border-rose-300/50',
    chip: 'bg-white/80 text-rose-900 border-rose-300/50',
    chipActive: 'bg-rose-600 text-white border-rose-600',
    accent: 'text-rose-700',
    cta: 'bg-rose-600 hover:bg-rose-700 text-white',
    secondaryBtn: 'border border-rose-400 text-rose-700 hover:bg-rose-100',
    marquee: 'bg-rose-300/70 text-rose-900',
    overlay: 'from-rose-100/60 via-transparent to-rose-200/40',
  } : {
    pageBg: 'bg-gradient-to-b from-navy-950 via-black to-navy-900 text-white',
    band: 'bg-gold-500 text-black',
    promo: 'bg-navy-800/80 text-white border-navy-700',
    surface: 'bg-black/40 backdrop-blur border border-white/10',
    cardBorder: 'border-white/10',
    chip: 'bg-white/5 text-white border-white/20',
    chipActive: 'bg-white text-black border-white',
    accent: 'text-gold-400',
    cta: 'bg-white text-black hover:bg-white/90',
    secondaryBtn: 'border border-white/30 text-white hover:bg-white hover:text-black',
    marquee: 'bg-jungle-700 text-white',
    overlay: 'from-black via-transparent to-black/40',
  };

  const handleAdd = (qty = bundle.qty) => {
    addToCart({ productId: p._id, slug: p.slug, name: p.name, image: p.images?.[0], sku: v.sku, size: v.size, price: bundle.price / bundle.qty, qty, bundleLabel: bundle.label });
    toast.success(`${p.name} · ${bundle.label} added`);
  };
  const buyNow = () => { handleAdd(); router.push('/checkout'); };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    try {
      await api('reviews', { method: 'POST', body: { productId: p._id, ...newReview } });
      toast.success('Review posted');
      setNewReview({ rating: 5, title: '', body: '' });
      const r = await api(`reviews/${p._id}`); setReviews(r.reviews);
      const updated = await api(`products/${slug}`); setData(updated);
    } catch (e) { toast.error(e.message); }
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <div className={`${T.pageBg} -mt-[80px] pt-[80px]`}>
      {/* Top coupon ribbon */}
      <div className={`${T.band} text-center py-2 text-[11px] tracking-[0.3em] uppercase font-semibold`}>
        Use WELCOME10 for 10% off your first order
      </div>
      {/* Promo banner */}
      <div className={`${T.promo} border-y text-center py-2.5 text-[11px] tracking-[0.25em] uppercase`}>
        ✨ Upto 50% Off on Perfume &nbsp;|&nbsp; Free Shipping on Prepaid Orders ✨
      </div>

      <div className="max-w-[1600px] mx-auto px-4 lg:px-12 pt-6 text-[10px] tracking-[0.25em] uppercase opacity-60">
        <Link href="/">Home</Link> <span className="mx-2">/</span>
        <Link href={`/collections?gender=${p.gender}`}>{p.gender}</Link> <span className="mx-2">/</span>
        <span className="opacity-100">{p.name}</span>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 lg:px-12 pt-6 pb-12 grid lg:grid-cols-2 gap-8 lg:gap-16">
        {/* GALLERY w/ overlay typography */}
        <div className="sticky top-24 self-start">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className="relative aspect-[4/5] overflow-hidden rounded-md">
            <img src={p.images?.[0]} alt={p.name} className="w-full h-full object-cover" />
            <div className={`absolute inset-0 bg-gradient-to-t ${T.overlay}`} />
            {/* SAVE badge */}
            <div className={`absolute top-4 left-4 ${isWomen ? 'bg-yellow-400 text-neutral-900' : 'bg-gold-500 text-black'} px-3 py-1.5 text-[10px] tracking-[0.25em] uppercase font-bold rounded-sm`}>
              Save {bundle.savePercent}%
            </div>
            {/* Massive overlay word */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <h2 className={`font-display text-[16vw] lg:text-[10vw] leading-none ${isWomen ? 'text-white/85 drop-shadow-lg' : 'text-white/15'}`}>
                {isWomen ? 'WOMAN' : 'MAN'}
              </h2>
            </div>
            <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 font-serif italic text-2xl ${isWomen ? 'text-white drop-shadow' : 'text-white/80'}`}>
              Vente Beast
            </div>
          </motion.div>
          {p.gallery?.length > 1 && (
            <div className="grid grid-cols-4 gap-2 mt-3">
              {p.gallery.map((g, i) => (
                <div key={i} className={`aspect-square overflow-hidden border ${T.cardBorder} cursor-pointer`}>
                  <img src={g} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DETAILS */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="py-2">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex">{[1,2,3,4,5].map(i => <Star key={i} className={`w-4 h-4 ${i <= Math.round(p.rating || 0) ? (isWomen ? 'fill-rose-500 text-rose-500' : 'fill-gold-500 text-gold-500') : 'opacity-30'}`} />)}</div>
            <span className="text-xs opacity-70 tracking-wider">{p.rating} · {p.reviewCount} CUSTOMERS VOUCH</span>
          </div>
          <h1 className="font-display text-5xl md:text-6xl tracking-[0.05em] leading-tight">{p.name.toUpperCase()}</h1>
          <div className={`mt-3 text-[11px] tracking-[0.25em] uppercase ${T.accent}`}>{p.scentFamily} · Couture Botanical Oils</div>

          <div className="mt-6 flex items-baseline gap-4">
            <div className="font-display text-5xl">Rs. {bundle.price}</div>
            <div className="opacity-50 line-through text-lg">Rs. {bundle.comparePrice}</div>
            <div className={`${isWomen ? 'bg-emerald-200 text-emerald-900' : 'bg-emerald-700/30 text-emerald-300'} px-3 py-1 rounded text-xs tracking-wider font-bold`}>{bundle.savePercent}% OFF</div>
          </div>

          {/* Chips */}
          <div className="mt-6 flex flex-wrap gap-2">
            {['12hr Long Sillage','All-Occasion Wear', isWomen ? 'Feminine Signature Note' : 'Masculine Power Note','UK & France Oils'].map(c => (
              <div key={c} className={`${T.chip} border rounded-full px-3 py-1.5 text-[10px] tracking-[0.2em] uppercase inline-flex items-center gap-1.5`}>
                <Sparkles className="w-3 h-3" /> {c}
              </div>
            ))}
          </div>

          {/* Cart lock countdown */}
          <div className={`mt-6 ${T.surface} border ${T.cardBorder} rounded p-4 flex justify-between items-center`}>
            <div className="flex items-center gap-2">
              <Lock className={`w-4 h-4 ${T.accent}`} />
              <div>
                <div className="text-[10px] tracking-[0.3em] uppercase font-bold">Active Deal Reserved For Your Session</div>
                <div className="text-xs opacity-70">Cart locking is active. Finish within countdown to secure price.</div>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 font-mono text-lg font-bold ${T.accent}`}>
              <Clock className="w-4 h-4" />{mm}:{ss}
            </div>
          </div>

          {/* Pack selector */}
          <div className="mt-6">
            <div className="text-[11px] tracking-[0.25em] uppercase opacity-70 mb-3">Select Pack:</div>
            <div className="grid grid-cols-3 gap-3">
              {BUNDLES.map(b => {
                const active = bundleId === b.id;
                return (
                  <button key={b.id} onClick={() => setBundleId(b.id)} className={`relative p-4 rounded text-left border-2 transition-all ${active ? (isWomen ? 'border-yellow-400 bg-white shadow-lg' : 'border-gold-500 bg-white/5') : `${T.cardBorder} ${isWomen ? 'bg-white/40' : 'bg-white/[0.02]'}`}`}>
                    {b.popular && <div className={`absolute -top-2.5 left-2 text-[8px] tracking-[0.3em] uppercase ${isWomen ? 'bg-yellow-400 text-neutral-900' : 'bg-gold-500 text-black'} px-2 py-0.5 rounded font-bold`}>Popular</div>}
                    {b.bestValue && <div className={`absolute -top-2.5 left-2 text-[8px] tracking-[0.3em] uppercase bg-emerald-500 text-white px-2 py-0.5 rounded font-bold`}>Best Value</div>}
                    <div className="text-[10px] tracking-[0.25em] uppercase font-bold">{b.label}</div>
                    <div className="flex gap-0.5 my-2">{Array.from({ length: b.qty }).map((_, i) => <div key={i} className={`w-3 h-5 ${isWomen ? 'bg-rose-400' : 'bg-navy-500'} rounded-sm`} />)}</div>
                    <div className="font-display text-xl">₹{b.price}</div>
                    <div className="text-xs opacity-50 line-through">₹{b.comparePrice}</div>
                    <div className={`text-[10px] font-bold ${isWomen ? 'text-yellow-600' : 'text-gold-400'}`}>{b.savePercent}% OFF</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button onClick={() => handleAdd()} className={`btn-luxury ${T.cta} h-14 text-[11px] tracking-[0.3em] uppercase font-bold rounded inline-flex items-center justify-center gap-3`}>
              <ShoppingBag className="w-4 h-4" /> Add To Cart
            </button>
            <button onClick={buyNow} className={`btn-luxury ${T.secondaryBtn} h-14 text-[11px] tracking-[0.3em] uppercase font-bold rounded inline-flex items-center justify-center gap-3`}>
              Buy Now
            </button>
          </div>
          <button onClick={() => toggleWishlist(p._id)} className="mt-3 w-full text-[10px] tracking-[0.3em] uppercase inline-flex items-center justify-center gap-2 opacity-70 hover:opacity-100">
            <Heart className={`w-4 h-4 ${isWish ? 'fill-current' : ''}`} /> {isWish ? 'Saved to wishlist' : 'Add to wishlist'}
          </button>

          {/* USPs */}
          <div className="mt-6 grid grid-cols-3 gap-3 text-[10px] tracking-[0.2em] uppercase opacity-70">
            <div className="flex items-center gap-2"><Truck className="w-4 h-4" /> Free above ₹999</div>
            <div className="flex items-center gap-2"><Shield className="w-4 h-4" /> 100% Authentic</div>
            <div className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> Pay now with Razorpay</div>
          </div>

          {/* Frequently bought together */}
          {data.related?.length > 0 && (
            <div className={`mt-8 ${T.surface} border ${T.cardBorder} rounded p-5`}>
              <div className="text-[11px] tracking-[0.3em] uppercase font-bold mb-4">Frequently Bought Together</div>
              <div className="space-y-3">
                <div className="flex gap-3 items-center">
                  <Check className={`w-5 h-5 ${isWomen ? 'text-yellow-500' : 'text-gold-500'}`} />
                  <div className="flex-1"><div className="text-sm font-bold">{p.name} (Pack of 1)</div><div className="text-xs opacity-60">₹899</div></div>
                </div>
                <div className="flex gap-3 items-center">
                  <Check className={`w-5 h-5 ${isWomen ? 'text-yellow-500' : 'text-gold-500'}`} />
                  <div className="flex-1">
                    <div className="text-sm font-bold">{data.related[0]?.name} — 50ml</div>
                    <div className="text-xs opacity-60">₹899 <span className="line-through opacity-50 ml-1">₹2599</span></div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-between items-center pt-4 border-t border-current/10">
                <div>
                  <div className="text-[10px] tracking-[0.25em] uppercase opacity-60">Bundle Price</div>
                  <div className="font-display text-2xl">₹1,798</div>
                </div>
                <button onClick={() => { handleAdd(1); if (data.related[0]) addToCart({ productId: data.related[0]._id, slug: data.related[0].slug, name: data.related[0].name, image: data.related[0].images?.[0], sku: data.related[0].variants[0].sku, size: '50ml', price: 899, qty: 1 }); toast.success('Bundle added'); }} className={`${T.cta} px-5 py-3 text-[10px] tracking-[0.3em] uppercase font-bold rounded`}>Add Bundle to Cart</button>
              </div>
            </div>
          )}

          {/* Accordions */}
          <div className={`mt-8 border-t ${T.cardBorder}`}>
            {[
              { id: 'desc', title: 'Description', content: <p className="leading-relaxed opacity-80">{p.description}</p> },
              { id: 'notes', title: 'Perfume Notes', content: (
                <div className="space-y-3 opacity-80">
                  <div><span className="text-[10px] tracking-[0.3em] uppercase opacity-60">Top:</span> {p.topNotes?.join(' · ')}</div>
                  <div><span className="text-[10px] tracking-[0.3em] uppercase opacity-60">Heart:</span> {p.heartNotes?.join(' · ')}</div>
                  <div><span className="text-[10px] tracking-[0.3em] uppercase opacity-60">Base:</span> {p.baseNotes?.join(' · ')}</div>
                </div>
              )},
              { id: 'info', title: 'Other Information', content: (
                <div className="grid grid-cols-2 gap-2 opacity-80 text-sm">
                  <div><span className="opacity-60">Family:</span> {p.scentFamily}</div>
                  <div><span className="opacity-60">Longevity:</span> {p.longevity}</div>
                  <div><span className="opacity-60">Projection:</span> {p.projection}</div>
                  <div><span className="opacity-60">Volume:</span> 50ml</div>
                </div>
              )},
              { id: 'ing', title: 'All Ingredients', content: <p className="opacity-80 text-sm">Alcohol denat., Parfum (fragrance), Aqua, Linalool, Limonene, Geraniol, Coumarin, Eugenol, Citronellol, Benzyl Salicylate, and other naturally-occurring components from the oils used.</p> },
            ].map(s => (
              <div key={s.id} className={`border-b ${T.cardBorder}`}>
                <button onClick={() => setOpenSection(openSection === s.id ? '' : s.id)} className="w-full py-4 flex justify-between items-center text-[11px] tracking-[0.3em] uppercase font-bold">
                  {s.title} <ChevronDown className={`w-4 h-4 transition-transform ${openSection === s.id ? 'rotate-180' : ''}`} />
                </button>
                {openSection === s.id && <div className="pb-5">{s.content}</div>}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Lifestyle band */}
      <section className={isWomen ? 'bg-gradient-to-b from-rose-200 to-rose-50 text-rose-900 py-24' : 'bg-gradient-to-b from-navy-900 to-black text-white py-24'}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-display text-4xl md:text-5xl">Command the Attention of Any Room</h2>
          <p className="mt-6 italic opacity-80 font-serif text-lg">Bespoke high-grade organic extracts and sillage trace controllers ensure your elegant scent aura lingers beautifully through the day and deep into the night.</p>
          <Link href="/collections" className={`inline-block mt-8 ${T.cta} px-10 py-4 text-[11px] tracking-[0.3em] uppercase font-bold rounded`}>Shop Now</Link>
        </div>
      </section>

      {/* Reviews */}
      <div className="max-w-[1600px] mx-auto px-4 lg:px-12 py-24">
        <div className="text-center mb-12">
          <div className={`text-[10px] tracking-[0.4em] uppercase opacity-60 mb-3`}>Voices</div>
          <h2 className="font-display text-5xl">Customer Reviews</h2>
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {reviews.length === 0 ? <div className="opacity-40 text-center py-16">Be the first to share your impression.</div> :
              reviews.map(r => (
                <div key={r._id} className={`border ${T.cardBorder} ${T.surface} p-5 rounded`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex">{[1,2,3,4,5].map(i => <Star key={i} className={`w-3 h-3 ${i <= r.rating ? (isWomen ? 'fill-rose-500 text-rose-500' : 'fill-gold-500 text-gold-500') : 'opacity-20'}`} />)}</div>
                      <h4 className="font-display text-xl mt-2">{r.title}</h4>
                    </div>
                    <div className="text-[10px] tracking-[0.2em] uppercase opacity-50">{new Date(r.createdAt).toLocaleDateString()}</div>
                  </div>
                  <p className="opacity-80 mt-3">{r.body}</p>
                  <div className="text-[10px] tracking-[0.2em] uppercase opacity-50 mt-3">— {r.userName} {r.verified && '· Verified'}</div>
                </div>
              ))
            }
          </div>
          <form onSubmit={submitReview} className={`border ${T.cardBorder} ${T.surface} p-5 rounded h-fit`}>
            <h3 className="font-display text-2xl mb-4">Write a Review</h3>
            {!user && <p className="text-xs opacity-60 mb-3">Sign in to share your impression.</p>}
            <div className="flex gap-1 mb-3">{[1,2,3,4,5].map(i => <button type="button" key={i} onClick={() => setNewReview(r => ({ ...r, rating: i }))}><Star className={`w-5 h-5 ${i <= newReview.rating ? (isWomen ? 'fill-rose-500 text-rose-500' : 'fill-gold-500 text-gold-500') : 'opacity-30'}`} /></button>)}</div>
            <input value={newReview.title} onChange={e => setNewReview(r => ({ ...r, title: e.target.value }))} placeholder="Title" className={`w-full bg-transparent border ${T.cardBorder} px-3 py-2 mb-2 text-sm rounded`} required />
            <textarea value={newReview.body} onChange={e => setNewReview(r => ({ ...r, body: e.target.value }))} placeholder="Your impression..." rows={4} className={`w-full bg-transparent border ${T.cardBorder} px-3 py-2 mb-3 text-sm rounded`} required />
            <button className={`w-full ${T.cta} py-3 text-[10px] tracking-[0.3em] uppercase rounded font-bold`}>Submit Review</button>
          </form>
        </div>
      </div>

      {/* Related */}
      {data.related?.length > 0 && (
        <div className="max-w-[1600px] mx-auto px-4 lg:px-12 pb-32">
          <div className="text-center mb-12">
            <div className={`text-[10px] tracking-[0.4em] uppercase opacity-60 mb-3`}>You May Also Love</div>
            <h2 className="font-display text-5xl">Composed in Kinship</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
            {data.related.map((rp, i) => <ProductCard key={rp._id} product={rp} index={i} />)}
          </div>
        </div>
      )}

      {/* Sticky add to cart */}
      {showSticky && (
        <motion.div initial={{ y: -100 }} animate={{ y: 0 }} className={`fixed top-0 left-0 right-0 z-50 ${isWomen ? 'bg-rose-200/95 text-rose-900 border-rose-300' : 'bg-black/95 text-white border-white/10'} border-b backdrop-blur-xl`}>
          <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center gap-4">
            <div className={`w-12 h-12 rounded overflow-hidden ${T.cardBorder} border`}><img src={p.images?.[0]} className="w-full h-full object-cover" /></div>
            <div className="flex-1">
              <div className="font-display text-lg leading-none">{p.name.toUpperCase()}</div>
              <div className="font-bold">₹{bundle.price} <span className="opacity-50 line-through font-normal text-xs">₹{bundle.comparePrice}</span></div>
            </div>
            <button onClick={() => handleAdd()} className={`${T.cta} px-6 py-3 text-[10px] tracking-[0.3em] uppercase font-bold rounded`}>Add to Cart</button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ProductPage;
