/**
 * scripts/index-content.js
 *
 * Crawls FutureInSites pages, chunks content, generates Gemini embeddings,
 * and writes knowledge/embeddings.json for the RAG chatbot.
 *
 * Usage:  node scripts/index-content.js
 * Env:    GEMINI_API_KEY (required)
 *         GEMINI_MODEL  (optional, default gemini-2.5-flash)
 *         GEMINI_EMBEDDING_MODEL (optional, default gemini-embedding-2)
 */

const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'knowledge', 'sources.json');
const OUT = path.join(ROOT, 'knowledge', 'embeddings.json');

const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!GEMINI_KEY) {
  console.error('Missing GEMINI_API_KEY env var');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_KEY);
const embedModel = process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004';
const chatModelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// ─── HTML stripping ───
function stripHtml(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s{3,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractTitle(html) {
  const m = html.match(/<title>([^<]+)<\/title>/i);
  return m ? m[1].trim() : '';
}

function extractMetaDescription(html) {
  const m = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
  return m ? m[1].trim() : '';
}

// ─── Chunking ───
function chunkText(text, maxLen = 800, overlap = 100) {
  const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];
  const chunks = [];
  let current = '';
  for (const s of sentences) {
    if ((current + s).length > maxLen && current.length > 0) {
      chunks.push(current.trim());
      current = current.slice(-overlap) + ' ' + s;
    } else {
      current += ' ' + s;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

// ─── Read content ───
async function collectContent() {
  const sources = JSON.parse(fs.readFileSync(SRC, 'utf-8'));
  const items = [];

  // Root HTML pages
  for (const page of sources.pages) {
    const filePath = path.join(ROOT, page);
    if (!fs.existsSync(filePath)) {
      console.warn(`  SKIP (not found): ${page}`);
      continue;
    }
    const html = fs.readFileSync(filePath, 'utf-8');
    const title = extractTitle(html);
    const desc = extractMetaDescription(html);
    let text = stripHtml(html);
    // Truncate extremely long pages (like the main index)
    if (text.length > 15000) text = text.slice(0, 15000);
    items.push({ id: page, title, description: desc, text, url: `https://www.futureinsites.com/${page}` });
    console.log(`  OK: ${page} (${text.length} chars)`);
  }

  // Blog posts
  const blogDir = path.join(ROOT, 'blog');
  for (const entry of sources.blog) {
    const filePath = path.join(blogDir, entry);
    if (!fs.existsSync(filePath)) continue;
    const html = fs.readFileSync(filePath, 'utf-8');
    const title = extractTitle(html);
    let text = stripHtml(html);
    if (text.length > 8000) text = text.slice(0, 8000);
    items.push({ id: `blog/${entry}`, title, description: '', text, url: `https://www.futureinsites.com/blog/${entry}` });
    console.log(`  OK: blog/${entry} (${text.length} chars)`);
  }

  // Check for individual blog posts
  const blogEntries = fs.readdirSync(blogDir).filter(f => f.endsWith('.html') && f !== 'index.html' && f !== 'template.html');
  for (const f of blogEntries) {
    const filePath = path.join(blogDir, f);
    const html = fs.readFileSync(filePath, 'utf-8');
    const title = extractTitle(html);
    let text = stripHtml(html);
    if (text.length > 8000) text = text.slice(0, 8000);
    items.push({ id: `blog/${f}`, title, description: '', text, url: `https://www.futureinsites.com/blog/${f}` });
    console.log(`  OK: blog/${f} (${text.length} chars)`);
  }

  // Extra content files (career narrative, resume, etc.)
  for (const fp of sources.extra_content_files) {
    const filePath = path.join(ROOT, fp);
    if (!fs.existsSync(filePath)) {
      console.warn(`  SKIP (not found): ${fp}`);
      continue;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const name = path.basename(fp, path.extname(fp));
    items.push({ id: fp, title: name, description: '', text: content.slice(0, 20000), url: '' });
    console.log(`  OK: ${fp} (${content.length} chars)`);
  }

  return items;
}

// ─── Embedding ───
async function embed(texts) {
  const results = [];
  const batchSize = 100;
  const model = genAI.getGenerativeModel({ model: embedModel });

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const requests = batch.map(t => ({
      model: `models/${embedModel}`,
      content: { role: 'user', parts: [{ text: t }] },
    }));
    const resp = await model.batchEmbedContents({ requests });
    results.push(...resp.embeddings.map(e => e.values));
    console.log(`  Embeddings batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)} complete`);
    if (i + batchSize < texts.length) await new Promise(r => setTimeout(r, 300));
  }
  return results;
}

// ─── Main ───
async function main() {
  console.log('┌─────────────────────────────────────────┐');
  console.log('│ FutureInSites Content Indexer            │');
  console.log('└─────────────────────────────────────────┘');
  console.log(`Embedding model: ${embedModel}`);
  console.log(`Chat model:      ${chatModelName}\n`);

  // 1. Collect content
  console.log('Collecting content...');
  const items = await collectContent();
  console.log(`\nTotal source items: ${items.length}`);

  // 2. Chunk
  console.log('\nChunking...');
  const chunks = [];
  for (const item of items) {
    const itemChunks = chunkText(item.text);
    for (let i = 0; i < itemChunks.length; i++) {
      chunks.push({
        id: `${item.id}#${i}`,
        source: item.id,
        title: item.title,
        url: item.url,
        description: item.description,
        text: itemChunks[i],
      });
    }
  }
  console.log(`Total chunks: ${chunks.length}`);

  // 3. Embed
  console.log('\nGenerating embeddings...');
  const texts = chunks.map(c => c.text);
  const vectors = await embed(texts);
  console.log(`\nEmbeddings generated: ${vectors.length}`);

  // 4. Write output
  const output = {
    model: embedModel,
    chat_model: chatModelName,
    generated: new Date().toISOString(),
    chunks: chunks.map((c, i) => ({
      id: c.id,
      source: c.source,
      title: c.title,
      url: c.url,
      description: c.description,
      text: c.text,
      embedding: vectors[i],
    })),
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(output));
  console.log(`\n✓ Written to ${OUT}`);
  console.log(`  ${chunks.length} chunks, ${vectors.length} embeddings`);
  console.log(`  Size: ${(Buffer.byteLength(JSON.stringify(output)) / 1024 / 1024).toFixed(1)} MB`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
