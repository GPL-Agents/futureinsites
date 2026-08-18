'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

test('client pages do not contain browser-side credential gates', () => {
  const sources = [
    read('clients/trace/client.js'),
    read('clients/trace/index.html'),
    read('clients/trace/portal.html'),
    read('clients/trace/introduction/index.html'),
    read('clients/combuilders/client.js'),
    read('clients/combuilders/index.html'),
    read('clients/combuilders/portal.html'),
  ].join('\n');

  assert.doesNotMatch(sources, /passwordHash/);
  assert.doesNotMatch(sources, /sessionStorage/);
  assert.doesNotMatch(sources, /crypto\.subtle\.digest/);
});

test('login page sends credentials only to the server endpoint', () => {
  const source = read('client-login.html');
  assert.match(source, /fetch\('\/api\/client-login'/);
  assert.doesNotMatch(source, /localStorage|sessionStorage/);
  assert.doesNotMatch(source, /password[^\n]{0,80}(query|searchParams)/i);
});
