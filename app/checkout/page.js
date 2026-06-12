'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore, cartSubtotal } from '@/lib/store';
import { api, formatINR } from '@/lib/api';
import { Check, CreditCard, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const Steps = ['Address', 'Shipping', 'Payment'];

const CheckoutPage = () => {
  const router = useRouter();
  const user = useStore(s => s.user);
  const cart = useStore(s => s.cart);
  const clearCart = useStore(s => s.clearCart);
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState({ name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', country: 'India' });
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('mock');
  const [placing, setPlacing] = useState(false);

  const subtotal = cartSubtotal(cart);
  const shippingCost = appliedCoupon?.freeShipping || subtotal > 5000 ? 0 : (shippingMethod === 'express' ? 500 : 200);
  const discount = appliedCoupon?.discount || 0;
  const total = subtotal - discount + shippingCost;

  useEffect(() => {
    if (!user) router.push('/login?next=/checkout');
    else if (cart.length === 0) router.push('/cart');
    else if (user?.name) setAddress(a => ({ ...a, name: user.name }));
  }, [user, cart]);

  const applyCoupon = async () => {
    try {
      const { coupon: c } = await api('coupons/validate', { method: 'POST', body: { code: coupon, subtotal } });
      setAppliedCoupon(c); toast.success(`Coupon ${c.code} applied`);
    } catch (e) { toast.error(e.message); }
  };

  const placeOrder = async () => {
    setPlacing(true);
    try {
      const { order } = await api('orders', {
        method: 'POST',
        body: {
          items: cart.map(c => ({ productId: c.productId, sku: c.sku, qty: c.qty })),
          address, shipping: shippingCost, discount, couponCode: appliedCoupon?.code, paymentMethod,
        },
      });
      // Mock payment
      const { order: paid } = await api('payment/mock-confirm', { method: 'POST', body: { orderId: order._id, success: true } });
      clearCart();
      router.push(`/order/${paid._id}`);
    } catch (e) { toast.error(e.message); setPlacing(false); }
  };

  const next = () => {
    if (step === 0) {
      if (!address.name || !address.phone || !address.line1 || !address.city || !address.pincode) return toast.error('Please fill all required address fields');
    }
    setStep(s => Math.min(2, s + 1));
  };

  if (!user || cart.length === 0) return null;

  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pt-12 pb-32">
      <div className="text-center mb-12">
        <div className="text-[10px] tracking-[0.4em] uppercase text-white/40 mb-3">Checkout</div>
        <h1 className="font-serif text-5xl">Complete Your Order</h1>
      </div>

      {/* Stepper */}
      <div className="flex justify-center gap-8 mb-16">
        {Steps.map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs ${i <= step ? 'bg-white text-black border-white' : 'border-white/30 text-white/40'}`}>
              {i < step ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-[10px] tracking-[0.3em] uppercase ${i === step ? 'text-white' : 'text-white/40'}`}>{s}</span>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {step === 0 && (
              <div className="border border-white/10 p-8">
                <h2 className="font-serif text-3xl mb-6">Shipping Address</h2>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ['name', 'Full Name', true, 2],
                    ['phone', 'Phone', true, 1],
                    ['pincode', 'Pincode', true, 1],
                    ['line1', 'Address Line 1', true, 2],
                    ['line2', 'Address Line 2', false, 2],
                    ['city', 'City', true, 1],
                    ['state', 'State', true, 1],
                  ].map(([k, label, req, span]) => (
                    <div key={k} className={`col-span-${span}`}>
                      <label className="text-[10px] tracking-[0.25em] uppercase text-white/50">{label}{req && ' *'}</label>
                      <input value={address[k] || ''} onChange={e => setAddress(a => ({ ...a, [k]: e.target.value }))} className="w-full bg-transparent border-b border-white/20 py-2 outline-none focus:border-white" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {step === 1 && (
              <div className="border border-white/10 p-8">
                <h2 className="font-serif text-3xl mb-6">Shipping Method</h2>
                <div className="space-y-3">
                  {[
                    { id: 'standard', name: 'Standard', desc: '5–7 business days', price: subtotal > 5000 ? 0 : 200 },
                    { id: 'express', name: 'Express', desc: '2–3 business days', price: 500 },
                  ].map(m => (
                    <label key={m.id} className={`flex items-center gap-4 p-5 border cursor-pointer ${shippingMethod === m.id ? 'border-white' : 'border-white/20'}`}>
                      <input type="radio" checked={shippingMethod === m.id} onChange={() => setShippingMethod(m.id)} className="accent-white" />
                      <div className="flex-1">
                        <div className="font-serif text-lg">{m.name}</div>
                        <div className="text-xs text-white/50">{m.desc}</div>
                      </div>
                      <div>{m.price === 0 ? 'Free' : formatINR(m.price)}</div>
                    </label>
                  ))}
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="border border-white/10 p-8">
                <h2 className="font-serif text-3xl mb-6">Payment</h2>
                <div className="p-5 border border-white/20 mb-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" checked={paymentMethod === 'mock'} onChange={() => setPaymentMethod('mock')} className="accent-white" />
                    <CreditCard className="w-5 h-5" />
                    <span className="font-serif text-lg">Test Payment (Mock)</span>
                  </label>
                  <p className="text-xs text-white/50 mt-2 ml-8">Live Paytm (UPI / Cards / Net Banking) will be activated once merchant credentials are configured.</p>
                </div>
                <div className="bg-neutral-900/50 p-5 text-xs text-white/60 leading-relaxed">
                  By placing the order, you agree to VENTEBEAST&apos;s Terms of Sale. Your card will not be charged — this is a demo flow.
                </div>
              </div>
            )}
          </motion.div>

          <div className="flex justify-between mt-8">
            {step > 0 ? <button onClick={() => setStep(s => s - 1)} className="text-[11px] tracking-[0.3em] uppercase text-white/60 hover:text-white">← Back</button> : <span />}
            {step < 2 ? <button onClick={next} className="btn-luxury bg-white text-black px-10 py-4 text-[11px] tracking-[0.3em] uppercase font-medium">Continue →</button> :
              <button onClick={placeOrder} disabled={placing} className="btn-luxury bg-white text-black px-10 py-4 text-[11px] tracking-[0.3em] uppercase font-medium inline-flex items-center gap-3 disabled:opacity-50">
                {placing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing</> : 'Place Order'}
              </button>}
          </div>
        </div>

        {/* Summary */}
        <div className="h-fit border border-white/10 p-8 sticky top-28">
          <h3 className="font-serif text-2xl mb-4">Order Summary</h3>
          <div className="divide-y divide-white/10 mb-4">
            {cart.map(c => (
              <div key={c.sku} className="py-3 flex gap-3 items-center">
                <div className="w-14 h-14 bg-neutral-950 shrink-0"><img src={c.image} className="w-full h-full object-cover" /></div>
                <div className="flex-1 text-xs">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-white/40">{c.size} · Qty {c.qty}</div>
                </div>
                <div className="text-xs">{formatINR(c.price * c.qty)}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mb-4">
            <input value={coupon} onChange={e => setCoupon(e.target.value)} placeholder="Coupon code" className="flex-1 bg-transparent border border-white/20 px-3 py-2 text-sm" />
            <button onClick={applyCoupon} className="text-[10px] tracking-[0.25em] uppercase border border-white/30 px-4 hover:bg-white hover:text-black">Apply</button>
          </div>
          {appliedCoupon && <div className="text-xs text-emerald-400 mb-4">✓ {appliedCoupon.code} — {appliedCoupon.freeShipping ? 'Free shipping' : formatINR(appliedCoupon.discount) + ' off'}</div>}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-white/60">Subtotal</span><span>{formatINR(subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between text-emerald-400"><span>Discount</span><span>−{formatINR(discount)}</span></div>}
            <div className="flex justify-between"><span className="text-white/60">Shipping</span><span>{shippingCost === 0 ? 'Free' : formatINR(shippingCost)}</span></div>
          </div>
          <div className="border-t border-white/10 my-4" />
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] tracking-[0.3em] uppercase">Total</span>
            <span className="font-serif text-3xl">{formatINR(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
