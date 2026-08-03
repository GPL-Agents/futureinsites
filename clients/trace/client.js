/* =====================================================================
   SINGLE SOURCE OF TRUTH for this client.
   To set up a new client: copy this client's folder, then edit ONLY the
   values below and drop in the two logo images. Every page in the folder
   reads from here, so the name and logos populate everywhere.
   ===================================================================== */
window.CLIENT = {
  slug: "trace",
  name: "Trace Services",

  // Small square icon: browser tab and nav bar (top right).
  favicon:  "/clients/trace/TraceFavicon.webp",
  // Full-name wordmark logo: the dashboard header.
  wordmark: "/clients/trace/TraceServicesLogo.webp"
};

/* Populates branding into any page that includes this file. Pages mark
   their elements with data-attributes; this fills them in. */
window.CLIENT.applyBranding = function () {
  var c = window.CLIENT;

  var fav = document.getElementById("favicon");
  if (fav) fav.href = c.favicon;

  document.querySelectorAll("[data-client-name]").forEach(function (el) {
    el.textContent = c.name;
  });

  function brandImg(selector, src) {
    document.querySelectorAll(selector).forEach(function (el) {
      el.alt = c.name;
      el.onerror = function () { (el.closest(".nav-client") || el).style.display = "none"; };
      el.src = src;
    });
  }
  brandImg("[data-client-icon]", c.favicon);
  brandImg("[data-client-wordmark]", c.wordmark);
};
