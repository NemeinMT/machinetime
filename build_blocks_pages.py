import json
import os
from pathlib import Path
from html import escape

# Paths
ROOT = Path(__file__).parent
BLOCKS_JSON = ROOT / "blocks.json"
INDEX_HTML = ROOT / "index.html"
OUT_DIR = ROOT / "block"

def read_blocks():
    if not BLOCKS_JSON.exists():
        raise FileNotFoundError("blocks.json not found in repo root")
    with open(BLOCKS_JSON, "r", encoding="utf-8") as f:
        blocks = json.load(f)
    if not isinstance(blocks, list) or len(blocks) == 0:
        raise ValueError("blocks.json is empty or invalid")
    return blocks

def extract_style_from_index(html):
    # We reuse your exact <style> from index.html so the block pages match your site.
    start = html.find("<style>")
    end = html.find("</style>")
    if start == -1 or end == -1:
        raise ValueError("Could not find <style>...</style> in index.html")
    return html[start+len("<style>"):end].strip()

def build_block_html(style_css, block, total):
    n = block.get("n", "")
    title = block.get("title", "") or ""
    body = block.get("body", "") or ""

    # Optional metadata
    part = block.get("part", "") or ""
    chapter = block.get("chapter", "") or ""

    page_title = f"Machine Time — Block {n}"
    desc = title.strip() if title.strip() else f"Machine Time — Block {n}"

    # Escape for HTML safety
    title_html = escape(title)
    body_html = escape(body).replace("\n", "<br>\n")

    # Canonical URL path
    canonical_path = f"/block/{n}/"

    # Build HTML
    return f"""<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{escape(page_title)}</title>

  <meta name="description" content="{escape(desc)}" />
  <link rel="canonical" href="{canonical_path}" />

  <style>
{style_css}
  </style>
</head>

<body>
  <div class="wrap">
    <div class="topBar">
      <a class="titleLink" href="/#index">MACHINE TIME</a>
      <a class="aboutBtn" href="/#about" style="display:inline-block;">About</a>
    </div>
    <div class="rule"></div>

    <div class="block" id="blockView">
      <div class="blockMeta">
        Block {n}{(" • " + escape(part)) if part.strip() else ""}{(" • " + escape(chapter)) if chapter.strip() else ""}
      </div>

      <div class="blockTitle">{title_html}</div>
      <div class="blockBody">{body_html}</div>
    </div>
  </div>

  <div class="navBar">
    <div class="navInner">
      <div class="nav">
        <a href="/#index" style="text-decoration:none;">
          <button type="button">Index</button>
        </a>

        <a href="/block/{max(1, int(n)-1)}/" style="text-decoration:none;">
          <button type="button" {"disabled" if int(n)==1 else ""}>← Prev</button>
        </a>

        <a href="/block/{min(total, int(n)+1)}/" style="text-decoration:none;">
          <button type="button" {"disabled" if int(n)==total else ""}>Next →</button>
        </a>

        <button id="themeBtn" title="Toggle light/dark">◐</button>

        <button id="shareBtn" title="Copy/share link">Share</button>

        <div class="counter">Block {n} / {total}</div>
      </div>
    </div>
  </div>

  <script>
    // Theme (same behavior as main site)
    function getTheme() {{
      return localStorage.getItem("mt_theme") || "dark";
    }}
    function setTheme(t) {{
      document.documentElement.setAttribute("data-theme", t);
      localStorage.setItem("mt_theme", t);
    }}
    setTheme(getTheme());
    document.getElementById("themeBtn").addEventListener("click", () => {{
      const t = getTheme() === "dark" ? "light" : "dark";
      setTheme(t);
    }});

    // Share button
    document.getElementById("shareBtn").addEventListener("click", async () => {{
      const url = window.location.href;
      try {{
        if (navigator.share) {{
          await navigator.share({{ title: document.title, url }});
          return;
        }}
      }} catch (e) {{}}

      try {{
        await navigator.clipboard.writeText(url);
        const btn = document.getElementById("shareBtn");
        const old = btn.textContent;
        btn.textContent = "Copied";
        setTimeout(() => btn.textContent = old, 900);
      }} catch (e) {{
        alert(url);
      }}
    }});
  </script>
</body>
</html>
"""

def main():
    # Read index.html so we reuse your CSS exactly
    if not INDEX_HTML.exists():
        raise FileNotFoundError("index.html not found in repo root")

    index_html = INDEX_HTML.read_text(encoding="utf-8")
    style_css = extract_style_from_index(index_html)

    blocks = read_blocks()
    total = len(blocks)

    # Create /block/ output
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for b in blocks:
        n = b.get("n", None)
        if n is None:
            continue

        # Ensure numeric
        try:
            n_int = int(n)
        except:
            continue

        # Write /block/N/index.html
        out_folder = OUT_DIR / str(n_int)
        out_folder.mkdir(parents=True, exist_ok=True)

        html = build_block_html(style_css, b, total)
        (out_folder / "index.html").write_text(html, encoding="utf-8")

    print(f"Built {total} block pages into {OUT_DIR}/")

if __name__ == "__main__":
    main()
