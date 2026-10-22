(() => {
  'use strict';
  const menuButton = document.getElementById('nav-hamburger');
  const menu = document.getElementById('nav-links-menu');
  const dropdowns = [...document.querySelectorAll('.nav-more')];
  const closeMenus = () => {
    dropdowns.forEach(item => { item.classList.remove('open'); item.querySelector('.nav-more-btn').setAttribute('aria-expanded', 'false'); });
    menu.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation menu');
  };
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-controls', menu.id);
  menuButton.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
  });
  dropdowns.forEach((item, i) => {
    const trigger = item.querySelector('.nav-more-btn');
    const dropdown = item.querySelector('.nav-more-dropdown');
    dropdown.id = `preview-dropdown-${i}`;
    trigger.setAttribute('aria-controls', dropdown.id);
    trigger.setAttribute('aria-expanded', 'false');
    trigger.addEventListener('click', e => {
      e.preventDefault();
      const shouldOpen = !item.classList.contains('open');
      dropdowns.forEach(other => { other.classList.remove('open'); other.querySelector('.nav-more-btn').setAttribute('aria-expanded', 'false'); });
      item.classList.toggle('open', shouldOpen);
      trigger.setAttribute('aria-expanded', String(shouldOpen));
    });
  });
  document.addEventListener('click', e => { if (!e.target.closest('body > nav')) closeMenus(); });
  menu.querySelectorAll('.nav-more-dropdown a, .nav-client-menu a').forEach(a => a.addEventListener('click', closeMenus));
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const openTrigger = document.querySelector('.nav-more.open .nav-more-btn');
    const wasMenuOpen = menu.classList.contains('open');
    closeMenus();
    if (openTrigger) openTrigger.focus();
    else if (wasMenuOpen) menuButton.focus();
  });

  const toolkit = document.querySelector('.toolkit');
  const track = document.getElementById('ribbon-track');
  const logos = document.getElementById('ribbon-logos');
  const clone = logos.cloneNode(true);
  clone.removeAttribute('id');
  clone.setAttribute('aria-hidden', 'true');
  track.append(clone);
  const toggle = document.getElementById('ribbon-toggle');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const applyMotionPreference = () => {
    toolkit.classList.toggle('paused', motion.matches);
    toggle.hidden = motion.matches;
    clone.hidden = motion.matches;
    toggle.setAttribute('aria-pressed', String(motion.matches));
  };
  applyMotionPreference();
  motion.addEventListener('change', applyMotionPreference);
  toggle.addEventListener('click', () => {
    const paused = toolkit.classList.toggle('paused');
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.textContent = paused ? 'Play logos ▷' : 'Pause logos Ⅱ';
  });

  const fields = ['team-size', 'minutes-saved', 'hourly-value'].map(id => document.getElementById(id));
  const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });
  const updateROI = () => {
    const valid = fields.every(field => field.value.trim() !== '' && field.checkValidity());
    document.getElementById('roi-error').hidden = valid;
    fields.forEach(field => field.setAttribute('aria-invalid', String(!field.value.trim() || !field.checkValidity())));
    if (!valid) return;
    const [people, minutes, rate] = fields.map(field => Number(field.value));
    const hours = people * minutes / 60 * 5;
    document.getElementById('weekly-hours').textContent = number.format(hours);
    const highlightHours = document.getElementById('highlight-hours');
    if (highlightHours) highlightHours.textContent = number.format(hours);
    document.getElementById('headline-hours').textContent = `${number.format(hours)} hours`;
    const annualValue = document.getElementById('annual-value');
      const formattedValue = money.format(hours * 50 * rate);
      annualValue.textContent = formattedValue;
      annualValue.style.fontSize = formattedValue.length > 9 ? '40px' : formattedValue.length > 8 ? '52px' : '';
      const mathHours = document.getElementById('roi-math-hours');
      if (mathHours) {
        mathHours.textContent = number.format(hours);
        document.getElementById('roi-math-rate').textContent = money.format(rate);
        document.getElementById('roi-math-total').textContent = formattedValue;
      }
  };
  fields.forEach(field => field.addEventListener('input', updateROI));
  updateROI();
})();

(() => {
  const section = document.querySelector('.homepage-blog');
  if (!section) return;
  const track = document.getElementById('blog-track');
  const cards = [...track.querySelectorAll('.blog-slide')];
  const pause = document.getElementById('blog-pause');
  const status = document.getElementById('blog-position');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false, hovered = false, paused = reducedMotion.matches;
  let timer, scrollTimer;
  const dimensions = () => {
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    const step = cards[0].getBoundingClientRect().width + gap;
    const count = Math.max(1, Math.round((track.clientWidth + gap) / step));
    return { step, count, max: Math.max(0, cards.length - count) };
  };
  const updatePosition = () => {
    const { step, count, max } = dimensions();
    const index = Math.min(max, Math.round(track.scrollLeft / step));
    status.textContent = 'Articles ' + (index + 1) + ' to ' + Math.min(cards.length, index + count) + ' of ' + cards.length;
  };
  const updateButton = () => {
    pause.setAttribute('aria-pressed', String(paused));
    pause.setAttribute('aria-label', paused ? 'Start automatic article rotation' : 'Pause automatic article rotation');
    pause.innerHTML = paused ? 'Play <span aria-hidden="true">▷</span>' : 'Pause <span aria-hidden="true">Ⅱ</span>';
  };
  const stop = () => clearTimeout(timer);
  const canRotate = () => visible && !paused && !hovered && (!section.contains(document.activeElement) || document.activeElement === pause) && !document.hidden;
  const move = (direction, manual = false) => {
    const { step, max } = dimensions();
    let index = Math.round(track.scrollLeft / step) + direction;
    if (index > max) index = 0;
    if (index < 0) index = max;
    if (manual) {
      paused = true;
      stop();
      updateButton();
      status.setAttribute('aria-live', 'polite');
    } else status.setAttribute('aria-live', 'off');
    track.scrollTo({ left: index * step, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  };
  const schedule = (delay = 6500) => {
    stop();
    if (!canRotate()) return;
    timer = setTimeout(() => { if (canRotate()) { move(1); schedule(); } }, delay);
  };
  document.getElementById('blog-prev').addEventListener('click', () => move(-1, true));
  document.getElementById('blog-next').addEventListener('click', () => move(1, true));
  pause.addEventListener('click', () => { paused = !paused; updateButton(); schedule(3500); });
  section.addEventListener('mouseenter', () => { hovered = true; stop(); });
  section.addEventListener('mouseleave', () => { hovered = false; schedule(); });
  section.addEventListener('focusin', stop);
  section.addEventListener('focusout', () => requestAnimationFrame(() => schedule()));
  track.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    move(event.key === 'ArrowRight' ? 1 : -1, true);
  });
  track.addEventListener('pointerdown', () => { paused = true; stop(); updateButton(); });
  track.addEventListener('scroll', () => { clearTimeout(scrollTimer); scrollTimer = setTimeout(updatePosition, 120); }, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else schedule(3500); });
  reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches; updateButton(); schedule(3500); });
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting && entries[0].intersectionRatio >= 0.25;
    if (visible) schedule(3500); else stop();
  }, { threshold: [0, 0.25] }).observe(section);
  new ResizeObserver(() => { updatePosition(); schedule(3500); }).observe(track);
  updateButton();
  updatePosition();
})();
