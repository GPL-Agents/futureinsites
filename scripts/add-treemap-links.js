#!/usr/bin/env node
// add-treemap-links.js
// Post-processes landscape-ai.svg so every vendor logo links to that company's
// site. URLs come from the vendor directory cards in landscape/index.html.
// Re-run this after regenerating the treemap with scripts/build-treemap.js.
//
// Mapping: an <image> embeds a logo as a base64 data URI. Primary key is the
// vendor name <text> that immediately follows the image (unique per vendor);
// fallback is matching the decoded bytes to a file in images/vendor-logos/.
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
//    Each card is <a href="URL" ... class="vendor-card"> ... </a>, so anchor on
//    the whole element -- the href precedes the class attribute in the same tag.
const dirHtml = fs.readFileSync(DIRECTORY, 'utf8');
const byFile = new Map();
const byName = new Map();
let cardCount = 0;
const CARD = /<a\s+href="([^"]+)"[^>]*class="vendor-card"[^>]*>([\s\S]*?)<\/a>/g;
let cm;
while ((cm = CARD.exec(dirHtml))) {
  cardCount++;
  const url = cm[1];
  const inner = cm[2];
  const file = (inner.match(/vendor-logos\/([^"?]+)"/) || [])[1];
  const name = (inner.match(/class="vendor-name">([^<]+)</) || [])[1];
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
let linked = 0, byNameHits = 0, byFileHits = 0;
const unmatched = [];
svg = svg.replace(IMG, (full, mime, b64, offset) => {
  const tail = svg.slice(offset + full.length, offset + full.length + 500);
  const label = (tail.match(/>([^<>]{1,60})<\/text>/) || [])[1];
  const labelName = label ? label.trim().replace(/&amp;/g, '&') : null;
  let url = labelName ? byName.get(labelName) : null;
  if (url) byNameHits++;
  if (!url) {
    const buf = Buffer.from(b64, 'base64');
    const file = hash2file.get(crypto.createHash('sha1').update(buf).digest('hex'));
    url = file ? byFile.get(file) : null;
    if (url) byFileHits++;
    if (!url) { unmatched.push(labelName || file || '(unknown)'); return full; }
  }
  linked++;
  return `<a href="${url}" target="_blank" rel="noopener">${full}</a>`;
});

// 5) Add a small hover affordance once.
if (!svg.includes('id="treemap-link-style"')) {
  svg = svg.replace('</svg>', '<style id="treemap-link-style">a{cursor:pointer}a:hover image{opacity:.72}</style>\n</svg>');
}

fs.writeFileSync(SVG, svg, 'utf8');
console.log(`directory cards: ${cardCount} | names: ${byName.size} | files: ${byFile.size}`);
console.log(`treemap links: ${linked} linked (by name ${byNameHits}, by file ${byFileHits}), ${unmatched.length} unmatched`);
if (unmatched.length) console.log('unmatched:', unmatched.join(', '));
