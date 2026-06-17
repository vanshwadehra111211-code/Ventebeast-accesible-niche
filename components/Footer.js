import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-24 bg-navy-900 text-white">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <div className="font-display text-3xl tracking-[0.25em] mb-6">VENTEBEAST</div>
            <p className="text-sm text-white/70 leading-relaxed max-w-md">Accessibilis niche perfumery. Composed in small batches with the finest naturals from Grasse, Mysore, and Sambava. Worn slowly. Remembered always.</p>
            <form className="mt-8 max-w-md flex border-b border-white/20 pb-2">
              <input type="email" placeholder="Email for first access to new launches" className="flex-1 bg-transparent outline-none text-sm placeholder:text-white/40" />
              <button className="text-[11px] tracking-[0.25em] uppercase hover:text-jungle-400">Subscribe</button>
            </form>
          </div>
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-jungle-400 mb-6">Shop</div>
            <ul className="space-y-3 text-sm">
              <li><Link href="/collections" className="hover:text-jungle-400">All Fragrances</Link></li>
              <li><Link href="/collections?gender=Women" className="hover:text-jungle-400">Women</Link></li>
              <li><Link href="/collections?gender=Men" className="hover:text-jungle-400">Men</Link></li>
              <li><Link href="/collections?bestseller=true" className="hover:text-jungle-400">Bestsellers</Link></li>
              <li><Link href="/collections?newArrival=true" className="hover:text-jungle-400">New Arrivals</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-jungle-400 mb-6">Atelier</div>
            <ul className="space-y-3 text-sm">
              <li><Link href="#" className="hover:text-jungle-400">Our Story</Link></li>
              <li><Link href="#" className="hover:text-jungle-400">The Perfumer</Link></li>
              <li><Link href="#" className="hover:text-jungle-400">Sustainability</Link></li>
              <li><Link href="#" className="hover:text-jungle-400">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between gap-4 text-[10px] tracking-[0.25em] uppercase text-white/50">
          <div>© 2025 VENTEBEAST — Accessibilis Niche Perfumery</div>
          <div className="flex gap-6"><span>Privacy</span><span>Terms</span><span>Shipping</span><span>Contact</span></div>
        </div>
      </div>
    </footer>
  );
}
