/**
 * api/chat.js -- FutureInSites AI Chatbot (Vercel serverless)
 *
 * RAG over pre-indexed site content via Gemini.
 * Env: GEMINI_API_KEY (required)
 *       Knowledge embeddings loaded from ../knowledge/embeddings.json at cold start.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// ─── Load knowledge at cold start ───
let knowledge = null;
function loadKnowledge() {
  if (knowledge) return knowledge;
  const kp = path.join(process.cwd(), 'knowledge', 'embeddings.json');
  if (!fs.existsSync(kp)) {
    throw new Error('Knowledge file not found at knowledge/embeddings.json');
  }
  knowledge = JSON.parse(fs.readFileSync(kp, 'utf-8'));
  return knowledge;
}

// ─── Cosine similarity ───
function cosineSimilarity(a, b) {
  let dot = 0, ma = 0, mb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    ma += a[i] * a[i];
    mb += b[i] * b[i];
  }
  const denom = Math.sqrt(ma) * Math.sqrt(mb);
  return denom === 0 ? 0 : dot / denom;
}

// ─── Embed query ───
async function embedQuery(genAI, modelName, text) {
  const model = genAI.getGenerativeModel({ model: modelName });
  const resp = await model.embedContent({
    content: { role: 'user', parts: [{ text }] },
  });
  return resp.embedding.values;
}

// ─── Retrieve top chunks ───
function retrieve(queryEmbedding, chunks, topK = 5) {
  const scored = chunks.map(c => ({
    ...c,
    score: cosineSimilarity(queryEmbedding, c.embedding),
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

// ─── Format context ───
function formatContext(chunks) {
  return chunks
    .filter(c => c.score > 0.3)
    .map((c, i) => {
      const src = c.url ? `Source: ${c.url}` : `Source: ${c.source}`;
      return `[${i + 1}] ${src}\n${c.text}`;
    })
    .join('\n\n---\n\n');
}

// ─── System prompt ───
const SYSTEM_PROMPT = `You are the FutureInSites AI assistant. You answer questions about FutureInSites -- an AI Strategy & Engineering consultancy founded by Greg Loeffelholz.

Answer based ONLY on the context provided. If the context doesn't contain enough information to answer, say so clearly -- do not make up information.

When relevant, mention specific services: personal AI agent setup, AI readiness assessments, strategy & roadmaps, vendor selection, AI governance, build & integration, embedded AI engineering, team training, knowledge assistants, document intelligence, intake & communication, documentation automation, and operational analysis.

Keep answers concise and helpful. If the user asks about pricing, direct them to contact FutureInSites at strategy@futureinsites.com.

For questions about Greg Loeffelholz specifically, draw from his career narrative and resume when they are in the knowledge base.`;

// ─── Handler ───
module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, history } = req.body || {};
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
    const kb = loadKnowledge();
    const embedModelName = kb.model || 'text-embedding-004';
    const chatModelName = kb.chat_model || 'gemini-2.5-flash';

    // 1. Embed query
    const qEmb = await embedQuery(genAI, embedModelName, message);

    // 2. Retrieve
    const topChunks = retrieve(qEmb, kb.chunks);
    const context = formatContext(topChunks);

    // 3. Build messages
    const messages = [];
    if (SYSTEM_PROMPT) {
      messages.push({ role: 'user', parts: [{ text: SYSTEM_PROMPT }] });
      messages.push({ role: 'model', parts: [{ text: 'Understood. I will answer questions based only on the context provided.' }] });
    }
    if (Array.isArray(history)) {
      for (const h of history) {
        if (h.role === 'user' || h.role === 'model') {
          messages.push({ role: h.role, parts: [{ text: h.content || h.text || '' }] });
        }
      }
    }

    // If context was found, prepend it
    let userPrompt = message;
    if (context) {
      userPrompt = `Context from FutureInSites website:\n\n${context}\n\n---\n\nQuestion: ${message}`;
    }
    messages.push({ role: 'user', parts: [{ text: userPrompt }] });

    // 4. Stream response
    const model = genAI.getGenerativeModel({ model: chatModelName });
    const result = await model.generateContentStream({ contents: messages });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    // Append source citations as a final data event
    const sources = topChunks
      .filter(c => c.score > 0.3 && c.url)
      .map(c => ({ url: c.url, title: c.title || c.source }));

    if (sources.length > 0) {
      res.write(`data: ${JSON.stringify({ sources })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('/api/chat error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
