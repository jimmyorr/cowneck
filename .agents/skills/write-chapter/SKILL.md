---
name: write-chapter
description: >-
  Use this skill when asked to write or draft a new chapter of the math essays
  book (essays/ folder), given a chapter slug or title from essays/OUTLINE.md,
  e.g. "write the zero chapter" or "draft notches".
---

# Write a chapter of the math essays

The book lives in `essays/`: one HTML page per chapter, a research notes file
per chapter in `essays/notes/`, and two binding guides, `essays/STYLE.md` and
`essays/OUTLINE.md`. A chapter is finished when its notes file sources every
factual claim, the page reads like the reference chapters, and both are pushed
to `main`. An editor reviews it afterwards, so leave a clear trail.

The argument is the chapter's slug (`zero`, `notches`, `gauss`, ...) or its
title. Find its entry in `OUTLINE.md`; the slug is the file name it gives.

## Hard rules

- **Work directly on `main`.** No branches, no pull requests, no merge
  commits. Start from an up-to-date `main` and, if the push is rejected,
  `git pull --rebase` and push again.
- **The style's inspiration is never named in the repo.** The private notes
  (step 1) name the writer whose manner the book borrows. That name, and the
  titles of that writer's books, must not appear in any committed file or
  commit message. Describe the voice only in general terms, as `STYLE.md`
  does. Do not copy text from the private notes into the repo.
- **Every factual claim has a source** in the notes file. A detail you can't
  source gets cut, or told and explicitly hedged. This includes small colorful
  details (the color of the mold, the cellar it sat in, what the weather was
  like): those are exactly what slips in unsourced.
- **Never invent biography for the narrator** (see `STYLE.md`).

## 1. Read before writing anything

1. Sync `main`: `git checkout main && git pull --rebase`.
2. Read `essays/STYLE.md` and `essays/OUTLINE.md` in full. Note this chapter's
   **Owns**, **Material** and **Central idea**, and also what every other
   chapter owns, so you know what you may only mention in passing.
3. Read the private notes: `essays/private/influences.md` in a local clone
   (git-ignored), or `/mnt/project-files/book-private/influences.md` in a
   Claude project session. They hold the voice model and material to stay
   away from. If neither file exists, stop and ask for it.
4. Read both reference chapters in full, `essays/bernoulli.html` and
   `essays/imaginary.html`, to calibrate the voice.
5. Read the **opening paragraph of every drafted chapter** (every
   `essays/*.html` except `index.html`). Yours must not repeat a shape already
   used. In particular, do not open with "here is the famous story, and here
   is why it is wrong": several chapters already do. Tell the legend and the
   doubt later in the chapter, where it can be the best material in it.
6. Skim one existing notes file (`essays/notes/eureka.md` is a good model) for
   the format the editor expects.

## 2. Research and write the notes file first

Research with web searches. Prefer MacTutor, Wikipedia (and its citations),
museum and university pages, primary texts in translation, and published
histories over quote sites and listicles. Check every item in the outline's
Material list, not only the ones marked *(verify)*. If your tools can only see
search snippets and not full pages, say so in the notes, and mark claims that
rest on snippets alone.

Write `essays/notes/<slug>.md` before the chapter, then keep it in step with
the text as you draft. Use this shape:

```markdown
# Notes: "<Chapter Title>" (`essays/<slug>.html`)

Prose length: about N words (excluding title, back-link and formula card).

## Sources by claim

### <Section of the chapter>
- **<Claim as it appears in the text>.** <The fact, with dates, numbers and
  exact quotation wording>. Sources: <named source, with URL or citation>.

## Unverified or hedged claims

| Claim | Status | Treatment in text |
|---|---|---|

## Ownership check

- <Each person or story another chapter owns, and how briefly it appears here.>

## Spot-checks for editing pass

- <The 2–3 claims resting on search snippets, secondary quotation, or uninspected print pages, so an editor in a separate session sees them here as well as in the chat report.>
```

Rules for the notes:

- One bullet per claim the text makes: every date, number, quotation, name,
  place and anecdote, including the small details. If it is in the chapter, it
  is in the notes.
- Give quotations in the wording the best source uses, and say which
  translation. If there is no agreed wording, the text paraphrases.
- Show your arithmetic for any computed figure (ages, intervals, unit
  conversions, "two teaspoons").
- Anything apocryphal or disputed goes in the table, with how the text hedges
  it.
- If research turns up a story that is a famous set piece of the writer named
  in the private notes, leave it out of the chapter. Record in the notes only
  that it was left out because it is well covered elsewhere, without naming
  the writer.

## 3. Write the chapter

Follow `STYLE.md` for voice, accuracy, the mathematics, length, cross-references
and the HTML template. Points that have needed fixing in review:

- **The opening is the hook**, and it must be new to the book (see step 1.5).
  A scene, a person, an object or a puzzle all work.
- **Refer to other chapters by subject, never by position.** "When we come to
  Gauss," never "the previous chapter," "chapter 9," or "Part Two." The order
  of chapters may change.
- **Ownership:** a person or story another chapter owns gets a clause at most,
  plus a pointer by subject. Nothing from the off-limits list in `STYLE.md` or
  the private notes.
- **One central idea**, the one the outline names, explained with a concrete
  example for a reader who stopped at algebra 1. At most one `formula-card`.
- **Length:** 2,000 to 3,000 words of prose. 3,000 is a soft limit; running a
  little over is fine if every paragraph earns its place, so cut before you
  pad.
- **End quietly**, on a slightly rueful note, not a moral.
- American spelling. Commas, colons and parentheses rather than em dashes. No
  exclamation marks.

Build `essays/<slug>.html` by copying the `<head>` and page shell from
`essays/imaginary.html` exactly, then updating the title, canonical URL, meta
description, Open Graph and Twitter tags, JSON-LD `Article` block, and the
`<article>` contents, as `STYLE.md` describes.

## 4. Add it to the site

- **`essays/index.html`:** add a card for the chapter, copying an existing
  card. Set `href`, `id="essay-card-<slug>"`, a `card-<slug>` class with its
  own CSS block (copy `.card-eureka` and pick a different color), the
  `essay-number` from `OUTLINE.md`, the title, and a one-sentence description
  that matches the meta description. Keep the cards in chapter-number order.
- **`sitemap.xml`:** add `https://cowneck.com/essays/<slug>.html`,
  alphabetically among the other essays.
- **`essays/OUTLINE.md`:** mark the chapter's heading *(drafted)*.

## 5. Check

1. Run the mechanical checks, passing the writer's surname and distinctive book-title phrases from the private notes as `--forbid` terms (on the command line only, never in a file; skip short titles made of everyday words that occur in ordinary lowercase prose, or verify from the printed context snippet):

   ```bash
   python3 .agents/skills/write-chapter/scripts/check_chapter.py essays/<slug>.html --forbid "<name>" --forbid "<title>"
   ```

   It prints the prose word count, validates `<head>` metadata and JSON-LD against `<h1>` and `essays/<slug>.html`, and flags banned phrases, em dashes, exclamation marks and position references. Fix every flag, or be sure it is inside a quotation. Put the final word count in the notes file.
2. Search everything you are about to commit for the same names:
   `git diff --cached | grep -i -E "<name>|<title>"` must print nothing.
3. Run `npm run lint` to confirm repo-wide lint passes with zero warnings (`eslint.config.mjs` does not lint `essays/*.html` directly; `check_chapter.py` checks the chapter's metadata and JSON-LD).
4. Open both `essays/<slug>.html` and `essays/index.html` at 360px width (a Playwright check is fine): no horizontal scroll, the formula card fits, and the new numbered card aligns cleanly.
5. Reread the chapter once against the notes file, claim by claim. Anything in the text that is not in the notes gets a source or comes out. If you trimmed or rephrased the chapter after drafting, re-sync `essays/notes/<slug>.md` too (word count, cut claims, and verbatim cross-reference quotes in `## Ownership check`).

## 6. Record the private overlap check

Add a short `### <slug>` section to the private notes' "Overlap checks"
list, saying what you checked against the off-limits material and what you
left out. Edit whichever copy you read in step 1; this file is never
committed. If you can't write to it, put the text in your final report so it
can be pasted in.

## 7. Commit and push

Commit `essays/<slug>.html`, `essays/notes/<slug>.md`, `essays/index.html`,
`sitemap.xml` and `essays/OUTLINE.md` to `main` in one commit, with a plain
message such as `Add <Title> chapter on <subject>`. Push to `main`.

## 8. Report

Reply with: the chapter title and word count; the two or three claims from
`## Spot-checks for editing pass` in `essays/notes/<slug>.md` that most need a
human spot-check (never report a spot-check in chat without also recording it
in the notes file); anything from the Material list you left out and why; and
the overlap-check text if you could not write it to the private notes. Suggest
an editing pass as the next step.
