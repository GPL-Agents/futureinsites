'use strict';

const { serializeClearedSessionCookie } = require('../lib/client-auth');

module.exports = function clientLogout(request, response) {
  if (request.method !== 'GET' && request.method !== 'POST') {
    response.statusCode = 405;
    response.setHeader('Allow', 'GET, POST');
    return response.end('Method not allowed.');
  }

  response.statusCode = 303;
  response.setHeader('Cache-Control', 'private, no-store');
  response.setHeader('Set-Cookie', serializeClearedSessionCookie());
  response.setHeader('Location', '/client-login?logged_out=1');
  response.end();
};
