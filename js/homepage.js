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
    document.getElementById('headline-hours').textContent = `${number.format(hours)} hours`;
    document.getElementById('annual-value').textContent = money.format(hours * 50 * rate);
  };
  fields.forEach(field => field.addEventListener('input', updateROI));
  updateROI();
})();
