#!/usr/bin/env python3
"""Mechanical checks for a drafted chapter of the math essays.

Usage:
  python3 .agents/skills/write-chapter/scripts/check_chapter.py essays/<slug>.html \
      [--forbid "term" ...]

Prints the prose word count (paragraphs inside <article>, excluding the nav
and the formula card) and flags banned phrases, em dashes, exclamation marks,
references to other chapters by position, and any --forbid terms. Exits 1 if
anything is flagged, so the result is easy to read in a log.
"""
import argparse
import html
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


def prose(text: str) -> str:
    start = text.find("<article")
    end = text.find("</article>")
    body = text[start:end] if start != -1 else text
    body = re.sub(r"<nav\b.*?</nav>", " ", body, flags=re.S)
    body = re.sub(r'<div class="formula-card".*?</div>', " ", body, flags=re.S)
    paras = re.findall(r"<p\b[^>]*>(.*?)</p>", body, flags=re.S)
    return "\n\n".join(html.unescape(re.sub(r"<[^>]+>", "", p)) for p in paras)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("chapter")
    ap.add_argument("--forbid", action="append", default=[],
                    help="extra term that must not appear (repeatable)")
    args = ap.parse_args()

    text = open(args.chapter, encoding="utf-8").read()
    words = prose(text)
    count = len(words.split())
    flagged = False

    note = "" if count <= SOFT_LIMIT else f" (over the {SOFT_LIMIT:,} soft limit: make sure every paragraph earns its place)"
    print(f"Prose words: {count:,}{note}")

    lower = words.lower()
    for phrase in BANNED:
        if phrase in lower:
            print(f"Banned phrase: {phrase!r}")
            flagged = True
    for label, pattern in (("Em dash", "—"), ("Exclamation mark", "!")):
        n = words.count(pattern)
        if n:
            print(f"{label}: {n}")
            flagged = True
    for m in POSITION.finditer(words):
        lo, hi = max(0, m.start() - 40), min(len(words), m.end() + 40)
        print(f"Position reference: ...{words[lo:hi].strip()}...")
        flagged = True
    for term in args.forbid:
        if term.lower() in text.lower():
            print(f"Forbidden term present: {term!r}")
            flagged = True

    if not flagged:
        print("No flags.")
    return 1 if flagged else 0


if __name__ == "__main__":
    sys.exit(main())
