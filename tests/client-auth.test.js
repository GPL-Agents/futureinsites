'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const test = require('node:test');

const {
  COOKIE_NAME,
  createSessionToken,
  normalizeWorkspace,
  safeNextPath,
  serializeSessionCookie,
  verifyWorkspacePassword,
} = require('../lib/client-auth');

const TEST_PASSWORD = 'correct horse battery staple';
const TEST_SALT = crypto.randomBytes(16);
const TEST_HASH = crypto.scryptSync(TEST_PASSWORD, TEST_SALT, 32, {
  N: 32768,
  r: 8,
  p: 1,
  maxmem: 64 * 1024 * 1024,
});
const TEST_CONFIG = JSON.stringify({
  trace: {
    salt: TEST_SALT.toString('base64url'),
    hash: TEST_HASH.toString('base64url'),
  },
});
const TEST_SECRET = crypto.randomBytes(32).toString('base64url');

test('workspace names are normalized and constrained', () => {
  assert.equal(normalizeWorkspace(' TRACE '), 'trace');
  assert.equal(normalizeWorkspace('a'), '');
  assert.equal(normalizeWorkspace('../trace'), '');
});

test('password verification accepts only the configured workspace password', async () => {
  assert.deepEqual(
    await verifyWorkspacePassword('TRACE', TEST_PASSWORD, TEST_CONFIG),
    { ok: true, workspace: 'trace' },
  );
  assert.equal((await verifyWorkspacePassword('trace', 'wrong', TEST_CONFIG)).ok, false);
  assert.equal((await verifyWorkspacePassword('unknown', TEST_PASSWORD, TEST_CONFIG)).ok, false);
});

test('session token contains an expiry and is signed', () => {
  const token = createSessionToken('trace', { now: 1000, ttl: 3600, secret: TEST_SECRET });
  const [payloadPart, signaturePart] = token.split('.');
  const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8'));
  const expectedSignature = crypto.createHmac('sha256', Buffer.from(TEST_SECRET, 'base64url'))
    .update(payloadPart)
    .digest('base64url');

  assert.deepEqual(payload, { v: 1, w: 'trace', iat: 1000, exp: 4600 });
  assert.equal(signaturePart, expectedSignature);
});

test('session cookie is secure and unavailable to browser scripts', () => {
  const cookie = serializeSessionCookie('token', 3600);
  assert.match(cookie, new RegExp(`^${COOKIE_NAME}=token;`));
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Path=\//);
});

test('post-login redirects remain inside the authenticated workspace', () => {
  assert.equal(
    safeNextPath('/clients/trace/introduction/?slide=2', 'trace'),
    '/clients/trace/introduction/?slide=2',
  );
  assert.equal(safeNextPath('/clients/acme/', 'trace'), '/clients/trace/');
  assert.equal(safeNextPath('https://example.com/', 'trace'), '/clients/trace/');
  assert.equal(safeNextPath('//example.com/clients/trace', 'trace'), '/clients/trace/');
});
