import crypto from 'node:crypto';
import { cookies } from 'next/headers';

const COOKIE = 'tatc_session';
const secret = () => process.env.SESSION_SECRET || 'development-only-change-this-secret';

function b64(value) {
  return Buffer.from(value).toString('base64url');
}
function unb64(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}
function sign(payload) {
  return crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
}

export function createSession(user) {
  const payload = b64(JSON.stringify({
    id: user.id,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8
  }));
  return `${payload}.${sign(payload)}`;
}

export function verifySession(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  try {
    const expected = sign(payload);
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
    const data = JSON.parse(unb64(payload));
    if (!data || !data.exp || data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

export async function getSession() {
  const jar = await cookies();
  return verifySession(jar.get(COOKIE)?.value);
}

export async function setSession(user) {
  const jar = await cookies();
  jar.set(COOKIE, createSession(user), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.set(COOKIE, '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 });
}

export async function requireAuth(roles = []) {
  const session = await getSession();
  if (!session) throw Object.assign(new Error('Unauthorized'), { status: 401 });
  if (roles.length && !roles.includes(session.role)) throw Object.assign(new Error('Forbidden'), { status: 403 });
  return session;
}
