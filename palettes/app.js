/* ==========================================================================
   PALETTES FOR COUNTERS — INTERACTIVE STUDIO CONTROLLER
   ========================================================================== */
(function () {
  'use strict';

  const engine = window.CountersPalettes;
  if (!engine) return;

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const escapeHtml = (str) =>
    String(str ?? '').replace(
      /[&<>"']/g,
      (ch) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[ch],
    );

  const nowLocalMinutes = () => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  };

  // Studio & Simulator State
  const state = {
    paletteId: 'bold',
    category: 'all',
    theme: document.documentElement.classList.contains('light-mode') ? 'light' : 'dark',
    visionMode: 'normal',
    themeHue: 205,

    // Dynamic palette parameters
    tonalMode: 'analogous',
    shuffleSeed: 'A7F39C',
    shuffleStyle: 'vivid',
    shuffleHistory: ['A7F39C', 'C0FFEE', '42B1RD'],
    skyMinutes: nowLocalMinutes(),
    skyPlaying: false,
    skyRafId: null,

    // Simulator board controls
    boardOrder: 'rainbow', // 'rainbow' | 'slots'
    labelMode: 'birds', // 'birds' | 'colors' | 'hex'
    valuePreset: 'demo', // 'demo' | 'heat' | 'scores'
    layoutMode: 'grid', // 'grid' | 'list'
    leaderMode: 'highest', // 'highest' | 'lowest' | 'total'
    simTab: 'counters', // 'counters' | 'calculator' | 'picker' | 'settings'
    selectedSlot: 7, // Crane (slot 7 in Bold) starts with 1 in screenshot!
    calcSign: 'plus',
    pickerWinnerSlot: null,
    showCode: false,

    // 8 simulated counters mapped to slots 0..7
    slotValues: [0, 0, 0, 0, 0, 0, 0, 1],
  };

  // Parse URL hash (#thermal, #palette=sky) if present
  const readHashPalette = () => {
    const raw = window.location.hash.replace(/^#/, '').trim();
    if (!raw) return;
    const cleaned = raw.startsWith('palette=') ? raw.slice(8) : raw;
    if (engine.PALETTE_ORDER.includes(cleaned)) {
      state.paletteId = cleaned;
    }
  };

  const syncHash = () => {
    const target = `#${state.paletteId}`;
    if (window.location.hash !== target) {
      window.history.replaceState(null, '', target);
    }
  };

  let toastTimer = null;
  const showToast = (msg) => {
    const el = $('#studio-toast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    if (toastTimer !== null) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.hidden = true;
    }, 2200);
  };

  const copyText = async (text, label) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const area = document.createElement('textarea');
        area.value = text;
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        area.remove();
      }
      showToast(label);
    } catch {
      showToast(`Copied: ${text}`);
    }
  };

  const getDynamicParams = () => ({
    themeHue: state.themeHue,
    tonalMode: state.tonalMode,
    shuffleSeed: state.shuffleSeed,
    shuffleStyle: state.shuffleStyle,
    skyMinutes: state.skyMinutes,
  });

  const getActivePalette = () =>
    engine.resolvePalette(state.paletteId, getDynamicParams());

  // Apply --theme-hue tokens to root
  const applyStudioAccent = () => {
    const tokens = engine.computeAccentTokens(state.themeHue);
    const root = document.documentElement;
    root.style.setProperty('--theme-hue', String(tokens.hue));
    root.style.setProperty('--accent-fill-light', tokens.accLight);
    root.style.setProperty('--accent-fill-dark', tokens.accDark);
    root.style.setProperty('--accent-ink-light', tokens.inkLight);
    root.style.setProperty('--accent-ink-dark', tokens.inkDark);
    root.style.setProperty('--accent-on-fill-light', tokens.onFillLight);
    root.style.setProperty('--accent-on-fill-dark', tokens.onFillDark);
    const readout = $('#theme-hue-readout');
    if (readout) readout.textContent = `${Math.round(tokens.hue)}°`;
  };

  // Apply Dark / Light mode
  const applyStudioTheme = (mode) => {
    state.theme = mode === 'light' ? 'light' : 'dark';
    const isDark = state.theme === 'dark';
    document.documentElement.classList.toggle('dark-mode', isDark);
    document.documentElement.classList.toggle('light-mode', !isDark);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', isDark ? '#0d0e11' : '#f2f3f7');
    try {
      localStorage.setItem('palettes-theme', state.theme);
    } catch {
      /* ignore */
    }
    $$('#theme-mode-group [data-theme-mode]').forEach((btn) => {
      const active = btn.dataset.themeMode === state.theme;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
    $$('#sim-inner-theme-group [data-inner-theme]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.innerTheme === state.theme);
    });
  };

  // Ambient 3-point glow matching Counters/app.js updateAmbientBackdrop
  const updateAmbientGlow = (leaderHex) => {
    const backdrop = $('#ambient-backdrop');
    if (!backdrop) return;
    const isDark = state.theme === 'dark';
    const hexToRgba = (hex, a) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    };

    if (leaderHex && /^#[0-9a-f]{6}$/i.test(leaderHex)) {
      const { h, s } = engine.hexToHsl(leaderHex);
      const sat = s < 10 ? Math.round(s) : Math.round(Math.min(92, Math.max(s * 0.85 + 15, 48)));
      const p1 = engine.hslToHex(s < 10 ? 220 : h, sat, isDark ? 58 : 60);
      const p2 = engine.hslToHex(s < 10 ? 220 : (h + 28) % 360, Math.max(10, sat - 8), isDark ? 54 : 58);
      const p3 = engine.hslToHex(s < 10 ? 220 : (h + 348) % 360, Math.max(10, sat - 12), isDark ? 56 : 60);
      backdrop.style.setProperty('--ambient-glow-1', hexToRgba(p1, isDark ? 0.14 : 0.08));
      backdrop.style.setProperty('--ambient-glow-2', hexToRgba(p2, isDark ? 0.09 : 0.055));
      backdrop.style.setProperty('--ambient-glow-3', hexToRgba(p3, isDark ? 0.045 : 0.028));
    } else {
      const p1 = engine.hslToHex(state.themeHue, 82, isDark ? 58 : 60);
      const p2 = engine.hslToHex((state.themeHue + 28) % 360, 72, isDark ? 54 : 58);
      backdrop.style.setProperty('--ambient-glow-1', hexToRgba(p1, isDark ? 0.075 : 0.05));
      backdrop.style.setProperty('--ambient-glow-2', hexToRgba(p2, isDark ? 0.05 : 0.035));
      backdrop.style.setProperty('--ambient-glow-3', hexToRgba(p1, 0.02));
    }
  };

  // Ordered slots on the simulator board
  const getBoardSlots = (palette) => {
    const indices = [0, 1, 2, 3, 4, 5, 6, 7];
    if (state.boardOrder === 'slots' || palette.isRamp) {
      // Notice: ramp palettes (Thermal, Ember, Mono, Handheld) also shine in slot order,
      // while explicit toggle lets user switch freely; only force slots when boardOrder === 'slots'
      if (state.boardOrder === 'slots') return indices;
    }
    if (state.boardOrder === 'rainbow') {
      if (palette.isRamp) return indices;
      return [...indices].sort(
        (a, b) => engine.hueOf(palette.colors[a]) - engine.hueOf(palette.colors[b]),
      );
    }
    return indices;
  };

  const getCardLabel = (palette, slotIdx) => {
    if (state.labelMode === 'colors') {
      return palette.names[slotIdx] || `Slot ${slotIdx}`;
    }
    if (state.labelMode === 'hex') {
      return palette.colors[slotIdx].toUpperCase();
    }
    return engine.BIRD_NAMES[slotIdx] || `Slot ${slotIdx}`;
  };

  // Apply value presets ('demo' matches screenshot, 'heat' sets 1..8 across displayed order, 'scores' sets game scores)
  const applyValuePreset = (preset) => {
    state.valuePreset = preset;
    const palette = getActivePalette();
    const order = getBoardSlots(palette);
    const next = [0, 0, 0, 0, 0, 0, 0, 0];

    if (preset === 'demo') {
      // Crane (slot 7) starts at 1, matching Counters showcase screenshot
      const targetSlot = palette.isRamp ? order[order.length - 1] : 7;
      next[targetSlot] = 1;
      state.selectedSlot = targetSlot;
    } else if (preset === 'heat') {
      order.forEach((slot, rank) => {
        next[slot] = (rank + 1) * 5;
      });
      state.selectedSlot = order[order.length - 1];
    } else if (preset === 'scores') {
      const sample = [42, 38, 31, 27, 24, 19, 15, 11];
      order.forEach((slot, rank) => {
        next[slot] = sample[rank];
      });
      state.selectedSlot = order[0];
    }
    state.slotValues = next;
  };

  // --------------------------------------------------------------------------
  // Renderers
  // --------------------------------------------------------------------------

  const renderCategoryTabs = () => {
    const wrap = $('#category-tabs');
    if (!wrap) return;
    const allPalettes = engine.getAllPalettes(getDynamicParams());
    const tabs = [
      { id: 'all', label: `All (${allPalettes.length})` },
      ...engine.PALETTE_GROUPS.map((g) => ({
        id: g.id,
        label: `${g.shortLabel} (${allPalettes.filter((p) => p.group === g.id).length})`,
      })),
    ];

    wrap.innerHTML = tabs
      .map((t) => {
        const isActive = t.id === state.category;
        return `<button type="button" class="cat-tab${isActive ? ' active' : ''}" role="tab" aria-selected="${isActive}" data-cat="${t.id}">${escapeHtml(t.label)}</button>`;
      })
      .join('');
  };

  const renderPaletteCatalog = () => {
    const grid = $('#palette-catalog-grid');
    if (!grid) return;
    const all = engine.getAllPalettes(getDynamicParams());
    const visible =
      state.category === 'all'
        ? all
        : all.filter((p) => p.group === state.category);

    grid.innerHTML = visible
      .map((p) => {
        const isActive = p.id === state.paletteId;
        const sorted = p.isRamp ? p.colors : engine.sortColorsByHue(p.colors);
        const simDots = sorted.map((hex) =>
          engine.simulateCvdHex(hex, state.visionMode),
        );
        const badge = p.shipped
          ? 'In app'
          : p.isDynamic
            ? 'Live'
            : p.isRamp
              ? 'Ramp'
              : '';
        return `
          <button
            type="button"
            class="palette-card-btn${isActive ? ' active' : ''}"
            role="radio"
            aria-checked="${isActive}"
            data-palette-id="${p.id}"
          >
            <span class="palette-card-top">
              <span class="palette-card-name">${escapeHtml(p.label)}</span>
              ${badge ? `<span class="palette-mini-tag">${escapeHtml(badge)}</span>` : ''}
            </span>
            <span class="palette-dots-row" aria-hidden="true">
              ${simDots.map((hex) => `<span style="background-color: ${hex}"></span>`).join('')}
            </span>
            <span class="palette-card-sub">${escapeHtml(p.tagline)}</span>
          </button>
        `;
      })
      .join('');
  };

  const renderDynamicControls = () => {
    const extra = $('#dynamic-extra');
    const hint = $('#theme-hue-hint');
    if (!extra) return;

    if (state.paletteId === 'tonal') {
      if (hint) hint.textContent = 'Actively driving all 8 Tonal slots';
      extra.hidden = false;
      extra.innerHTML = `
        <div class="dyn-row">
          <span class="dock-label">Tonal harmony</span>
          <div class="mini-seg" id="tonal-mode-seg">
            <button type="button" class="mini-seg-btn${state.tonalMode === 'analogous' ? ' active' : ''}" data-tonal-mode="analogous">Analogous</button>
            <button type="button" class="mini-seg-btn${state.tonalMode === 'monochromatic' ? ' active' : ''}" data-tonal-mode="monochromatic">Monochromatic</button>
          </div>
        </div>
      `;
      return;
    }

    if (hint) hint.textContent = 'Drives accents & Tonal';

    if (state.paletteId === 'shuffle') {
      extra.hidden = false;
      extra.innerHTML = `
        <div class="dyn-row">
          <button type="button" class="action-pill-btn primary" id="btn-roll-shuffle">
            🎲 Roll 8 colors
          </button>
          <div class="mini-seg" id="shuffle-style-seg">
            <button type="button" class="mini-seg-btn${state.shuffleStyle === 'vivid' ? ' active' : ''}" data-shuffle-style="vivid">Vivid</button>
            <button type="button" class="mini-seg-btn${state.shuffleStyle === 'luminous' ? ' active' : ''}" data-shuffle-style="luminous">Luminous</button>
          </div>
        </div>
        <div class="dyn-chip-row" aria-label="Recent shuffle seeds">
          ${state.shuffleHistory
            .map(
              (seed) =>
                `<button type="button" class="dyn-chip${seed === state.shuffleSeed ? ' active' : ''}" data-seed="${escapeHtml(seed)}">#${escapeHtml(seed)}</button>`,
            )
            .join('')}
        </div>
      `;
      return;
    }

    if (state.paletteId === 'sky') {
      const sky = getActivePalette();
      const { phase, timeLabel } = sky.dynamicParams;
      extra.hidden = false;
      extra.innerHTML = `
        <div class="dyn-row">
          <span class="dock-label">Sky time <span class="dock-sub" id="sky-time-readout">${escapeHtml(phase)} · ${escapeHtml(timeLabel)}</span></span>
          <button type="button" class="dyn-chip${state.skyPlaying ? ' active' : ''}" id="btn-sky-play">${state.skyPlaying ? '⏸ Pause 24h' : '▶ Timelapse'}</button>
        </div>
        <input type="range" id="sky-time-slider" class="sky-slider" min="0" max="1439" value="${Math.round(state.skyMinutes)}" aria-label="Time of day in minutes" />
        <div class="dyn-chip-row">
          <button type="button" class="dyn-chip" data-sky-preset="360">Dawn</button>
          <button type="button" class="dyn-chip" data-sky-preset="780">Midday</button>
          <button type="button" class="dyn-chip" data-sky-preset="1065">Golden hour</button>
          <button type="button" class="dyn-chip" data-sky-preset="1230">Twilight</button>
          <button type="button" class="dyn-chip" data-sky-preset="0">Midnight</button>
          <button type="button" class="dyn-chip" data-sky-preset="now">Now</button>
        </div>
      `;
      return;
    }

    extra.hidden = true;
    extra.innerHTML = '';
  };

  const renderSimulator = (palette, audit) => {
    const device = $('#counters-device');
    if (!device) return;
    device.setAttribute('data-layout', state.layoutMode);
    device.setAttribute('data-sim-tab', state.simTab);

    const orderedSlots = getBoardSlots(palette);

    // 1. Leader Bar & Ambient Glow
    const leaderPill = $('#sim-leader-pill');
    const leaderText = $('#sim-leader-text');
    const leaderIcon = $('#sim-leader-icon svg');

    if (state.leaderMode === 'total') {
      const sum = state.slotValues.reduce((acc, v) => acc + v, 0);
      leaderPill.style.removeProperty('--leader-bg');
      leaderPill.style.removeProperty('--leader-border');
      leaderPill.style.removeProperty('--leader-ink');
      if (leaderIcon) {
        leaderIcon.innerHTML = '<path d="M19 18v2H5v-2l6-6-6-6V4h14v2h-9.35L14 12l-4.35 6H19z"/>';
      }
      leaderText.textContent = `Total: ${sum}`;
      updateAmbientGlow(null);
    } else {
      const isLowest = state.leaderMode === 'lowest';
      const sortedByScore = [...orderedSlots].sort((a, b) =>
        isLowest
          ? state.slotValues[a] - state.slotValues[b]
          : state.slotValues[b] - state.slotValues[a],
      );
      const leaderSlot = sortedByScore[0];
      const rawLeaderHex = palette.colors[leaderSlot];
      const dispLeaderHex = audit.swatches[leaderSlot].displayHex;
      const ink =
        state.theme === 'dark'
          ? engine.getInkOnDarkTint(dispLeaderHex)
          : engine.getInkOnLightTint(dispLeaderHex);

      leaderPill.style.setProperty('--leader-bg', `${dispLeaderHex}1c`);
      leaderPill.style.setProperty('--leader-border', `${ink}4d`);
      leaderPill.style.setProperty('--leader-ink', ink);
      if (leaderIcon) {
        leaderIcon.innerHTML = isLowest
          ? '<path d="M11 16.172V4h2v12.172l5.364-5.364 1.414 1.414L12 20l-7.778-7.778 1.414-1.414L11 16.172z"/>'
          : '<path d="M13 7.828V20h-2V7.828l-5.364 5.364-1.414-1.414L12 4l7.778 7.778-1.414 1.414L13 7.828z"/>';
      }
      leaderText.textContent = getCardLabel(palette, leaderSlot);
      updateAmbientGlow(rawLeaderHex);
    }

    // 2. Counters Grid / List View
    const gridEl = $('#sim-counters-grid');
    if (gridEl) {
      gridEl.innerHTML = orderedSlots
        .map((slot) => {
          const sw = audit.swatches[slot];
          const label = getCardLabel(palette, slot);
          const val = state.slotValues[slot];
          const isSelected = slot === state.selectedSlot;
          return `
            <div
              class="sim-counter-card${isSelected ? ' selected-slot' : ''}"
              data-slot-card="${slot}"
              style="--card-theme: ${sw.displayHex}; --card-text: ${sw.text}; --card-label-text: ${sw.headerText};"
            >
              <div class="sim-card-header" data-action="select-slot" data-slot="${slot}" title="Inspect ${escapeHtml(palette.names[slot])} (${sw.hex})">
                <span class="sim-card-label">${escapeHtml(label)}</span>
              </div>
              <div class="sim-card-body">
                <button type="button" class="sim-zone-btn sim-zone-minus" data-action="dec" data-slot="${slot}" aria-label="Subtract 1 from ${escapeHtml(label)}">−</button>
                <button type="button" class="sim-value-btn" data-action="open-calc" data-slot="${slot}" aria-label="${escapeHtml(label)}: ${val}. Inspect in calculator">${val}</button>
                <button type="button" class="sim-zone-btn sim-zone-plus" data-action="inc" data-slot="${slot}" aria-label="Add 1 to ${escapeHtml(label)}">+</button>
              </div>
            </div>
          `;
        })
        .join('');
    }

    // 3. Calculator Bottom Sheet View
    const slotBar = $('#calc-slot-bar');
    const calcSheet = $('#sim-calc-sheet');
    if (slotBar && calcSheet) {
      slotBar.innerHTML = orderedSlots
        .map((slot) => {
          const sw = audit.swatches[slot];
          return `<button type="button" class="calc-slot-dot${slot === state.selectedSlot ? ' active' : ''}" data-calc-slot="${slot}" aria-label="${escapeHtml(palette.names[slot])}" style="background-color: ${sw.displayHex}"></button>`;
        })
        .join('');

      const activeSw = audit.swatches[state.selectedSlot] || audit.swatches[0];
      const tokens = engine.getSheetTokens(activeSw.displayHex);
      const isDark = state.theme === 'dark';
      calcSheet.style.setProperty('--sheet-theme', tokens.sheetTheme);
      calcSheet.style.setProperty('--sheet-text', tokens.sheetText);
      calcSheet.style.setProperty(
        '--sheet-control-ink',
        isDark ? tokens.sheetControlInkDark : tokens.sheetControlInkLight,
      );
      calcSheet.style.setProperty(
        '--sheet-pill-ink',
        isDark ? tokens.sheetInkDark : tokens.sheetInkLight,
      );
      calcSheet.style.setProperty(
        '--sheet-pill-bg',
        `${activeSw.displayHex}${isDark ? '26' : '1a'}`,
      );
      calcSheet.style.setProperty('--sheet-pill-border', `${activeSw.displayHex}4d`);

      $('#sim-calc-pill').textContent = `${getCardLabel(palette, state.selectedSlot)} · ${palette.names[state.selectedSlot]}`;
      $('#sim-calc-cur').textContent = `Current: ${state.slotValues[state.selectedSlot]}`;
      const prefix = state.calcSign === 'minus' ? '−' : '+';
      $$('#sim-quick-grid .sim-quick-btn').forEach((btn) => {
        btn.textContent = `${prefix}${btn.dataset.quick}`;
      });
      $$('#sim-calc-sign .sign-opt').forEach((el) => {
        el.classList.toggle('active', el.dataset.sign === state.calcSign);
      });
    }

    // 4. Picker Stage View
    const ringsWrap = $('#sim-picker-rings');
    const winnerBg = $('#sim-picker-winner-bg');
    const pickerStatus = $('#sim-picker-status');
    if (ringsWrap && winnerBg && pickerStatus) {
      const positions = [
        [24, 22],
        [76, 22],
        [17, 50],
        [83, 50],
        [24, 78],
        [76, 78],
        [50, 17],
        [50, 83],
      ];
      ringsWrap.innerHTML = orderedSlots
        .map((slot, idx) => {
          const sw = audit.swatches[slot];
          const [px, py] = positions[idx];
          const isWin = state.pickerWinnerSlot === slot;
          return `<div class="sim-picker-ring${isWin ? ' winner' : ''}" style="left: ${px}%; top: ${py}%; --ring-color: ${sw.displayHex};">${escapeHtml(palette.names[slot].split(' ')[0])}</div>`;
        })
        .join('');

      if (state.pickerWinnerSlot !== null) {
        const winSw = audit.swatches[state.pickerWinnerSlot];
        winnerBg.style.backgroundColor = winSw.displayHex;
        winnerBg.classList.add('active');
        pickerStatus.textContent = `Winner: ${palette.names[state.pickerWinnerSlot]}!`;
      } else {
        winnerBg.classList.remove('active');
        pickerStatus.textContent = '8 palette players ready';
      }
    }

    // 5. Settings In-App Preview
    const settingsGrid = $('#sim-settings-palette-grid');
    if (settingsGrid) {
      const sampleIds = [
        palette.id,
        ...['bold', 'pastel', 'nautical', 'vaporwave'].filter((id) => id !== palette.id).slice(0, 3),
      ];
      settingsGrid.innerHTML = sampleIds
        .map((id) => {
          const p = engine.resolvePalette(id, getDynamicParams());
          const sorted = p.isRamp ? p.colors : engine.sortColorsByHue(p.colors);
          const isCur = id === palette.id;
          return `
            <button type="button" class="palette-card-btn${isCur ? ' active' : ''}" data-palette-id="${p.id}" style="min-height: 66px;">
              <span class="palette-card-name">${escapeHtml(p.label)}</span>
              <span class="palette-dots-row">
                ${sorted
                  .map((c) => `<span style="background-color: ${engine.simulateCvdHex(c, state.visionMode)}"></span>`)
                  .join('')}
              </span>
            </button>
          `;
        })
        .join('');
    }
  };

  const renderInspector = (palette, audit) => {
    $('#inspector-palette-name').textContent = palette.label;
    const groupMeta = engine.PALETTE_GROUPS.find((g) => g.id === palette.group);
    $('#inspector-group-badge').textContent = groupMeta ? groupMeta.label : palette.group;
    $('#inspector-palette-notes').textContent = palette.notes;

    const polarityText =
      audit.polarityMode === 'uniform-white'
        ? 'Uniform white ✓'
        : audit.polarityMode === 'uniform-black'
          ? 'Uniform dark ✓'
          : 'Adaptive B/W';
    $('#metric-polarity').textContent = polarityText;
    $('#metric-contrast').textContent = `${audit.minContrast.toFixed(2)}:1 AA ✓`;
    $('#metric-delta-label').textContent =
      state.visionMode === 'normal'
        ? 'Min OKLab ΔE'
        : `ΔE (${state.visionMode.slice(0, 6)})`;
    $('#metric-delta').textContent = String(audit.minPairwiseDeltaE);

    // 8 Swatch Value Chips
    const swatchGrid = $('#swatch-values-grid');
    if (swatchGrid) {
      swatchGrid.innerHTML = audit.swatches
        .map((sw) => {
          const isSelected = sw.slot === state.selectedSlot;
          const inkTag = sw.text === '#ffffff' ? 'W' : 'B';
          return `
            <button
              type="button"
              class="swatch-chip-btn${isSelected ? ' active-slot' : ''}"
              data-swatch-slot="${sw.slot}"
              data-copy-hex="${sw.hex}"
              title="Slot ${sw.slot} (${engine.SLOT_FAMILIES[sw.slot]}): click to copy ${sw.hex}"
            >
              <span class="swatch-color-preview" style="--sw-body: ${sw.displayHex}; --sw-text: ${sw.text};">
                <span class="swatch-preview-hdr"></span>
                <span class="swatch-preview-row">
                  <span>S${sw.slot}</span>
                  <span>${sw.hex.toUpperCase()}</span>
                </span>
              </span>
              <span class="swatch-meta">
                <span class="swatch-name">${escapeHtml(palette.names[sw.slot])}</span>
                <span class="swatch-contrast">${sw.minContrast.toFixed(1)}:1 ${inkTag}</span>
              </span>
            </button>
          `;
        })
        .join('');
    }

    // Slot Migration vs Bold
    const migStrip = $('#slot-migration-strip');
    if (migStrip) {
      const boldColors = engine.STATIC_PALETTES.bold.colors;
      migStrip.innerHTML = audit.swatches
        .map((sw, idx) => {
          const fromHex = engine.simulateCvdHex(boldColors[idx], state.visionMode);
          return `
            <div class="migration-col" title="Slot ${idx}: Bold ${engine.STATIC_PALETTES.bold.names[idx]} → ${palette.label} ${palette.names[idx]}">
              <span class="mig-slot-id">S${idx}</span>
              <span class="mig-dot" style="background-color: ${fromHex}"></span>
              <span class="mig-arrow">↓</span>
              <span class="mig-dot" style="background-color: ${sw.displayHex}"></span>
            </div>
          `;
        })
        .join('');
    }

    // JS Export Snippet
    const codeSnippet = $('#code-snippet');
    const codeDrawer = $('#code-drawer');
    const toggleBtn = $('#btn-toggle-code');
    if (codeSnippet && codeDrawer && toggleBtn) {
      codeSnippet.textContent = engine.formatPaletteForCounters(palette);
      codeDrawer.hidden = !state.showCode;
      toggleBtn.textContent = state.showCode ? 'Hide JS' : 'Show JS';
    }
  };

  const renderAll = () => {
    const palette = getActivePalette();
    const audit = engine.auditPalette(palette.colors, state.visionMode);
    applyStudioAccent();
    renderCategoryTabs();
    renderPaletteCatalog();
    renderDynamicControls();
    renderSimulator(palette, audit);
    renderInspector(palette, audit);
    syncHash();
  };

  // Stop Sky timelapse if active
  const stopSkyTimelapse = () => {
    state.skyPlaying = false;
    if (state.skyRafId !== null) {
      cancelAnimationFrame(state.skyRafId);
      state.skyRafId = null;
    }
  };

  const startSkyTimelapse = () => {
    stopSkyTimelapse();
    state.skyPlaying = true;
    let lastTs = null;
    const step = (ts) => {
      if (!state.skyPlaying || state.paletteId !== 'sky') {
        stopSkyTimelapse();
        return;
      }
      if (lastTs !== null) {
        const dt = ts - lastTs;
        // Full 24h cycle in ~12 seconds (120 sky-minutes per second)
        state.skyMinutes = (state.skyMinutes + dt * 0.12) % 1440;
        const slider = $('#sky-time-slider');
        if (slider) slider.value = String(Math.round(state.skyMinutes));
        const palette = getActivePalette();
        const audit = engine.auditPalette(palette.colors, state.visionMode);
        const readout = $('#sky-time-readout');
        if (readout) {
          readout.textContent = `${palette.dynamicParams.phase} · ${palette.dynamicParams.timeLabel}`;
        }
        renderPaletteCatalog();
        renderSimulator(palette, audit);
        renderInspector(palette, audit);
      }
      lastTs = ts;
      state.skyRafId = requestAnimationFrame(step);
    };
    state.skyRafId = requestAnimationFrame(step);
  };

  const rollNewShuffleSeed = () => {
    const alphabet = '0123456789ABCDEF';
    let seed = '';
    for (let i = 0; i < 6; i++) {
      seed += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    state.shuffleSeed = seed;
    state.shuffleHistory = [
      seed,
      ...state.shuffleHistory.filter((s) => s !== seed),
    ].slice(0, 5);
  };

  const selectPalette = (id) => {
    if (!engine.PALETTE_ORDER.includes(id)) return;
    const reClickingShuffle = id === 'shuffle' && state.paletteId === 'shuffle';
    if (id !== 'sky') stopSkyTimelapse();
    state.paletteId = id;
    state.pickerWinnerSlot = null;
    if (reClickingShuffle) {
      rollNewShuffleSeed();
    }
    // Automatically switch ramp palettes to Heat 1-8 if still untouched on demo? Keep user's choice predictable unless they click Heat 1-8!
    renderAll();
  };

  const stepPalette = (delta) => {
    const idx = engine.PALETTE_ORDER.indexOf(state.paletteId);
    const nextIdx = (idx + delta + engine.PALETTE_ORDER.length) % engine.PALETTE_ORDER.length;
    selectPalette(engine.PALETTE_ORDER[nextIdx]);
  };

  const setSimTab = (tabName) => {
    state.simTab = tabName;
    $('#sim-header-title').textContent =
      tabName === 'counters'
        ? 'Counters'
        : tabName === 'calculator'
          ? 'Calculator'
          : tabName === 'picker'
            ? 'Picker'
            : 'Settings';
    $$('[data-sim-panel]').forEach((panel) => {
      const active = panel.dataset.simPanel === tabName;
      panel.hidden = !active;
      panel.classList.toggle('active', active);
    });
    $$('[data-sim-tab-btn]').forEach((btn) => {
      const active = btn.dataset.simTabBtn === tabName;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', String(active));
    });
    renderAll();
  };

  // --------------------------------------------------------------------------
  // Event Delegation & Bindings
  // --------------------------------------------------------------------------

  const bindEvents = () => {
    // Category tabs
    $('#category-tabs')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-cat]');
      if (!btn) return;
      state.category = btn.dataset.cat;
      renderAll();
    });

    // Palette catalog clicks + arrow key nav
    const catalog = $('#palette-catalog-grid');
    catalog?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-palette-id]');
      if (!btn) return;
      selectPalette(btn.dataset.paletteId);
    });

    catalog?.addEventListener('keydown', (e) => {
      if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
      e.preventDefault();
      const delta = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
      stepPalette(delta);
      catalog.querySelector(`[data-palette-id="${state.paletteId}"]`)?.focus();
    });

    // Prev / Next palette buttons + Global [ and ] keys
    $('#btn-prev-palette')?.addEventListener('click', () => stepPalette(-1));
    $('#btn-next-palette')?.addEventListener('click', () => stepPalette(1));

    document.addEventListener('keydown', (e) => {
      if (e.target.matches('input, textarea')) return;
      if (e.key === '[') {
        e.preventDefault();
        stepPalette(-1);
      } else if (e.key === ']') {
        e.preventDefault();
        stepPalette(1);
      } else if ((e.key === 'r' || e.key === 'R') && state.paletteId === 'shuffle') {
        e.preventDefault();
        rollNewShuffleSeed();
        renderAll();
      }
    });

    // Vision simulation
    $('#vision-mode-group')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-vision]');
      if (!btn) return;
      state.visionMode = btn.dataset.vision;
      $$('#vision-mode-group [data-vision]').forEach((b) => {
        const active = b.dataset.vision === state.visionMode;
        b.classList.toggle('active', active);
        b.setAttribute('aria-pressed', String(active));
      });
      renderAll();
    });

    // Dark / Light mode
    $('#theme-mode-group')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-theme-mode]');
      if (!btn) return;
      applyStudioTheme(btn.dataset.themeMode);
      renderAll();
    });

    $('#sim-inner-theme-group')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-inner-theme]');
      if (!btn) return;
      applyStudioTheme(btn.dataset.innerTheme);
      renderAll();
    });

    // Copy JS button
    $('#btn-copy-code')?.addEventListener('click', () => {
      const palette = getActivePalette();
      copyText(
        engine.formatPaletteForCounters(palette),
        `Copied ${palette.label} snippet for Counters`,
      );
    });

    $('#btn-toggle-code')?.addEventListener('click', () => {
      state.showCode = !state.showCode;
      renderInspector(
        getActivePalette(),
        engine.auditPalette(getActivePalette().colors, state.visionMode),
      );
    });

    // Theme Hue Slider
    $('#studio-theme-hue')?.addEventListener('input', (e) => {
      state.themeHue = Number(e.target.value);
      renderAll();
    });

    // Dynamic Sub-controls delegation
    const dynExtra = $('#dynamic-extra');
    dynExtra?.addEventListener('click', (e) => {
      const tonalBtn = e.target.closest('[data-tonal-mode]');
      if (tonalBtn) {
        state.tonalMode = tonalBtn.dataset.tonalMode;
        renderAll();
        return;
      }
      const styleBtn = e.target.closest('[data-shuffle-style]');
      if (styleBtn) {
        state.shuffleStyle = styleBtn.dataset.shuffleStyle;
        renderAll();
        return;
      }
      if (e.target.closest('#btn-roll-shuffle')) {
        rollNewShuffleSeed();
        renderAll();
        return;
      }
      const seedChip = e.target.closest('[data-seed]');
      if (seedChip) {
        state.shuffleSeed = seedChip.dataset.seed;
        renderAll();
        return;
      }
      if (e.target.closest('#btn-sky-play')) {
        if (state.skyPlaying) {
          stopSkyTimelapse();
          renderDynamicControls();
        } else {
          startSkyTimelapse();
          renderDynamicControls();
        }
        return;
      }
      const skyPreset = e.target.closest('[data-sky-preset]');
      if (skyPreset) {
        stopSkyTimelapse();
        const raw = skyPreset.dataset.skyPreset;
        state.skyMinutes = raw === 'now' ? nowLocalMinutes() : Number(raw);
        renderAll();
      }
    });

    dynExtra?.addEventListener('input', (e) => {
      if (e.target.id === 'sky-time-slider') {
        stopSkyTimelapse();
        state.skyMinutes = Number(e.target.value);
        const palette = getActivePalette();
        const audit = engine.auditPalette(palette.colors, state.visionMode);
        const readout = $('#sky-time-readout');
        if (readout) {
          readout.textContent = `${palette.dynamicParams.phase} · ${palette.dynamicParams.timeLabel}`;
        }
        renderPaletteCatalog();
        renderSimulator(palette, audit);
        renderInspector(palette, audit);
      }
    });

    // Board Toolbar Controls
    $('#board-order-group')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-order]');
      if (!btn) return;
      state.boardOrder = btn.dataset.order;
      $$('#board-order-group [data-order]').forEach((b) => {
        const active = b.dataset.order === state.boardOrder;
        b.classList.toggle('active', active);
        b.setAttribute('aria-pressed', String(active));
      });
      renderAll();
    });

    $('#board-label-group')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-label-mode]');
      if (!btn) return;
      state.labelMode = btn.dataset.labelMode;
      $$('#board-label-group [data-label-mode]').forEach((b) => {
        const active = b.dataset.labelMode === state.labelMode;
        b.classList.toggle('active', active);
        b.setAttribute('aria-pressed', String(active));
      });
      renderAll();
    });

    $('#board-preset-group')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-preset]');
      if (!btn) return;
      applyValuePreset(btn.dataset.preset);
      $$('#board-preset-group [data-preset]').forEach((b) => {
        const active = b.dataset.preset === state.valuePreset;
        b.classList.toggle('active', active);
        b.setAttribute('aria-pressed', String(active));
      });
      renderAll();
    });

    $('#board-layout-group')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-layout-mode]');
      if (!btn) return;
      state.layoutMode = btn.dataset.layoutMode;
      $$('#board-layout-group [data-layout-mode]').forEach((b) => {
        const active = b.dataset.layoutMode === state.layoutMode;
        b.classList.toggle('active', active);
        b.setAttribute('aria-pressed', String(active));
      });
      renderAll();
    });

    // Simulator Header Controls
    $('#sim-leader-pill')?.addEventListener('click', () => {
      const modes = ['highest', 'lowest', 'total'];
      state.leaderMode = modes[(modes.indexOf(state.leaderMode) + 1) % modes.length];
      renderAll();
    });

    $('#sim-btn-bump')?.addEventListener('click', () => {
      state.slotValues = state.slotValues.map(() => Math.floor(Math.random() * 50));
      renderAll();
    });

    $('#sim-btn-reset')?.addEventListener('click', () => {
      state.slotValues = [0, 0, 0, 0, 0, 0, 0, 0];
      renderAll();
    });

    // Simulator Counter Cards Interaction
    $('#sim-counters-grid')?.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;
      const slot = Number(target.dataset.slot);
      state.selectedSlot = slot;
      if (target.dataset.action === 'inc') {
        state.slotValues[slot] += 1;
      } else if (target.dataset.action === 'dec') {
        state.slotValues[slot] -= 1;
      } else if (target.dataset.action === 'open-calc') {
        setSimTab('calculator');
        return;
      }
      renderAll();
    });

    // Calculator Interactive Controls
    $('#calc-slot-bar')?.addEventListener('click', (e) => {
      const dot = e.target.closest('[data-calc-slot]');
      if (!dot) return;
      state.selectedSlot = Number(dot.dataset.calcSlot);
      renderAll();
    });

    $('#sim-calc-sign')?.addEventListener('click', () => {
      state.calcSign = state.calcSign === 'plus' ? 'minus' : 'plus';
      renderAll();
    });

    $('#sim-quick-grid')?.addEventListener('click', (e) => {
      const q = e.target.closest('[data-quick]');
      if (!q) return;
      const delta = Number(q.dataset.quick) * (state.calcSign === 'minus' ? -1 : 1);
      state.slotValues[state.selectedSlot] += delta;
      renderAll();
    });

    $('#sim-calc-add-btn')?.addEventListener('click', () => {
      state.slotValues[state.selectedSlot] += 25;
      renderAll();
    });

    $('#sim-calc-sub-btn')?.addEventListener('click', () => {
      state.slotValues[state.selectedSlot] -= 25;
      renderAll();
    });

    // Picker Winner Button
    $('#sim-btn-pick-winner')?.addEventListener('click', () => {
      state.pickerWinnerSlot = Math.floor(Math.random() * 8);
      state.selectedSlot = state.pickerWinnerSlot;
      renderAll();
    });

    // Settings Palette Mini Grid inside simulator
    $('#sim-settings-palette-grid')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-palette-id]');
      if (!btn) return;
      selectPalette(btn.dataset.paletteId);
    });

    // Simulator Bottom Nav Tabs
    $('.sim-app-nav')?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-sim-tab-btn]');
      if (!btn) return;
      setSimTab(btn.dataset.simTabBtn);
    });

    // Swatch Values Inspector (click to copy hex & select slot)
    $('#swatch-values-grid')?.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-swatch-slot]');
      if (!chip) return;
      const slot = Number(chip.dataset.swatchSlot);
      state.selectedSlot = slot;
      const hex = chip.dataset.copyHex;
      const palette = getActivePalette();
      copyText(hex, `Copied ${palette.names[slot]} (${hex.toUpperCase()})`);
      renderAll();
    });

    window.addEventListener('hashchange', () => {
      readHashPalette();
      renderAll();
    });
  };

  // Boot
  readHashPalette();
  applyStudioTheme(state.theme);
  applyValuePreset('demo');
  bindEvents();
  renderAll();
})();
