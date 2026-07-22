/**
 * api/chat-test.js -- Simple debug endpoint for the chat function
 * GET /api/chat-test - returns health info
 */

const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  const results = {};

  // 1. Check API key
  results.hasApiKey = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  results.keyVar = process.env.GEMINI_API_KEY ? 'GEMINI_API_KEY' : (process.env.GOOGLE_API_KEY ? 'GOOGLE_API_KEY' : 'none');

  // 2. Check embeddings file
  const candidates = [
    path.join(__dirname, 'embeddings.json'),
    path.join(process.cwd(), 'knowledge', 'embeddings.json'),
    path.join(process.cwd(), 'api', 'embeddings.json'),
  ];
  results.embeddingsPaths = {};
  for (const kp of candidates) {
    const exists = fs.existsSync(kp);
    const size = exists ? fs.statSync(kp).size : 0;
    results.embeddingsPaths[kp] = { exists, size };
  }

  // 3. Check @google/generative-ai import
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI('test');
    if (genAI) results.geminiImport = 'ok';
  } catch (e) {
    results.geminiImport = e.message;
  }

  // 4. cwd
  results.cwd = process.cwd();
  results.dirname = __dirname;

  // 5. List files in cwd
  results.cwdFiles = fs.readdirSync(process.cwd()).slice(0, 20);

  res.json(results);
};
