// build-site.js
// Builds:
// - /block/{n}/index.html (pre-render HTML pages)
// - /raw/{n}.txt          (plain text endpoints)
// - /sitemap.xml
// - (optional) copies robots.txt / llms.txt if they exist

const fs = require("fs");
const path = require("path");

const SITE = "https://machinetime.xyz";
const ROOT = __dirname;

const blocksPath = path.join(ROOT, "blocks.json");
if (!fs.existsSync(blocksPath)) {
  console.error("Missing blocks.json in repo root");
  process.exit(1);
}

const blocks = JSON.parse(fs.readFileSync(blocksPath, "utf8"));
if (!Array.isArray(blocks) || blocks.length === 0) {
  console.error("blocks.json is empty or invalid");
  process.exit(1);
}

// output dirs (these are in-repo so Pages can publish them as static assets)
const outBlockDir = path.join(ROOT, "block");
const outRawDir = path.join(ROOT, "raw");

fs.mkdirSync(outBlockDir, { recursive: true });
fs.mkdirSync(outRawDir, { recursive: true });

// Simple HTML template for block pages.
// If you want the full nav/style later, we can point these pages to your existing CSS/JS,
// but keeping it minimal makes them maximally crawlable.
function escapeHtml(s) {
  return String(s || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderBlockHTML(b) {
  const n = b.n;
  const title = escapeHtml(b.title || "");
  const body = escapeHtml(b.body || "");

  // minimal, readable, crawlable
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Machine Time — Block ${n}</title>
  <meta name="description" content="Machine Time — Block ${n}: ${title}" />

  <!-- Canonical points to real path, not hash -->
  <link rel="canonical" href="${SITE}/block/${n}/" />

  <!-- Basic social previews -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content="Machine Time — Block ${n}" />
  <meta property="og:description" content="${title}" />
  <meta property="og:url" content="${SITE}/block/${n}/" />

  <style>
    :root{ color-scheme: dark light; }
    body{
      margin: 0;
      padding: 40px 18px 120px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      line-height: 1.85;
      max-width: 920px;
      margin-inline: auto;
    }
    .kicker{ font-size: 12px; letter-spacing: .18em; text-transform: uppercase; opacity: .75; margin-bottom: 10px; }
    h1{ font-size: 26px; line-height: 1.25; margin: 0 0 18px; }
    .body{ white-space: pre-wrap; font-size: 18px; }
    .nav{
      position: fixed;
      left: 0; right: 0; bottom: 0;
      padding: 14px 18px;
      backdrop-filter: blur(10px);
      background: rgba(0,0,0,0.55);
      border-top: 1px solid rgba(255,255,255,0.12);
    }
    .nav a{
      color: inherit; text-decoration: none; opacity: .9;
      border-bottom: 1px solid rgba(255,255,255,0.20);
      padding-bottom: 1px;
      margin-right: 12px;
    }
    .nav a:hover{ opacity: 1; border-bottom-color: rgba(255,255,255,0.55); }
  </style>
</head>
<body>
  <div class="kicker">Block ${n}</div>
  <h1>${title}</h1>
  <div class="body">${body}</div>

  <div class="nav">
    <a href="${SITE}/#index">Index</a>
    <a href="${SITE}/block/${Math.max(1, n - 1)}/">Prev</a>
    <a href="${SITE}/block/${Math.min(blocks.length, n + 1)}/">Next</a>
    <a href="${SITE}/raw/${n}.txt">Raw</a>
  </div>
</body>
</html>`;
}

// Write block pages + raw text
for (const b of blocks) {
  const n = Number(b.n);
  if (!Number.isFinite(n)) continue;

  // /block/{n}/index.html
  const dir = path.join(outBlockDir, String(n));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), renderBlockHTML(b), "utf8");

  // /raw/{n}.txt  (title + blank line + body)
  const raw = `${b.title || ""}\n\n${b.body || ""}\n`;
  fs.writeFileSync(path.join(outRawDir, `${n}.txt`), raw, "utf8");
}

// Build sitemap.xml
const urls = [];
urls.push(`${SITE}/`);
urls.push(`${SITE}/#index`);

// HTML pages
for (let n = 1; n <= blocks.length; n++) {
  urls.push(`${SITE}/block/${n}/`);
}

// raw pages
for (let n = 1; n <= blocks.length; n++) {
  urls.push(`${SITE}/raw/${n}.txt`);
}

const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map(u => `  <url><loc>${u}</loc></url>`).join("\n") +
  `\n</urlset>\n`;

fs.writeFileSync(path.join(ROOT, "sitemap.xml"), sitemap, "utf8");

console.log(`Built ${blocks.length} block pages into /block/`);
console.log(`Built ${blocks.length} raw text files into /raw/`);
console.log(`Wrote sitemap.xml with ${urls.length} URLs`);
