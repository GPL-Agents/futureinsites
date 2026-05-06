/* FutureInSites cookie banner.
   This site doesn't actually use cookies, so this banner is a joke that
   reinforces that. Show once per session, dismiss with either button. */
(function () {

  /* ─── BAIL EARLY IF ALREADY DISMISSED THIS SESSION ─── */
  try {
    if (sessionStorage.getItem('fi_cookie_dismissed') === 'true') return;
  } catch (e) { /* sessionStorage unavailable, fall through */ }

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
      'border-radius: 50%;',
      'overflow: hidden;',
      'background: #1A1D24;',
    '}',
    '.fi-cookie-img img { width: 100%; height: 100%; display: block; object-fit: cover; object-position: center top; }',
    '.fi-cookie-img svg { width: 100%; height: 100%; display: block; }',
    '.fi-cookie-text {',
      'flex: 1;',
      'text-align: center;',
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
      '<div class="fi-cookie-img"><img src="images/cookie-milk.png" alt=""></div>' +
      '<p class="fi-cookie-text">' +
        "Cookies should only be accepted with milk. As a technology, they're " +
        "outdated and invasive, so we don't use them. We support the edible kind." +
      '</p>' +
      '<div class="fi-cookie-buttons">' +
        '<button class="fi-cookie-btn fi-cookie-accept" type="button">More milk, please</button>' +
        '<button class="fi-cookie-btn fi-cookie-reject" type="button">I’m full, thank you</button>' +
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
