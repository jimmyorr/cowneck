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

    return { errors };
}

test.describe('Palettes for Counters — Projects entry, catalog, simulator & dynamic engines', () => {
    test('Projects hub links to Palettes and renders all 24 palettes & 8 live counter slots cleanly', async ({ browser }) => {
        const context = await browser.newContext({
            viewport: { width: 1360, height: 860 },
        });
        const page = await context.newPage();
        const { errors } = await attachGuards(page);

        await page.goto('/projects/');
        const card = page.locator('#project-card-palettes');
        await expect(card).toBeVisible();
        await expect(card.locator('.project-title')).toHaveText('Palettes');
        await card.click();

        await expect(page).toHaveURL(/\/palettes\/(#bold)?$/);
        await expect(page.getByRole('heading', { name: 'Palettes', exact: true })).toBeVisible();

        // All 24 palettes rendered initially
        await expect(page.locator('#palette-catalog-grid [data-palette-id]')).toHaveCount(24);
        // All 8 counter cards rendered in the 2x4 grid simulator
        await expect(page.locator('#sim-counters-grid .sim-counter-card')).toHaveCount(8);
        // All 8 swatch value chips visible at once in inspector
        await expect(page.locator('#swatch-values-grid [data-swatch-slot]')).toHaveCount(8);

        // Measure device frame geometry to ensure zero layout bounce & full viewport fit
        const measureDeviceRect = () =>
            page.locator('#counters-device').evaluate((el) => {
                const r = el.getBoundingClientRect();
                return { top: Math.round(r.top), left: Math.round(r.left), width: Math.round(r.width), height: Math.round(r.height), bottom: Math.round(r.bottom) };
            });

        const baseDeviceRect = await measureDeviceRect();
        expect(baseDeviceRect.bottom).toBeLessThanOrEqual(860);
        await expect(page.locator('#sim-leader-text')).toHaveText('Crane');

        // Switch to Thermal (Wild ramp palette) and verify Heat 1-8 preset + hash update
        await page.locator('#palette-catalog-grid [data-palette-id="thermal"]').click();
        await expect(page).toHaveURL(/#thermal$/);
        await expect(page.locator('#inspector-palette-name')).toHaveText('Thermal');
        await expect(page.locator('#metric-polarity')).toHaveText('Adaptive B/W');
        expect(await measureDeviceRect()).toEqual(baseDeviceRect);

        await page.locator('#board-preset-group [data-preset="heat"]').click();
        await expect(page.locator('#sim-leader-text')).toHaveText('Crane');

        // Switch label mode to Names & Hex
        await page.locator('#board-label-group [data-label-mode="colors"]').click();
        await expect(page.locator('#sim-leader-text')).toHaveText('White-hot');
        await page.locator('#board-label-group [data-label-mode="hex"]').click();
        await expect(page.locator('#sim-leader-text')).toHaveText('#FFF9DB');
        await page.locator('#board-label-group [data-label-mode="birds"]').click();

        // Test Dynamic Palette 1: Tonal (reacts live to Theme color slider)
        await page.locator('#palette-catalog-grid [data-palette-id="tonal"]').click();
        await expect(page.locator('#tonal-mode-seg')).toBeVisible();
        const beforeTonalHex = await page.locator('#swatch-values-grid [data-swatch-slot="0"]').getAttribute('data-copy-hex');
        await page.locator('#studio-theme-hue').fill('25');
        await page.locator('#studio-theme-hue').dispatchEvent('input');
        const afterTonalHex = await page.locator('#swatch-values-grid [data-swatch-slot="0"]').getAttribute('data-copy-hex');
        expect(afterTonalHex).not.toBe(beforeTonalHex);
        await page.locator('[data-tonal-mode="monochromatic"]').click();
        await expect(page.locator('#metric-polarity')).toHaveText('Adaptive B/W');

        // Test Dynamic Palette 2: Shuffle (golden-angle seed roller)
        await page.locator('#palette-catalog-grid [data-palette-id="shuffle"]').click();
        const seedBefore = await page.locator('#dynamic-extra .dyn-chip.active').textContent();
        await page.locator('#btn-roll-shuffle').click();
        const seedAfter = await page.locator('#dynamic-extra .dyn-chip.active').textContent();
        expect(seedAfter).not.toBe(seedBefore);

        // Test Dynamic Palette 3: Sky (time-of-day presets)
        await page.locator('#palette-catalog-grid [data-palette-id="sky"]').click();
        await page.locator('[data-sky-preset="360"]').click();
        await expect(page.locator('#sky-time-readout')).toContainText('Dawn');
        await expect(page.locator('#metric-polarity')).toHaveText('Uniform dark ✓');
        await page.locator('[data-sky-preset="0"]').click();
        await expect(page.locator('#sky-time-readout')).toContainText('Midnight');
        await expect(page.locator('#metric-polarity')).toHaveText('Uniform white ✓');

        // Test Simulator Tabs: Calculator, Picker, Settings
        await page.locator('[data-sim-tab-btn="calculator"]').click();
        await expect(page.locator('#sim-view-calculator')).toBeVisible();
        await page.locator('#sim-calc-add-btn').click();

        await page.locator('[data-sim-tab-btn="picker"]').click();
        await expect(page.locator('#sim-view-picker')).toBeVisible();
        await page.locator('#sim-btn-pick-winner').click();
        await expect(page.locator('#sim-picker-status')).toContainText('Winner:');

        await page.locator('[data-sim-tab-btn="settings"]').click();
        await expect(page.locator('#sim-view-settings')).toBeVisible();

        // Test Vision CVD Simulation & Light Mode
        await page.locator('[data-vision="deuteranopia"]').click();
        await expect(page.locator('#metric-delta-label')).toContainText('deuter');
        await page.locator('[data-theme-mode="light"]').click();
        await expect(page.locator('html')).toHaveClass(/light-mode/);

        expect(errors).toEqual([]);
        await context.close();
    });

    test('Mobile layout renders cleanly with zero horizontal overflow', async ({ browser }) => {
        const context = await browser.newContext({
            viewport: { width: 390, height: 844 },
        });
        const page = await context.newPage();
        const { errors } = await attachGuards(page);

        await page.goto('/palettes/#risograph');
        await expect(page.locator('#inspector-palette-name')).toHaveText('Risograph');

        const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow).toBeLessThanOrEqual(0);
        expect(errors).toEqual([]);
        await context.close();
    });
});
