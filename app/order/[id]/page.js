'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api, formatINR } from '@/lib/api';
import { Check, Download } from 'lucide-react';
import { motion } from 'framer-motion';

const OrderPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => { api(`orders/${id}`).then(d => setOrder(d.order)); }, [id]);

  if (!order) return <div className="min-h-[60vh] flex items-center justify-center text-white/40">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto px-6 py-20">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.5, ease: [0.22,1,0.36,1] }} className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center mx-auto mb-8">
        <Check className="w-10 h-10" />
      </motion.div>
      <div className="text-center mb-12">
        <div className="text-[10px] tracking-[0.4em] uppercase text-white/40 mb-3">Confirmed</div>
        <h1 className="font-serif text-5xl mb-3">Thank You</h1>
        <p className="text-white/60">Order {order.orderNumber} · A confirmation will arrive shortly at {order.userEmail}</p>
      </div>

      <div className="border border-white/10 p-8 mb-6">
        <div className="flex justify-between items-baseline mb-6">
          <h2 className="font-serif text-2xl">Items</h2>
          <div className="text-[10px] tracking-[0.25em] uppercase text-white/40">{order.status}</div>
        </div>
        <div className="divide-y divide-white/10">
          {order.items.map((it, i) => (
            <div key={i} className="py-4 flex gap-4 items-center">
              <div className="w-16 h-20 bg-neutral-950"><img src={it.image} className="w-full h-full object-cover" /></div>
              <div className="flex-1">
                <Link href={`/product/${it.slug}`} className="font-serif text-lg hover:text-white/70">{it.name}</Link>
                <div className="text-xs text-white/50">{it.size} · Qty {it.qty}</div>
              </div>
              <div className="text-sm">{formatINR(it.total)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-white/10 p-8 mb-6">
        <div className="text-[10px] tracking-[0.3em] uppercase text-white/40 mb-3">Shipping To</div>
        <div className="text-white/80">{order.address.name}</div>
        <div className="text-white/60 text-sm">{order.address.line1}{order.address.line2 && `, ${order.address.line2}`}, {order.address.city}, {order.address.state} {order.address.pincode}</div>
        <div className="text-white/50 text-xs mt-1">{order.address.phone}</div>
      </div>

      <div className="border border-white/10 p-8">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-white/60">Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
          {order.discount > 0 && <div className="flex justify-between text-emerald-400"><span>Discount ({order.couponCode})</span><span>−{formatINR(order.discount)}</span></div>}
          <div className="flex justify-between"><span className="text-white/60">Shipping</span><span>{order.shipping === 0 ? 'Free' : formatINR(order.shipping)}</span></div>
        </div>
        <div className="border-t border-white/10 my-4" />
        <div className="flex justify-between items-baseline">
          <span className="text-[10px] tracking-[0.3em] uppercase">Total Paid</span>
          <span className="font-serif text-3xl">{formatINR(order.total)}</span>
        </div>
        <div className="mt-2 text-xs text-white/50">Payment: {order.paymentMethod === 'mock' ? 'Test Mode' : order.paymentMethod} · {order.paymentStatus}</div>
      </div>

      <div className="mt-8 flex gap-3 justify-center">
        <Link href="/account?tab=orders" className="border border-white/30 px-8 py-4 text-[11px] tracking-[0.3em] uppercase hover:bg-white hover:text-black">View All Orders</Link>
        <Link href="/collections" className="bg-white text-black px-8 py-4 text-[11px] tracking-[0.3em] uppercase">Continue Shopping</Link>
      </div>
    </div>
  );
};

export default OrderPage;
