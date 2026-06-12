'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, setToken, clearToken } from './api';

export const useStore = create(persist((set, get) => ({
  user: null,
  cart: [], // { productId, slug, name, image, sku, size, price, qty }
  wishlist: [],
  loadingUser: false,

  setUser: (user) => set({ user }),
  initAuth: async () => {
    try {
      set({ loadingUser: true });
      const { user } = await api('auth/me');
      set({ user, wishlist: user.wishlist || [] });
    } catch (e) { set({ user: null }); }
    finally { set({ loadingUser: false }); }
  },
  login: async (email, password) => {
    const { token, user } = await api('auth/login', { method: 'POST', body: { email, password } });
    setToken(token); set({ user });
    return user;
  },
  register: async (email, password, name) => {
    const { token, user } = await api('auth/register', { method: 'POST', body: { email, password, name } });
    setToken(token); set({ user });
    return user;
  },
  logout: () => { clearToken(); set({ user: null, wishlist: [] }); },

  loginWithGoogle: async (idToken) => {
    const { token, user } = await api('auth/google', { method: 'POST', body: { idToken } });
    setToken(token); set({ user });
    return user;
  },

  addToCart: (item) => {
    const cart = [...get().cart];
    const idx = cart.findIndex(x => x.sku === item.sku);
    if (idx >= 0) cart[idx].qty += item.qty || 1;
    else cart.push({ ...item, qty: item.qty || 1 });
    set({ cart });
  },
  updateQty: (sku, qty) => {
    const cart = get().cart.map(x => x.sku === sku ? { ...x, qty: Math.max(1, qty) } : x);
    set({ cart });
  },
  removeFromCart: (sku) => set({ cart: get().cart.filter(x => x.sku !== sku) }),
  clearCart: () => set({ cart: [] }),

  toggleWishlist: async (productId) => {
    const user = get().user;
    if (!user) { window.location.href = '/login'; return; }
    const wl = get().wishlist || [];
    if (wl.includes(productId)) {
      await api(`wishlist/${productId}`, { method: 'DELETE' });
      set({ wishlist: wl.filter(x => x !== productId) });
    } else {
      await api('wishlist', { method: 'POST', body: { productId } });
      set({ wishlist: [...wl, productId] });
    }
  },
}), { name: 'ventebeast-store', partialize: (s) => ({ cart: s.cart }) }));

export const cartCount = (cart) => cart.reduce((a, b) => a + b.qty, 0);
export const cartSubtotal = (cart) => cart.reduce((a, b) => a + b.price * b.qty, 0);
