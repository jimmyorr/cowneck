---
name: add-drawing-tutorial
description: >-
  Use this skill when the user provides a reference image (such as a game sprite, screenshot,
  or cartoon character) and asks to add a new step-by-step drawing tutorial to Sketch Pup
  (`games/sketch-pup.html` and `games/sketch-pup-tutorials.js`).
---

# Add a New Drawing Tutorial to Sketch Pup

Sketch Pup (`games/sketch-pup.html`) is a **Paper Companion** drawing tutorial app designed for Miles to follow along with real paper and pencil. All tutorials live in `games/sketch-pup-tutorials.js` on a fixed `800x600` (4:3 landscape) coordinate canvas (`x: 0..800, y: 0..600`, center at `(400, 300)`).

Follow this exact workflow whenever the user supplies a new reference image:

## Step 1: Overlay the `800x600` Coordinate Grid on the Reference Image

Never guess SVG coordinates blindly. Run the coordinate grid helper script to project the user's reference image onto the exact `800x600` paper coordinate space:

```bash
python3 .agents/skills/add-drawing-tutorial/scripts/make_reference_grid.py "<path-to-user-image>" "/tmp/tutorial_ref_grid.png"
```

Then inspect `/tmp/tutorial_ref_grid.png` with `read_file` to read the exact `(x, y)` coordinates of every part of the subject (head, horns/hair, eyes, torso, limbs, props) relative to the `50px` / `100px` grid lines and the `(400, 300)` paper center crosshair.

## Step 2: Copy the Reference Image (Optional but Recommended)

Copy the user's reference image into `games/assets/<tutorial-id>.jpg` (or `.png`) and set `referenceImage: 'assets/<tutorial-id>.jpg'` on the tutorial entry so the **🖼️ Reference** button in the app can toggle the original reference image.

## Step 3: Author the Tutorial in `games/sketch-pup-tutorials.js`

Add a new tutorial object to the `TUTORIALS` array in `games/sketch-pup-tutorials.js`:

1. **5-Chapter Structure (`chapters`)**:
   - Chapter 1 (`id: 'guides'`): **1. Proportion Guides**
     - Step 1 MUST use `camera: { x: 0, y: 0, w: 800, h: 600 }` (full page) and contain 2–4 `kind: 'guide'` strokes (light pencil circles/ovals/boxes) so Miles can place the character(s) on his real sheet of paper without running out of room.
   - Chapters 2–4: **Logical Drawing Stages** (e.g., Big Shapes / Vehicle $\rightarrow$ Main Character Head & Face $\rightarrow$ Body, Clothes & Details)
     - Keep each step to **2–4 `kind: 'ink'` strokes** so a single step is never overwhelming.
     - Order strokes within each step in the exact sequence a hand would draw them (`1 -> 2 -> 3`). Every stroke's SVG `d` path is animated automatically using `stroke-dashoffset` and a virtual pencil cursor.
     - Set each step's `camera: { x, y, w, h }` to smoothly auto-zoom onto the area being drawn (keep roughly a `4:3` or comfortable aspect ratio, e.g., `w: 220, h: 170` for a character's face), and zoom back out (`w: 600..800`) for large hulls or full-scene steps.
     - Avoid drawing dark ink lines *through* overlapping foreground characters; leave clean gaps where foreground characters sit.
   - Chapter 5 (`id: 'color'`): **5. Coloring**
     - Final step MUST set `isColorStep: true`, `camera: { x: 0, y: 0, w: 800, h: 600 }`, and `strokes: []`.
     - Populate `palette` (color swatches with `id`, `name`, `hex`, and `usage` for the interactive checklist) and `fills` / `backgroundFills` (closed SVG `<path>` shapes rendered beneath the ink lines).

## Step 4: Validate & Visually Verify

1. Run the automated schema and unit test suite:
   ```bash
   npm run lint && npm run test:unit
   ```
   `games/sketch-pup.test.js` runs `validateAllTutorials()` to verify every tutorial's fields, Step 1 proportion guides, chapter links, camera boxes, SVG `M` path starts, and final coloring step.
2. Start the local server (`python3 -m http.server 8000 --bind 127.0.0.1`) and use the `browser` subagent to open `http://127.0.0.1:8000/games/sketch-pup.html`, select the new tutorial, step through from Step 1 to the Coloring step, and verify that the proportions and curves look great.
