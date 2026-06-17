'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore, cartSubtotal } from '@/lib/store';
import { api, formatINR } from '@/lib/api';
import { Check, Truck, Lock, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const Steps = ['Address', 'Shipping', 'Confirm'];
const FREE_SHIP_THRESHOLD = 500;

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
  const [placing, setPlacing] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  const loadScript = (src) => new Promise((resolve, reject) => {
    let existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.getAttribute('data-loaded') === 'true') return resolve(true);
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => reject(new Error('Unable to load Razorpay checkout')));
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => { script.setAttribute('data-loaded', 'true'); resolve(true); };
    script.onerror = () => reject(new Error('Unable to load Razorpay checkout'));
    document.body.appendChild(script);
  });

  const subtotal = cartSubtotal(cart);
  const baseShip = subtotal >= FREE_SHIP_THRESHOLD ? 0 : (shippingMethod === 'express' ? 199 : 79);
  const shippingCost = appliedCoupon?.freeShipping ? 0 : baseShip;
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

  const createRazorpayOrder = async () => {
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) throw new Error('Razorpay key is not configured. Set NEXT_PUBLIC_RAZORPAY_KEY_ID.');
    const body = {
      items: cart.map(c => ({ productId: c.productId, sku: c.sku, qty: c.qty, price: c.price, bundleLabel: c.bundleLabel })),
      address,
      shipping: shippingCost,
      discount,
      couponCode: appliedCoupon?.code,
      currency: 'INR',
    };
    const { razorpayOrder } = await api('payments/razorpay-order', { method: 'POST', body });
    return razorpayOrder;
  };

  const placeOrder = async () => {
    if (!address.name || !address.phone || !address.line1 || !address.city || !address.pincode) {
      toast.error('Please fill all required address fields');
      return;
    }
    setPaymentError(null);
    setPlacing(true);
    try {
      const razorpayOrder = await createRazorpayOrder();
      await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'VENTEBEAST',
        description: 'Order payment',
        order_id: razorpayOrder.id,
        prefill: { name: address.name, contact: address.phone, email: user?.email || '' },
        theme: { color: '#0c1729' },
        handler: async (response) => {
          try {
            const { order } = await api('payments/razorpay-confirm', {
              method: 'POST',
              body: {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                items: cart.map(c => ({ productId: c.productId, sku: c.sku, qty: c.qty, price: c.price, bundleLabel: c.bundleLabel })),
                address,
                shipping: shippingCost,
                discount,
                couponCode: appliedCoupon?.code,
              },
            });
            clearCart();
            router.push(`/order/${order._id}`);
          } catch (e) {
            toast.error(e.message);
            setPlacing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPlacing(false);
            toast.error('Payment was cancelled');
          },
        },
      });
      rzp.open();
    } catch (e) {
      setPaymentError(e.message);
      toast.error(e.message);
      setPlacing(false);
    }
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
        <div className="text-[10px] tracking-[0.4em] uppercase text-jungle-700 mb-3 font-bold">Checkout</div>
        <h1 className="font-display text-5xl text-navy-900">Complete Your Order</h1>
      </div>

      <div className="flex justify-center gap-8 mb-16">
        {Steps.map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs ${i <= step ? 'bg-jungle-600 text-white border-jungle-600' : 'border-navy-300 text-navy-400'}`}>
              {i < step ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-[10px] tracking-[0.3em] uppercase font-bold ${i === step ? 'text-navy-900' : 'text-navy-400'}`}>{s}</span>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {step === 0 && (
              <div className="bg-white border border-navy-200 p-8 rounded">
                <h2 className="font-display text-3xl mb-6 text-navy-900">Shipping Address</h2>
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
                      <label className="text-[10px] tracking-[0.25em] uppercase text-navy-600 font-semibold">{label}{req && ' *'}</label>
                      <input value={address[k] || ''} onChange={e => setAddress(a => ({ ...a, [k]: e.target.value }))} className="w-full bg-transparent border-b border-navy-300 py-2 outline-none focus:border-jungle-600 text-navy-900" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {step === 1 && (
              <div className="bg-white border border-navy-200 p-8 rounded">
                <h2 className="font-display text-3xl mb-6 text-navy-900">Shipping Method</h2>
                <div className="space-y-3">
                  {[
                    { id: 'standard', name: 'Standard', desc: '5–7 business days', price: subtotal >= FREE_SHIP_THRESHOLD ? 0 : 79 },
                    { id: 'express', name: 'Express', desc: '2–3 business days', price: 199 },
                  ].map(m => (
                    <label key={m.id} className={`flex items-center gap-4 p-5 border-2 cursor-pointer rounded ${shippingMethod === m.id ? 'border-jungle-600 bg-jungle-50' : 'border-navy-200'}`}>
                      <input type="radio" checked={shippingMethod === m.id} onChange={() => setShippingMethod(m.id)} className="accent-jungle-600" />
                      <div className="flex-1">
                        <div className="font-serif text-lg text-navy-900">{m.name}</div>
                        <div className="text-xs text-navy-600">{m.desc}</div>
                      </div>
                      <div className="text-navy-900 font-bold">{m.price === 0 ? 'Free' : formatINR(m.price)}</div>
                    </label>
                  ))}
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="bg-white border border-navy-200 p-8 rounded">
                <h2 className="font-display text-3xl mb-6 text-navy-900">Payment Method</h2>
                <div className="p-5 border-2 border-jungle-600 bg-jungle-50 rounded">
                  <div className="flex items-center gap-3">
                    <Lock className="w-6 h-6 text-jungle-600" />
                    <div className="flex-1">
                      <div className="font-display text-xl text-navy-900">Razorpay Checkout</div>
                      <div className="text-xs text-navy-600 mt-1">Secure online payment. Orders are confirmed instantly after payment.</div>
                    </div>
                    <div className="text-[10px] tracking-[0.25em] uppercase bg-jungle-600 text-white px-3 py-1 rounded font-bold">Prepaid Only</div>
                  </div>
                </div>
                <div className="bg-navy-50 p-5 mt-4 text-xs text-navy-700 leading-relaxed border border-navy-200 rounded">
                  By placing this order, you agree to VENTEBEAST&apos;s Terms of Sale. Your online order will be delivered to the address above within 5–7 business days.
                </div>
              </div>
            )}
          </motion.div>

          <div className="flex justify-between mt-8">
            {step > 0 ? <button onClick={() => setStep(s => s - 1)} className="text-[11px] tracking-[0.3em] uppercase text-navy-600 hover:text-navy-900">← Back</button> : <span />}
            {step < 2 ? <button onClick={next} className="btn-luxury bg-navy-900 text-white px-10 py-4 text-[11px] tracking-[0.3em] uppercase font-bold rounded">Continue →</button> :
              <div className="flex flex-col items-end gap-2">
                {paymentError && <div className="text-sm text-red-600">{paymentError}</div>}
                <button onClick={placeOrder} disabled={placing} className="btn-luxury bg-jungle-600 text-white px-10 py-4 text-[11px] tracking-[0.3em] uppercase font-bold inline-flex items-center gap-3 disabled:opacity-50 rounded">
                  {placing ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : 'Pay with Razorpay'}
                </button>
              </div>}
          </div>
        </div>

        <div className="h-fit bg-white border border-navy-200 p-8 rounded sticky top-28">
          <h3 className="font-display text-2xl mb-4 text-navy-900">Order Summary</h3>
          <div className="divide-y divide-navy-100 mb-4">
            {cart.map(c => (
              <div key={c.sku + (c.bundleLabel || '')} className="py-3 flex gap-3 items-center">
                <div className="w-14 h-14 bg-navy-50 shrink-0 rounded overflow-hidden"><img src={c.image} className="w-full h-full object-cover" /></div>
                <div className="flex-1 text-xs">
                  <div className="font-medium text-navy-900">{c.name}</div>
                  <div className="text-navy-500">{c.bundleLabel || c.size} · Qty {c.qty}</div>
                </div>
                <div className="text-xs text-navy-900">{formatINR(c.price * c.qty)}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mb-4">
            <input value={coupon} onChange={e => setCoupon(e.target.value)} placeholder="Coupon code" className="flex-1 bg-transparent border border-navy-300 px-3 py-2 text-sm text-navy-900 rounded" />
            <button onClick={applyCoupon} className="text-[10px] tracking-[0.25em] uppercase border border-navy-900 text-navy-900 px-4 hover:bg-navy-900 hover:text-white rounded">Apply</button>
          </div>
          {appliedCoupon && <div className="text-xs text-jungle-700 bg-jungle-50 px-3 py-2 rounded mb-4 font-semibold">✓ {appliedCoupon.code} — {appliedCoupon.freeShipping ? 'Free shipping' : formatINR(appliedCoupon.discount) + ' off'}</div>}
          <div className="space-y-2 text-sm text-navy-900">
            <div className="flex justify-between"><span className="text-navy-600">Subtotal</span><span>{formatINR(subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between text-jungle-700 font-semibold"><span>Discount</span><span>−{formatINR(discount)}</span></div>}
            <div className="flex justify-between"><span className="text-navy-600">Shipping</span><span>{shippingCost === 0 ? 'Free' : formatINR(shippingCost)}</span></div>
          </div>
          <div className="border-t border-navy-200 my-4" />
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] tracking-[0.3em] uppercase text-navy-600">Total</span>
            <span className="font-serif text-3xl text-navy-900">{formatINR(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
