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
