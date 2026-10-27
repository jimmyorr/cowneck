#!/usr/bin/env python3
"""
Sync metadata, Open Graph, Twitter cards, canonical tags, and Schema.org VideoGame
structured data from games/index.html into all individual game HTML files.
Modeled after chill-flight/scripts/sync-metadata.js.
"""
import glob
import html
import json
import os
import re

START_TAG = "<!-- sync-start:metadata -->"
END_TAG = "<!-- sync-end:metadata -->"

def clean_text(text):
    text = re.sub(r'<[^>]+>', '', text)
    return ' '.join(text.split()).strip()

def extract_cards():
    index_path = "games/index.html"
    with open(index_path, "r", encoding="utf-8") as f:
        content = f.read()

    cards = re.findall(
        r'<div class="game-card[^"]*"(?: data-creator="([^"]*)")?[\s\S]*?'
        r'<h2>(.*?)</h2>[\s\S]*?<p>([\s\S]*?)</p>[\s\S]*?<a href="([^"]+)"',
        content,
    )
    metadata = {}
    for creator, title, desc, href in cards:
        if href.startswith("http"):
            continue
        filename = os.path.basename(href)
        # remove emojis for cleaner title in schema / og tags
        raw_title = clean_text(title)
        # e.g. "🐾 Goofy Paws" -> "Goofy Paws"
        clean_title_no_emoji = re.sub(r'^[^\w\s]+\s*', '', raw_title)
        clean_title_no_emoji = re.sub(r'\s*[^\w\s]+$', '', clean_title_no_emoji)
        if not clean_title_no_emoji:
            clean_title_no_emoji = raw_title
        
        metadata[filename] = {
            "title": clean_title_no_emoji,
            "raw_title": raw_title,
            "description": clean_text(desc),
            "creator": (creator or "cowneck").capitalize(),
            "rel_path": href,
        }
    return metadata

def build_metadata_block(file_rel_url, info):
    title = info["title"]
    desc = info["description"]
    creator = info["creator"]
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
            "name": creator if creator != "Cowneck" else "Jimmy Orr",
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
        f'    <link rel="icon" type="image/x-icon" href="/favicon.ico">',
        f'    <meta name="theme-color" content="#080d1a">',
        f"",
        f"    <!-- Link previews (Open Graph & Twitter/X) -->",
        f'    <meta property="og:type" content="website">',
        f'    <meta property="og:site_name" content="cowneck games">',
        f'    <meta property="og:title" content="{escaped_title}">',
        f'    <meta property="og:description" content="{escaped_desc}">',
        f'    <meta property="og:url" content="{full_url}">',
        f'    <meta property="og:image" content="{og_image}">',
        f'    <meta property="og:image:width" content="1200">',
        f'    <meta property="og:image:height" content="630">',
        f'    <meta property="og:image:alt" content="{html.escape(title, quote=True)} - cowneck games">',
        f'    <meta name="twitter:card" content="summary_large_image">',
        f'    <meta name="twitter:title" content="{escaped_title}">',
        f'    <meta name="twitter:description" content="{escaped_desc}">',
        f'    <meta name="twitter:image" content="{og_image}">',
        f"",
        f"    <!-- Structured Data (JSON-LD) -->",
        f'    <script type="application/ld+json">',
        json_ld,
        f"    </script>",
        f"    {END_TAG}",
    ]
    return "\n".join(lines)

def sync_file(filepath, info, rel_url):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    block = build_metadata_block(rel_url, info)

    # Check if already has sync tags
    if START_TAG in content and END_TAG in content:
        pattern = re.compile(rf"{re.escape(START_TAG)}[\s\S]*?{re.escape(END_TAG)}")
        new_content = pattern.sub(block, content)
    else:
        # If there's an existing description tag, remove it so we don't duplicate
        content = re.sub(r'\n\s*<meta\s+name=["\']description["\'][^>]*>', '', content)
        # Insert after <title>...</title>
        title_match = re.search(r'(</title>)', content, re.IGNORECASE)
        if title_match:
            idx = title_match.end()
            new_content = content[:idx] + "\n" + block + content[idx:]
        else:
            # Insert after <head>
            head_match = re.search(r'(<head[^>]*>)', content, re.IGNORECASE)
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
        if fname == "index.html":
            continue
        if fname in metadata:
            info = metadata[fname]
        else:
            # Fallback
            base_name = fname.replace('.html', '').replace('-', ' ').replace('_', ' ').title()
            info = {
                "title": base_name,
                "raw_title": base_name,
                "description": f"Play {base_name}, a free web game by cowneck.",
                "creator": "Jimmy Orr",
            }
        rel_url = f"games/{fname}"
        if sync_file(p, info, rel_url):
            updated += 1

    # Also check games/high-society/index.html if exists
    hs_path = "games/high-society/index.html"
    if os.path.exists(hs_path):
        info = metadata.get("index.html") or {
            "title": "High Society",
            "description": "An interactive board game implementation of High Society on cowneck.",
            "creator": "Jimmy Orr",
        }
        if sync_file(hs_path, info, "games/high-society/"):
            updated += 1

    print(f"Successfully synced metadata in {updated} game files.")

if __name__ == "__main__":
    main()
