'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { api, formatINR } from '@/lib/api';
import { Package, ShoppingBag, Users, IndianRupee, Plus, Trash2, Edit, X, Star, Settings, FolderTree, Mail, Image as ImageIcon, Eye, Truck } from 'lucide-react';
import { toast } from 'sonner';

const emptyProduct = {
  slug: '', name: '', brand: 'VENTEBEAST', shortDescription: '', description: '',
  category: 'Eau de Parfum', collection: 'Signature', gender: 'Women', concentration: 'Eau de Parfum',
  topNotes: [], heartNotes: [], baseNotes: [],
  longevity: '10 hours', projection: 'Moderate', scentFamily: 'Woody Oriental',
  featured: false, bestseller: false, newArrival: false,
  rating: 0, reviewCount: 0,
  images: [''], gallery: [], videoUrl: '',
  variants: [{ size: '50ml', sku: '', price: 899, comparePrice: 2599, stock: 100 }],
  ingredients: '', howToUse: '',
};

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: IndianRupee },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'collections', label: 'Collections', icon: FolderTree },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'settings', label: 'Site Settings', icon: Settings },
];

const AdminPage = () => {
  const router = useRouter();
  const user = useStore(s => s.user);
  const loadingUser = useStore(s => s.loadingUser);
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [collections, setCollections] = useState([]);
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState(null);
  const [editing, setEditing] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [editingCol, setEditingCol] = useState(null);

  useEffect(() => {
    if (!loadingUser && (!user || user.role !== 'admin')) router.push('/');
  }, [user, loadingUser]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    if (tab === 'dashboard') api('admin/stats').then(d => { setStats(d.stats); setOrders(d.recentOrders); });
    if (tab === 'products') api('products?limit=500').then(d => setProducts(d.products));
    if (tab === 'orders') api('admin/orders').then(d => setOrders(d.orders));
    if (tab === 'reviews') api('admin/reviews').then(d => setReviews(d.reviews));
    if (tab === 'collections') api('collections').then(d => setCollections(d.collections));
    if (tab === 'customers') api('admin/users').then(d => setUsers(d.users));
    if (tab === 'settings') api('settings').then(d => setSettings(d.settings));
  }, [tab, user]);

  if (!user || user.role !== 'admin') return null;

  const saveProduct = async (p) => {
    try {
      if (p._id) {
        await api(`products/${p._id}`, { method: 'PUT', body: p }); toast.success('Updated');
      } else {
        await api('products', { method: 'POST', body: p }); toast.success('Created');
      }
      const d = await api('products?limit=500'); setProducts(d.products); setEditing(null);
    } catch (e) { toast.error(e.message); }
  };
  const deleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return;
    await api(`products/${id}`, { method: 'DELETE' });
    setProducts(p => p.filter(x => x._id !== id)); toast.success('Deleted');
  };
  const updateOrderStatus = async (id, status) => {
    await api(`admin/orders/${id}`, { method: 'PUT', body: { status } });
    const d = await api('admin/orders'); setOrders(d.orders); toast.success('Updated');
  };
  const delReview = async (id) => {
    if (!confirm('Delete review?')) return;
    await api(`admin/reviews/${id}`, { method: 'DELETE' });
    const d = await api('admin/reviews'); setReviews(d.reviews); toast.success('Deleted');
  };
  const saveCollection = async (c) => {
    try {
      if (c._id) await api(`admin/collections/${c._id}`, { method: 'PUT', body: c });
      else await api('admin/collections', { method: 'POST', body: c });
      const d = await api('collections'); setCollections(d.collections); setEditingCol(null); toast.success('Saved');
    } catch (e) { toast.error(e.message); }
  };
  const delCollection = async (id) => {
    if (!confirm('Delete collection?')) return;
    await api(`admin/collections/${id}`, { method: 'DELETE' });
    setCollections(cs => cs.filter(c => c._id !== id)); toast.success('Deleted');
  };
  const saveSettings = async () => {
    try {
      const { settings: s } = await api('admin/settings', { method: 'PUT', body: settings });
      setSettings(s);
      toast.success('Site settings updated — reload to see changes');
    } catch (e) { toast.error(e.message); }
  };
  const sendTestEmail = async () => {
    try {
      const { result } = await api('admin/test-email', { method: 'POST' });
      if (result.sent) toast.success('Test email sent');
      else toast.error(result.reason || result.error || 'Email skipped');
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-12 pt-12 pb-32">
      <div className="mb-8">
        <div className="text-[10px] tracking-[0.4em] uppercase text-gold-400 mb-2">Admin Console</div>
        <h1 className="font-display text-5xl">VENTEBEAST Atelier</h1>
      </div>

      <div className="flex gap-1 border-b border-white/10 mb-8 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-5 py-3 text-[11px] tracking-[0.25em] uppercase border-b-2 -mb-px flex items-center gap-2 whitespace-nowrap ${tab===t.id?'border-gold-400 text-gold-400':'border-transparent text-white/50 hover:text-white'}`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && stats && (
        <div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: IndianRupee, label: 'Revenue', value: formatINR(stats.revenue), color: 'text-emerald-400' },
              { icon: ShoppingBag, label: 'Orders', value: stats.orderCount, color: 'text-gold-400' },
              { icon: Package, label: 'Products', value: stats.productCount, color: 'text-navy-300' },
              { icon: Users, label: 'Customers', value: stats.userCount, color: 'text-jungle-400' },
            ].map(s => (
              <div key={s.label} className="border border-white/10 p-6 rounded">
                <s.icon className={`w-5 h-5 mb-3 ${s.color}`} />
                <div className="text-[10px] tracking-[0.3em] uppercase text-white/40">{s.label}</div>
                <div className="font-display text-4xl mt-2">{s.value}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex gap-3">
            <button onClick={sendTestEmail} className="bg-gold-500 text-black px-5 py-2 text-[10px] tracking-[0.3em] uppercase font-bold rounded inline-flex items-center gap-2"><Mail className="w-4 h-4" /> Send Test Order Email</button>
          </div>
          <h2 className="font-display text-2xl mt-12 mb-4">Recent Orders</h2>
          <div className="border border-white/10 rounded overflow-hidden">
            {orders.slice(0,10).map(o => (
              <div key={o._id} className="p-4 flex justify-between items-center border-b border-white/10 last:border-0 cursor-pointer hover:bg-white/5" onClick={() => setViewingOrder(o)}>
                <div>
                  <div className="text-sm">{o.orderNumber}</div>
                  <div className="text-xs text-white/50">{o.userEmail} · {new Date(o.createdAt).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{formatINR(o.total)}</div>
                  <div className="text-[10px] tracking-[0.25em] uppercase text-white/40">{o.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'products' && (
        <div>
          <div className="flex justify-between mb-6">
            <h2 className="font-display text-3xl">Products ({products.length})</h2>
            <button onClick={() => setEditing({ ...emptyProduct })} className="bg-gold-500 text-black px-6 py-3 text-[10px] tracking-[0.3em] uppercase font-bold rounded inline-flex items-center gap-2"><Plus className="w-4 h-4" /> New Product</button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {products.map(p => (
              <div key={p._id} className="border border-white/10 p-4 flex gap-4 rounded">
                <div className="w-20 h-24 bg-neutral-950 shrink-0 rounded overflow-hidden"><img src={p.images?.[0]} className="w-full h-full object-cover" /></div>
                <div className="flex-1">
                  <div className="font-display text-xl">{p.name}</div>
                  <div className="text-xs text-white/50">{p.gender} · {p.collection} · {p.scentFamily}</div>
                  <div className="text-xs mt-1">{formatINR(p.variants?.[0]?.price)} · Stock: {p.variants?.[0]?.stock}</div>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {p.featured && <span className="text-[9px] tracking-[0.2em] uppercase bg-gold-500/20 text-gold-400 px-2 rounded">Featured</span>}
                    {p.bestseller && <span className="text-[9px] tracking-[0.2em] uppercase bg-emerald-500/20 text-emerald-400 px-2 rounded">Bestseller</span>}
                    {p.newArrival && <span className="text-[9px] tracking-[0.2em] uppercase bg-rose-500/20 text-rose-400 px-2 rounded">New</span>}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => router.push(`/product/${p.slug}`)} className="text-white/60 hover:text-white" title="View"><Eye className="w-4 h-4" /></button>
                  <button onClick={() => setEditing(p)} className="text-white/60 hover:text-white" title="Edit"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => deleteProduct(p._id)} className="text-white/60 hover:text-red-400" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div>
          <h2 className="font-display text-3xl mb-6">All Orders ({orders.length})</h2>
          <div className="border border-white/10 rounded overflow-hidden">
            {orders.map(o => (
              <div key={o._id} className="p-4 border-b border-white/10 last:border-0 grid md:grid-cols-6 gap-4 items-center">
                <div>
                  <div className="text-sm font-bold">{o.orderNumber}</div>
                  <div className="text-xs text-white/50">{new Date(o.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="text-xs text-white/70">{o.userEmail}</div>
                <div className="text-xs">{o.items.length} item{o.items.length>1?'s':''}</div>
                <div className="font-bold">{formatINR(o.total)}</div>
                <select value={o.status} onChange={e => updateOrderStatus(o._id, e.target.value)} className="bg-transparent border border-white/20 px-2 py-1 text-xs rounded">
                  {['pending','confirmed','packed','shipped','delivered','cancelled'].map(s => <option key={s} value={s} className="bg-black">{s}</option>)}
                </select>
                <button onClick={() => setViewingOrder(o)} className="text-[10px] tracking-[0.25em] uppercase border border-gold-400 text-gold-400 px-3 py-1.5 rounded hover:bg-gold-400 hover:text-black inline-flex items-center gap-2"><Truck className="w-3 h-3" /> Ship Info</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'reviews' && (
        <div>
          <div className="flex justify-between mb-6">
            <h2 className="font-display text-3xl">Reviews ({reviews.length})</h2>
            <button onClick={() => setEditing({ __reviewMode: true, productId: '', userName: 'Verified Buyer', rating: 5, title: '', body: '' })} className="bg-gold-500 text-black px-5 py-2 text-[10px] tracking-[0.3em] uppercase font-bold rounded inline-flex items-center gap-2"><Plus className="w-3 h-3" /> Add Review</button>
          </div>
          <div className="space-y-4">
            {reviews.map(r => (
              <div key={r._id} className="border border-white/10 p-5 rounded flex gap-4">
                <div className="w-16 h-20 bg-neutral-950 shrink-0 rounded overflow-hidden">{r.product?.image && <img src={r.product.image} className="w-full h-full object-cover" />}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-display text-lg">{r.product?.name || r.productId}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex">{[1,2,3,4,5].map(i => <Star key={i} className={`w-3 h-3 ${i <= r.rating ? 'fill-gold-400 text-gold-400' : 'text-white/20'}`} />)}</div>
                        <span className="text-xs text-white/50">by {r.userName}</span>
                        {r.addedByAdmin && <span className="text-[9px] tracking-[0.2em] uppercase bg-gold-500/20 text-gold-400 px-2 rounded">Admin Added</span>}
                      </div>
                    </div>
                    <div className="text-[10px] tracking-[0.2em] uppercase text-white/40">{new Date(r.createdAt).toLocaleDateString()}</div>
                  </div>
                  <h4 className="font-bold mt-2">{r.title}</h4>
                  <p className="text-sm text-white/70 mt-1">{r.body}</p>
                </div>
                <button onClick={() => delReview(r._id)} className="text-white/40 hover:text-red-400 self-start"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'collections' && (
        <div>
          <div className="flex justify-between mb-6">
            <h2 className="font-display text-3xl">Collections ({collections.length})</h2>
            <button onClick={() => setEditingCol({ name: '', slug: '', description: '', order: collections.length + 1 })} className="bg-gold-500 text-black px-5 py-2 text-[10px] tracking-[0.3em] uppercase font-bold rounded inline-flex items-center gap-2"><Plus className="w-3 h-3" /> New Collection</button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {collections.map(c => (
              <div key={c._id} className="border border-white/10 p-5 rounded flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-display text-xl">{c.name}</div>
                  <div className="text-[10px] tracking-[0.25em] uppercase text-white/40 mt-1">{c.slug}</div>
                  <p className="text-sm text-white/60 mt-2">{c.description}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingCol(c)} className="text-white/60 hover:text-white"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => delCollection(c._id)} className="text-white/60 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'customers' && (
        <div>
          <h2 className="font-display text-3xl mb-6">Customers ({users.length})</h2>
          <div className="border border-white/10 rounded overflow-hidden">
            {users.map(u => (
              <div key={u._id} className="p-4 border-b border-white/10 last:border-0 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  {u.avatarUrl ? <img src={u.avatarUrl} className="w-9 h-9 rounded-full" /> : <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-xs">{u.name?.[0]?.toUpperCase()}</div>}
                  <div>
                    <div className="text-sm">{u.name}</div>
                    <div className="text-xs text-white/50">{u.email}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {u.provider === 'google' && <div className="text-[10px] tracking-[0.25em] uppercase bg-blue-500/20 text-blue-300 px-3 py-1 rounded">Google</div>}
                  <div className="text-[10px] tracking-[0.25em] uppercase bg-white/10 px-3 py-1 rounded">{u.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'settings' && settings && (
        <SettingsPanel settings={settings} setSettings={setSettings} onSave={saveSettings} onTestEmail={sendTestEmail} />
      )}

      {editing && (editing.__reviewMode
        ? <ReviewEditor review={editing} products={products} onClose={() => setEditing(null)} onSave={async (r) => { await api('admin/reviews', { method: 'POST', body: r }); const d = await api('admin/reviews'); setReviews(d.reviews); setEditing(null); toast.success('Review added'); }} />
        : <ProductEditor product={editing} collections={collections} onClose={() => setEditing(null)} onSave={saveProduct} />
      )}
      {editingCol && <CollectionEditor collection={editingCol} onClose={() => setEditingCol(null)} onSave={saveCollection} />}
      {viewingOrder && <OrderDetailModal order={viewingOrder} onClose={() => setViewingOrder(null)} onStatusChange={async (status) => { await updateOrderStatus(viewingOrder._id, status); setViewingOrder({ ...viewingOrder, status }); }} />}
    </div>
  );
};

const SettingsPanel = ({ settings, setSettings, onSave, onTestEmail }) => {
  const set = (k, v) => setSettings(s => ({ ...s, [k]: v }));
  return (
    <div className="max-w-3xl space-y-6">
      <h2 className="font-display text-3xl mb-2">Site Settings</h2>
      <p className="text-white/60 text-sm">Changes apply site-wide after refresh.</p>

      <div className="border border-white/10 p-6 rounded space-y-4">
        <h3 className="font-display text-xl">Theme</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'dark', label: 'Dark Luxury', desc: 'Black + Gold + Jungle accents', preview: 'bg-gradient-to-br from-black to-navy-950 border-gold-400' },
            { id: 'navy', label: 'Navy Ocean (Logo)', desc: 'Logo colors — navy + silver', preview: 'bg-gradient-to-br from-navy-900 to-ocean-700 border-navy-300' },
          ].map(t => (
            <button key={t.id} onClick={() => set('theme', t.id)} className={`p-4 border-2 rounded text-left ${settings.theme === t.id ? t.preview : 'border-white/20 hover:border-white/40'}`}>
              <div className="font-bold">{t.label}</div>
              <div className="text-xs text-white/60 mt-1">{t.desc}</div>
              {settings.theme === t.id && <div className="text-[10px] tracking-[0.25em] uppercase mt-2 text-gold-400">✓ Active</div>}
            </button>
          ))}
        </div>
      </div>

      <div className="border border-white/10 p-6 rounded space-y-4">
        <h3 className="font-display text-xl">Brand</h3>
        <div>
          <label className="text-[10px] tracking-[0.3em] uppercase text-white/50">Logo Image URL</label>
          <div className="flex gap-3 items-center">
            <input value={settings.logoUrl || ''} onChange={e => set('logoUrl', e.target.value)} className="flex-1 bg-transparent border-b border-white/20 py-2 outline-none" />
            {settings.logoUrl && <img src={settings.logoUrl} className="h-14 w-14 object-contain rounded bg-white/5" />}
          </div>
        </div>
        <div>
          <label className="text-[10px] tracking-[0.3em] uppercase text-white/50">Site Name</label>
          <input value={settings.siteName || ''} onChange={e => set('siteName', e.target.value)} className="w-full bg-transparent border-b border-white/20 py-2 outline-none" />
        </div>
        <div>
          <label className="text-[10px] tracking-[0.3em] uppercase text-white/50">Tagline</label>
          <input value={settings.tagline || ''} onChange={e => set('tagline', e.target.value)} className="w-full bg-transparent border-b border-white/20 py-2 outline-none" />
        </div>
        <div>
          <label className="text-[10px] tracking-[0.3em] uppercase text-white/50">Top Promo Banner</label>
          <input value={settings.promoBanner || ''} onChange={e => set('promoBanner', e.target.value)} className="w-full bg-transparent border-b border-white/20 py-2 outline-none" />
        </div>
      </div>

      <div className="border border-white/10 p-6 rounded space-y-3">
        <h3 className="font-display text-xl">Email Notifications</h3>
        <p className="text-white/60 text-sm">Set <code className="bg-white/10 px-1 rounded">RESEND_API_KEY</code> in /app/.env to enable admin order notifications.</p>
        <button onClick={onTestEmail} className="bg-gold-500 text-black px-5 py-2 text-[10px] tracking-[0.3em] uppercase font-bold rounded inline-flex items-center gap-2"><Mail className="w-3 h-3" /> Send Test Order Email</button>
      </div>

      <button onClick={onSave} className="w-full bg-jungle-500 text-black py-4 text-[11px] tracking-[0.3em] uppercase font-bold rounded">Save Settings</button>
    </div>
  );
};

const OrderDetailModal = ({ order, onClose, onStatusChange }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto p-6" onClick={onClose}>
      <div className="max-w-3xl mx-auto bg-black border border-white/10 p-8 rounded" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="text-[10px] tracking-[0.4em] uppercase text-gold-400">Order Detail · Ship Manually</div>
            <h2 className="font-display text-4xl mt-1">{order.orderNumber}</h2>
          </div>
          <button onClick={onClose}><X className="w-6 h-6" /></button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="border border-white/10 p-5 rounded">
            <div className="text-[10px] tracking-[0.3em] uppercase text-gold-400 mb-3">Ship To</div>
            <div className="font-bold text-lg">{order.address.name}</div>
            <div className="text-white/70 mt-1 leading-relaxed">
              {order.address.line1}{order.address.line2 && <>, {order.address.line2}</>}<br/>
              {order.address.city}, {order.address.state} {order.address.pincode}<br/>
              {order.address.country || 'India'}
            </div>
            <div className="text-gold-400 mt-2">📞 {order.address.phone}</div>
            <div className="text-white/50 text-sm">{order.userEmail}</div>
          </div>
          <div className="border border-white/10 p-5 rounded">
            <div className="text-[10px] tracking-[0.3em] uppercase text-gold-400 mb-3">Status</div>
            <select value={order.status} onChange={e => onStatusChange(e.target.value)} className="w-full bg-transparent border border-white/20 px-3 py-2 rounded">
              {['pending','confirmed','packed','shipped','delivered','cancelled'].map(s => <option key={s} value={s} className="bg-black">{s}</option>)}
            </select>
            <div className="mt-4 text-[10px] tracking-[0.3em] uppercase text-gold-400 mb-1">Payment</div>
            <div className="text-white/80">Cash on Delivery · Collect {formatINR(order.total)}</div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-gold-400 mt-3 mb-1">Ordered</div>
            <div className="text-white/80 text-sm">{new Date(order.createdAt).toLocaleString()}</div>
          </div>
        </div>

        <div className="border border-white/10 p-5 rounded">
          <div className="text-[10px] tracking-[0.3em] uppercase text-gold-400 mb-3">Items to Pack</div>
          <div className="divide-y divide-white/10">
            {order.items.map((it, i) => (
              <div key={i} className="py-3 flex gap-3 items-center">
                <div className="w-14 h-14 bg-neutral-950 rounded overflow-hidden"><img src={it.image} className="w-full h-full object-cover" /></div>
                <div className="flex-1">
                  <div className="font-bold">{it.name}</div>
                  <div className="text-xs text-white/60">SKU: {it.sku} · {it.size} · Qty {it.qty}</div>
                </div>
                <div>{formatINR(it.total)}</div>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 mt-4 pt-4 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-white/60">Subtotal</span><span>{formatINR(order.subtotal)}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-emerald-400"><span>Discount ({order.couponCode})</span><span>−{formatINR(order.discount)}</span></div>}
            <div className="flex justify-between"><span className="text-white/60">Shipping</span><span>{order.shipping ? formatINR(order.shipping) : 'Free'}</span></div>
            <div className="flex justify-between text-xl font-bold pt-2 border-t border-white/10 mt-2"><span>Total (Collect)</span><span className="text-gold-400">{formatINR(order.total)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CollectionEditor = ({ collection, onClose, onSave }) => {
  const [c, setC] = useState(collection);
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto p-6" onClick={onClose}>
      <div className="max-w-lg mx-auto bg-black border border-white/10 p-8 rounded" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display text-2xl">{c._id ? 'Edit' : 'New'} Collection</h2>
          <button onClick={onClose}><X className="w-6 h-6" /></button>
        </div>
        <div className="space-y-4">
          {[['name','Name'],['slug','Slug'],['description','Description'],['order','Order']].map(([k,l]) => (
            <div key={k}>
              <label className="text-[10px] tracking-[0.25em] uppercase text-white/50">{l}</label>
              <input value={c[k] ?? ''} onChange={e => setC({ ...c, [k]: k === 'order' ? parseInt(e.target.value) || 0 : e.target.value })} className="w-full bg-transparent border-b border-white/20 py-2 outline-none" />
            </div>
          ))}
        </div>
        <button onClick={() => onSave(c)} className="mt-6 w-full bg-gold-500 text-black py-3 text-[10px] tracking-[0.3em] uppercase font-bold rounded">Save</button>
      </div>
    </div>
  );
};

const ReviewEditor = ({ review, products, onClose, onSave }) => {
  const [r, setR] = useState(review);
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto p-6" onClick={onClose}>
      <div className="max-w-lg mx-auto bg-black border border-white/10 p-8 rounded" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display text-2xl">Add Customer Review</h2>
          <button onClick={onClose}><X className="w-6 h-6" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] tracking-[0.25em] uppercase text-white/50">Product</label>
            <select value={r.productId} onChange={e => setR({ ...r, productId: e.target.value })} className="w-full bg-transparent border-b border-white/20 py-2 outline-none">
              <option value="" className="bg-black">— Select —</option>
              {products.map(p => <option key={p._id} value={p._id} className="bg-black">{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] tracking-[0.25em] uppercase text-white/50">Customer Name</label>
            <input value={r.userName} onChange={e => setR({ ...r, userName: e.target.value })} className="w-full bg-transparent border-b border-white/20 py-2 outline-none" />
          </div>
          <div>
            <label className="text-[10px] tracking-[0.25em] uppercase text-white/50">Rating</label>
            <div className="flex gap-1 mt-1">{[1,2,3,4,5].map(i => <button key={i} onClick={() => setR({ ...r, rating: i })}><Star className={`w-6 h-6 ${i <= r.rating ? 'fill-gold-400 text-gold-400' : 'text-white/30'}`} /></button>)}</div>
          </div>
          <div>
            <label className="text-[10px] tracking-[0.25em] uppercase text-white/50">Title</label>
            <input value={r.title} onChange={e => setR({ ...r, title: e.target.value })} className="w-full bg-transparent border-b border-white/20 py-2 outline-none" />
          </div>
          <div>
            <label className="text-[10px] tracking-[0.25em] uppercase text-white/50">Review</label>
            <textarea value={r.body} onChange={e => setR({ ...r, body: e.target.value })} rows={4} className="w-full bg-transparent border border-white/20 p-2 rounded mt-1" />
          </div>
        </div>
        <button onClick={() => { if (!r.productId) return toast.error('Pick a product'); onSave({ productId: r.productId, userName: r.userName, rating: r.rating, title: r.title, body: r.body }); }} className="mt-6 w-full bg-gold-500 text-black py-3 text-[10px] tracking-[0.3em] uppercase font-bold rounded">Post Review</button>
      </div>
    </div>
  );
};

const ProductEditor = ({ product, collections, onClose, onSave }) => {
  const [p, setP] = useState(product);
  const set = (k, v) => setP(x => ({ ...x, [k]: v }));
  const setVariant = (i, k, v) => setP(x => ({ ...x, variants: x.variants.map((va,idx) => idx===i?{...va,[k]:v}:va) }));
  const setNotesArr = (k, v) => setP(x => ({ ...x, [k]: v.split(',').map(s => s.trim()).filter(Boolean) }));
  const updateGalleryUrl = (i, url) => {
    setP(x => {
      const g = [...(x.gallery || [])];
      g[i] = url;
      return { ...x, gallery: g.filter(Boolean) };
    });
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto p-6" onClick={onClose}>
      <div className="max-w-4xl mx-auto bg-black border border-white/10 p-8 rounded" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display text-3xl">{p._id ? 'Edit Product' : 'New Product'}</h2>
          <button onClick={onClose}><X className="w-6 h-6" /></button>
        </div>

        <div className="space-y-6">
          {/* Basics */}
          <section>
            <div className="text-[10px] tracking-[0.3em] uppercase text-gold-400 mb-3">Basics</div>
            <div className="grid grid-cols-2 gap-4">
              {[['name','Name *',2],['slug','Slug (auto-generates url) *',1],['brand','Brand',1]].map(([k,l,span]) => (
                <div key={k} className={span===2?'col-span-2':''}><label className="text-[10px] tracking-[0.25em] uppercase text-white/50">{l}</label><input value={p[k]||''} onChange={e => set(k, e.target.value)} className="w-full bg-transparent border-b border-white/20 py-2 outline-none focus:border-white" /></div>
              ))}
              <div>
                <label className="text-[10px] tracking-[0.25em] uppercase text-white/50">Gender *</label>
                <select value={p.gender} onChange={e => set('gender', e.target.value)} className="w-full bg-transparent border-b border-white/20 py-2 outline-none">
                  {['Women','Men','Unisex'].map(g => <option key={g} value={g} className="bg-black">{g}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] tracking-[0.25em] uppercase text-white/50">Collection</label>
                <select value={p.collection} onChange={e => set('collection', e.target.value)} className="w-full bg-transparent border-b border-white/20 py-2 outline-none">
                  {(collections || []).map(c => <option key={c._id} value={c.name} className="bg-black">{c.name}</option>)}
                </select>
              </div>
              {[['scentFamily','Scent Family'],['concentration','Concentration'],['longevity','Longevity'],['projection','Projection']].map(([k,l]) => (
                <div key={k}><label className="text-[10px] tracking-[0.25em] uppercase text-white/50">{l}</label><input value={p[k]||''} onChange={e => set(k, e.target.value)} className="w-full bg-transparent border-b border-white/20 py-2 outline-none" /></div>
              ))}
              <div className="col-span-2">
                <label className="text-[10px] tracking-[0.25em] uppercase text-white/50">Short Description (tagline)</label>
                <input value={p.shortDescription||''} onChange={e => set('shortDescription', e.target.value)} className="w-full bg-transparent border-b border-white/20 py-2 outline-none" />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] tracking-[0.25em] uppercase text-white/50">Full Description</label>
                <textarea value={p.description||''} onChange={e => set('description', e.target.value)} rows={4} className="w-full bg-transparent border border-white/20 p-2 mt-1 rounded" />
              </div>
            </div>
          </section>

          {/* Media */}
          <section>
            <div className="text-[10px] tracking-[0.3em] uppercase text-gold-400 mb-3 flex items-center gap-2"><ImageIcon className="w-3 h-3" /> Media</div>
            <div>
              <label className="text-[10px] tracking-[0.25em] uppercase text-white/50">Main Image URL *</label>
              <div className="flex gap-3 items-start">
                <input value={p.images?.[0]||''} onChange={e => set('images', [e.target.value])} className="flex-1 bg-transparent border-b border-white/20 py-2 outline-none" placeholder="https://..." />
                {p.images?.[0] && <img src={p.images[0]} className="w-16 h-20 object-cover rounded border border-white/10" />}
              </div>
            </div>
            <div className="mt-4">
              <label className="text-[10px] tracking-[0.25em] uppercase text-white/50">Gallery Image URLs (one per box, up to 6)</label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {[0,1,2,3,4,5].map(i => (
                  <div key={i} className="space-y-1">
                    <input value={p.gallery?.[i] || ''} onChange={e => updateGalleryUrl(i, e.target.value)} placeholder={`Image ${i+1}`} className="w-full bg-transparent border border-white/15 px-2 py-1 text-xs rounded" />
                    {p.gallery?.[i] && <img src={p.gallery[i]} className="w-full aspect-square object-cover rounded border border-white/10" />}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <label className="text-[10px] tracking-[0.25em] uppercase text-white/50">Product Video URL (YouTube / mp4)</label>
              <input value={p.videoUrl||''} onChange={e => set('videoUrl', e.target.value)} className="w-full bg-transparent border-b border-white/20 py-2 outline-none" placeholder="https://youtube.com/..." />
            </div>
          </section>

          {/* Notes */}
          <section>
            <div className="text-[10px] tracking-[0.3em] uppercase text-gold-400 mb-3">Olfactive Pyramid</div>
            {[['topNotes','Top Notes'],['heartNotes','Heart Notes'],['baseNotes','Base Notes']].map(([k,l]) => (
              <div key={k} className="mt-3">
                <label className="text-[10px] tracking-[0.25em] uppercase text-white/50">{l} (comma separated)</label>
                <input value={(p[k]||[]).join(', ')} onChange={e => setNotesArr(k, e.target.value)} className="w-full bg-transparent border-b border-white/20 py-2 outline-none" />
              </div>
            ))}
          </section>

          {/* Variants */}
          <section>
            <div className="text-[10px] tracking-[0.3em] uppercase text-gold-400 mb-3">Pricing & Stock</div>
            <div className="space-y-3">
              {p.variants.map((v, i) => (
                <div key={i} className="grid grid-cols-5 gap-3 items-end p-3 border border-white/10 rounded">
                  <div><label className="text-[9px] tracking-[0.2em] uppercase text-white/50">Size</label><input value={v.size} onChange={e => setVariant(i,'size',e.target.value)} className="w-full bg-transparent border-b border-white/20 py-1 text-sm" /></div>
                  <div><label className="text-[9px] tracking-[0.2em] uppercase text-white/50">SKU</label><input value={v.sku} onChange={e => setVariant(i,'sku',e.target.value)} className="w-full bg-transparent border-b border-white/20 py-1 text-sm" /></div>
                  <div><label className="text-[9px] tracking-[0.2em] uppercase text-white/50">Price ₹</label><input type="number" value={v.price} onChange={e => setVariant(i,'price',parseInt(e.target.value)||0)} className="w-full bg-transparent border-b border-white/20 py-1 text-sm" /></div>
                  <div><label className="text-[9px] tracking-[0.2em] uppercase text-white/50">MRP ₹</label><input type="number" value={v.comparePrice} onChange={e => setVariant(i,'comparePrice',parseInt(e.target.value)||0)} className="w-full bg-transparent border-b border-white/20 py-1 text-sm" /></div>
                  <div><label className="text-[9px] tracking-[0.2em] uppercase text-white/50">Stock</label><input type="number" value={v.stock} onChange={e => setVariant(i,'stock',parseInt(e.target.value)||0)} className="w-full bg-transparent border-b border-white/20 py-1 text-sm" /></div>
                </div>
              ))}
              <button onClick={() => setP(x => ({ ...x, variants: [...x.variants, { size: '', sku: '', price: 0, comparePrice: 0, stock: 0 }] }))} className="text-[10px] tracking-[0.25em] uppercase text-gold-400 hover:text-white">+ Add Variant</button>
            </div>
          </section>

          {/* Flags */}
          <section className="flex gap-6 flex-wrap">
            {[['featured','Featured'],['bestseller','Bestseller'],['newArrival','New Arrival']].map(([k,l]) => (
              <label key={k} className="text-[10px] tracking-[0.25em] uppercase flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={p[k]||false} onChange={e => set(k, e.target.checked)} /> {l}
              </label>
            ))}
          </section>
        </div>

        <div className="flex gap-3 mt-8 pt-6 border-t border-white/10">
          <button onClick={() => onSave(p)} className="bg-gold-500 text-black px-8 py-3 text-[10px] tracking-[0.3em] uppercase font-bold rounded">Save Product</button>
          <button onClick={onClose} className="border border-white/30 px-8 py-3 text-[10px] tracking-[0.3em] uppercase rounded hover:bg-white/10">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
