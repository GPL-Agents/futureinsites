'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { EventEmitter } = require('node:events');
const test = require('node:test');

const clientLogin = require('../api/client-login');

const PASSWORD = 'test-password';
const SALT = crypto.randomBytes(16);
const HASH = crypto.scryptSync(PASSWORD, SALT, 32, {
  N: 32768,
  r: 8,
  p: 1,
  maxmem: 64 * 1024 * 1024,
});

process.env.CLIENT_AUTH_CONFIG = JSON.stringify({
  trace: { salt: SALT.toString('base64url'), hash: HASH.toString('base64url') },
});
process.env.CLIENT_SESSION_SECRET = crypto.randomBytes(32).toString('base64url');

function createRequest(body, overrides = {}) {
  const request = new EventEmitter();
  request.method = overrides.method || 'POST';
  request.headers = { host: 'www.futureinsites.com', origin: 'https://www.futureinsites.com' };
  request.body = body;
  request[Symbol.asyncIterator] = async function* iterator() {};
  return request;
}

function createResponse() {
  const headers = new Map();
  return {
    statusCode: 200,
    body: '',
    setHeader(name, value) { headers.set(name.toLowerCase(), value); },
    getHeader(name) { return headers.get(name.toLowerCase()); },
    end(value = '') { this.body = value; },
  };
}

test('login returns a secure session and the requested protected page', async () => {
  const request = createRequest({
    workspace: 'trace',
    password: PASSWORD,
    next: '/clients/trace/introduction/',
  });
  const response = createResponse();
  await clientLogin(request, response);

  assert.equal(response.statusCode, 200);
  assert.equal(JSON.parse(response.body).redirect, '/clients/trace/introduction/');
  assert.match(response.getHeader('set-cookie'), /^__Host-fis_client_session=/);
  assert.match(response.getHeader('set-cookie'), /HttpOnly/);
});

test('login uses one generic response for wrong credentials', async () => {
  const wrongPasswordResponse = createResponse();
  await clientLogin(createRequest({ workspace: 'trace', password: 'wrong' }), wrongPasswordResponse);

  const wrongWorkspaceResponse = createResponse();
  await clientLogin(createRequest({ workspace: 'unknown', password: PASSWORD }), wrongWorkspaceResponse);

  assert.equal(wrongPasswordResponse.statusCode, 401);
  assert.equal(wrongWorkspaceResponse.statusCode, 401);
  assert.equal(wrongPasswordResponse.body, wrongWorkspaceResponse.body);
});

test('login rejects cross-origin submissions', async () => {
  const request = createRequest({ workspace: 'trace', password: PASSWORD });
  request.headers.origin = 'https://example.com';
  const response = createResponse();
  await clientLogin(request, response);
  assert.equal(response.statusCode, 403);
});
