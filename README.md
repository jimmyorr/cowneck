# cowneck

Source code for [cowneck.com](https://cowneck.com) — interactive web games, generative audio toys, math essays, and side projects by Jimmy Orr, Oliver, and Miles.

## Project structure

- `index.html` — Main landing page.
- `games/` — Standalone HTML5 web games (including **🐶 Lofi Pup** at `games/lofi-pup.html`) and the games catalog (`games/index.html`).
- `math/` — Interactive mathematics essays and visualizations.
- `music/` — Music collection explorer.
- `mcu/` — Marvel Cinematic Universe tracker.
- `projects/` — Software and creative projects hub.
- `scripts/` — Repository maintenance and asset generation scripts:
  - `scripts/sync-games-metadata.py` — Syncs Open Graph, Twitter Card, canonical URL, Google Analytics (`gtag.js`), and Schema.org `VideoGame` JSON-LD blocks from `games/index.html` into each game file, and regenerates `sitemap.xml`.
  - `scripts/generate-og-image.py` — Generates `og-image.jpg` (`1200x630`).
  - `scripts/generate-itch-assets.py` — Generates itch.io profile banner and background images.
- `tests/` — Automated Playwright end-to-end tests.

## Getting started

### Prerequisites

- **Python 3.10+** (for local static serving and metadata/asset scripts; `Pillow` is only needed when regenerating image assets).
- **Node.js 20+** and **Google Chrome / Chromium** (for linting and headless Playwright tests).

### Install developer dependencies

```bash
npm install
```

### Run locally

Serve the static site from the repository root:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8000/games/lofi-pup.html`.

## Scripts

- `npm run sync:metadata` — Sync metadata, structured data, analytics tags, and `sitemap.xml` across all game pages (works from any working directory).
- `npm run build:og` — Regenerate the social preview image (`og-image.jpg`).
- `npm run lint` — Run ESLint with zero warnings allowed (`--max-warnings=0`).
- `npm run test:e2e` — Run headless Playwright end-to-end tests.
- `npm test` — Run both linting and end-to-end tests.
