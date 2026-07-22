// build-treemap.js -- Generate AI Tech Landscape SVG treemap from JSON data
// Embeds logos as base64 data URIs so SVG works in <img> tags.
// Uses vendor prominence tiers for non-uniform cell sizing.
// Run: node scripts/build-treemap.js
// Output: futureinsites-site/repo/landscape-ai.svg

const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data', 'landscape-data.json');
const REPO = path.join(__dirname, '..', 'futureinsites-site', 'repo');
const LOGO_DIR = path.join(REPO, 'images', 'vendor-logos');

const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));

// ─── Layout Constants ───
const W = 6000;
const H = 3600;
const MAP_Y = 280;
const MAP_BOTTOM = 3450;
const MAP_W = 5900;
const MAP_H = MAP_BOTTOM - MAP_Y;
const PAD = 8;
const INNER_PAD = 4;
const CORNER_R = 8;

// ─── Category Colors ───
const CAT_COLORS = [
  { header: 'rgb(124, 58, 237)', bg: 'rgba(124,58,237,0.14)', stroke: 'rgb(124,58,237)' },
  { header: 'rgb(59, 130, 246)', bg: 'rgba(59,130,246,0.14)', stroke: 'rgb(59,130,246)' },
  { header: 'rgb(6, 182, 212)', bg: 'rgba(6,182,212,0.14)', stroke: 'rgb(6,182,212)' },
  { header: 'rgb(34, 197, 94)', bg: 'rgba(34,197,94,0.14)', stroke: 'rgb(34,197,94)' },
  { header: 'rgb(234, 179, 8)', bg: 'rgba(234,179,8,0.14)', stroke: 'rgb(234,179,8)' },
  { header: 'rgb(249, 115, 22)', bg: 'rgba(249,115,22,0.14)', stroke: 'rgb(249,115,22)' },
  { header: 'rgb(239, 68, 68)', bg: 'rgba(239,68,68,0.14)', stroke: 'rgb(239,68,68)' },
  { header: 'rgb(236, 72, 153)', bg: 'rgba(236,72,153,0.14)', stroke: 'rgb(236,72,153)' },
  { header: 'rgb(20, 184, 166)', bg: 'rgba(20,184,166,0.14)', stroke: 'rgb(20,184,166)' },
  { header: 'rgb(99, 102, 241)', bg: 'rgba(99,102,241,0.14)', stroke: 'rgb(99,102,241)' },
  { header: 'rgb(244, 63, 94)', bg: 'rgba(244,63,94,0.14)', stroke: 'rgb(244,63,94)' },
  { header: 'rgb(251, 146, 60)', bg: 'rgba(251,146,60,0.14)', stroke: 'rgb(251,146,60)' },
  { header: 'rgb(52, 211, 153)', bg: 'rgba(52,211,153,0.14)', stroke: 'rgb(52,211,153)' },
  { header: 'rgb(196, 181, 253)', bg: 'rgba(196,181,253,0.14)', stroke: 'rgb(196,181,253)' },
];

// ─── Logo Cache (embed as base64) ───
const LOGO_CACHE = new Map();

function embedLogo(logoPath) {
  if (!logoPath) return null;
  if (LOGO_CACHE.has(logoPath)) return LOGO_CACHE.get(logoPath);
  try {
    const fullPath = path.join(REPO, logoPath);
    const buf = fs.readFileSync(fullPath);
    const ext = path.extname(logoPath).toLowerCase().slice(1) || 'png';
    const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
    const b64 = buf.toString('base64');
    const uri = `data:${mime};base64,${b64}`;
    LOGO_CACHE.set(logoPath, uri);
    return uri;
  } catch {
    LOGO_CACHE.set(logoPath, null);
    return null;
  }
}

// ─── Prominence-based weighting ───
// Within each category, top players get larger cells.
// "Heavy" vendors (Tier 1) get more area, "mid" get standard, "light" get less.
function assignWeights(categories) {
  for (const cat of categories) {
    const n = cat.vendors.length;
    const tier1 = Math.max(1, Math.floor(n * 0.15));
    const tier3 = Math.max(1, Math.floor(n * 0.25));
    cat.vendors.forEach((v, i) => {
      if (i < tier1) v.weight = 2.5;
      else if (i >= n - tier3) v.weight = 0.6;
      else v.weight = 1.0;
    });
  }
}

// ─── Treemap Layout ───
// Categories laid out in rows proportional to total weight.
// Within each category, vendors use a squarified layout where cell size = weight.
function layoutTreemap(categories, availW, availH) {
  const totalWeight = categories.reduce((s, c) => s + c.vendors.reduce((sw, v) => sw + (v.weight || 1), 0), 0);
  const availArea = availW * availH;
  const areaPerWeight = availArea / totalWeight;

  // Arrange categories into rows by weight
  const numRowsTarget = 5;
  const avgRowWeight = totalWeight / numRowsTarget;
  const catRows = [];
  let curRow = [];
  let curRowW = 0;

  for (const cat of categories) {
    const catW = cat.vendors.reduce((s, v) => s + (v.weight || 1), 0);
    if (curRow.length > 0 && curRowW + catW > avgRowWeight * 1.25) {
      catRows.push(curRow);
      curRow = [];
      curRowW = 0;
    }
    curRow.push(cat);
    curRowW += catW;
  }
  if (curRow.length > 0) catRows.push(curRow);

  const numRows = catRows.length;
  const rowHeight = MAP_H / numRows;
  let y = MAP_Y;

  for (const row of catRows) {
    const rowWeight = row.reduce((s, c) => s + c.vendors.reduce((sw, v) => sw + (v.weight || 1), 0), 0);
    let x = 50;
    for (const cat of row) {
      const catWeight = cat.vendors.reduce((s, v) => s + (v.weight || 1), 0);
      const catW = (catWeight / rowWeight) * MAP_W;
      cat.x = x;
      cat.y = y;
      cat.w = catW;
      cat.h = rowHeight - PAD;
      x += catW + PAD;
    }
    y += rowHeight;
  }

  // Within each category, layout vendors proportional to weight
  for (const cat of categories) {
    const vendors = cat.vendors;
    const totalW = vendors.reduce((s, v) => s + (v.weight || 1), 0);
    const cw = cat.w - INNER_PAD * 2;
    const ch = cat.h - 50;
    const catArea = cw * ch;
    const areaPerUnit = catArea / totalW;

    // Estimate cells per row by average cell width
    const avgCellW = Math.sqrt(areaPerUnit);
    const cols = Math.max(1, Math.floor(cw / avgCellW));

    // Build a row-based layout where each row can have variable cell widths
    let vx = cat.x + INNER_PAD;
    let vy = cat.y + 46;
    const maxRows = 30;
    let ri = 0;

    for (const v of vendors) {
      if (ri >= maxRows) break;
      const cellArea = (v.weight || 1) * areaPerUnit;
      const cellW = cellArea / (ch / ((vendors.length + cols - 1) / cols));
      const cellH = ch / Math.ceil(vendors.length / cols);

      // Check if we need to wrap to next row
      if (vx + cellW > cat.x + cat.w - INNER_PAD) {
        vx = cat.x + INNER_PAD;
        vy += cellH + 2;
      }

      v.vx = vx;
      v.vy = vy;
      v.vw = Math.max(4, cellW - 2);
      v.vh = Math.max(4, cellH - 2);
      vx += cellW + 2;
      ri++;
    }

    // Second pass: if we hit maxRows, distribute remaining vendors uniformly
    if (ri >= maxRows && ri < vendors.length) {
      const remaining = vendors.length - ri;
      const remCols = Math.ceil(remaining / 5);
      const remW = cw / remCols;
      const remH = ch / 5;
      let rx = cat.x + INNER_PAD;
      let ry = vy + remH;
      for (let i = ri; i < vendors.length; i++) {
        const v = vendors[i];
        if (rx + remW > cat.x + cat.w - INNER_PAD) {
          rx = cat.x + INNER_PAD;
          ry += remH + 1;
        }
        v.vx = rx;
        v.vy = ry;
        v.vw = Math.max(3, remW - 1);
        v.vh = Math.max(3, remH - 1);
        rx += remW + 1;
      }
    }
  }
}

// ─── Helpers ───
function escapeXml(s) {
  let t = (s || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function makeVendorEl(v) {
  const x = v.vx, y = v.vy, w = v.vw, h = v.vh;
  if (w < 2 || h < 2) return '';

  const r = 3;
  const bg = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ry="${r}" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/>`;

  let logoEl = '';
  const logoUri = embedLogo(v.logo);
  if (logoUri) {
    const lw = Math.min(Math.min(w - 8, h * 0.5), 32);
    const lh = lw;
    const lx = x + (w - lw) / 2;
    const ly = y + 6;
    logoEl = `<image x="${lx}" y="${ly}" width="${lw}" height="${lh}" href="${logoUri}" preserveAspectRatio="xMidYMid meet"/>`;
  }

  // Name label below logo or centered if no logo
  const fontSize = Math.min(22, Math.max(8, w * 0.09));
  const label = escapeXml(v.name);
  const labelY = y + h - 7;
  const textEl = h > 18
    ? `<text x="${x + w/2}" y="${labelY}" font-size="${fontSize}" fill="rgba(255,255,255,0.8)" font-weight="500" text-anchor="middle">${label}</text>`
    : '';

  return `${bg}${logoEl}${textEl}`;
}

function makeCategoryEl(cat, idx) {
  const color = CAT_COLORS[idx % CAT_COLORS.length];
  const x = cat.x, y = cat.y, w = cat.w, h = cat.h;
  const headerH = 40;

  const bg = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${CORNER_R}" ry="${CORNER_R}" fill="${color.bg}" stroke="${color.stroke}" stroke-width="2"/>`;
  const hp = `M ${x} ${y + headerH} L ${x} ${y + CORNER_R} Q ${x} ${y} ${x + CORNER_R} ${y} L ${x + w - CORNER_R} ${y} Q ${x + w} ${y} ${x + w} ${y + CORNER_R} L ${x + w} ${y + headerH} Z`;
  const header = `<path d="${hp}" fill="${color.header}"/>`;

  const label = `${String(idx + 1).padStart(2, '0')}. ${escapeXml(cat.title)}`;
  const titleEl = `<text x="${x + 10}" y="${y + 26}" font-size="20" font-weight="800" fill="#FFFFFF" letter-spacing="-0.3">${label}</text>`;
  const countEl = `<text x="${x + w - 10}" y="${y + 26}" font-size="16" font-weight="700" fill="rgba(255,255,255,0.7)" text-anchor="end">${cat.vendors.length}</text>`;

  const vendorEls = cat.vendors.map(v => makeVendorEl(v)).join('\n');

  return `<g>\n${bg}\n${header}\n${titleEl}\n${countEl}\n${vendorEls}\n</g>`;
}

function makeLegend() {
  return cats.map((cat, i) => {
    const col = CAT_COLORS[i % CAT_COLORS.length];
    const rx = 80 + (i % 7) * 830;
    const ry = 3510 + Math.floor(i / 7) * 28;
    return `<rect x="${rx}" y="${ry}" width="14" height="14" rx="3" ry="3" fill="${col.header}"/><text x="${rx + 20}" y="${ry + 12}" font-size="16" fill="rgba(255,255,255,0.7)">${escapeXml(cat.title)}</text>`;
  }).join('\n');
}

// ─── Build ───
const cats = [...data.categories];
cats.sort((a, b) => b.vendors.length - a.vendors.length);
cats.forEach(c => c.vendors.sort((a, b) => a.name.localeCompare(b.name)));

assignWeights(cats);
layoutTreemap(cats, MAP_W, MAP_H);

const totalVendors = cats.reduce((s, c) => s + c.vendors.length, 0);
const totalCats = cats.length;
const now = new Date();
const verLabel = `${now.toLocaleString('en-US', { month: 'long' })} ${now.getFullYear()}`;

const svgParts = [];

svgParts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" font-family="Manrope, system-ui, sans-serif" role="img" aria-label="AI Tech Landscape">
<rect width="${W}" height="${H}" fill="#0B0C10"/>`);

// Title
svgParts.push(`<g transform="translate(${W/2}, 130)" text-anchor="middle">
  <text font-size="72" font-weight="800" fill="#FFFFFF" letter-spacing="-2">AI Tech Landscape ${verLabel}</text>
  <text y="60" font-size="28" font-weight="500" fill="rgba(255,255,255,0.5)">${totalVendors} vendors across ${totalCats} categories</text>
</g>`);

// Categories
cats.forEach((cat, i) => svgParts.push(makeCategoryEl(cat, i)));

// Legend
svgParts.push(`<g>${makeLegend()}</g>`);

// Footer
svgParts.push(`<g transform="translate(${W/2}, 3570)" text-anchor="middle">
  <text font-size="16" fill="rgba(255,255,255,0.3)">Source: futureinsites.com/ai-vendor-landscape  |  Updated ${verLabel}  |  futureinsites.com</text>
</g>`);

svgParts.push(`</svg>`);

// ─── Write ───
const svg = svgParts.join('\n');
const outPath = path.join(REPO, 'landscape-ai.svg');
fs.writeFileSync(outPath, svg, 'utf8');
const kb = (Buffer.byteLength(svg) / 1024).toFixed(1);
console.log(`Generated: landscape-ai.svg (${kb} KB)`);
console.log(`  ${totalVendors} vendors across ${totalCats} categories`);
console.log(`  Logos embedded as base64: ${LOGO_CACHE.size}`);
console.log(`  ${verLabel} Edition`);
