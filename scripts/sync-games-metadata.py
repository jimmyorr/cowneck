#!/usr/bin/env python3
"""
Sync metadata, Open Graph, Twitter cards, canonical tags, and Schema.org VideoGame
structured data from games/index.html (and games/kirby.html) into individual game HTML files.
"""
import glob
import html
import json
import os
import re

START_TAG = "<!-- sync-start:metadata -->"
END_TAG = "<!-- sync-end:metadata -->"
SKIP_FILES = {"index.html", "kirby.html", "react_template.html"}


def clean_text(text):
    text = re.sub(r"<[^>]+>", "", text)
    return " ".join(text.split()).strip()


def strip_emojis(title):
    cleaned = re.sub(r"^[^\w\s]+\s*", "", title)
    cleaned = re.sub(r"\s*[^\w\s]+$", "", cleaned)
    return cleaned or title


def extract_cards():
    metadata = {}

    # 1. Extract from games/kirby.html first (games/index.html takes precedence if in both)
    kirby_path = "games/kirby.html"
    if os.path.exists(kirby_path):
        with open(kirby_path, "r", encoding="utf-8") as f:
            kirby_content = f.read()
        kirby_cards = re.findall(
            r'<div class="game-card[^"]*"[\s\S]*?'
            r"<h2>(.*?)</h2>[\s\S]*?<p>([\s\S]*?)</p>[\s\S]*?<a href=\"([^\"]+)\"",
            kirby_content,
        )
        for title, desc, href in kirby_cards:
            if href.startswith("http"):
                continue
            rel_key = href.lstrip("./")
            raw_title = clean_text(title)
            metadata[rel_key] = {
                "title": strip_emojis(raw_title),
                "raw_title": raw_title,
                "description": clean_text(desc),
                "creator": "Kirby",
                "rel_path": rel_key,
            }

    # 2. Extract from games/index.html
    index_path = "games/index.html"
    with open(index_path, "r", encoding="utf-8") as f:
        content = f.read()

    cards = re.findall(
        r'<div class="game-card[^"]*"(?: data-creator="([^"]*)")?[\s\S]*?'
        r"<h2>(.*?)</h2>[\s\S]*?<p>([\s\S]*?)</p>[\s\S]*?<a href=\"([^\"]+)\"",
        content,
    )
    for creator, title, desc, href in cards:
        if href.startswith("http"):
            continue
        rel_key = href.lstrip("./")
        raw_title = clean_text(title)
        metadata[rel_key] = {
            "title": strip_emojis(raw_title),
            "raw_title": raw_title,
            "description": clean_text(desc),
            "creator": (creator or "cowneck").capitalize(),
            "rel_path": rel_key,
        }

    return metadata


def build_metadata_block(file_rel_url, info, include_icon=True, include_theme_color=True):
    title = info["title"]
    desc = info["description"]
    creator = info["creator"]
    author_name = "Jimmy Orr" if creator.lower() in ("jimmy", "cowneck") else creator
    full_url = f"https://cowneck.com/{file_rel_url.lstrip('/')}"
    og_image = "https://cowneck.com/og-image.jpg"

    escaped_desc = html.escape(desc, quote=True)
    escaped_title = html.escape(f"{title} | cowneck games", quote=True)

    structured_data = {
        "@context": "https://schema.org",
        "@type": "VideoGame",
        "name": title,
        "url": full_url,
        "description": desc,
        "image": og_image,
        "gamePlatform": ["Web browser"],
        "applicationCategory": "Game",
        "author": {
            "@type": "Person",
            "name": author_name,
        },
        "publisher": {
            "@type": "Organization",
            "name": "cowneck",
            "url": "https://cowneck.com/",
        },
    }

    json_ld = json.dumps(structured_data, indent=2)

    lines = [
        f"    {START_TAG}",
        f'    <meta name="description" content="{escaped_desc}">',
        f'    <link rel="canonical" href="{full_url}">',
    ]
    if include_icon:
        lines.append('    <link rel="icon" type="image/x-icon" href="/favicon.ico">')
    if include_theme_color:
        lines.append('    <meta name="theme-color" content="#080d1a">')

    lines.extend(
        [
            "",
            "    <!-- Link previews (Open Graph & Twitter/X) -->",
            '    <meta property="og:type" content="website">',
            '    <meta property="og:site_name" content="cowneck games">',
            f'    <meta property="og:title" content="{escaped_title}">',
            f'    <meta property="og:description" content="{escaped_desc}">',
            f'    <meta property="og:url" content="{full_url}">',
            f'    <meta property="og:image" content="{og_image}">',
            '    <meta property="og:image:width" content="1200">',
            '    <meta property="og:image:height" content="630">',
            f'    <meta property="og:image:alt" content="{html.escape(title, quote=True)} - cowneck games">',
            '    <meta name="twitter:card" content="summary_large_image">',
            f'    <meta name="twitter:title" content="{escaped_title}">',
            f'    <meta name="twitter:description" content="{escaped_desc}">',
            f'    <meta name="twitter:image" content="{og_image}">',
            "",
            "    <!-- Structured Data (JSON-LD) -->",
            '    <script type="application/ld+json">',
            json_ld,
            "    </script>",
            f"    {END_TAG}",
        ]
    )
    return "\n".join(lines)


def sync_file(filepath, info, rel_url):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    sync_pattern = re.compile(
        rf"^[ \t]*{re.escape(START_TAG)}[\s\S]*?{re.escape(END_TAG)}",
        re.MULTILINE,
    )
    outside_content = sync_pattern.sub("", content)

    has_existing_icon = bool(
        re.search(r'<link[^>]+rel=["\'](?:shortcut )?icon["\'][^>]*>', outside_content, re.I)
    )
    has_existing_theme = bool(
        re.search(r'<meta[^>]+name=["\']theme-color["\'][^>]*>', outside_content, re.I)
    )

    block = build_metadata_block(
        rel_url,
        info,
        include_icon=not has_existing_icon,
        include_theme_color=not has_existing_theme,
    )

    if START_TAG in content and END_TAG in content:
        new_content = sync_pattern.sub(block, content)
    else:
        content = re.sub(r'\n\s*<meta\s+name=["\']description["\'][^>]*>', "", content)
        title_match = re.search(r"(</title>)", content, re.IGNORECASE)
        if title_match:
            idx = title_match.end()
            new_content = content[:idx] + "\n" + block + content[idx:]
        else:
            head_match = re.search(r"(<head[^>]*>)", content, re.IGNORECASE)
            if head_match:
                idx = head_match.end()
                new_content = content[:idx] + "\n" + block + content[idx:]
            else:
                return False

    if new_content != content:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        return True
    return False


def main():
    metadata = extract_cards()
    game_files = glob.glob("games/*.html")
    updated = 0
    for p in sorted(game_files):
        fname = os.path.basename(p)
        if fname in SKIP_FILES:
            continue
        if fname in metadata:
            info = metadata[fname]
        else:
            base_name = fname.replace(".html", "").replace("-", " ").replace("_", " ").title()
            info = {
                "title": base_name,
                "raw_title": base_name,
                "description": f"Play {base_name}, a free web game by cowneck.",
                "creator": "Jimmy Orr",
            }
        rel_url = f"games/{fname}"
        if sync_file(p, info, rel_url):
            updated += 1

    hs_path = "games/high-society/index.html"
    if os.path.exists(hs_path):
        info = metadata.get("high-society/index.html") or {
            "title": "High Society",
            "description": "An interactive board game implementation of High Society on cowneck.",
            "creator": "Jimmy Orr",
        }
        if sync_file(hs_path, info, "games/high-society/"):
            updated += 1

    print(f"Successfully synced metadata in {updated} game files.")
    generate_sitemap()


def generate_sitemap():
    urls = [
        "https://cowneck.com/",
        "https://cowneck.com/games/",
        "https://cowneck.com/projects/",
        "https://cowneck.com/mcu/",
        "https://cowneck.com/music/",
        "https://cowneck.com/math/bernoulli.html",
        "https://cowneck.com/math/imaginary.html",
        "https://cowneck.com/math/collatz.html",
        "https://cowneck.com/math/gemini-math-history.html",
        "https://cowneck.com/games/kirby.html",
        "https://cowneck.com/games/high-society/",
    ]
    for p in sorted(glob.glob("games/*.html")):
        fname = os.path.basename(p)
        if fname in SKIP_FILES:
            continue
        urls.append(f"https://cowneck.com/games/{fname}")

    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for u in urls:
        lines.append(f"  <url><loc>{u}</loc></url>")
    lines.append("</urlset>\n")

    with open("sitemap.xml", "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"Generated sitemap.xml with {len(urls)} URLs.")


if __name__ == "__main__":
    main()
