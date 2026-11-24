import crypto from 'node:crypto';

const JWT_SECRET = process.env.JWT_SECRET || '';
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.warn('[JWT] ⚠️ JWT_SECRET missing or too short! Auth will fail.');
}

function base64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64');
}

export function signToken(payload, expiresInDays = 30) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (expiresInDays * 24 * 60 * 60);
  const body = { ...payload, iat: now, exp };
  const h = base64url(Buffer.from(JSON.stringify(header)));
  const p = base64url(Buffer.from(JSON.stringify(body)));
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${h}.${p}`).digest();
  return `${h}.${p}.${base64url(sig)}`;
}

export function verifyToken(token) {
  try {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return null;
    const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${h}.${p}`).digest();
    const actual = base64urlDecode(s);
    if (expected.length !== actual.length) return null;
    if (!crypto.timingSafeEqual(expected, actual)) return null;
    const payload = JSON.parse(base64urlDecode(p).toString());
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
