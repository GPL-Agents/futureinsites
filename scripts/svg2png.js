const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

const REPO = path.join(__dirname, '..');
const SVG_PATH = path.join(REPO, 'landscape-ai.svg');
const PNG_PATH = path.join(REPO, 'images', 'landscape-ai-thumb.png');

async function main() {
  const svg = fs.readFileSync(SVG_PATH, 'utf8');

  const canvas = createCanvas(2000, 1200);
  const ctx = canvas.getContext('2d');

  const dataUri = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
  const img = await loadImage(dataUri);

  ctx.drawImage(img, 0, 0, 2000, 1200);

  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(PNG_PATH, buf);
  console.log('Thumbnail saved:', PNG_PATH, '(' + (buf.length / 1024).toFixed(1) + ' KB)');
}

main().catch(console.error);
