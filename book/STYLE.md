# Style Guide

Every chapter session reads this file and `OUTLINE.md` before writing anything.
The goal is a book that reads as if one person wrote it, in the manner of Bill
Bryson: a curious, amused, well-read amateur telling you about the people behind
mathematics. It is never a textbook.

The two finished chapters are the reference standard. Read at least one before
you start:

- `math/bernoulli.html` ("The Calculus of Dysfunction")
- `math/imaginary.html` ("An Imaginary Problem")

## Voice

- **Understate.** The comedy comes from calm phrasing set against absurd facts.
  Write "a response that even by Bernoulli standards seems a touch excessive,"
  not "an INSANE overreaction."
  - Good: "He was, by all accounts, brilliant, methodical and touchy."
  - Good: "…which is just showing off, really."
- **People first, maths second.** Each chapter is carried by people: their
  feuds, vanities, misfortunes and odd habits. Let the mathematics arrive as
  the thing they were fighting over.
- **Specifics over adjectives.** Give the date, the price, the street, the age,
  how many pages. "He had it solved by four o'clock the next morning" beats
  "he solved it astonishingly fast."
- **Wry asides and brief digressions** are welcome. A good digression is a
  single sentence or a short paragraph, and it comes back to the story.
- **Sympathy.** Bryson laughs *with* his subjects more often than at them.
  Johann Bernoulli can be a villain. Most people should come out of a chapter
  looking human rather than ridiculous.
- **End each chapter on a quiet, slightly rueful note.** Never on a moral
  delivered with a fanfare.

## The narrator

- The narrator may say "I" and give opinions ("I find it oddly comforting
  that…").
- **Never invent biography for the narrator.** No brother, no children, no
  childhood memories, no trips to Basel, no visits to archives. The site owner
  is a real person, and anything personal in the essays reads as being about
  them. If a joke needs a personal anecdote, find a different joke.
- The narrator is not a professional mathematician and never pretends to be.
  Mild bafflement at hard ideas is part of the voice, but it must never be used
  as an excuse to explain something incorrectly.

## Banned and discouraged phrasing

Do not use: "without a doubt," "without hyperbole," "literally" (as an
intensifier), "very cool," "mind-blowing," "fun fact," "buckle up," "let that
sink in," "spoiler alert," "game-changer," "dive into," "it's important to note,"
"in today's world." These are the tics that made the first drafts sound like a
blog rather than Bryson.

Use sparingly: exclamation marks (essentially never), rhetorical questions, pop
culture references (one per chapter at most, and nothing that will date
quickly), and em dashes (prefer commas, colons and parentheses).

## Accuracy

The jokes only work if the facts underneath them are solid.

- **Verify with web searches** every date, quotation, number and anecdote you
  use. Prefer MacTutor (mathshistory.st-andrews.ac.uk), Wikipedia (with its
  citations), museum and university pages, and published histories over
  quote sites and listicles.
- **Hedge apocrypha in Bryson's way.** Do not cut a good story because it is
  doubtful. Tell it, and then say how doubtful it is. Examples:
  - "He is often said to have shrugged that he would now have fewer
    distractions, and it is a lovely line, though there's no very good evidence
    that he ever said it."
  - "According to a story that is too good to check and too dubious to repeat
    with confidence…"
  The gap between the legend and the record is often the best material in the
  chapter. Galois's "I have no time" and Gauss summing 1 to 100 are examples.
- **Do not overclaim firsts.** "Popularized" is usually safer than "invented."
- **Quotations:** use the wording the best source gives. Where there is no
  agreed wording, paraphrase rather than quoting.
- Write a notes file for each chapter at `book/notes/<slug>.md`. It lists the
  sources used for each major claim, plus any claim you could not verify and
  how the text hedges it. The editing pass relies on this file.

## Stay out of Bryson's books

This book borrows Bill Bryson's manner. It must not borrow his material.
Above all, avoid *A Short History of Nearly Everything*, which already
covers a lot of the history of science. Do not retell, beyond a passing
clause or a cross-reference:

- **Newton the man:** his alchemy, poking a bodkin into his own eye socket,
  the plague years and the apple, Halley's 1684 visit and the writing of the
  *Principia*, the feud with Hooke, his time at the Mint.
- **Measuring and weighing the Earth:** the French expeditions to Peru and
  Lapland (La Condamine, Bouguer, Godin, Maupertuis), Maskelyne and
  Schiehallion, Cavendish weighing the Earth.
- **Einstein and relativity** as an explanation. Einstein can appear as a
  character (Gödel's walking companion, Noether's admirer), but don't explain
  relativity at length.
- **Anything about the age of the Earth, geology, atoms, chemistry, evolution
  or cosmology.** None of it belongs in this book anyway.

Also:

- Never reuse Bryson's jokes, phrasings or chapter titles, and never
  paraphrase a passage of his. If you remember how he told an anecdote, tell
  it differently or drop it.
- Never mention Bryson in the published text. "In the style of" is for us,
  not the reader.
- If research turns up a story that you suspect is a Bryson set piece,
  leave it out and record it in the chapter's notes file.

## The mathematics

- Explain **one** central idea per chapter well enough that a reader who
  stopped at algebra 1 can follow it. Use a concrete example rather than a
  definition (the bead on a curve, the 1-by-1 square's diagonal).
- At most **one** `formula-card` per chapter, and only when the formula is the
  punchline. No LaTeX and no MathJax. Use HTML entities (`&pi;`, `&radic;`,
  `&minus;`) and `<sup>`/`<em>`.
- It is fine to say something is hard. It is never fine to say something
  wrong.

## Length and shape

- Aim for 2,000–3,000 words of prose per chapter.
- Paragraphs: mostly 3–7 sentences. The occasional one-line paragraph is
  allowed for a turn in the story ("Then someone divided a sheep.").
- Chapter titles should be short and wry. Avoid reusing the titles of
  well-known books (e.g. not "The Man Who Knew Infinity").
- Spelling: **American** ("recognized," "airplane," "saber").

## Cross-references

`OUTLINE.md` gives each recurring person and story to exactly one chapter. That
chapter tells the story in full. Every other chapter mentions the person
briefly, if at all, and may point back ("as we saw with the Bernoullis…" or
"whom we shall meet properly later"). Do not retell Euler going blind, Hippasus
being drowned or Cardano stealing the cubic in any chapter except the one that
owns it.

## HTML template

- Copy the `<head>` (Google tag, fonts, full `<style>` block) and page shell
  from `math/imaginary.html` exactly, so every chapter looks the same. Change
  only the `<title>`, the meta description and the `<article>` contents.
- `<title>` is the chapter title alone. The meta description is one plain
  sentence about the chapter.
- Link each person's first mention to Wikipedia with
  `target="_blank" rel="noopener noreferrer"` and wrap the name in `<strong>`.
  Put `class="accent-text"` on the link for the chapter's central subject (once).
- The opening paragraph is the hook. The CSS styles the first `<p>` larger, so
  make it count.
- Save the chapter as `book/<slug>.html`, with the slug taken from `OUTLINE.md`.
- Check the page at 360px width: no horizontal scroll, and any formula card
  fits.
