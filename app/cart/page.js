'use client';
import { useStore, cartSubtotal } from '@/lib/store';
import { formatINR } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FREE_SHIP_THRESHOLD = 500;

const CartPage = () => {
  const router = useRouter();
  const cart = useStore(s => s.cart);
  const updateQty = useStore(s => s.updateQty);
  const removeFromCart = useStore(s => s.removeFromCart);
  const subtotal = cartSubtotal(cart);
  const shipping = subtotal >= FREE_SHIP_THRESHOLD || subtotal === 0 ? 0 : 79;

  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pt-12 pb-32">
      <div className="text-center mb-12">
        <div className="text-[10px] tracking-[0.4em] uppercase text-jungle-700 mb-3 font-bold">Your Bag</div>
        <h1 className="font-display text-6xl text-navy-900">Shopping Bag</h1>
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-32 bg-white rounded border border-navy-200">
          <ShoppingBag className="w-12 h-12 mx-auto text-navy-400 mb-6" />
          <p className="text-navy-700 mb-8">Your bag is empty.</p>
          <Link href="/collections" className="inline-block bg-jungle-600 text-white px-10 py-4 text-[11px] tracking-[0.3em] uppercase font-bold hover:bg-jungle-700 rounded">Explore Fragrances</Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 bg-white rounded border border-navy-200 divide-y divide-navy-100 px-6">
            <AnimatePresence>
              {cart.map(item => (
                <motion.div key={item.sku} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -30 }} className="py-6 flex gap-6">
                  <Link href={`/product/${item.slug}`} className="shrink-0 w-32 h-40 bg-navy-50 overflow-hidden rounded">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </Link>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <Link href={`/product/${item.slug}`} className="font-serif text-2xl text-navy-900 hover:text-jungle-700">{item.name}</Link>
                        <div className="text-[10px] tracking-[0.25em] uppercase text-navy-600 mt-1">{item.bundleLabel || item.size}</div>
                      </div>
                      <button onClick={() => removeFromCart(item.sku)} className="text-navy-400 hover:text-navy-900"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="mt-auto pt-8 flex justify-between items-end">
                      <div className="flex items-center border border-navy-200 rounded">
                        <button onClick={() => updateQty(item.sku, item.qty - 1)} className="w-10 h-10 flex items-center justify-center text-navy-900"><Minus className="w-3 h-3" /></button>
                        <span className="w-10 text-center text-sm text-navy-900">{item.qty}</span>
                        <button onClick={() => updateQty(item.sku, item.qty + 1)} className="w-10 h-10 flex items-center justify-center text-navy-900"><Plus className="w-3 h-3" /></button>
                      </div>
                      <div className="text-right">
                        <div className="font-serif text-xl text-navy-900">{formatINR(item.price * item.qty)}</div>
                        <div className="text-[10px] text-navy-500">{formatINR(item.price)} each</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className="h-fit bg-white border border-navy-200 p-8 rounded sticky top-28">
            <h3 className="font-serif text-2xl mb-6 text-navy-900">Order Summary</h3>
            <div className="space-y-3 text-sm text-navy-900">
              <div className="flex justify-between"><span className="text-navy-600">Subtotal</span><span>{formatINR(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-navy-600">Shipping</span><span>{shipping === 0 ? 'Complimentary' : formatINR(shipping)}</span></div>
              {subtotal > 0 && subtotal < FREE_SHIP_THRESHOLD && <div className="text-[10px] tracking-wider text-jungle-700 bg-jungle-50 px-3 py-2 rounded">Spend {formatINR(FREE_SHIP_THRESHOLD - subtotal)} more for free shipping</div>}
            </div>
            <div className="border-t border-navy-100 my-6" />
            <div className="flex justify-between items-baseline text-navy-900">
              <span className="text-[10px] tracking-[0.3em] uppercase text-navy-600">Total</span>
              <span className="font-serif text-3xl">{formatINR(subtotal + shipping)}</span>
            </div>
            <button onClick={() => router.push('/checkout')} className="btn-luxury w-full bg-jungle-600 text-white mt-8 h-14 text-[11px] tracking-[0.3em] uppercase font-bold hover:bg-jungle-700 rounded inline-flex items-center justify-center gap-3">
              Proceed To Checkout <ArrowRight className="w-4 h-4" />
            </button>
            <Link href="/collections" className="block text-center mt-4 text-[10px] tracking-[0.25em] uppercase text-navy-600 hover:text-navy-900">Continue Shopping</Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
