import { NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import { createHmac } from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { getDb } from '@/lib/mongodb';
import { signToken, verifyToken, hashPassword, comparePassword, isAdminEmail } from '@/lib/auth';
import { buildSeedDocs } from '@/lib/seed';
import { sendOrderEmails } from '@/lib/email';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

const ok = (data, status = 200) => NextResponse.json(data, { status });
const err = (message, status = 400) => NextResponse.json({ error: message }, { status });

async function ensureSeed(db) {
  const count = await db.collection('products').countDocuments();
  if (count === 0) {
    await db.collection('products').insertMany(buildSeedDocs());
  }
}

async function currentUser(req) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload?.userId) return null;
  const db = await getDb();
  return db.collection('users').findOne({ _id: payload.userId });
}

function requireAuth(user) {
  if (!user) return err('Unauthorized', 401);
  return null;
}
function requireAdmin(user) {
  if (!user) return err('Unauthorized', 401);
  if (user.role !== 'admin') return err('Forbidden', 403);
  return null;
}

async function handle(req, { params }) {
  const path = (params?.path || []).join('/');
  const method = req.method;
  const db = await getDb();
  await ensureSeed(db);
  const url = new URL(req.url);

  try {
    // ---------- AUTH ----------
    if (path === 'auth/register' && method === 'POST') {
      const { email, password, name } = await req.json();
      if (!email || !password) return err('Email and password required');
      const existing = await db.collection('users').findOne({ email: email.toLowerCase() });
      if (existing) return err('Email already registered', 409);
      const role = isAdminEmail(email) ? 'admin' : 'customer';
      const user = {
        _id: uuid(),
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        passwordHash: await hashPassword(password),
        role,
        wishlist: [],
        addresses: [],
        createdAt: new Date(),
      };
      await db.collection('users').insertOne(user);
      const token = signToken({ userId: user._id, role: user.role });
      return ok({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
    }

    if (path === 'auth/login' && method === 'POST') {
      const { email, password } = await req.json();
      const user = await db.collection('users').findOne({ email: email.toLowerCase() });
      if (!user) return err('Invalid credentials', 401);
      const valid = await comparePassword(password, user.passwordHash);
      if (!valid) return err('Invalid credentials', 401);
      // Auto-promote admin email
      if (isAdminEmail(user.email) && user.role !== 'admin') {
        await db.collection('users').updateOne({ _id: user._id }, { $set: { role: 'admin' } });
        user.role = 'admin';
      }
      const token = signToken({ userId: user._id, role: user.role });
      return ok({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
    }

    if (path === 'auth/me' && method === 'GET') {
      const user = await currentUser(req);
      if (!user) return err('Unauthorized', 401);
      return ok({ user: { id: user._id, email: user.email, name: user.name, role: user.role, addresses: user.addresses || [], wishlist: user.wishlist || [] } });
    }

    if (path === 'auth/google' && method === 'POST') {
      const { idToken } = await req.json();
      if (!idToken) return err('ID token required');
      const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) return err('Google OAuth not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env', 500);
      let payload;
      try {
        const ticket = await googleClient.verifyIdToken({ idToken, audience: clientId });
        payload = ticket.getPayload();
      } catch (e) {
        return err('Invalid Google token', 401);
      }
      if (!payload?.email || !payload.email_verified) return err('Google email not verified', 403);
      let user = await db.collection('users').findOne({ email: payload.email.toLowerCase() });
      if (!user) {
        const role = isAdminEmail(payload.email) ? 'admin' : 'customer';
        user = {
          _id: uuid(),
          email: payload.email.toLowerCase(),
          name: payload.name || payload.email.split('@')[0],
          avatarUrl: payload.picture,
          googleId: payload.sub,
          provider: 'google',
          role,
          wishlist: [], addresses: [],
          createdAt: new Date(),
        };
        await db.collection('users').insertOne(user);
      } else if (!user.googleId) {
        await db.collection('users').updateOne({ _id: user._id }, { $set: { googleId: payload.sub, avatarUrl: payload.picture, provider: user.provider || 'hybrid' } });
      }
      if (isAdminEmail(user.email) && user.role !== 'admin') {
        await db.collection('users').updateOne({ _id: user._id }, { $set: { role: 'admin' } });
        user.role = 'admin';
      }
      const token = signToken({ userId: user._id, role: user.role });
      return ok({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role } });
    }

    // ---------- PRODUCTS ----------
    if (path === 'products' && method === 'GET') {
      const q = url.searchParams.get('q') || '';
      const collection = url.searchParams.get('collection');
      const gender = url.searchParams.get('gender');
      const family = url.searchParams.get('family');
      const featured = url.searchParams.get('featured');
      const bestseller = url.searchParams.get('bestseller');
      const newArrival = url.searchParams.get('newArrival');
      const sort = url.searchParams.get('sort') || 'newest';
      const limit = parseInt(url.searchParams.get('limit') || '50');

      const filter = {};
      if (q) filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { brand: { $regex: q, $options: 'i' } },
        { shortDescription: { $regex: q, $options: 'i' } },
        { scentFamily: { $regex: q, $options: 'i' } },
      ];
      if (collection) filter.collection = collection;
      if (gender) filter.gender = gender;
      if (family) filter.scentFamily = family;
      if (featured === 'true') filter.featured = true;
      if (bestseller === 'true') filter.bestseller = true;
      if (newArrival === 'true') filter.newArrival = true;

      const sortMap = {
        newest: { createdAt: -1 },
        priceAsc: { 'variants.0.price': 1 },
        priceDesc: { 'variants.0.price': -1 },
        rating: { rating: -1 },
      };
      const products = await db.collection('products').find(filter).sort(sortMap[sort] || sortMap.newest).limit(limit).toArray();
      return ok({ products });
    }

    if (path.startsWith('products/') && method === 'GET') {
      const slug = path.split('/')[1];
      const product = await db.collection('products').findOne({ slug });
      if (!product) return err('Not found', 404);
      const related = await db.collection('products').find({ _id: { $ne: product._id }, collection: product.collection }).limit(4).toArray();
      return ok({ product, related });
    }

    if (path === 'products' && method === 'POST') {
      const user = await currentUser(req);
      const adminCheck = requireAdmin(user); if (adminCheck) return adminCheck;
      const body = await req.json();
      const slugify = (s) => (s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
      const slug = slugify(body.slug || body.name);
      if (!slug) return err('Product name is required');
      if (!body.images?.[0]) return err('Main image URL is required');
      // Ensure slug is unique
      const existing = await db.collection('products').findOne({ slug });
      const finalSlug = existing ? `${slug}-${Date.now().toString(36)}` : slug;
      const doc = { _id: uuid(), ...body, slug: finalSlug, createdAt: new Date(), updatedAt: new Date() };
      await db.collection('products').insertOne(doc);
      return ok({ product: doc });
    }

    if (path.startsWith('products/') && method === 'PUT') {
      const user = await currentUser(req);
      const adminCheck = requireAdmin(user); if (adminCheck) return adminCheck;
      const id = path.split('/')[1];
      const body = await req.json();
      delete body._id;
      await db.collection('products').updateOne({ _id: id }, { $set: { ...body, updatedAt: new Date() } });
      const updated = await db.collection('products').findOne({ _id: id });
      return ok({ product: updated });
    }

    if (path.startsWith('products/') && method === 'DELETE') {
      const user = await currentUser(req);
      const adminCheck = requireAdmin(user); if (adminCheck) return adminCheck;
      const id = path.split('/')[1];
      await db.collection('products').deleteOne({ _id: id });
      return ok({ ok: true });
    }

    // ---------- WISHLIST ----------
    if (path === 'wishlist' && method === 'GET') {
      const user = await currentUser(req);
      const a = requireAuth(user); if (a) return a;
      const ids = user.wishlist || [];
      const items = await db.collection('products').find({ _id: { $in: ids } }).toArray();
      return ok({ items });
    }
    if (path === 'wishlist' && method === 'POST') {
      const user = await currentUser(req);
      const a = requireAuth(user); if (a) return a;
      const { productId } = await req.json();
      await db.collection('users').updateOne({ _id: user._id }, { $addToSet: { wishlist: productId } });
      return ok({ ok: true });
    }
    if (path.startsWith('wishlist/') && method === 'DELETE') {
      const user = await currentUser(req);
      const a = requireAuth(user); if (a) return a;
      const productId = path.split('/')[1];
      await db.collection('users').updateOne({ _id: user._id }, { $pull: { wishlist: productId } });
      return ok({ ok: true });
    }

    // ---------- ADDRESSES ----------
    if (path === 'addresses' && method === 'GET') {
      const user = await currentUser(req);
      const a = requireAuth(user); if (a) return a;
      return ok({ addresses: user.addresses || [] });
    }
    if (path === 'addresses' && method === 'POST') {
      const user = await currentUser(req);
      const a = requireAuth(user); if (a) return a;
      const body = await req.json();
      const addr = { id: uuid(), ...body };
      const addresses = user.addresses || [];
      if (addr.isDefault) addresses.forEach(x => x.isDefault = false);
      addresses.push(addr);
      await db.collection('users').updateOne({ _id: user._id }, { $set: { addresses } });
      return ok({ address: addr });
    }
    if (path.startsWith('addresses/') && method === 'DELETE') {
      const user = await currentUser(req);
      const a = requireAuth(user); if (a) return a;
      const id = path.split('/')[1];
      const addresses = (user.addresses || []).filter(x => x.id !== id);
      await db.collection('users').updateOne({ _id: user._id }, { $set: { addresses } });
      return ok({ ok: true });
    }

    // ---------- COUPONS ----------
    if (path.startsWith('coupons/validate') && method === 'POST') {
      const { code, subtotal } = await req.json();
      const c = await db.collection('coupons').findOne({ code: (code || '').toUpperCase() });
      if (!c) {
        // built-in welcome code
        if ((code || '').toUpperCase() === 'WELCOME10') {
          return ok({ coupon: { code: 'WELCOME10', type: 'percentage', value: 10, discount: Math.round(subtotal * 0.1) } });
        }
        if ((code || '').toUpperCase() === 'FREESHIP') {
          return ok({ coupon: { code: 'FREESHIP', type: 'free_shipping', value: 0, discount: 0, freeShipping: true } });
        }
        return err('Invalid coupon code', 404);
      }
      if (c.expiresAt && new Date(c.expiresAt) < new Date()) return err('Coupon expired');
      if (c.minCartValue && subtotal < c.minCartValue) return err(`Minimum cart value of ₹${c.minCartValue} required`);
      let discount = 0;
      if (c.type === 'fixed') discount = c.value;
      if (c.type === 'percentage') discount = Math.round(subtotal * c.value / 100);
      return ok({ coupon: { code: c.code, type: c.type, value: c.value, discount, freeShipping: c.type === 'free_shipping' } });
    }
    if (path === 'payments/razorpay-order' && method === 'POST') {
      const user = await currentUser(req);
      const a = requireAuth(user); if (a) return a;
      const { items, address, shipping = 0, discount = 0, couponCode, currency = 'INR' } = await req.json();
      if (!items?.length) return err('Cart is empty');
      let subtotal = 0;
      const validated = [];
      for (const it of items) {
        const product = await db.collection('products').findOne({ _id: it.productId });
        if (!product) return err(`Product ${it.productId} not found`);
        const variant = product.variants.find(v => v.sku === it.sku);
        if (!variant) return err(`Variant ${it.sku} not found`);
        if (variant.stock < it.qty) return err(`Insufficient stock for ${product.name} ${variant.size}`);
        const price = Number(it.price || variant.price);
        if (!price || price <= 0) return err(`Invalid price for ${product.name}`);
        validated.push({
          productId: product._id, slug: product.slug, name: product.name,
          image: product.images?.[0], sku: variant.sku, size: variant.size,
          price, qty: it.qty, total: price * it.qty, bundleLabel: it.bundleLabel || null,
        });
        subtotal += price * it.qty;
      }
      const total = subtotal - discount + shipping;
      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keyId || !keySecret) return err('Razorpay is not configured', 500);
      const resp = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: total * 100, currency, receipt: `VB-${Date.now()}`, payment_capture: 1, notes: { userId: user._id, email: user.email } }),
      });
      if (!resp.ok) {
        const text = await resp.text();
        console.error('Razorpay create order failed:', text);
        return err('Unable to initialize payment', 500);
      }
      const razorpayOrder = await resp.json();
      return ok({ razorpayOrder, keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || keyId });
    }
    if (path === 'payments/razorpay-confirm' && method === 'POST') {
      const user = await currentUser(req);
      const a = requireAuth(user); if (a) return a;
      const { razorpay_payment_id, razorpay_order_id, razorpay_signature, items, address, shipping = 0, discount = 0, couponCode } = await req.json();
      if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) return err('Payment verification failed');
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keySecret) return err('Razorpay is not configured', 500);
      const expected = createHmac('sha256', keySecret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
      if (expected !== razorpay_signature) return err('Invalid payment signature', 400);
      if (!items?.length) return err('Cart is empty');
      let subtotal = 0;
      const validated = [];
      for (const it of items) {
        const product = await db.collection('products').findOne({ _id: it.productId });
        if (!product) return err(`Product ${it.productId} not found`);
        const variant = product.variants.find(v => v.sku === it.sku);
        if (!variant) return err(`Variant ${it.sku} not found`);
        if (variant.stock < it.qty) return err(`Insufficient stock for ${product.name} ${variant.size}`);
        const price = Number(it.price || variant.price);
        if (!price || price <= 0) return err(`Invalid price for ${product.name}`);
        validated.push({
          productId: product._id, slug: product.slug, name: product.name,
          image: product.images?.[0], sku: variant.sku, size: variant.size,
          price, qty: it.qty, total: price * it.qty, bundleLabel: it.bundleLabel || null,
        });
        subtotal += price * it.qty;
      }
      const total = subtotal - discount + shipping;
      const order = {
        _id: uuid(),
        orderNumber: 'VB-' + Date.now().toString(36).toUpperCase(),
        userId: user._id, userEmail: user.email,
        items: validated, address, subtotal, discount, shipping, total,
        couponCode: couponCode || null,
        paymentMethod: 'RAZORPAY', paymentStatus: 'paid', transactionId: razorpay_payment_id, razorpayOrderId: razorpay_order_id,
        status: 'confirmed', createdAt: new Date(),
      };
      await db.collection('orders').insertOne(order);
      for (const it of validated) {
        const product = await db.collection('products').findOne({ _id: it.productId });
        if (!product) continue;
        const variants = (product.variants || []).map((variant) =>
          variant.sku === it.sku ? { ...variant, stock: (variant.stock || 0) - it.qty } : variant
        );
        await db.collection('products').updateOne(
          { _id: it.productId },
          { $set: { variants } }
        );
      }
      sendOrderEmails(order).catch(e => console.error('email send error:', e));
      return ok({ order });
    }
    if (path === 'admin/coupons' && method === 'GET') {
      const user = await currentUser(req);
      const a = requireAdmin(user); if (a) return a;
      const coupons = await db.collection('coupons').find({}).toArray();
      return ok({ coupons });
    }
    if (path === 'admin/coupons' && method === 'POST') {
      const user = await currentUser(req);
      const a = requireAdmin(user); if (a) return a;
      const body = await req.json();
      const doc = { _id: uuid(), ...body, code: (body.code || '').toUpperCase(), createdAt: new Date() };
      await db.collection('coupons').insertOne(doc);
      return ok({ coupon: doc });
    }

    // ---------- REVIEWS ----------
    if (path.startsWith('reviews/') && method === 'GET') {
      const productId = path.split('/')[1];
      const reviews = await db.collection('reviews').find({ productId }).sort({ createdAt: -1 }).toArray();
      return ok({ reviews });
    }
    if (path === 'reviews' && method === 'POST') {
      const user = await currentUser(req);
      const a = requireAuth(user); if (a) return a;
      const { productId, rating, title, body } = await req.json();
      const doc = {
        _id: uuid(), productId, userId: user._id, userName: user.name,
        rating: Math.max(1, Math.min(5, parseInt(rating))), title, body,
        verified: true, createdAt: new Date(),
      };
      await db.collection('reviews').insertOne(doc);
      // recompute product rating
      const ratings = await db.collection('reviews').find({ productId }).toArray();
      if (ratings.length) {
        const avg = ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length;
        await db.collection('products').updateOne(
          { _id: productId },
          { $set: { rating: Math.round(avg * 10) / 10, reviewCount: ratings.length } }
        );
      }
      return ok({ review: doc });
    }

    // ---------- ORDERS ----------
    if (path === 'orders' && method === 'GET') {
      const user = await currentUser(req);
      const a = requireAuth(user); if (a) return a;
      const orders = await db.collection('orders').find({ userId: user._id }).sort({ createdAt: -1 }).toArray();
      return ok({ orders });
    }
    if (path === 'orders' && method === 'POST') {
      // Place order from cart payload
      const user = await currentUser(req);
      const a = requireAuth(user); if (a) return a;
      const { items, address, shipping = 0, discount = 0, couponCode, paymentMethod = 'COD' } = await req.json();
      if (!items?.length) return err('Cart is empty');

      // Validate stock and pricing against DB
      let subtotal = 0;
      const validated = [];
      for (const it of items) {
        const product = await db.collection('products').findOne({ _id: it.productId });
        if (!product) return err(`Product ${it.productId} not found`);
        const variant = product.variants.find(v => v.sku === it.sku);
        if (!variant) return err(`Variant ${it.sku} not found`);
        if (variant.stock < it.qty) return err(`Insufficient stock for ${product.name} ${variant.size}`);
        const price = Number(it.price || variant.price);
      if (!price || price <= 0) return err(`Invalid price for ${product.name}`);
      validated.push({
          productId: product._id, slug: product.slug, name: product.name,
          image: product.images?.[0], sku: variant.sku, size: variant.size,
          price, qty: it.qty, total: price * it.qty, bundleLabel: it.bundleLabel || null,
        });
        subtotal += price * it.qty;
      }
      const total = subtotal - discount + shipping;
      const order = {
        _id: uuid(),
        orderNumber: 'VB-' + Date.now().toString(36).toUpperCase(),
        userId: user._id, userEmail: user.email,
        items: validated, address, subtotal, discount, shipping, total,
        couponCode: couponCode || null,
        paymentMethod, paymentStatus: paymentMethod === 'COD' ? 'pending' : 'processing',
        status: 'pending', createdAt: new Date(),
      };
      await db.collection('orders').insertOne(order);

      // Decrement stock
      for (const it of validated) {
        const product = await db.collection('products').findOne({ _id: it.productId });
        if (!product) continue;
        const variants = (product.variants || []).map((variant) =>
          variant.sku === it.sku ? { ...variant, stock: (variant.stock || 0) - it.qty } : variant
        );
        await db.collection('products').updateOne(
          { _id: it.productId },
          { $set: { variants } }
        );
      }

      // Send order emails (admin + customer) — fire & forget
      sendOrderEmails(order).catch(e => console.error('email send error:', e));
      return ok({ order });
    }
    if (path.startsWith('orders/') && method === 'GET') {
      const id = path.split('/')[1];
      const user = await currentUser(req);
      const a = requireAuth(user); if (a) return a;
      const order = await db.collection('orders').findOne({ _id: id });
      if (!order) return err('Order not found', 404);
      if (order.userId !== user._id && user.role !== 'admin') return err('Forbidden', 403);
      return ok({ order });
    }

    // ---------- MOCK PAYMENT ----------
    if (path === 'payment/mock-confirm' && method === 'POST') {
      const user = await currentUser(req);
      const a = requireAuth(user); if (a) return a;
      const { orderId, success = true } = await req.json();
      const order = await db.collection('orders').findOne({ _id: orderId });
      if (!order) return err('Order not found', 404);
      if (success) {
        await db.collection('orders').updateOne({ _id: orderId }, {
          $set: { paymentStatus: 'paid', status: 'confirmed', paidAt: new Date(), transactionId: 'MOCK_' + uuid().slice(0, 8) }
        });
      } else {
        await db.collection('orders').updateOne({ _id: orderId }, { $set: { paymentStatus: 'failed' } });
      }
      const updated = await db.collection('orders').findOne({ _id: orderId });
      return ok({ order: updated });
    }

    // ---------- ADMIN ----------
    if (path === 'admin/stats' && method === 'GET') {
      const user = await currentUser(req);
      const a = requireAdmin(user); if (a) return a;
      const [productCount, orderCount, userCount, paidOrders] = await Promise.all([
        db.collection('products').countDocuments(),
        db.collection('orders').countDocuments(),
        db.collection('users').countDocuments(),
        db.collection('orders').find({ paymentStatus: 'paid' }).toArray(),
      ]);
      const revenue = paidOrders.reduce((sum, order) => sum + (order.total || 0), 0);
      const recentOrders = await db.collection('orders').find({}).sort({ createdAt: -1 }).limit(10).toArray();
      return ok({
        stats: { productCount, orderCount, userCount, revenue },
        recentOrders,
      });
    }
    if (path === 'admin/orders' && method === 'GET') {
      const user = await currentUser(req);
      const a = requireAdmin(user); if (a) return a;
      const orders = await db.collection('orders').find({}).sort({ createdAt: -1 }).toArray();
      return ok({ orders });
    }
    if (path.startsWith('admin/orders/') && method === 'PUT') {
      const user = await currentUser(req);
      const a = requireAdmin(user); if (a) return a;
      const id = path.split('/')[2];
      const body = await req.json();
      await db.collection('orders').updateOne({ _id: id }, { $set: body });
      const updated = await db.collection('orders').findOne({ _id: id });
      return ok({ order: updated });
    }
    if (path === 'admin/users' && method === 'GET') {
      const user = await currentUser(req);
      const a = requireAdmin(user); if (a) return a;
      const users = await db.collection('users').find({}, { projection: { passwordHash: 0 } }).sort({ createdAt: -1 }).toArray();
      return ok({ users });
    }

    // ---------- COLLECTIONS CRUD ----------
    if (path === 'collections' && method === 'GET') {
      let cols = await db.collection('collections').find({}).sort({ order: 1 }).toArray();
      if (cols.length === 0) {
        // Seed defaults
        const defaults = [
          { name: 'Signature', slug: 'signature', description: 'Our hero compositions.', order: 1 },
          { name: 'Sacred', slug: 'sacred', description: 'Incense, frankincense, myrrh.', order: 2 },
          { name: 'Leathers', slug: 'leathers', description: 'Black leather and birch tar.', order: 3 },
          { name: 'Florals Noir', slug: 'florals-noir', description: 'Roses at the witching hour.', order: 4 },
          { name: 'Metallics', slug: 'metallics', description: 'Cold silver and iris suede.', order: 5 },
          { name: 'Ambres', slug: 'ambres', description: 'Liquid amber and vanilla.', order: 6 },
        ];
        await db.collection('collections').insertMany(defaults.map(c => ({ _id: uuid(), ...c, createdAt: new Date() })));
        cols = await db.collection('collections').find({}).sort({ order: 1 }).toArray();
      }
      return ok({ collections: cols });
    }
    if (path === 'admin/collections' && method === 'POST') {
      const user = await currentUser(req);
      const a = requireAdmin(user); if (a) return a;
      const body = await req.json();
      const doc = { _id: uuid(), ...body, createdAt: new Date() };
      await db.collection('collections').insertOne(doc);
      return ok({ collection: doc });
    }
    if (path.startsWith('admin/collections/') && method === 'PUT') {
      const user = await currentUser(req);
      const a = requireAdmin(user); if (a) return a;
      const id = path.split('/')[2];
      const body = await req.json();
      delete body._id;
      await db.collection('collections').updateOne({ _id: id }, { $set: body });
      return ok({ ok: true });
    }
    if (path.startsWith('admin/collections/') && method === 'DELETE') {
      const user = await currentUser(req);
      const a = requireAdmin(user); if (a) return a;
      const id = path.split('/')[2];
      await db.collection('collections').deleteOne({ _id: id });
      return ok({ ok: true });
    }

    // ---------- ADMIN REVIEWS MODERATION ----------
    if (path === 'admin/reviews' && method === 'GET') {
      const user = await currentUser(req);
      const a = requireAdmin(user); if (a) return a;
      const reviews = await db.collection('reviews').find({}).sort({ createdAt: -1 }).toArray();
      // Join product names
      const productIds = [...new Set(reviews.map(r => r.productId))];
      const prods = await db.collection('products').find({ _id: { $in: productIds } }).toArray();
      const map = Object.fromEntries(prods.map(p => [p._id, { name: p.name, slug: p.slug, image: p.images?.[0] }]));
      const enriched = reviews.map(r => ({ ...r, product: map[r.productId] }));
      return ok({ reviews: enriched });
    }
    if (path.startsWith('admin/reviews/') && method === 'PUT') {
      // Admin can hide / approve
      const user = await currentUser(req);
      const a = requireAdmin(user); if (a) return a;
      const id = path.split('/')[2];
      const body = await req.json();
      await db.collection('reviews').updateOne({ _id: id }, { $set: body });
      return ok({ ok: true });
    }
    if (path.startsWith('admin/reviews/') && method === 'DELETE') {
      const user = await currentUser(req);
      const a = requireAdmin(user); if (a) return a;
      const id = path.split('/')[2];
      const review = await db.collection('reviews').findOne({ _id: id });
      await db.collection('reviews').deleteOne({ _id: id });
      // recompute product rating
      if (review) {
        const ratings = await db.collection('reviews').find({ productId: review.productId }).toArray();
        const avg = ratings.length ? ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length : 0;
        await db.collection('products').updateOne(
          { _id: review.productId },
          { $set: { rating: Math.round(avg * 10) / 10, reviewCount: ratings.length } }
        );
      }
      return ok({ ok: true });
    }
    if (path === 'admin/reviews' && method === 'POST') {
      // Admin can write a review on behalf of a customer (e.g., from offline feedback)
      const user = await currentUser(req);
      const a = requireAdmin(user); if (a) return a;
      const { productId, userName, rating, title, body } = await req.json();
      const doc = {
        _id: uuid(), productId, userId: 'admin', userName: userName || 'Verified Buyer',
        rating: Math.max(1, Math.min(5, parseInt(rating))), title, body,
        verified: true, addedByAdmin: true, createdAt: new Date(),
      };
      await db.collection('reviews').insertOne(doc);
      const ratings = await db.collection('reviews').find({ productId }).toArray();
      if (ratings.length) {
        const avg = ratings.reduce((sum, r) => sum + (r.rating || 0), 0) / ratings.length;
        await db.collection('products').updateOne(
          { _id: productId },
          { $set: { rating: Math.round(avg * 10) / 10, reviewCount: ratings.length } }
        );
      }
      return ok({ review: doc });
    }

    // ---------- SITE SETTINGS (theme, logo, banners) ----------
    if (path === 'settings' && method === 'GET') {
      let s = await db.collection('settings').findOne({ _id: 'site' });
      if (!s) {
        s = {
          _id: 'site',
          theme: 'dark', // 'dark' | 'navy'
          logoUrl: 'https://cdn.corenexis.com/f/c8lL883bHrO.png',
          siteName: 'VENTEBEAST',
          tagline: 'Accessibilis Niche Perfumery',
          promoBanner: 'USE WELCOME10 FOR 10% OFF FIRST ORDER · FREE SHIPPING ABOVE ₹999',
        };
        await db.collection('settings').insertOne(s);
      }
      return ok({ settings: s });
    }
    if (path === 'admin/settings' && method === 'PUT') {
      const user = await currentUser(req);
      const a = requireAdmin(user); if (a) return a;
      const body = await req.json();
      delete body._id;
      await db.collection('settings').updateOne({ _id: 'site' }, { $set: body }, { upsert: true });
      const s = await db.collection('settings').findOne({ _id: 'site' });
      return ok({ settings: s });
    }

    // ---------- TEST EMAIL (admin only) ----------
    if (path === 'admin/test-email' && method === 'POST') {
      const user = await currentUser(req);
      const a = requireAdmin(user); if (a) return a;
      const last = await db.collection('orders').findOne({}, { sort: { createdAt: -1 } });
      if (!last) return err('No orders to test with');
      const result = await sendOrderEmails(last);
      return ok({ result });
    }

    // Health
    if (path === '' || path === 'health') return ok({ ok: true, app: 'VENTEBEAST', time: new Date().toISOString() });

    return err('Not found', 404);
  } catch (e) {
    console.error('API error:', e);
    return err(e.message || 'Server error', 500);
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
export const PATCH = handle;
