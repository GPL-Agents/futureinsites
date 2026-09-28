const { test } = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

test('every page footer matches partials/footer.html', () => {
  const r = spawnSync(process.execPath, [path.join(__dirname, '..', 'scripts', 'build-footer.js'), '--check'], { encoding: 'utf8' });
  assert.strictEqual(r.status, 0, r.stderr);
});
