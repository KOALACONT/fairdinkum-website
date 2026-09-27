/* Site JS — brand-agnostic. Every brand value comes from the #site-config JSON
   block emitted by build.js from data/site.json. Do not hardcode a brand,
   domain, phone or email in this file: copying it to another brand's repo is
   how leads end up routed to the wrong business.

   KNOWN SECURITY ISSUE — the lead-intake shared secret below is a plain string
   in public JavaScript on every brand site in the group, so anyone who views
   source can post fabricated leads into the CRM. This is a group-wide problem
   rather than something specific to this repo, and rotating it has to happen on
   the edge function and every brand site at the same time. It is flagged and
   waiting on a decision — do not rotate it here in isolation. */
(function () {
  "use strict";

  var CFG = {};
  try {
    var el = document.getElementById("site-config");
    if (el) CFG = JSON.parse(el.textContent || "{}");
  } catch (e) {}

  var CONFIG = {
    endpoint: CFG.endpoint,
    secret: "jfkgdlh!?gfhsldfh**dfs23",
    brand: CFG.brand,
    domain: CFG.domain
  };
  var PHONE = CFG.phone || "";
  var PHONE_HREF = CFG.phoneHref || "";
  var EMAIL = CFG.email || "";
  var PROMISE = CFG.promise || "";

  // Meta tracking is configured per brand and disabled on previews.
  var metaPixelId = CFG.metaPixelId;
  var metaHost = String(CFG.domain || "").replace(/^https?:\/\//, "").replace(/\/$/, "").replace(/^www\./, "");
  var robots = document.querySelector('meta[name="robots"]');
  var metaEnabled = /^\d+$/.test(metaPixelId || "") &&
    location.hostname.replace(/^www\./, "") === metaHost &&
    !(robots && /noindex/i.test(robots.content));
  function metaEvent(name) {
    if (metaEnabled && window.fbq) {
      try { window.fbq("trackSingle", metaPixelId, name); } catch (e) {}
    }
  }
  if (metaEnabled) {
    try {
      (function(f,b,e,v,n,t,s) {
        if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";
        n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;
        s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s);
      })(window,document,"script","https://connect.facebook.net/en_US/fbevents.js");
      window.fbq("set", "autoConfig", false, metaPixelId);
      window.fbq("init", metaPixelId);
      metaEvent("PageView");
    } catch (e) {}
  }

  // Mobile menu
  var burger = document.querySelector(".burger");
  var menu = document.querySelector(".menu");
  if (burger && menu) {
    burger.addEventListener("click", function () {
      var open = menu.classList.toggle("show");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  // UTM capture
  // Remember this tab's latest tagged arrival for 30 minutes across pages.
  // A new tagged arrival replaces ALL fields, so Google and Meta cannot mix.
  var ATTR_KEY = "fairdinkum_campaign_attribution_v1";
  var ATTR_TTL = 30 * 60 * 1000;
  var ATTR_FIELDS = ["utm_source","utm_medium","utm_campaign","utm_term","utm_content","gclid","gbraid","wbraid","fbclid","campaignid","adgroupid","adid","network","device","matchtype"];
  var attrMemory = null;
  var attrStorage = true;

  function cleanAttribution(values) {
    var out = {};
    if (values && typeof values === "object" && !Array.isArray(values)) {
      ATTR_FIELDS.forEach(function (k) {
        if (Object.prototype.hasOwnProperty.call(values, k) && typeof values[k] === "string" && values[k]) {
          out[k] = values[k].slice(0, 500);
        }
      });
    }
    return out;
  }

  function utm() {
    var saved = attrMemory;
    try { if (attrStorage) saved = JSON.parse(sessionStorage.getItem(ATTR_KEY) || "null"); } catch (e) {}
    var age = saved && Date.now() - saved.at;
    if (saved && typeof saved.at === "number" && age >= 0 && age < ATTR_TTL) {
      return cleanAttribution(saved.values);
    }
    attrMemory = null;
    try { sessionStorage.removeItem(ATTR_KEY); } catch (e) {}
    return {};
  }

  // Capture on arrival, including pages without a form. Submitting never
  // refreshes the expiry. Storage restrictions must never block an enquiry.
  (function () {
    var values = {};
    try {
      var params = new URLSearchParams(location.search);
      ATTR_FIELDS.forEach(function (k) { if (params.get(k)) values[k] = params.get(k).slice(0, 500); });
    } catch (e) {}
    if (Object.keys(values).length) {
      attrMemory = { at: Date.now(), values: values };
      try { sessionStorage.setItem(ATTR_KEY, JSON.stringify(attrMemory)); } catch (e) {
        attrStorage = false;
        try { sessionStorage.removeItem(ATTR_KEY); } catch (ignored) {}
      }
    } else {
      utm();
    }
  })();



  /* Size dropdown values map to real specifications only. A value that is not a
     size — "unsure", a hire option, a type — must NEVER be sent as a literal
     size, because the CRM treats size as a genuine specification and a
     fabricated "20ft" against an unsure enquiry produces a wrong quote. Every
     dropdown on this site ends in a "Not sure" option, because not knowing
     which size or grade you need is the commonest reason a container buyer
     abandons a form. That option has to arrive at the CRM as empty, not as a
     guess. */
  var SIZE_MAP = {
    "10ft": "10ft",
    "20ft": "20ft",
    "40ft": "40ft",
    "high-cube": "High Cube",
    "side-opening": "Side Opening",
    "dg": "Dangerous Goods",
    "unsure": ""
  };
  var GRADE_LABEL = {
    "cargo-worthy": "Cargo-worthy (checked wind and watertight)",
    "new": "New single-trip",
    "as-is": "As-is (cheapest, not sold watertight)",
    "unsure": "Not sure which grade"
  };
  /* Timeframe leads with "Today" deliberately — it qualifies urgency at no cost
     to the person filling the form and it tells the sales desk who to ring
     first. */
  var WHEN_LABEL = {
    "today": "Wants it TODAY",
    "this-week": "This week",
    "next-week": "Next week",
    "next-month": "Next month",
    "unsure": "No fixed date"
  };

  // Quote forms
  document.querySelectorAll("form[data-quote]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var trap = form.querySelector('input[name="business_url"]');
      if (trap && trap.value) return; // honeypot

      var f = {};
      new FormData(form).forEach(function (v, k) { f[k] = String(v); });
      var parts = (f.name || "").trim().split(/\s+/);
      var u = utm();
      var ctx = [];
      if (f.intent) ctx.push("Wants to: " + f.intent.toUpperCase());
      if (f.when && WHEN_LABEL[f.when]) ctx.push("When: " + WHEN_LABEL[f.when]);
      if (f.grade && GRADE_LABEL[f.grade]) ctx.push("Grade: " + GRADE_LABEL[f.grade]);
      ctx.push("Page: " + location.pathname);
      if (u.utm_source) ctx.push("Source: " + u.utm_source + (u.utm_campaign ? " / " + u.utm_campaign : ""));
      if (u.gclid) ctx.push("Google Ads click");

      /* The location field accepts a suburb OR a postcode. Send the raw string
         as the suburb, and only populate postcode when the value really is a
         four digit number. Sending suburb text into the postcode column fills
         it with words and breaks freight lookups. */
      var loc = (f.suburb || "").trim();
      var isPostcode = /^\d{4}$/.test(loc);

      var payload = {
        secret: CONFIG.secret,
        brand: CONFIG.brand,
        domain: CONFIG.domain,
        first_name: parts.shift() || null,
        last_name: parts.join(" ") || null,
        phone: f.phone || null,
        email: f.email || null,
        suburb: loc || null,
        postcode: isPostcode ? loc : null,
        size: SIZE_MAP.hasOwnProperty(f.size) ? SIZE_MAP[f.size] : (f.size || ""),
        message: (f.message ? f.message + "\n\n" : "") + "— " + ctx.join(" | "),
        intent: f.intent || null,
        source_page: location.pathname,
        page_title: document.title,
        submitted_at: new Date().toISOString(),
        utm_source: u.utm_source || null,
        utm_medium: u.utm_medium || null,
        utm_campaign: u.utm_campaign || null,
        utm_term: u.utm_term || null,
        utm_content: u.utm_content || null,
        gclid: u.gclid || null,
        gbraid: u.gbraid || null,
        wbraid: u.wbraid || null,
        fbclid: u.fbclid || null,
        campaignid: u.campaignid || null,
        adgroupid: u.adgroupid || null,
        adid: u.adid || null,
        network: u.network || null,
        device: u.device || null,
        matchtype: u.matchtype || null
      };

      var btn = form.querySelector('button[type="submit"]');
      var was = btn ? btn.textContent : "";
      if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }

      function ok() {
        metaEvent("Lead");
        var d = document.createElement("div");
        d.className = "q-ok";
        d.innerHTML = "<strong>Got it — that's with us.</strong> " +
          (PROMISE ? PROMISE + ". " : "") +
          "Can't wait? Ring <a href='" + PHONE_HREF + "'>" + PHONE + "</a>.";
        form.parentNode.replaceChild(d, form);
        if (window.gtag) { try { window.gtag("event", "generate_lead", { form_id: form.id || "quote" }); } catch (e) {} }
        if (location.pathname !== "/thank-you/") setTimeout(function () { location.href = "/thank-you/"; }, 900);
      }
      /* The failure path shows a real failure. Never fake a success here: a lead
         that silently vanished is worse than one the customer knows to re-send. */
      function bad() {
        if (btn) { btn.disabled = false; btn.textContent = was; }
        var d = form.querySelector(".q-bad") || document.createElement("div");
        d.className = "q-bad";
        d.innerHTML = "That didn't send — sorry. Ring <a href='" + PHONE_HREF + "'>" + PHONE + "</a> or email <a href='mailto:" + EMAIL + "'>" + EMAIL + "</a>.";
        form.insertBefore(d, form.firstChild);
      }

      if (!CONFIG.endpoint || !CONFIG.brand) { bad(); return; }

      fetch(CONFIG.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(function (r) { r.ok ? ok() : bad(); }).catch(bad);
    });
  });

  /* Scroll reveal. Purely presentational — the .reveal class starts elements
     slightly offset and this adds .in when they scroll into view. If JS never
     runs, nothing is hidden: the CSS also clears .reveal entirely under
     prefers-reduced-motion, and the no-JS fallback below reveals everything
     immediately so content is never dependent on this. */
  var reveals = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    reveals.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    reveals.forEach(function (el) { io.observe(el); });
    // Anything already in view on load reveals straight away.
    setTimeout(function () {
      reveals.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight) el.classList.add("in");
      });
    }, 60);
  }
})();
