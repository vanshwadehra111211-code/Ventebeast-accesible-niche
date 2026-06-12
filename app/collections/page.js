'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import { api } from '@/lib/api';
import { ChevronDown } from 'lucide-react';

function CollectionsInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest');

  const collection = sp.get('collection') || '';
  const family = sp.get('family') || '';
  const newArrival = sp.get('newArrival');
  const bestseller = sp.get('bestseller');
  const q = sp.get('q') || '';

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (collection) params.set('collection', collection);
    if (family) params.set('family', family);
    if (newArrival) params.set('newArrival', 'true');
    if (bestseller) params.set('bestseller', 'true');
    params.set('sort', sort);
    api(`products?${params}`).then(d => { setProducts(d.products); setLoading(false); });
  }, [q, collection, family, newArrival, bestseller, sort]);

  const collections = ['Signature', 'Sacred', 'Leathers', 'Metallics', 'Florals Noir', 'Ambres'];
  const families = ['Woody Oriental', 'Powdery Floral', 'Resinous Woody', 'Leather', 'Floral Gourmand', 'Amber Oriental'];

  const setFilter = (key, value) => {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value); else params.delete(key);
    router.push(`/collections?${params}`);
  };

  const title = q ? `Results for “${q}”` : collection || (newArrival ? 'New Arrivals' : bestseller ? 'Bestsellers' : 'All Fragrances');

  return (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-12 pt-12 pb-32">
      <div className="mb-12 text-center">
        <div className="text-[10px] tracking-[0.4em] uppercase text-white/40 mb-4">The Shop</div>
        <h1 className="font-serif text-5xl md:text-7xl">{title}</h1>
        <p className="text-white/40 text-sm mt-3">{products.length} fragrance{products.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Filters bar */}
      <div className="border-y border-white/10 py-4 mb-12 flex flex-wrap gap-3 justify-between items-center">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => router.push('/collections')} className={`text-[10px] tracking-[0.25em] uppercase px-4 py-2 border ${!collection && !family ? 'bg-white text-black border-white' : 'border-white/20 hover:border-white/60'}`}>All</button>
          {collections.map(c => (
            <button key={c} onClick={() => setFilter('collection', collection === c ? '' : c)} className={`text-[10px] tracking-[0.25em] uppercase px-4 py-2 border ${collection === c ? 'bg-white text-black border-white' : 'border-white/20 hover:border-white/60'}`}>{c}</button>
          ))}
        </div>
        <div className="relative">
          <select value={sort} onChange={e => setSort(e.target.value)} className="appearance-none bg-transparent border border-white/20 px-4 py-2 pr-10 text-[10px] tracking-[0.25em] uppercase cursor-pointer">
            <option value="newest">Newest</option>
            <option value="priceAsc">Price: Low to High</option>
            <option value="priceDesc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
          <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
          {[...Array(8)].map((_, i) => <div key={i} className="aspect-[3/4] bg-neutral-900 animate-pulse" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-32 text-white/40">No fragrances found.</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10">
          {products.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
        </div>
      )}
    </div>
  );
}

export default function CollectionsPage() {
  return <Suspense fallback={<div className="p-12 text-white/40">Loading...</div>}><CollectionsInner /></Suspense>;
}
