/* FutureInSites cookie banner.
   This site doesn't actually use cookies, so this banner is a joke that
   reinforces that. Show once per session, dismiss with either button. */
(function () {

  /* ─── BAIL EARLY IF ALREADY DISMISSED THIS SESSION ─── */
  try {
    if (sessionStorage.getItem('fi_cookie_dismissed') === 'true') return;
  } catch (e) { /* sessionStorage unavailable, fall through */ }

  /* ─── INLINE SVG: cookie being dunked into a glass of milk ─── */
  var COOKIE_SVG = [
    '<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">',
      /* Glass top rim ellipse */
      '<ellipse cx="50" cy="22" rx="30" ry="3.5" ',
        'stroke="rgba(255,255,255,0.55)" stroke-width="1.5" ',
        'fill="rgba(255,255,255,0.05)"/>',
      /* Glass walls and bottom */
      '<path d="M 20 22 L 26 88 Q 26 92 30 92 L 70 92 Q 74 92 74 88 L 80 22" ',
        'stroke="rgba(255,255,255,0.55)" stroke-width="1.5" ',
        'fill="rgba(255,255,255,0.05)"/>',
      /* Milk body */
      '<path d="M 22 38 L 27 88 Q 27 91 30 91 L 70 91 Q 73 91 73 88 L 78 38 Z" ',
        'fill="#FAF4E2"/>',
      /* Milk surface ellipse */
      '<ellipse cx="50" cy="38" rx="28" ry="3" fill="#FCF7EA"/>',
      /* Cookie tilted, hovering above the milk surface */
      '<g transform="rotate(-25 50 30)">',
        /* Top wafer */
        '<ellipse cx="50" cy="20" rx="17" ry="3.5" fill="#2A1610"/>',
        /* Embossing dots */
        '<circle cx="44" cy="19.5" r="0.8" fill="#150B08"/>',
        '<circle cx="50" cy="18.8" r="0.8" fill="#150B08"/>',
        '<circle cx="56" cy="19.5" r="0.8" fill="#150B08"/>',
        /* Cream filling */
        '<rect x="33" y="22.8" width="34" height="3" fill="#F2E5BD"/>',
        /* Bottom wafer */
        '<ellipse cx="50" cy="28.2" rx="17" ry="3.5" fill="#2A1610"/>',
      '</g>',
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
      'gap: 1.4rem;',
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
    '}',
    '.fi-cookie-img svg { width: 100%; height: 100%; display: block; }',
    '.fi-cookie-text {',
      'flex: 1;',
      'max-width: 720px;',
      'margin: 0;',
    '}',
    '.fi-cookie-buttons {',
      'display: flex;',
      'gap: 0.6rem;',
      'flex-shrink: 0;',
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
      '}',
      '.fi-cookie-img { width: 48px; height: 48px; }',
      '.fi-cookie-text {',
        'font-size: 0.84rem;',
        'flex: 1 1 calc(100% - 64px);',
      '}',
      '.fi-cookie-buttons {',
        'flex-basis: 100%;',
        'order: 3;',
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
    bar.setAttribute('aria-label', 'Cookie notice');
    bar.innerHTML =
      '<div class="fi-cookie-img">' + COOKIE_SVG + '</div>' +
      '<p class="fi-cookie-text">' +
        "Cookies should only be accepted with milk. As a technology, they're " +
        "outdated and invasive, so we don't use them. We support the edible kind." +
      '</p>' +
      '<div class="fi-cookie-buttons">' +
        '<button class="fi-cookie-btn fi-cookie-accept" type="button">More milk, please</button>' +
        '<button class="fi-cookie-btn fi-cookie-reject" type="button">I’m lactose-intolerant</button>' +
      '</div>';
    document.body.appendChild(bar);

    function dismiss() {
      bar.style.opacity = '0';
      bar.style.transform = 'translateY(20px)';
      setTimeout(function () { bar.remove(); }, 320);
      try { sessionStorage.setItem('fi_cookie_dismissed', 'true'); } catch (e) {}
    }

    var btns = bar.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', dismiss);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', show);
  } else {
    show();
  }
})();
