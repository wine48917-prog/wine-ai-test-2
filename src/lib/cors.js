export function getAllowedOrigins() {
  return (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
}

export function isOriginAllowed(req) {
  const origin = req.headers.origin || '';
  if (!origin) return true;
  const allowed = getAllowedOrigins();
  if (allowed.length) return allowed.includes(origin);
  try {
    const parsed = new URL(origin);
    const requestHost = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
    return Boolean(requestHost && parsed.host === requestHost);
  } catch {
    return false;
  }
}

export function applyCORS(req, res) {
  const origin = req.headers.origin || '';
  if (origin && isOriginAllowed(req)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Device-Id, X-User-Uuid, X-User-Token');
  res.setHeader('Access-Control-Expose-Headers', 'X-User-Uuid');
  res.setHeader('Access-Control-Max-Age', '86400');
}
