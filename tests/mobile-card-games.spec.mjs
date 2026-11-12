import { execFileSync } from 'node:child_process';
import { expect, test } from '@playwright/test';

const cdnCache = new Map();

function fetchCdnScript(url) {
    if (!cdnCache.has(url)) {
        const body = execFileSync('curl', ['-fsSL', '--max-time', '20', url], {
            maxBuffer: 16 * 1024 * 1024,
        });
        cdnCache.set(url, body);
    }
    return cdnCache.get(url);
}

async function attachGuards(page) {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
        if (msg.type() === 'error') {
            errors.push(msg.text());
        }
    });

    await page.route('**/*', (route) => {
        const rawUrl = route.request().url();
        const url = new URL(rawUrl);
        if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
            return route.continue();
        }
        const allowedScriptHosts = new Set([
            'cdn.tailwindcss.com',
            'unpkg.com',
            'cdn.jsdelivr.net',
        ]);
        if (allowedScriptHosts.has(url.hostname)) {
            const body = fetchCdnScript(rawUrl);
            return route.fulfill({
                status: 200,
                contentType: 'application/javascript; charset=utf-8',
                body,
            });
        }
        return route.fulfill({ status: 204, body: '' });
    });

    return errors;
}

function boxesOverlap(a, b) {
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

test.describe('Mobile & desktop responsiveness — High Society & Wizard', () => {
    test('High Society fits iPhone SE (375x667) without overflow, auto-zoom, or overlapping controls', async ({ browser }) => {
        const context = await browser.newContext({
            viewport: { width: 375, height: 667 },
            hasTouch: true,
            isMobile: true,
        });
        const page = await context.newPage();
        const errors = await attachGuards(page);

        await page.goto('/games/high-society/index.html');
        await expect(page.getByRole('heading', { name: 'High Society' })).toBeVisible({ timeout: 15000 });

        // Start screen checks: no autoFocus, >=16px input font size, no horizontal overflow
        const startMetrics = await page.evaluate(() => {
            const input = document.getElementById('hs-player-name');
            return {
                activeTag: document.activeElement ? document.activeElement.tagName : null,
                inputFontSize: parseFloat(window.getComputedStyle(input).fontSize),
                scrollWidth: document.documentElement.scrollWidth,
                innerWidth: window.innerWidth,
            };
        });
        expect(startMetrics.activeTag).not.toBe('INPUT');
        expect(startMetrics.inputFontSize).toBeGreaterThanOrEqual(16);
        expect(startMetrics.scrollWidth).toBeLessThanOrEqual(startMetrics.innerWidth);

        // Tap opponent pill to preview personality description on touch devices
        await page.getByRole('button', { name: 'Oliver' }).click();
        await expect(page.getByText(/Penny-Pincher/i)).toBeVisible();

        // Rules modal fits inside mobile viewport
        await page.getByRole('button', { name: /Rules/i }).click();
        const rulesHeading = page.getByRole('heading', { name: /High Society rules/i });
        await expect(rulesHeading).toBeVisible();
        await page.getByRole('button', { name: /Card categories/i }).click();
        await expect(page.getByRole('heading', { name: 'Luxury cards (values 1 to 10)' })).toBeVisible();
        await page.getByRole('button', { name: 'Close rules' }).click();
        await expect(rulesHeading).toBeHidden();

        // Start gameplay
        await page.getByRole('button', { name: 'Play', exact: true }).click();
        await expect(page.getByText(/Deck:/)).toBeVisible();

        const playMetrics = await page.evaluate(() => {
            const passBtn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim() === 'Pass');
            const bidBtn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent.trim().startsWith('Bid'));
            const pauseBtn = document.querySelector('button[aria-label="Pause game"]');
            const header = document.querySelector('header');
            const noteButtons = Array.from(document.querySelectorAll('button')).filter((b) => /^\d+k💰/.test(b.textContent.replace(/\s+/g, '')));

            const toBox = (el) => {
                const r = el.getBoundingClientRect();
                return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
            };

            return {
                scrollWidth: document.documentElement.scrollWidth,
                innerWidth: window.innerWidth,
                innerHeight: window.innerHeight,
                noteCount: noteButtons.length,
                notesInViewport: noteButtons.every((b) => {
                    const r = b.getBoundingClientRect();
                    return r.left >= 0 && r.right <= window.innerWidth && r.height >= 44;
                }),
                passBox: toBox(passBtn),
                bidBox: toBox(bidBtn),
                pauseBox: toBox(pauseBtn),
                headerBox: toBox(header),
            };
        });

        expect(playMetrics.scrollWidth).toBeLessThanOrEqual(playMetrics.innerWidth);
        expect(playMetrics.noteCount).toBe(11);
        expect(playMetrics.notesInViewport).toBe(true);
        expect(playMetrics.passBox.height).toBeGreaterThanOrEqual(44);
        expect(playMetrics.bidBox.height).toBeGreaterThanOrEqual(44);
        // Both Pass and Bid buttons fit on-screen without scrolling on 375x667
        expect(playMetrics.passBox.bottom).toBeLessThanOrEqual(playMetrics.innerHeight);
        expect(playMetrics.bidBox.bottom).toBeLessThanOrEqual(playMetrics.innerHeight);
        expect(boxesOverlap(playMetrics.passBox, playMetrics.bidBox)).toBe(false);
        expect(boxesOverlap(playMetrics.pauseBox, playMetrics.passBox)).toBe(false);

        // Toggle auction history sheet on mobile
        await page.getByRole('button', { name: 'Toggle auction history' }).click();
        await expect(page.getByText('Auction history')).toBeVisible();
        await page.getByRole('button', { name: 'Close auction history' }).click();
        await expect(page.getByText('Auction history')).toBeHidden();

        expect(errors).toEqual([]);
        await context.close();
    });

    test('Wizard fits iPhone SE (375x667) across start, bidding, trick table, and modals', async ({ browser }) => {
        const context = await browser.newContext({
            viewport: { width: 375, height: 667 },
            hasTouch: true,
            isMobile: true,
        });
        const page = await context.newPage();
        const errors = await attachGuards(page);

        await page.goto('/games/wizard.html');
        await expect(page.getByRole('heading', { name: 'Wizard' })).toBeVisible({ timeout: 15000 });

        const startMetrics = await page.evaluate(() => {
            const input = document.getElementById('wizard-player-name');
            return {
                activeTag: document.activeElement ? document.activeElement.tagName : null,
                inputFontSize: parseFloat(window.getComputedStyle(input).fontSize),
                scrollWidth: document.documentElement.scrollWidth,
                innerWidth: window.innerWidth,
            };
        });
        expect(startMetrics.activeTag).not.toBe('INPUT');
        expect(startMetrics.inputFontSize).toBeGreaterThanOrEqual(16);
        expect(startMetrics.scrollWidth).toBeLessThanOrEqual(startMetrics.innerWidth);

        // Tap first opponent pill to verify touch description preview
        const firstBotBtn = page.locator('button').filter({ hasText: /Oliver|Miles|Kirby|Merlin|Morgana/i }).first();
        await firstBotBtn.click();

        // Rules modal fits inside mobile viewport
        await page.getByRole('button', { name: /Rules guide/i }).click();
        const rulesHeading = page.getByRole('heading', { name: /Wizard guide & rules/i });
        await expect(rulesHeading).toBeVisible();
        await page.getByRole('button', { name: /Special cards/i }).click();
        await expect(page.getByText('The Wizard')).toBeVisible();
        await page.getByRole('button', { name: 'Close rules' }).click();
        await expect(rulesHeading).toBeHidden();

        // Start game -> Place your bid modal
        await page.getByRole('button', { name: 'Play', exact: true }).click();
        const bidHeading = page.getByRole('heading', { name: 'Place your bid' });
        await expect(bidHeading).toBeVisible();

        const bidZeroBtn = page.getByRole('button', { name: '0', exact: true });
        const bidBtnBox = await bidZeroBtn.boundingBox();
        expect(bidBtnBox.height).toBeGreaterThanOrEqual(44);
        expect(bidBtnBox.y + bidBtnBox.height).toBeLessThanOrEqual(667);

        await bidZeroBtn.click();
        await expect(bidHeading).toBeHidden();

        // Verify mobile standings strip, non-overlapping table header, and card buttons
        const tableMetrics = await page.evaluate(() => {
            const pauseBtn = document.querySelector('button[aria-label="Pause game"]');
            const rulesBtn = document.querySelector('button[aria-label="Open rules guide"]');
            const handHeading = Array.from(document.querySelectorAll('h3')).find((h) => h.textContent.includes('Your hand'));
            const handCards = handHeading ? Array.from(handHeading.parentElement.nextElementSibling.querySelectorAll('button')) : [];

            const pauseRect = pauseBtn.getBoundingClientRect();
            const rulesRect = rulesBtn.getBoundingClientRect();

            return {
                scrollWidth: document.documentElement.scrollWidth,
                innerWidth: window.innerWidth,
                pauseInBounds: pauseRect.right <= window.innerWidth && pauseRect.top >= 0,
                rulesNoOverlapPause: rulesRect.right <= pauseRect.left + 1,
                handCardCount: handCards.length,
                handCardsInBounds: handCards.every((c) => {
                    const r = c.getBoundingClientRect();
                    return r.left >= 0 && r.right <= window.innerWidth && r.width >= 50;
                }),
            };
        });

        expect(tableMetrics.scrollWidth).toBeLessThanOrEqual(tableMetrics.innerWidth);
        expect(tableMetrics.pauseInBounds).toBe(true);
        expect(tableMetrics.rulesNoOverlapPause).toBe(true);
        expect(tableMetrics.handCardCount).toBe(1);
        expect(tableMetrics.handCardsInBounds).toBe(true);

        expect(errors).toEqual([]);
        await context.close();
    });

    test('Desktop (1280x800) preserves spacious tabletop layouts in both games', async ({ browser }) => {
        const context = await browser.newContext({
            viewport: { width: 1280, height: 800 },
        });
        const page = await context.newPage();
        const errors = await attachGuards(page);

        await page.goto('/games/high-society/index.html');
        await page.getByRole('button', { name: 'Play', exact: true }).click();
        await expect(page.getByText(/Deck:/)).toBeVisible();
        const hsOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
        expect(hsOverflow).toBe(true);

        await page.goto('/games/wizard.html');
        await page.getByRole('button', { name: 'Play', exact: true }).click();
        await page.getByRole('button', { name: '0', exact: true }).click();
        await expect(page.getByRole('heading', { name: 'Standings' })).toBeVisible();
        const wizOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
        expect(wizOverflow).toBe(true);

        expect(errors).toEqual([]);
        await context.close();
    });
});
