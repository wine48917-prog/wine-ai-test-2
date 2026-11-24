export function getAllowedOrigins() {
  const raw = process.env.ALLOWED_ORIGINS || '';
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}
export function applyCORS(req, res) {
  const origin = req.headers.origin || '';
  const allowed = getAllowedOrigins();
  if (!origin || !allowed.length || allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Device-Id, X-User-Uuid, X-User-Token');
  res.setHeader('Access-Control-Expose-Headers', 'X-User-Uuid');
  res.setHeader('Access-Control-Max-Age', '86400');
}
export function isOriginAllowed(req) {
  const origin = req.headers.origin || '';
  const allowed = getAllowedOrigins();
  return !origin || !allowed.length || allowed.includes(origin);
}
