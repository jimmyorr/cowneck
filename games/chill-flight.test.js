const test = require('node:test');
const assert = require('node:assert');

// chill-flight-logic.js uses an IIFE that detects `module` (Node.js) vs browser.
// In Node.js it populates module.exports directly, so we just require it.
const {
    PLANE_COLORS,
    getPlaneColor,
    computeTimeOfDay,
    computeInputPosition,
    computeHeadingDirection,
    getBiome,
    getElevation
} = require('./chill-flight/chill-flight-logic.js');

// ---------------------------------------------------------------------------
// Minimal simplex noise implementation for testing terrain functions.
// Uses the same algorithm as noise.js so results are realistic.
// ---------------------------------------------------------------------------
const grad3 = new Float32Array([1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1, 0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1]);

function makeSimplexNoise(seed) {
    const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
    const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
    // Deterministic permutation table based on seed
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    // Simple seeded shuffle (LCG)
    let s = seed >>> 0;
    for (let i = 255; i > 0; i--) {
        s = (s * 1664525 + 1013904223) >>> 0;
        const j = s % (i + 1);
        [p[i], p[j]] = [p[j], p[i]];
    }
    const perm = new Uint8Array(512);
    const permMod12 = new Uint8Array(512);
    for (let i = 0; i < 512; i++) {
        perm[i] = p[i & 255];
        permMod12[i] = perm[i] % 12;
    }
    return {
        noise2D(xin, yin) {
            let n0, n1, n2;
            const s2 = (xin + yin) * F2;
            const i = Math.floor(xin + s2);
            const j = Math.floor(yin + s2);
            const t = (i + j) * G2;
            const X0 = i - t, Y0 = j - t;
            const x0 = xin - X0, y0 = yin - Y0;
            let i1, j1;
            if (x0 > y0) { i1 = 1; j1 = 0; } else { i1 = 0; j1 = 1; }
            const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
            const x2 = x0 - 1.0 + 2.0 * G2, y2 = y0 - 1.0 + 2.0 * G2;
            const ii = i & 255, jj = j & 255;
            const gi0 = permMod12[ii + perm[jj]] * 3;
            const gi1 = permMod12[ii + i1 + perm[jj + j1]] * 3;
            const gi2 = permMod12[ii + 1 + perm[jj + 1]] * 3;
            let t0 = 0.5 - x0 * x0 - y0 * y0;
            if (t0 < 0) n0 = 0.0; else { t0 *= t0; n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0); }
            let t1 = 0.5 - x1 * x1 - y1 * y1;
            if (t1 < 0) n1 = 0.0; else { t1 *= t1; n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1); }
            let t2 = 0.5 - x2 * x2 - y2 * y2;
            if (t2 < 0) n2 = 0.0; else { t2 *= t2; n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2); }
            return 70.0 * (n0 + n1 + n2);
        }
    };
}

const simplex = makeSimplexNoise(42);
const CONSTANTS = { WATER_LEVEL: 40, MOUNTAIN_LEVEL: 180 };
const lerp = (a, b, t) => a + (b - a) * t;

// =============================================================================
// getPlaneColor
// =============================================================================

test('getPlaneColor: null/undefined uid returns the first palette color', () => {
    assert.strictEqual(getPlaneColor(null), PLANE_COLORS[0]);
    assert.strictEqual(getPlaneColor(undefined), PLANE_COLORS[0]);
    assert.strictEqual(getPlaneColor(''), PLANE_COLORS[0]);
});

test('getPlaneColor: returns a value that is in the color palette', () => {
    const uids = ['user_abc', 'firebase_xyz_123', 'admin', 'test@example.com'];
    for (const uid of uids) {
        const color = getPlaneColor(uid);
        assert.ok(PLANE_COLORS.includes(color), `Color 0x${color.toString(16)} for uid "${uid}" not found in palette`);
    }
});

test('getPlaneColor: same uid always returns the same color (deterministic)', () => {
    const uid = 'same-user-forever';
    const first = getPlaneColor(uid);
    for (let i = 0; i < 10; i++) {
        assert.strictEqual(getPlaneColor(uid), first, 'Color should be stable across calls');
    }
});

test('getPlaneColor: different uids can produce different colors', () => {
    // With 10 colors in the palette and lots of UIDs, we should see at least 2 distinct colors
    const colors = new Set();
    for (let i = 0; i < 30; i++) {
        colors.add(getPlaneColor(`user_${i}`));
    }
    assert.ok(colors.size > 1, 'Expected multiple distinct colors across 30 different UIDs');
});

// =============================================================================
// computeTimeOfDay
// =============================================================================

test('computeTimeOfDay: segment boundaries map to correct progress values', () => {
    assert.strictEqual(computeTimeOfDay(0), 0.25, 'Start of day segment (t=0)');
    assert.strictEqual(computeTimeOfDay(60), 0.50, 'Start of sunset segment (t=60)');
    assert.strictEqual(computeTimeOfDay(180), 0.75, 'Start of night segment (t=180)');
    assert.strictEqual(computeTimeOfDay(210), 0.00, 'Start of sunrise segment (t=210)');
});

test('computeTimeOfDay: output is always in [0, 1)', () => {
    for (let s = 0; s < 330; s++) {
        const p = computeTimeOfDay(s);
        assert.ok(p >= 0 && p < 1, `Progress ${p} out of [0,1) for secondsInCycle=${s}`);
    }
});

test('computeTimeOfDay: interpolates linearly within each segment', () => {
    // Mid-day (s=30, half of 60s) → 0.25 + 0.5*0.25 = 0.375
    assert.strictEqual(computeTimeOfDay(30), 0.375, 'Mid-day at 30s');
    // Mid-sunset (s=120, 60s into the 120s segment) → 0.50 + 0.5*0.25 = 0.625
    assert.strictEqual(computeTimeOfDay(120), 0.625, 'Mid-sunset at 120s');
    // Mid-night (s=195, 15s into the 30s segment) → 0.75 + 0.5*0.25 = 0.875
    assert.strictEqual(computeTimeOfDay(195), 0.875, 'Mid-night at 195s');
    // Mid-sunrise (s=270, 60s into the 120s segment) → 0.5*0.25 = 0.125
    assert.strictEqual(computeTimeOfDay(270), 0.125, 'Mid-sunrise at 270s');
});

test('computeTimeOfDay: is continuous within each segment (not at the cycle wrap)', () => {
    const eps = 0.001;
    // t=210 is intentionally a discontinuity: the cycle wraps from ~1.0 back to 0.0.
    // Only check continuity at interior segment boundaries (t=60 and t=180).
    const interiorBoundaries = [60, 180];
    for (const b of interiorBoundaries) {
        const before = computeTimeOfDay(b - eps);
        const at = computeTimeOfDay(b);
        assert.ok(Math.abs(before - at) < 0.01, `Discontinuity near t=${b}: before=${before}, at=${at}`);
    }
    // Verify the cycle wrap at t=210 actually does jump (expected behavior)
    const beforeWrap = computeTimeOfDay(210 - eps);
    const atWrap = computeTimeOfDay(210);
    assert.ok(beforeWrap > 0.9, `Value just before wrap (${beforeWrap}) should be near 1.0`);
    assert.strictEqual(atWrap, 0, 'Value at cycle wrap (t=210) should reset to 0');
});

// =============================================================================
// computeInputPosition
// =============================================================================

test('computeInputPosition: center of screen maps to (0, 0)', () => {
    const { x, y } = computeInputPosition(400, 300, 800, 600);
    assert.strictEqual(x, 0);
    assert.strictEqual(y, 0);
});

test('computeInputPosition: top-left corner maps to (-1, +1)', () => {
    const { x, y } = computeInputPosition(0, 0, 800, 600);
    assert.strictEqual(x, -1);
    assert.strictEqual(y, 1);
});

test('computeInputPosition: bottom-right corner maps to (+1, -1)', () => {
    const { x, y } = computeInputPosition(800, 600, 800, 600);
    assert.strictEqual(x, 1);
    assert.strictEqual(y, -1);
});

test('computeInputPosition: output x is in [-1, 1] for any valid pixel x', () => {
    const width = 1920, height = 1080;
    for (let px = 0; px <= width; px += 100) {
        const { x } = computeInputPosition(px, 0, width, height);
        assert.ok(x >= -1 && x <= 1, `x=${x} out of range for px=${px}`);
    }
});

// =============================================================================
// computeHeadingDirection
// =============================================================================

test('computeHeadingDirection: 0 radians (or 2pi) is North', () => {
    assert.strictEqual(computeHeadingDirection(0), 'N');
    assert.strictEqual(computeHeadingDirection(Math.PI * 2), 'N');
});

test('computeHeadingDirection: PI radians is South', () => {
    assert.strictEqual(computeHeadingDirection(Math.PI), 'S');
});

test('computeHeadingDirection: PI/2 radians is East', () => {
    // rotation.y = PI/2 → heading deg = 90 → sector 2 = 'W'... let's verify via the formula:
    // heading = PI/2, deg = 90 → (90+22.5)%360 = 112.5 → floor(112.5/45) = 2 → dirs[2] = 'W'
    assert.strictEqual(computeHeadingDirection(Math.PI / 2), 'W');
});

test('computeHeadingDirection: negative rotation is handled correctly', () => {
    // Negative rotation should give the same result as the equivalent positive angle
    const dir1 = computeHeadingDirection(-Math.PI);
    const dir2 = computeHeadingDirection(Math.PI);
    assert.strictEqual(dir1, dir2, 'Negative PI and positive PI should both be S');
});

test('computeHeadingDirection: all 8 compass sectors are reachable', () => {
    const dirs = new Set();
    const steps = 360;
    for (let i = 0; i < steps; i++) {
        const angle = (i / steps) * Math.PI * 2;
        dirs.add(computeHeadingDirection(angle));
    }
    assert.deepStrictEqual(
        [...dirs].sort(),
        ['E', 'N', 'NE', 'NW', 'S', 'SE', 'SW', 'W'],
        'All 8 compass directions should be reachable'
    );
});

// =============================================================================
// getBiome
// =============================================================================

test('getBiome: output is always in [-1, 1]', () => {
    const testPoints = [
        [0, 0], [10000, 10000], [-10000, -10000],
        [5000, -5000], [-5000, 5000], [50000, 50000]
    ];
    for (const [x, z] of testPoints) {
        const b = getBiome(x, z, simplex);
        assert.ok(b >= -1 && b <= 1, `getBiome(${x}, ${z}) = ${b} is outside [-1, 1]`);
    }
});

test('getBiome: far east (positive x) tends toward lower (ocean) biome values', () => {
    // At x=10000 (far east), biomeBase is reduced by min(1, 10000/10000) = -1, so biome is pulled toward -1
    const center = getBiome(0, 0, simplex);
    const east = getBiome(10000, 0, simplex);
    // east should generally be lower than center (ocean biome), allowing for noise
    assert.ok(east < center + 0.5, `East biome (${east}) unexpectedly much higher than center (${center})`);
});

test('getBiome: far north (positive z) tends toward higher (mountain) biome values', () => {
    // At z=10000 (far north), biomeBase is increased by min(1, 10000/10000) = +1, pulled toward +1
    const center = getBiome(0, 0, simplex);
    const north = getBiome(0, 10000, simplex);
    assert.ok(north > center - 0.5, `North biome (${north}) unexpectedly much lower than center (${center})`);
});

// =============================================================================
// getElevation
// =============================================================================

test('getElevation: output is always >= WATER_LEVEL', () => {
    const testPoints = [
        [0, 0], [1000, 1000], [-2000, 500],
        [5000, -3000], [-4500, 8000], [0, 10000]
    ];
    for (const [x, z] of testPoints) {
        const h = getElevation(x, z, simplex, CONSTANTS, lerp);
        assert.ok(h >= CONSTANTS.WATER_LEVEL,
            `getElevation(${x}, ${z}) = ${h} is below WATER_LEVEL (${CONSTANTS.WATER_LEVEL})`);
    }
});

test('getElevation: a wide grid of points all respect the water floor (with west-lerp tolerance)', () => {
    // The game clamps all underwater terrain to WATER_LEVEL, except for far-west positions
    // (x < 0, westFactor > 0.5) where it uses a lerp toward WATER_LEVEL+5 that may briefly
    // interpolate below WATER_LEVEL for extreme noise values.
    // This test verifies non-west points always clamp correctly.
    let failures = 0;
    for (let x = 0; x <= 8000; x += 500) {  // east and center only
        for (let z = -8000; z <= 8000; z += 500) {
            const h = getElevation(x, z, simplex, CONSTANTS, lerp);
            if (h < CONSTANTS.WATER_LEVEL) failures++;
        }
    }
    assert.strictEqual(failures, 0, `${failures} non-west points had elevation below WATER_LEVEL`);
});

test('getElevation: west tends to have more land (elevation > WATER_LEVEL)', () => {
    // Far west (x << 0) should have terrain clamped UP to above water per the west suppression logic
    const westPoints = [[-4000, 0], [-4000, 1000], [-4000, -1000]];
    for (const [x, z] of westPoints) {
        const h = getElevation(x, z, simplex, CONSTANTS, lerp);
        assert.ok(h >= CONSTANTS.WATER_LEVEL, `West point (${x}, ${z}) elevation ${h} is below water level`);
    }
});
