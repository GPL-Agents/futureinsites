/* Creative gallery for the Benchmark campaign page.
   The carousel, the set inventory and the full-size viewer all render from ASSETS. */
(function () {
  "use strict";

  var ASSETS = [
    {
      id: "01-A", series: "A", set: "01", file: "01-a-paid-social.jpg", w: 1200, h: 1200,
      format: "Paid social - square 1:1", audience: "Senior resident",
      headline: "Your next chapter in tech starts here.", cta: "Find a free class", stage: "Awareness",
      objective: "Put the free Hanover class in front of senior residents in the local social feed.",
      role: "Primary acquisition ad",
      alt: "Series A paid social ad for senior residents: Your next chapter in tech starts here. Find a free class. Sponsored by Benchmark at Hanover, hosted at Emilson YMCA."
    },
    {
      id: "01-B", series: "B", set: "01", file: "01-b-paid-social.jpg", w: 1200, h: 1200,
      format: "Paid social - square 1:1", audience: "Adult child",
      headline: "Help your parent feel more confident online.", cta: "Find a class for your family", stage: "Awareness",
      objective: "Reach adult children who steer the decision and give them a reason to act for a parent.",
      role: "Family-influencer ad",
      alt: "Series B paid social ad for adult children: Help your parent feel more confident online. Find a class for your family."
    },
    {
      id: "C01", series: "C", set: "01", file: "c01-paid-social.jpg", w: 1200, h: 1200,
      format: "Paid social - square 1:1", audience: "Scam lead",
      headline: "Your savings deserve a stronger defense.", cta: "Join a free local class", stage: "Awareness",
      objective: "Reach people who have already engaged with scam content and lead with the financial stakes.",
      role: "Scam-lead acquisition ad",
      alt: "Series C paid social ad: Your savings deserve a stronger defense. Over 7 billion dollars in reported losses for people 60 and older. Join a free local class at Emilson YMCA, Hanover."
    },
    {
      id: "02-A", series: "A", set: "02", file: "02-a-confidence-ad.jpg", w: 1122, h: 1402,
      format: "Paid social - portrait 4:5", audience: "Senior resident",
      headline: "More confidence, more connection.", cta: "Save your seat", stage: "Consideration",
      objective: "Turn class interest into a reserved seat with a confidence-led promise.",
      role: "Registration push",
      alt: "Series A confidence ad: More confidence, more connection. Explore AI, recognize suspicious messages, get more from your phone. Save your seat."
    },
    {
      id: "02-B", series: "B", set: "02", file: "02-b-confidence-ad.jpg", w: 1122, h: 1402,
      format: "Paid social - portrait 4:5", audience: "Adult child",
      headline: "A little learning. A meaningful connection.", cta: "Explore local classes", stage: "Consideration",
      objective: "Give adult children a low-pressure way to invite a parent to class.",
      role: "Shareable invitation",
      alt: "Series B confidence ad: A little learning. A meaningful connection. Invite your parent to a free local class."
    },
    {
      id: "C02", series: "C", set: "02", file: "c02-voice-cloning.jpg", w: 1122, h: 1402,
      format: "Awareness ad - portrait 4:5", audience: "Scam lead",
      headline: "It sounds like family. It could be a scam.", cta: "Learn the warning signs at a free class", stage: "Awareness",
      objective: "Show how convincing a cloned voice sounds, then offer the class as the defense.",
      role: "Voice-cloning awareness ad",
      alt: "Series C awareness ad: It sounds like family. It could be a scam. AI can copy a loved one’s voice. Pause, hang up, call a number you know."
    },
    {
      id: "03-A", series: "A", set: "03", file: "03-a-social-tips.jpg", w: 1200, h: 1200,
      format: "Organic social - square 1:1", audience: "Senior resident",
      headline: "A familiar voice? Take a moment.", cta: "Join us at Emilson YMCA", stage: "Engagement",
      objective: "Teach one voice-clone warning sign and earn attention before asking for a registration.",
      role: "Scam-awareness tip content",
      alt: "Series A social tip: A familiar voice? Take a moment. Pause before sending money, call back on a known number, talk with someone you trust."
    },
    {
      id: "03-B", series: "B", set: "03", file: "03-b-social-tips.jpg", w: 1200, h: 1200,
      format: "Organic social - square 1:1", audience: "Adult child",
      headline: "Make a family plan before a suspicious call.", cta: "Share a class with your parent", stage: "Engagement",
      objective: "Turn a family safety conversation into a shared class plan.",
      role: "Family-plan tip content",
      alt: "Series B social tip: Make a family plan before a suspicious call. Choose a check-in phrase, call back on a known number, pause urgent requests for money."
    },
    {
      id: "C03", series: "C", set: "03", file: "c03-fake-faces-video.jpg", w: 1200, h: 1200,
      format: "Social content - square 1:1", audience: "Scam lead",
      headline: "A familiar face isn’t proof.", cta: "Practice these steps at a free class", stage: "Engagement",
      objective: "Explain that a familiar face can be synthesized and give three checks before paying.",
      role: "Deepfake-awareness social",
      alt: "Series C social content: A familiar face isn’t proof. AI can fake voices, photos and video. Pause the payment, verify through a known contact, talk with someone you trust."
    },
    {
      id: "C07", series: "C", set: "03", file: "c07-retirement-savings.jpg", w: 1200, h: 1200,
      format: "Social content - square 1:1", audience: "Scam lead",
      headline: "A lifetime of saving. A convincing lie.", cta: "Join a free class", stage: "Engagement",
      objective: "Use one reported case to show how a false bank warning moves a life savings.",
      role: "Case-led social",
      alt: "Series C social content: A lifetime of saving. A convincing lie. Two million dollars reported lost after a false bank warning. A request to move money into gold or cryptocurrency is a warning sign."
    },
    {
      id: "C08", series: "C", set: "03", file: "c08-rising-losses.jpg", w: 1200, h: 1200,
      format: "Social content - square 1:1", audience: "Scam lead",
      headline: "The rising cost of scams.", cta: "Learn the warning signs at a free class", stage: "Engagement",
      objective: "Frame the trend line so the class reads as preparation, not panic.",
      role: "Trend-led social",
      alt: "Series C social content: The rising cost of scams, and the need to prepare. Reported losses for people 60 and older rose in 2025, with 352 million dollars in AI-related complaints."
    },
    {
      id: "04-A", series: "A", set: "04", file: "04-a-landing-page.jpg", w: 1122, h: 1402,
      format: "Landing page - 4:5 concept", audience: "Senior resident",
      headline: "Build your tech confidence, close to home.", cta: "Save your seat", stage: "Conversion",
      objective: "Register a senior resident on a page that answers the practical questions first.",
      role: "Registration page",
      alt: "Series A landing page concept: Build your tech confidence, close to home. Free AI and tech safety class, Emilson YMCA, 75 Mill Street, Hanover."
    },
    {
      id: "04-B", series: "B", set: "04", file: "04-b-landing-page.jpg", w: 1122, h: 1402,
      format: "Landing page - 4:5 concept", audience: "Adult child",
      headline: "A helpful next step for your parent.", cta: "Reserve places", stage: "Conversion",
      objective: "Let an adult child reserve places for the family in one step.",
      role: "Family registration page",
      alt: "Series B landing page concept: A helpful next step for your parent. Invite your parent to a free AI and tech safety class in Hanover. Reserve places."
    },
    {
      id: "C04", series: "C", set: "04", file: "c04-landing-page.jpg", w: 1122, h: 1402,
      format: "Landing page - 4:5 concept", audience: "Scam lead",
      headline: "Before an urgent call becomes a costly decision.", cta: "Reserve my place", stage: "Conversion",
      objective: "Convert a scam-aware visitor with the threat and the class side by side.",
      role: "Scam-lead registration page",
      alt: "Series C landing page concept: Before an urgent call becomes a costly decision. Learn practical ways to check before you act. Free AI and tech safety class for older adults, friends and family."
    },
    {
      id: "05-A", series: "A", set: "05", file: "05-a-event-flyer.jpg", w: 1024, h: 1536,
      format: "Event flyer - 2:3 print and digital", audience: "Senior resident",
      headline: "Bring your curiosity. Build your confidence.", cta: "Reserve your place", stage: "Awareness",
      objective: "Carry the class into community boards, front desks and local partner channels.",
      role: "Local event promotion",
      alt: "Series A event flyer: Bring your curiosity. Build your confidence. Free AI and tech safety class at Emilson YMCA, Hanover."
    },
    {
      id: "05-B", series: "B", set: "05", file: "05-b-event-flyer.jpg", w: 1024, h: 1536,
      format: "Event flyer - 2:3 print and digital", audience: "Adult child",
      headline: "Invite your parent. Learn together.", cta: "Reserve places for your family", stage: "Awareness",
      objective: "Give adult children a piece they can hand to a parent as a concrete invitation.",
      role: "Family invitation piece",
      alt: "Series B event flyer: Invite your parent. Learn together. A free local class on AI, scam awareness and everyday technology."
    },
    {
      id: "C05", series: "C", set: "05", file: "c05-event-poster.jpg", w: 1024, h: 1536,
      format: "Event poster - 2:3 print and digital", audience: "Scam lead",
      headline: "Scams can threaten a lifetime of savings.", cta: "Reserve your place", stage: "Awareness",
      objective: "Carry the savings argument into partner boards and event spaces.",
      role: "Partner poster",
      alt: "Series C event poster: Scams can threaten a lifetime of savings. Over 7 billion dollars reported to the FBI by people 60 and older. Bring a friend, build a plan."
    },
    {
      id: "06-A", series: "A", set: "06", file: "06-a-participant-checklist.jpg", w: 1024, h: 1536,
      format: "Participant take-home - 2:3", audience: "Senior resident",
      headline: "Pause, check, connect.", cta: "Keep learning with us", stage: "Retention",
      objective: "Keep the safety habits alive after the class and set up the next session.",
      role: "Post-event take-home",
      alt: "Series A participant take-home checklist: Pause, check, connect. Your everyday tech confidence checklist."
    },
    {
      id: "06-B", series: "B", set: "06", file: "06-b-family-guide.jpg", w: 1024, h: 1536,
      format: "Participant take-home - 2:3", audience: "Adult child",
      headline: "Confidence grows with connection.", cta: "Stay connected after class", stage: "Retention",
      objective: "Move the class conversation into the home and keep the family in the funnel.",
      role: "Family conversation guide",
      alt: "Series B family conversation guide: Confidence grows with connection. Four steps for starting the conversation with a parent."
    },
    {
      id: "C06", series: "C", set: "06", file: "c06-response-plan.jpg", w: 1024, h: 1536,
      format: "Participant take-home - 2:3", audience: "Scam lead",
      headline: "When fear says “send money,” pause.", cta: "Keep learning at Emilson YMCA", stage: "Retention",
      objective: "Give participants a response plan to keep after the class, including where to report.",
      role: "Post-event response plan",
      alt: "Series C participant response plan: When fear says send money, pause. Stop the payment, end the call, check another way, bring in someone you trust, and report the incident."
    }
  ];

  var SETS = [
    { id: "01", title: "Paid social ads", copy: "Square feed ads that open the campaign for three starting points: the senior resident, the adult child who is searching, and the scam lead who has already been targeted." },
    { id: "02", title: "Awareness and confidence ads", copy: "Portrait ads for the registration push. Two build the confidence promise; the third opens on a cloned voice and the financial risk behind it." },
    { id: "03", title: "Social content", copy: "Tip and case content that earns attention first: voice cloning, fake faces, a retirement savings case, and the trend in reported losses." },
    { id: "04", title: "Landing pages", copy: "Registration page concepts for each audience. Practical details first, then the form, with a clear note that this is not a sales call." },
    { id: "05", title: "Event flyers and posters", copy: "The local print and digital pieces for partner boards, front desks and hand-offs, in a senior-resident, family, and savings-led version." },
    { id: "06", title: "Participant materials", copy: "What people take home: a checklist, a family conversation guide, and a scam-response plan that names where to report a loss." }
  ];

  var INTERVAL = 4000;

  function esc(t) {
    return String(t).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  var stage = document.getElementById("crStage");
  var barEl = document.getElementById("crBar");
  var dotsEl = document.getElementById("crDots");
  var countEl = document.getElementById("crCount");
  var metaEl = document.getElementById("crMeta");
  var toggleEl = document.getElementById("crToggle");
  var prevEl = document.getElementById("crPrev");
  var nextEl = document.getElementById("crNext");
  var liveEl = document.getElementById("crLive");
  var gridEl = document.getElementById("creativeGrid");
  var lb = document.getElementById("crLightbox");
  var lbImg = document.getElementById("crLbImg");
  var lbSet = document.getElementById("crLbSet");
  var lbTitle = document.getElementById("crLbTitle");
  var lbAudience = document.getElementById("crLbAudience");
  var lbChannel = document.getElementById("crLbChannel");
  var lbObjective = document.getElementById("crLbObjective");
  var lbStage = document.getElementById("crLbStage");
  var lbCta = document.getElementById("crLbCta");
  var lbCount = document.getElementById("crLbCount");
  var lbClose = document.getElementById("crLbClose");
  var lbPrev = document.getElementById("crLbPrev");
  var lbNext = document.getElementById("crLbNext");

  var FILTERS = [
    { id: "all", label: "All", name: "All creatives" },
    { id: "A", label: "Series A", name: "Senior resident" },
    { id: "B", label: "Series B", name: "Adult child" },
    { id: "C", label: "Series C", name: "Scam lead" }
  ];

  var filtersEl = document.getElementById("crFilters");
  var view = ASSETS.slice();
  var viewIndex = 0;
  var activeFilter = "all";

  function countFor(id) {
    return id === "all" ? ASSETS.length : ASSETS.filter(function (a) { return a.series === id; }).length;
  }

  filtersEl.innerHTML = FILTERS.map(function (f) {
    return '<button class="cr-filter' + (f.id === "all" ? " is-active" : "") + '" type="button" data-filter="' + f.id + '" aria-pressed="' + (f.id === "all" ? "true" : "false") + '">' +
      '<b>' + esc(f.label) + '</b><span>' + esc(f.name) + '</span><i>' + countFor(f.id) + '</i></button>';
  }).join("");

  function render() {
    stage.innerHTML = '<div class="cr-track">' + view.map(function (a, i) {
      var g = ASSETS.indexOf(a);
      return '<figure class="cr-slide' + (i === viewIndex ? ' is-active' : '') + '">' +
        '<button class="cr-open" type="button" data-open="' + g + '" aria-label="Open creative ' + esc(a.id) + ' full size">' +
        '<img src="assets/creative/' + a.file + '" width="' + a.w + '" height="' + a.h + '" alt="' + esc(a.alt) + '"' +
        (i === viewIndex ? ' fetchpriority="high"' : ' loading="lazy"') + ' decoding="async">' +
        '<span class="cr-zoom">Open full size</span>' +
        '</button></figure>';
    }).join('') + '</div>';

    dotsEl.innerHTML = view.map(function (a, i) {
      return '<button class="cr-dot' + (i === viewIndex ? ' is-active' : '') + '" type="button" data-go="' + i + '" aria-label="Show creative ' + esc(a.id) + '"><span></span></button>';
    }).join("");

    slides = Array.prototype.slice.call(stage.querySelectorAll(".cr-slide"));
    paint();
  }

  function thumb(a) {
    var i = ASSETS.indexOf(a);
    return '<button class="creative-thumb" type="button" data-open="' + i + '" aria-label="Open creative ' + esc(a.id) + ' full size">' +
      '<img src="assets/creative/' + a.file + '" width="' + a.w + '" height="' + a.h + '" alt="' + esc(a.alt) + '" loading="lazy" decoding="async">' +
      '<span>' + esc(a.id) + ' - ' + esc(a.audience) + '</span></button>';
  }

  gridEl.innerHTML = SETS.map(function (s) {
    var items = ASSETS.filter(function (a) { return a.set === s.id; });
    return '<article class="campaign-card creative-card">' +
      '<b>Creative set ' + s.id + '</b>' +
      '<h3>' + esc(s.title) + '</h3>' +
      '<p>' + esc(s.copy) + '</p>' +
      '<div class="creative-pair">' + items.map(thumb).join("") + '</div>' +
      '</article>';
  }).join("");

  var slides = [];
  var timer = null;
  var running = false;
  var manuallyPaused = false;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function paint() {
    var a = view[viewIndex];
    if (!a) return;
    slides.forEach(function (s, i) { s.classList.toggle("is-active", i === viewIndex); });
    Array.prototype.slice.call(dotsEl.querySelectorAll(".cr-dot")).forEach(function (d, i) {
      d.classList.toggle("is-active", i === viewIndex);
      d.setAttribute("aria-current", i === viewIndex ? "true" : "false");
    });
    countEl.textContent = (viewIndex + 1) + " / " + view.length;
    metaEl.innerHTML = '<strong>Series ' + esc(a.series) + ' - ' + esc(a.format) + '</strong>' +
      '<span>' + esc(a.audience) + '</span>' +
      '<span class="cr-meta-cta">' + esc(a.headline) + '</span>';
    liveEl.textContent = "Creative " + (viewIndex + 1) + " of " + view.length + ": series " + a.series + ", " + a.audience + ". " + a.headline;
  }

  function paintToggle() {
    toggleEl.textContent = running ? "Pause" : "Play";
    toggleEl.setAttribute("aria-pressed", running ? "false" : "true");
    toggleEl.setAttribute("aria-label", running ? "Pause the automatic rotation" : "Resume the automatic rotation");
  }

  function restartBar() {
    if (!barEl) return;
    barEl.style.transition = "none";
    barEl.style.width = "0%";
    void barEl.offsetWidth;
    if (running) {
      barEl.style.transition = "width " + INTERVAL + "ms linear";
      barEl.style.width = "100%";
    }
  }

  function freezeBar() {
    if (!barEl) return;
    var track = barEl.parentNode;
    var w = track ? track.getBoundingClientRect().width : 0;
    var cur = barEl.getBoundingClientRect().width;
    barEl.style.transition = "none";
    barEl.style.width = (w > 0 ? Math.min(100, (cur / w) * 100) : 0) + "%";
  }

  function start() {
    if (running || reduced) return;
    running = true;
    if (timer) clearInterval(timer);
    timer = setInterval(function () { show(viewIndex + 1); }, INTERVAL);
    restartBar();
    paintToggle();
  }

  function stop() {
    running = false;
    if (timer) { clearInterval(timer); timer = null; }
    freezeBar();
    paintToggle();
  }

  function show(i) {
    viewIndex = (i + view.length) % view.length;
    paint();
    if (running) {
      if (timer) clearInterval(timer);
      timer = setInterval(function () { show(viewIndex + 1); }, INTERVAL);
    }
    restartBar();
  }

  function applyFilter(id) {
    activeFilter = id;
    view = id === "all" ? ASSETS.slice() : ASSETS.filter(function (a) { return a.series === id; });
    viewIndex = 0;
    Array.prototype.slice.call(filtersEl.querySelectorAll(".cr-filter")).forEach(function (b) {
      var on = b.getAttribute("data-filter") === id;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    render();
    if (running) {
      if (timer) clearInterval(timer);
      timer = setInterval(function () { show(viewIndex + 1); }, INTERVAL);
    }
    restartBar();
  }

  function pauseForUser() { manuallyPaused = true; stop(); }
  function resumeForUser() { manuallyPaused = false; if (!reduced) start(); }

  toggleEl.addEventListener("click", function () {
    if (running) { pauseForUser(); } else { resumeForUser(); }
  });
  prevEl.addEventListener("click", function () { show(viewIndex - 1); });
  nextEl.addEventListener("click", function () { show(viewIndex + 1); });
  dotsEl.addEventListener("click", function (e) {
    var b = e.target.closest(".cr-dot");
    if (!b) return;
    show(parseInt(b.getAttribute("data-go"), 10));
  });
  filtersEl.addEventListener("click", function (e) {
    var b = e.target.closest(".cr-filter");
    if (!b) return;
    applyFilter(b.getAttribute("data-filter"));
  });

  var carousel = document.getElementById("creativeCarousel");

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) { stop(); }
    else if (!manuallyPaused && !reduced && lb.hidden) { start(); }
  });

  document.addEventListener("keydown", function (e) {
    if (!lb.hidden) {
      if (e.key === "Escape") { closeLb(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); lbGo(-1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); lbGo(1); }
      return;
    }
    if (!carousel.contains(document.activeElement)) return;
    if (e.key === "ArrowLeft") { e.preventDefault(); show(viewIndex - 1); }
    if (e.key === "ArrowRight") { e.preventDefault(); show(viewIndex + 1); }
  });

  var lbIndex = 0;
  var lastFocus = null;

  function renderLb() {
    var a = ASSETS[lbIndex];
    lbImg.src = "assets/creative/" + a.file;
    lbImg.alt = a.alt;
    lbImg.width = a.w;
    lbImg.height = a.h;
    lbSet.textContent = "Series " + a.series + " - " + a.format;
    lbTitle.textContent = a.headline;
    lbAudience.textContent = a.audience;
    lbChannel.textContent = a.format;
    lbObjective.textContent = a.objective;
    lbStage.textContent = a.stage;
    lbCta.textContent = a.cta;
    lbCount.textContent = (lbIndex + 1) + " of " + ASSETS.length;
  }

  function openLb(i) {
    lbIndex = (i + ASSETS.length) % ASSETS.length;
    lastFocus = document.activeElement;
    renderLb();
    lb.hidden = false;
    document.body.classList.add("cr-lb-open");
    stop();
    lbClose.focus();
  }

  function closeLb() {
    lb.hidden = true;
    document.body.classList.remove("cr-lb-open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    if (!manuallyPaused && !reduced) start();
  }

  function lbGo(step) {
    lbIndex = (lbIndex + step + ASSETS.length) % ASSETS.length;
    renderLb();
  }

  stage.addEventListener("click", function (e) {
    var b = e.target.closest("[data-open]");
    if (b) openLb(parseInt(b.getAttribute("data-open"), 10));
  });
  gridEl.addEventListener("click", function (e) {
    var b = e.target.closest("[data-open]");
    if (b) openLb(parseInt(b.getAttribute("data-open"), 10));
  });
  lbClose.addEventListener("click", closeLb);
  lbPrev.addEventListener("click", function () { lbGo(-1); });
  lbNext.addEventListener("click", function () { lbGo(1); });
  lb.addEventListener("click", function (e) {
    if (e.target.hasAttribute("data-close")) closeLb();
  });

  render();
  paintToggle();
  if (!reduced) start();
})();
