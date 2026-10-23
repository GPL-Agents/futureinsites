/* Shared nav behavior for pages without their own nav script.
   Add data-dropdowns="off" on the script tag when the page already binds .nav-more dropdowns. */
(function () {
  var script = document.currentScript;
  var dropdownsOff = script && script.getAttribute('data-dropdowns') === 'off';
  function init() {
    var btn = document.getElementById('nav-hamburger');
    var menu = document.getElementById('nav-links-menu');
    if (btn && menu) {
      btn.addEventListener('click', function (e) { e.stopPropagation(); menu.classList.toggle('open'); });
      document.addEventListener('click', function (e) { if (!btn.contains(e.target) && !menu.contains(e.target)) menu.classList.remove('open'); });
    }
    if (dropdownsOff) return;
    var groups = document.querySelectorAll('body > nav .nav-more');
    groups.forEach(function (g) {
      var t = g.querySelector('.nav-more-btn');
      if (!t) return;
      t.addEventListener('click', function (e) {
        e.preventDefault();
        var opening = !g.classList.contains('open');
        groups.forEach(function (o) { o.classList.remove('open'); });
        if (opening) g.classList.add('open');
      });
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('body > nav')) groups.forEach(function (o) { o.classList.remove('open'); }); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
