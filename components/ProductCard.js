'use client';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '@/lib/store';
import { formatINR } from '@/lib/api';
import { toast } from 'sonner';

export default function ProductCard({ product, index = 0 }) {
  const wishlist = useStore(s => s.wishlist);
  const toggleWishlist = useStore(s => s.toggleWishlist);
  const addToCart = useStore(s => s.addToCart);
  const isWish = wishlist?.includes(product._id);
  const v = product.variants?.[0];
  const isWomen = product.gender === 'Women';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, delay: (index % 4) * 0.08, ease: [0.22,1,0.36,1] }}
      className="group relative"
    >
      <Link href={`/product/${product.slug}`} className="block">
        <div className={`relative aspect-[3/4] ${isWomen ? 'bg-rose-50' : 'bg-navy-50'} overflow-hidden rounded-sm border border-navy-100`}>
          <img src={product.images?.[0]} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          {product.newArrival && <span className="absolute top-3 left-3 text-[9px] tracking-[0.3em] uppercase bg-jungle-600 text-white px-3 py-1 rounded-sm font-bold">New</span>}
          {product.bestseller && !product.newArrival && <span className="absolute top-3 left-3 text-[9px] tracking-[0.3em] uppercase bg-navy-900 text-white px-3 py-1 rounded-sm font-bold">Bestseller</span>}
          <button onClick={(e) => { e.preventDefault(); toggleWishlist(product._id); }} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm border border-navy-200 flex items-center justify-center hover:bg-navy-900 hover:text-white transition-all duration-300 text-navy-900">
            <Heart className={`w-4 h-4 ${isWish ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); addToCart({ productId: product._id, slug: product.slug, name: product.name, image: product.images?.[0], sku: v.sku, size: v.size, price: v.price }); toast.success(`${product.name} added to bag`); }}
            className="absolute bottom-0 left-0 right-0 bg-jungle-600 text-white text-[11px] tracking-[0.3em] uppercase py-3.5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 font-bold btn-luxury"
          >
            Quick Add — {v?.size}
          </button>
        </div>
        <div className="pt-4 px-1">
          <div className="text-[10px] tracking-[0.3em] uppercase text-jungle-700 font-semibold">{product.collection}</div>
          <h3 className="font-serif text-xl mt-1.5 leading-tight text-navy-900">{product.name}</h3>
          <div className="text-xs text-navy-700 mt-1 line-clamp-1">{product.scentFamily}</div>
          <div className="flex items-baseline gap-3 mt-2">
            <span className="text-sm font-bold text-navy-900">{formatINR(v?.price)}</span>
            {v?.comparePrice > v?.price && <span className="text-xs text-navy-400 line-through">{formatINR(v.comparePrice)}</span>}
            <span className="text-[10px] text-navy-500 ml-auto">{v?.size}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
