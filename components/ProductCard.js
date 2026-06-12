'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useStore } from '@/lib/store';
import { formatINR } from '@/lib/api';

export default function ProductCard({ product, index = 0 }) {
  const wishlist = useStore(s => s.wishlist);
  const toggleWishlist = useStore(s => s.toggleWishlist);
  const addToCart = useStore(s => s.addToCart);
  const isWish = wishlist?.includes(product._id);
  const v = product.variants?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, delay: (index % 4) * 0.08, ease: [0.22,1,0.36,1] }}
      className="group relative"
    >
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative aspect-[3/4] bg-neutral-950 overflow-hidden">
          <img src={product.images?.[0]} alt={product.name} className="w-full h-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          {product.newArrival && <span className="absolute top-4 left-4 text-[9px] tracking-[0.3em] uppercase bg-white text-black px-3 py-1">New</span>}
          {product.bestseller && !product.newArrival && <span className="absolute top-4 left-4 text-[9px] tracking-[0.3em] uppercase border border-white/60 px-3 py-1 backdrop-blur-sm">Bestseller</span>}
          <button onClick={(e) => { e.preventDefault(); toggleWishlist(product._id); }} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white hover:text-black transition-all duration-300">
            <Heart className={`w-4 h-4 ${isWish ? 'fill-white text-white' : ''}`} />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); addToCart({ productId: product._id, slug: product.slug, name: product.name, image: product.images?.[0], sku: v.sku, size: v.size, price: v.price }); import('sonner').then(({ toast }) => toast.success(`${product.name} added to bag`)); }}
            className="absolute bottom-0 left-0 right-0 bg-white text-black text-[11px] tracking-[0.3em] uppercase py-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 font-medium btn-luxury"
          >
            Quick Add &mdash; {v?.size}
          </button>
        </div>
        <div className="pt-5 px-1">
          <div className="text-[10px] tracking-[0.3em] uppercase text-white/40">{product.collection}</div>
          <h3 className="font-serif text-xl mt-1.5 leading-tight">{product.name}</h3>
          <div className="text-xs text-white/50 mt-1 line-clamp-1">{product.scentFamily}</div>
          <div className="flex items-baseline gap-3 mt-3">
            <span className="text-sm tracking-wider">{formatINR(v?.price)}</span>
            {v?.comparePrice > v?.price && <span className="text-xs text-white/30 line-through">{formatINR(v.comparePrice)}</span>}
            <span className="text-[10px] text-white/40 ml-auto">{v?.size}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
