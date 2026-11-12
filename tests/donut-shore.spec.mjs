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
    const externalHosts = [];
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
        externalHosts.push(url.hostname);
        if (url.hostname === 'cdn.tailwindcss.com') {
            const body = fetchCdnScript(rawUrl);
            return route.fulfill({
                status: 200,
                contentType: 'application/javascript; charset=utf-8',
                body,
            });
        }
        return route.fulfill({ status: 204, body: '' });
    });

    return { errors, externalHosts };
}

test.describe('Donut Chef & Shore Road — mobile & desktop verification', () => {
    test('Donut Chef plays smoothly on iPhone SE (375x667) with tabbed Shop/Table/Deck and modals', async ({ browser }) => {
        const context = await browser.newContext({
            viewport: { width: 375, height: 667 },
            hasTouch: true,
            isMobile: true,
        });
        const page = await context.newPage();
        const { errors } = await attachGuards(page);

        await page.goto('/games/donut-chef.html');
        await expect(page.getByRole('heading', { name: 'Donut Chef' })).toBeVisible();

        // Check rules catalog modal
        await page.locator('#btn-splash-rules').click();
        await expect(page.locator('#rules-modal')).toBeVisible();
        await expect(page.locator('#rules-catalog .rule-card-item')).toHaveCount(16);
        await page.locator('#btn-close-rules').click();
        await expect(page.locator('#rules-modal')).toBeHidden();

        // Start human vs Donut Bot game
        await page.locator('#btn-start-human').click();
        await expect(page.locator('#app-shell')).toBeVisible();
        await page.locator('#btn-speed').click();

        const mobileLayout = await page.evaluate(() => {
            const dock = document.getElementById('bottom-dock').getBoundingClientRect();
            const tabs = document.getElementById('mobile-tabs').getBoundingClientRect();
            return {
                scrollWidth: document.documentElement.scrollWidth,
                innerWidth: window.innerWidth,
                innerHeight: window.innerHeight,
                tabsVisible: tabs.height > 0,
                dockFitsViewport: dock.bottom <= window.innerHeight + 1 && dock.left >= 0 && dock.right <= window.innerWidth + 1,
            };
        });
        expect(mobileLayout.scrollWidth).toBeLessThanOrEqual(mobileLayout.innerWidth);
        expect(mobileLayout.tabsVisible).toBe(true);
        expect(mobileLayout.dockFitsViewport).toBe(true);

        // Play ingredients from dock, switch to Shop tab, and buy an affordable card
        const playAllBtn = page.locator('#btn-play-all');
        if (await playAllBtn.isEnabled()) {
            await playAllBtn.click();
        }
        await page.locator('#tab-btn-shop').click();
        await expect(page.locator('#supply-panel')).toBeVisible();

        const shopMetrics = await page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth: window.innerWidth,
            coins: Number(document.getElementById('stat-coins').textContent),
        }));
        expect(shopMetrics.scrollWidth).toBeLessThanOrEqual(shopMetrics.innerWidth);

        // Buy Clean sweep (cost 2) if coins >= 2
        if (shopMetrics.coins >= 2) {
            await page.locator('#supply-list button[data-card-id="chapel"]').click();
            await expect(page.locator('#stat-buys')).toHaveText('0');
        }

        // End turn directly from Shop dock and confirm Donut Bot completes its turn
        await page.locator('#btn-end-turn').click();
        await expect(page.locator('#turn-label')).toContainText('Turn 2', { timeout: 10000 });

        // Trigger game over cleanly via engine to verify scoreboard modal
        await page.evaluate(() => {
            window.__donutChefEngine.supply.premium_donut = 0;
        });
        await page.locator('#btn-end-turn').click();
        await expect(page.locator('#gameover-modal')).toBeVisible({ timeout: 10000 });
        await page.locator('#btn-gameover-menu').click();
        await expect(page.locator('#splash-screen')).toBeVisible();

        expect(errors).toEqual([]);
        await context.close();
    });

    test('Donut Chef preserves 3-column desktop tabletop at 1280x800', async ({ browser }) => {
        const context = await browser.newContext({
            viewport: { width: 1280, height: 800 },
        });
        const page = await context.newPage();
        const { errors } = await attachGuards(page);

        await page.goto('/games/donut-chef.html');
        await page.locator('#btn-start-human').click();

        const cols = await page.evaluate(() => {
            const s = document.getElementById('supply-panel').getBoundingClientRect();
            const t = document.getElementById('table-panel').getBoundingClientRect();
            const l = document.getElementById('log-panel').getBoundingClientRect();
            const tabs = window.getComputedStyle(document.getElementById('mobile-tabs')).display;
            return { s, t, l, tabs, scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth };
        });

        expect(cols.tabs).toBe('none');
        expect(cols.s.width).toBeGreaterThan(250);
        expect(cols.t.left).toBeGreaterThanOrEqual(cols.s.right);
        expect(cols.l.left).toBeGreaterThanOrEqual(cols.t.right);
        expect(cols.scrollWidth).toBeLessThanOrEqual(cols.innerWidth);
        expect(errors).toEqual([]);
        await context.close();
    });

    test('Donut Chef separates Action/Buy phases and lets Crate play even after clicking Play ingredients before buying', async ({ browser }) => {
        const context = await browser.newContext({
            viewport: { width: 375, height: 667 },
            hasTouch: true,
            isMobile: true,
        });
        const page = await context.newPage();
        const { errors } = await attachGuards(page);

        await page.goto('/games/donut-chef.html');
        await page.locator('#btn-start-human').click();

        // Set up an Action-phase hand containing two terminal actions (Crate + Clean sweep) and two ingredients
        await page.evaluate(() => {
            const { createCardInstance } = window.DonutChefLogic;
            const engine = window.__donutChefEngine;
            const p = engine.players[0];
            p.hand = [
                createCardInstance('smithy'),
                createCardInstance('chapel'),
                createCardInstance('flour'),
                createCardInstance('sugar'),
            ];
            p.deck = [
                createCardInstance('flour'),
                createCardInstance('flour'),
                createCardInstance('lard'),
            ];
            p.discard = [];
            p.playArea = [];
            p.actions = 1;
            p.buys = 1;
            p.coins = 0;
            engine.turnPhase = 'action';
            engine.cardsBoughtThisTurn = 0;
            engine.buyPhaseSnapshot = null;
            engine.notify();
        });

        // In Action phase, dock button shows Skip actions (not Play ingredients)
        await expect(page.locator('#phase-pill')).toHaveText('Action phase');
        await expect(page.locator('#btn-play-all')).toContainText('Skip actions');

        // Tapping an ingredient during Action phase shows visible table feedback instead of forfeiting actions
        await page.locator('#hand-container button[data-card-id="flour"]').click();
        await expect(page.locator('#table-feedback')).toBeVisible();
        await expect(page.locator('#phase-pill')).toHaveText('Action phase');

        // Skip actions -> Play ingredients (+3) -> Actions truthfully reads 0 and Undo is visible
        await page.locator('#btn-play-all').click();
        await expect(page.locator('#phase-pill')).toHaveText('Buy phase');
        await expect(page.locator('#stat-actions')).toHaveText('0');
        await expect(page.locator('#btn-undo-phase')).toBeVisible();
        await expect(page.locator('#btn-play-all')).toContainText('Play ingredients (+3)');
        await page.locator('#btn-play-all').click();
        await expect(page.locator('#stat-coins')).toHaveText('3');

        // Clicking Crate in hand BEFORE buying a card rewinds the ingredients and plays Crate (+3 cards)!
        await page.locator('#hand-container button[data-card-id="smithy"]').click();
        await expect(page.locator('#play-area')).toContainText('Crate');
        await expect(page.locator('#stat-actions')).toHaveText('0');
        await expect(page.locator('#badge-table')).toHaveText('6');

        // Tapping the leftover Clean sweep with 0 actions left shows clear visible feedback on the mobile table
        await page.locator('#hand-container button[data-card-id="chapel"]').click();
        await expect(page.locator('#table-feedback')).toContainText('No actions left');

        // Open Shop and 1-tap buy Premium donut (8 coins in hand: 3 Flour + 1 Sugar + 1 Lard = 8) without clicking Play ingredients first!
        await page.locator('#tab-btn-shop').click();
        await page.locator('#supply-list button[data-card-id="premium_donut"]').click();
        await expect(page.locator('#stat-buys')).toHaveText('0');
        await expect(page.locator('#badge-score')).toHaveText('6 pts');

        expect(errors).toEqual([]);
        await context.close();
    });

    test('Shore Road works offline-ready without Font Awesome, couples sliders to 100%, and fits iPhone SE & Desktop', async ({ browser }) => {
        const context = await browser.newContext({
            viewport: { width: 375, height: 667 },
            hasTouch: true,
            isMobile: true,
        });
        const page = await context.newPage();
        const { errors, externalHosts } = await attachGuards(page);

        await page.goto('/games/shore-road.html');
        await expect(page.locator('#mobile-bottom-bar')).toBeVisible();
        expect(externalHosts).not.toContain('cdnjs.cloudflare.com');

        // Pause & resume from floating top bar
        await page.locator('#btn-pause-sim').click();
        await expect(page.locator('#pause-sim-label')).toContainText('Resume');
        await expect(page.locator('#mobile-live-pill')).toHaveText('Paused');
        await page.locator('#btn-pause-sim').click();
        await expect(page.locator('#mobile-live-pill')).toHaveText('Live');

        // Open mobile bottom sheet and verify coupled complementary sliders
        await page.locator('#mobile-bottom-bar').click();
        await expect(page.locator('#btn-close-sheet')).toBeVisible();

        await page.evaluate(() => {
            const z = document.getElementById('slider-zipper');
            z.value = '20';
            z.dispatchEvent(new Event('input', { bubbles: true }));
        });
        await expect(page.locator('#val-zipper')).toHaveText('20%');
        await expect(page.locator('#val-early')).toHaveText('80%');

        await page.evaluate(() => {
            const e = document.getElementById('slider-early');
            e.value = '35';
            e.dispatchEvent(new Event('input', { bubbles: true }));
        });
        await expect(page.locator('#val-early')).toHaveText('35%');
        await expect(page.locator('#val-zipper')).toHaveText('65%');

        // Switch metric tabs and close sheet
        await page.locator('#tab-btn-eco').click();
        await expect(page.locator('#panel-metrics-eco')).toBeVisible();
        await page.locator('#tab-btn-mood').click();
        await expect(page.locator('#panel-metrics-mood')).toBeVisible();
        await page.locator('#btn-close-sheet').click();

        const mobileCheck = await page.evaluate(() => ({
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth: window.innerWidth,
        }));
        expect(mobileCheck.scrollWidth).toBeLessThanOrEqual(mobileCheck.innerWidth);
        expect(errors).toEqual([]);
        await context.close();

        // Desktop check (1280x800)
        const desktopCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
        const desktopPage = await desktopCtx.newPage();
        const { errors: desktopErrors } = await attachGuards(desktopPage);
        await desktopPage.goto('/games/shore-road.html');
        await expect(desktopPage.locator('#btn-reset')).toBeVisible();
        const desktopLayout = await desktopPage.evaluate(() => {
            const aside = document.getElementById('controls-panel').getBoundingClientRect();
            const sim = document.getElementById('sim-container').getBoundingClientRect();
            return { asideRight: aside.right, simLeft: sim.left, scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth };
        });
        expect(desktopLayout.simLeft).toBeGreaterThanOrEqual(desktopLayout.asideRight);
        expect(desktopLayout.scrollWidth).toBeLessThanOrEqual(desktopLayout.innerWidth);
        expect(desktopErrors).toEqual([]);
        await desktopCtx.close();
    });
});
