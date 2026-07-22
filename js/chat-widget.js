/**
 * js/chat-widget.js -- FutureInSites AI Chatbot Widget
 *
 * Drop into any page to add a floating chat bubble.
 *
 * Usage:
 *   <script src="/js/chat-widget.js" defer></script>
 *
 * Config data attributes on the script tag:
 *   data-api-url="/api/chat" (default)
 *   data-position="bottom-right" (default)
 *   data-greeting="Hi! Ask me anything about FutureInSites..."
 */

(function () {
  'use strict';

  // ─── Config ───
  const script = document.currentScript;
  const API_URL = script?.getAttribute('data-api-url') || '/api/chat';
  const GREETING = script?.getAttribute('data-greeting') || "Hi! I'm the FutureInSites assistant. Ask me about our services, team, approach, or anything on the site.";

  // ─── Inject CSS ───
  const style = document.createElement('style');
  style.textContent = `
    #fis-chat-bubble {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
    }

    #fis-chat-toggle {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #2563EB;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(37,99,235,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
      position: relative;
      color: #fff;
    }

    #fis-chat-toggle:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 24px rgba(37,99,235,0.4);
    }

    #fis-chat-toggle svg {
      width: 24px;
      height: 24px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    #fis-chat-toggle .close-icon { display: none; }
    #fis-chat-toggle.open .chat-icon { display: none; }
    #fis-chat-toggle.open .close-icon { display: block; }

    #fis-chat-panel {
      position: fixed;
      bottom: 92px;
      right: 24px;
      width: 380px;
      height: 560px;
      max-height: calc(100vh - 140px);
      max-width: calc(100vw - 48px);
      background: #FFFFFF;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.15);
      border: 1px solid #E2E8F0;
      display: none;
      flex-direction: column;
      overflow: hidden;
      z-index: 9998;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      color: #0F172A;
      animation: fisChatIn 0.2s ease-out;
    }

    #fis-chat-panel.open { display: flex; }

    @keyframes fisChatIn {
      from { opacity: 0; transform: translateY(8px) scale(0.97); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }

    #fis-chat-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px 18px 14px;
      border-bottom: 1px solid #E2E8F0;
      background: #F8FAFC;
      flex-shrink: 0;
    }

    #fis-chat-header-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #00dae7, #2563EB);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 800;
      font-size: 12px;
      flex-shrink: 0;
    }

    #fis-chat-header-info { flex: 1; }

    #fis-chat-header-name {
      font-weight: 700;
      font-size: 13px;
      color: #0F172A;
      line-height: 1.2;
    }

    #fis-chat-header-status {
      font-size: 11px;
      color: #16A34A;
    }

    #fis-chat-header-status::before {
      content: '● ';
      font-size: 8px;
    }

    #fis-chat-close-btn {
      background: none;
      border: 1px solid #E2E8F0;
      border-radius: 6px;
      cursor: pointer;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748B;
      font-size: 14px;
      transition: background 0.15s, color 0.15s;
    }

    #fis-chat-close-btn:hover {
      background: #F1F5F9;
      color: #0F172A;
    }

    #fis-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px 18px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      scroll-behavior: smooth;
    }

    .fis-msg {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 13.5px;
      line-height: 1.55;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .fis-msg.bot {
      align-self: flex-start;
      background: #F1F5F9;
      color: #0F172A;
      border-bottom-left-radius: 4px;
    }

    .fis-msg.user {
      align-self: flex-end;
      background: #2563EB;
      color: #FFFFFF;
      border-bottom-right-radius: 4px;
    }

    .fis-msg.typing {
      font-style: italic;
      color: #64748B;
      background: transparent;
      padding: 8px 14px;
    }

    .fis-msg.error {
      align-self: flex-start;
      background: #FEF2F2;
      color: #DC2626;
      border: 1px solid #FECACA;
    }

    .fis-sources {
      align-self: flex-start;
      font-size: 11px;
      color: #64748B;
      padding: 4px 14px 8px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .fis-sources a {
      color: #2563EB;
      text-decoration: none;
      font-weight: 500;
    }

    .fis-sources a:hover { text-decoration: underline; }

    #fis-chat-input-row {
      display: flex;
      gap: 8px;
      padding: 12px 16px 14px;
      border-top: 1px solid #E2E8F0;
      background: #FFFFFF;
      flex-shrink: 0;
    }

    #fis-chat-input {
      flex: 1;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 13.5px;
      font-family: inherit;
      color: #0F172A;
      outline: none;
      transition: border-color 0.15s;
      resize: none;
      line-height: 1.4;
    }

    #fis-chat-input:focus {
      border-color: #2563EB;
    }

    #fis-chat-send {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #2563EB;
      border: none;
      color: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.15s, opacity 0.15s;
    }

    #fis-chat-send:hover { background: #1D4ED8; }
    #fis-chat-send:disabled { opacity: 0.5; cursor: default; }

    #fis-chat-send svg {
      width: 16px;
      height: 16px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    #fis-chat-suggestions {
      padding: 0 18px 12px;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      flex-shrink: 0;
    }

    .fis-suggestion {
      font-size: 11.5px;
      padding: 5px 12px;
      border-radius: 100px;
      border: 1px solid #E2E8F0;
      background: #F8FAFC;
      color: #475569;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
      white-space: nowrap;
    }

    .fis-suggestion:hover {
      border-color: #2563EB;
      background: #EFF6FF;
      color: #2563EB;
    }

    @media (max-width: 480px) {
      #fis-chat-panel {
        right: 12px;
        bottom: 80px;
        width: calc(100vw - 24px);
        height: calc(100vh - 140px);
      }
      #fis-chat-bubble { right: 12px; bottom: 16px; }
    }
  `;
  document.head.appendChild(style);

  // ─── Build HTML ───
  const container = document.createElement('div');
  container.id = 'fis-chat-bubble';

  container.innerHTML = `
    <button id="fis-chat-toggle" aria-label="Open AI chat">
      <svg class="chat-icon" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      <span class="close-icon" aria-hidden="true">✕</span>
    </button>

    <div id="fis-chat-panel">
      <div id="fis-chat-header">
        <div id="fis-chat-header-avatar">F</div>
        <div id="fis-chat-header-info">
          <div id="fis-chat-header-name">FutureInSites AI</div>
          <div id="fis-chat-header-status">Online</div>
        </div>
        <button id="fis-chat-close-btn" aria-label="Close chat">✕</button>
      </div>

      <div id="fis-chat-messages"></div>

      <div id="fis-chat-suggestions"></div>

      <div id="fis-chat-input-row">
        <textarea id="fis-chat-input" rows="1" placeholder="Ask about FutureInSites..."></textarea>
        <button id="fis-chat-send" disabled aria-label="Send message">
          <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9"/></svg>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  // ─── DOM refs ───
  const toggle = document.getElementById('fis-chat-toggle');
  const panel = document.getElementById('fis-chat-panel');
  const closeBtn = document.getElementById('fis-chat-close-btn');
  const messages = document.getElementById('fis-chat-messages');
  const input = document.getElementById('fis-chat-input');
  const sendBtn = document.getElementById('fis-chat-send');
  const suggestions = document.getElementById('fis-chat-suggestions');
  let conversationHistory = [];
  let isOpen = false;
  let hasGreeted = false;

  // ─── Suggested starter questions ───
  const STARTERS = [
    'What does FutureInSites do?',
    'What services do you offer?',
    'Who is Greg Loeffelholz?',
    'How do I get started?',
  ];

  function showSuggestions() {
    suggestions.innerHTML = STARTERS.map(s =>
      `<span class="fis-suggestion">${s}</span>`
    ).join('');
  }

  // ─── Add message to chat ───
  function addMessage(role, text, opt) {
    const div = document.createElement('div');
    div.className = `fis-msg ${role}`;
    if (opt?.isTyping) {
      div.id = 'fis-typing';
      div.textContent = 'Thinking...';
    } else {
      div.textContent = text;
    }
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;

    // Sources
    if (opt?.sources && Array.isArray(opt.sources)) {
      const srcDiv = document.createElement('div');
      srcDiv.className = 'fis-sources';
      srcDiv.innerHTML = opt.sources
        .filter(s => s.url)
        .map(s => `<a href="${s.url}" target="_blank" rel="noopener">${s.title || 'Source'}</a>`)
        .join('');
      messages.appendChild(srcDiv);
    }

    return div;
  }

  function replaceTyping(text, sources) {
    const typing = document.getElementById('fis-typing');
    if (typing) {
      typing.className = 'fis-msg bot';
      typing.textContent = text;
      typing.id = '';
    }

    if (sources && Array.isArray(sources)) {
      const srcDiv = document.createElement('div');
      srcDiv.className = 'fis-sources';
      srcDiv.innerHTML = sources
        .filter(s => s.url)
        .map(s => `<a href="${s.url}" target="_blank" rel="noopener">${s.title || 'Source'}</a>`)
        .join('');
      messages.appendChild(srcDiv);
      messages.scrollTop = messages.scrollHeight;
    }
  }

  // ─── Send message ───
  async function sendMessage(text) {
    if (!text.trim()) return;

    addMessage('user', text.trim());
    conversationHistory.push({ role: 'user', content: text.trim() });
    input.value = '';
    sendBtn.disabled = true;
    autoResizeInput();
    suggestions.innerHTML = '';

    addMessage('typing', 'Thinking...', { isTyping: true });

    try {
      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          history: conversationHistory.slice(-10), // last 10 messages
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        replaceTyping(err.error || 'Something went wrong. Please try again.');
        return;
      }

      // Stream response
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let sources = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.text !== undefined) {
              fullText += parsed.text;
              replaceTyping(fullText, null);
            }
            if (parsed.sources) {
              sources = parsed.sources;
            }
          } catch {
            // skip malformed chunks
          }
        }
      }

      replaceTyping(fullText, sources);
      conversationHistory.push({ role: 'model', content: fullText });
    } catch (err) {
      replaceTyping('Sorry, I had trouble connecting. Please try again.');
    }

    sendBtn.disabled = false;
    input.focus();
  }

  // ─── Input auto-resize ───
  function autoResizeInput() {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  }

  // ─── Toggle panel ───
  function open() {
    isOpen = true;
    panel.classList.add('open');
    toggle.classList.add('open');
    input.focus();

    if (!hasGreeted) {
      hasGreeted = true;
      addMessage('bot', GREETING);
      showSuggestions();
    }
  }

  function close() {
    isOpen = false;
    panel.classList.remove('open');
    toggle.classList.remove('open');
  }

  // ─── Event handlers ───
  toggle.addEventListener('click', () => {
    isOpen ? close() : open();
  });

  closeBtn.addEventListener('click', close);

  sendBtn.addEventListener('click', () => sendMessage(input.value));

  input.addEventListener('input', autoResizeInput);

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input.value);
    }
  });

  input.addEventListener('input', () => {
    sendBtn.disabled = !input.value.trim();
  });

  // Suggestion clicks
  suggestions.addEventListener('click', (e) => {
    const suggestion = e.target.closest('.fis-suggestion');
    if (suggestion) {
      sendMessage(suggestion.textContent);
    }
  });

  // Click outside to close
  document.addEventListener('click', (e) => {
    if (!isOpen) return;
    if (!container.contains(e.target)) {
      close();
    }
  });

})();
