#!/usr/bin/env node
// add-treemap-links.js
// Post-processes landscape-ai.svg so every vendor logo is a link to that
// company's site. URLs come from the vendor directory cards in
// landscape/index.html. Re-run this after regenerating the treemap with
// scripts/build-treemap.js.
//
// Mapping: an <image> embeds a logo as a base64 data URI. We match the decoded
// bytes to a file in images/vendor-logos/, then look up that file's card URL.
// Fallback: match the vendor name text that follows the image to a card name.
//
// Run: node scripts/add-treemap-links.js

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const SVG = path.join(ROOT, 'landscape-ai.svg');
const DIRECTORY = path.join(ROOT, 'landscape', 'index.html');
const LOGO_DIR = path.join(ROOT, 'images', 'vendor-logos');

// 1) Build the vendor maps from the directory page.
const dirHtml = fs.readFileSync(DIRECTORY, 'utf8');
const cards = dirHtml.split('class="vendor-card"').slice(1);
const byFile = new Map();
const byName = new Map();
for (const ch of cards) {
  const url = (ch.match(/href="([^"]+)"/) || [])[1];
  if (!url) continue;
  const file = (ch.match(/vendor-logos\/([^"?]+)"/) || [])[1];
  const name = (ch.match(/class="vendor-name">([^<]+)</) || [])[1];
  if (name) byName.set(name.trim().replace(/&amp;/g, '&'), url);
  if (file) byFile.set(file, url);
}

// 2) Hash every logo file so we can identify embedded images.
const hash2file = new Map();
for (const f of fs.readdirSync(LOGO_DIR)) {
  const b = fs.readFileSync(path.join(LOGO_DIR, f));
  hash2file.set(crypto.createHash('sha1').update(b).digest('hex'), f);
}

let svg = fs.readFileSync(SVG, 'utf8');

// 3) Idempotent: unwrap any links we added previously.
svg = svg.replace(/<a\b[^>]*>\s*(<image\b[^>]*\/>)\s*<\/a>/g, '$1');

// 4) Wrap each logo <image> with its company link.
const IMG = /<image\b[^>]*href="data:([^;]+);base64,([A-Za-z0-9+/=]+)"[^>]*\/>/g;
let linked = 0;
const unmatched = [];
svg = svg.replace(IMG, (full, mime, b64, offset) => {
  const buf = Buffer.from(b64, 'base64');
  const file = hash2file.get(crypto.createHash('sha1').update(buf).digest('hex'));
  let url = file ? byFile.get(file) : null;
  if (!url) {
    const tail = svg.slice(offset + full.length, offset + full.length + 500);
    const t = (tail.match(/>([^<>]{2,60})<\/text>/) || [])[1];
    if (t) url = byName.get(t.trim().replace(/&amp;/g, '&'));
  }
  if (!url) { unmatched.push(file || '(unknown)'); return full; }
  linked++;
  return `<a href="${url}" target="_blank" rel="noopener">${full}</a>`;
});

// 5) Add a small hover affordance once.
if (!svg.includes('id="treemap-link-style"')) {
  svg = svg.replace('</svg>', '<style id="treemap-link-style">a{cursor:pointer}a:hover image{opacity:.72}</style>\n</svg>');
}

fs.writeFileSync(SVG, svg, 'utf8');
console.log(`treemap links: ${linked} logos linked, ${unmatched.length} unmatched`);
if (unmatched.length) console.log('unmatched:', unmatched.join(', '));
