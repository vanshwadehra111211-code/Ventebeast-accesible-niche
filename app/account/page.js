'use client';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { api, formatINR } from '@/lib/api';
import { Package, MapPin, Heart, Settings, LogOut, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

function AccountInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const user = useStore(s => s.user);
  const logout = useStore(s => s.logout);
  const loadingUser = useStore(s => s.loadingUser);
  const [tab, setTab] = useState(sp.get('tab') || 'orders');
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [newAddr, setNewAddr] = useState({ name: '', phone: '', line1: '', city: '', state: '', pincode: '' });

  useEffect(() => {
    if (!loadingUser && !user) router.push('/login');
  }, [user, loadingUser]);

  useEffect(() => {
    if (!user) return;
    if (tab === 'orders') api('orders').then(d => setOrders(d.orders || []));
    if (tab === 'wishlist') api('wishlist').then(d => setWishlist(d.items || []));
    if (tab === 'addresses') api('addresses').then(d => setAddresses(d.addresses || []));
  }, [tab, user]);

  if (!user) return null;

  const saveAddr = async (e) => {
    e.preventDefault();
    try {
      await api('addresses', { method: 'POST', body: newAddr });
      toast.success('Address saved');
      const d = await api('addresses'); setAddresses(d.addresses);
      setNewAddr({ name: '', phone: '', line1: '', city: '', state: '', pincode: '' });
    } catch (e) { toast.error(e.message); }
  };

  const tabs = [
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'wishlist', label: 'Wishlist', icon: Heart },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pt-12 pb-32">
      <div className="mb-12">
        <div className="text-[10px] tracking-[0.4em] uppercase text-white/40 mb-3">Account</div>
        <h1 className="font-serif text-5xl">Hello, {user.name}</h1>
        {user.role === 'admin' && <Link href="/admin" className="inline-block mt-4 text-[10px] tracking-[0.3em] uppercase border border-white/30 px-4 py-2 hover:bg-white hover:text-black">Open Admin Console</Link>}
      </div>

      <div className="grid lg:grid-cols-4 gap-12">
        <aside className="space-y-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`w-full text-left px-4 py-3 flex items-center gap-3 text-[11px] tracking-[0.25em] uppercase ${tab === t.id ? 'bg-white text-black' : 'hover:bg-white/5'}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
          <button onClick={() => { logout(); router.push('/'); }} className="w-full text-left px-4 py-3 flex items-center gap-3 text-[11px] tracking-[0.25em] uppercase hover:bg-white/5 text-white/60"><LogOut className="w-4 h-4" /> Sign Out</button>
        </aside>

        <div className="lg:col-span-3">
          {tab === 'orders' && (
            <div>
              <h2 className="font-serif text-3xl mb-6">Order History</h2>
              {orders.length === 0 ? <div className="text-white/40 py-16 text-center border border-white/10">No orders yet.</div> :
                <div className="space-y-4">
                  {orders.map(o => (
                    <Link key={o._id} href={`/order/${o._id}`} className="block border border-white/10 p-6 hover:border-white/30">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-[10px] tracking-[0.3em] uppercase text-white/40">{o.orderNumber}</div>
                          <div className="font-serif text-2xl mt-1">{o.items.length} item{o.items.length>1?'s':''}</div>
                          <div className="text-xs text-white/50 mt-2">{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-serif text-2xl">{formatINR(o.total)}</div>
                          <div className="text-[10px] tracking-[0.25em] uppercase mt-2 px-2 py-1 inline-block bg-white/10">{o.status}</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              }
            </div>
          )}
          {tab === 'wishlist' && (
            <div>
              <h2 className="font-serif text-3xl mb-6">Saved Fragrances</h2>
              {wishlist.length === 0 ? <div className="text-white/40 py-16 text-center border border-white/10">Nothing saved yet.</div> :
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishlist.map(p => (
                    <Link key={p._id} href={`/product/${p.slug}`} className="block group">
                      <div className="aspect-square bg-neutral-950 overflow-hidden"><img src={p.images?.[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /></div>
                      <div className="mt-3">
                        <div className="font-serif text-lg">{p.name}</div>
                        <div className="text-xs text-white/50">{formatINR(p.variants?.[0]?.price)}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              }
            </div>
          )}
          {tab === 'addresses' && (
            <div>
              <h2 className="font-serif text-3xl mb-6">Addresses</h2>
              <div className="space-y-4 mb-8">
                {addresses.map(a => (
                  <div key={a.id} className="border border-white/10 p-5 flex justify-between">
                    <div>
                      <div className="font-medium">{a.name}</div>
                      <div className="text-sm text-white/60">{a.line1}{a.line2 && `, ${a.line2}`}, {a.city}, {a.state} {a.pincode}</div>
                      <div className="text-xs text-white/40 mt-1">{a.phone}</div>
                    </div>
                    <button onClick={async () => { await api(`addresses/${a.id}`, { method: 'DELETE' }); const d = await api('addresses'); setAddresses(d.addresses); }} className="text-[10px] tracking-[0.25em] uppercase text-white/40 hover:text-white">Remove</button>
                  </div>
                ))}
              </div>
              <form onSubmit={saveAddr} className="border border-white/10 p-6">
                <h3 className="font-serif text-2xl mb-4">Add New Address</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[['name','Name'],['phone','Phone'],['line1','Address',2],['city','City'],['state','State'],['pincode','Pincode']].map(([k,l,span]) => (
                    <div key={k} className={span===2?'col-span-2':''}>
                      <label className="text-[10px] tracking-[0.25em] uppercase text-white/50">{l}</label>
                      <input required value={newAddr[k]} onChange={e => setNewAddr(a => ({ ...a, [k]: e.target.value }))} className="w-full bg-transparent border-b border-white/20 py-2 outline-none focus:border-white" />
                    </div>
                  ))}
                </div>
                <button className="mt-6 bg-white text-black px-8 py-3 text-[10px] tracking-[0.3em] uppercase">Save Address</button>
              </form>
            </div>
          )}
          {tab === 'settings' && (
            <div>
              <h2 className="font-serif text-3xl mb-6">Account Settings</h2>
              <div className="border border-white/10 p-6 space-y-3">
                <div><span className="text-white/40 text-xs uppercase tracking-wider">Email</span><div>{user.email}</div></div>
                <div><span className="text-white/40 text-xs uppercase tracking-wider">Role</span><div className="capitalize">{user.role}</div></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() { return <Suspense fallback={null}><AccountInner /></Suspense>; }
