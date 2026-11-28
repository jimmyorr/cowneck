#!/usr/bin/env python3
"""Mechanical checks for a drafted chapter of the math essays.

Usage:
  python3 .agents/skills/write-chapter/scripts/check_chapter.py essays/<slug>.html \
      [--forbid "term" ...]

Prints the prose word count (paragraphs inside <article>, excluding the nav
and the formula card), validates <head> metadata and JSON-LD against <h1> and
the essay filename, and flags banned phrases, em dashes, exclamation marks,
references to other chapters by position, and any --forbid terms. Exits 1 if
anything is flagged, so the result is easy to read in a log.
"""
import argparse
import html
import json
from pathlib import Path
import re
import sys

BANNED = [
    "without a doubt", "without hyperbole", "literally", "very cool",
    "mind-blowing", "fun fact", "buckle up", "let that sink in",
    "spoiler alert", "game-changer", "dive into", "it's important to note",
    "in today's world",
]
POSITION = re.compile(
    r"\b(previous|next|last|earlier|later|following|preceding|first|second|third)\s+chapters?\b"
    r"|\bchapters?\s+\d+|\bch\.\s*\d+|\bpart\s+(one|two|three|four)\b",
    re.I,
)
SOFT_LIMIT = 3000


def snippet(source: str, start: int, end: int, pad: int = 35) -> str:
    lo, hi = max(0, start - pad), min(len(source), end + pad)
    chunk = " ".join(source[lo:hi].split())
    return f"...{chunk}..."


def prose(text: str) -> str:
    start = text.find("<article")
    end = text.find("</article>")
    body = text[start:end] if start != -1 else text
    body = re.sub(r"<nav\b.*?</nav>", " ", body, flags=re.S)
    body = re.sub(
        r'<div class="formula-card">(?:<div\b[^>]*>.*?</div>|.)*?</div>',
        " ",
        body,
        flags=re.S,
    )
    paras = re.findall(r"<p\b[^>]*>(.*?)</p>", body, flags=re.S)
    return "\n\n".join(html.unescape(re.sub(r"<[^>]+>", "", p)) for p in paras)


def check_metadata(text: str, path: Path) -> list[str]:
    if path.name == "index.html":
        return []
    issues: list[str] = []
    expected_url = f"https://cowneck.com/essays/{path.name}"

    def grab(pattern: str) -> str | None:
        m = re.search(pattern, text, flags=re.S)
        return html.unescape(m.group(1).strip()) if m else None

    h1_raw = grab(r"<h1>(.*?)</h1>")
    h1 = re.sub(r"<[^>]+>", "", h1_raw).strip() if h1_raw else None
    title = grab(r"<title>(.*?)</title>")
    canon = grab(r'<link rel="canonical" href="(.*?)">')
    og_url = grab(r'<meta property="og:url" content="(.*?)">')
    og_title = grab(r'<meta property="og:title" content="(.*?)">')
    tw_title = grab(r'<meta name="twitter:title" content="(.*?)">')
    desc = grab(r'<meta name="description" content="(.*?)">')
    og_desc = grab(r'<meta property="og:description" content="(.*?)">')
    tw_desc = grab(r'<meta name="twitter:description" content="(.*?)">')
    ld_raw = grab(r'<script type="application/ld\+json">\s*(\{.*?\})\s*</script>')

    if not h1:
        issues.append("Missing <h1>")
    else:
        expected_title = f"{h1} | cowneck"
        for label, val in (("title", title), ("og:title", og_title), ("twitter:title", tw_title)):
            if val != expected_title:
                issues.append(f"{label} {val!r} != {expected_title!r}")

    for label, val in (("canonical", canon), ("og:url", og_url)):
        if val != expected_url:
            issues.append(f"{label} {val!r} != {expected_url!r}")

    if not ld_raw:
        issues.append("Missing JSON-LD Article block")
    else:
        try:
            ld = json.loads(ld_raw)
        except json.JSONDecodeError as exc:
            issues.append(f"Invalid JSON-LD: {exc}")
        else:
            if h1 and ld.get("headline") != h1:
                issues.append(f"JSON-LD headline {ld.get('headline')!r} != <h1> {h1!r}")
            for key in ("url", "mainEntityOfPage"):
                if ld.get(key) != expected_url:
                    issues.append(f"JSON-LD {key} {ld.get(key)!r} != {expected_url!r}")
            if desc and ld.get("description") != desc:
                issues.append("JSON-LD description != meta description")

    if not desc or len({desc, og_desc, tw_desc}) != 1:
        issues.append("Description mismatch across meta / og:description / twitter:description")

    return issues


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("chapter")
    ap.add_argument("--forbid", action="append", default=[],
                    help="extra term that must not appear (repeatable)")
    args = ap.parse_args()

    path = Path(args.chapter)
    text = path.read_text(encoding="utf-8")
    words = prose(text)
    count = len(words.split())
    flagged = False

    note = "" if count <= SOFT_LIMIT else f" (over the {SOFT_LIMIT:,} soft limit: make sure every paragraph earns its place)"
    print(f"Prose words: {count:,}{note}")

    for issue in check_metadata(text, path):
        print(f"Metadata: {issue}")
        flagged = True

    for phrase in BANNED:
        for m in re.finditer(re.escape(phrase), words, flags=re.I):
            print(f"Banned phrase ({phrase!r}): {snippet(words, m.start(), m.end())}")
            flagged = True
    for label, pattern in (("Em dash", "—"), ("Exclamation mark", "!")):
        for m in re.finditer(re.escape(pattern), words):
            print(f"{label}: {snippet(words, m.start(), m.end())}")
            flagged = True
    for m in POSITION.finditer(words):
        print(f"Position reference: {snippet(words, m.start(), m.end())}")
        flagged = True
    for term in args.forbid:
        for m in re.finditer(re.escape(term), text, flags=re.I):
            print(f"Forbidden term ({term!r}): {snippet(text, m.start(), m.end())}")
            flagged = True

    if not flagged:
        print("No flags.")
    return 1 if flagged else 0


if __name__ == "__main__":
    sys.exit(main())
