# Fair Dinkum Containers — website

Static site generator for **fairdinkumcontainers.com.au**. Node, no dependencies,
no framework. `node build.js` renders the whole site into `dist/`.

```bash
node build.js                                  # → dist/       production build
TEST_BUILD=1 OUT_DIR=dist-test node build.js   # → dist-test/  every page noindex + robots Disallow
```

`dist/` and `dist-test/` are built and committed **by CI**, never by hand. They
must **never** be added to `.gitignore` — CI builds them and commits them back,
and the server cron copies `dist/` to the docroot. Gitignoring them makes every
CI run fail at the commit step while the repo still looks healthy.

**68 pages + `404.html`.** The largest site in the group by a distance
(the next biggest is 35).

---

## What this brand is

`FDC` is the **second best-performing brand in the group** and one of the two
James flagged as protected. It has a **real yard with a verified Google Business
Profile**, which no other brand in the group except Koala and Grafton can say.
The positioning follows from that: *a yard you can walk into*.

All brand facts below were read from the CRM `brands` table
(`KOALACONT/koala-crm-backups`, `data/brands.jsonl`, row `code: "FDC"`) and match.

| Field | Value |
|---|---|
| Code | `FDC` |
| Trading name | Fair Dinkum Containers |
| Domain | fairdinkumcontainers.com.au |
| Phone | **0477 410 500** |
| From / reply-to | sales@fairdinkumcontainers.com.au |
| Brand colour | `#2D8856` |
| Yard | **24 Forest Hill Fernvale Rd, Forest Hill QLD 4342** |
| Hours | Mon–Fri 7:30am–5pm, Sat 8am–12pm |

### Facts confirmed 13/08/2026 that correct earlier records

1. **The address is Forest Hill, not Tamborine Mountain.** The old WordPress
   site published *22 Bartle Rd, Tamborine Mountain QLD 4272*. James confirmed
   the current address is **24 Forest Hill Fernvale Rd, Forest Hill QLD 4342**,
   matching the Google Business Profile. The Tamborine Mountain address does not
   appear anywhere in this repo and must not be reintroduced.
2. **The Google Business Profile is verified and carries 34 reviews at 4.8.**
   `claude/gbp-audit.md` (03/08/2026) records Fair Dinkum as *"🔴 Verification
   required"* and as a service-area business with no address. Both are now wrong.
3. **The old site published the wrong trading hours** — *Monday–Saturday
   7:30am–5pm*. The group standard, used here, is **Mon–Fri 7:30am–5pm,
   Sat 8am–12pm**.

### Deadline

**SSL on fairdinkumcontainers.com.au expires 21 October 2026.** The plan is to
rebuild before then rather than renew the Crazy Domains certificate.

---

## URL PRESERVATION — the rule that matters most on this site

**All 41 URLs from the live WordPress site are preserved exactly, 1:1.** This
brand ranks — `/toowoomba/` currently sits above Container Traders, Port and
Tiger for "shipping containers toowoomba". Changing a URL on a page that ranks
is the one reliable way to go backwards.

That means the slugs here are **not** the ones the newer sites in the group use,
and they must not be "tidied":

| Here | NOT | Because |
|---|---|---|
| `/10ft-shipping-containers/` | `/10-foot-shipping-containers/` | live and indexed |
| `/20ft-shipping-containers/` | `/20-foot-…` | live and indexed |
| `/40ft-shipping-containers/` | `/40-foot-…` | live and indexed |
| `/shipping-container-hire/` | `/container-hire/` | live and indexed |
| `/blog/` | `/shipping-container-guides/` | live and indexed |
| `/faqs/` | `/faq/` | live and indexed |

The 25 locality slugs are likewise carried across unchanged. **Before deleting
or renaming any page in this repo, check it against the live site's
`page-sitemap.xml` first.** If a URL has to go, it needs a 301, not a delete.

### New pages added on top of the original 41

Nine localities — `gatton`, `laidley`, `esk`, `fernvale`, `logan`, `beaudesert`,
`redlands`, `sydney`, `tweed-heads` — plus `/container-grades/`,
`/container-inspection/`, `/container-sales/`, `/container-storage/`,
`/how-it-works/`, `/about/`, `/delivery-areas/`, `/privacy/` and ten guides
under `/blog/`.

`gatton`, `laidley`, `esk` and `fernvale` are the yard's own backyard and are
the most locally credible pages on the site — Forest Hill sits between Gatton
and Laidley.

---

## Colour system and measured contrast

The full table also lives in a comment at the top of `static/css/style.css`.
Brand `#2D8856` is light enough that it is **not** used for small body text or
for a button label — at 4.40:1 on white it does not clear 4.5:1. Links, small
brand text and buttons carry the darker `#1E5B3A` (7.93:1); the brand green is
reserved for large display type and non-text accents.

**Every text pairing used on this site clears 4.5:1. Most clear 7:1.**

| Token | Hex | On | Ratio |
|---|---|---|---|
| `--ink` | `#12211A` | white | **16.6:1** |
| `--muted` | `#4A5B52` | white | **7.15:1** |
| `--green-deep` | `#1E5B3A` | white | **7.93:1** |
| `--green` | `#2D8856` | white | 4.40:1 — **large display only** |
| white | | `--forest #0E2A1C` | **15.2:1** |
| `--sage` | `#9CCFB4` | `--forest` | **8.70:1** |
| `--pale` | `#DCEFE4` | `--forest` | **12.68:1** |
| `--amber` | `#A8480E` | white | **5.83:1** |

Focus rings are `--amber` at 3px with 2px offset on every interactive element.
There is a skip link. `prefers-reduced-motion` is respected and disables the
scroll-reveal entirely.

---

## Design direction — structurally distinct on purpose

Different brands in the group must have **genuinely different layout
structures, not recolours**. That is both a design goal and an SEO requirement.
This site shares no layout primitive with the sibling repos:

- **Two-tier masthead.** A white identity row (mark, yard promise, phone, CTA)
  above a dark sticky nav band. The sibling sites run a single-tier masthead.
- **A photographic mega menu** under "Containers" — four-across cards with a
  photo, name and one line. Nothing else in the group has one.
- **Split hero**: photograph behind, copy on the left, and a white quote card
  lifted out over the image on the right. No centred full-bleed hero.
- **Editorial photo bands** as the main content rhythm — full-bleed, half image
  half copy, alternating side, some dark and some on wash.
- **Size and type pages are spec sheets**: a hard dimension table beside a
  sticky price panel, with a photo gallery below.
- **Three-column footer** with a full locality run.
- **Type: Figtree (800) + Inter.** Chosen to sit with the existing logo, which
  is a heavy geometric grotesque.
- FAQs are always-open Q/A pairs, never `<details>` accordions, so the visible
  text and the `FAQPage` JSON-LD are built from the same array and cannot drift.

### The brand mark

The wordmark is **rebuilt as SVG** — "Fair Dinkum" in near-black over
"Containers" in brand green, with a corrugated container glyph on the right.
Same mark as the live site, vector rather than the 768px raster WordPress
serves, so it stays crisp at any size. The text is derived from
`data/site.json`, never typed into the template.

---

## Photography — this is the first site in the group with photos on

`data/site.json` has `"photos": true`, and **`IMG()` checks the `.webp` is
actually on disk at build time**. If a photo is missing the build emits nothing
and the CSS gradient placeholder shows through instead — no 404s, no broken
images, no distorted strips. That check is what makes `photos: true` safe to
leave on while the library is still being filled, and it is an improvement on
the plain boolean flag used elsewhere in the group.

The build reports how many photos it rendered. **It is currently 0** — the
library has not been loaded into `static/img/photos/` yet.

### Photo slots the build looks for

Drop `.webp` files at `static/img/photos/<name>.webp`:

| Name | Where it appears |
|---|---|
| `hero-home` | home hero, full bleed |
| `yard-forest-hill`, `yard-wide`, `yard-entry` | the yard bands |
| `head-<page>` | page header for range, delivery, hire, sales, storage, grades, inspection, dimensions, how, about, faqs, guides, contact, areas |
| `head-<size-or-type-slug>` | size and type page headers |
| `range-<slug>` | range card thumbnails |
| `mega-<size-or-type>` | mega-menu cards |
| `gal-<slug>-1/2/3` | size and type galleries |
| `loc-<slug>` and `loc-<slug>-1/2/3` | locality header and three bands |
| `guide-<slug>` | guide article headers |
| `delivery-tilt-tray`, `truck-tilt-tray`, `truck-side-loader`, `truck-crane` | delivery page |
| `grades-lineup`, `grades-floor`, `inspect-floor`, `inspect-yard` | grades and inspection |
| `hire-site`, `storage-site`, `process-yard`, `size-alt-<slug>` | bands |

### Sourcing rule — one photo, one brand

`claude/photo-library.md` records **425 clash-checked safe photos, 345 at full
camera resolution**, on the FastComet server under
`./public_html/uploads/images`. Assign each md5 to exactly one brand and record
it — shared imagery is the same failure mode as shared copy, and the audit found
the nine old brand sites already cannibalising each other with 38 images
appearing on more than one site.

Fair Dinkum's own ~159 live images are **its own** to reuse. The seven
"off limits" images in that audit are off limits to *other* brands because they
are live on Koala and Fair Dinkum — they are not off limits here.

Before publishing: strip EXIF GPS, resize to ~1600px, compress to ~200–300KB
WebP. The 2MB originals must not ship. And check a photo used on a 10ft page
actually shows a 10ft container.

---

## Reviews — built but switched off

`data/site.json` carries a `reviews` block. **`show` is `false` and should stay
false until the numbers are pulled live.** The Google Business Profile showed
4.8 from 34 reviews on 13/08/2026, so the claim is evidenced — but a hardcoded
count goes stale, cannot earn a rich result, and is indistinguishable from
fabrication. `build.js` emits `AggregateRating` only when `show` is true.

This is the same error that was caught and removed from `outback-website` on
02/08 (a placeholder 4.9/180). Do not reintroduce it here.

---

## Lead capture

`static/js/app.js` is brand-agnostic. Every brand value comes from the
`#site-config` JSON block that `build.js` emits from `data/site.json`. Nothing
is hardcoded. Copying this file to another brand's repo is not what routes leads
to the wrong business — copying a *data* file is.

Form behaviour worth preserving:

- **Qualifying questions before contact details.** Intent → size → grade →
  timeframe → suburb, *then* name and phone.
- **Every dropdown ends in "Not sure".** Not knowing which size or grade you
  need is the commonest reason a container buyer abandons a form.
- **"Not sure" sends an empty string, never a literal size.** `SIZE_MAP` maps
  `unsure → ""`. A fabricated `"20ft"` against an unsure enquiry produces a
  wrong quote out of the CRM.
- **Timeframe leads with "Today"**, passed through prefixed `Wants it TODAY`.
- **Location field is "Delivery suburb or postcode"**; the raw string goes as
  `suburb` and `postcode` is populated **only** when it matches `/^\d{4}$/`.
- Honeypot (`business_url`), UTM and `gclid` capture kept.
- **The failure path shows a real failure.** It never fakes success.

Verified 13/08/2026 with `fetch` stubbed in a headless browser — **no test lead
was posted to the CRM.** Payload carried `brand: "FDC"`, `size: ""` for an
"unsure" selection, and `postcode: "4343"` correctly populated from a numeric
entry.

### ⚠️ Open security issue (group-wide, not specific to this repo)

The lead-intake shared secret is a **plain string in public JavaScript on every
brand site in the group**, so anyone who views source can post fabricated leads
into the CRM. Rotating it has to happen on the edge function and all brand sites
simultaneously. **Flagged and waiting on James — do not rotate it here in
isolation.**

### ⚠️ Rate limit

`web-lead-intake` allows **6 submissions per hour per hashed client IP** and
returns 429 after that, which the site surfaces as *"That didn't send — sorry."*
Several customers behind one office IP or the same carrier NAT can hit this.
Duplicate suppression also drops a repeat of the same brand + phone or email
inside 10 minutes, silently, returning success.

---

## Copy rules enforced in this repo

Each of these is asserted by the build — see *Verification* below.

- **No published freight, delivery or cartage figures.** Delivery is qualitative
  everywhere: quoted with the container, varies with distance and access, one
  call gets an exact number. Container sale and hire prices are fine.
- **Photos: "on request", "before delivery" only.** Never phrasing that ties
  photographs to payment, in body copy *or* FAQ question text.
- **Watertight is always scoped to a grade.** As-is units are explicitly not
  sold watertight, and that caveat appears on the home page, the range hub,
  every size page, `/container-sales/` and `/container-grades/`. Locality pages
  carry `locCaveat()` instead — one sentence pointing at the grades page.
- **Banned:** any flood-proof, flood-safe or fire-proof phrasing. Containers keep
  rain out from above; floodwater reaches the door seals and gets in, and an
  empty container floats. Several localities on this site flood badly — Lismore,
  Ipswich, Grafton, Rockhampton, Gympie, Maryborough — and each says plainly that
  height above the flood line is what protects contents.
- **No review counts, star ratings, sold counters, years-trading claims or
  customer-number claims.** Anywhere.
- **No cross-brand internal linking, ever.** No link or reference to any other
  brand in the group.
- Australian English and AU spelling. Dates DD/MM/YYYY. AUD, ex GST unless
  stated.

---

## Locality copy rotation

Boilerplate that genuinely has to repeat across 34 locality pages — the uses
heading, the access heading, the "other places" heading, the opener, the process
line, the freight line and the closing CTA — is drawn from **rotating pools**.

`hash32()` (FNV-1a, deterministic, dependency-free) plus `rank(salt, slug)`
gives each pool its **own** ordering of the locality slugs, and `pick()` takes
that rank modulo the pool length. Ranking rather than hashing modulo directly
matters: a raw hash modulo 7 across 34 slugs is not balanced, a rank is. It also
means the copy does not depend on the **order** of the locality data, so
reordering that file does not silently rewrite 34 pages.

**Pool lengths are deliberately different — 8, 9, 7, 10, 8, 7, 9.** Pools of
equal length driven by the same rank collide on the same pairs. With equal
lengths the worst pair shared **6 of 7** rotated slots; with varied lengths it is
**4 of 7**, which the build asserts. If it creeps up, add entries to a pool —
that is the only real fix for the pigeonhole.

---

## Data files

| File | Holds |
|---|---|
| `data/site.json` | brand identity, phone, email, address, hours, promises, lead config, `photos` flag, reviews block |
| `data/products.json` | 3 sizes, 4 types, 3 grades, specs, guide prices, the as-is caveat, the price disclaimer |
| `data/locations/*.json` | 34 localities, split by region — depot, lead time, truck, access, 3 sections, 4 FAQs, near list |
| `data/posts.js` | 10 guides (slug, title, desc, date, mins, intro, HTML body) |

Guide bodies must not contain `<h1>` — the page template owns the single H1.

Localities live in **four regional files** — `data/locations/seq.json`,
`downs.json`, `north.json`, `south.json` — merged by `build.js` in the order
listed in `LOC_REGIONS`. They were split out of a single 315KB file: easier to
edit, easier to review in a diff, and small enough for tooling to handle. A
startup check throws if any locality is missing a required field or if two share
a slug, so a malformed row fails the build rather than rendering a broken page.

`build.js` holds the shell, the home page, the range hub and the size and type
pages. `build-pages.js` holds everything else and the verification tail. They
share helpers through `global.__FD`.

---

## Verification

`build.js` fails the build (non-zero exit) on any of these. All passing as at
13/08/2026:

- 68 pages + `404.html` render
- **0** occurrences of any other group brand name
- **0** banned phrases — flood-proof, flood-safe, fire-proof, "before you pay",
  "before you commit", "before payment"
- exactly **one `<h1>` per page**
- **68 unique titles, 68 unique meta descriptions** — duplicates fail the build
- every JSON-LD block parses
- `"brand":"FDC"` and the phone number present on **every** page
- **no empty `streetAddress`** — the key is present and correct, or absent
- no page renders visible FAQs without `FAQPage` schema
- **as-is caveat present** on `/`, `/shipping-containers/`, all three size pages,
  `/container-sales/` and `/container-grades/` — **and absent from all 34
  locality pages.** That split is the point of the de-duplication and is checked
  both ways.
- no locality pair shares more than 4 of 7 rotated copy slots
- every internal link resolves

---

## Deployment

CI builds `dist/` and commits it back; a cron on the `sunstate` cPanel account
pulls and copies it to the docroot.

```
<staggered minute> * * * * cd /home/sunstate/repositories/fairdinkum-website && git pull -q && /bin/cp -a dist/. /home/sunstate/fairdinkumcontainers.com.au/
```

⚠️ **`umask 022` before cloning or copying into a docroot.** A restrictive umask
leaves files at 600/700, `cp -a` preserves it, and Apache returns 403 on every
page.

⚠️ **There is no `node` on the FastComet box.** `dist/` must come from CI or
from a machine with node — it cannot be built on the server.

### Still to do

- [ ] **Add `.github/workflows/build.yml`** — the GitHub API connector cannot
      write workflow files (403). It has to go in from the cPanel Terminal or a
      local clone with a token carrying the `workflow` scope. Until it exists,
      `dist/` has to be committed from a machine with node.
- [ ] **Add this repo to the `koala-site-deploy` token allow-list** if pushes
      start returning 403. Done 13/08/2026, but re-check after any token edit.
- [ ] **Load the photo library** into `static/img/photos/` — see the slot table
      above. This is the single biggest remaining item; the site is designed
      around photography and currently renders placeholders.
- [ ] Stand the site up on a staging domain on the VPS and review it end to end
      **before** anything touches Crazy Domains DNS. Fair Dinkum is a protected
      brand — do not migrate, redirect, change DNS or cancel any Crazy Domains
      product until the rebuild is verified.
- [ ] Submit one real test lead through the form and confirm it lands against
      brand `FDC`. Vary the phone and email from any other brand's test lead or
      duplicate suppression will eat it.
- [ ] 301 map: confirm all 41 original URLs resolve on the new build before
      cutover, and decide the redirects for any near-match domains James owns —
      they should **301 to the matching page here**, not stand up as separate
      landing pages.
- [ ] Submit `sitemap.xml` in Search Console. Fair Dinkum's property should sit
      on james@koalacontainers.com.au with the rest.
- [ ] Resolve the group-wide lead-intake secret before or shortly after launch.

**A build that compiles is not a build that's correct.**
