/* IndexNow — tells Bing (and through it DuckDuckGo, Yahoo, Ecosia, Yandex, Naver, Seznam)
   which pages changed, the moment CI builds them, instead of waiting for a crawl.
   Google does not use IndexNow; Search Console + sitemap.xml still covers Google.

   Loaded by the last line of build.js. Does three things:
     1. Writes the key file into the build output so the host can be verified.
     2. On CI (GITHUB_ACTIONS), for the real build only, lists which dist/**\/index.html
        files git sees as new or modified since the last commit — the sitemap stamps
        every lastmod with today's date, so the sitemap itself is useless for this —
        and POSTs those URLs to api.indexnow.org.
     3. Never fails the build. A failed ping is logged and the site still ships.

   The key is shared across every brand site and is deliberately public — the
   protocol only checks that https://<host>/<key>.txt serves it. Rotate it here and
   in every sibling repo together if it ever needs changing.

   Caveat: the ping fires when CI commits dist/, and the server cron copies dist/ to
   the docroot within about ten minutes. Bing queues submissions, so a brand-new page
   is normally live by the time it is fetched; if not, the sitemap catches it. */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const https = require("https");

const KEY = "776455d16dbee27bf214a417f7c64977";
const DIST = path.join(__dirname, process.env.OUT_DIR || "dist");
const TEST = !!process.env.TEST_BUILD;
/* The site's origin comes from the sitemap the build just wrote — every brand engine
   writes one with absolute <loc> URLs — so this file needs nothing brand-specific. */
function origin() {
  try {
    const m = fs.readFileSync(path.join(DIST, "sitemap.xml"), "utf8").match(/<loc>(https?:\/\/[^/<]+)/);
    if (m) return m[1];
  } catch (e) {}
  try { return String(require("./data/site.json").domain || "").replace(/\/$/, ""); } catch (e) { return ""; }
}
const D = origin();
const HOST = D.replace(/^https?:\/\//, "");

/* 1. key file — on every build, test included, so a test docroot can be verified too */
try { fs.writeFileSync(path.join(DIST, `${KEY}.txt`), KEY); } catch (e) { console.warn(`IndexNow: could not write key file — ${e.message}`); }

/* 2. + 3. ping — only from CI and only for the real build. INDEXNOW=1 forces it
   from a local shell for testing; INDEXNOW=0 switches it off on CI. */
const onCI = !!process.env.GITHUB_ACTIONS && !TEST && process.env.INDEXNOW !== "0";
if (!onCI && process.env.INDEXNOW !== "1") return;
if (!D) { console.warn("IndexNow: could not work out the site origin — skipped"); return; }

let changed = [];
try {
  const rel = path.relative(__dirname, DIST) || "dist";
  const status = execSync(`git status --porcelain --untracked-files=all -- ${rel}`, { cwd: __dirname, encoding: "utf8" });
  changed = status.split("\n").filter(Boolean).map((l) => l.slice(3).trim().replace(/^"|"$/g, ""))
    .filter((f) => f.startsWith(rel + "/") && f.endsWith("index.html"))
    .map((f) => f.slice(rel.length).replace(/index\.html$/, ""))
    .filter((u) => u !== "/thank-you/" && u !== "/404/")
    .map((u) => D + u);
} catch (e) {
  console.warn(`IndexNow: git status failed, nothing submitted — ${e.message}`);
  return;
}

if (!changed.length) { console.log("IndexNow: no page changes to submit"); return; }
changed = changed.slice(0, 10000);

const body = JSON.stringify({ host: HOST, key: KEY, keyLocation: `${D}/${KEY}.txt`, urlList: changed });
const req = https.request({ hostname: "api.indexnow.org", path: "/indexnow", method: "POST", headers: { "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(body) } }, (res) => {
  const ok = res.statusCode === 200 || res.statusCode === 202;
  console.log(`IndexNow: ${ok ? "submitted" : "REJECTED"} ${changed.length} URL(s) for ${HOST} — HTTP ${res.statusCode}`);
  if (!ok) console.warn("IndexNow: " + changed.join(", "));
  res.resume();
});
req.on("error", (e) => console.warn(`IndexNow: request failed — ${e.message}`));
req.setTimeout(15000, () => { console.warn("IndexNow: timed out"); req.destroy(); });
req.end(body);
