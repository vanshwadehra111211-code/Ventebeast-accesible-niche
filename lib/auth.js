import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { getDb } from './mongodb';

const SECRET = process.env.JWT_SECRET || 'dev_secret';
const ADMIN_EMAIL = 'vanshwadehra606@gmail.com';

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '30d' });
}
export function verifyToken(token) {
  try { return jwt.verify(token, SECRET); } catch { return null; }
}
export async function hashPassword(p) { return bcrypt.hash(p, 10); }
export async function comparePassword(p, h) { return bcrypt.compare(p, h); }

export async function getUserFromRequest(req) {
  const auth = req.headers.get('authorization') || '';
  let token = auth.replace('Bearer ', '');
  if (!token) {
    const c = cookies().get('vb_token');
    token = c?.value;
  }
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload?.userId) return null;
  const db = await getDb();
  const user = await db.collection('users').findOne({ _id: payload.userId });
  return user || null;
}

export function isAdminEmail(email) { return email?.toLowerCase() === ADMIN_EMAIL.toLowerCase(); }
