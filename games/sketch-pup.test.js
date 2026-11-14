const test = require('node:test');
const assert = require('node:assert');
const {
    PAPER_VIEWBOX,
    MAX_TIP_LENGTH,
    MAX_STROKE_LABEL_LENGTH,
    TUTORIALS,
    getTutorialById,
    validateTutorial,
    validateAllTutorials
} = require('./sketch-pup-tutorials.js');

test('All Sketch Pup tutorials pass schema validation and concise 4-line text bounds', () => {
    assert.ok(TUTORIALS.length >= 3, 'Should include at least 3 starter tutorials');
    const summary = validateAllTutorials();
    for (const res of summary.results) {
        assert.strictEqual(
            res.valid,
            true,
            `Tutorial "${res.id}" failed validation: ${res.errors.join('; ')}`
        );
    }
    assert.strictEqual(summary.valid, true);

    for (const tut of TUTORIALS) {
        for (const step of tut.steps) {
            assert.ok(
                step.tip.length <= MAX_TIP_LENGTH,
                `${tut.id} step ${step.stepNumber} tip is ${step.tip.length} chars (max ${MAX_TIP_LENGTH})`
            );
            for (const stroke of step.strokes || []) {
                assert.ok(
                    stroke.label.length <= MAX_STROKE_LABEL_LENGTH,
                    `${tut.id} stroke ${stroke.id} label is ${stroke.label.length} chars (max ${MAX_STROKE_LABEL_LENGTH})`
                );
            }
        }
    }
});

test('Swan Boat (Kris & Ralsei) featured tutorial has 5 chapters and 11 guided steps', () => {
    const swan = getTutorialById('swan-boat');
    assert.strictEqual(swan.id, 'swan-boat');
    assert.strictEqual(swan.featured, true);
    assert.deepStrictEqual(swan.viewBox, PAPER_VIEWBOX);
    assert.strictEqual(swan.chapters.length, 5);
    assert.strictEqual(swan.steps.length, 11);

    // Step 1 is paper placement guides on full 800x600 page
    const step1 = swan.steps[0];
    assert.strictEqual(step1.chapter, 'guides');
    assert.strictEqual(step1.camera.w, 800);
    assert.strictEqual(step1.camera.h, 600);
    assert.ok(step1.strokes.every((s) => s.kind === 'guide'));

    // Middle chapters auto-zoom on details (Swan Boat, Ralsei, Kris)
    const ralseiSteps = swan.steps.filter((s) => s.chapter === 'ralsei');
    assert.strictEqual(ralseiSteps.length, 3);
    assert.ok(ralseiSteps.every((s) => s.camera.w < 800 && s.camera.h < 600));

    const krisSteps = swan.steps.filter((s) => s.chapter === 'kris');
    assert.strictEqual(krisSteps.length, 3);

    // Final step is the coloring checklist step
    const finalStep = swan.steps[swan.steps.length - 1];
    assert.strictEqual(finalStep.isColorStep, true);
    assert.ok(swan.palette.length >= 8);
    assert.ok(swan.fills.length >= 10);
});

test('Classic Pikachu tutorial has 5 chapters, 7 guided steps, and complete color fills', () => {
    const pika = getTutorialById('pikachu-classic');
    assert.strictEqual(pika.id, 'pikachu-classic');
    assert.strictEqual(pika.series, 'Pokémon');
    assert.strictEqual(pika.chapters.length, 5);
    assert.strictEqual(pika.steps.length, 7);
    assert.strictEqual(pika.steps[0].chapter, 'guides');
    assert.ok(pika.steps[0].strokes.every((s) => s.kind === 'guide'));
    assert.strictEqual(pika.steps[pika.steps.length - 1].isColorStep, true);
    assert.ok(pika.palette.length >= 5);
    assert.ok(pika.fills.length >= 6);
});

test('Cheeky Blue Lemming tutorial has 5 chapters, 7 guided steps, and reference image', () => {
    const lemming = getTutorialById('lemming-grizzy');
    assert.strictEqual(lemming.id, 'lemming-grizzy');
    assert.strictEqual(lemming.series, 'Grizzy & the Lemmings');
    assert.strictEqual(lemming.referenceImage, 'assets/lemming.jpg');
    assert.strictEqual(lemming.chapters.length, 5);
    assert.strictEqual(lemming.steps.length, 7);
    assert.strictEqual(lemming.steps[0].chapter, 'guides');
    assert.ok(lemming.steps[0].strokes.every((s) => s.kind === 'guide'));
    assert.strictEqual(lemming.steps[lemming.steps.length - 1].isColorStep, true);
    assert.ok(lemming.palette.length >= 5);
    assert.ok(lemming.fills.length >= 6);
});

test('Grizzy Bear tutorial has 5 chapters, 7 guided steps, and reference image', () => {
    const grizzy = getTutorialById('grizzy-bear');
    assert.strictEqual(grizzy.id, 'grizzy-bear');
    assert.strictEqual(grizzy.series, 'Grizzy & the Lemmings');
    assert.strictEqual(grizzy.referenceImage, 'assets/grizzy.jpg');
    assert.strictEqual(grizzy.chapters.length, 5);
    assert.strictEqual(grizzy.steps.length, 7);
    assert.strictEqual(grizzy.steps[0].chapter, 'guides');
    assert.ok(grizzy.steps[0].strokes.every((s) => s.kind === 'guide'));
    assert.strictEqual(grizzy.steps[grizzy.steps.length - 1].isColorStep, true);
    assert.ok(grizzy.palette.length >= 5);
    assert.ok(grizzy.fills.length >= 6);
});

test('validateTutorial catches missing Step 1 proportion guides or broken SVG paths', () => {
    const broken = {
        id: 'broken-test',
        title: 'Broken Tutorial',
        subtitle: 'Test',
        difficulty: 'Easy',
        badgeEmoji: '❓',
        viewBox: { x: 0, y: 0, w: 800, h: 600 },
        chapters: [
            { id: 'c1', number: 1, title: '1' },
            { id: 'c2', number: 2, title: '2' },
            { id: 'c3', number: 3, title: '3' }
        ],
        palette: [{ id: 'p1', name: 'White', hex: '#ffffff', usage: 'Test' }],
        steps: [
            {
                stepNumber: 1,
                chapter: 'c1',
                title: 'No guides in step 1',
                tip: 'Tip',
                camera: { x: 0, y: 0, w: 800, h: 600 },
                strokes: [{ id: 's1', label: 'Ink only', kind: 'ink', d: 'L 10 10' }]
            },
            {
                stepNumber: 2,
                chapter: 'c2',
                title: 'Step 2',
                tip: 'Tip',
                camera: { x: 0, y: 0, w: 800, h: 600 },
                strokes: [{ id: 's2', label: 'Line', kind: 'ink', d: 'M 10 10 L 20 20' }]
            },
            {
                stepNumber: 3,
                chapter: 'c2',
                title: 'Step 3',
                tip: 'Tip',
                camera: { x: 0, y: 0, w: 800, h: 600 },
                strokes: [{ id: 's3', label: 'Line', kind: 'ink', d: 'M 20 20 L 30 30' }]
            },
            {
                stepNumber: 4,
                chapter: 'c3',
                title: 'Step 4',
                tip: 'Tip',
                camera: { x: 0, y: 0, w: 800, h: 600 },
                isColorStep: false,
                strokes: [{ id: 's4', label: 'Line', kind: 'ink', d: 'M 30 30 L 40 40' }]
            }
        ]
    };

    const check = validateTutorial(broken);
    assert.strictEqual(check.valid, false);
    assert.ok(check.errors.some((e) => e.includes('invalid SVG path')));
    assert.ok(check.errors.some((e) => e.includes('proportion stroke')));
    assert.ok(check.errors.some((e) => e.includes('isColorStep: true')));
});
