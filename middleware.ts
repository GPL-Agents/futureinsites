import { next } from '@vercel/functions';

const COOKIE_NAME = '__Host-fis_client_session';

function normalizeWorkspace(value: string | undefined): string {
  if (!value) return '';
  const workspace = value.trim().toLowerCase();
  return /^[a-z0-9][a-z0-9-]{1,62}$/.test(workspace) ? workspace : '';
}

function getCookie(request: Request, name: string): string {
  const cookieHeader = request.headers.get('cookie') || '';
  for (const item of cookieHeader.split(';')) {
    const separator = item.indexOf('=');
    if (separator < 0) continue;
    if (item.slice(0, separator).trim() === name) return item.slice(separator + 1).trim();
  }
  return '';
}

function decodeBase64Url(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null;
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

  try {
    const binary = atob(padded);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  } catch {
    return null;
  }
}

async function verifySession(token: string, workspace: string): Promise<boolean> {
  const secretValue = process.env.CLIENT_SESSION_SECRET || '';
  const secret = decodeBase64Url(secretValue);
  if (!secret || secret.length < 32) return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payloadPart, signaturePart] = parts;
  const payloadBytes = decodeBase64Url(payloadPart);
  const signature = decodeBase64Url(signaturePart);
  if (!payloadBytes || !signature) return false;

  let payload: { v?: number; w?: string; iat?: number; exp?: number };
  try {
    payload = JSON.parse(new TextDecoder().decode(payloadBytes));
  } catch {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  if (
    payload.v !== 1 ||
    payload.w !== workspace ||
    !Number.isInteger(payload.iat) ||
    !Number.isInteger(payload.exp) ||
    payload.iat! > now + 60 ||
    payload.exp! <= now
  ) {
    return false;
  }

  const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  return crypto.subtle.verify(
    'HMAC',
    key,
    signature,
    new TextEncoder().encode(payloadPart),
  );
}

function loginRedirect(request: Request, workspace: string, reason = ''): Response {
  const requestUrl = new URL(request.url);
  const loginUrl = new URL('/client-login', requestUrl);
  if (workspace) loginUrl.searchParams.set('workspace', workspace);
  loginUrl.searchParams.set('next', `${requestUrl.pathname}${requestUrl.search}`);
  if (reason) loginUrl.searchParams.set('reason', reason);

  const headers = new Headers({
    'Cache-Control': 'private, no-store',
    Location: loginUrl.toString(),
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
  });
  if (reason) {
    headers.append('Set-Cookie', `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`);
  }
  return new Response(null, { status: 302, headers });
}

export default async function middleware(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const segments = url.pathname.split('/').filter(Boolean);
  const workspace = normalizeWorkspace(segments[1]);
  if (!workspace) return loginRedirect(request, '');

  const token = getCookie(request, COOKIE_NAME);
  if (!token) return loginRedirect(request, workspace);
  if (!(await verifySession(token, workspace))) return loginRedirect(request, workspace, 'expired');

  return next({
    headers: {
      'Cache-Control': 'private, no-store',
      Vary: 'Cookie',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
    },
  });
}

export const config = {
  matcher: ['/clients', '/clients/:path*'],
};
