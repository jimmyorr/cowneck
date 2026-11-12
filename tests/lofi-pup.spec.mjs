import { expect, test } from '@playwright/test';

async function attachGuards(page) {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
        if (msg.type() === 'error') {
            errors.push(msg.text());
        }
    });

    await page.route('**/*', (route) => {
        const url = new URL(route.request().url());
        if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
            return route.continue();
        }
        return route.fulfill({ status: 204, body: '' });
    });

    return errors;
}

test.describe('Lofi Pup generative studio', () => {
    test('loads offline without external dependencies, renders 6-stem mixer and clean vinyl/room textures, and encapsulates state', async ({ page }) => {
        const errors = await attachGuards(page);
        await page.goto('/games/lofi-pup.html');

        await expect(page).toHaveTitle(/Lofi Pup/);
        await expect(page.locator('h1')).toContainText('Lofi Pup');
        await expect(page.locator('#status-text')).toHaveText('Ready');
        await expect(page.locator('#filter-val')).toHaveText('1950Hz');
        await expect(page.locator('#wobble-val')).toHaveText('Subtle');
        await expect(page.locator('#space-val')).toHaveText('44%');
        await expect(page.locator('#chord-display')).toHaveText('--');
        await expect(page.locator('#seed-code')).toHaveText(/^[A-Z]+-\d{3}$/);

        // Score minigame clutter is completely gone
        await expect(page.locator('#score-val')).toHaveCount(0);

        // Verify all 6 studio mixer channels are present and active
        for (const stem of ['kick', 'snare', 'hihat', 'bass', 'chord', 'lead']) {
            await expect(page.locator(`#mix-${stem}`)).toHaveAttribute('aria-pressed', 'true');
            await expect(page.locator(`[data-mixer-volume="${stem}"]`)).toBeVisible();
        }

        // Verify vinyl & cafe room textures are present while synthetic rain drips & night crickets are gone
        for (const amb of ['vinyl', 'cafe']) {
            await expect(page.locator(`#amb-${amb}`)).toBeVisible();
        }
        await expect(page.locator('#amb-rain')).toHaveCount(0);
        await expect(page.locator('#amb-night')).toHaveCount(0);

        // Verify GA4 config function is defined and module state does not leak globals
        const globalsCheck = await page.evaluate(() => ({
            hasGtag: typeof window.gtag === 'function',
            hasDataLayerConfig: Array.isArray(window.dataLayer)
                && window.dataLayer.some((entry) => entry[0] === 'config' && entry[1] === 'G-6RNVL7JZVJ'),
            leakedSwitchScene: typeof window.switchScene,
            leakedToggleInstrument: typeof window.toggleInstrument,
        }));
        expect(globalsCheck).toEqual({
            hasGtag: true,
            hasDataLayerConfig: true,
            leakedSwitchScene: 'undefined',
            leakedToggleInstrument: 'undefined',
        });

        // Verify cross-browser vertical fader styling and touch target width
        const bassFaderMetrics = await page.locator('[data-mixer-volume="bass"]').evaluate((el) => {
            const cs = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            return {
                writingMode: cs.writingMode,
                direction: cs.direction,
                width: rect.width,
            };
        });
        expect(bassFaderMetrics.writingMode).toBe('vertical-lr');
        expect(bassFaderMetrics.direction).toBe('rtl');
        expect(bassFaderMetrics.width).toBeGreaterThanOrEqual(20);

        // Verify wobble slider label transitions across all ranges
        const wobble = page.locator('#wobble-slider');
        await wobble.fill('0');
        await wobble.dispatchEvent('input');
        await expect(page.locator('#wobble-val')).toHaveText('Off');

        await wobble.fill('25');
        await wobble.dispatchEvent('input');
        await expect(page.locator('#wobble-val')).toHaveText('Warm');

        await wobble.fill('45');
        await wobble.dispatchEvent('input');
        await expect(page.locator('#wobble-val')).toHaveText('Warped');

        expect(errors).toEqual([]);
    });

    test('survives blocked localStorage (SecurityError in sandboxed iframes)', async ({ page }) => {
        const errors = await attachGuards(page);
        await page.addInitScript(() => {
            const deny = () => {
                throw new DOMException('Storage disabled', 'SecurityError');
            };
            Storage.prototype.getItem = deny;
            Storage.prototype.setItem = deny;
        });

        await page.goto('/games/lofi-pup.html');
        await page.locator('#play-btn').click();
        await expect(page.locator('#play-btn')).toHaveAttribute('aria-pressed', 'true');

        await page.locator('#btn-rainy').click();
        await expect(page.locator('body')).toHaveAttribute('data-scene', 'rainy');

        await page.locator('#save-tape-btn').click();
        await expect(page.locator('#tape-count')).toHaveText('1 saved');

        await page.locator('#radio-mode-btn').click();
        await expect(page.locator('#radio-mode-btn')).toHaveAttribute('aria-pressed', 'false');

        await page.locator('#play-btn').click();
        await expect(page.locator('#status-text')).toHaveText('Paused');
        expect(errors).toEqual([]);
    });

    test('composes seeded tracks, switches 4 cozy scenes live, cycles key/lead voices, and manages stem mutes', async ({ page }) => {
        const errors = await attachGuards(page);
        await page.goto('/games/lofi-pup.html');

        const initialSeed = await page.locator('#seed-code').textContent();

        const playBtn = page.locator('#play-btn');
        await playBtn.click();
        await expect(playBtn).toHaveAttribute('aria-pressed', 'true');
        await expect(playBtn).toHaveAttribute('aria-label', 'Pause');

        // Wait for live voice-led chord symbol to appear
        await expect(page.locator('#chord-display')).not.toHaveText('--', { timeout: 2000 });
        const initialChord = await page.locator('#chord-display').textContent();
        expect(initialChord).toMatch(/^[A-G][b#]?(maj9|add9|6\/9|maj7#11|m9|m11|m6|m7b5|9sus4|13|7b13)$/);

        // Mute chord -> displays "--", then unmute -> immediately restores active chord symbol
        const mixChord = page.locator('#mix-chord');
        await mixChord.click();
        await expect(page.locator('#chord-display')).toHaveText('--');
        await mixChord.click();
        await expect(page.locator('#chord-display')).toHaveText(initialChord);

        // Roll a new track seed while playing
        await page.locator('#new-track-btn').click();
        await expect(page.locator('#seed-code')).not.toHaveText(initialSeed);

        // Cycle key and lead voices during live playback
        await page.locator('#chord-voice-btn').click();
        await expect(page.locator('#chord-voice-val')).toContainText('★');
        await page.locator('#lead-voice-btn').click();
        await expect(page.locator('#lead-voice-val')).toContainText('★');

        // Switch across all 4 isolated musical lanes while playing and verify warmth, room space & dusty jazzhop BPM
        await page.locator('#btn-rainy').click();
        await expect(page.locator('body')).toHaveAttribute('data-scene', 'rainy');
        await expect(page.locator('#amb-vinyl-val')).toHaveText('24%');
        await expect(page.locator('#filter-val')).toHaveText('1620Hz');
        await expect(page.locator('#space-val')).toHaveText('38%');
        await expect(page.locator('#chord-display')).not.toHaveText('--');

        await page.locator('#btn-midnight').click();
        await expect(page.locator('body')).toHaveAttribute('data-scene', 'midnight');
        await expect(page.locator('#amb-vinyl-val')).toHaveText('18%');
        await expect(page.locator('#filter-val')).toHaveText('2050Hz');
        await expect(page.locator('#space-val')).toHaveText('48%');

        await page.locator('#btn-cafe').click();
        await expect(page.locator('body')).toHaveAttribute('data-scene', 'cafe');
        await expect(page.locator('#amb-cafe-val')).toHaveText('44%');
        await expect(page.locator('#filter-val')).toHaveText('2450Hz');
        await expect(page.locator('#space-val')).toHaveText('18%');
        await expect(page.locator('#track-meta')).toHaveText(/jazzhop · (7[89]|8[0-5]) BPM/);

        // Pause playback
        await playBtn.click();
        await expect(page.locator('#status-text')).toHaveText('Paused');
        await expect(page.locator('#chord-display')).toHaveText('--');

        expect(errors).toEqual([]);
    });

    test('opens studio guide modal accessibly, supports keyboard shortcuts, and restores focus on Escape', async ({ page }) => {
        const errors = await attachGuards(page);
        await page.goto('/games/lofi-pup.html');

        // Keyboard shortcut '1' toggles Kick stem mute
        await page.keyboard.press('1');
        await expect(page.locator('#mix-kick')).toHaveAttribute('aria-pressed', 'false');
        await page.keyboard.press('1');
        await expect(page.locator('#mix-kick')).toHaveAttribute('aria-pressed', 'true');

        const helpBtn = page.locator('#help-btn');
        await helpBtn.focus();
        await helpBtn.click();

        const modal = page.locator('#help-modal');
        await expect(modal).toBeVisible();
        await expect(page.locator('#help-title')).toHaveText('Lofi Pup studio guide');

        await page.keyboard.press('Escape');
        await expect(modal).toBeHidden();
        await expect(helpBtn).toBeFocused();

        expect(errors).toEqual([]);
    });

    test('loads shareable seed URLs, edits custom seeds inline, and persists saved cassette tapes', async ({ page }) => {
        const errors = await attachGuards(page);
        await page.goto('/games/lofi-pup.html?scene=midnight&seed=CEDAR-777&keys=felt&lead=celesta');

        await expect(page.locator('body')).toHaveAttribute('data-scene', 'midnight');
        await expect(page.locator('#seed-code')).toHaveText('CEDAR-777');
        await expect(page.locator('#chord-voice-val')).toHaveText('Soft felt ★');
        await expect(page.locator('#lead-voice-val')).toHaveText('Celesta box ★');
        await expect(page.locator('#radio-mode-btn')).toHaveAttribute('aria-pressed', 'false');

        // Save CEDAR-777 to the cassette shelf
        await page.locator('#save-tape-btn').click();
        await expect(page.locator('#save-tape-btn')).toHaveAttribute('aria-pressed', 'true');
        await expect(page.locator('#tape-count')).toHaveText('1 saved');
        await expect(page.locator('[data-load-tape="midnight:CEDAR-777"]')).toBeVisible();

        // Edit custom seed inline and verify normalization + URL permalink sync
        await page.locator('#seed-edit-btn').click();
        const seedInput = page.locator('#seed-input');
        await expect(seedInput).toBeVisible();
        await seedInput.fill('velvet 420');
        await seedInput.press('Enter');

        await expect(page.locator('#seed-code')).toHaveText('VELVET-420');
        await expect(page).toHaveURL(/scene=midnight&seed=VELVET-420/);
        await expect(page.locator('#save-tape-btn')).toHaveAttribute('aria-pressed', 'false');

        // Save second tape and reload without query params to verify persisted shelf
        await page.locator('#btn-cafe').click();
        const cafeSeed = await page.locator('#seed-code').textContent();
        await page.locator('#save-tape-btn').click();
        await expect(page.locator('#tape-count')).toHaveText('2 saved');

        await page.goto('/games/lofi-pup.html');
        await expect(page.locator('#tape-count')).toHaveText('2 saved');

        // Click the first saved tape on the shelf to restore scene, seed, and voice overrides
        await page.locator('[data-load-tape="midnight:CEDAR-777"]').click();
        await expect(page.locator('body')).toHaveAttribute('data-scene', 'midnight');
        await expect(page.locator('#seed-code')).toHaveText('CEDAR-777');
        await expect(page.locator('#chord-voice-val')).toHaveText('Soft felt ★');
        await expect(page.locator('#lead-voice-val')).toHaveText('Celesta box ★');

        // Remove the cafe tape from the shelf
        await page.locator(`[data-remove-tape="cafe:${cafeSeed}"]`).click();
        await expect(page.locator('#tape-count')).toHaveText('1 saved');

        expect(errors).toEqual([]);
    });
});
