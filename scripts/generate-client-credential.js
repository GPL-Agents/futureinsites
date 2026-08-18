'use strict';

const crypto = require('node:crypto');
const { normalizeWorkspace, workspaceEnvName } = require('../lib/client-auth');

const PASSWORD_LENGTH = 18;
const PASSWORD_CHARACTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
const SCRYPT_OPTIONS = { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

function generatePassword() {
  let password = '';
  for (let index = 0; index < PASSWORD_LENGTH; index += 1) {
    password += PASSWORD_CHARACTERS[crypto.randomInt(PASSWORD_CHARACTERS.length)];
  }
  return password;
}

function fail(message) {
  console.error(message);
  console.error('Usage: node scripts/generate-client-credential.js <workspace> [password]');
  process.exitCode = 1;
}

const workspace = normalizeWorkspace(process.argv[2]);
if (!workspace) {
  fail('Workspace must be lowercase letters, numbers, or hyphens and at least two characters long.');
} else {
  const password = process.argv[3] || generatePassword();
  if (password.length < 12 || password.length > 256) {
    fail('Password must contain between 12 and 256 characters.');
  } else {
    const salt = crypto.randomBytes(16);
    const hash = crypto.scryptSync(password, salt, 32, SCRYPT_OPTIONS);
    const credential = JSON.stringify({
      salt: salt.toString('base64url'),
      hash: hash.toString('base64url'),
    });

    console.log(`Workspace: ${workspace}`);
    console.log(`Environment variable: ${workspaceEnvName(workspace)}`);
    console.log(`Value: ${credential}`);
    console.log(`Password: ${password}`);
    console.log('Store the password securely. Only the generated credential value belongs in Vercel.');
  }
}
