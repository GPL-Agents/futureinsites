/* FutureInSites cookie banner + analytics consent.
   The site uses Google Analytics, which sets cookies. GA loads ONLY after a
   visitor accepts. Decline = GA never loads, zero cookies set. The choice is
   remembered in localStorage so the banner shows once, not every visit. */
(function () {

  var GA_ID = 'G-H8Q5T1KH1T';
  var CONSENT_KEY = 'fi_cookie_consent'; /* 'accepted' | 'declined' */

  function getConsent() {
    try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
  }
  function setConsent(v) {
    try { localStorage.setItem(CONSENT_KEY, v); } catch (e) {}
  }

  /* ─── LOAD GOOGLE ANALYTICS (only ever called after consent) ─── */
  function enableGA() {
    if (window.__fiGaLoaded) return;
    window.__fiGaLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', GA_ID);
  }

  /* ─── RETURNING VISITORS: honor the saved choice, no banner ─── */
  var saved = getConsent();
  if (saved === 'accepted') { enableGA(); return; }
  if (saved === 'declined') { return; }

  /* ─── INLINE SVG: chocolate chip cookie (golden brown, reads on dark bg) ─── */
  var COOKIE_SVG = [
    '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">',
      /* Subtle drop shadow under the cookie */
      '<ellipse cx="50" cy="90" rx="34" ry="3" fill="rgba(0,0,0,0.35)"/>',
      /* Cookie body (warm golden brown) */
      '<circle cx="50" cy="50" r="38" fill="#D9A86B"/>',
      /* Inner highlight to suggest a baked surface */
      '<circle cx="44" cy="44" r="22" fill="#E6BA82" opacity="0.55"/>',
      /* Edge ring to add definition against dark backgrounds */
      '<circle cx="50" cy="50" r="38" fill="none" stroke="#A87740" stroke-width="2"/>',
      /* Crumb / texture specks */
      '<circle cx="32" cy="42" r="1" fill="#8B5E2F" opacity="0.5"/>',
      '<circle cx="68" cy="40" r="1.2" fill="#8B5E2F" opacity="0.5"/>',
      '<circle cx="58" cy="65" r="1" fill="#8B5E2F" opacity="0.5"/>',
      '<circle cx="40" cy="60" r="1.1" fill="#8B5E2F" opacity="0.5"/>',
      '<circle cx="52" cy="32" r="0.8" fill="#8B5E2F" opacity="0.4"/>',
      /* Chocolate chips, varied sizes, scattered */
      '<ellipse cx="36" cy="34" rx="5" ry="4.2" fill="#2D1810"/>',
      '<ellipse cx="62" cy="30" rx="4" ry="3.4" fill="#2D1810"/>',
      '<ellipse cx="72" cy="52" rx="5" ry="4.5" fill="#2D1810"/>',
      '<ellipse cx="30" cy="58" rx="4.5" ry="4" fill="#2D1810"/>',
      '<ellipse cx="52" cy="48" rx="4" ry="3.4" fill="#2D1810"/>',
      '<ellipse cx="48" cy="70" rx="5" ry="4" fill="#2D1810"/>',
      '<ellipse cx="66" cy="70" rx="3.5" ry="3" fill="#2D1810"/>',
      /* Tiny chip highlights for a touch of dimension */
      '<circle cx="34" cy="32" r="0.9" fill="#5A3520"/>',
      '<circle cx="60" cy="29" r="0.7" fill="#5A3520"/>',
      '<circle cx="70" cy="50" r="0.9" fill="#5A3520"/>',
      '<circle cx="46" cy="68" r="0.9" fill="#5A3520"/>',
    '</svg>'
  ].join('');

  /* ─── CSS ─── */
  var css = [
    '.fi-cookie-bar {',
      'position: fixed;',
      'left: 0; right: 0; bottom: 0;',
      'z-index: 999;',
      'background: rgba(11,12,16,0.97);',
      'backdrop-filter: blur(12px);',
      '-webkit-backdrop-filter: blur(12px);',
      'border-top: 1px solid rgba(255,255,255,0.1);',
      'padding: 1rem 1.5rem;',
      'display: flex;',
      'align-items: center;',
      'justify-content: center;',
      'gap: 1.1rem;',
      'color: rgba(255,255,255,0.85);',
      "font-family: 'Inter', system-ui, -apple-system, sans-serif;",
      'font-size: 0.9rem;',
      'line-height: 1.55;',
      'transition: opacity 0.3s, transform 0.3s;',
    '}',
    '.fi-cookie-img {',
      'width: 64px;',
      'height: 64px;',
      'flex-shrink: 0;',
      'display: block;',
      'border-radius: 50%;',
      'overflow: hidden;',
      'background: #1A1D24;',
    '}',
    '.fi-cookie-img img { width: 100%; height: 100%; display: block; object-fit: cover; object-position: center top; }',
    '.fi-cookie-img svg { width: 100%; height: 100%; display: block; }',
    '.fi-cookie-text {',
      'margin: 0;',
      'max-width: 560px;',
    '}',
    '.fi-cookie-text a { color: #2DD4FF; text-decoration: none; }',
    '.fi-cookie-text a:hover { text-decoration: underline; }',
    '.fi-cookie-buttons {',
      'display: flex;',
      'gap: 0.6rem;',
      'flex-shrink: 0;',
      'margin-left: 0.4rem;',
    '}',
    '.fi-cookie-btn {',
      'font: inherit;',
      'font-size: 0.78rem;',
      'font-weight: 600;',
      'padding: 0.6rem 1.15rem;',
      'border-radius: 100px;',
      'border: 1px solid;',
      'cursor: pointer;',
      'transition: opacity 0.2s, background 0.2s, color 0.2s, border-color 0.2s;',
      'white-space: nowrap;',
    '}',
    '.fi-cookie-accept {',
      'background: #2563EB;',
      'color: #FFFFFF;',
      'border-color: #2563EB;',
    '}',
    '.fi-cookie-accept:hover { opacity: 0.88; }',
    '.fi-cookie-reject {',
      'background: transparent;',
      'color: rgba(255,255,255,0.65);',
      'border-color: rgba(255,255,255,0.22);',
    '}',
    '.fi-cookie-reject:hover {',
      'color: #FFFFFF;',
      'border-color: rgba(255,255,255,0.45);',
    '}',
    '@media (max-width: 760px) {',
      '.fi-cookie-bar {',
        'flex-wrap: wrap;',
        'padding: 0.95rem 1rem 1.05rem;',
        'gap: 0.85rem;',
        'justify-content: flex-start;',
      '}',
      '.fi-cookie-img { width: 48px; height: 48px; }',
      '.fi-cookie-text {',
        'font-size: 0.84rem;',
        'flex: 1 1 calc(100% - 64px);',
      '}',
      '.fi-cookie-buttons {',
        'flex-basis: 100%;',
        'margin-left: 0;',
        'justify-content: flex-start;',
      '}',
      '.fi-cookie-btn {',
        'font-size: 0.74rem;',
        'padding: 0.55rem 1rem;',
      '}',
    '}'
  ].join('\n');

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ─── BUILD AND INJECT THE BAR ─── */
  function show() {
    var bar = document.createElement('div');
    bar.className = 'fi-cookie-bar';
    bar.setAttribute('role', 'dialog');
    bar.setAttribute('aria-label', 'Cookie consent');
    bar.innerHTML =
      '<div class="fi-cookie-img"><img src="/images/cookie-milk.png" alt=""></div>' +
      '<p class="fi-cookie-text">' +
        "Cookies are best accepted with milk. We still believe that, but we " +
        "now use a few Google Analytics cookies to count visits. Nothing that " +
        "follows you around the internet, and if you decline we set none at all. " +
        '<a href="/privacy.html">Privacy policy</a>' +
      '</p>' +
      '<div class="fi-cookie-buttons">' +
        '<button class="fi-cookie-btn fi-cookie-accept" type="button">Accept cookies (and milk)</button>' +
        '<button class="fi-cookie-btn fi-cookie-reject" type="button">Decline (just milk for me)</button>' +
      '</div>';

    /* If the photo isn't saved yet, fall back to the inline SVG so the
       banner never shows a broken-image icon. */
    var imgEl = bar.querySelector('.fi-cookie-img img');
    if (imgEl) {
      imgEl.addEventListener('error', function () {
        var holder = imgEl.parentNode;
        holder.innerHTML = COOKIE_SVG;
      });
    }
    document.body.appendChild(bar);

    function dismiss() {
      bar.style.opacity = '0';
      bar.style.transform = 'translateY(20px)';
      setTimeout(function () { bar.remove(); }, 320);
    }

    bar.querySelector('.fi-cookie-accept').addEventListener('click', function () {
      setConsent('accepted');
      enableGA();
      dismiss();
    });
    bar.querySelector('.fi-cookie-reject').addEventListener('click', function () {
      setConsent('declined');
      dismiss();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', show);
  } else {
    show();
  }
})();
