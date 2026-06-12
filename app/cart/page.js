'use client';
import { useStore, cartSubtotal } from '@/lib/store';
import { formatINR } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CartPage = () => {
  const router = useRouter();
  const cart = useStore(s => s.cart);
  const updateQty = useStore(s => s.updateQty);
  const removeFromCart = useStore(s => s.removeFromCart);
  const subtotal = cartSubtotal(cart);
  const shipping = subtotal > 5000 || subtotal === 0 ? 0 : 200;

  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pt-12 pb-32">
      <div className="text-center mb-16">
        <div className="text-[10px] tracking-[0.4em] uppercase text-white/40 mb-3">Step 1 of 3</div>
        <h1 className="font-serif text-6xl">Your Bag</h1>
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-32">
          <ShoppingBag className="w-12 h-12 mx-auto text-white/30 mb-6" />
          <p className="text-white/50 mb-8">Your bag is empty.</p>
          <Link href="/collections" className="inline-block border border-white px-10 py-4 text-[11px] tracking-[0.3em] uppercase hover:bg-white hover:text-black transition-colors">Explore Fragrances</Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 divide-y divide-white/10">
            <AnimatePresence>
              {cart.map(item => (
                <motion.div key={item.sku} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -30 }} className="py-6 flex gap-6">
                  <Link href={`/product/${item.slug}`} className="shrink-0 w-32 h-40 bg-neutral-950 overflow-hidden">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </Link>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <Link href={`/product/${item.slug}`} className="font-serif text-2xl hover:text-white/70">{item.name}</Link>
                        <div className="text-[10px] tracking-[0.25em] uppercase text-white/50 mt-1">{item.bundleLabel || item.size}</div>
                      </div>
                      <button onClick={() => removeFromCart(item.sku)} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="mt-auto pt-8 flex justify-between items-end">
                      <div className="flex items-center border border-white/20">
                        <button onClick={() => updateQty(item.sku, item.qty - 1)} className="w-10 h-10 flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                        <span className="w-10 text-center text-sm">{item.qty}</span>
                        <button onClick={() => updateQty(item.sku, item.qty + 1)} className="w-10 h-10 flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                      </div>
                      <div className="text-right">
                        <div className="font-serif text-xl">{formatINR(item.price * item.qty)}</div>
                        <div className="text-[10px] text-white/40">{formatINR(item.price)} each</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className="h-fit border border-white/10 p-8 sticky top-28">
            <h3 className="font-serif text-2xl mb-6">Order Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-white/60">Subtotal</span><span>{formatINR(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-white/60">Shipping</span><span>{shipping === 0 ? 'Complimentary' : formatINR(shipping)}</span></div>
              {subtotal > 0 && subtotal < 5000 && <div className="text-[10px] tracking-wider text-white/40">Spend {formatINR(5000 - subtotal)} more for free shipping</div>}
            </div>
            <div className="border-t border-white/10 my-6" />
            <div className="flex justify-between items-baseline">
              <span className="text-[10px] tracking-[0.3em] uppercase text-white/60">Total</span>
              <span className="font-serif text-3xl">{formatINR(subtotal + shipping)}</span>
            </div>
            <button onClick={() => router.push('/checkout')} className="btn-luxury w-full bg-white text-black mt-8 h-14 text-[11px] tracking-[0.3em] uppercase font-medium inline-flex items-center justify-center gap-3">
              Proceed To Checkout <ArrowRight className="w-4 h-4" />
            </button>
            <Link href="/collections" className="block text-center mt-4 text-[10px] tracking-[0.25em] uppercase text-white/50 hover:text-white">Continue Shopping</Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
