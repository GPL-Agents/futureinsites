'use strict';

const {
  AuthConfigurationError,
  createSessionToken,
  getSessionTtlSeconds,
  normalizeWorkspace,
  safeNextPath,
  serializeSessionCookie,
  verifyWorkspacePassword,
} = require('../lib/client-auth');

const MAX_BODY_BYTES = 4096;

function sendJson(response, status, body, extraHeaders = {}) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'private, no-store');
  for (const [name, value] of Object.entries(extraHeaders)) response.setHeader(name, value);
  response.end(JSON.stringify(body));
}

function requestOriginIsAllowed(request) {
  const origin = request.headers.origin;
  if (!origin) return true;

  try {
    return new URL(origin).host === request.headers.host;
  } catch {
    return false;
  }
}

async function readJsonBody(request) {
  if (request.body && typeof request.body === 'object') return request.body;
  if (typeof request.body === 'string') return JSON.parse(request.body);

  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) throw new Error('Request body is too large.');
  }
  return body ? JSON.parse(body) : {};
}

module.exports = async function clientLogin(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { error: 'Method not allowed.' });
  }

  if (!requestOriginIsAllowed(request)) {
    return sendJson(response, 403, { error: 'Request origin was not accepted.' });
  }

  let body;
  try {
    body = await readJsonBody(request);
  } catch {
    return sendJson(response, 400, { error: 'Invalid request.' });
  }

  const workspace = normalizeWorkspace(body.workspace);
  const password = typeof body.password === 'string' ? body.password : '';
  if (!workspace || password.length < 1 || password.length > 256) {
    return sendJson(response, 401, { error: 'Invalid workspace or password.' });
  }

  try {
    const result = await verifyWorkspacePassword(workspace, password);
    if (!result.ok) return sendJson(response, 401, { error: 'Invalid workspace or password.' });

    const maxAge = getSessionTtlSeconds();
    const token = createSessionToken(result.workspace, { ttl: maxAge });
    const redirect = safeNextPath(body.next, result.workspace);
    return sendJson(
      response,
      200,
      { ok: true, redirect },
      { 'Set-Cookie': serializeSessionCookie(token, maxAge) },
    );
  } catch (error) {
    if (error instanceof AuthConfigurationError) {
      console.error(`[client-login] ${error.message}`);
      return sendJson(response, 503, { error: 'Client sign-in is temporarily unavailable. Please contact support.' });
    }

    console.error('[client-login] Unexpected authentication error.', error);
    return sendJson(response, 500, { error: 'Client sign-in is temporarily unavailable. Please contact support.' });
  }
};
