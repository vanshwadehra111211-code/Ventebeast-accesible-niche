'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { api, formatINR } from '@/lib/api';
import { Package, ShoppingBag, Users, IndianRupee, Plus, Trash2, Edit, X } from 'lucide-react';
import { toast } from 'sonner';

const emptyProduct = {
  slug: '', name: '', brand: 'VENTEBEAST', shortDescription: '', description: '',
  category: 'Eau de Parfum', collection: 'Signature', gender: 'Unisex', concentration: 'Eau de Parfum',
  topNotes: [], heartNotes: [], baseNotes: [],
  longevity: '8 hours', projection: 'Moderate', scentFamily: 'Woody Oriental',
  featured: false, bestseller: false, newArrival: false,
  rating: 0, reviewCount: 0,
  images: [''],
  variants: [{ size: '30ml', sku: '', price: 0, comparePrice: 0, stock: 0 }],
};

const AdminPage = () => {
  const router = useRouter();
  const user = useStore(s => s.user);
  const loadingUser = useStore(s => s.loadingUser);
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    if (!loadingUser && (!user || user.role !== 'admin')) router.push('/');
  }, [user, loadingUser]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    if (tab === 'dashboard') api('admin/stats').then(d => { setStats(d.stats); setOrders(d.recentOrders); });
    if (tab === 'products') api('products?limit=200').then(d => setProducts(d.products));
    if (tab === 'orders') api('admin/orders').then(d => setOrders(d.orders));
    if (tab === 'users') api('admin/users').then(d => setUsers(d.users));
  }, [tab, user]);

  if (!user || user.role !== 'admin') return null;

  const saveProduct = async (p) => {
    try {
      if (p._id) {
        await api(`products/${p._id}`, { method: 'PUT', body: p });
        toast.success('Product updated');
      } else {
        await api('products', { method: 'POST', body: p });
        toast.success('Product created');
      }
      const d = await api('products?limit=200'); setProducts(d.products);
      setEditing(null);
    } catch (e) { toast.error(e.message); }
  };
  const deleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return;
    await api(`products/${id}`, { method: 'DELETE' });
    setProducts(p => p.filter(x => x._id !== id));
    toast.success('Deleted');
  };
  const updateOrderStatus = async (id, status) => {
    await api(`admin/orders/${id}`, { method: 'PUT', body: { status } });
    const d = await api('admin/orders'); setOrders(d.orders);
    toast.success('Updated');
  };

  return (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-12 pt-12 pb-32">
      <div className="mb-8">
        <div className="text-[10px] tracking-[0.4em] uppercase text-white/40 mb-2">Admin Console</div>
        <h1 className="font-serif text-5xl">VENTEBEAST Atelier</h1>
      </div>

      <div className="flex gap-2 border-b border-white/10 mb-8 overflow-x-auto">
        {['dashboard','products','orders','users'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-6 py-3 text-[11px] tracking-[0.3em] uppercase border-b-2 -mb-px ${tab===t?'border-white':'border-transparent text-white/50 hover:text-white'}`}>{t}</button>
        ))}
      </div>

      {tab === 'dashboard' && stats && (
        <div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: IndianRupee, label: 'Revenue', value: formatINR(stats.revenue) },
              { icon: ShoppingBag, label: 'Orders', value: stats.orderCount },
              { icon: Package, label: 'Products', value: stats.productCount },
              { icon: Users, label: 'Customers', value: stats.userCount },
            ].map(s => (
              <div key={s.label} className="border border-white/10 p-6">
                <s.icon className="w-5 h-5 text-white/40 mb-3" />
                <div className="text-[10px] tracking-[0.3em] uppercase text-white/40">{s.label}</div>
                <div className="font-serif text-4xl mt-2">{s.value}</div>
              </div>
            ))}
          </div>
          <h2 className="font-serif text-2xl mt-12 mb-4">Recent Orders</h2>
          <div className="border border-white/10">
            {orders.slice(0,10).map(o => (
              <div key={o._id} className="p-4 flex justify-between items-center border-b border-white/10 last:border-0">
                <div>
                  <div className="text-sm">{o.orderNumber}</div>
                  <div className="text-xs text-white/50">{o.userEmail} · {new Date(o.createdAt).toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div>{formatINR(o.total)}</div>
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
            <h2 className="font-serif text-3xl">Products ({products.length})</h2>
            <button onClick={() => setEditing({ ...emptyProduct })} className="bg-white text-black px-6 py-3 text-[10px] tracking-[0.3em] uppercase inline-flex items-center gap-2"><Plus className="w-4 h-4" /> New Product</button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {products.map(p => (
              <div key={p._id} className="border border-white/10 p-4 flex gap-4">
                <div className="w-20 h-24 bg-neutral-950 shrink-0"><img src={p.images?.[0]} className="w-full h-full object-cover" /></div>
                <div className="flex-1">
                  <div className="font-serif text-xl">{p.name}</div>
                  <div className="text-xs text-white/50">{p.collection} · {p.scentFamily}</div>
                  <div className="text-xs mt-1">{formatINR(p.variants?.[0]?.price)}</div>
                  <div className="flex gap-2 mt-2">
                    {p.featured && <span className="text-[9px] tracking-[0.2em] uppercase bg-white/10 px-2">Featured</span>}
                    {p.bestseller && <span className="text-[9px] tracking-[0.2em] uppercase bg-white/10 px-2">Bestseller</span>}
                    {p.newArrival && <span className="text-[9px] tracking-[0.2em] uppercase bg-white/10 px-2">New</span>}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => setEditing(p)} className="text-white/60 hover:text-white"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => deleteProduct(p._id)} className="text-white/60 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div>
          <h2 className="font-serif text-3xl mb-6">All Orders</h2>
          <div className="border border-white/10">
            {orders.map(o => (
              <div key={o._id} className="p-4 border-b border-white/10 last:border-0 grid md:grid-cols-5 gap-4 items-center">
                <div>
                  <div className="text-sm">{o.orderNumber}</div>
                  <div className="text-xs text-white/50">{new Date(o.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="text-xs text-white/60">{o.userEmail}</div>
                <div className="text-xs">{o.items.length} item{o.items.length>1?'s':''}</div>
                <div>{formatINR(o.total)}</div>
                <select value={o.status} onChange={e => updateOrderStatus(o._id, e.target.value)} className="bg-transparent border border-white/20 px-2 py-1 text-xs">
                  {['pending','confirmed','shipped','delivered','cancelled'].map(s => <option key={s} value={s} className="bg-black">{s}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div>
          <h2 className="font-serif text-3xl mb-6">Customers ({users.length})</h2>
          <div className="border border-white/10">
            {users.map(u => (
              <div key={u._id} className="p-4 border-b border-white/10 last:border-0 flex justify-between items-center">
                <div>
                  <div className="text-sm">{u.name}</div>
                  <div className="text-xs text-white/50">{u.email}</div>
                </div>
                <div className="text-[10px] tracking-[0.25em] uppercase bg-white/10 px-3 py-1">{u.role}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {editing && <ProductEditor product={editing} onClose={() => setEditing(null)} onSave={saveProduct} />}
    </div>
  );
};

const ProductEditor = ({ product, onClose, onSave }) => {
  const [p, setP] = useState(product);
  const set = (k, v) => setP(x => ({ ...x, [k]: v }));
  const setVariant = (i, k, v) => setP(x => ({ ...x, variants: x.variants.map((va,idx) => idx===i?{...va,[k]:v}:va) }));
  const setNotesArr = (k, v) => setP(x => ({ ...x, [k]: v.split(',').map(s => s.trim()).filter(Boolean) }));
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto p-6" onClick={onClose}>
      <div className="max-w-3xl mx-auto bg-black border border-white/10 p-8" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-serif text-3xl">{p._id ? 'Edit Product' : 'New Product'}</h2>
          <button onClick={onClose}><X className="w-6 h-6" /></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[['name','Name'],['slug','Slug'],['brand','Brand'],['collection','Collection'],['scentFamily','Scent Family'],['gender','Gender'],['concentration','Concentration'],['longevity','Longevity'],['projection','Projection']].map(([k,l]) => (
            <div key={k}><label className="text-[10px] tracking-[0.25em] uppercase text-white/50">{l}</label><input value={p[k]||''} onChange={e => set(k, e.target.value)} className="w-full bg-transparent border-b border-white/20 py-2" /></div>
          ))}
          <div className="col-span-2"><label className="text-[10px] tracking-[0.25em] uppercase text-white/50">Short Description</label><input value={p.shortDescription||''} onChange={e => set('shortDescription', e.target.value)} className="w-full bg-transparent border-b border-white/20 py-2" /></div>
          <div className="col-span-2"><label className="text-[10px] tracking-[0.25em] uppercase text-white/50">Full Description</label><textarea value={p.description||''} onChange={e => set('description', e.target.value)} rows={3} className="w-full bg-transparent border border-white/20 p-2" /></div>
          <div className="col-span-2"><label className="text-[10px] tracking-[0.25em] uppercase text-white/50">Image URL</label><input value={p.images?.[0]||''} onChange={e => set('images', [e.target.value])} className="w-full bg-transparent border-b border-white/20 py-2" /></div>
          {[['topNotes','Top Notes'],['heartNotes','Heart Notes'],['baseNotes','Base Notes']].map(([k,l]) => (
            <div key={k} className="col-span-2"><label className="text-[10px] tracking-[0.25em] uppercase text-white/50">{l} (comma separated)</label><input value={(p[k]||[]).join(', ')} onChange={e => setNotesArr(k, e.target.value)} className="w-full bg-transparent border-b border-white/20 py-2" /></div>
          ))}
        </div>
        <div className="mt-6 flex gap-4">
          {['featured','bestseller','newArrival'].map(k => (
            <label key={k} className="text-[10px] tracking-[0.25em] uppercase flex items-center gap-2"><input type="checkbox" checked={p[k]||false} onChange={e => set(k, e.target.checked)} /> {k}</label>
          ))}
        </div>
        <h3 className="font-serif text-2xl mt-8 mb-3">Variants</h3>
        <div className="space-y-3">
          {p.variants.map((v, i) => (
            <div key={i} className="grid grid-cols-5 gap-3 items-end">
              <div><label className="text-[9px] tracking-[0.2em] uppercase text-white/50">Size</label><input value={v.size} onChange={e => setVariant(i,'size',e.target.value)} className="w-full bg-transparent border-b border-white/20 py-1 text-sm" /></div>
              <div><label className="text-[9px] tracking-[0.2em] uppercase text-white/50">SKU</label><input value={v.sku} onChange={e => setVariant(i,'sku',e.target.value)} className="w-full bg-transparent border-b border-white/20 py-1 text-sm" /></div>
              <div><label className="text-[9px] tracking-[0.2em] uppercase text-white/50">Price</label><input type="number" value={v.price} onChange={e => setVariant(i,'price',parseInt(e.target.value)||0)} className="w-full bg-transparent border-b border-white/20 py-1 text-sm" /></div>
              <div><label className="text-[9px] tracking-[0.2em] uppercase text-white/50">MRP</label><input type="number" value={v.comparePrice} onChange={e => setVariant(i,'comparePrice',parseInt(e.target.value)||0)} className="w-full bg-transparent border-b border-white/20 py-1 text-sm" /></div>
              <div><label className="text-[9px] tracking-[0.2em] uppercase text-white/50">Stock</label><input type="number" value={v.stock} onChange={e => setVariant(i,'stock',parseInt(e.target.value)||0)} className="w-full bg-transparent border-b border-white/20 py-1 text-sm" /></div>
            </div>
          ))}
          <button onClick={() => setP(x => ({ ...x, variants: [...x.variants, { size: '', sku: '', price: 0, comparePrice: 0, stock: 0 }] }))} className="text-[10px] tracking-[0.25em] uppercase text-white/60 hover:text-white">+ Add Variant</button>
        </div>
        <div className="flex gap-3 mt-8">
          <button onClick={() => onSave(p)} className="bg-white text-black px-8 py-3 text-[10px] tracking-[0.3em] uppercase">Save</button>
          <button onClick={onClose} className="border border-white/30 px-8 py-3 text-[10px] tracking-[0.3em] uppercase">Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
