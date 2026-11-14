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

async function measureControlPositions(page) {
    return page.evaluate(() => {
        const ids = [
            'btn-prev-step',
            'btn-replay-step',
            'btn-next-step',
            'btn-auto-loop',
            'btn-speed',
            'coach-card',
            'breakdown-card',
            'paper-sheet-wrapper'
        ];
        const out = {};
        for (const id of ids) {
            const r = document.getElementById(id).getBoundingClientRect();
            out[id] = {
                top: Math.round(r.top),
                left: Math.round(r.left),
                width: Math.round(r.width),
                height: Math.round(r.height)
            };
        }
        return out;
    });
}

test.describe('Sketch Pup — Paper Companion verification & zero layout bounce', () => {
    test('Controls stay 100% stationary across all 11 steps despite varying tip lengths (1024x768)', async ({ browser }) => {
        const context = await browser.newContext({
            viewport: { width: 1024, height: 768 },
        });
        const page = await context.newPage();
        const { errors } = await attachGuards(page);

        await page.goto('/games/sketch-pup.html');
        await expect(page.getByRole('heading', { name: /Sketch Pup/i })).toBeVisible();
        await expect(page.locator('#step-counter-badge')).toHaveText('STEP 1 OF 11');

        const baselineRects = await measureControlPositions(page);

        // Step through every single step from Step 1 to Step 11 and verify zero vertical/horizontal bounce
        for (let stepNum = 2; stepNum <= 11; stepNum++) {
            await page.locator('#btn-next-step').click();
            await expect(page.locator('#step-counter-badge')).toHaveText(`STEP ${stepNum} OF 11`);
            const currentRects = await measureControlPositions(page);
            expect(currentRects).toEqual(baselineRects);
        }

        // Verify Coloring Step checklist works on Step 11
        await expect(page.locator('#palette-container')).toBeVisible();
        const firstSwatch = page.locator('#palette-container .swatch-btn').first();
        await firstSwatch.click();
        await expect(firstSwatch).toHaveClass(/checked/);

        // Toggle Original Reference Image
        await page.locator('#btn-toggle-ref').click();
        await expect(page.locator('#ref-overlay-card')).toBeVisible();
        await page.locator('#btn-close-ref').click();
        await expect(page.locator('#ref-overlay-card')).toBeHidden();

        // Open Tutorial Picker Modal and switch to Lancer
        await page.locator('#btn-open-tutorials').click();
        await expect(page.locator('#tutorials-modal')).toBeVisible();
        await page.locator('[data-tutorial-id="lancer-spade"]').click();
        await expect(page.locator('#tutorials-modal')).toBeHidden();
        await expect(page.locator('#current-tutorial-label')).toHaveText('Lancer (The Spade Boy!)');
        await expect(page.locator('#step-counter-badge')).toHaveText('STEP 1 OF 5');

        // Verify controls are STILL at the exact same position after switching tutorials!
        const lancerRects = await measureControlPositions(page);
        expect(lancerRects).toEqual(baselineRects);

        expect(errors).toEqual([]);
        await context.close();
    });

    test('Fits cleanly without horizontal overflow on mobile viewport (375x667)', async ({ browser }) => {
        const context = await browser.newContext({
            viewport: { width: 375, height: 667 },
            hasTouch: true,
            isMobile: true,
        });
        const page = await context.newPage();
        const { errors } = await attachGuards(page);

        await page.goto('/games/sketch-pup.html');
        await expect(page.locator('#drawing-svg')).toBeVisible();

        const metrics = await page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth: window.innerWidth,
        }));
        expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.innerWidth);
        expect(errors).toEqual([]);
        await context.close();
    });
});
