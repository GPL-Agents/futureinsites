'use strict';

const crypto = require('node:crypto');
const { promisify } = require('node:util');

const scrypt = promisify(crypto.scrypt);

const COOKIE_NAME = '__Host-fis_client_session';
const WORKSPACE_ENV_PREFIX = 'CLIENT_WORKSPACE_';
const DEFAULT_TTL_SECONDS = 8 * 60 * 60;
const MIN_TTL_SECONDS = 15 * 60;
const MAX_TTL_SECONDS = 24 * 60 * 60;
const SCRYPT_OPTIONS = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const HASH_LENGTH = 32;
const DUMMY_SALT = Buffer.from('FutureInSites-invalid-workspace', 'utf8');

class AuthConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthConfigurationError';
  }
}

function normalizeWorkspace(value) {
  if (typeof value !== 'string') return '';
  const workspace = value.trim().toLowerCase();
  return /^[a-z0-9][a-z0-9-]{1,62}$/.test(workspace) ? workspace : '';
}

function decodeBase64Url(value, label) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new AuthConfigurationError(`${label} is not valid base64url data.`);
  }

  try {
    return Buffer.from(value, 'base64url');
  } catch {
    throw new AuthConfigurationError(`${label} is not valid base64url data.`);
  }
}

function workspaceEnvName(workspaceValue) {
  const workspace = normalizeWorkspace(workspaceValue);
  if (!workspace) throw new TypeError('A valid workspace is required.');
  return `${WORKSPACE_ENV_PREFIX}${workspace.toUpperCase().replace(/-/g, '_')}`;
}

function workspaceFromEnvName(name) {
  if (typeof name !== 'string' || !name.startsWith(WORKSPACE_ENV_PREFIX)) return '';
  const suffix = name.slice(WORKSPACE_ENV_PREFIX.length);
  if (!/^[A-Z0-9_]+$/.test(suffix)) return '';
  return normalizeWorkspace(suffix.toLowerCase().replace(/_/g, '-'));
}

function parseCredential(workspace, credential, source) {
  if (!credential || Array.isArray(credential) || typeof credential !== 'object') {
    throw new AuthConfigurationError(`${source} contains an invalid workspace entry.`);
  }

  const salt = decodeBase64Url(credential.salt, `${workspace}.salt`);
  const hash = decodeBase64Url(credential.hash, `${workspace}.hash`);
  if (salt.length < 16 || hash.length !== HASH_LENGTH) {
    throw new AuthConfigurationError(`${source} contains invalid credentials for ${workspace}.`);
  }
  return { salt, hash };
}

function loadWorkspaceConfig(raw = process.env.CLIENT_AUTH_CONFIG, environment = process.env) {
  const workspaces = new Map();

  if (raw) {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new AuthConfigurationError('CLIENT_AUTH_CONFIG must be valid JSON.');
    }

    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      throw new AuthConfigurationError('CLIENT_AUTH_CONFIG must be a workspace map.');
    }

    for (const [key, credential] of Object.entries(parsed)) {
      const workspace = normalizeWorkspace(key);
      if (!workspace) {
        throw new AuthConfigurationError('CLIENT_AUTH_CONFIG contains an invalid workspace entry.');
      }
      workspaces.set(workspace, parseCredential(workspace, credential, 'CLIENT_AUTH_CONFIG'));
    }
  }

  if (environment && typeof environment === 'object') {
    for (const [name, rawCredential] of Object.entries(environment)) {
      const workspace = workspaceFromEnvName(name);
      if (!workspace) continue;

      let credential;
      try {
        credential = JSON.parse(rawCredential);
      } catch {
        throw new AuthConfigurationError(`${name} must be valid JSON.`);
      }
      workspaces.set(workspace, parseCredential(workspace, credential, name));
    }
  }

  if (workspaces.size === 0) {
    throw new AuthConfigurationError('No client workspace credentials are configured.');
  }

  return workspaces;
}

async function verifyWorkspacePassword(workspaceValue, passwordValue, rawConfig, environment) {
  const workspace = normalizeWorkspace(workspaceValue);
  const password = typeof passwordValue === 'string' ? passwordValue : '';
  const workspaces = loadWorkspaceConfig(rawConfig, environment);
  const credential = workspace ? workspaces.get(workspace) : undefined;

  if (!credential) {
    await scrypt(password, DUMMY_SALT, HASH_LENGTH, SCRYPT_OPTIONS);
    return { ok: false, workspace: '' };
  }

  const derived = await scrypt(password, credential.salt, HASH_LENGTH, SCRYPT_OPTIONS);
  return {
    ok: crypto.timingSafeEqual(derived, credential.hash),
    workspace,
  };
}

function loadSessionSecret(raw = process.env.CLIENT_SESSION_SECRET) {
  if (!raw) throw new AuthConfigurationError('CLIENT_SESSION_SECRET is not configured.');
  const secret = decodeBase64Url(raw, 'CLIENT_SESSION_SECRET');
  if (secret.length < 32) {
    throw new AuthConfigurationError('CLIENT_SESSION_SECRET must contain at least 32 random bytes.');
  }
  return secret;
}

function getSessionTtlSeconds(raw = process.env.CLIENT_SESSION_TTL_SECONDS) {
  if (!raw) return DEFAULT_TTL_SECONDS;
  const seconds = Number.parseInt(raw, 10);
  if (!Number.isFinite(seconds)) return DEFAULT_TTL_SECONDS;
  return Math.min(MAX_TTL_SECONDS, Math.max(MIN_TTL_SECONDS, seconds));
}

function createSessionToken(workspaceValue, options = {}) {
  const workspace = normalizeWorkspace(workspaceValue);
  if (!workspace) throw new TypeError('A valid workspace is required.');

  const now = Number.isFinite(options.now) ? Math.floor(options.now) : Math.floor(Date.now() / 1000);
  const ttl = Number.isFinite(options.ttl) ? options.ttl : getSessionTtlSeconds();
  const payload = Buffer.from(JSON.stringify({ v: 1, w: workspace, iat: now, exp: now + ttl }), 'utf8').toString('base64url');
  const signature = crypto.createHmac('sha256', loadSessionSecret(options.secret)).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function serializeSessionCookie(token, maxAge = getSessionTtlSeconds()) {
  return `${COOKIE_NAME}=${token}; Max-Age=${maxAge}; Path=/; HttpOnly; Secure; SameSite=Lax`;
}

function serializeClearedSessionCookie() {
  return `${COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax`;
}

function safeNextPath(nextValue, workspaceValue) {
  const workspace = normalizeWorkspace(workspaceValue);
  const fallback = workspace ? `/clients/${workspace}/portal` : '/client-login';
  if (!workspace || typeof nextValue !== 'string' || nextValue.length > 2048) return fallback;
  if (/[\\\u0000-\u001F\u007F]/.test(nextValue) || nextValue.includes('//')) return fallback;

  let url;
  try {
    url = new URL(nextValue, 'https://www.futureinsites.com');
  } catch {
    return fallback;
  }

  if (url.origin !== 'https://www.futureinsites.com') return fallback;
  const prefix = `/clients/${workspace}`;
  if (url.pathname !== prefix && !url.pathname.startsWith(`${prefix}/`)) return fallback;
  if (url.pathname === prefix || url.pathname === `${prefix}/`) {
    return `${prefix}/portal${url.search}${url.hash}`;
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

module.exports = {
  AuthConfigurationError,
  COOKIE_NAME,
  createSessionToken,
  getSessionTtlSeconds,
  normalizeWorkspace,
  safeNextPath,
  serializeClearedSessionCookie,
  serializeSessionCookie,
  verifyWorkspacePassword,
  workspaceEnvName,
};
