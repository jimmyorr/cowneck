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

test.describe('Lofi Pup', () => {
    test('loads offline without external CDNs, syncs slider readouts, and encapsulates state', async ({ page }) => {
        const errors = await attachGuards(page);
        await page.goto('/games/lofi-pup.html');

        await expect(page).toHaveTitle(/Lofi Pup/);
        await expect(page.locator('#status-text')).toHaveText('READY...');
        await expect(page.locator('#filter-val')).toHaveText('800Hz');
        await expect(page.locator('#crackle-val')).toHaveText('15%');
        await expect(page.locator('#wobble-val')).toHaveText('Low');
        await expect(page.locator('#chord-display')).toHaveText('--');
        await expect(page.locator('#chord-display')).toHaveClass(/text-amber-600/);

        // Verify GA4 config function is defined and module state does not leak globals
        const globalsCheck = await page.evaluate(() => ({
            hasGtag: typeof window.gtag === 'function',
            hasDataLayerConfig: Array.isArray(window.dataLayer)
                && window.dataLayer.some((entry) => entry[0] === 'config' && entry[1] === 'G-6RNVL7JZVJ'),
            leakedSwitchStation: typeof window.switchStation,
            leakedToggleInstrument: typeof window.toggleInstrument,
            leakedPoints: typeof window.points,
        }));
        expect(globalsCheck).toEqual({
            hasGtag: true,
            hasDataLayerConfig: true,
            leakedSwitchStation: 'undefined',
            leakedToggleInstrument: 'undefined',
            leakedPoints: 'undefined',
        });

        // Verify cross-browser vertical fader styling and touch target width
        const kickFaderMetrics = await page.locator('[data-mixer-volume="kick"]').evaluate((el) => {
            const cs = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            return {
                writingMode: cs.writingMode,
                direction: cs.direction,
                width: rect.width,
            };
        });
        expect(kickFaderMetrics.writingMode).toBe('vertical-lr');
        expect(kickFaderMetrics.direction).toBe('rtl');
        expect(kickFaderMetrics.width).toBeGreaterThanOrEqual(20);

        // Verify wobble slider label transitions across all ranges
        const wobble = page.locator('#wobble-slider');
        await wobble.fill('0');
        await wobble.dispatchEvent('input');
        await expect(page.locator('#wobble-val')).toHaveText('Off');

        await wobble.fill('30');
        await wobble.dispatchEvent('input');
        await expect(page.locator('#wobble-val')).toHaveText('Medium');

        await wobble.fill('45');
        await wobble.dispatchEvent('input');
        await expect(page.locator('#wobble-val')).toHaveText('High');

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
        await expect(page.locator('#best-score')).toHaveText('0000');

        await page.locator('#play-btn').click();
        await expect(page.locator('#status-text')).toHaveText('PLAYING...');
        await page.locator('#mix-kick').click();

        await page.locator('#play-btn').click();
        await expect(page.locator('#status-text')).toHaveText('PAUSED');
        expect(errors).toEqual([]);
    });

    test('manages playback, instant chord unmute, scoring dedup, and paused station switching', async ({ page }) => {
        const errors = await attachGuards(page);
        await page.goto('/games/lofi-pup.html');

        const playBtn = page.locator('#play-btn');
        await playBtn.click();
        await expect(playBtn).toHaveAttribute('aria-pressed', 'true');
        await expect(playBtn).toHaveAttribute('aria-label', 'Pause');
        await expect(page.locator('#status-text')).toHaveText('PLAYING...');

        // Wait for initial Sunset chord (Dm9) to appear
        await expect(page.locator('#chord-display')).toHaveText('Dm9', { timeout: 2000 });

        // Rapidly click mix-kick twice on the same beat: only the first toggle should score
        await page.evaluate(() => {
            const btn = document.getElementById('mix-kick');
            btn.click();
            btn.click();
        });
        const streakAfterDoubleClick = await page.locator('#streak-val').textContent();
        expect(['x0', 'x1']).toContain(streakAfterDoubleClick);

        // Mute chord -> displays "--", then unmute -> immediately restores "Dm9"
        const mixChord = page.locator('#mix-chord');
        await mixChord.click();
        await expect(page.locator('#chord-display')).toHaveText('--');
        await mixChord.click();
        await expect(page.locator('#chord-display')).toHaveText('Dm9');

        // Pause playback
        await playBtn.click();
        await expect(page.locator('#status-text')).toHaveText('PAUSED');
        await expect(page.locator('#chord-display')).toHaveText('--');

        // Switch station rapidly while paused and confirm PAUSED is restored after banner timeout
        await page.locator('#btn-rainy').click();
        await page.locator('#btn-midnight').click();
        await expect(page.locator('#status-text')).toHaveText('MIDNIGHT NEON');
        await expect(page.locator('#chord-display')).toHaveClass(/text-purple-500/);
        await expect(page.locator('#status-text')).toHaveText('PAUSED', { timeout: 3000 });

        expect(errors).toEqual([]);
    });

    test('opens help modal accessibly and restores focus on Escape', async ({ page }) => {
        const errors = await attachGuards(page);
        await page.goto('/games/lofi-pup.html');

        const helpTrigger = page.locator('[data-help="filter"]');
        await helpTrigger.focus();
        await helpTrigger.click();

        const modal = page.locator('#help-modal');
        await expect(modal).toBeVisible();
        await expect(modal).toHaveAttribute('aria-hidden', 'false');
        await expect(page.locator('#help-title')).toHaveText('Lofi Filter');

        await page.keyboard.press('Escape');
        await expect(modal).toBeHidden();
        await expect(modal).toHaveAttribute('aria-hidden', 'true');
        await expect(helpTrigger).toBeFocused();

        expect(errors).toEqual([]);
    });
});
