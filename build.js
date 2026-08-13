#!/usr/bin/env node
/* ============================================================================
   Fair Dinkum Containers — static site generator.  node build.js → ./dist
   TEST_BUILD=1 → every page noindex + robots Disallow.  OUT_DIR overrides.

   Every brand string comes from data/site.json. Nothing about the brand is
   hardcoded below, which is what lets this engine be lifted to another brand
   by swapping the data directory — and is also why copying a DATA file
   between brands is the one thing that routes leads to the wrong business.

   PAGE SKELETON — deliberately its own, not a recolour of any other site in
   the group. Structural distinctness is both a design goal and an SEO
   requirement, so this file shares no layout primitive with the sibling
   repos:

     - TWO-TIER masthead: an identity row (mark, promise, phone) above a dark
       sticky nav band carrying a photographic MEGA MENU. The sibling sites
       run a single-tier masthead with a plain link row.
     - SPLIT hero: photograph behind, copy left, and a white quote card lifted
       out over the image on the right. No centred full-bleed hero anywhere.
     - EDITORIAL PHOTO BANDS: alternating half-width image / half-width copy,
       full-bleed, no container. This is the site's main content rhythm.
     - SPEC SHEETS on size and type pages: a hard dimension table beside a
       sticky price panel, plus a photo gallery. Not a ladder, not a spine.
     - A THREE-COLUMN footer with a locality run.

   PHOTOGRAPHY. This is the first site in the group to run with photos on.
   IMG() checks the file actually exists on disk at build time and emits
   nothing if it does not, so a missing photo degrades to the CSS gradient
   placeholder rather than a broken image. That check is what makes
   "photos": true safe to leave on while the library is still being filled.
   ========================================================================= */

const fs = require("fs");
const path = require("path");

const S = require("./data/site.json");
const P = require("./data/products.json");

/* Localities are split across regional files under data/locations/ rather than
   one 300KB blob — easier to edit, easier to review in a diff, and it keeps any
   single file inside what tooling will handle. The ORDER of this list sets the
   order localities appear in the footer, the delivery-areas hub and the home
   page grid. It deliberately does NOT affect the rotated locality copy: that is
   keyed on the slug via rank(), so reordering or adding a region cannot
   silently rewrite the wording of the existing pages. */
const LOC_REGIONS = ["seq", "downs", "north", "south"];
const LOCS = LOC_REGIONS.reduce((a, r) => a.concat(require(`./data/locations/${r}.json`).locations), []);
(function checkLocalities() {
  const seen = new Set();
  LOCS.forEach((l) => {
    if (seen.has(l.slug)) throw new Error(`duplicate locality slug: ${l.slug}`);
    seen.add(l.slug);
    ["slug", "name", "state", "postcode", "depot", "leadTime", "truck", "metaDesc", "line", "uses", "access"].forEach((k) => {
      if (!l[k]) throw new Error(`locality ${l.slug} is missing "${k}"`);
    });
    if (!Array.isArray(l.sections) || !l.sections.length) throw new Error(`locality ${l.slug} has no sections`);
    if (!Array.isArray(l.faqs) || !l.faqs.length) throw new Error(`locality ${l.slug} has no faqs`);
    if (!Array.isArray(l.near) || !l.near.length) throw new Error(`locality ${l.slug} has no near list`);
  });
})();
const POSTS = require("./data/posts.js");

const OUT = process.env.OUT_DIR || "dist";
const DIST = path.isAbsolute(OUT) ? OUT : path.join(__dirname, OUT);
const TEST = !!process.env.TEST_BUILD;
const D = S.domain;
const pages = [];

const BRAND = S.name;
const SHORT = S.short || BRAND.replace(/\s+Containers$/i, "");

/* E.164 for schema. Handles an 0X mobile and a 13/1300/1800 number alike. */
const PHONE_DIGITS = String(S.phoneHref).replace(/\D/g, "");
const TEL_E164 = "+61" + (PHONE_DIGITS.charAt(0) === "0" ? PHONE_DIGITS.slice(1) : PHONE_DIGITS);

/* Trading hours are group-standard. "hours" and "hoursSchema" must ALWAYS be
   set together or both left absent — the hours a human reads and the hours
   Google reads have to come from the same confirmed fact. Nothing below
   invents them; masthead, contact page and LocalBusiness all omit hours when
   the value is missing. */
const HOURS = S.hours || null;
const SERVICE_AREA = S.serviceArea || "Australia-wide";

const PROMISE = S.responsePromise;
const PROMISE_DETAIL = S.responseDetail;

/* Review rating and count are NOT rendered. site.json carries the numbers off
   the verified Google Business Profile, but a hardcoded count goes stale and
   is indistinguishable from fabrication. AggregateRating is emitted only when
   reviews.show is true AND the numbers are pulled live. Leave it false. */
const SHOW_REVIEWS = !!(S.reviews && S.reviews.show === true);

const ADDR = S.address || {};
function postalAddress() {
  const a = { "@type": "PostalAddress" };
  if (ADDR.street) a.streetAddress = ADDR.street;
  if (ADDR.suburb) a.addressLocality = ADDR.suburb;
  if (ADDR.state) a.addressRegion = ADDR.state;
  if (ADDR.postcode) a.postalCode = ADDR.postcode;
  a.addressCountry = "AU";
  return a;
}
const ADDR_LINE = [ADDR.street, ADDR.suburb, ADDR.state, ADDR.postcode].filter(Boolean).join(", ");

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const aud = (n) => "$" + Number(n).toLocaleString("en-AU");
const auDate = (iso) => { const d = new Date(iso + "T00:00:00Z"); return String(d.getUTCDate()).padStart(2, "0") + "/" + String(d.getUTCMonth() + 1).padStart(2, "0") + "/" + d.getUTCFullYear(); };
const para = (v) => (Array.isArray(v) ? v : [v]).map((x) => `<p>${esc(x)}</p>`).join("");

/* Locality "access" copy arrives from the data files as one 220–360 word
   string. Rendered as a single <p> it is a wall — so split it at sentence
   boundaries into roughly even paragraphs of about 90 words. Splitting on
   ". " alone would break on "e.g." and on decimals, hence the lookahead for
   a capital or a digit that starts a new sentence. */
function paras(v, targetWords) {
  if (Array.isArray(v)) return para(v);
  const sentences = String(v).match(/[^.!?]+[.!?]+(?=\s+[A-Z0-9]|\s*$)/g) || [String(v)];
  const target = targetWords || 90;
  const chunks = [];
  let buf = [], n = 0;
  sentences.forEach((s, i) => {
    buf.push(s.trim());
    n += s.trim().split(/\s+/).length;
    const remaining = sentences.length - i - 1;
    if (n >= target && remaining >= 2) { chunks.push(buf.join(" ")); buf = []; n = 0; }
  });
  if (buf.length) chunks.push(buf.join(" "));
  return para(chunks);
}

function out(urlPath, html) {
  const dir = urlPath ? path.join(DIST, urlPath) : DIST;
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
  pages.push(urlPath === "" ? "/" : `/${urlPath}/`);
}

/* ---------------------------------------------------------------- photos --
   A photo is emitted only if the .webp is actually on disk. Missing photos
   fall through to the CSS gradient placeholder — no 404s, no broken images,
   and the site is shippable before the library is finished. */
const PHOTOS_ON = S.photos === true;
const PHOTO_DIR = path.join(__dirname, "static", "img", "photos");
const havePhoto = (name) => PHOTOS_ON && fs.existsSync(path.join(PHOTO_DIR, name + ".webp"));
const PHOTO_USED = new Set();
function IMG(name, alt, opts) {
  const o = opts || {};
  if (!havePhoto(name)) return "";
  PHOTO_USED.add(name);
  return `<img src="/img/photos/${name}.webp" alt="${esc(alt)}" width="${o.w || 1600}" height="${o.h || 1200}"${o.eager ? '' : ' loading="lazy"'} decoding="async">`;
}

/* ----------------------------------------------------------- brand mark --
   The Fair Dinkum wordmark, rebuilt as SVG from the live logo: "Fair Dinkum"
   in near-black over "Containers" in brand green, with a corrugated container
   glyph on the right. Vector, so it stays crisp at any size — the live site
   serves a 768px raster. Text is derived from site.json, never typed in. */
const MARK_TOP = SHORT;
const MARK_SUB = BRAND.slice(SHORT.length).trim() || "Containers";
const mark = (topFill, subFill, boxFill, boxLine) => `<svg viewBox="0 0 306 96" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(BRAND)}">
<text x="0" y="40" font-family="Figtree,Poppins,Helvetica,Arial,sans-serif" font-weight="800" font-size="41" letter-spacing="-1.9" fill="${topFill}">${esc(MARK_TOP)}</text>
<text x="1" y="85" font-family="Figtree,Poppins,Helvetica,Arial,sans-serif" font-weight="800" font-size="35" letter-spacing="-1.2" fill="${subFill}">${esc(MARK_SUB)}</text>
<g transform="translate(202,55)">
  <rect x="0" y="0" width="100" height="31" rx="2.5" fill="${boxFill}"/>
  <rect x="0" y="0" width="100" height="31" rx="2.5" fill="none" stroke="${boxLine}" stroke-width="2"/>
  <path d="M11 4v23M20 4v23M29 4v23M38 4v23M47 4v23M56 4v23M65 4v23M74 4v23" stroke="${boxLine}" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M83 2.5v26" stroke="${boxLine}" stroke-width="2.6"/>
  <path d="M91 4v23" stroke="${boxLine}" stroke-width="2.6" stroke-linecap="round"/>
</g>
</svg>`;
const markDark = mark("#12211A", "#2D8856", "#FFFFFF", "#2D8856");
const markLight = mark("#FFFFFF", "#9CCFB4", "#0E2A1C", "#9CCFB4");

/* ------------------------------------------------------------- the shell -- */
function head(t, d, canon, schema, noindex) {
  return `<!DOCTYPE html><html lang="en-AU"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(t)}</title>
<meta name="description" content="${esc(d)}">
<link rel="canonical" href="${D}${canon}">
${noindex || TEST ? '<meta name="robots" content="noindex,nofollow">' : '<meta name="robots" content="index,follow,max-image-preview:large">'}
<meta property="og:title" content="${esc(t)}"><meta property="og:description" content="${esc(d)}">
<meta property="og:url" content="${D}${canon}"><meta property="og:site_name" content="${esc(BRAND)}">
<meta property="og:locale" content="en_AU"><meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0E2A1C">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@700;800;900&family=Inter:wght@400;500;600;650&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/style.css">
<link rel="icon" type="image/svg+xml" href="/img/favicon.svg">
<link rel="apple-touch-icon" href="/img/favicon.svg">
${schema ? `<script type="application/ld+json">${JSON.stringify(schema)}</script>` : ""}
</head><body>
<a class="skip" href="#main">Skip to content</a>`;
}

const biz = () => {
  const b = {
    "@type": "LocalBusiness",
    "@id": `${D}/#biz`,
    name: BRAND,
    url: D,
    telephone: TEL_E164,
    email: S.email,
    priceRange: "$$",
    description: S.tagline,
    address: postalAddress(),
    ...(S.geo ? { geo: { "@type": "GeoCoordinates", latitude: S.geo.lat, longitude: S.geo.lng } } : {}),
    /* openingHours is absent unless site.json carries a real hoursSchema
       array. Publishing invented hours puts wrong opening times into Google. */
    ...(Array.isArray(S.hoursSchema) && S.hoursSchema.length ? { openingHours: S.hoursSchema } : {}),
    areaServed: [{ "@type": "Country", name: "Australia" }].concat(LOCS.map((l) => ({ "@type": "City", name: l.name })))
  };
  if (SHOW_REVIEWS && S.reviews.rating && S.reviews.count) {
    b.aggregateRating = { "@type": "AggregateRating", ratingValue: S.reviews.rating, reviewCount: S.reviews.count };
  }
  return b;
};
const crumbsLd = (c) => ({ "@type": "BreadcrumbList", itemListElement: c.map((x, i) => ({ "@type": "ListItem", position: i + 1, name: x[0], item: `${D}${x[1]}` })) });
const faqLd = (faqs) => (faqs && faqs.length ? { "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) } : null);
const productLd = (x) => ({
  "@type": "Product", name: x.title, description: x.lead,
  brand: { "@type": "Brand", name: BRAND },
  offers: { "@type": "AggregateOffer", priceCurrency: "AUD", lowPrice: x.usedFrom, highPrice: x.newFrom, availability: "https://schema.org/InStock", seller: { "@id": `${D}/#biz` } }
});
const g = (...items) => ({ "@context": "https://schema.org", "@graph": [biz(), ...items.filter(Boolean)] });

/* -------------------------------------------------- two-tier masthead ---- */
const MEGA = P.sizes.map((x) => ({ href: `/${x.slug}/`, name: x.name, blurb: x.pickIf, photo: "mega-" + x.short }))
  .concat(P.types.map((x) => ({ href: `/${x.slug}/`, name: x.name, blurb: x.lead.split(".")[0] + ".", photo: "mega-" + x.slug.split("-")[0] })));

const NAV = [
  { href: "/shipping-containers/", label: "Containers", mega: true },
  { href: "/container-sales/", label: "Buying" },
  { href: "/shipping-container-hire/", label: "Hire" },
  { href: "/delivery/", label: "Delivery" },
  { href: "/delivery-areas/", label: "Where we deliver" },
  { href: "/blog/", label: "Guides" },
  { href: "/about/", label: "About" },
  { href: "/contact/", label: "Contact" }
];

function mast() {
  const megaPanel = `<div class="mega">${MEGA.map((m) => `<a href="${m.href}">${IMG(m.photo, m.name + " shipping container", { w: 400, h: 300 }) || '<span class="mega-ph"></span>'}<b>${esc(m.name)}</b><span>${esc(m.blurb.length > 84 ? m.blurb.slice(0, 81).trim() + "…" : m.blurb)}</span></a>`).join("")}</div>`;
  return `<header class="top">
<div class="wrap">
  <a class="top-brand" href="/" aria-label="${esc(BRAND)} home">${markDark}</a>
  <div class="top-say"><b>${esc(S.yardPromise)} — ${esc(ADDR.suburb)}, ${esc(ADDR.state)}</b><span>${esc(S.yardDetail)}</span></div>
  <div class="top-act">
    <a class="top-tel" href="${S.phoneHref}"><small>Talk to a person</small>${esc(S.phone)}</a>
    <a class="btn btn-primary" href="/contact/">Get a price</a>
  </div>
</div>
</header>
<nav class="navband" id="navband" aria-label="Primary"><div class="wrap">
  <ul class="menu">${NAV.map((n) => `<li${n.mega ? ' class="has-mega"' : ""}><a href="${n.href}">${esc(n.label)}</a>${n.mega ? megaPanel : ""}</li>`).join("")}</ul>
  <div class="nav-mini">${HOURS ? `<span class="nav-hours">${esc(HOURS)}</span>` : ""}</div>
  <button class="burger" aria-label="Menu" aria-expanded="false" aria-controls="navband"><span class="burger-label">Menu</span><span class="burger-bars"><span></span><span></span><span></span></span></button>
</div></nav>`;
}

const promiseStrip = () => `<div class="promise"><div class="wrap"><b>${esc(PROMISE)}.</b><span>${esc(PROMISE_DETAIL)}</span></div></div>`;

/* ------------------------------------------------------------- the ask ---
   Two conversion decisions are baked in and should not be undone without a
   reason. Every dropdown ends in a "Not sure" option, because not knowing
   which size or grade you need is the commonest reason a container buyer
   abandons a form. And the timeframe question leads with "Today", because it
   qualifies urgency at no cost and tells the sales desk who to ring first.
   Qualifying questions come BEFORE contact details, always. */
function quoteForm(u, compact) {
  return `<form class="askcard" data-quote novalidate>
    ${compact ? "" : `<h3>Tell us about the job</h3><p class="askcard-note">Four quick questions about the container, then how to reach you. ${esc(PROMISE)}.</p>`}
    <p class="qstage-h">1. Buying or hiring?</p>
    <div class="qtoggle">
      <input type="radio" name="intent" value="buy" id="qi-b${u}" checked><label for="qi-b${u}">Buying</label>
      <input type="radio" name="intent" value="hire" id="qi-h${u}"><label for="qi-h${u}">Hiring</label>
    </div>
    <div class="qgrid">
      <div>
        <label for="q-size${u}">2. What size?</label>
        <select name="size" id="q-size${u}">
          <option value="20ft">20ft — the usual answer</option>
          <option value="10ft">10ft</option>
          <option value="40ft">40ft</option>
          <option value="high-cube">High cube</option>
          <option value="side-opening">Side opening</option>
          <option value="dg">Dangerous goods</option>
          <option value="unsure">Not sure — help me work it out</option>
        </select>
      </div>
      <div>
        <label for="q-grade${u}">3. What grade?</label>
        <select name="grade" id="q-grade${u}">
          <option value="cargo-worthy">Cargo-worthy used</option>
          <option value="new">New single-trip</option>
          <option value="as-is">As-is — cheapest</option>
          <option value="unsure">Not sure — explain the difference</option>
        </select>
      </div>
      <div>
        <label for="q-when${u}">4. When do you need it?</label>
        <select name="when" id="q-when${u}">
          <option value="today">Today</option>
          <option value="this-week">This week</option>
          <option value="next-week">Next week</option>
          <option value="next-month">Next month</option>
          <option value="unsure">Not sure yet</option>
        </select>
      </div>
      <div>
        <label for="q-suburb${u}">Delivery suburb or postcode</label>
        <input name="suburb" id="q-suburb${u}" type="text" autocomplete="address-level2" placeholder="e.g. Gatton or 4343">
      </div>
    </div>
    <div class="qstage">
      <p class="qstage-h">And how do we reach you?</p>
      <div class="qgrid">
        <div><label for="q-name${u}">Your name</label><input name="name" id="q-name${u}" type="text" autocomplete="name" required></div>
        <div><label for="q-phone${u}">Phone</label><input name="phone" id="q-phone${u}" type="tel" autocomplete="tel" required></div>
      </div>
      <label for="q-email${u}">Email (optional)</label><input name="email" id="q-email${u}" type="email" autocomplete="email">
      <label for="q-msg${u}">Anything we should know?</label><textarea name="message" id="q-msg${u}" rows="2" placeholder="What's going in it, and what the access is like"></textarea>
    </div>
    <input type="text" name="business_url" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">
    <button type="submit" class="btn btn-primary btn-wide btn-lg">Send it through</button>
    <p class="qnote">${esc(PROMISE_DETAIL)} Your details stay with us.</p>
  </form>`;
}

function ask(heading, sub, idSuffix) {
  const u = idSuffix ? "-" + idSuffix : "";
  return `<section class="ask" id="quote"><div class="wrap">
  <div class="sec-head"><p class="eyebrow">Get a price</p><h2>${esc(heading)}</h2><p class="ask-sub">${esc(sub)}</p></div>
  ${quoteForm(u)}
  <p class="ask-or">Or skip the form and ring us — <a href="${S.phoneHref}">${esc(S.phone)}</a>${HOURS ? ", " + esc(HOURS) : ""}</p>
</div></section>`;
}

/* --------------------------------------------------- three-column footer -- */
function foot() {
  const col = (label, items) => `<div><h4>${esc(label)}</h4><ul>${items.map((x) => `<li><a href="${x[0]}">${esc(x[1])}</a></li>`).join("")}</ul></div>`;
  return `<footer class="foot">
<div class="wrap">
  <div class="foot-top">
    <div>
      <div class="foot-brand"><a href="/" aria-label="${esc(BRAND)} home">${markLight}</a></div>
      <p class="foot-tag">${esc(S.tagline)}</p>
      <div class="foot-contact">
        <a class="foot-tel" href="${S.phoneHref}">${esc(S.phone)}</a>
        <a class="foot-mail" href="mailto:${S.email}">${esc(S.email)}</a>
        ${ADDR_LINE ? `<address class="foot-addr">${esc(ADDR_LINE)}</address>` : ""}
        ${HOURS ? `<span class="foot-addr">${esc(HOURS)}</span>` : ""}
      </div>
    </div>
    ${col("Containers", P.sizes.map((x) => [`/${x.slug}/`, x.name]).concat(P.types.map((x) => [`/${x.slug}/`, x.name])).concat([["/shipping-containers/", "The full range"]]))}
    ${col("Buying and hiring", [["/container-sales/", "Buying a container"], ["/shipping-container-hire/", "Container hire"], ["/container-storage/", "Storage"], ["/container-grades/", "Grades explained"], ["/container-inspection/", "Inspection checklist"], ["/dimensions/", "Dimensions and weights"], ["/how-it-works/", "How ordering works"]])}
    ${col(SHORT, [["/about/", "About " + SHORT], ["/delivery/", "Delivery and access"], ["/delivery-areas/", "Where we deliver"], ["/blog/", "Guides"], ["/faqs/", "FAQs"], ["/contact/", "Contact"], ["/privacy/", "Privacy"]])}
  </div>
  <div class="foot-locs">
    <h4>Where we deliver</h4>
    <div class="runlinks">${LOCS.map((l) => `<a href="/${l.slug}/">${esc(l.name)}</a>`).join("")}<a href="/delivery-areas/">Everywhere else</a></div>
  </div>
  <div class="foot-base">© ${new Date().getFullYear()} ${esc(BRAND)} — shipping container sales, hire and delivery ${esc(SERVICE_AREA)}. ${esc(PROMISE)}. Prices shown are guide prices in AUD and exclude GST; delivery is quoted with the container.</div>
</div></footer>
<div class="actionbar"><a class="btn btn-green" href="${S.phoneHref}">Call ${esc(S.phone)}</a><a class="btn btn-primary" href="/contact/">Get a price</a></div>
<script id="site-config" type="application/json">${JSON.stringify({ endpoint: S.leadEndpoint, brand: S.leadBrand, domain: S.leadSource, phone: S.phone, phoneHref: S.phoneHref, email: S.email, promise: PROMISE })}</script>
<script src="/js/app.js" defer></script></body></html>`;
}

const shell = (o, body) => head(o.t, o.d, o.c, o.schema, o.noindex) + mast() + `<main id="main">` + body + `</main>` + foot();
const crumbHtml = (c) => `<nav class="crumb" aria-label="Breadcrumb"><div class="wrap">${c.map((x, i) => (i === c.length - 1 ? `<strong>${esc(x[0])}</strong>` : `<a href="${x[1]}">${esc(x[0])}</a> <span aria-hidden="true">/</span> `)).join("")}</div></nav>`;

/* ------------------------------------------------------------ primitives -- */
const sec = (cls, inner) => `<section class="sec${cls ? " " + cls : ""}"><div class="wrap">${inner}</div></section>`;
const secHead = (eyebrow, h, p) => `<div class="sec-head reveal">${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ""}<h2>${esc(h)}</h2>${p ? `<p>${esc(p)}</p>` : ""}</div>`;
const qaHtml = (faqs) => `<div class="qa">${faqs.map((f) => `<div class="reveal"><h3>${esc(f.q)}</h3><p>${esc(f.a)}</p></div>`).join("")}</div>`;
const typeChips = () => `<div class="chips">${P.types.map((x) => `<a href="/${x.slug}/">${esc(x.name)}</a>`).join("")}</div>`;

/* The editorial photo band — this site's main content rhythm. Full-bleed,
   half image half copy, alternating side. */
function band(o) {
  return `<section class="band${o.alt ? " band-alt" : ""}${o.dark ? " band-dark" : ""}${o.wash ? " band-wash" : ""}">
  <div class="band-media">${IMG(o.photo, o.alt_text || o.h, { w: 1200, h: 900 })}</div>
  <div class="band-body"><div class="wrapless reveal">
    ${o.eyebrow ? `<p class="eyebrow">${esc(o.eyebrow)}</p>` : ""}
    <h2>${esc(o.h)}</h2>
    ${para(o.p)}
    ${o.extra || ""}
    ${o.cta ? `<p style="margin-top:1.4rem"><a class="btn ${o.dark ? "btn-ondark" : "btn-ghost"}" href="${o.cta[0]}">${esc(o.cta[1])}</a></p>` : ""}
  </div></div>
</section>`;
}

/* The as-is caveat is a single string in products.json. It must appear on the
   home page, the range hub, every size page, the buying page and the grades
   page. It is deliberately NOT on the locality pages: 34 pages carrying the
   same 95-word caveat is the single largest source of near-duplicate overlap
   between them. Locality pages carry locCaveat() instead — one sentence that
   still says grade decides watertight, pointing at the grades page. */
const asIs = () => `<p class="caveat reveal"><strong>Grade matters more than anything else in a container quote.</strong> ${esc(P.asIsNote)}</p>`;
const locCaveat = () => `<p class="caveat reveal">Grade moves the price more than size does, and it is what decides whether a unit is sold watertight — the full rundown is on the <a href="/container-grades/">grades page</a>.</p>`;

function rangeGrid(items) {
  return `<div class="range">${items.map((x) => `<article class="rangecard reveal">
    <div class="rangecard-media">${IMG("range-" + x.slug, x.title, { w: 800, h: 500 })}<span class="rangecard-size">${esc(x.short || x.name)}</span></div>
    <div class="rangecard-body">
      <h3><a href="/${x.slug}/">${esc(x.title)}</a></h3>
      <p>${esc(x.pickIf || x.lead.split(".")[0] + ".")}</p>
      ${x.usedFrom ? `<div class="rangecard-price"><div>Used from<b>${aud(x.usedFrom)}</b></div><div>New from<b>${aud(x.newFrom)}</b></div></div>` : ""}
    </div>
  </article>`).join("")}</div>`;
}

const specTable = (x) => `<table class="spectable"><caption>${esc(x.title)} — dimensions and weights</caption><tbody>
<tr><th scope="row">External (L × W × H)</th><td>${esc(x.specs.ext)}</td></tr>
<tr><th scope="row">Internal (L × W × H)</th><td>${esc(x.specs.int)}</td></tr>
<tr><th scope="row">Door opening (W × H)</th><td>${esc(x.specs.door)}</td></tr>
<tr><th scope="row">Internal volume</th><td>${esc(x.specs.cube)}</td></tr>
<tr><th scope="row">Tare weight</th><td>${esc(x.specs.tare)}</td></tr>
</tbody></table>`;

const priceBox = (x) => `<div class="pricebox reveal">
  <h3>Guide prices — ${esc(x.short)}</h3>
  <dl>
    <div><dt>Cargo-worthy used, from</dt><dd>${aud(x.usedFrom)}</dd></div>
    <div><dt>New single-trip, from</dt><dd>${aud(x.newFrom)}</dd></div>
    ${x.hire ? `<div><dt>Hire, from</dt><dd>${aud(x.hire)}<span style="font-size:.9rem;font-weight:600"> / week</span></dd></div>` : ""}
  </dl>
  <p class="pricenote">Guide prices in AUD, ex GST. Delivery is quoted with the container — it moves with distance and access, and one phone call gets you an exact number.</p>
  <a class="btn btn-primary btn-wide" href="/contact/">Get a price for your address</a>
</div>`;

const gallery = (names, alts) => {
  const shown = names.map((n, i) => ({ n, a: alts[i] })).filter((x) => havePhoto(x.n));
  if (!shown.length) return "";
  return `<div class="gallery reveal">${shown.map((x) => `<figure>${IMG(x.n, x.a, { w: 800, h: 600 })}<figcaption>${esc(x.a)}</figcaption></figure>`).join("")}</div>`;
};

/* ==========================================================================
   COPY ROTATION — keyed on the slug, not on the loop index.

   Pools indexed off a loop counter with fixed offsets do not decorrelate:
   three pools of the same length driven by the same variable wrap together,
   so pairs of localities land on identical headings, and the copy on every
   page depends on the ORDER of locations.json. hash32 (FNV-1a, deterministic,
   dependency-free) plus rank(salt, slug) gives each pool its own ordering of
   the locality slugs; pick() takes that rank modulo the pool length. Ranking
   rather than hashing modulo directly matters — a raw hash modulo 5 across 34
   slugs is not balanced, a rank is.

   Pigeonhole, stated plainly: 34 localities into a 7-entry pool must repeat.
   What matters is that no PAIR shares every rotated slot. Verified in the
   checks at the bottom of this file.
   ======================================================================== */
function hash32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}
const RANKS = Object.create(null);
function rank(salt, slug) {
  if (!RANKS[salt]) {
    const order = LOCS.map((l) => l.slug).slice().sort((a, b) => hash32(salt + ":" + a) - hash32(salt + ":" + b));
    RANKS[salt] = Object.create(null);
    order.forEach((s, i) => { RANKS[salt][s] = i; });
  }
  return RANKS[salt][slug] || 0;
}
const pick = (pool, salt, slug) => pool[rank(salt, slug) % pool.length];

/* Pool lengths are deliberately DIFFERENT — 8, 9, 7, 10, 8, 7, 9. Pools of
   equal length driven by the same rank collide on the same pairs; coprime-ish
   lengths spread the collisions out. Worst-case pair overlap is asserted in
   the checks at the end of build-pages.js. If it ever creeps up, add entries
   to a pool — that is the only real fix for the pigeonhole. */
const USES_HEADS = ["What people here put in them", "What they get used for around here", "The jobs they turn up on locally", "Where they end up in this district", "What the containers do here", "Common uses in and around town", "What locals buy them for", "The work they do around here"];
const ACCESS_HEADS = ["Getting a truck in", "What the delivery actually involves", "Access, ground and the last thirty metres", "The delivery problem here", "What the driver needs from the site", "Access notes for this district", "How the drop usually goes", "Getting it onto the block", "What the site has to allow for"];
const NEAR_HEADS = ["Also delivered nearby", "Other places on this run", "Nearby towns we cover", "Elsewhere in the district", "Other areas we deliver to", "More of the region", "Around the same run"];
const OPENERS = [
  "Here is the honest version of buying a container here.",
  "The short version, before the detail.",
  "What matters locally, first.",
  "Start here if you are working out what to order.",
  "The practical read on this town.",
  "What we tell people who ring from here.",
  "Worth knowing before you order.",
  "The local picture, briefly.",
  "First, the things that are specific to here.",
  "Before the detail, the shape of it."
];
const PROCESS_LINES = [
  "Ring us, tell us what is going in it and what the access is like, and we will tell you which grade and which truck the job needs before anyone talks money.",
  "One call sorts it. Size, grade, where it is going and what the entry looks like — that is everything we need to price it properly.",
  "Tell us the job rather than the product. What goes in, where it sits and how the truck gets there decides the rest.",
  "Send three photos of the site with your enquiry and we can usually tell you the truck and the timing straight back.",
  "We would rather ask two more questions on the phone than send the wrong container up the road.",
  "Describe the spot it has to land on and we will work backwards from there to the container and the truck.",
  "The order of questions is always the same: what is it for, what grade does that need, and can a truck get in.",
  "Give us the address and a rough idea of the entry and we will do the working out at our end."
];
const FREIGHT_LINES = [
  "Delivery is quoted with the container. It moves with the distance, the truck the site needs and how hard the last thirty metres are, so we price it per job rather than publish a figure that would be wrong for half the addresses here.",
  "We do not publish a delivery rate for this area, because a straightforward industrial drop and a tight residential one on the same street are not the same job. Ring and you will get an exact number.",
  "Cartage is worked out per address rather than off a table. Distance is only part of it — access is usually what moves the figure.",
  "Delivery is priced with the container, not separately and not off a list. One phone call gets you the real number for your address.",
  "There is no flat delivery rate here worth publishing. What the truck has to do at your end changes it too much, so we quote it per job.",
  "The cartage component depends on which depot the unit comes out of and what the site needs. We work it out with the quote.",
  "We quote delivery with the container every time. It is the honest way to do it when access varies as much as it does around here."
];
const ASK_LINES = [
  "Tell us where it is going and what it is for",
  "Get a price for your address",
  "Work out the right container with us",
  "Tell us about the job",
  "Get a delivered price sorted",
  "Ask us what fits your site",
  "Start with the address and the access",
  "Tell us what has to fit in it"
];

/* ================================ HOME ================================== */
function home() {
  const faqs = [
    { q: "Can I look at the container before I buy it?", a: `Yes, and we would rather you did. Our yard is at ${ADDR_LINE}, in the Lockyer Valley about an hour west of Brisbane. Ring first so we know you are coming and can have the units you are interested in accessible, then walk around them, open the doors and look at the floor yourself. If you cannot get out here, we will send photographs of the actual unit on request, before delivery.` },
    { q: "What grade of container should I buy?", a: "Cargo-worthy used is the right answer for most people — a working container still certified fit for sea freight, checked wind and watertight before it leaves us. New single-trip is the one to buy if the container will be looked at or converted. As-is is the cheapest and is not sold watertight; it suits a lock-up under cover or a base for a build. The grades page walks through all three properly." },
    { q: "How much does delivery cost?", a: "It depends on the distance and, more than people expect, on the access at your end. A flat industrial site with a wide entry and a tight residential driveway on a hill are different jobs even if they are the same distance from the yard. We quote delivery with the container so the number you get is the number you pay. One phone call and a couple of photos of the entry usually settles it." },
    { q: "How quickly can I get one?", a: "If it is a standard 20ft going somewhere reasonably accessible in south-east Queensland, usually within a few business days. Longer for the far north, for anything made to order like a dangerous goods unit, and in the wet season when unsealed access roads close. Tell us the date you actually need it and we will tell you honestly whether it is achievable." },
    { q: "Do I need council approval to put a container on my block?", a: "It depends entirely on your council, how long it is staying and what it is used for. Plenty of shires treat a container as a temporary or ancillary structure with no approval needed; others want a siting application, especially if it is visible from the street or staying permanently. It is a short phone call to your council and worth making before delivery day rather than after." },
    { q: "What sizes do you sell?", a: "10ft, 20ft and 40ft, in general purpose, high cube, side opening and dangerous goods configurations, new and used. The 20ft is the default answer and the cheapest per cubic metre most weeks. The 40ft is the best value per cubic metre if the access allows it. The 10ft is the one to buy when the space genuinely will not take anything bigger." }
  ];
  const schema = g(faqLd(faqs), { "@type": "WebSite", "@id": `${D}/#site`, url: D, name: BRAND, publisher: { "@id": `${D}/#biz` } });

  const body = `
<section class="hero">
  <div class="hero-media">${IMG("hero-home", "Shipping containers on hardstand at the Forest Hill yard", { w: 2000, h: 1200, eager: true })}</div>
  <div class="wrap"><div class="hero-grid">
    <div>
      <p class="eyebrow">Sales &amp; hire · delivered Australia-wide</p>
      <h1>Shipping containers, <em>and someone who tells you the truth about them</em></h1>
      <p class="hero-lede">${esc(S.tagline)}</p>
      <div class="hero-cta">
        <a class="btn btn-primary btn-lg" href="#quote">Get a price</a>
        <a class="btn btn-ondark btn-lg" href="${S.phoneHref}">${esc(S.phone)}</a>
      </div>
      <ul class="hero-points">
        <li>${esc(PROMISE)} — by a person, not an autoresponder</li>
        <li>Every cargo-worthy unit checked wind and watertight before it leaves</li>
        <li>Photos of your actual container on request, before delivery</li>
        <li>A real yard at ${esc(ADDR.suburb)} you are welcome to walk into</li>
      </ul>
    </div>
    <div class="quotecard">
      <h2>Get a price</h2>
      <p class="qc-sub">Four questions about the container, then how to reach you.</p>
      ${quoteForm("-hero", true)}
    </div>
  </div></div>
</section>
${promiseStrip()}

${sec("", secHead("The range", "Three sizes, four configurations, three grades", "Guide prices below are starting figures for the grade named. What moves them is condition, what is on the ground this week, and which depot the unit comes out of.") + rangeGrid(P.sizes) + `<div style="margin-top:1.6rem">${typeChips()}</div><div style="margin-top:1.6rem">${asIs()}</div>`)}

${band({
    photo: "yard-forest-hill", eyebrow: "The difference", h: "A yard you can actually walk into",
    p: [`Most container companies will sell you a photograph. We would rather you came and looked. Our units sit on hardstand at ${ADDR_LINE}, off the Warrego between Gatton and Laidley, and you are welcome to ring, drive out and put your hands on the exact container before you buy it.`,
      "That matters most on used stock, where the difference between two cargo-worthy 20fts standing side by side can be a thousand dollars of floor and door seal. If you cannot get out here — and plenty of our customers are a long way from the Lockyer Valley — we photograph the actual unit and send it through on request, before delivery."],
    cta: ["/about/", "More about us"], wash: true
  })}

${band({
    photo: "delivery-tilt-tray", eyebrow: "Delivery", h: "The last thirty metres is what decides everything", alt: true, dark: true,
    p: ["Almost every delivery that goes wrong goes wrong for the same reason, and it is never the container. It is the run-in being too short, the pinch point being too narrow, a branch nobody measured, or ground that looked firm and gave way under four corner castings carrying two tonne each.",
      "So we ask about the site before we talk about price. Send three photographs — one from the street looking in, one down the approach, and one of the spot it has to land on — and we will tell you which truck the job needs and whether it is a tilt-tray, a side loader or a crane job before anyone quotes you."],
    cta: ["/delivery/", "How delivery works"]
  })}

${sec("sec-wash", secHead("Grades", P.gradeNote, null) + `<div class="range">${P.grades.map((gr) => `<article class="rangecard reveal"><div class="rangecard-body"><h3>${esc(gr.name)}</h3><p>${esc(gr.blurb)}</p></div></article>`).join("")}</div><p style="margin-top:1.6rem"><a class="btn btn-ghost" href="/container-grades/">Grades explained in full</a></p>`)}

${sec("", secHead("Where we deliver", "Delivered Australia-wide, from a Queensland yard", "We deliver everywhere. These are the places we know well enough to write something useful about — the roads, the ground, and what usually goes wrong.") + `<div class="locgrid">${LOCS.map((l) => `<a href="/${l.slug}/">${esc(l.name)}<span>${esc(l.state)} ${esc(l.postcode)}</span></a>`).join("")}</div><p style="margin-top:1.5rem"><a class="btn btn-ghost" href="/delivery-areas/">Everywhere else</a></p>`)}

${sec("sec-dark", secHead("How it works", "Four steps, and no surprises at the end", null) + `<ol class="steps">
  <li><h3>Tell us the job, not the product</h3><p>What is going in it, where it is going and what the access looks like. That is what decides the size, the grade and the truck — in that order.</p></li>
  <li><h3>We answer within one business day</h3><p>${esc(PROMISE_DETAIL)} You get a price with the cartage to your address worked into it, not a price with a delivery question mark after it.</p></li>
  <li><h3>You see the actual unit</h3><p>Come out to the yard, or ask for photographs of the specific container and we will send them through before delivery.</p></li>
  <li><h3>It turns up when we said it would</h3><p>You get a delivery window and a call from the driver. If something changes at our end, you hear it from us first.</p></li>
</ol>`)}

${sec("sec-wash", secHead("Common questions", "The things people ring and ask", null) + qaHtml(faqs) + `<p style="margin-top:1.8rem"><a class="btn btn-ghost" href="/faqs/">All frequently asked questions</a></p>`)}

${ask("Tell us about the job", "Four quick questions about the container and where it is going, then how to reach you. " + PROMISE + ".", "home")}
`;
  out("", shell({ t: `Shipping Containers For Sale & Hire | ${BRAND}`, d: `Shipping containers for sale and hire in 10ft, 20ft and 40ft, delivered Australia-wide from our ${ADDR.suburb} yard. New, cargo-worthy and as-is grades. ${PROMISE}.`, c: "/", schema }, body));
}

/* ============================== RANGE HUB =============================== */
function hub() {
  const faqs = [
    { q: "What size shipping container should I buy?", a: "Work backwards from the space, not from the stuff. A 20ft needs about seven metres of straight, reasonably level ground and is the cheapest container per cubic metre in most weeks. A 40ft is better value again per cubic metre but needs roughly thirty metres of run-in to deliver. A 10ft is the answer when the block genuinely will not take a 20ft — it costs more per cubic metre, every time." },
    { q: "What is the difference between a standard container and a high cube?", a: "300mm of internal height, and nothing else. A standard is 2.59m tall externally, a high cube 2.90m. That extra foot is what lets you line the walls and still stand up, fit a roller door with head clearance for a forklift, or put a mezzanine over one end. If the container is going to be converted rather than just filled, buy the high cube." },
    { q: "Can I buy a container without seeing it first?", a: "You can, and most people do. But we would rather send you photographs of the actual unit than a stock image — ask and we will, before delivery. If you are within driving distance of the Lockyer Valley, ring and come out to the yard instead; on used stock it is worth the trip." },
    { q: "Do you sell new containers?", a: "Yes. New single-trip units are built overseas, loaded once, shipped here and unloaded — so they are effectively new but have made one voyage. Straight walls, clean floor, unmarked paint and seals that have not weathered. They cost more than used and are the right buy when the container will be seen, converted, or has to be reliably watertight for years rather than months." }
  ];
  const crumbs = [["Home", "/"], ["Shipping containers", "/shipping-containers/"]];
  const body = `${crumbHtml(crumbs)}
<header class="phead"><div class="phead-media">${IMG("head-range", "Range of shipping containers", { w: 1800, h: 900, eager: true })}</div><div class="wrap">
  <p class="eyebrow">The range</p>
  <h1>Shipping containers for sale and hire</h1>
  <p class="phead-lede">Ten foot, twenty foot and forty foot. General purpose, high cube, side opening and dangerous goods. New single-trip, cargo-worthy used, and as-is. Here is what each one is actually for.</p>
</div></header>
${promiseStrip()}
${sec("", secHead("By size", "Start with the space you have", "The commonest mistake is choosing the container before measuring the spot it has to land on. Size is decided by access as often as it is by volume.") + rangeGrid(P.sizes) + `<div style="margin-top:1.8rem">${asIs()}</div><p class="fineprint">${esc(P.disclaimer)}</p>`)}
${sec("sec-wash", secHead("By configuration", "What the box is set up to do", null) + rangeGrid(P.types))}
${band({ photo: "grades-lineup", eyebrow: "Grades", h: "Grade moves the price more than size does", p: [P.gradeNote, "Two cargo-worthy 20fts standing next to each other can be a thousand dollars apart on the strength of the floor and the door seals alone. It is the first question we ask and the last thing worth comparing suppliers on."], cta: ["/container-grades/", "Grades explained"], dark: true, alt: true })}
${sec("", secHead("Common questions", "About choosing a container", null) + qaHtml(faqs))}
${ask("Not sure which one you need?", "Tell us what is going in it and where it is going. We will tell you which size and grade the job actually needs — including when the cheaper one is the right answer.", "hub")}`;
  out("shipping-containers", shell({ t: `Shipping Containers For Sale & Hire — 10ft, 20ft & 40ft | ${BRAND}`, d: `The full range of shipping containers for sale and hire — 10ft, 20ft and 40ft in general purpose, high cube, side opening and dangerous goods. New, cargo-worthy and as-is grades.`, c: "/shipping-containers/", schema: g(crumbsLd(crumbs), faqLd(faqs)) }, body));
}

/* ============================== SIZE PAGES ============================== */
function sizePages() {
  P.sizes.forEach((x) => {
    const others = P.sizes.filter((y) => y.slug !== x.slug);
    const faqs = [
      { q: `What are the dimensions of a ${x.short} shipping container?`, a: `Externally ${x.specs.ext}, internally ${x.specs.int}. The door opening is ${x.specs.door} and the internal volume is ${x.specs.cube}. Tare weight is ${x.specs.tare}. Those are standard ISO figures and they do not vary meaningfully between manufacturers — what does vary is the condition of the floor and the doors, which is a grade question rather than a size one.` },
      { q: `What fits in a ${x.short} container?`, a: x.fits },
      { q: `How much does a ${x.short} shipping container cost?`, a: `Cargo-worthy used ${x.short} units start from ${aud(x.usedFrom)} and new single-trip from ${aud(x.newFrom)}, both guide prices ex GST. What moves them is condition, what is on the ground this week and which depot the unit has to come out of. Delivery is quoted separately with the container because it varies so much with distance and access.` },
      { q: `What does a ${x.short} container need for delivery?`, a: x.access }
    ];
    const crumbs = [["Home", "/"], ["Shipping containers", "/shipping-containers/"], [x.title, `/${x.slug}/`]];
    const body = `${crumbHtml(crumbs)}
<header class="phead"><div class="phead-media">${IMG("head-" + x.slug, x.title, { w: 1800, h: 900, eager: true })}</div><div class="wrap">
  <p class="eyebrow">${esc(x.short)} containers</p>
  <h1>${esc(x.title)} for sale and hire</h1>
  <p class="phead-lede">${esc(x.lead)}</p>
  <dl class="phead-facts">
    <div><dt>External</dt><dd>${esc(x.specs.ext)}</dd></div>
    <div><dt>Internal volume</dt><dd>${esc(x.specs.cube)}</dd></div>
    <div><dt>Used from</dt><dd>${aud(x.usedFrom)} ex GST</dd></div>
    <div><dt>New from</dt><dd>${aud(x.newFrom)} ex GST</dd></div>
  </dl>
</div></header>
${promiseStrip()}
${sec("", `<div class="spec">
  <div>
    <div class="reveal"><p class="eyebrow">Why this one</p><h2>When a ${esc(x.short)} is the right call</h2>
    <ul>${x.why.map((w) => `<li>${esc(w)}</li>`).join("")}</ul></div>
    <div class="reveal" style="margin-top:2.4rem"><h3>What fits inside</h3><p>${esc(x.fits)}</p></div>
    <div class="reveal" style="margin-top:2.4rem"><h3>Worth knowing before you order</h3><p>${esc(x.watch)}</p></div>
    <div style="margin-top:2.4rem">${specTable(x)}</div>
    <div style="margin-top:1.8rem">${asIs()}</div>
  </div>
  <div class="specside">${priceBox(x)}<p class="fineprint">${esc(P.disclaimer)}</p></div>
</div>`)}
${gallery(["gal-" + x.slug + "-1", "gal-" + x.slug + "-2", "gal-" + x.slug + "-3"], [`${x.title} — exterior`, `${x.title} — doors and locking bars`, `${x.title} — interior and floor`]) ? sec("sec-wash", secHead("Photos", `${x.short} containers we have delivered`, "Real units from real jobs. Ask and we will send photographs of the specific container you are buying, before delivery.") + gallery(["gal-" + x.slug + "-1", "gal-" + x.slug + "-2", "gal-" + x.slug + "-3"], [`${x.title} — exterior`, `${x.title} — doors and locking bars`, `${x.title} — interior and floor`])) : ""}
${band({ photo: "size-alt-" + x.slug, eyebrow: "Delivery", h: `Getting a ${x.short} onto your block`, p: [x.access, "Send three photographs with your enquiry — one from the street looking in, one down the approach and one of the spot itself — and we will tell you which truck the job needs before anyone quotes."], cta: ["/delivery/", "Delivery and access"], dark: true, alt: true })}
${sec("", secHead("Other sizes", "If this one is not quite right", null) + rangeGrid(others) + `<div style="margin-top:1.6rem">${typeChips()}</div>`)}
${sec("sec-wash", secHead("Common questions", `About ${x.short} containers`, null) + qaHtml(faqs))}
${ask(`Get a price on a ${x.short}`, `Tell us where it is going and what the access is like. ${PROMISE}.`, x.slug)}`;
    out(x.slug, shell({ t: `${x.title} For Sale & Hire — From ${aud(x.usedFrom)} | ${BRAND}`, d: `${x.title} for sale and hire from ${aud(x.usedFrom)} ex GST. ${x.specs.ext} external, ${x.specs.cube} internal. New, cargo-worthy and as-is grades, delivered Australia-wide.`, c: `/${x.slug}/`, schema: g(crumbsLd(crumbs), faqLd(faqs), productLd(x)) }, body));
  });
}

/* ============================== TYPE PAGES ============================== */
function typePages() {
  P.types.forEach((x) => {
    const others = P.types.filter((y) => y.slug !== x.slug);
    const faqs = [
      { q: `What is a ${x.name.toLowerCase()} shipping container?`, a: x.lead },
      { q: `What sizes do ${x.name.toLowerCase()} containers come in?`, a: x.slug === "dangerous-goods-shipping-containers" ? "Dangerous goods units are commonly 10ft and 20ft. They are built to a standard rather than converted, so the size available depends on what is being made and what is in stock — tell us the class and volume you need to store and we will tell you what is achievable and when." : "Generally 20ft and 40ft, and in some configurations 10ft. Availability moves week to week, especially on used stock. Ring and ask what is actually standing on the ground rather than working off a list." },
      { q: `Is a ${x.name.toLowerCase()} container watertight?`, a: "In cargo-worthy grade or better, yes — every cargo-worthy unit is checked wind and watertight before it leaves us. As-is units are cheaper again and are not sold watertight. Grade decides this, not configuration, and it is worth reading the grades page before you choose." },
      { q: `How much more does a ${x.name.toLowerCase()} container cost?`, a: "It depends on the configuration and on what is available. Some cost only a little more than a standard general purpose unit; side opening and dangerous goods units cost substantially more because they are structurally different containers, not modified ones. Tell us what the container has to do and we will price the options side by side." }
    ];
    const crumbs = [["Home", "/"], ["Shipping containers", "/shipping-containers/"], [x.name, `/${x.slug}/`]];
    const body = `${crumbHtml(crumbs)}
<header class="phead"><div class="phead-media">${IMG("head-" + x.slug, x.title, { w: 1800, h: 900, eager: true })}</div><div class="wrap">
  <p class="eyebrow">${esc(x.name)}</p>
  <h1>${esc(x.title)}</h1>
  <p class="phead-lede">${esc(x.lead)}</p>
</div></header>
${promiseStrip()}
${sec("", `<div class="spec">
  <div>
    <div class="reveal"><p class="eyebrow">In short</p><h2>What you are getting</h2><ul>${x.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul></div>
    <div class="reveal" style="margin-top:2.6rem">${x.detail.map((p, i) => `<p${i === 0 ? "" : ""}>${esc(p)}</p>`).join("")}</div>
    ${x.slug === "dangerous-goods-shipping-containers" ? "" : `<div style="margin-top:1.8rem">${asIs()}</div>`}
  </div>
  <div class="specside">
    <div class="pricebox reveal">
      <h3>Get a price</h3>
      <p style="color:var(--pale);font-size:.95rem">Tell us the size, the grade and where it is going. ${esc(PROMISE)}.</p>
      <a class="btn btn-primary btn-wide" href="/contact/">Send an enquiry</a>
      <a class="btn btn-ondark btn-wide" style="margin-top:.6rem" href="${S.phoneHref}">${esc(S.phone)}</a>
      <p class="pricenote">Delivery is quoted with the container — it moves with distance and access, and one phone call gets you an exact number.</p>
    </div>
  </div>
</div>`)}
${gallery(["gal-" + x.slug + "-1", "gal-" + x.slug + "-2", "gal-" + x.slug + "-3"], [`${x.name} container — exterior`, `${x.name} container — doors`, `${x.name} container — interior`]) ? sec("sec-wash", secHead("Photos", `${x.name} containers`, "Real units from real jobs. Photographs of the specific container you are buying are available on request, before delivery.") + gallery(["gal-" + x.slug + "-1", "gal-" + x.slug + "-2", "gal-" + x.slug + "-3"], [`${x.name} container — exterior`, `${x.name} container — doors`, `${x.name} container — interior`])) : ""}
${sec("sec-dark", secHead("By size", "Available in", null) + rangeGrid(P.sizes))}
${sec("", secHead("Other configurations", "If this is not the one", null) + rangeGrid(others))}
${sec("sec-wash", secHead("Common questions", `About ${x.name.toLowerCase()} containers`, null) + qaHtml(faqs))}
${ask(`Get a price on a ${x.name.toLowerCase()} container`, `Tell us what it has to do and where it is going. ${PROMISE}.`, x.slug)}`;
    out(x.slug, shell({ t: `${x.title} For Sale & Hire | ${BRAND}`, d: x.metaDesc, c: `/${x.slug}/`, schema: g(crumbsLd(crumbs), faqLd(faqs)) }, body));
  });
}

module.exports = { esc, aud };

/* The remaining page builders and the tail live in build-pages.js, required
   below, purely to keep each file readable. Both halves share this module's
   helpers through the object exported above and the globals assigned here. */
Object.assign(global, {
  __FD: { fs, path, S, LOCS, P, POSTS, DIST, TEST, D, pages, BRAND, SHORT, TEL_E164, HOURS, SERVICE_AREA, PROMISE, PROMISE_DETAIL, ADDR, ADDR_LINE, postalAddress, esc, aud, auDate, para, paras, out, IMG, havePhoto, PHOTO_USED, markDark, markLight, head, biz, crumbsLd, faqLd, productLd, g, mast, promiseStrip, quoteForm, ask, foot, shell, crumbHtml, sec, secHead, qaHtml, typeChips, band, asIs, locCaveat, rangeGrid, specTable, priceBox, gallery, hash32, rank, pick, USES_HEADS, ACCESS_HEADS, NEAR_HEADS, OPENERS, PROCESS_LINES, FREIGHT_LINES, ASK_LINES, SHOW_REVIEWS }
});

home();
hub();
sizePages();
typePages();
require("./build-pages.js");
