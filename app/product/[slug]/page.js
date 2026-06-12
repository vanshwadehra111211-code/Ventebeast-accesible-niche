'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Heart, ShoppingBag, Truck, Shield, RotateCcw, Star, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import ProductCard from '@/components/ProductCard';
import { api, formatINR } from '@/lib/api';
import { useStore } from '@/lib/store';

const ProductPage = () => {
  const { slug } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [variantIdx, setVariantIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [openSection, setOpenSection] = useState('notes');
  const [newReview, setNewReview] = useState({ rating: 5, title: '', body: '' });

  const addToCart = useStore(s => s.addToCart);
  const wishlist = useStore(s => s.wishlist);
  const user = useStore(s => s.user);
  const toggleWishlist = useStore(s => s.toggleWishlist);

  useEffect(() => {
    api(`products/${slug}`).then(setData);
  }, [slug]);
  useEffect(() => {
    if (data?.product?._id) api(`reviews/${data.product._id}`).then(d => setReviews(d.reviews));
  }, [data?.product?._id]);

  if (!data) return <div className="min-h-screen flex items-center justify-center text-white/40">Composing...</div>;
  const p = data.product;
  const v = p.variants[variantIdx];
  const isWish = wishlist?.includes(p._id);

  const handleAdd = () => {
    addToCart({ productId: p._id, slug: p.slug, name: p.name, image: p.images?.[0], sku: v.sku, size: v.size, price: v.price, qty });
    toast.success(`${p.name} · ${v.size} added to bag`);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    try {
      await api('reviews', { method: 'POST', body: { productId: p._id, ...newReview } });
      toast.success('Review posted');
      setNewReview({ rating: 5, title: '', body: '' });
      const r = await api(`reviews/${p._id}`);
      setReviews(r.reviews);
      const updated = await api(`products/${slug}`);
      setData(updated);
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="pb-32">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 pt-8 text-[10px] tracking-[0.25em] uppercase text-white/40">
        <span onClick={() => router.push('/')} className="cursor-pointer hover:text-white">Home</span>
        <span className="mx-2">/</span>
        <span onClick={() => router.push('/collections')} className="cursor-pointer hover:text-white">Shop</span>
        <span className="mx-2">/</span>
        <span className="text-white">{p.name}</span>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 pt-8 grid lg:grid-cols-2 gap-12 lg:gap-20">
        {/* Gallery */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className="sticky top-24 self-start">
          <div className="aspect-square bg-neutral-950 overflow-hidden grain">
            <img src={p.images?.[0]} alt={p.name} className="w-full h-full object-cover" />
          </div>
          {p.gallery?.length > 1 && (
            <div className="grid grid-cols-4 gap-3 mt-4">
              {p.gallery.map((g, i) => (
                <div key={i} className="aspect-square bg-neutral-950 cursor-pointer hover:opacity-80"><img src={g} alt="" className="w-full h-full object-cover" /></div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Details */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }} className="py-4">
          <div className="text-[10px] tracking-[0.4em] uppercase text-white/50">{p.collection} · {p.concentration}</div>
          <h1 className="font-serif text-5xl md:text-6xl mt-3 leading-tight">{p.name}</h1>
          <div className="flex items-center gap-3 mt-4">
            <div className="flex">{[1,2,3,4,5].map(i => <Star key={i} className={`w-4 h-4 ${i <= Math.round(p.rating || 0) ? 'fill-white text-white' : 'text-white/30'}`} />)}</div>
            <span className="text-xs text-white/50">{p.rating} · {p.reviewCount} reviews</span>
          </div>
          <p className="mt-6 text-white/70 font-serif text-xl leading-relaxed">{p.shortDescription}</p>

          <div className="mt-10">
            <div className="text-[10px] tracking-[0.3em] uppercase text-white/50 mb-3">Volume</div>
            <div className="flex gap-3">
              {p.variants.map((vr, i) => (
                <button key={vr.sku} onClick={() => setVariantIdx(i)} className={`px-5 py-3 border text-sm tracking-wider ${i === variantIdx ? 'bg-white text-black border-white' : 'border-white/30 hover:border-white/70'}`}>
                  <div>{vr.size}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">{formatINR(vr.price)}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex items-baseline gap-4">
            <div className="font-serif text-4xl">{formatINR(v.price)}</div>
            {v.comparePrice > v.price && <div className="text-white/40 line-through">{formatINR(v.comparePrice)}</div>}
            <div className="text-xs text-white/50 ml-auto">{v.stock > 0 ? `${v.stock} in stock` : 'Out of stock'}</div>
          </div>

          <div className="mt-8 flex gap-3">
            <div className="flex items-center border border-white/30">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-12 h-14">−</button>
              <span className="w-12 text-center">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="w-12 h-14">+</button>
            </div>
            <button onClick={handleAdd} disabled={v.stock === 0} className="btn-luxury flex-1 bg-white text-black h-14 text-[11px] tracking-[0.3em] uppercase font-medium hover:bg-white/90 disabled:opacity-40 inline-flex items-center justify-center gap-3">
              <ShoppingBag className="w-4 h-4" /> {v.stock === 0 ? 'Sold Out' : 'Add To Bag'}
            </button>
            <button onClick={() => toggleWishlist(p._id)} className="w-14 h-14 border border-white/30 flex items-center justify-center hover:bg-white hover:text-black transition-colors">
              <Heart className={`w-5 h-5 ${isWish ? 'fill-white text-white' : ''}`} />
            </button>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4 text-[10px] tracking-[0.2em] uppercase text-white/50">
            <div className="flex items-center gap-2"><Truck className="w-4 h-4" /> Free over ₹5k</div>
            <div className="flex items-center gap-2"><Shield className="w-4 h-4" /> Authentic</div>
            <div className="flex items-center gap-2"><RotateCcw className="w-4 h-4" /> 30-day return</div>
          </div>

          {/* Accordions */}
          <div className="mt-12 border-t border-white/10">
            {[
              { id: 'notes', title: 'Olfactive Pyramid', content: (
                <div className="space-y-4 text-white/70">
                  <div><div className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-1">Top</div>{p.topNotes?.join(' · ')}</div>
                  <div><div className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-1">Heart</div>{p.heartNotes?.join(' · ')}</div>
                  <div><div className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-1">Base</div>{p.baseNotes?.join(' · ')}</div>
                </div>
              )},
              { id: 'desc', title: 'Description', content: <p className="text-white/70 leading-relaxed font-serif text-lg">{p.description}</p> },
              { id: 'spec', title: 'Performance', content: (
                <div className="grid grid-cols-2 gap-4 text-sm text-white/70">
                  <div><span className="text-white/40">Family:</span> {p.scentFamily}</div>
                  <div><span className="text-white/40">Longevity:</span> {p.longevity}</div>
                  <div><span className="text-white/40">Projection:</span> {p.projection}</div>
                  <div><span className="text-white/40">Gender:</span> {p.gender}</div>
                </div>
              )},
            ].map(s => (
              <div key={s.id} className="border-b border-white/10">
                <button onClick={() => setOpenSection(openSection === s.id ? '' : s.id)} className="w-full py-5 flex justify-between items-center text-[11px] tracking-[0.3em] uppercase">
                  {s.title} <ChevronDown className={`w-4 h-4 transition-transform ${openSection === s.id ? 'rotate-180' : ''}`} />
                </button>
                {openSection === s.id && <div className="pb-6">{s.content}</div>}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Reviews */}
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 mt-32">
        <div className="text-center mb-12">
          <div className="text-[10px] tracking-[0.4em] uppercase text-white/40 mb-3">Voices</div>
          <h2 className="font-serif text-5xl">Reviews</h2>
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {reviews.length === 0 ? <div className="text-white/40 text-center py-16">Be the first to share your impression.</div> :
              reviews.map(r => (
                <div key={r._id} className="border border-white/10 p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex">{[1,2,3,4,5].map(i => <Star key={i} className={`w-3 h-3 ${i <= r.rating ? 'fill-white text-white' : 'text-white/20'}`} />)}</div>
                      <h4 className="font-serif text-2xl mt-2">{r.title}</h4>
                    </div>
                    <div className="text-[10px] tracking-[0.2em] uppercase text-white/40">{new Date(r.createdAt).toLocaleDateString()}</div>
                  </div>
                  <p className="text-white/70 mt-3">{r.body}</p>
                  <div className="text-[10px] tracking-[0.2em] uppercase text-white/40 mt-4">— {r.userName} {r.verified && <span className="ml-2">· Verified</span>}</div>
                </div>
              ))
            }
          </div>
          <form onSubmit={submitReview} className="border border-white/10 p-6 h-fit">
            <h3 className="font-serif text-2xl mb-4">Write a Review</h3>
            {!user && <p className="text-xs text-white/50 mb-4">Sign in to share your impression.</p>}
            <div className="flex gap-1 mb-3">{[1,2,3,4,5].map(i => <button type="button" key={i} onClick={() => setNewReview(r => ({ ...r, rating: i }))}><Star className={`w-5 h-5 ${i <= newReview.rating ? 'fill-white text-white' : 'text-white/30'}`} /></button>)}</div>
            <input value={newReview.title} onChange={e => setNewReview(r => ({ ...r, title: e.target.value }))} placeholder="Title" className="w-full bg-transparent border border-white/20 px-3 py-2 mb-2 text-sm" required />
            <textarea value={newReview.body} onChange={e => setNewReview(r => ({ ...r, body: e.target.value }))} placeholder="Your impression..." rows={4} className="w-full bg-transparent border border-white/20 px-3 py-2 mb-3 text-sm" required />
            <button className="w-full bg-white text-black py-3 text-[10px] tracking-[0.3em] uppercase">Submit Review</button>
          </form>
        </div>
      </div>

      {/* Related */}
      {data.related?.length > 0 && (
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 mt-32">
          <div className="text-center mb-12">
            <div className="text-[10px] tracking-[0.4em] uppercase text-white/40 mb-3">You May Also Love</div>
            <h2 className="font-serif text-4xl md:text-5xl">Composed in Kinship</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
            {data.related.map((rp, i) => <ProductCard key={rp._id} product={rp} index={i} />)}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPage;
