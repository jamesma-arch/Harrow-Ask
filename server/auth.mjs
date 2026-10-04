import { createPublicKey, verify } from 'node:crypto';
let cache = { until: 0, keys: [] };
export class HttpError extends Error { constructor(status, code) { super(code); this.status = status; } }
export async function authenticate(request, env, fetcher = fetch) {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_ALLOWED_DOMAIN) throw new HttpError(503, 'SETUP_REQUIRED');
  const token = request.headers.get('authorization')?.match(/^Bearer ([A-Za-z0-9_.-]+)$/)?.[1];
  if (!token || token.length > 12000) throw new HttpError(401, 'SIGN_IN_REQUIRED');
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw Error();
    const header = JSON.parse(Buffer.from(parts[0], 'base64url'));
    const claims = JSON.parse(Buffer.from(parts[1], 'base64url'));
    if (header.alg !== 'RS256' || typeof header.kid !== 'string') throw Error();
    if (cache.until < Date.now()) {
      const res = await fetcher('https://www.googleapis.com/oauth2/v3/certs', {signal: AbortSignal.timeout(8000)});
      if (!res.ok) throw Error();
      cache = { keys: (await res.json()).keys, until: Date.now() + 300000 };
    }
    const jwk = cache.keys.find(k => k.kid === header.kid && k.kty === 'RSA' && k.alg === 'RS256');
    if (!jwk || !verify('RSA-SHA256', Buffer.from(parts[0]+'.'+parts[1]), createPublicKey({key:jwk,format:'jwk'}), Buffer.from(parts[2],'base64url'))) throw Error();
    const now = Date.now()/1000;
    if (!['accounts.google.com','https://accounts.google.com'].includes(claims.iss) || claims.aud !== env.GOOGLE_CLIENT_ID || !Number.isFinite(claims.exp) || claims.exp <= now || !Number.isFinite(claims.iat) || claims.iat > now+60 || claims.email_verified !== true || typeof claims.sub !== 'string' || !claims.sub) throw Error();
    const domain = env.GOOGLE_ALLOWED_DOMAIN.toLowerCase();
    if (claims.hd?.toLowerCase() !== domain || typeof claims.email !== 'string' || !claims.email.toLowerCase().endsWith('@'+domain)) throw Error();
    // A Workspace domain can include pupils: require an explicit staff roster.
    const email = claims.email.toLowerCase();
    const admins = (env.ADMIN_EMAILS || '').toLowerCase().split(',').map(x=>x.trim()).filter(Boolean);
    const staff = (env.STAFF_EMAILS || '').toLowerCase().split(',').map(x=>x.trim()).filter(Boolean);
    if (!admins.includes(email) && !staff.includes(email)) throw new HttpError(403, 'STAFF_ACCESS_REQUIRED');
    return { email, name: typeof claims.name === 'string' ? claims.name.slice(0,100) : email, admin: admins.includes(email) };
  } catch (error) { if (error instanceof HttpError) throw error; throw new HttpError(401,'SIGN_IN_REQUIRED'); }
}

