// --- Sketch Pup Cartoon Drawing Tutorials Catalog & Schema Validator ---
// Designed for Paper Companion Mode (800x600 4:3 landscape sheet).
// Future agents: see .agents/skills/add-drawing-tutorial/SKILL.md for the step-by-step
// workflow to convert any new reference image into a tutorial entry here.
(function (root) {
    'use strict';

    const PAPER_VIEWBOX = { x: 0, y: 0, w: 800, h: 600 };

    const TUTORIALS = [
        {
            id: 'swan-boat',
            title: 'Swan Boat (Kris & Ralsei)',
            series: 'Deltarune',
            subtitle: 'Acid Tunnel of Love • Full Scene',
            characterTags: ['Kris', 'Ralsei', 'Swan Boat'],
            difficulty: 'Medium • Full Scene',
            badgeEmoji: '🦢',
            featured: true,
            referenceImage: 'assets/deltarune-swan-boat.jpg',
            viewBox: PAPER_VIEWBOX,
            chapters: [
                { id: 'guides', number: 1, title: '1. Proportion Guides', shortTitle: '1. Guides' },
                { id: 'boat', number: 2, title: '2. Swan Boat', shortTitle: '2. Swan Boat' },
                { id: 'ralsei', number: 3, title: '3. Ralsei', shortTitle: '3. Ralsei' },
                { id: 'kris', number: 4, title: '4. Kris', shortTitle: '4. Kris' },
                { id: 'color', number: 5, title: '5. Coloring', shortTitle: '5. Coloring' }
            ],
            palette: [
                { id: 'swan-white', name: 'Swan White', hex: '#ffffff', usage: 'Swan boat body, Ralsei fur & paws' },
                { id: 'wing-grey', name: 'Soft Feather Grey', hex: '#94a3b8', usage: 'Swirly wing lines on the side of the boat' },
                { id: 'beak-orange', name: 'Swan Beak Orange', hex: '#f97316', usage: 'Pointed duck/swan beak' },
                { id: 'ralsei-pink', name: 'Ralsei Horn Pink', hex: '#fda4af', usage: 'Ralsei horns & rosy cheek blush' },
                { id: 'scarf-magenta', name: 'Scarf & Cape Magenta', hex: '#ec4899', usage: 'Ralsei scarf & Kris flowing shoulder cape' },
                { id: 'ralsei-green', name: 'Mint Robe Green', hex: '#34d399', usage: 'Ralsei round glasses & robe' },
                { id: 'kris-cyan', name: 'Kris Cyan Blue', hex: '#67e8f9', usage: 'Kris face, nose & ear' },
                { id: 'armor-silver', name: 'Silver-Blue Armor', hex: '#93c5fd', usage: 'Kris chest armor & gauntlet' },
                { id: 'dark-navy', name: 'Dark Ink Navy', hex: '#0f172a', usage: 'Kris shaggy hair, boots & Ralsei sleeves' },
                { id: 'acid-lime', name: 'Neon River Green', hex: '#a3e635', usage: 'River water & dark green boat shadow' }
            ],
            backgroundFills: [
                { id: 'bg-tunnel-wall', d: 'M 40 70 L 760 70 L 760 212 L 40 212 Z', fill: '#0f2942' },
                { id: 'bg-tunnel-trim', d: 'M 40 192 L 760 192 L 760 215 L 40 215 Z', fill: '#38bdf8', opacity: 0.25 },
                { id: 'bg-acid-river', d: 'M 40 212 L 760 212 L 760 510 L 40 510 Z', fill: '#a3e635' },
                { id: 'bg-acid-bank', d: 'M 40 212 L 760 212 L 760 236 L 40 236 Z', fill: '#4ade80', opacity: 0.55 },
                { id: 'bg-water-shadow', d: 'M 200 456 C 200 434, 544 434, 544 456 C 544 478, 200 478, 200 456 Z', fill: '#16a34a' }
            ],
            fills: [
                // Ralsei fills
                {
                    id: 'fill-ralsei-tail',
                    d: 'M 254 282 C 242 280, 234 286, 236 296 C 238 304, 248 308, 258 308 Z',
                    fill: '#ffffff'
                },
                {
                    id: 'fill-ralsei-head',
                    d: 'M 262 184 C 244 190, 230 208, 224 232 C 222 242, 228 248, 236 244 C 234 254, 242 258, 252 250 L 294 248 C 308 248, 318 244, 320 236 C 322 224, 318 216, 308 214 C 308 208, 308 196, 304 186 L 298 175 L 278 175 Z',
                    fill: '#ffffff'
                },
                {
                    id: 'fill-ralsei-horn-left',
                    d: 'M 262 186 C 254 170, 256 156, 262 150 C 272 154, 278 164, 280 176 Z',
                    fill: '#fda4af'
                },
                {
                    id: 'fill-ralsei-horn-right',
                    d: 'M 298 175 C 302 164, 308 164, 310 172 C 312 178, 308 184, 304 186 Z',
                    fill: '#fda4af'
                },
                {
                    id: 'fill-ralsei-blush',
                    d: 'M 277 232 C 277 229, 289 229, 289 232 C 289 235, 277 235, 277 232 Z',
                    fill: '#fda4af'
                },
                {
                    id: 'fill-ralsei-robe',
                    d: 'M 256 266 L 258 330 L 316 330 C 314 310, 306 286, 300 268 Z',
                    fill: '#34d399'
                },
                {
                    id: 'fill-ralsei-sleeve',
                    d: 'M 256 266 C 250 280, 252 298, 260 304 L 278 300 L 272 268 Z',
                    fill: '#0f172a'
                },
                {
                    id: 'fill-ralsei-paw',
                    d: 'M 275 292 C 275 286, 289 286, 289 292 C 289 298, 275 298, 275 292 Z',
                    fill: '#ffffff'
                },
                {
                    id: 'fill-ralsei-scarf',
                    d: 'M 252 248 C 270 250, 292 250, 310 248 C 312 256, 312 264, 308 268 C 290 272, 268 270, 254 266 Z',
                    fill: '#ec4899'
                },
                {
                    id: 'fill-ralsei-scarf-tail',
                    d: 'M 298 268 C 306 274, 310 284, 308 294 C 302 296, 296 292, 294 282 Z',
                    fill: '#db2777'
                },
                // Kris fills
                {
                    id: 'fill-kris-boots',
                    d: 'M 376 295 L 374 330 L 424 330 L 420 295 Z',
                    fill: '#0f172a'
                },
                {
                    id: 'fill-kris-armor',
                    d: 'M 380 262 L 424 262 C 430 272, 430 290, 424 300 L 378 300 Z',
                    fill: '#93c5fd'
                },
                {
                    id: 'fill-kris-arm',
                    d: 'M 380 286 L 378 318 C 384 322, 394 322, 398 316 L 398 286 Z',
                    fill: '#60a5fa'
                },
                {
                    id: 'fill-kris-cape',
                    d: 'M 402 248 C 414 248, 424 252, 426 260 C 414 276, 390 290, 362 296 C 370 278, 384 260, 402 248 Z',
                    fill: '#ec4899'
                },
                {
                    id: 'fill-kris-face',
                    d: 'M 386 210 L 436 210 C 440 218, 444 222, 444 232 C 444 242, 434 248, 412 248 L 396 248 Z',
                    fill: '#67e8f9'
                },
                {
                    id: 'fill-kris-ear',
                    d: 'M 381 226 C 381 220, 393 220, 393 226 C 393 232, 381 232, 381 226 Z',
                    fill: '#67e8f9'
                },
                {
                    id: 'fill-kris-hair',
                    d: 'M 380 174 L 384 162 L 394 172 C 418 172, 440 184, 446 210 L 396 210 L 396 238 L 388 236 L 388 218 C 380 220, 380 236, 388 238 L 388 252 L 366 258 C 358 252, 354 242, 354 228 C 354 202, 362 182, 380 174 Z',
                    fill: '#0f172a'
                },
                // Swan Boat fills
                {
                    id: 'fill-swan-body',
                    d: 'M 555 122 C 525 108, 492 115, 480 148 C 472 172, 480 245, 478 282 C 476 312, 462 328, 442 330 L 264 330 C 258 304, 250 286, 240 274 C 236 284, 238 298, 244 316 C 234 294, 222 276, 205 262 C 200 272, 198 286, 200 304 C 190 286, 176 268, 158 255 C 148 308, 156 355, 178 395 C 198 432, 232 452, 280 456 L 472 456 C 504 456, 534 436, 550 408 C 570 372, 572 332, 560 302 C 540 255, 522 222, 516 192 L 552 192 L 582 170 C 582 152, 574 132, 555 122 Z',
                    fill: '#ffffff'
                },
                {
                    id: 'fill-swan-beak',
                    d: 'M 582 170 C 572 184, 562 190, 552 192 C 562 208, 568 228, 576 232 L 594 230 C 598 214, 590 188, 582 170 Z',
                    fill: '#f97316'
                }
            ],
            steps: [
                {
                    stepNumber: 1,
                    chapter: 'guides',
                    title: 'Light Pencil Placement Guides',
                    tip: 'Turn your paper sideways! With a light pencil, sketch the wide boat bowl, the curved swan neck on the right, and two ovals on the deck.',
                    camera: { x: 0, y: 0, w: 800, h: 600 },
                    strokes: [
                        {
                            id: 'guide-hull',
                            label: 'Wide boat bowl below the middle line',
                            kind: 'guide',
                            d: 'M 170 330 C 170 460, 560 460, 565 330 L 170 330'
                        },
                        {
                            id: 'guide-swan-neck',
                            label: 'Tall swan neck & head on the right',
                            kind: 'guide',
                            d: 'M 476 330 L 480 150 C 480 110, 580 110, 580 165 C 580 198, 525 198, 530 225 L 565 330'
                        },
                        {
                            id: 'guide-ralsei-box',
                            label: 'Ralsei oval on the left side of the deck',
                            kind: 'guide',
                            d: 'M 272 170 C 314 170, 318 250, 314 330 L 236 330 C 232 250, 232 170, 272 170'
                        },
                        {
                            id: 'guide-kris-box',
                            label: 'Kris oval right on the center line',
                            kind: 'guide',
                            d: 'M 400 170 C 442 170, 442 250, 424 330 L 372 330 C 356 250, 358 170, 400 170'
                        }
                    ]
                },
                {
                    stepNumber: 2,
                    chapter: 'boat',
                    title: 'Swan Head, Neck & Pointed Beak',
                    tip: 'Switch to your drawing pencil! Curve the swan’s graceful neck up on the right, tuck under the chin, and add the beak and eyelash eye.',
                    camera: { x: 380, y: 80, w: 320, h: 350 },
                    strokes: [
                        {
                            id: 'swan-inner-neck',
                            label: 'Top of head & inner neck to the deck',
                            kind: 'ink',
                            d: 'M 555 122 C 525 108, 492 115, 480 148 C 472 172, 480 245, 478 282 C 476 312, 462 328, 442 330'
                        },
                        {
                            id: 'swan-outer-neck',
                            label: 'Forehead, chin tuck & proud chest curve',
                            kind: 'ink',
                            d: 'M 555 122 C 574 132, 582 152, 582 170 M 552 192 L 516 192 C 522 222, 540 255, 560 302 C 572 332, 570 372, 550 408'
                        },
                        {
                            id: 'swan-beak',
                            label: 'Pointed swan beak on the right',
                            kind: 'ink',
                            d: 'M 582 170 C 572 184, 562 190, 552 192 C 562 208, 568 228, 576 232 L 594 230 C 598 214, 590 188, 582 170 Z'
                        },
                        {
                            id: 'swan-eye',
                            label: 'Dark oval eye with two cute eyelashes',
                            kind: 'ink',
                            fillInk: true,
                            d: 'M 546 147 C 556 147, 562 153, 562 161 C 562 169, 556 175, 546 175 C 536 175, 530 169, 530 161 C 530 153, 536 147, 546 147 Z M 533 151 L 520 139 M 530 162 L 511 162'
                        }
                    ]
                },
                {
                    stepNumber: 3,
                    chapter: 'boat',
                    title: 'Boat Hull, Tail Feathers & Deck',
                    tip: 'Sweep the bottom of the boat to the left and zig-zag three spiky tail feathers on the back! Leave two deck gaps where Ralsei and Kris stand.',
                    camera: { x: 110, y: 200, w: 510, h: 290 },
                    strokes: [
                        {
                            id: 'swan-bottom-hull',
                            label: 'Long bottom hull curving up the back',
                            kind: 'ink',
                            d: 'M 550 408 C 534 436, 504 456, 472 456 L 280 456 C 232 452, 198 432, 178 395 C 156 355, 148 308, 158 255'
                        },
                        {
                            id: 'swan-tail-feathers',
                            label: 'Three pointed tail feathers on the left',
                            kind: 'ink',
                            d: 'M 158 255 C 176 268, 190 286, 200 304 C 198 286, 200 272, 205 262 C 222 276, 234 294, 244 316 C 238 298, 236 284, 240 274 C 250 286, 258 304, 264 330 M 174 328 C 192 346, 214 358, 238 362'
                        },
                        {
                            id: 'swan-deck-line',
                            label: 'Flat boat deck lines between characters',
                            kind: 'ink',
                            d: 'M 314 330 L 374 330 M 422 330 L 444 330'
                        }
                    ]
                },
                {
                    stepNumber: 4,
                    chapter: 'boat',
                    title: 'The Swirly Folded Wing',
                    tip: 'In the middle of the boat hull, draw the folded swan wing! Start with a spiral swirl in the center, then add three wavy feather bumps below.',
                    camera: { x: 205, y: 280, w: 310, h: 185 },
                    strokes: [
                        {
                            id: 'swan-wing-swirl',
                            label: 'Upper wing curve & center spiral swirl',
                            kind: 'ink',
                            inkColor: '#94a3b8',
                            d: 'M 258 332 C 266 364, 286 386, 312 392 C 338 394, 354 374, 350 352 C 348 338, 336 330, 324 334 C 310 340, 308 358, 318 368 C 326 374, 336 368, 334 358'
                        },
                        {
                            id: 'swan-wing-feathers',
                            label: 'Three scalloped feather curves underneath',
                            kind: 'ink',
                            inkColor: '#94a3b8',
                            d: 'M 258 332 C 260 374, 282 406, 318 412 C 338 430, 364 430, 382 416 C 398 428, 416 426, 428 410 C 450 388, 460 360, 462 330'
                        }
                    ]
                },
                {
                    stepNumber: 5,
                    chapter: 'ralsei',
                    title: 'Ralsei’s Horns, Fluffy Ears & Snout',
                    tip: 'Zoom in on Ralsei on the left! Draw his two curved horns on top, his floppy goat ear on the left, and his rounded snout facing right.',
                    camera: { x: 180, y: 125, w: 200, h: 160 },
                    strokes: [
                        {
                            id: 'ralsei-horns',
                            label: 'Two curved horns & top of head',
                            kind: 'ink',
                            d: 'M 262 186 C 254 170, 256 156, 262 150 C 272 154, 278 164, 280 176 M 278 175 L 298 175 M 298 175 C 302 164, 308 164, 310 172 C 312 178, 308 184, 304 186'
                        },
                        {
                            id: 'ralsei-ears',
                            label: 'Floppy goat ear with two fluffy tufts',
                            kind: 'ink',
                            d: 'M 262 184 C 244 190, 230 208, 224 232 C 222 242, 228 248, 236 244 C 234 254, 242 258, 252 250'
                        },
                        {
                            id: 'ralsei-snout',
                            label: 'Rounded snout & happy little smile',
                            kind: 'ink',
                            d: 'M 304 186 C 308 196, 308 208, 308 214 C 318 216, 322 224, 320 236 C 318 244, 308 248, 294 248 M 304 234 C 309 236, 314 235, 317 232'
                        }
                    ]
                },
                {
                    stepNumber: 6,
                    chapter: 'ralsei',
                    title: 'Ralsei’s Round Glasses & Cozy Scarf',
                    tip: 'Draw a big circle for Ralsei’s glasses with an oval pupil inside, then wrap his thick scarf around his neck with the end hanging down.',
                    camera: { x: 185, y: 155, w: 195, h: 165 },
                    strokes: [
                        {
                            id: 'ralsei-glasses',
                            label: 'Big round glasses frame & temple bar',
                            kind: 'ink',
                            inkColor: '#10b981',
                            d: 'M 290 198 C 299 198, 305 204, 305 213 C 305 222, 299 228, 290 228 C 281 228, 275 222, 275 213 C 275 204, 281 198, 290 198 Z M 275 212 L 258 212'
                        },
                        {
                            id: 'ralsei-eye',
                            label: 'Oval pupil inside his glasses',
                            kind: 'ink',
                            fillInk: true,
                            d: 'M 293 208 C 296 208, 298 211, 298 214 C 298 217, 296 220, 293 220 C 290 220, 288 217, 288 214 C 288 211, 290 208, 293 208 Z'
                        },
                        {
                            id: 'ralsei-scarf',
                            label: 'Snug scarf collar & hanging scarf tail',
                            kind: 'ink',
                            d: 'M 252 248 C 270 250, 292 250, 310 248 C 312 256, 312 264, 308 268 C 290 272, 268 270, 254 266 Z M 298 268 C 306 274, 310 284, 308 294 C 302 296, 296 292, 294 282'
                        }
                    ]
                },
                {
                    stepNumber: 7,
                    chapter: 'ralsei',
                    title: 'Ralsei’s Robe, Sleeve & Fluffy Tail',
                    tip: 'Finish Ralsei with his curved sleeve and white paw, his robe reaching down to the deck, and his fluffy goat tail peeking out the back!',
                    camera: { x: 185, y: 195, w: 195, h: 165 },
                    strokes: [
                        {
                            id: 'ralsei-sleeve',
                            label: 'Curved sleeve & round white paw',
                            kind: 'ink',
                            d: 'M 256 266 C 250 280, 252 298, 260 304 L 282 298 C 288 298, 292 292, 288 286 C 284 282, 276 284, 272 286 C 270 278, 268 270, 266 268'
                        },
                        {
                            id: 'ralsei-robe',
                            label: 'Robe flaring down onto the boat deck',
                            kind: 'ink',
                            d: 'M 262 304 L 258 330 L 316 330 C 314 314, 308 298, 304 292'
                        },
                        {
                            id: 'ralsei-tail',
                            label: 'Fluffy white tail peeking out the back',
                            kind: 'ink',
                            d: 'M 254 282 C 242 280, 234 286, 236 296 C 238 304, 248 308, 258 308'
                        }
                    ]
                },
                {
                    stepNumber: 8,
                    chapter: 'kris',
                    title: 'Kris’s Shaggy Hair & Profile Face',
                    tip: 'Now move to the center for Kris! Draw their messy bob hair with a spiky top tuft, straight bangs over the eyes, and nose and mouth.',
                    camera: { x: 315, y: 135, w: 195, h: 165 },
                    strokes: [
                        {
                            id: 'kris-hair-top',
                            label: 'Spiky hair tuft, crown & shaggy back hair',
                            kind: 'ink',
                            d: 'M 380 174 L 384 162 L 394 172 C 418 172, 440 184, 446 210 M 380 174 C 362 182, 354 202, 354 228 C 354 242, 358 252, 366 258'
                        },
                        {
                            id: 'kris-bangs',
                            label: 'Straight bangs, sideburn & ear',
                            kind: 'ink',
                            d: 'M 446 210 L 396 210 L 396 238 L 388 236 C 382 234, 380 222, 388 218'
                        },
                        {
                            id: 'kris-face',
                            label: 'Pointed nose, jawline & calm mouth',
                            kind: 'ink',
                            d: 'M 436 210 C 440 218, 444 222, 444 232 C 444 242, 434 248, 412 248 M 428 235 L 440 235'
                        }
                    ]
                },
                {
                    stepNumber: 9,
                    chapter: 'kris',
                    title: 'Kris’s Flowing Cape & Chest Armor',
                    tip: 'Draw Kris’s triangular shoulder cape swooping back toward Ralsei, then add their silver chest plate and armored arm at their side.',
                    camera: { x: 315, y: 205, w: 195, h: 160 },
                    strokes: [
                        {
                            id: 'kris-cape',
                            label: 'Triangular shoulder cape pointing left',
                            kind: 'ink',
                            d: 'M 402 248 C 414 248, 424 252, 426 260 C 414 276, 390 290, 362 296 C 370 278, 384 260, 402 248 Z'
                        },
                        {
                            id: 'kris-armor',
                            label: 'Curved chest armor & gauntlet arm',
                            kind: 'ink',
                            d: 'M 424 262 C 430 272, 430 290, 424 300 L 402 300 M 380 288 L 378 318 C 384 322, 394 322, 398 316 L 398 286'
                        }
                    ]
                },
                {
                    stepNumber: 10,
                    chapter: 'kris',
                    title: 'Kris’s Boots & River Ripples',
                    tip: 'Connect Kris’s boots down to the swan boat deck, then zoom out and draw the big oval water ripple under the boat!',
                    camera: { x: 100, y: 110, w: 600, h: 420 },
                    strokes: [
                        {
                            id: 'kris-boots',
                            label: 'Kris’s legs & boots standing on the deck',
                            kind: 'ink',
                            d: 'M 376 318 L 374 330 L 424 330 L 420 300 M 398 302 L 398 330'
                        },
                        {
                            id: 'acid-water-ring',
                            label: 'Oval water shadow ring under the boat',
                            kind: 'ink',
                            inkColor: '#15803d',
                            d: 'M 202 442 C 185 456, 220 482, 372 484 C 524 482, 558 456, 542 442'
                        },
                        {
                            id: 'acid-ripples',
                            label: 'Water ripples on the left and right',
                            kind: 'ink',
                            inkColor: '#15803d',
                            d: 'M 120 448 L 165 448 M 575 448 L 625 448'
                        }
                    ]
                },
                {
                    stepNumber: 11,
                    chapter: 'color',
                    title: 'Color Your Swan Boat Scene!',
                    tip: 'Erase your light pencil guides from Step 1, then color Kris, Ralsei, and the Swan Boat! Tap each color swatch below as you finish it.',
                    camera: { x: 0, y: 0, w: 800, h: 600 },
                    isColorStep: true,
                    strokes: []
                }
            ]
        },

        // --- TUTORIAL #2: RALSEI (PRINCE OF THE DARK) ---
        {
            id: 'ralsei-prince',
            title: 'Ralsei (Waving Hello)',
            series: 'Deltarune',
            subtitle: 'Fluffy Goat Prince • Standing Pose',
            characterTags: ['Ralsei'],
            difficulty: 'Easy • Character',
            badgeEmoji: '🧣',
            featured: false,
            viewBox: PAPER_VIEWBOX,
            chapters: [
                { id: 'guides', number: 1, title: '1. Proportion Guides', shortTitle: '1. Guides' },
                { id: 'head', number: 2, title: '2. Fluffy Head & Horns', shortTitle: '2. Head' },
                { id: 'face', number: 3, title: '3. Glasses & Scarf', shortTitle: '3. Glasses' },
                { id: 'robe', number: 4, title: '4. Robe & Waving Paws', shortTitle: '4. Robe' },
                { id: 'color', number: 5, title: '5. Coloring', shortTitle: '5. Coloring' }
            ],
            palette: [
                { id: 'ralsei-fur', name: 'Fluffy White', hex: '#ffffff', usage: 'Head, floppy ears, paws & feet' },
                { id: 'horn-pink', name: 'Horn & Blush Pink', hex: '#fda4af', usage: 'Curved goat horns & rosy cheeks' },
                { id: 'glasses-teal', name: 'Emerald Glasses', hex: '#10b981', usage: 'Round glasses frames' },
                { id: 'scarf-pink', name: 'Cozy Magenta Scarf', hex: '#ec4899', usage: 'Wrapped scarf & hanging fringe' },
                { id: 'robe-mint', name: 'Mint Cloak Green', hex: '#34d399', usage: 'Mage robe' },
                { id: 'sleeve-black', name: 'Shadow Black', hex: '#0f172a', usage: 'Sleeves & heart emblem on robe' }
            ],
            backgroundFills: [
                { id: 'bg-castle-glow', d: 'M 220 80 C 580 80, 620 520, 400 530 C 180 520, 220 80, 220 80 Z', fill: '#ecfdf5', opacity: 0.7 }
            ],
            fills: [
                {
                    id: 'fill-r-ears',
                    d: 'M 320 180 C 280 195, 265 255, 285 290 C 300 300, 320 285, 328 265 L 472 265 C 480 285, 500 300, 515 290 C 535 255, 520 195, 480 180 Z',
                    fill: '#ffffff'
                },
                {
                    id: 'fill-r-horns',
                    d: 'M 340 165 C 325 130, 335 105, 352 105 C 365 115, 370 140, 368 162 Z M 460 165 C 475 130, 465 105, 448 105 C 435 115, 430 140, 432 162 Z',
                    fill: '#fda4af'
                },
                {
                    id: 'fill-r-head',
                    d: 'M 330 165 C 365 150, 435 150, 470 165 C 495 195, 495 260, 465 285 C 430 300, 370 300, 335 285 C 305 260, 305 195, 330 165 Z',
                    fill: '#ffffff'
                },
                {
                    id: 'fill-r-robe',
                    d: 'M 335 320 L 295 475 L 505 475 L 465 320 Z',
                    fill: '#34d399'
                },
                {
                    id: 'fill-r-sleeves',
                    d: 'M 335 325 C 300 340, 285 375, 300 400 L 330 390 L 342 340 Z M 465 325 C 500 315, 525 285, 515 265 L 485 275 L 458 340 Z',
                    fill: '#0f172a'
                },
                {
                    id: 'fill-r-paws',
                    d: 'M 302 396 C 292 406, 312 422, 324 406 Z M 508 266 C 518 250, 492 242, 488 264 Z M 335 475 C 335 505, 380 505, 380 475 Z M 420 475 C 420 505, 465 505, 465 475 Z',
                    fill: '#ffffff'
                },
                {
                    id: 'fill-r-scarf',
                    d: 'M 320 282 C 365 298, 435 298, 480 282 C 488 302, 482 322, 468 326 C 425 336, 375 336, 332 326 C 318 322, 312 302, 320 282 Z M 425 324 L 442 405 L 472 398 L 462 322 Z',
                    fill: '#ec4899'
                },
                {
                    id: 'fill-r-heart',
                    d: 'M 395 380 C 395 370, 380 368, 380 378 C 380 390, 395 398, 395 404 C 395 398, 410 390, 410 378 C 410 368, 395 370, 395 380 Z',
                    fill: '#0f172a'
                }
            ],
            steps: [
                {
                    stepNumber: 1,
                    chapter: 'guides',
                    title: 'Head Circle & Robe Triangle Guides',
                    tip: 'Along the center line, lightly sketch a round circle for Ralsei’s head above the middle line and a triangle below for his robe.',
                    camera: { x: 0, y: 0, w: 800, h: 600 },
                    strokes: [
                        {
                            id: 'r-guide-head',
                            label: 'Light circle for Ralsei’s head',
                            kind: 'guide',
                            d: 'M 400 150 C 460 150, 490 190, 490 230 C 490 270, 460 295, 400 295 C 340 295, 310 270, 310 230 C 310 190, 340 150, 400 150'
                        },
                        {
                            id: 'r-guide-robe',
                            label: 'Triangle guide for his robe',
                            kind: 'guide',
                            d: 'M 335 295 L 295 475 L 505 475 L 465 295'
                        }
                    ]
                },
                {
                    stepNumber: 2,
                    chapter: 'head',
                    title: 'Fluffy Head, Crown Tuft & Horns',
                    tip: 'Draw a cute tuft of fur on top of Ralsei’s head, curve his two pink horns outward, and add his soft fluffy cheeks!',
                    camera: { x: 220, y: 80, w: 360, h: 250 },
                    strokes: [
                        {
                            id: 'r-crown-tuft',
                            label: 'Fluffy fur tuft on top of his head',
                            kind: 'ink',
                            d: 'M 368 162 L 392 148 L 400 158 L 412 148 L 432 162'
                        },
                        {
                            id: 'r-horns',
                            label: 'Left and right curved goat horns',
                            kind: 'ink',
                            d: 'M 340 165 C 325 130, 335 105, 352 105 C 365 115, 370 140, 368 162 M 460 165 C 475 130, 465 105, 448 105 C 435 115, 430 140, 432 162'
                        },
                        {
                            id: 'r-cheeks',
                            label: 'Fluffy cheeks & chin',
                            kind: 'ink',
                            d: 'M 326 185 C 306 215, 308 265, 338 284 C 375 298, 425 298, 462 284 C 492 265, 494 215, 474 185'
                        }
                    ]
                },
                {
                    stepNumber: 3,
                    chapter: 'head',
                    title: 'Floppy Goat Ears',
                    tip: 'Add Ralsei’s big soft floppy ears hanging down on both sides of his head with little fur notches at the tips.',
                    camera: { x: 220, y: 100, w: 360, h: 240 },
                    strokes: [
                        {
                            id: 'r-ear-left',
                            label: 'Left floppy goat ear',
                            kind: 'ink',
                            d: 'M 340 165 C 295 182, 268 235, 282 282 C 288 296, 308 296, 322 274'
                        },
                        {
                            id: 'r-ear-right',
                            label: 'Right floppy goat ear',
                            kind: 'ink',
                            d: 'M 460 165 C 505 182, 532 235, 518 282 C 512 296, 492 296, 478 274'
                        }
                    ]
                },
                {
                    stepNumber: 4,
                    chapter: 'face',
                    title: 'Big Round Glasses & Happy Smile',
                    tip: 'Draw two big circles connected by a bridge for Ralsei’s glasses, then add his happy eyes and sweet little goat smile!',
                    camera: { x: 250, y: 135, w: 300, h: 195 },
                    strokes: [
                        {
                            id: 'r-glasses',
                            label: 'Two big round glasses lenses & bridge',
                            kind: 'ink',
                            inkColor: '#10b981',
                            d: 'M 365 198 C 382 198, 392 210, 392 225 C 392 240, 382 252, 365 252 C 348 252, 338 240, 338 225 C 338 210, 348 198, 365 198 Z M 435 198 C 452 198, 462 210, 462 225 C 462 240, 452 252, 435 252 C 418 252, 408 240, 408 225 C 408 210, 418 198, 435 198 Z M 392 224 L 408 224'
                        },
                        {
                            id: 'r-eyes-smile',
                            label: 'Happy eyes & little W-shaped smile',
                            kind: 'ink',
                            d: 'M 356 225 C 360 215, 370 215, 374 225 M 426 225 C 430 215, 440 215, 444 225 M 388 264 C 394 272, 400 268, 400 262 C 400 268, 406 272, 412 264'
                        }
                    ]
                },
                {
                    stepNumber: 5,
                    chapter: 'face',
                    title: 'Cozy Wrapped Scarf',
                    tip: 'Wrap Ralsei’s thick scarf around his neck and let one end hang down over his shoulder.',
                    camera: { x: 250, y: 220, w: 300, h: 210 },
                    strokes: [
                        {
                            id: 'r-scarf-ring',
                            label: 'Thick scarf collar around his neck',
                            kind: 'ink',
                            d: 'M 320 282 C 365 298, 435 298, 480 282 C 488 302, 482 322, 468 326 C 425 336, 375 336, 332 326 C 318 322, 312 302, 320 282 Z'
                        },
                        {
                            id: 'r-scarf-tail',
                            label: 'Hanging scarf tail on the right',
                            kind: 'ink',
                            d: 'M 428 332 L 442 405 L 472 398 L 462 328'
                        }
                    ]
                },
                {
                    stepNumber: 6,
                    chapter: 'robe',
                    title: 'Robe, Heart Emblem & Waving Paws',
                    tip: 'Draw Ralsei’s robe with a wavy hem, a dark heart in the middle, one arm resting down, and the other arm waving hello!',
                    camera: { x: 200, y: 230, w: 400, h: 310 },
                    strokes: [
                        {
                            id: 'r-robe-body',
                            label: 'Flared robe & heart emblem on the front',
                            kind: 'ink',
                            d: 'M 335 326 L 295 475 C 345 485, 455 485, 505 475 L 465 326 M 395 380 C 395 370, 380 368, 380 378 C 380 390, 395 398, 395 404 C 395 398, 410 390, 410 378 C 410 368, 395 370, 395 380 Z'
                        },
                        {
                            id: 'r-arms-paws',
                            label: 'Left sleeve, waving right sleeve & paws',
                            kind: 'ink',
                            d: 'M 332 326 C 300 342, 286 375, 300 400 L 328 390 M 302 398 C 296 412, 316 420, 324 402 M 468 326 C 500 315, 522 288, 514 266 L 486 276 M 510 266 C 516 250, 492 244, 488 266'
                        },
                        {
                            id: 'r-feet',
                            label: 'Two fluffy white feet under his robe',
                            kind: 'ink',
                            d: 'M 335 478 C 335 505, 380 505, 380 478 M 420 478 C 420 505, 465 505, 465 478'
                        }
                    ]
                },
                {
                    stepNumber: 7,
                    chapter: 'color',
                    title: 'Color Your Ralsei!',
                    tip: 'Erase your light pencil guides and color Ralsei with emerald glasses, a magenta scarf, pink horns, and a mint-green robe!',
                    camera: { x: 0, y: 0, w: 800, h: 600 },
                    isColorStep: true,
                    strokes: []
                }
            ]
        },

        // --- TUTORIAL #3: LANCER (THE SPADE BOY!) ---
        {
            id: 'lancer-spade',
            title: 'Lancer (The Spade Boy!)',
            series: 'Deltarune',
            subtitle: 'Big Grin & Silly Tongue Pose',
            characterTags: ['Lancer'],
            difficulty: 'Easy • Character',
            badgeEmoji: '♠️',
            featured: false,
            viewBox: PAPER_VIEWBOX,
            chapters: [
                { id: 'guides', number: 1, title: '1. Proportion Guides', shortTitle: '1. Guides' },
                { id: 'hood', number: 2, title: '2. Spade Hood & Head', shortTitle: '2. Hood' },
                { id: 'face', number: 3, title: '3. Visor & Silly Tongue', shortTitle: '3. Face' },
                { id: 'body', number: 4, title: '4. Belly, Spade & Boots', shortTitle: '4. Body' },
                { id: 'color', number: 5, title: '5. Coloring', shortTitle: '5. Coloring' }
            ],
            palette: [
                { id: 'lancer-white', name: 'Spade Card White', hex: '#ffffff', usage: 'Head, round belly & big grin teeth' },
                { id: 'lancer-blue', name: 'Royal Spade Blue', hex: '#2563eb', usage: 'Hood trim, belly spade, mittens & boots' },
                { id: 'lancer-navy', name: 'Visor Shadow Black', hex: '#0f172a', usage: 'Spade visor shadow, bodysuit & mouth interior' },
                { id: 'tongue-pink', name: 'Silly Tongue Pink', hex: '#f43f5e', usage: 'Lancer’s sticking-out tongue!' }
            ],
            backgroundFills: [
                { id: 'bg-card-castle', d: 'M 230 75 C 570 75, 610 520, 400 535 C 190 520, 230 75, 230 75 Z', fill: '#eff6ff', opacity: 0.75 }
            ],
            fills: [
                {
                    id: 'fill-l-body-dark',
                    d: 'M 315 290 C 280 340, 285 435, 330 465 L 470 465 C 515 435, 520 340, 485 290 Z',
                    fill: '#0f172a'
                },
                {
                    id: 'fill-l-belly-white',
                    d: 'M 332 302 C 302 342, 305 428, 345 452 C 380 465, 420 465, 455 452 C 495 428, 498 342, 468 302 Z',
                    fill: '#ffffff'
                },
                {
                    id: 'fill-l-belly-spade',
                    d: 'M 400 342 C 378 368, 366 384, 376 398 C 384 406, 394 402, 396 396 L 388 418 L 412 418 L 404 396 C 406 402, 416 406, 424 398 C 434 384, 422 368, 400 342 Z',
                    fill: '#2563eb'
                },
                {
                    id: 'fill-l-head-white',
                    d: 'M 400 96 C 345 145, 305 198, 318 252 C 330 288, 365 300, 400 300 C 435 300, 470 288, 482 252 C 495 198, 455 145, 400 96 Z',
                    fill: '#ffffff'
                },
                {
                    id: 'fill-l-hood-blue',
                    d: 'M 400 96 C 345 145, 305 198, 318 252 C 325 225, 355 170, 400 132 C 445 170, 475 225, 482 252 C 495 198, 455 145, 400 96 Z',
                    fill: '#2563eb'
                },
                {
                    id: 'fill-l-visor',
                    d: 'M 400 148 C 370 175, 352 198, 364 216 C 374 226, 390 220, 400 208 C 410 220, 426 226, 436 216 C 448 198, 430 175, 400 148 Z',
                    fill: '#0f172a'
                },
                {
                    id: 'fill-l-tongue',
                    d: 'M 384 256 C 384 292, 418 292, 418 256 Z',
                    fill: '#f43f5e'
                },
                {
                    id: 'fill-l-boots-mittens',
                    d: 'M 255 348 C 240 356, 245 382, 272 376 Z M 545 348 C 560 356, 555 382, 528 376 Z M 315 462 L 295 502 L 372 502 L 368 462 Z M 485 462 L 505 502 L 428 502 L 432 462 Z',
                    fill: '#2563eb'
                }
            ],
            steps: [
                {
                    stepNumber: 1,
                    chapter: 'guides',
                    title: 'Teardrop Head & Bouncy Belly Guides',
                    tip: 'Down the center line, lightly sketch an upside-down teardrop shape for Lancer’s head and a big round circle below for his belly!',
                    camera: { x: 0, y: 0, w: 800, h: 600 },
                    strokes: [
                        {
                            id: 'l-guide-head',
                            label: 'Pointed teardrop shape for Lancer’s head',
                            kind: 'guide',
                            d: 'M 400 96 C 340 150, 310 205, 320 255 C 335 295, 465 295, 480 255 C 490 205, 460 150, 400 96'
                        },
                        {
                            id: 'l-guide-belly',
                            label: 'Big round circle for his belly',
                            kind: 'guide',
                            d: 'M 400 295 C 475 295, 505 345, 500 395 C 495 445, 460 470, 400 470 C 340 470, 305 445, 300 395 C 295 345, 325 295, 400 295'
                        }
                    ]
                },
                {
                    stepNumber: 2,
                    chapter: 'hood',
                    title: 'Pointed Spade Hood & Chubby Cheeks',
                    tip: 'Start at the sharp point at the top of Lancer’s head and sweep down both sides into his big round cheeks and chin!',
                    camera: { x: 240, y: 75, w: 320, h: 255 },
                    strokes: [
                        {
                            id: 'l-head-outline',
                            label: 'Pointed spade top & wide chubby cheeks',
                            kind: 'ink',
                            d: 'M 400 96 C 345 145, 305 198, 318 252 C 330 288, 365 300, 400 300 C 435 300, 470 288, 482 252 C 495 198, 455 145, 400 96 Z'
                        },
                        {
                            id: 'l-hood-trim',
                            label: 'Inner hood curve framing his face',
                            kind: 'ink',
                            d: 'M 318 252 C 325 225, 355 170, 400 132 C 445 170, 475 225, 482 252'
                        }
                    ]
                },
                {
                    stepNumber: 3,
                    chapter: 'face',
                    title: 'Spade Visor Shadow & Silly Tongue!',
                    tip: 'Draw the upside-down heart/spade shadow over Lancer’s eyes, then add his wide grin and big sticking-out tongue!',
                    camera: { x: 260, y: 120, w: 280, h: 210 },
                    strokes: [
                        {
                            id: 'l-visor',
                            label: 'Spade shadow visor over upper face',
                            kind: 'ink',
                            fillInk: true,
                            d: 'M 400 148 C 370 175, 352 198, 364 216 C 374 226, 390 220, 400 208 C 410 220, 426 226, 436 216 C 448 198, 430 175, 400 148 Z'
                        },
                        {
                            id: 'l-mouth-tongue',
                            label: 'Wide grin & big U-shaped tongue',
                            kind: 'ink',
                            d: 'M 358 246 C 382 260, 418 260, 442 246 M 384 256 C 384 292, 418 292, 418 256 M 401 256 L 401 276'
                        }
                    ]
                },
                {
                    stepNumber: 4,
                    chapter: 'body',
                    title: 'Round Belly, Spade Emblem & Boots',
                    tip: 'Draw Lancer’s round belly with a spade symbol right in the center, then add his posed arms and sturdy boots!',
                    camera: { x: 200, y: 260, w: 400, h: 270 },
                    strokes: [
                        {
                            id: 'l-belly',
                            label: 'Round bouncy body & white belly patch',
                            kind: 'ink',
                            d: 'M 318 290 C 282 340, 285 435, 330 465 L 470 465 C 515 435, 518 340, 482 290 M 334 300 C 306 342, 308 428, 348 454 M 466 300 C 494 342, 492 428, 452 454'
                        },
                        {
                            id: 'l-spade-emblem',
                            label: 'Spade symbol in the center of his belly',
                            kind: 'ink',
                            d: 'M 400 342 C 378 368, 366 384, 376 398 C 384 406, 394 402, 396 396 L 388 418 L 412 418 L 404 396 C 406 402, 416 406, 424 398 C 434 384, 422 368, 400 342 Z'
                        },
                        {
                            id: 'l-arms-boots',
                            label: 'Outstretched arms, mittens & boots',
                            kind: 'ink',
                            d: 'M 304 316 L 252 350 C 240 360, 248 382, 270 376 L 296 362 M 496 316 L 548 350 C 560 360, 552 382, 530 376 L 504 362 M 320 465 L 296 502 L 372 502 L 368 465 M 480 465 L 504 502 L 428 502 L 432 465'
                        }
                    ]
                },
                {
                    stepNumber: 5,
                    chapter: 'color',
                    title: 'Color Your Lancer!',
                    tip: 'Erase your pencil guides and color Lancer with royal blue, dark shadow black, and bright pink for his tongue!',
                    camera: { x: 0, y: 0, w: 800, h: 600 },
                    isColorStep: true,
                    strokes: []
                }
            ]
        },

        // --- TUTORIAL #4: CLASSIC PIKACHU ---
        {
            id: 'pikachu-classic',
            title: 'Classic Pikachu',
            series: 'Pokémon',
            subtitle: 'Happy Waving & Lightning Tail Pose',
            characterTags: ['Pikachu'],
            difficulty: 'Easy • Character',
            badgeEmoji: '⚡',
            featured: false,
            referenceImage: 'assets/pikachu-classic.jpg',
            viewBox: PAPER_VIEWBOX,
            chapters: [
                { id: 'guides', number: 1, title: '1. Proportion Guides', shortTitle: '1. Guides' },
                { id: 'head', number: 2, title: '2. Head & Pointed Ears', shortTitle: '2. Head & Ears' },
                { id: 'face', number: 3, title: '3. Face & Red Cheeks', shortTitle: '3. Face' },
                { id: 'body', number: 4, title: '4. Body & Lightning Tail', shortTitle: '4. Body & Tail' },
                { id: 'color', number: 5, title: '5. Coloring', shortTitle: '5. Coloring' }
            ],
            palette: [
                { id: 'pika-yellow', name: 'Electric Pikachu Yellow', hex: '#facc15', usage: 'Head, ears, pear body, arms & lightning tail' },
                { id: 'pika-gold', name: 'Warm Golden Shading', hex: '#eab308', usage: 'Chin shadow, belly & inner tail lightning' },
                { id: 'pika-red', name: 'Electric Cheek Red', hex: '#ef4444', usage: 'Both round electric cheek pouches!' },
                { id: 'pika-black', name: 'Ear Tip & Eye Black', hex: '#18181b', usage: 'Pointed ear tips & big round eyes' },
                { id: 'pika-brown', name: 'Tail Base Chestnut Brown', hex: '#78350f', usage: 'Zigzag base of Pikachu’s lightning tail' },
                { id: 'pika-pink', name: 'Happy Tongue Pink', hex: '#f472b6', usage: 'Inside Pikachu’s cheerful open smile' }
            ],
            backgroundFills: [
                {
                    id: 'bg-pika-glow',
                    d: 'M 205 35 C 635 35, 675 545, 420 565 C 185 545, 205 35, 205 35 Z',
                    fill: '#fef9c3',
                    opacity: 0.65
                }
            ],
            fills: [
                {
                    id: 'fill-pika-tail-yellow',
                    d: 'M 475 246 L 653 157 L 644 271 L 535 307 L 566 365 L 514 396 L 536 434 L 489 463 L 484 438 L 503 412 L 482 384 L 518 355 L 480 292 Z',
                    fill: '#facc15'
                },
                {
                    id: 'fill-pika-tail-gold-shade',
                    d: 'M 535 307 L 644 271 L 646 250 L 504 286 L 542 356 L 496 384 L 514 396 L 566 365 Z',
                    fill: '#eab308'
                },
                {
                    id: 'fill-pika-tail-brown',
                    d: 'M 498 406 L 508 400 L 514 409 L 522 403 L 536 434 L 489 463 L 484 438 L 503 412 Z',
                    fill: '#78350f'
                },
                {
                    id: 'fill-pika-feet',
                    d: 'M 286 527 C 268 542, 256 560, 263 567 C 272 574, 306 558, 324 534 Z M 426 534 C 442 558, 468 574, 477 568 C 484 560, 476 542, 462 528 Z',
                    fill: '#facc15'
                },
                {
                    id: 'fill-pika-body-head',
                    d: 'M 281 200 C 260 155, 255 82, 282 18 C 285 13, 290 13, 293 18 C 318 72, 326 135, 314 179 C 342 161, 402 161, 432 180 C 482 142, 545 116, 600 123 C 605 124, 605 128, 601 132 C 562 178, 512 204, 459 210 C 472 232, 476 260, 477 285 C 484 304, 480 326, 466 342 L 462 345 C 468 386, 490 448, 490 488 C 490 508, 480 522, 462 528 L 442 532 C 405 520, 345 520, 308 532 L 286 527 C 270 522, 260 510, 260 492 C 260 462, 276 426, 276 402 C 246 392, 224 362, 212 332 C 206 325, 204 318, 210 315 C 207 309, 211 304, 218 305 C 219 299, 226 296, 232 299 C 238 294, 248 298, 260 306 C 257 294, 260 282, 264 275 C 266 250, 270 222, 281 200 Z',
                    fill: '#facc15'
                },
                {
                    id: 'fill-pika-belly-shade',
                    d: 'M 346 376 C 362 382, 378 382, 392 376 C 388 388, 352 388, 346 376 Z M 286 524 C 335 496, 415 496, 462 524 L 442 532 C 405 520, 345 520, 308 532 Z',
                    fill: '#eab308'
                },
                {
                    id: 'fill-pika-ear-tips',
                    d: 'M 263 98 C 266 64, 274 36, 282 18 C 285 13, 290 13, 293 18 C 299 30, 303 42, 306 52 C 292 66, 278 82, 263 98 Z M 552 125 C 570 122, 586 122, 600 123 C 605 124, 605 128, 601 132 C 586 149, 568 164, 546 175 C 552 158, 554 140, 552 125 Z',
                    fill: '#18181b'
                },
                {
                    id: 'fill-pika-cheeks',
                    d: 'M 264 288 C 276 280, 298 286, 303 304 C 307 320, 294 334, 276 332 C 262 328, 257 306, 264 288 Z M 476 293 C 464 285, 442 291, 435 308 C 431 324, 444 338, 462 336 C 474 332, 481 312, 476 293 Z',
                    fill: '#ef4444'
                },
                {
                    id: 'fill-pika-eyes',
                    d: 'M 311 238 C 322 238, 330 246, 330 257 C 330 268, 322 276, 311 276 C 300 276, 292 268, 292 257 C 292 246, 300 238, 311 238 Z M 430 241 C 441 241, 449 249, 449 260 C 449 271, 441 279, 430 279 C 419 279, 411 271, 411 260 C 411 249, 419 241, 430 241 Z',
                    fill: '#18181b'
                },
                {
                    id: 'fill-pika-eye-shines',
                    d: 'M 315 241 C 320 241, 323 244, 323 249 C 323 253, 320 256, 315 256 C 310 256, 307 253, 307 249 C 307 244, 310 241, 315 241 Z M 425 244 C 430 244, 433 247, 433 252 C 433 256, 430 259, 425 259 C 420 259, 417 256, 417 252 C 417 247, 420 244, 425 244 Z',
                    fill: '#ffffff'
                },
                {
                    id: 'fill-pika-mouth-inside',
                    d: 'M 348 302 C 356 305, 364 303, 369 296 C 374 303, 382 305, 392 302 C 388 326, 380 336, 369 336 C 358 336, 350 326, 348 302 Z',
                    fill: '#881337'
                },
                {
                    id: 'fill-pika-tongue',
                    d: 'M 352 319 C 362 312, 376 312, 388 319 C 384 331, 377 336, 369 336 C 361 336, 355 331, 352 319 Z',
                    fill: '#f472b6'
                }
            ],
            steps: [
                {
                    stepNumber: 1,
                    chapter: 'guides',
                    title: 'Head Oval, Pear Body & Tail Guides',
                    tip: 'Lightly sketch a soft head oval and overlapping pear body (no line across the neck!), plus ear and tail guides.',
                    camera: { x: 0, y: 0, w: 800, h: 600 },
                    strokes: [
                        {
                            id: 'p-guide-head',
                            label: 'Wide rounded oval for Pikachu’s head',
                            kind: 'guide',
                            d: 'M 370 165 C 442 165, 478 212, 478 275 C 478 335, 438 368, 370 368 C 302 368, 262 335, 262 275 C 262 212, 298 165, 370 165'
                        },
                        {
                            id: 'p-guide-body',
                            label: 'Overlapping pear shape for the body',
                            kind: 'guide',
                            d: 'M 276 345 C 262 415, 255 495, 286 527 C 335 536, 415 536, 462 528 C 495 495, 482 415, 462 345'
                        },
                        {
                            id: 'p-guide-ears-tail',
                            label: 'Guide lines for the ears and big tail',
                            kind: 'guide',
                            d: 'M 295 182 L 286 15 M 445 192 L 602 125 M 488 450 L 545 340 L 650 160'
                        }
                    ]
                },
                {
                    stepNumber: 2,
                    chapter: 'head',
                    title: 'Crown & Puffy Cheek Curves',
                    tip: 'Draw the top head curve between the ears, then curve both cheeks outward—leave the throat open so head and body flow together!',
                    camera: { x: 185, y: 110, w: 390, h: 290 },
                    strokes: [
                        {
                            id: 'p-head-crown',
                            label: 'Gentle crown arch between the ears',
                            kind: 'ink',
                            d: 'M 308 182 C 342 161, 402 161, 436 182'
                        },
                        {
                            id: 'p-cheek-left',
                            label: 'Left cheek bulge and short jaw tuck',
                            kind: 'ink',
                            d: 'M 281 200 C 270 222, 266 250, 264 275 C 256 294, 258 316, 272 332 C 284 346, 298 356, 312 365'
                        },
                        {
                            id: 'p-cheek-right',
                            label: 'Right cheek bulge and short jaw tuck',
                            kind: 'ink',
                            d: 'M 459 210 C 472 232, 476 260, 477 285 C 484 304, 480 326, 466 342 C 452 355, 438 363, 422 370'
                        }
                    ]
                },
                {
                    stepNumber: 3,
                    chapter: 'head',
                    title: 'Long Pointed Ears & Black Tips',
                    tip: 'Sweep the left ear straight up and tilt the right ear outward, then add curved lines and dark shading for both ear tips!',
                    camera: { x: 190, y: 5, w: 455, h: 330 },
                    strokes: [
                        {
                            id: 'p-ear-left',
                            label: 'Tall upright left ear',
                            kind: 'ink',
                            d: 'M 281 200 C 260 155, 255 82, 282 18 C 285 13, 290 13, 293 18 C 318 72, 326 135, 314 179'
                        },
                        {
                            id: 'p-ear-right',
                            label: 'Playful tilted right ear',
                            kind: 'ink',
                            d: 'M 432 180 C 482 142, 545 116, 600 123 C 605 124, 605 128, 601 132 C 562 178, 512 204, 459 210'
                        },
                        {
                            id: 'p-ear-tips',
                            label: 'Curved diagonal black ear tips',
                            kind: 'ink',
                            fillInk: true,
                            d: 'M 263 98 C 266 64, 274 36, 282 18 C 285 13, 290 13, 293 18 C 299 30, 303 42, 306 52 C 292 66, 278 82, 263 98 Z M 552 125 C 570 122, 586 122, 600 123 C 605 124, 605 128, 601 132 C 586 149, 568 164, 546 175 C 552 158, 554 140, 552 125 Z'
                        }
                    ]
                },
                {
                    stepNumber: 4,
                    chapter: 'face',
                    title: 'Shiny Eyes, W-Smile & Red Cheeks',
                    tip: 'Draw two wide-set eyes with shine circles, a tiny triangle nose, a happy W-mouth with a tongue, and low round cheek pouches!',
                    camera: { x: 225, y: 195, w: 295, h: 195 },
                    strokes: [
                        {
                            id: 'p-eyes',
                            label: 'Round eyes with large top shine ovals',
                            kind: 'ink',
                            d: 'M 311 238 C 322 238, 330 246, 330 257 C 330 268, 322 276, 311 276 C 300 276, 292 268, 292 257 C 292 246, 300 238, 311 238 Z M 315 241 C 320 241, 323 244, 323 249 C 323 253, 320 256, 315 256 C 310 256, 307 253, 307 249 C 307 244, 310 241, 315 241 Z M 430 241 C 441 241, 449 249, 449 260 C 449 271, 441 279, 430 279 C 419 279, 411 271, 411 260 C 411 249, 419 241, 430 241 Z M 425 244 C 430 244, 433 247, 433 252 C 433 256, 430 259, 425 259 C 420 259, 417 256, 417 252 C 417 247, 420 244, 425 244 Z'
                        },
                        {
                            id: 'p-nose-mouth',
                            label: 'Tiny nose, W-lip, open smile & tongue',
                            kind: 'ink',
                            d: 'M 363 277 L 375 277 L 369 283 Z M 338 298 C 350 305, 363 304, 369 296 C 375 304, 388 305, 400 298 M 348 302 C 350 326, 358 336, 369 336 C 380 336, 388 326, 392 302 M 352 319 C 362 312, 376 312, 388 319'
                        },
                        {
                            id: 'p-cheeks',
                            label: 'Round electric pouches low on the cheeks',
                            kind: 'ink',
                            d: 'M 264 288 C 276 280, 298 286, 303 304 C 307 320, 294 334, 276 332 M 476 293 C 464 285, 442 291, 435 308 C 431 324, 444 338, 462 336'
                        }
                    ]
                },
                {
                    stepNumber: 5,
                    chapter: 'body',
                    title: 'Waving Paws, Pear Body & Feet',
                    tip: 'Draw the left paw waving hello and right paw on the belly, then curve the pear-shaped hips down into two little feet!',
                    camera: { x: 180, y: 275, w: 360, h: 310 },
                    strokes: [
                        {
                            id: 'p-arms',
                            label: 'Waving left paw and resting right paw',
                            kind: 'ink',
                            d: 'M 260 306 C 248 298, 238 294, 232 299 C 226 296, 219 299, 218 305 C 211 304, 207 309, 210 315 C 204 318, 206 325, 212 332 C 224 362, 246 392, 278 408 M 418 386 C 402 406, 392 428, 389 450 C 383 452, 384 458, 390 460 C 388 465, 393 469, 399 467 C 401 472, 408 474, 414 468 C 436 454, 452 434, 462 412'
                        },
                        {
                            id: 'p-torso',
                            label: 'Chubby pear-shaped hips and lower belly',
                            kind: 'ink',
                            d: 'M 276 402 C 276 426, 260 462, 260 492 C 260 510, 270 522, 286 527 M 462 345 C 468 386, 490 448, 490 488 C 490 508, 480 522, 462 528 M 308 532 C 345 520, 405 520, 442 532'
                        },
                        {
                            id: 'p-feet',
                            label: 'Two narrow oval feet with little toes',
                            kind: 'ink',
                            d: 'M 286 527 C 268 542, 256 560, 263 567 C 272 574, 306 558, 324 534 M 266 559 L 280 549 M 273 564 L 288 554 M 426 534 C 442 558, 468 574, 477 568 C 484 560, 476 542, 462 528 M 474 560 L 460 550 M 467 565 L 452 555'
                        }
                    ]
                },
                {
                    stepNumber: 6,
                    chapter: 'body',
                    title: 'Flat-Topped Lightning Bolt Tail!',
                    tip: 'Draw sharp zigzag steps rising from Pikachu’s lower back out to a wide, flat-edged lightning bolt tip!',
                    camera: { x: 240, y: 135, w: 445, h: 365 },
                    strokes: [
                        {
                            id: 'p-tail-bolt',
                            label: 'Wide flat-topped lightning bolt tail',
                            kind: 'ink',
                            d: 'M 475 246 L 653 157 L 644 271 L 535 307 L 566 365 L 514 396 L 536 434 L 489 463 M 480 292 L 518 355 L 482 384 L 503 412 L 484 438'
                        },
                        {
                            id: 'p-tail-base',
                            label: 'Jagged brown stripe near the tail base',
                            kind: 'ink',
                            d: 'M 498 406 L 508 400 L 514 409 L 522 403'
                        }
                    ]
                },
                {
                    stepNumber: 7,
                    chapter: 'color',
                    title: 'Color Your Classic Pikachu!',
                    tip: 'Erase your pencil guides and color Pikachu bright electric yellow with red cheeks, black ear tips, and a brown tail base!',
                    camera: { x: 0, y: 0, w: 800, h: 600 },
                    isColorStep: true,
                    strokes: []
                }
            ]
        },

        // --- TUTORIAL #5: LEMMING (GRIZZY & THE LEMMINGS) ---
        {
            id: 'lemming-grizzy',
            title: 'Cheeky Blue Lemming',
            series: 'Grizzy & the Lemmings',
            subtitle: 'Big Buggy Eyes & Buck-Tooth Grin',
            characterTags: ['Lemming'],
            difficulty: 'Easy • Character',
            badgeEmoji: '🐹',
            featured: false,
            referenceImage: 'assets/lemming.jpg',
            viewBox: PAPER_VIEWBOX,
            chapters: [
                { id: 'guides', number: 1, title: '1. Proportion Guides', shortTitle: '1. Guides' },
                { id: 'head', number: 2, title: '2. Head, Ears & Eyes', shortTitle: '2. Head & Eyes' },
                { id: 'face', number: 3, title: '3. Nose & Buck-Tooth Grin', shortTitle: '3. Grin' },
                { id: 'body', number: 4, title: '4. Fluffy Body, Paws & Feet', shortTitle: '4. Body & Paws' },
                { id: 'color', number: 5, title: '5. Coloring', shortTitle: '5. Coloring' }
            ],
            palette: [
                { id: 'lem-blue', name: 'Lemming Sky Blue', hex: '#83a8dc', usage: 'Fluffy head, ears, pear body & arms' },
                { id: 'lem-belly', name: 'Ice-White Belly Fur', hex: '#dee7f4', usage: 'Fluffy round belly patch, eyes & buck teeth' },
                { id: 'lem-ear-dark', name: 'Deep Slate Blue', hex: '#3e5e8e', usage: 'Inside both little round ears' },
                { id: 'lem-mouth-dark', name: 'Charcoal Black', hex: '#1e1e1e', usage: 'Pupils, bean nose & open mouth interior' },
                { id: 'lem-paws-pink', name: 'Peach-Pink Paws', hex: '#e9af9c', usage: 'Both little hands and three-toed feet' },
                { id: 'lem-tongue-red', name: 'Berry Tongue Red', hex: '#b64034', usage: 'Happy tongue inside the open grin' }
            ],
            backgroundFills: [
                {
                    id: 'bg-lem-glow',
                    d: 'M 210 65 C 580 65, 605 505, 395 515 C 185 505, 210 65, 210 65 Z',
                    fill: '#eff6ff',
                    opacity: 0.72
                }
            ],
            fills: [
                {
                    id: 'fill-lem-paws-feet',
                    d: 'M 229 330 C 232 321, 246 322, 248 335 C 249 343, 243 346, 240 342 C 238 346, 233 346, 232 341 C 228 343, 227 337, 229 330 Z M 554 324 C 549 316, 537 318, 538 330 C 539 337, 544 339, 547 335 C 549 339, 553 339, 554 335 C 558 338, 559 332, 554 324 Z M 298 465 C 290 469, 284 473, 286 476 C 288 479, 318 478, 325 475 Z M 439 477 C 448 480, 484 480, 488 476 C 490 473, 480 467, 469 466 Z',
                    fill: '#e9af9c'
                },
                {
                    id: 'fill-lem-ears-outer',
                    d: 'M 324 117 C 321 98, 336 88, 352 91 C 361 93, 366 99, 368 104 Z M 441 107 C 449 98, 468 98, 476 110 C 481 118, 481 126, 479 133 Z',
                    fill: '#83a8dc'
                },
                {
                    id: 'fill-lem-ears-inner',
                    d: 'M 332 111 C 333 102, 343 99, 351 105 Z M 451 111 C 459 107, 471 111, 472 124 Z',
                    fill: '#3e5e8e'
                },
                {
                    id: 'fill-lem-body',
                    d: 'M 303 127 C 322 112, 348 103, 376 104 C 392 104, 404 100, 411 97 L 409 104 L 420 98 L 417 106 L 432 102 L 428 107 C 446 107, 462 115, 474 128 L 486 138 L 481 139 L 494 152 L 488 153 L 500 174 L 495 175 L 505 202 L 499 203 L 508 232 L 502 234 L 522 256 L 529 266 L 523 266 C 538 286, 548 306, 554 324 L 537 330 C 524 316, 512 302, 505 294 L 516 322 L 511 320 L 520 348 L 514 346 L 520 368 L 514 367 L 518 386 L 513 385 L 511 412 L 506 410 C 499 428, 495 438, 494 443 L 490 439 C 483 453, 476 462, 469 468 L 439 477 C 428 458, 414 449, 392 449 C 372 449, 348 456, 325 475 L 298 466 C 288 454, 279 436, 273 412 L 269 415 L 267 392 L 262 394 L 266 371 L 261 372 L 267 346 L 261 348 L 271 320 L 266 322 L 277 297 C 270 304, 258 320, 248 338 L 229 330 C 231 308, 242 286, 257 267 L 251 267 L 258 258 L 278 240 L 272 238 L 284 210 L 279 208 L 289 177 L 284 176 L 295 154 L 289 154 L 301 143 L 294 143 L 303 135 L 300 136 L 308 131 Z',
                    fill: '#83a8dc'
                },
                {
                    id: 'fill-lem-belly-patch',
                    d: 'M 395 328 L 404 333 L 412 329 L 420 336 L 432 334 L 436 344 L 448 348 L 446 358 L 458 368 L 452 376 L 463 392 L 456 398 L 461 412 L 452 418 L 454 430 L 442 435 L 438 445 L 422 448 L 406 452 L 385 450 L 366 452 L 352 444 L 340 436 L 336 424 L 329 412 L 334 402 L 327 386 L 336 378 L 332 362 L 344 356 L 348 342 L 364 338 L 376 330 L 388 334 Z',
                    fill: '#dee7f4'
                },
                {
                    id: 'fill-lem-eyes-white',
                    d: 'M 342 132 C 369 132, 385 148, 385 168 C 385 186, 369 197, 340 197 C 311 197, 294 184, 294 165 C 294 146, 314 132, 342 132 Z M 439 138 C 466 138, 483 155, 483 175 C 483 193, 466 204, 437 204 C 409 204, 392 191, 392 172 C 392 153, 412 138, 439 138 Z',
                    fill: '#ffffff'
                },
                {
                    id: 'fill-lem-pupils',
                    d: 'M 336 154 C 342 154, 347 159, 347 165 C 347 171, 342 176, 336 176 C 330 176, 325 171, 325 165 C 325 159, 330 154, 336 154 Z M 428 160 C 434 160, 439 165, 439 171 C 439 177, 434 182, 428 182 C 422 182, 417 177, 417 171 C 417 165, 422 160, 428 160 Z',
                    fill: '#18181b'
                },
                {
                    id: 'fill-lem-eye-shines',
                    d: 'M 332 159 C 334 159, 335 160, 335 162 C 335 164, 334 165, 332 165 C 330 165, 329 164, 329 162 C 329 160, 330 159, 332 159 Z M 424 165 C 426 165, 427 166, 427 168 C 427 170, 426 171, 424 171 C 422 171, 421 170, 421 168 C 421 166, 422 165, 424 165 Z',
                    fill: '#ffffff'
                },
                {
                    id: 'fill-lem-nose-mouth',
                    d: 'M 379 191 C 379 184, 391 182, 396 183 C 403 184, 410 188, 409 194 C 408 197, 402 197, 398 194 C 395 198, 391 198, 388 193 C 384 195, 379 194, 379 191 Z M 336 204 C 368 223, 418 225, 449 214 C 438 242, 412 251, 390 250 C 365 249, 344 235, 336 204 Z',
                    fill: '#1e1e1e'
                },
                {
                    id: 'fill-lem-tongue',
                    d: 'M 364 241 C 373 238, 382 240, 388 244 C 394 241, 403 242, 409 247 C 396 251, 376 250, 364 241 Z',
                    fill: '#b64034'
                },
                {
                    id: 'fill-lem-teeth',
                    d: 'M 375 216 C 386 219, 399 220, 411 219 C 410 232, 403 238, 392 238 C 381 238, 375 231, 375 216 Z',
                    fill: '#ffffff'
                }
            ],
            steps: [
                {
                    stepNumber: 1,
                    chapter: 'guides',
                    title: 'Potato Body, Eye & Belly Guides',
                    tip: 'Lightly sketch one big potato-shaped oval for the Lemming’s body, two big eye ovals near the top, and a circle on the belly!',
                    camera: { x: 0, y: 0, w: 800, h: 600 },
                    strokes: [
                        {
                            id: 'lem-guide-body',
                            label: 'Big pear-shaped potato oval for the body',
                            kind: 'guide',
                            d: 'M 390 102 C 460 102, 500 185, 514 335 C 522 420, 478 466, 390 462 C 302 466, 258 420, 266 335 C 280 185, 320 102, 390 102'
                        },
                        {
                            id: 'lem-guide-eyes',
                            label: 'Two huge side-by-side eye ovals',
                            kind: 'guide',
                            d: 'M 340 132 C 368 132, 385 147, 385 166 C 385 186, 368 198, 340 198 C 312 198, 294 186, 294 166 C 294 147, 312 132, 340 132 M 438 138 C 466 138, 483 153, 483 172 C 483 192, 466 204, 438 204 C 410 204, 392 192, 392 172 C 392 153, 410 138, 438 138'
                        },
                        {
                            id: 'lem-guide-belly',
                            label: 'Round circle for the light belly patch',
                            kind: 'guide',
                            d: 'M 395 328 C 435 328, 462 356, 462 392 C 462 428, 435 454, 395 454 C 355 454, 328 428, 328 392 C 328 356, 355 328, 395 328'
                        }
                    ]
                },
                {
                    stepNumber: 2,
                    chapter: 'head',
                    title: 'Fluffy Crown, Round Ears & Cheeks',
                    tip: 'Draw spiky fur tufts on top of the head, two tiny round ears peeking up, and jagged fur down both sides of the cheeks!',
                    camera: { x: 220, y: 65, w: 345, h: 215 },
                    strokes: [
                        {
                            id: 'lem-crown-fur',
                            label: 'Spiky fur tuft across the top of the head',
                            kind: 'ink',
                            d: 'M 300 136 L 308 131 L 303 127 C 322 112, 348 103, 376 104 C 392 104, 404 100, 411 97 L 409 104 L 420 98 L 417 106 L 432 102 L 428 107 C 446 107, 462 115, 474 128'
                        },
                        {
                            id: 'lem-ears',
                            label: 'Two small round ears with inner curves',
                            kind: 'ink',
                            d: 'M 324 117 C 321 98, 336 88, 352 91 C 361 93, 366 99, 368 104 M 332 111 C 333 102, 343 99, 351 105 M 339 107 C 342 104, 346 104, 349 106 M 441 107 C 449 98, 468 98, 476 110 C 481 118, 481 126, 479 133 M 451 111 C 459 107, 471 111, 472 124 M 456 113 C 462 112, 466 115, 468 120'
                        },
                        {
                            id: 'lem-upper-cheeks',
                            label: 'Fluffy jagged fur down both cheeks',
                            kind: 'ink',
                            d: 'M 303 135 L 294 143 L 301 143 L 289 154 L 295 154 L 284 176 L 289 177 L 279 208 L 284 210 L 272 238 L 278 240 L 258 258 M 474 128 L 486 138 L 481 139 L 494 152 L 488 153 L 500 174 L 495 175 L 505 202 L 499 203 L 508 232 L 502 234 L 522 256'
                        }
                    ]
                },
                {
                    stepNumber: 3,
                    chapter: 'head',
                    title: 'Giant Buggy Eyes & Pupils',
                    tip: 'Draw two huge round eyes with little cheek crinkles underneath, then add round pupils with tiny shine dots inside!',
                    camera: { x: 245, y: 105, w: 295, h: 170 },
                    strokes: [
                        {
                            id: 'lem-eye-outlines',
                            label: 'Two huge round eyes & cheek crinkle lines',
                            kind: 'ink',
                            d: 'M 342 132 C 369 132, 385 148, 385 168 C 385 186, 369 197, 340 197 C 311 197, 294 184, 294 165 C 294 146, 314 132, 342 132 Z M 439 138 C 466 138, 483 155, 483 175 C 483 193, 466 204, 437 204 C 409 204, 392 191, 392 172 C 392 153, 412 138, 439 138 Z M 294 191 C 308 190, 322 195, 332 203 M 446 208 C 458 202, 472 201, 486 205'
                        },
                        {
                            id: 'lem-pupils',
                            label: 'Dark pupils with tiny white shine dots',
                            kind: 'ink',
                            d: 'M 336 154 C 342 154, 347 159, 347 165 C 347 171, 342 176, 336 176 C 330 176, 325 171, 325 165 C 325 159, 330 154, 336 154 Z M 332 159 C 334 159, 335 160, 335 162 C 335 164, 334 165, 332 165 C 330 165, 329 164, 329 162 C 329 160, 330 159, 332 159 Z M 428 160 C 434 160, 439 165, 439 171 C 439 177, 434 182, 428 182 C 422 182, 417 177, 417 171 C 417 165, 422 160, 428 160 Z M 424 165 C 426 165, 427 166, 427 168 C 427 170, 426 171, 424 171 C 422 171, 421 170, 421 168 C 421 166, 422 165, 424 165 Z'
                        }
                    ]
                },
                {
                    stepNumber: 4,
                    chapter: 'face',
                    title: 'Bean Nose & Buck-Tooth Grin!',
                    tip: 'Add the little bean nose between the eyes, a wide open smile with dimples, and two big buck teeth right in the middle!',
                    camera: { x: 265, y: 155, w: 255, h: 155 },
                    strokes: [
                        {
                            id: 'lem-nose',
                            label: 'Little dark bean nose between the eyes',
                            kind: 'ink',
                            fillInk: true,
                            d: 'M 379 191 C 379 184, 391 182, 396 183 C 403 184, 410 188, 409 194 C 408 197, 402 197, 398 194 C 395 198, 391 198, 388 193 C 384 195, 379 194, 379 191 Z'
                        },
                        {
                            id: 'lem-mouth',
                            label: 'Wide goofy smile and corner dimples',
                            kind: 'ink',
                            d: 'M 329 213 C 332 206, 336 203, 340 202 M 446 211 C 450 213, 453 217, 455 222 M 336 204 C 368 223, 418 225, 449 214 C 438 242, 412 251, 390 250 C 365 249, 344 235, 336 204 Z'
                        },
                        {
                            id: 'lem-teeth-tongue',
                            label: 'Two big center buck teeth & curved tongue',
                            kind: 'ink',
                            d: 'M 375 216 C 375 231, 381 238, 392 238 C 403 238, 410 232, 411 219 M 393 215 L 392 238 M 364 241 C 373 238, 382 240, 388 244 C 394 241, 403 242, 409 247'
                        }
                    ]
                },
                {
                    stepNumber: 5,
                    chapter: 'body',
                    title: 'Outstretched Arms & Little Pink Hands',
                    tip: 'Draw both furry arms reaching out to the sides and add a cute little three-fingered paw at the end of each arm.',
                    camera: { x: 185, y: 210, w: 410, h: 205 },
                    strokes: [
                        {
                            id: 'lem-arm-left',
                            label: 'Fluffy left arm reaching out',
                            kind: 'ink',
                            d: 'M 258 258 L 251 267 L 257 267 C 242 286, 231 308, 229 330 M 248 338 C 258 320, 270 304, 277 297 C 279 292, 279 287, 279 285'
                        },
                        {
                            id: 'lem-arm-right',
                            label: 'Fluffy right arm reaching out',
                            kind: 'ink',
                            d: 'M 522 256 L 529 266 L 523 266 C 538 286, 548 306, 554 324 M 537 330 C 524 316, 512 302, 505 294 C 503 289, 502 284, 502 282'
                        },
                        {
                            id: 'lem-hands',
                            label: 'Little rounded paws with curled fingers',
                            kind: 'ink',
                            d: 'M 229 330 C 232 321, 246 322, 248 335 C 249 343, 243 346, 240 342 C 238 346, 233 346, 232 341 C 228 343, 227 337, 229 330 Z M 235 335 C 234 338, 234 341, 233 342 M 240 335 C 240 338, 240 341, 240 342 M 554 324 C 549 316, 537 318, 538 330 C 539 337, 544 339, 547 335 C 549 339, 553 339, 554 335 C 558 338, 559 332, 554 324 Z M 546 328 C 546 331, 547 334, 547 335 M 551 328 C 552 331, 553 334, 554 335'
                        }
                    ]
                },
                {
                    stepNumber: 6,
                    chapter: 'body',
                    title: 'Fluffy Pear Hips & Three-Toed Feet',
                    tip: 'Add spiky fur tufts down both round hips, curve the bottom arch between the legs, and draw two flat three-toed feet!',
                    camera: { x: 220, y: 270, w: 345, h: 235 },
                    strokes: [
                        {
                            id: 'lem-fluffy-sides',
                            label: 'Fluffy jagged fur down both round hips',
                            kind: 'ink',
                            d: 'M 277 297 L 266 322 L 271 320 L 261 348 L 267 346 L 261 372 L 266 371 L 262 394 L 267 392 L 269 415 L 273 412 C 279 436, 288 454, 298 466 M 505 294 L 516 322 L 511 320 L 520 348 L 514 346 L 520 368 L 514 367 L 518 386 L 513 385 L 511 412 L 506 410 C 499 428, 495 438, 494 443 L 490 439 C 483 453, 476 462, 469 468 M 298 466 L 325 475 C 348 456, 372 449, 392 449 C 414 449, 428 458, 439 477 L 469 468'
                        },
                        {
                            id: 'lem-feet',
                            label: 'Two wide three-toed feet at the bottom',
                            kind: 'ink',
                            d: 'M 298 465 C 290 469, 284 473, 286 476 C 288 479, 318 478, 325 475 M 292 477 C 294 471, 299 469, 303 469 M 301 477 C 303 472, 308 470, 312 471 M 439 477 C 448 480, 484 480, 488 476 C 490 473, 480 467, 469 466 M 479 478 C 476 472, 470 469, 464 469 M 469 479 C 466 473, 460 471, 454 472'
                        }
                    ]
                },
                {
                    stepNumber: 7,
                    chapter: 'color',
                    title: 'Color Your Cheeky Lemming!',
                    tip: 'Erase your pencil guides and color the Lemming sky blue with a fluffy ice-white belly circle, pink paws, and white buck teeth!',
                    camera: { x: 0, y: 0, w: 800, h: 600 },
                    isColorStep: true,
                    strokes: []
                }
            ]
        },

        // --- TUTORIAL #6: GRIZZY BEAR (GRIZZY & THE LEMMINGS) ---
        {
            id: 'grizzy-bear',
            title: 'Grizzy Bear',
            series: 'Grizzy & the Lemmings',
            subtitle: 'Grumpy Brows & Forest Ranger Medallion',
            characterTags: ['Grizzy'],
            difficulty: 'Medium • Character',
            badgeEmoji: '🐻',
            featured: false,
            referenceImage: 'assets/grizzy.jpg',
            viewBox: PAPER_VIEWBOX,
            chapters: [
                { id: 'guides', number: 1, title: '1. Proportion Guides', shortTitle: '1. Guides' },
                { id: 'head', number: 2, title: '2. Bear Head & Ears', shortTitle: '2. Head & Ears' },
                { id: 'face', number: 3, title: '3. Muzzle & Grumpy Eyes', shortTitle: '3. Face' },
                { id: 'body', number: 4, title: '4. Medallion, Arms & Belly', shortTitle: '4. Body & Badge' },
                { id: 'color', number: 5, title: '5. Coloring', shortTitle: '5. Coloring' }
            ],
            palette: [
                { id: 'griz-rust', name: 'Grizzly Cinnamon Brown', hex: '#ea580c', usage: 'Head, ears, broad furry shoulders & arms' },
                { id: 'griz-tan', name: 'Warm Honey Tan', hex: '#fbb040', usage: 'Pear-shaped muzzle & big round belly patch' },
                { id: 'griz-nose-black', name: 'Bear Nose Charcoal', hex: '#231f20', usage: 'Big round bear nose, pupils & necklace cord' },
                { id: 'griz-badge-light', name: 'Ranger Shield Lime', hex: '#76b852', usage: 'Inner face of the Forest Ranger shield' },
                { id: 'griz-badge-dark', name: 'Pine Tree Forest Green', hex: '#2d6a3e', usage: 'Pine tree emblem & outer shield rim' }
            ],
            backgroundFills: [
                {
                    id: 'bg-griz-glow',
                    d: 'M 190 55 C 610 55, 640 520, 405 525 C 170 520, 190 55, 190 55 Z',
                    fill: '#ffedd5',
                    opacity: 0.65
                }
            ],
            fills: [
                {
                    id: 'fill-griz-coat',
                    d: 'M 332 107 C 322 98, 325 80, 339 79 C 348 79, 353 86, 353 94 C 370 86, 388 86, 404 91 C 408 80, 422 74, 429 82 C 435 89, 431 98, 424 101 C 438 106, 449 114, 454 120 L 449 119 C 458 130, 464 142, 467 151 L 461 150 C 466 159, 469 169, 470 176 L 467 175 C 474 198, 481 218, 489 236 L 493 241 C 526 258, 558 276, 571 286 L 564 285 L 581 297 L 575 297 L 589 309 L 583 309 L 598 327 L 592 326 L 605 360 L 605 518 L 202 518 C 211 464, 221 416, 232 372 L 226 376 L 233 360 L 226 362 L 239 339 L 233 340 L 246 323 L 240 325 C 254 308, 278 286, 305 266 L 310 260 C 312 246, 312 226, 310 206 L 302 197 L 297 199 L 298 186 L 293 188 L 296 176 L 291 178 C 290 173, 292 164, 298 154 L 292 155 C 294 149, 299 138, 309 127 L 303 128 C 308 122, 318 114, 332 107 Z',
                    fill: '#ea580c'
                },
                {
                    id: 'fill-griz-belly-tan',
                    d: 'M 303 518 C 316 492, 334 474, 353 462 L 348 470 C 378 452, 418 448, 456 460 C 476 467, 492 477, 504 490 L 494 486 C 504 496, 512 507, 519 518 Z',
                    fill: '#fbb040'
                },
                {
                    id: 'fill-griz-muzzle-tan',
                    d: 'M 380 137 C 402 137, 420 162, 420 184 C 420 198, 403 204, 382 204 C 360 204, 344 198, 344 182 C 344 158, 358 137, 380 137 Z',
                    fill: '#fbb040'
                },
                {
                    id: 'fill-griz-eyes-white',
                    d: 'M 365 117 C 372 117, 377 122, 377 128 C 377 135, 372 140, 365 140 C 358 140, 354 135, 354 128 C 354 122, 358 117, 365 117 Z M 393 116 C 400 116, 404 121, 404 127 C 404 134, 400 139, 393 139 C 386 139, 381 134, 381 127 C 381 121, 386 116, 393 116 Z',
                    fill: '#ffffff'
                },
                {
                    id: 'fill-griz-nose-pupils',
                    d: 'M 365 126 C 367 126, 368 127, 368 129 C 368 131, 367 132, 365 132 C 363 132, 362 131, 362 129 C 362 127, 363 126, 365 126 Z M 392 125 C 394 125, 395 126, 395 128 C 395 130, 394 131, 392 131 C 390 131, 389 130, 389 128 C 389 126, 390 125, 392 125 Z M 380 142 C 393 142, 400 150, 399 160 C 398 170, 389 176, 380 176 C 370 176, 361 170, 360 160 C 359 150, 367 142, 380 142 Z',
                    fill: '#231f20'
                },
                {
                    id: 'fill-griz-shield-outer',
                    d: 'M 398 370 L 414 370 L 418 379 L 427 380 L 436 390 C 431 402, 432 414, 435 424 C 433 433, 422 438, 412 445 C 402 438, 389 434, 386 424 C 388 412, 388 402, 380 392 L 389 382 L 397 381 Z',
                    fill: '#2d6a3e'
                },
                {
                    id: 'fill-griz-shield-inner',
                    d: 'M 405 379 C 414 385, 422 387, 430 392 C 426 403, 427 414, 430 423 C 427 430, 419 434, 411 439 C 403 434, 394 430, 391 422 C 393 412, 393 402, 387 393 C 394 389, 400 385, 405 379 Z',
                    fill: '#76b852'
                },
                {
                    id: 'fill-griz-pine',
                    d: 'M 408 392 L 399 406 L 404 406 L 398 416 L 404 416 L 397 426 L 406 426 L 406 432 L 412 432 L 412 426 L 421 426 L 414 416 L 419 416 L 413 406 L 418 406 Z',
                    fill: '#2d6a3e'
                }
            ],
            steps: [
                {
                    stepNumber: 1,
                    chapter: 'guides',
                    title: 'Head Oval, Broad Shoulders & Badge Guides',
                    tip: 'Lightly sketch a round head oval at the top, huge sloping bear shoulders below, and a V-line for Grizzy’s necklace!',
                    camera: { x: 0, y: 0, w: 800, h: 600 },
                    strokes: [
                        {
                            id: 'griz-guide-head',
                            label: 'Round oval near the top for Grizzy’s head',
                            kind: 'guide',
                            d: 'M 384 86 C 436 86, 468 118, 468 162 C 468 205, 434 226, 384 226 C 334 226, 298 205, 298 162 C 298 118, 332 86, 384 86'
                        },
                        {
                            id: 'griz-guide-shoulders',
                            label: 'Wide sloping guide lines for his shoulders',
                            kind: 'guide',
                            d: 'M 311 226 L 308 262 L 232 340 L 202 518 L 604 518 L 598 345 L 492 238 L 465 186'
                        },
                        {
                            id: 'griz-guide-necklace-belly',
                            label: 'V-necklace guide and lower belly arch',
                            kind: 'guide',
                            d: 'M 307 262 L 407 368 L 490 236 M 407 368 L 408 442 M 303 518 C 336 462, 400 448, 446 456 C 482 464, 506 492, 519 518'
                        }
                    ]
                },
                {
                    stepNumber: 2,
                    chapter: 'head',
                    title: 'Round Bear Ears & Fluffy Cheeks',
                    tip: 'Draw two small round bear ears at the top, then sketch jagged fur tufts down both cheeks and the sides of his neck.',
                    camera: { x: 245, y: 55, w: 285, h: 215 },
                    strokes: [
                        {
                            id: 'griz-crown-ears',
                            label: 'Two small round bear ears & top head arch',
                            kind: 'ink',
                            d: 'M 332 107 C 322 98, 325 80, 339 79 C 348 79, 353 86, 353 94 M 336 102 C 333 93, 338 86, 345 92 C 341 94, 340 97, 341 101 M 353 94 C 370 86, 388 86, 404 91 M 404 91 C 408 80, 422 74, 429 82 C 435 89, 431 98, 424 101 M 412 95 C 416 86, 424 86, 423 94 C 419 93, 416 95, 415 98'
                        },
                        {
                            id: 'griz-cheek-left',
                            label: 'Fluffy left cheek tufts and neck side',
                            kind: 'ink',
                            d: 'M 332 107 C 318 114, 308 122, 303 128 L 309 127 C 299 138, 294 149, 292 155 L 298 154 C 292 164, 290 173, 291 178 L 296 176 L 293 188 L 298 186 L 297 199 L 302 197 C 308 206, 315 213, 321 217 L 320 209 C 329 219, 339 227, 349 232 M 310 206 C 312 226, 312 246, 310 260'
                        },
                        {
                            id: 'griz-cheek-right',
                            label: 'Fluffy right cheek tufts and neck side',
                            kind: 'ink',
                            d: 'M 424 101 C 438 106, 449 114, 454 120 L 449 119 C 458 130, 464 142, 467 151 L 461 150 C 466 159, 469 169, 470 176 L 465 174 C 464 188, 459 201, 452 211 L 453 203 C 447 212, 440 219, 434 224 M 467 175 C 474 198, 481 218, 489 236'
                        }
                    ]
                },
                {
                    stepNumber: 3,
                    chapter: 'face',
                    title: 'Furrowed Brows & Wide Eyes',
                    tip: 'Draw two close-set oval eyes with small pupils in the middle, and add furrowed eyebrows angled up in the center!',
                    camera: { x: 295, y: 85, w: 185, h: 140 },
                    strokes: [
                        {
                            id: 'griz-brows',
                            label: 'Furrowed eyebrows with center frown lines',
                            kind: 'ink',
                            d: 'M 349 118 L 378 114 L 378 109 M 382 108 L 382 113 L 402 116'
                        },
                        {
                            id: 'griz-eyes',
                            label: 'Two oval eyes with small dark pupils',
                            kind: 'ink',
                            d: 'M 365 117 C 372 117, 377 122, 377 128 C 377 135, 372 140, 365 140 C 358 140, 354 135, 354 128 C 354 122, 358 117, 365 117 Z M 365 126 C 367 126, 368 127, 368 129 C 368 131, 367 132, 365 132 C 363 132, 362 131, 362 129 C 362 127, 363 126, 365 126 Z M 393 116 C 400 116, 404 121, 404 127 C 404 134, 400 139, 393 139 C 386 139, 381 134, 381 127 C 381 121, 386 116, 393 116 Z M 392 125 C 394 125, 395 126, 395 128 C 395 130, 394 131, 392 131 C 390 131, 389 130, 389 128 C 389 126, 390 125, 392 125 Z'
                        }
                    ]
                },
                {
                    stepNumber: 4,
                    chapter: 'face',
                    title: 'Pear Muzzle, Big Nose & Grumpy Frown',
                    tip: 'Outline Grizzy’s pear-shaped muzzle right under his eyes, fill in his big dark bear nose, and curve his grumpy frown!',
                    camera: { x: 295, y: 115, w: 185, h: 140 },
                    strokes: [
                        {
                            id: 'griz-muzzle',
                            label: 'Pear-shaped muzzle under the eyes',
                            kind: 'ink',
                            d: 'M 380 137 C 402 137, 420 162, 420 184 C 420 198, 403 204, 382 204 C 360 204, 344 198, 344 182 C 344 158, 358 137, 380 137 Z'
                        },
                        {
                            id: 'griz-nose',
                            label: 'Big dark oval bear nose',
                            kind: 'ink',
                            fillInk: true,
                            d: 'M 380 142 C 393 142, 400 150, 399 160 C 398 170, 389 176, 380 176 C 370 176, 361 170, 360 160 C 359 150, 367 142, 380 142 Z'
                        },
                        {
                            id: 'griz-frown',
                            label: 'Short nose line and grumpy downturned mouth',
                            kind: 'ink',
                            d: 'M 380 176 L 381 185 M 360 191 C 374 185, 398 180, 411 188'
                        }
                    ]
                },
                {
                    stepNumber: 5,
                    chapter: 'body',
                    title: 'Ranger Shield Medallion & Pine Tree',
                    tip: 'Draw the V-shaped necklace strap around Grizzy’s neck, the double-bordered shield badge, and the pine tree inside!',
                    camera: { x: 270, y: 215, w: 265, h: 255 },
                    strokes: [
                        {
                            id: 'griz-cord',
                            label: 'V-shaped necklace cord and metal clasp',
                            kind: 'ink',
                            d: 'M 307 260 C 334 304, 368 338, 403 363 M 305 266 C 332 310, 366 344, 402 368 M 489 236 C 466 286, 438 328, 407 363 M 493 241 C 470 291, 442 333, 408 368 M 402 358 L 408 358 L 408 375 L 402 375 Z'
                        },
                        {
                            id: 'griz-shield',
                            label: 'Double-bordered Forest Ranger shield badge',
                            kind: 'ink',
                            d: 'M 398 370 L 414 370 L 418 379 L 427 380 L 436 390 C 431 402, 432 414, 435 424 C 433 433, 422 438, 412 445 C 402 438, 389 434, 386 424 C 388 412, 388 402, 380 392 L 389 382 L 397 381 Z M 405 379 C 414 385, 422 387, 430 392 C 426 403, 427 414, 430 423 C 427 430, 419 434, 411 439 C 403 434, 394 430, 391 422 C 393 412, 393 402, 387 393 C 394 389, 400 385, 405 379 Z'
                        },
                        {
                            id: 'griz-pine-tree',
                            label: 'Three-pointed pine tree inside the shield',
                            kind: 'ink',
                            d: 'M 408 392 L 399 406 L 404 406 L 398 416 L 404 416 L 397 426 L 406 426 L 406 432 L 412 432 L 412 426 L 421 426 L 414 416 L 419 416 L 413 406 L 418 406 Z'
                        }
                    ]
                },
                {
                    stepNumber: 6,
                    chapter: 'body',
                    title: 'Broad Furry Shoulders, Arms & Belly',
                    tip: 'Sweep Grizzy’s massive furry shoulders and arms down both sides, then add the big round belly arch at the bottom!',
                    camera: { x: 175, y: 225, w: 455, h: 315 },
                    strokes: [
                        {
                            id: 'griz-left-shoulder-arm',
                            label: 'Broad furry left shoulder and inner arm',
                            kind: 'ink',
                            d: 'M 305 266 C 278 286, 254 308, 240 325 L 246 323 L 233 340 L 239 339 L 226 362 L 233 360 L 226 376 L 232 372 C 221 416, 211 464, 202 518 M 300 368 C 292 382, 289 392, 288 397 L 294 394 L 289 414 L 294 411 C 289 432, 285 446, 282 454 L 288 451 L 281 472 L 287 470 L 280 486 L 286 485 C 280 498, 275 509, 272 518'
                        },
                        {
                            id: 'griz-right-shoulder-arm',
                            label: 'Broad furry right shoulder and inner arm',
                            kind: 'ink',
                            d: 'M 493 241 C 526 258, 558 276, 571 286 L 564 285 L 581 297 L 575 297 L 589 309 L 583 309 L 598 327 L 592 326 L 605 360 M 510 352 C 522 365, 530 378, 534 385 L 528 383 L 543 414 L 538 412 L 546 441 L 541 439 L 556 474 L 551 472 L 565 500 L 560 499 L 570 518'
                        },
                        {
                            id: 'griz-belly-arch',
                            label: 'Curved furry belly arch at the bottom',
                            kind: 'ink',
                            d: 'M 303 518 C 316 492, 334 474, 353 462 L 348 470 C 378 452, 418 448, 456 460 C 476 467, 492 477, 504 490 L 494 486 C 504 496, 512 507, 519 518'
                        }
                    ]
                },
                {
                    stepNumber: 7,
                    chapter: 'color',
                    title: 'Color Your Grizzy Bear!',
                    tip: 'Erase your pencil guides and color Grizzy cinnamon brown with a warm tan muzzle and belly, plus his green Ranger shield!',
                    camera: { x: 0, y: 0, w: 800, h: 600 },
                    isColorStep: true,
                    strokes: []
                }
            ]
        }
    ];

    const MAX_TIP_LENGTH = 140;
    const MAX_STROKE_LABEL_LENGTH = 46;

    /**
     * Validates a single tutorial object against the Paper Companion schema.
     * Used by unit tests and by future AI agents adding new tutorials.
     */
    function validateTutorial(tutorial) {
        const errors = [];
        if (!tutorial || typeof tutorial !== 'object') {
            return { valid: false, errors: ['Tutorial must be an object'] };
        }
        const requiredStrings = ['id', 'title', 'subtitle', 'difficulty', 'badgeEmoji'];
        for (const field of requiredStrings) {
            if (typeof tutorial[field] !== 'string' || tutorial[field].trim() === '') {
                errors.push(`Missing or empty string field: ${field}`);
            }
        }
        if (!tutorial.viewBox || tutorial.viewBox.w !== 800 || tutorial.viewBox.h !== 600) {
            errors.push('tutorial.viewBox must be { x: 0, y: 0, w: 800, h: 600 }');
        }
        if (!Array.isArray(tutorial.chapters) || tutorial.chapters.length < 3) {
            errors.push('tutorial.chapters must be a non-empty array of at least 3 chapters');
        }
        const chapterIds = new Set((tutorial.chapters || []).map((c) => c.id));
        if (!Array.isArray(tutorial.palette) || tutorial.palette.length === 0) {
            errors.push('tutorial.palette must contain at least 1 color swatch');
        } else {
            for (const swatch of tutorial.palette) {
                if (!swatch.id || !swatch.name || !/^#[0-9a-fA-F]{6}$/.test(swatch.hex)) {
                    errors.push(`Invalid palette swatch in ${tutorial.id}: ${JSON.stringify(swatch)}`);
                }
            }
        }
        if (!Array.isArray(tutorial.steps) || tutorial.steps.length < 4) {
            errors.push('tutorial.steps must contain at least 4 steps');
        } else {
            const strokeIds = new Set();
            tutorial.steps.forEach((step, idx) => {
                const expectedNum = idx + 1;
                if (step.stepNumber !== expectedNum) {
                    errors.push(`Step ${idx} has stepNumber=${step.stepNumber}, expected ${expectedNum}`);
                }
                if (!chapterIds.has(step.chapter)) {
                    errors.push(`Step ${expectedNum} references unknown chapter "${step.chapter}"`);
                }
                if (typeof step.title !== 'string' || !step.title.trim()) {
                    errors.push(`Step ${expectedNum} missing title`);
                }
                if (typeof step.tip !== 'string' || !step.tip.trim()) {
                    errors.push(`Step ${expectedNum} missing kid-friendly tip`);
                } else if (step.tip.length > MAX_TIP_LENGTH) {
                    errors.push(
                        `Step ${expectedNum} tip is ${step.tip.length} chars (max ${MAX_TIP_LENGTH} so it fits in 4 lines without scrolling)`
                    );
                }
                if (
                    !step.camera ||
                    typeof step.camera.x !== 'number' ||
                    typeof step.camera.y !== 'number' ||
                    typeof step.camera.w !== 'number' ||
                    typeof step.camera.h !== 'number' ||
                    step.camera.w <= 0 ||
                    step.camera.h <= 0
                ) {
                    errors.push(`Step ${expectedNum} has invalid camera box`);
                }
                if (!Array.isArray(step.strokes)) {
                    errors.push(`Step ${expectedNum} strokes must be an array`);
                } else if (!step.isColorStep && step.strokes.length === 0) {
                    errors.push(`Drawing step ${expectedNum} must have at least 1 stroke`);
                } else {
                    for (const stroke of step.strokes) {
                        if (!stroke.id || typeof stroke.id !== 'string') {
                            errors.push(`Step ${expectedNum} has a stroke without an id`);
                        } else if (strokeIds.has(stroke.id)) {
                            errors.push(`Duplicate stroke id "${stroke.id}" in ${tutorial.id}`);
                        } else {
                            strokeIds.add(stroke.id);
                        }
                        if (typeof stroke.label !== 'string' || !stroke.label.trim()) {
                            errors.push(`Stroke "${stroke.id}" missing label`);
                        } else if (stroke.label.length > MAX_STROKE_LABEL_LENGTH) {
                            errors.push(
                                `Stroke "${stroke.id}" label is ${stroke.label.length} chars (max ${MAX_STROKE_LABEL_LENGTH} for single-line fit)`
                            );
                        }
                        if (stroke.kind !== 'guide' && stroke.kind !== 'ink') {
                            errors.push(`Stroke "${stroke.id}" kind must be "guide" or "ink"`);
                        }
                        if (typeof stroke.d !== 'string' || !/^\s*M\s*-?\d/.test(stroke.d)) {
                            errors.push(`Stroke "${stroke.id}" has invalid SVG path d attribute`);
                        }
                    }
                }
            });

            // Ensure Step 1 has paper placement guides
            const firstStep = tutorial.steps[0];
            if (
                firstStep &&
                (!Array.isArray(firstStep.strokes) ||
                    !firstStep.strokes.some((s) => s.kind === 'guide'))
            ) {
                errors.push(`Step 1 in "${tutorial.id}" must include at least one kind="guide" proportion stroke`);
            }
            // Ensure final step is a coloring step
            const lastStep = tutorial.steps[tutorial.steps.length - 1];
            if (lastStep && !lastStep.isColorStep) {
                errors.push(`Final step in "${tutorial.id}" must have isColorStep: true`);
            }
        }
        return { valid: errors.length === 0, errors };
    }

    function validateAllTutorials(list = TUTORIALS) {
        const results = list.map((t) => ({ id: t && t.id, ...validateTutorial(t) }));
        const invalid = results.filter((r) => !r.valid);
        return {
            valid: invalid.length === 0,
            results
        };
    }

    function getTutorialById(id) {
        return TUTORIALS.find((t) => t.id === id) || TUTORIALS[0];
    }

    const api = {
        PAPER_VIEWBOX,
        MAX_TIP_LENGTH,
        MAX_STROKE_LABEL_LENGTH,
        TUTORIALS,
        getTutorialById,
        validateTutorial,
        validateAllTutorials
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
    root.SketchPupTutorials = api;
    root.DeltaruneDrawTutorials = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
