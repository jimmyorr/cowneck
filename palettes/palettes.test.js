const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const engine = require('./palettes-engine.js');

describe('CountersPalettes — Static & Shipped Palettes', () => {
  it('exposes all 24 palettes across 5 groups in deterministic order', () => {
    const all = engine.getAllPalettes();
    assert.equal(all.length, 24);
    assert.equal(engine.PALETTE_GROUPS.length, 5);

    const byGroup = {};
    for (const p of all) {
      byGroup[p.group] = (byGroup[p.group] || 0) + 1;
      assert.equal(p.colors.length, 8, `${p.id} should have 8 colors`);
      assert.equal(p.names.length, 8, `${p.id} should have 8 color names`);
      for (const hex of p.colors) {
        assert.match(hex, /^#[0-9a-f]{6}$/i, `${p.id} invalid hex ${hex}`);
      }
    }
    assert.deepEqual(byGroup, {
      current: 6,
      clean: 4,
      retro: 5,
      wild: 6,
      dynamic: 3,
    });
  });

  it('guarantees WCAG AA (>= 4.5:1) on both card body and 12%-darkened card header for all 21 static palettes', () => {
    for (const [id, palette] of Object.entries(engine.STATIC_PALETTES)) {
      const audit = engine.auditPalette(palette.colors);
      assert.equal(
        audit.passesWcagAA,
        true,
        `${id} failed WCAG AA: minBody=${audit.minBodyContrast}, minHdr=${audit.minHeaderContrast}`,
      );
      for (const sw of audit.swatches) {
        assert.equal(
          sw.text,
          sw.headerText,
          `${id} slot ${sw.slot} (${sw.hex}) flips text color between body (${sw.text}) and header (${sw.headerText})`,
        );
      }
      const minExpectedDeltaE = palette.shipped ? 5.0 : 5.8;
      assert.ok(
        audit.minPairwiseDeltaE >= minExpectedDeltaE,
        `${id} has two nearly indistinguishable slots: ΔE=${audit.minPairwiseDeltaE}`,
      );
    }
  });

  it('verifies the Accessible (colorblind) palette maintains OKLab ΔE >= 9 across all CVD modes', () => {
    const audit = engine.auditPalette(engine.STATIC_PALETTES.colorblind.colors);
    assert.ok(audit.cvdScores.normal >= 9);
    assert.ok(audit.cvdScores.deuteranopia >= 9);
    assert.ok(audit.cvdScores.protanopia >= 9);
    assert.ok(audit.cvdScores.tritanopia >= 9);
  });

  it('preserves single-polarity text on all 6 shipped Counters palettes and uniform-ink concepts', () => {
    const uniformExpected = [
      'bold',
      'pastel',
      'vintage',
      'nautical',
      'vaporwave',
      'colorblind',
      'botanical',
      'jewel',
      'transit',
      'risograph',
      'eightBit',
      'phosphor',
      'bioluminescent',
      'highlighter',
    ];
    for (const id of uniformExpected) {
      const audit = engine.auditPalette(engine.STATIC_PALETTES[id].colors);
      assert.equal(audit.isUniformText, true, `${id} expected uniform text polarity`);
    }
  });
});

describe('CountersPalettes — Dynamic Engines (Tonal, Shuffle, Sky)', () => {
  it('Tonal passes WCAG AA across every 15° hue step in both analogous and monochromatic modes', () => {
    for (let hue = 0; hue < 360; hue += 15) {
      const analogous = engine.generateTonalPalette({ hue, mode: 'analogous' });
      const auditAna = engine.auditPalette(analogous.colors);
      assert.equal(auditAna.passesWcagAA, true, `Tonal analogous hue ${hue} failed AA`);
      assert.equal(auditAna.isUniformText, true, `Tonal analogous hue ${hue} should have uniform white text`);

      const mono = engine.generateTonalPalette({ hue, mode: 'monochromatic' });
      const auditMono = engine.auditPalette(mono.colors);
      assert.equal(auditMono.passesWcagAA, true, `Tonal mono hue ${hue} failed AA`);
    }
  });

  it('Shuffle produces deterministic, uniform-polarity WCAG AA palettes across 30 seeds in both styles', () => {
    for (let i = 0; i < 30; i++) {
      const seed = `SEED${i.toString(16).padStart(2, '0')}`;
      for (const style of ['vivid', 'luminous']) {
        const p1 = engine.generateShufflePalette({ seed, style });
        const p2 = engine.generateShufflePalette({ seed, style });
        assert.deepEqual(p1.colors, p2.colors, 'Shuffle should be deterministic for same seed');
        const audit = engine.auditPalette(p1.colors);
        assert.equal(audit.passesWcagAA, true, `Shuffle ${seed} (${style}) failed AA`);
        assert.equal(audit.isUniformText, true, `Shuffle ${seed} (${style}) should be uniform polarity`);
      }
    }
  });

  it('Sky interpolates smoothly across all 48 half-hour steps with uniform polarity and WCAG AA contrast', () => {
    for (let mins = 0; mins < 1440; mins += 30) {
      const sky = engine.generateSkyPalette({ minutes: mins });
      const audit = engine.auditPalette(sky.colors);
      assert.equal(audit.passesWcagAA, true, `Sky at ${mins}m failed AA: ${audit.minContrast}`);
      assert.equal(audit.isUniformText, true, `Sky at ${mins}m mixed text polarity`);
    }
  });

  it('formats any palette cleanly as ready-to-paste Counters app.js source code', () => {
    const snippet = engine.formatPaletteForCounters(engine.STATIC_PALETTES.jewel);
    assert.match(snippet, /^jewel: \{/);
    assert.match(snippet, /label: "Jewel"/);
    assert.match(snippet, /"#b8144d", \/\/ Ruby/);
  });
});
