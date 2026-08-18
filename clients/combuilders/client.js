/* =====================================================================
   SINGLE SOURCE OF TRUTH for this client.
   Client name and logo paths live here so every page in this workspace
   stays in sync. The included SVG files are temporary placeholders that
   can be replaced with official ComBuilders brand assets later.
   ===================================================================== */
window.CLIENT = {
  slug: "combuilders",
  name: "ComBuilders",

  // Small square icon: browser tab and nav bar (top right).
  favicon:  "/clients/combuilders/ComBuildersFavicon.svg",
  // Full-name wordmark logo: the dashboard header.
  wordmark: "/clients/combuilders/ComBuildersWordmark.svg"
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
