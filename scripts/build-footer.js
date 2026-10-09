#!/usr/bin/env node
// Stamps partials/footer.html into every page between the FOOTER markers.
//   node scripts/build-footer.js           update pages
//   node scripts/build-footer.js --check   exit 1 if any page is out of sync
//   node scripts/build-footer.js --init    also convert a page's existing <footer> into a marked block
// Case study pages keep their own footers and are never touched.

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const PARTIAL = fs.readFileSync(path.join(ROOT_DIR, 'partials', 'footer.html'), 'utf8')
  .replace(/^\s*<!--[\s\S]*?-->\s*/, '') // drop the partial's own header comment
  .trim();
const START = '<!-- FOOTER:START generated from partials/footer.html; edit that file, then run pnpm build:footer -->';
const END = '<!-- FOOTER:END -->';

const SKIP_DIRS = new Set(['.git', 'node_modules', 'archive', 'clients', 'tools', 'partials', '.vercel']);
const EXCLUDE = new Set([
  // Case studies keep their own footers
  'case-studies/lululemon.html', 'case-studies/tesla.html', 'case-studies/oracle.html',
  'case-studies/alphabet.html', 'case-studies/bibliography.html',
  // Unlisted personal pages ("Shared by direct link only")
  'internal/greg-loeffelholz.html', 'hire-greg.html',
]);

const args = new Set(process.argv.slice(2));
const CHECK = args.has('--check');
const INIT = args.has('--init');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.fuse_hidden')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(p, out); }
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function render(file) {
  const depth = path.relative(ROOT_DIR, path.dirname(file)).split(path.sep).filter(Boolean).length;
  const root = '../'.repeat(depth);
  const indent = '  ';
  const body = PARTIAL.replace(/\{\{ROOT\}\}/g, root).split('\n').map(l => (l ? indent + l : l)).join('\n');
  return `${indent}${START}\n${body}\n${indent}${END}`;
}

const blockRe = new RegExp(`[ \\t]*${START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${END}`);
const footerRe = /[ \t]*<footer[\s>][\s\S]*?<\/footer>/;

const stale = [];
const updated = [];
for (const file of walk(ROOT_DIR)) {
  const rel = path.relative(ROOT_DIR, file).split(path.sep).join('/');
  if (EXCLUDE.has(rel)) continue;
  const src = fs.readFileSync(file, 'utf8');
  const eol = src.includes('\r\n') ? '\r\n' : '\n';
  const block = render(file).replace(/\n/g, eol);
  let next = src;
  if (blockRe.test(src)) next = src.replace(blockRe, () => block);
  else if (INIT && footerRe.test(src)) next = src.replace(footerRe, () => block);
  else continue;
  if (next !== src) {
    stale.push(rel);
    if (!CHECK) { fs.writeFileSync(file, next); updated.push(rel); }
  }
}

if (CHECK) {
  if (stale.length) { console.error('Footer out of sync (run pnpm build:footer):\n  ' + stale.join('\n  ')); process.exit(1); }
  console.log('All footers in sync.');
} else {
  console.log(`Updated ${updated.length} page(s)` + (updated.length ? ':\n  ' + updated.join('\n  ') : '.'));
}
