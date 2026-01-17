const fs = require("fs");
const path = require("path");

const blocksPath = path.join(__dirname, "blocks.json");
const outDir = path.join(__dirname, "block");

const blocks = JSON.parse(fs.readFileSync(blocksPath, "utf8"));

function escapeHtml(s = "") {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderBlockPage(b) {
  const title = b.title ? `Machine Time — Block ${b.n}: ${b.title}` : `Machine Time — Block ${b.n}`;

  return `<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="Machine Time — Block ${b.n}" />

  <!-- Canonical -->
  <link rel="canonical" href="https://machinetime.xyz/block/${b.n}/" />

  <style>
    :root{
      --bg: #050505;
      --fg: #eaeaea;
      --muted: #9a9a9a;
      --line: rgba(255,255,255,0.12);
      --accent: #f2c66d;
      --title: #f2c66d;
      --paperGlow: rgba(242,198,109,0.08);
    }

    html, body { height: 100%; }

    body{
      margin: 0;
      background:
        radial-gradient(1200px 600px at 50% 0%, var(--paperGlow), transparent 60%),
        var(--bg);
      color: var(--fg);
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
                   "Liberation Mono", "Courier New", monospace;
    }

    .wrap{
      max-width: 920px;
      margin: 0 auto;
      padding: 48px 20px 80px;
    }

    .topBar{
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 16px;
    }

    .titleLink{
      letter-spacing: 0.18em;
      font-weight: 800;
      font-size: 20px;
      color: var(--fg);
      text-transform: uppercase;
      text-decoration: none;
      opacity: 0.92;
    }

    .titleLink:hover{
      opacity: 1;
      text-decoration: underline;
      text-decoration-thickness: 1px;
      text-underline-offset: 6px;
    }

    .rule{
      height: 1px;
      background: var(--line);
      margin: 10px 0 26px;
    }

    .blockMeta{
      color: var(--accent);
      font-size: 12px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      margin-bottom: 10px;
    }

    .blockTitle{
      font-size: 26px;
      line-height: 1.25;
      font-weight: 800;
      color: var(--title);
      margin: 0 0 18px;
    }

    .blockBody{
      font-size: 18px;
      line-height: 1.85;
      white-space: pre-wrap;
    }

    .links{
      margin-top: 28px;
      padding-top: 18px;
      border-top: 1px solid var(--line);
      color: var(--muted);
      font-size: 13px;
    }

    .links a{
      color: var(--accent);
      text-decoration: none;
      border-bottom: 1px solid rgba(242,198,109,0.35);
      padding-bottom: 1px;
    }

    .links a:hover{
      border-bottom-color: var(--accent);
    }
  </style>
</head>

<body>
  <div class="wrap">
    <div class="topBar">
      <a class="titleLink" href="/#index">MACHINE TIME</a>
      <a class="titleLink" style="font-size:12px; letter-spacing:0.18em; opacity:0.85;" href="/#${b.n}">Open in viewer</a>
    </div>

    <div class="rule"></div>

    <div class="blockMeta">Block ${b.n}</div>
    <div class="blockTitle">${escapeHtml(b.title || "")}</div>
    <div class="blockBody">${escapeHtml(b.body || "")}</div>

    <div class="links">
      <a href="/block/${Math.max(1, b.n - 1)}/">Prev</a>
      &nbsp;•&nbsp;
      <a href="/block/${Math.min(blocks.length, b.n + 1)}/">Next</a>
      &nbsp;•&nbsp;
      <a href="/#index">Index</a>
    </div>
  </div>
</body>
</html>`;
}

fs.mkdirSync(outDir, { recursive: true });

for (const b of blocks) {
  const dir = path.join(outDir, String(b.n));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), renderBlockPage(b), "utf8");
}

console.log(`Built ${blocks.length} block pages into /block/`);
