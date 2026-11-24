/* ==========================================================================
   PALETTES ENGINE FOR COUNTERS
   Exact color math, WCAG contrast & sheet/leader token formulas from Counters,
   Machado (2009) CVD simulation, OKLab perceptual distances, all 6 shipped
   Counters palettes, 15 static concept palettes, and 3 live dynamic engines.
   ========================================================================== */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CountersPalettes = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. Exact Counters Color & Contrast Math
  // --------------------------------------------------------------------------

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  const hexToRgb = (hex) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];

  const rgbToHex = (r, g, b) =>
    '#' +
    [r, g, b]
      .map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0'))
      .join('');

  const hslToHex = (h, s, l) => {
    const hue = ((Number(h) % 360) + 360) % 360;
    const sat = clamp(s, 0, 100) / 100;
    const lig = clamp(l, 0, 100) / 100;
    const k = (n) => (n + hue / 30) % 12;
    const a = sat * Math.min(lig, 1 - lig);
    const f = (n) =>
      Math.round(
        255 * (lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))),
      );
    return rgbToHex(f(0), f(8), f(4));
  };

  const hexToHsl = (hex) => {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return { h: 205, s: 82, l: 58 };
    const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return { h: 0, s: 0, l: l * 100 };
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    const h =
      max === r
        ? ((g - b) / d + (g < b ? 6 : 0)) * 60
        : max === g
          ? ((b - r) / d + 2) * 60
          : ((r - g) / d + 4) * 60;
    return { h, s: s * 100, l: l * 100 };
  };

  const hueOf = (hex) => {
    const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max - min < 0.08) return 999; // near-grey sorts last, matching Counters
    const d = max - min;
    const h =
      max === r
        ? ((g - b) / d) % 6
        : max === g
          ? (b - r) / d + 2
          : (r - g) / d + 4;
    return (h * 60 + 360) % 360;
  };

  const sortColorsByHue = (hexes) =>
    [...hexes].sort((a, b) => hueOf(a) - hueOf(b));

  const relativeLuminance = (hex) => {
    const channel = (i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  };

  const contrastRatio = (a, b) => {
    const la = relativeLuminance(a);
    const lb = relativeLuminance(b);
    const hi = Math.max(la, lb);
    const lo = Math.min(la, lb);
    return (hi + 0.05) / (lo + 0.05);
  };

  const mixHex = (hex, toward, t) =>
    '#' +
    [1, 3, 5]
      .map((i) => {
        const from = parseInt(hex.slice(i, i + 2), 16);
        const to = parseInt(toward.slice(i, i + 2), 16);
        return Math.round(from + (to - from) * t)
          .toString(16)
          .padStart(2, '0');
      })
      .join('');

  const getReadableTextColor = (hex) => {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return '#ffffff';
    const whiteContrast = contrastRatio(hex, '#ffffff');
    if (whiteContrast >= 4.5) return '#ffffff';
    return whiteContrast >= contrastRatio(hex, '#000000') ? '#ffffff' : '#000000';
  };

  const getHeaderHex = (hex) => mixHex(hex, '#000000', 0.12);

  const getHeaderTextColor = (hex, text) => {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return text;
    const header = getHeaderHex(hex);
    if (contrastRatio(header, text) >= 4.5) return text;
    return contrastRatio(header, '#ffffff') >= contrastRatio(header, '#000000')
      ? '#ffffff'
      : '#000000';
  };

  const getReadableInk = (hex, surface, toward, start) => {
    for (let t = start; t < 1; t += 0.05) {
      const ink = mixHex(hex, toward, t);
      if (contrastRatio(ink, surface) >= 4.5) return ink;
    }
    return toward;
  };

  const getInkOnLightTint = (hex) => {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return '#000000';
    return getReadableInk(hex, mixHex('#ffffff', hex, 0.1), '#000000', 0.15);
  };

  const getInkOnDarkTint = (hex, start = 0) => {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return '#ffffff';
    return getReadableInk(hex, mixHex('#16171d', hex, 0.15), '#ffffff', start);
  };

  const getSheetTokens = (hex) => {
    const valid = /^#[0-9a-f]{6}$/i.test(hex);
    return {
      sheetTheme: hex,
      sheetText: getReadableTextColor(hex),
      sheetInkLight: getInkOnLightTint(hex),
      sheetInkDark: getInkOnDarkTint(hex, 0.4),
      sheetControlInkLight: valid
        ? getReadableInk(hex, '#e9ebee', '#000000', 0.15)
        : '#000000',
      sheetControlInkDark: valid
        ? getReadableInk(hex, '#21232c', '#ffffff', 0.3)
        : '#ffffff',
    };
  };

  // Compute theme-hue accent tokens matching Counters/app.js applyAccentTokens()
  const computeAccentTokens = (hue) => {
    const hNorm = ((Number(hue) % 360) + 360) % 360;
    const rawLight = hslToHex(hNorm, 94, 60);
    const accDark = hslToHex(hNorm, 92, 65);

    let accLight = rawLight;
    if (hNorm >= 195 && hNorm <= 285) {
      for (let l = 60; l >= 32; l -= 0.5) {
        const candidate = hslToHex(hNorm, 94, l);
        if (
          contrastRatio(candidate, '#ffffff') >= 4.55 &&
          contrastRatio(candidate, '#f2f3f7') >= 4.55
        ) {
          accLight = candidate;
          break;
        }
      }
    } else {
      for (let l = 60; l >= 44; l -= 0.5) {
        const candidate = hslToHex(hNorm, 94, l);
        if (
          contrastRatio(candidate, '#ffffff') >= 3.05 &&
          contrastRatio(candidate, '#f2f3f7') >= 3.05
        ) {
          accLight = candidate;
          break;
        }
      }
    }

    const darkenableHue =
      hNorm > 42 && hNorm < 86
        ? hNorm - 17 * 0.5 * (1 - Math.cos((2 * Math.PI * (hNorm - 42)) / (86 - 42)))
        : hNorm;

    const lightSurfaces = ['#ffffff', '#f2f3f7', '#e9ebee'];
    let inkLight = '#000000';
    for (let l = 60; l >= 0; l -= 0.5) {
      const candidate = hslToHex(darkenableHue, 94, l);
      if (lightSurfaces.every((s) => contrastRatio(candidate, s) >= 4.6)) {
        inkLight = candidate;
        break;
      }
    }

    const darkSurfaces = ['#0d0e11', '#16171d', '#21232c'];
    let inkDark = '#ffffff';
    for (let l = 65; l <= 100; l += 0.5) {
      const candidate = hslToHex(hNorm, 92, l);
      if (darkSurfaces.every((s) => contrastRatio(candidate, s) >= 4.6)) {
        inkDark = candidate;
        break;
      }
    }

    return {
      hue: hNorm,
      accLight,
      accDark,
      inkLight,
      inkDark,
      onFillLight: getReadableTextColor(accLight),
      onFillDark: getReadableTextColor(accDark),
    };
  };

  // --------------------------------------------------------------------------
  // 2. Perceptual OKLab / OKLCH & Machado (2009) CVD Simulation
  // --------------------------------------------------------------------------

  const srgbToLinear = (c) =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;

  const linearToSrgb = (c) =>
    c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;

  const hexToOklab = (hex) => {
    const [r, g, b] = hexToRgb(hex).map((v) => srgbToLinear(v / 255));
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return {
      L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
      a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
      b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    };
  };

  const oklabToLinearRgb = ({ L, a, b }) => {
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.291485548 * b;
    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const s = s_ * s_ * s_;
    return [
      +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ];
  };

  const isInGamut = ([r, g, b]) =>
    r >= -0.0005 && r <= 1.0005 && g >= -0.0005 && g <= 1.0005 && b >= -0.0005 && b <= 1.0005;

  const oklchToHex = (L, C, hDeg) => {
    const hRad = (((hDeg % 360) + 360) % 360) * (Math.PI / 180);
    const clampedL = clamp(L, 0, 1);
    let lo = 0;
    let hi = Math.max(0, C);
    let best = [clampedL, clampedL, clampedL];
    const tryChroma = (c) =>
      oklabToLinearRgb({
        L: clampedL,
        a: c * Math.cos(hRad),
        b: c * Math.sin(hRad),
      });

    const full = tryChroma(hi);
    if (isInGamut(full)) {
      best = full;
    } else {
      for (let i = 0; i < 18; i++) {
        const mid = (lo + hi) / 2;
        const rgb = tryChroma(mid);
        if (isInGamut(rgb)) {
          best = rgb;
          lo = mid;
        } else {
          hi = mid;
        }
      }
    }
    return rgbToHex(
      ...best.map((v) => linearToSrgb(clamp(v, 0, 1)) * 255),
    );
  };

  const hexToOklch = (hex) => {
    const { L, a, b } = hexToOklab(hex);
    const C = Math.hypot(a, b);
    const h = C < 0.002 ? 0 : ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
    return { L, C, h };
  };

  // Guarantee target text polarity ('#ffffff' or '#000000') passes >= minRatio on both body & 12% header
  const ensureContrastPolarity = (hex, targetText, minRatio = 4.65) => {
    const check = (candidate) => {
      const chosen = getReadableTextColor(candidate);
      if (chosen !== targetText) return false;
      const bodyRatio = contrastRatio(candidate, targetText);
      const hdrRatio = contrastRatio(getHeaderHex(candidate), targetText);
      return bodyRatio >= minRatio && hdrRatio >= minRatio;
    };
    if (check(hex)) return hex;

    const { L, C, h } = hexToOklch(hex);
    if (targetText === '#ffffff') {
      let lo = 0.14;
      let hi = L;
      let best = oklchToHex(0.42, C, h);
      for (let i = 0; i < 22; i++) {
        const mid = (lo + hi) / 2;
        const cand = oklchToHex(mid, C, h);
        if (check(cand)) {
          best = cand;
          lo = mid;
        } else {
          hi = mid;
        }
      }
      return best;
    } else {
      let lo = L;
      let hi = 0.96;
      let best = oklchToHex(0.84, C, h);
      for (let i = 0; i < 22; i++) {
        const mid = (lo + hi) / 2;
        const cand = oklchToHex(mid, C, h);
        if (check(cand)) {
          best = cand;
          hi = mid;
        } else {
          lo = mid;
        }
      }
      return best;
    }
  };

  // Machado et al. (2009) full-severity matrices in linear RGB (identical to Counters accessibility.spec.js)
  const CVD_MATRICES = {
    deuteranopia: [
      [0.367322, 0.860646, -0.227968],
      [0.280085, 0.672501, 0.047413],
      [-0.01182, 0.04294, 0.968881],
    ],
    protanopia: [
      [0.152286, 1.052583, -0.204868],
      [0.114503, 0.786281, 0.099216],
      [-0.003882, -0.048116, 1.051998],
    ],
    tritanopia: [
      [1.255528, -0.076749, -0.178779],
      [-0.078411, 0.930809, 0.147602],
      [0.004733, 0.691367, 0.3039],
    ],
  };

  const simulateCvdHex = (hex, visionMode) => {
    if (!visionMode || visionMode === 'normal' || !CVD_MATRICES[visionMode]) {
      return hex;
    }
    const lin = hexToRgb(hex).map((v) => srgbToLinear(v / 255));
    const m = CVD_MATRICES[visionMode];
    const out = m.map((row) =>
      linearToSrgb(
        clamp(row[0] * lin[0] + row[1] * lin[1] + row[2] * lin[2], 0, 1),
      ),
    );
    return rgbToHex(out[0] * 255, out[1] * 255, out[2] * 255);
  };

  const oklabDistance = (hexA, hexB) => {
    const a = hexToOklab(hexA);
    const b = hexToOklab(hexB);
    return Math.hypot(a.L - b.L, a.a - b.a, a.b - b.b) * 100;
  };

  // Comprehensive engineering audit for any 8-color palette
  const auditPalette = (colors, visionMode = 'normal') => {
    const effective = colors.map((c) => simulateCvdHex(c, visionMode));
    const polarities = new Set();
    let minBodyContrast = Infinity;
    let minHeaderContrast = Infinity;

    const swatches = colors.map((hex, slot) => {
      const displayHex = effective[slot];
      const text = getReadableTextColor(hex);
      const headerHex = getHeaderHex(hex);
      const headerText = getHeaderTextColor(hex, text);
      const bodyContrast = contrastRatio(hex, text);
      const headerContrast = contrastRatio(headerHex, headerText);
      polarities.add(text);
      polarities.add(headerText);
      minBodyContrast = Math.min(minBodyContrast, bodyContrast);
      minHeaderContrast = Math.min(minHeaderContrast, headerContrast);
      const hsl = hexToHsl(hex);
      const oklch = hexToOklch(hex);
      return {
        slot,
        hex,
        displayHex,
        headerHex: getHeaderHex(displayHex),
        text,
        headerText,
        bodyContrast,
        headerContrast,
        minContrast: Math.min(bodyContrast, headerContrast),
        hsl: {
          h: Math.round(hsl.h),
          s: Math.round(hsl.s),
          l: Math.round(hsl.l),
        },
        oklch: {
          L: Math.round(oklch.L * 100),
          C: Number(oklch.C.toFixed(2)),
          h: Math.round(oklch.h),
        },
      };
    });

    let minPairwiseDeltaE = Infinity;
    let closestPair = [0, 1];
    for (let i = 0; i < effective.length; i++) {
      for (let j = i + 1; j < effective.length; j++) {
        const d = oklabDistance(effective[i], effective[j]);
        if (d < minPairwiseDeltaE) {
          minPairwiseDeltaE = d;
          closestPair = [i, j];
        }
      }
    }

    const cvdScores = {};
    for (const mode of ['normal', 'deuteranopia', 'protanopia', 'tritanopia']) {
      const sim = colors.map((c) => simulateCvdHex(c, mode));
      let worst = Infinity;
      for (let i = 0; i < sim.length; i++) {
        for (let j = i + 1; j < sim.length; j++) {
          worst = Math.min(worst, oklabDistance(sim[i], sim[j]));
        }
      }
      cvdScores[mode] = Number(worst.toFixed(1));
    }

    const polarityList = [...polarities];
    const polarityMode =
      polarityList.length === 1
        ? polarityList[0] === '#ffffff'
          ? 'uniform-white'
          : 'uniform-black'
        : 'adaptive';

    return {
      swatches,
      polarityMode,
      isUniformText: polarityList.length === 1,
      minBodyContrast: Number(minBodyContrast.toFixed(2)),
      minHeaderContrast: Number(minHeaderContrast.toFixed(2)),
      minContrast: Number(Math.min(minBodyContrast, minHeaderContrast).toFixed(2)),
      passesWcagAA: Math.min(minBodyContrast, minHeaderContrast) >= 4.5,
      minPairwiseDeltaE: Number(minPairwiseDeltaE.toFixed(1)),
      closestPair,
      cvdScores,
    };
  };

  // --------------------------------------------------------------------------
  // 3.Palette Groups & Static Definitions (6 Shipped + 15 New Concepts)
  // --------------------------------------------------------------------------

  const PALETTE_GROUPS = [
    {
      id: 'current',
      label: 'In Counters',
      shortLabel: 'Current',
      description: 'The six core palettes currently shipping in Counters.',
    },
    {
      id: 'clean',
      label: 'Clean & versatile',
      shortLabel: 'Clean',
      description: 'Everyday utility palettes with grounded, timeless range.',
    },
    {
      id: 'retro',
      label: 'Retro & design-nerdy',
      shortLabel: 'Retro',
      description: 'Printmaking drums, fantasy consoles, CRTs, and industrial signage.',
    },
    {
      id: 'wild',
      label: 'Actually wild',
      shortLabel: 'Wild',
      description: 'FLIR heat maps, abyssal neon, bird feathers, and 90s highlighters.',
    },
    {
      id: 'dynamic',
      label: 'Dynamic',
      shortLabel: 'Dynamic',
      description: 'Procedural palettes driven by theme hue, golden-angle seeds, or time of day.',
    },
  ];

  // Bird placeholder names from Counters (ordered so rainbow grid matches screenshot)
  const BIRD_NAMES = [
    'Wren',
    'Puffin',
    'Swift',
    'Gull',
    'Tern',
    'Lark',
    'Flicker',
    'Crane',
  ];

  const SLOT_FAMILIES = [
    'Blue / Cool',
    'Red-orange / Warm',
    'Pink / Crimson',
    'Indigo / Slate',
    'Green / Moss',
    'Amber / Gold',
    'Teal / Cyan',
    'Purple / Deep',
  ];

  const STATIC_PALETTES = {
    // --- Group 1: Current in Counters (exact hexes & names from Counters/app.js) ---
    bold: {
      id: 'bold',
      label: 'Bold',
      group: 'current',
      shipped: true,
      tagline: 'Punchy, high-saturation primaries with crisp white text.',
      notes: 'Default palette in Counters. Balanced saturation across eight distinct hue families.',
      colors: [
        '#0a54dd',
        '#c73511',
        '#c81876',
        '#7e37f8',
        '#5a8012',
        '#a25f11',
        '#158186',
        '#aa19ce',
      ],
      names: [
        'Royal blue',
        'Red-orange',
        'Magenta',
        'Violet',
        'Grass green',
        'Amber',
        'Teal',
        'Purple',
      ],
    },
    pastel: {
      id: 'pastel',
      label: 'Pastel',
      group: 'current',
      shipped: true,
      tagline: 'Airy sherbet and chalk tints paired with dark ink.',
      notes: 'Ships in Counters. High lightness keeps black labels above 4.5:1 even under the 12% header shade.',
      colors: [
        '#93ddfa',
        '#fdc399',
        '#fdb2c8',
        '#c1d0fb',
        '#b6dfa0',
        '#e9cf87',
        '#86e6d3',
        '#d4b3fc',
      ],
      names: [
        'Sky',
        'Apricot',
        'Pink',
        'Periwinkle',
        'Leaf green',
        'Butter',
        'Mint',
        'Lilac',
      ],
    },
    vintage: {
      id: 'vintage',
      label: 'Vintage',
      group: 'current',
      shipped: true,
      tagline: 'Sun-faded mid-century tones with warm editorial calm.',
      notes: 'Ships in Counters. Muted chroma makes long scorekeeping sessions gentle on the eyes.',
      colors: [
        '#7da2c9',
        '#d48871',
        '#d99fa7',
        '#b1a1d1',
        '#9bb48e',
        '#d8b260',
        '#77b1b0',
        '#a475af',
      ],
      names: [
        'Denim',
        'Terracotta',
        'Dusty rose',
        'Mauve',
        'Sage',
        'Mustard',
        'Dusty teal',
        'Plum',
      ],
    },
    nautical: {
      id: 'nautical',
      label: 'Nautical',
      group: 'current',
      shipped: true,
      tagline: 'Deep sea-chart hull colors, weathered brass, and kelp.',
      notes: 'Ships in Counters. Low-glare maritime hues ideal for dim rooms and late-night games.',
      colors: [
        '#0f2a5f',
        '#8b320b',
        '#730533',
        '#5c6b76',
        '#294c2a',
        '#72511e',
        '#115e5e',
        '#453065',
      ],
      names: [
        'Navy',
        'Red lead',
        'Signal red',
        'Storm grey',
        'Kelp',
        'Brass',
        'Deep sea',
        'Twilight',
      ],
    },
    vaporwave: {
      id: 'vaporwave',
      label: 'Vaporwave',
      group: 'current',
      shipped: true,
      tagline: 'Arcade neon cyan, hot pink, lemon, and laser mint.',
      notes: 'Ships in Counters. Electric synthwave chroma with uniform dark text.',
      colors: [
        '#01cdfe',
        '#fd7f82',
        '#ff71ce',
        '#8c9cfb',
        '#fffb96',
        '#fda573',
        '#05ffa1',
        '#b967ff',
      ],
      names: [
        'Cyan',
        'Coral',
        'Hot pink',
        'Periwinkle',
        'Lemon',
        'Sunset orange',
        'Mint',
        'Purple',
      ],
    },
    colorblind: {
      id: 'colorblind',
      label: 'Accessible',
      group: 'current',
      shipped: true,
      tagline: 'Engineered lightness steps that survive color blindness.',
      notes: 'Ships in Counters (key: colorblind). Every pair maintains OKLab ΔE ≥ 9 across deuteranopia, protanopia, and tritanopia.',
      colors: [
        '#85e1f8',
        '#c37d31',
        '#f6a696',
        '#94b4f4',
        '#bcfbbb',
        '#d4db4c',
        '#349984',
        '#9b72ef',
      ],
      names: [
        'Sky',
        'Caramel',
        'Salmon',
        'Periwinkle',
        'Mint',
        'Citron',
        'Teal',
        'Violet',
      ],
    },

    // --- Group 2: Clean & versatile ---
    botanical: {
      id: 'botanical',
      label: 'Botanical',
      group: 'clean',
      tagline: 'Warm glazed stoneware, dried herbs, canyon clay, and bark.',
      notes: 'Earthy natural pigments tuned for uniform crisp white ink—grounded and organic in both light and dark themes.',
      colors: [
        '#266d69',
        '#b54624',
        '#a14653',
        '#85674e',
        '#25663b',
        '#945e0d',
        '#606b14',
        '#523b2f',
      ],
      names: [
        'Eucalyptus',
        'Terracotta',
        'Clay',
        'Sandstone',
        'Moss',
        'Ochre',
        'Olive',
        'Bark',
      ],
    },
    jewel: {
      id: 'jewel',
      label: 'Jewel',
      group: 'clean',
      tagline: 'Faceted ruby, sapphire, emerald, topaz, and deep plum.',
      notes: 'Deeper and more velvety than Bold, yet noticeably richer and more crystalline than Nautical.',
      colors: [
        '#0f43b8',
        '#9e231b',
        '#b8144d',
        '#652dc1',
        '#0d6e3f',
        '#9c5708',
        '#0b6e69',
        '#6b186e',
      ],
      names: [
        'Sapphire',
        'Garnet',
        'Ruby',
        'Amethyst',
        'Emerald',
        'Topaz',
        'Jade',
        'Deep plum',
      ],
    },
    mono: {
      id: 'mono',
      label: 'Mono',
      group: 'clean',
      isRamp: true,
      tagline: 'Eight architectural slate and graphite luminance steps.',
      notes: 'Zero-distraction monochrome board. Four mist-slate steps (dark ink) and four obsidian-graphite steps (white ink) maximize separation.',
      colors: [
        '#e6e9f0',
        '#cbd1de',
        '#aeb7c9',
        '#8f99ae',
        '#565f73',
        '#3e4657',
        '#292f3c',
        '#171a22',
      ],
      names: [
        'Mist',
        'Fog',
        'Silver slate',
        'Pewter',
        'Steel',
        'Graphite',
        'Charcoal',
        'Obsidian',
      ],
    },
    transit: {
      id: 'transit',
      label: 'Transit',
      group: 'clean',
      tagline: 'NYC, London, and Tokyo subway line colors built for instant recognition.',
      notes: 'Wayfinding utility colors engineered to be told apart in half a second with uniform white signage ink.',
      colors: [
        '#004fb6',
        '#c44900',
        '#c41e24',
        '#556270',
        '#15733b',
        '#965b00',
        '#007282',
        '#7b2cbf',
      ],
      names: [
        'Express blue',
        'Sixth ave orange',
        'Central red',
        'Jubilee slate',
        'Lexington green',
        'Circle amber',
        'Victoria teal',
        'Flushing violet',
      ],
    },

    // --- Group 3: Retro & design-nerdy ---
    risograph: {
      id: 'risograph',
      label: 'Risograph',
      group: 'retro',
      tagline: 'Soy-based indie printmaking spot inks with key-plate black type.',
      notes: 'Fluorescent pink, sunflower, kelly green, bright teal, cornflower, federal blue, riso red, and metallic gold.',
      colors: [
        '#5ec2ff',
        '#ff7c6b',
        '#ff7eb9',
        '#9899ff',
        '#6fd96c',
        '#ffd447',
        '#48d6cc',
        '#e0b663',
      ],
      names: [
        'Cornflower',
        'Riso red',
        'Fluorescent pink',
        'Federal blue',
        'Kelly green',
        'Sunflower',
        'Bright teal',
        'Metallic gold',
      ],
    },
    eightBit: {
      id: 'eightBit',
      label: '8-bit',
      group: 'retro',
      tagline: 'Fantasy-console pixel colors that click together effortlessly.',
      notes: 'Inspired by PICO-8 and classic cartridge sprites—quirky, high-charm hues with uniform dark pixel ink.',
      colors: [
        '#59bfff',
        '#ff9642',
        '#ff7eb3',
        '#a89cf7',
        '#5ce06b',
        '#ffec3d',
        '#5ce6e6',
        '#ffc49b',
      ],
      names: [
        'Sky byte',
        'Blaze orange',
        'Berry sprite',
        'Dusk indigo',
        'Slime green',
        'Coin yellow',
        'Ice cyan',
        'Peach pixel',
      ],
    },
    phosphor: {
      id: 'phosphor',
      label: 'Phosphor',
      group: 'retro',
      tagline: 'High-voltage ANSI CRT terminal beams glowing against dark glass.',
      notes: 'Eight classic vector and terminal phosphor emissions tuned to radiate in dark mode with crisp dark text.',
      colors: [
        '#4deeea',
        '#ffb638',
        '#ff77e9',
        '#7ea8ff',
        '#4aff6b',
        '#ffe45e',
        '#6effc8',
        '#c490ff',
      ],
      names: [
        'Cyan beam',
        'P3 amber',
        'Magenta trace',
        'Cobalt ray',
        'P1 green',
        'Warm filament',
        'Vector aqua',
        'UV phosphor',
      ],
    },
    handheld: {
      id: 'handheld',
      label: 'Handheld',
      group: 'retro',
      isRamp: true,
      tagline: 'Eight dot-matrix olive LCD shades from pea-soup highlight to pixel shadow.',
      notes: 'Nostalgic 1989 reflective LCD ramp: four lit pea-soup steps and four deep pixel-ink steps.',
      colors: [
        '#d9e67e',
        '#c2d468',
        '#a8bd56',
        '#8ea646',
        '#465e2a',
        '#354a1f',
        '#253615',
        '#17240d',
      ],
      names: [
        'Pea-soup',
        'Backlit lime',
        'LCD olive',
        ' Moss matrix',
        'Dither shade',
        'Sprite olive',
        'Deep pixel',
        'Dot charcoal',
      ].map((s) => s.trim()),
    },
    hazard: {
      id: 'hazard',
      label: 'Hazard',
      group: 'retro',
      tagline: 'Swiss industrial brutalism—safety orange, caution yellow, steel, and chalk.',
      notes: 'High-contrast workshop & blueprint materials with razor-sharp stencil contrast on every surface.',
      colors: [
        '#0d4ba6',
        '#ff7b1c',
        '#c91c22',
        '#515c69',
        '#b8bec6',
        '#f5c400',
        '#eef0eb',
        '#1a1d21',
      ],
      names: [
        'Blueprint blue',
        'Safety orange',
        'Signal red',
        'Raw steel',
        'Concrete',
        'Caution yellow',
        'Chalk',
        'Matte black',
      ],
    },

    // --- Group 4: Actually wild ---
    thermal: {
      id: 'thermal',
      label: 'Thermal',
      group: 'wild',
      isRamp: true,
      tagline: 'Full FLIR infrared heat-map spectrum from cold indigo to white-hot.',
      notes: 'Try the "Heat 1–8" score preset to watch counters visually heat up across the 2×4 grid.',
      colors: [
        '#1b114a',
        '#53157d',
        '#991470',
        '#c42136',
        '#fc8428',
        '#ffd026',
        '#ffe875',
        '#fff9db',
      ],
      names: [
        'Deep indigo',
        'Thermal violet',
        'IR magenta',
        'Crimson core',
        'Blazing orange',
        'Bright yellow',
        'Pale gold',
        'White-hot',
      ],
    },
    bioluminescent: {
      id: 'bioluminescent',
      label: 'Bioluminescent',
      group: 'wild',
      tagline: 'Abyssal jellyfish blue, dinoflagellate cyan, and anglerfish chartreuse.',
      notes: 'Built to shine against Counters’ #0d0e11 dark mode backdrop with 100% uniform dark ink.',
      colors: [
        '#52c4ff',
        '#ff877a',
        '#ff70d9',
        '#d9f7ff',
        '#9eff47',
        '#6bffb8',
        '#3ef5e0',
        '#b68cff',
      ],
      names: [
        'Jellyfish blue',
        'Coral glow',
        'Anemone magenta',
        'Ghostly ice',
        'Anglerfish chartreuse',
        'Seafoam',
        'Dinoflagellate cyan',
        'Abyssal violet',
      ],
    },
    plumage: {
      id: 'plumage',
      label: 'Plumage',
      group: 'wild',
      tagline: 'Field-guide bird feathers—cardinal red, goldfinch yellow, jay blue, and buff.',
      notes: 'Natural companion to Counters’ bird placeholder names (Swift, Puffin, Crane, Wren, Flicker, Tern, Gull, Lark).',
      colors: [
        '#1956b8',
        '#c41926',
        '#e3bf8e',
        '#4f5d73',
        '#0e6b45',
        '#f7cf1d',
        '#0a7285',
        '#5e329e',
      ],
      names: [
        'Jay blue',
        'Cardinal red',
        'Waxwing buff',
        'Slate',
        'Mallard emerald',
        'Goldfinch yellow',
        'Kingfisher cyan',
        'Iridescent violet',
      ],
    },
    highlighter: {
      id: 'highlighter',
      label: 'Highlighter',
      group: 'wild',
      tagline: 'Pure 1990s textbook chaos—radioactive yellow, acid green, and hot pink.',
      notes: 'Unapologetically fluorescent study-guide markers with crisp black textbook ink across all eight slots.',
      colors: [
        '#33f0ff',
        '#ff912b',
        '#ff73cb',
        '#be9eff',
        '#50ff80',
        '#f8ff33',
        '#bdff33',
        '#ff8282',
      ],
      names: [
        'Electric cyan',
        'Safety orange',
        'Hot pink',
        'Neon lavender',
        'Acid green',
        'Radioactive yellow',
        'Blinding lime',
        'Laser coral',
      ],
    },
    meeple: {
      id: 'meeple',
      label: 'Meeple',
      group: 'wild',
      tagline: 'Classic painted-wood tabletop player tokens plus natural birch.',
      notes: 'Matches physical board-game player pieces on the table so nobody forgets which score card is theirs.',
      colors: [
        '#1452bd',
        '#bd2424',
        '#f58529',
        '#343942',
        '#1e783c',
        '#f5ce24',
        '#e3caa1',
        '#6e2ca8',
      ],
      names: [
        'Royal blue',
        'Wood-stain red',
        'Orange',
        'Charcoal',
        'Meadow green',
        'Sunny yellow',
        'Natural birch',
        'Purple',
      ],
    },
    ember: {
      id: 'ember',
      label: 'Ember',
      group: 'wild',
      isRamp: true,
      tagline: 'Single-temperature campfire story from spark gold down to midnight smoke.',
      notes: 'Warmth cools steadily across slots 0–7: glowing gold and flame fade into sienna, plum ash, and smoke.',
      colors: [
        '#ffd647',
        '#ff882e',
        '#b8251e',
        '#9c3b1c',
        '#7d3522',
        '#59384a',
        '#36333b',
        '#1c1a21',
      ],
      names: [
        'Spark gold',
        'Flame orange',
        'Coal red',
        'Burnt sienna',
        'Rust',
        'Ash plum',
        'Charcoal',
        'Midnight smoke',
      ],
    },
  };

  // --------------------------------------------------------------------------
  // 4. Three Live Dynamic Palette Generators (Tonal, Shuffle, Sky)
  // --------------------------------------------------------------------------

  // 4A. TONAL: Driven dynamically by Counters' Theme color slider (0-360)
  const generateTonalPalette = ({ hue = 205, mode = 'analogous' } = {}) => {
    const baseHue = ((Number(hue) % 360) + 360) % 360;

    if (mode === 'monochromatic') {
      // 8 distinct OKLCH lightness steps along baseHue (with subtle warm curve on yellows)
      const steps = [
        { L: 0.91, C: 0.055, name: 'Tint 1 · Mist', pol: '#000000' },
        { L: 0.85, C: 0.095, name: 'Tint 2 · Soft', pol: '#000000' },
        { L: 0.79, C: 0.135, name: 'Tint 3 · Bright', pol: '#000000' },
        { L: 0.73, C: 0.165, name: 'Tint 4 · Vivid', pol: '#000000' },
        { L: 0.51, C: 0.165, name: 'Shade 5 · Core', pol: '#ffffff' },
        { L: 0.44, C: 0.145, name: 'Shade 6 · Rich', pol: '#ffffff' },
        { L: 0.36, C: 0.115, name: 'Shade 7 · Deep', pol: '#ffffff' },
        { L: 0.28, C: 0.08, name: 'Shade 8 · Night', pol: '#ffffff' },
      ];
      // Convert CSS HSL hue angle neatly to perceptual OKLCH hue via anchor swatch
      const anchorOklch = hexToOklch(hslToHex(baseHue, 90, 55));
      const colors = steps.map((st, idx) => {
        const hueShift = (idx - 3.5) * 2.2;
        const raw = oklchToHex(st.L, st.C, anchorOklch.h + hueShift);
        return ensureContrastPolarity(raw, st.pol, 4.7);
      });
      return {
        id: 'tonal',
        label: 'Tonal',
        group: 'dynamic',
        isDynamic: true,
        isRamp: true,
        dynamicParams: { hue: baseHue, mode },
        tagline: 'Derives all eight slots live from the Theme color slider.',
        notes: `Monochromatic ${baseHue}° scale: four luminous tints and four deep shades sculpted in OKLCH.`,
        colors,
        names: steps.map((s) => s.name),
      };
    }

    // Analogous mode: 8 distinct analogous neighbors spanning ±56° around themeHue,
    // 100% uniform white text so it drops straight into Counters' single-polarity rules!
    const offsets = [
      { dh: 0, L: 0.48, C: 0.175, name: 'Theme core' },
      { dh: -48, L: 0.47, C: 0.165, name: 'Warm flank' },
      { dh: -32, L: 0.43, C: 0.175, name: 'Near warm' },
      { dh: 32, L: 0.44, C: 0.175, name: 'Near cool' },
      { dh: -16, L: 0.51, C: 0.155, name: 'Sunlit crest' },
      { dh: -62, L: 0.49, C: 0.155, name: 'Outer ember' },
      { dh: 16, L: 0.5, C: 0.155, name: 'Tidal shift' },
      { dh: 52, L: 0.42, C: 0.165, name: 'Outer dusk' },
    ];
    const anchorHue = hexToOklch(hslToHex(baseHue, 90, 52)).h;
    const colors = offsets.map((o) => {
      const raw = oklchToHex(o.L, o.C, anchorHue + o.dh);
      return ensureContrastPolarity(raw, '#ffffff', 4.75);
    });

    return {
      id: 'tonal',
      label: 'Tonal',
      group: 'dynamic',
      isDynamic: true,
      isRamp: false,
      dynamicParams: { hue: baseHue, mode: 'analogous' },
      tagline: 'Derives all eight slots live from the Theme color slider.',
      notes: `Analogous ±55° neighborhood centered on ${baseHue}°—keeps uniform white text at every hue angle.`,
      colors,
      names: offsets.map((o) => o.name),
    };
  };

  // 4B. SHUFFLE: Deterministic PRNG + Golden-angle OKLCH harmonious stepping
  const hashSeed = (seedStr) => {
    const str = String(seedStr || '7F4A2C');
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };

  const mulberry32 = (seedInt) => {
    let a = seedInt >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  const hueNameForAngle = (oklchHue) => {
    const h = ((oklchHue % 360) + 360) % 360;
    if (h < 22) return 'Crimson';
    if (h < 48) return 'Coral';
    if (h < 75) return 'Tangerine';
    if (h < 105) return 'Gold';
    if (h < 135) return 'Citron';
    if (h < 165) return ' Clover';
    if (h < 195) return 'Seafoam';
    if (h < 225) return 'Lagoon';
    if (h < 258) return 'Azure';
    if (h < 288) return 'Cobalt';
    if (h < 320) return 'Iris';
    if (h < 345) return 'Orchid';
    return 'Rose';
  };

  const GOLDEN_ANGLE = 137.50776405;

  const generateShufflePalette = ({
    seed = 'C0FFEE',
    style = 'vivid',
  } = {}) => {
    const cleanSeed = String(seed).toUpperCase().slice(0, 8) || 'C0FFEE';
    const rand = mulberry32(hashSeed(`${cleanSeed}:${style}`));
    const startHue = rand() * 360;
    const isLight = style === 'luminous';
    const targetText = isLight ? '#000000' : '#ffffff';

    const rawSwatches = Array.from({ length: 8 }, (_, i) => {
      const jitter = (rand() - 0.5) * 9;
      const h = (startHue + i * GOLDEN_ANGLE + jitter + 360) % 360;
      const L = isLight
        ? 0.8 + (i % 3) * 0.038 + (rand() - 0.5) * 0.025
        : 0.44 + (i % 3) * 0.038 + (rand() - 0.5) * 0.025;
      const C = isLight
        ? 0.125 + rand() * 0.055
        : 0.155 + rand() * 0.055;
      const hex = ensureContrastPolarity(oklchToHex(L, C, h), targetText, 4.75);
      return { hex, h };
    });

    // Align generated colors roughly to Counters' 8 slot hue families so switching feels natural
    const slotTargetHues = [255, 38, 350, 285, 145, 85, 195, 315];
    const remaining = [...rawSwatches];
    const ordered = slotTargetHues.map((targetH) => {
      let bestIdx = 0;
      let bestDist = Infinity;
      remaining.forEach((cand, idx) => {
        const diff = Math.abs(((cand.h - targetH + 540) % 360) - 180);
        if (diff < bestDist) {
          bestDist = diff;
          bestIdx = idx;
        }
      });
      return remaining.splice(bestIdx, 1)[0];
    });

    const usedNames = new Map();
    const names = ordered.map((item) => {
      const base = hueNameForAngle(item.h).trim();
      const count = (usedNames.get(base) || 0) + 1;
      usedNames.set(base, count);
      return count === 1 ? `${base} roll` : `${base} ${count}`;
    });

    return {
      id: 'shuffle',
      label: 'Shuffle',
      group: 'dynamic',
      isDynamic: true,
      isRamp: false,
      dynamicParams: { seed: cleanSeed, style },
      tagline: 'Golden-angle OKLCH color roller—tap to roll fresh harmonious sets.',
      notes: `Seed #${cleanSeed} (${isLight ? 'luminous dark-ink' : 'vivid white-ink'} mode) spaced by the 137.5° golden angle.`,
      colors: ordered.map((x) => x.hex),
      names,
    };
  };

  // 4C. SKY: Continuous 24-hour atmospheric interpolation across 6 keyframes
  const SKY_KEYFRAMES = [
    {
      minutes: 0, // 00:00 Midnight
      phase: 'Midnight',
      polarity: '#ffffff',
      colors: [
        '#14295c',
        '#3a2352',
        '#4f1d46',
        '#1f2942',
        '#134e4a',
        '#4a3b22',
        '#134b5f',
        '#2b1e54',
      ],
      names: [
        'Zenith navy',
        'Astral plum',
        'Nightflare',
        'Starlight slate',
        'Aurora pine',
        'Moonlit brass',
        'Abyssal fjord',
        'Cosmos indigo',
      ],
    },
    {
      minutes: 360, // 06:00 Dawn
      phase: 'Dawn',
      polarity: '#000000',
      colors: [
        '#9fd4f8',
        '#fcbd9b',
        '#f9b4cf',
        '#c2c9f7',
        '#c5e3c2',
        '#fbe09c',
        '#a5e4de',
        '#d7bdf8',
      ],
      names: [
        'First light',
        'Peach horizon',
        'Rose cloud',
        'Morning mist',
        'Dew meadow',
        'Early sunbeam',
        'Sea glass',
        'Lilac haze',
      ],
    },
    {
      minutes: 570, // 09:30 Morning
      phase: 'Morning',
      polarity: '#000000',
      colors: [
        '#72cdfc',
        '#fba979',
        '#fa9ec0',
        '#a6bff9',
        '#9fe3a9',
        '#f9db74',
        '#79e6d8',
        '#c5a8fb',
      ],
      names: [
        'Crisp sky',
        'Warmstone',
        'Camellia',
        'High altitude',
        'Sunlit leaf',
        'Morning gold',
        'Coastal breeze',
        'Periwinkle air',
      ],
    },
    {
      minutes: 780, // 13:00 Midday
      phase: 'Midday',
      polarity: '#000000',
      colors: [
        '#55c6ff',
        '#ff9b6a',
        '#ff94bc',
        '#95b8ff',
        '#8be896',
        '#ffe45e',
        '#5ce8db',
        '#ba9cff',
      ],
      names: [
        'Zenith azure',
        'Sunbaked canyon',
        'Bougainvillea',
        'Cloud shadow',
        'Canopy bright',
        'High noon',
        'Tropical shoal',
        'Ultraviolet sky',
      ],
    },
    {
      minutes: 1065, // 17:45 Golden hour
      phase: 'Golden hour',
      polarity: '#ffffff',
      colors: [
        '#255299',
        '#c74b16',
        '#b82555',
        '#5c478a',
        '#4b6b2c',
        '#9e5f08',
        '#1c6b75',
        '#7d2e7d',
      ],
      names: [
        'Dusk cerulean',
        ' Sundown ember',
        'Afterglow rose',
        'Violet shadow',
        'Olive hillside',
        'Burnished amber',
        'Harbor reflection',
        ' Horizon plum',
      ].map((s) => s.trim()),
    },
    {
      minutes: 1230, // 20:30 Twilight
      phase: 'Twilight',
      polarity: '#ffffff',
      colors: [
        '#16397a',
        '#99341f',
        '#8c1c52',
        '#3d396b',
        '#1f5748',
        '#7a4b14',
        '#145a6b',
        '#522575',
      ],
      names: [
        'Nautical dusk',
        'Last ember',
        'Twilight magenta',
        'Indigo horizon',
        'Evening spruce',
        'Lantern glow',
        'Deep sound',
        'Civil dusk',
      ],
    },
  ];

  const formatMinutesAsTime = (minutes) => {
    const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
    const hh24 = Math.floor(m / 60);
    const mm = String(m % 60).padStart(2, '0');
    const period = hh24 >= 12 ? 'PM' : 'AM';
    const hh12 = hh24 % 12 || 12;
    return `${hh12}:${mm} ${period}`;
  };

  const generateSkyPalette = ({ minutes = 780 } = {}) => {
    const mins = ((Number(minutes) % 1440) + 1440) % 1440;
    const frames = SKY_KEYFRAMES;
    let prev = frames[frames.length - 1];
    let next = frames[0];
    let span = 1440 - prev.minutes + next.minutes;
    let elapsed = mins >= prev.minutes ? mins - prev.minutes : 1440 - prev.minutes + mins;

    for (let i = 0; i < frames.length - 1; i++) {
      if (mins >= frames[i].minutes && mins < frames[i + 1].minutes) {
        prev = frames[i];
        next = frames[i + 1];
        span = next.minutes - prev.minutes;
        elapsed = mins - prev.minutes;
        break;
      }
    }

    const rawT = span > 0 ? elapsed / span : 0;
    // Smooth cosine easing between atmospheric anchors
    const t = 0.5 - 0.5 * Math.cos(Math.PI * rawT);
    const nearest = t < 0.5 ? prev : next;
    // Lock uniform text polarity across all 8 slots at every minute of the day!
    const targetPolarity = nearest.polarity;

    const colors = prev.colors.map((hexA, slot) => {
      const labA = hexToOklab(hexA);
      const labB = hexToOklab(next.colors[slot]);
      const mixedLinear = oklabToLinearRgb({
        L: labA.L + (labB.L - labA.L) * t,
        a: labA.a + (labB.a - labA.a) * t,
        b: labA.b + (labB.b - labA.b) * t,
      });
      const mixedHex = rgbToHex(
        ...mixedLinear.map((v) => linearToSrgb(clamp(v, 0, 1)) * 255),
      );
      return ensureContrastPolarity(mixedHex, targetPolarity, 4.7);
    });

    return {
      id: 'sky',
      label: 'Sky',
      group: 'dynamic',
      isDynamic: true,
      isRamp: false,
      dynamicParams: {
        minutes: Math.round(mins),
        phase: nearest.phase,
        timeLabel: formatMinutesAsTime(mins),
      },
      tagline: 'Shifts slowly through dawn pastels, bright midday, golden hour, and twilight.',
      notes: `${nearest.phase} (${formatMinutesAsTime(mins)}) — OKLab atmospheric interpolation with guaranteed ${targetPolarity === '#ffffff' ? 'white' : 'dark'} card ink.`,
      colors,
      names: nearest.names,
    };
  };

  // --------------------------------------------------------------------------
  // 5. Catalog Accessors & Counters Code Exporter
  // --------------------------------------------------------------------------

  const PALETTE_ORDER = [
    // Current (6)
    'bold',
    'pastel',
    'vintage',
    'nautical',
    'vaporwave',
    'colorblind',
    // Clean (4)
    'botanical',
    'jewel',
    'mono',
    'transit',
    // Retro (5)
    'risograph',
    'eightBit',
    'phosphor',
    'handheld',
    'hazard',
    // Wild (6)
    'thermal',
    'bioluminescent',
    'plumage',
    'highlighter',
    'meeple',
    'ember',
    // Dynamic (3)
    'tonal',
    'shuffle',
    'sky',
  ];

  const resolvePalette = (id, dynamicState = {}) => {
    if (id === 'tonal') {
      return generateTonalPalette({
        hue: dynamicState.themeHue ?? 205,
        mode: dynamicState.tonalMode ?? 'analogous',
      });
    }
    if (id === 'shuffle') {
      return generateShufflePalette({
        seed: dynamicState.shuffleSeed ?? 'A7F39C',
        style: dynamicState.shuffleStyle ?? 'vivid',
      });
    }
    if (id === 'sky') {
      return generateSkyPalette({
        minutes: dynamicState.skyMinutes ?? 780,
      });
    }
    return STATIC_PALETTES[id] || STATIC_PALETTES.bold;
  };

  const getAllPalettes = (dynamicState = {}) =>
    PALETTE_ORDER.map((id) => resolvePalette(id, dynamicState));

  const formatPaletteForCounters = (palette) => {
    const key = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(palette.id)
      ? palette.id
      : JSON.stringify(palette.id);
    const colorLines = palette.colors
      .map((hex, idx) => `      "${hex}", // ${palette.names[idx] || `Slot ${idx}`}`)
      .join('\n');
    const nameLines = palette.names
      .map((name) => `      ${JSON.stringify(name)},`)
      .join('\n');
    return `${key}: {\n  label: ${JSON.stringify(palette.label)},\n  colors: [\n${colorLines}\n  ],\n  names: [\n${nameLines}\n  ],\n},`;
  };

  return {
    PALETTE_GROUPS,
    PALETTE_ORDER,
    BIRD_NAMES,
    SLOT_FAMILIES,
    STATIC_PALETTES,
    SKY_KEYFRAMES,
    hslToHex,
    hexToHsl,
    hueOf,
    sortColorsByHue,
    relativeLuminance,
    contrastRatio,
    mixHex,
    getReadableTextColor,
    getHeaderHex,
    getHeaderTextColor,
    getInkOnLightTint,
    getInkOnDarkTint,
    getSheetTokens,
    computeAccentTokens,
    hexToOklch,
    oklchToHex,
    ensureContrastPolarity,
    simulateCvdHex,
    oklabDistance,
    auditPalette,
    generateTonalPalette,
    generateShufflePalette,
    generateSkyPalette,
    formatMinutesAsTime,
    resolvePalette,
    getAllPalettes,
    formatPaletteForCounters,
  };
});
