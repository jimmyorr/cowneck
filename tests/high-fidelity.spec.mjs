import { Buffer } from 'node:buffer';
import { expect, test } from '@playwright/test';

// 16x16 alternating pure red (255,0,0) and pure blue (0,0,255) checkerboard PNG.
// Lossless PNG preserves (255,0,0) at (0,0), while JPEG chroma subsampling shifts it dramatically.
const CHECKERBOARD_PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAHklEQVR4nGP4z8DAwPCfeJI01f+hWkZtGLVhSNgAAJHq/wEortzmAAAAAElFTkSuQmCC',
    'base64'
);

async function attachGuards(page, { failImages = false, imageDelayMs = 0 } = {}) {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
        if (msg.type() === 'error' && !failImages) {
            errors.push(msg.text());
        }
    });

    await page.route('**/*', async (route) => {
        const reqUrl = route.request().url();
        const url = new URL(reqUrl);

        if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
            return route.continue();
        }

        if (url.hostname === 'birds.cowneck.com' && url.pathname.startsWith('/optimized_images/')) {
            if (imageDelayMs > 0) {
                await new Promise((resolve) => setTimeout(resolve, imageDelayMs));
            }
            if (failImages) {
                return route.abort('failed');
            }
            const origin = route.request().headers()['origin'];
            return route.fulfill({
                status: 200,
                contentType: 'image/png',
                headers: origin ? { 'Access-Control-Allow-Origin': '*' } : {},
                body: CHECKERBOARD_PNG,
            });
        }

        return route.fulfill({ status: 204, body: '' });
    });

    return errors;
}

async function detectSidesByPixels(page) {
    return page.evaluate(() => {
        function topLeftRedDiff(selector) {
            const img = document.querySelector(selector);
            const c = document.createElement('canvas');
            c.width = img.naturalWidth;
            c.height = img.naturalHeight;
            const ctx = c.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
            return Math.abs(255 - r) + g + b;
        }
        const d1 = topLeftRedDiff('#choice-1 img');
        const d2 = topLeftRedDiff('#choice-2 img');
        const losslessSide = d1 < d2 ? 1 : 2;
        return {
            losslessSide,
            compressedSide: losslessSide === 1 ? 2 : 1,
            losslessDiff: Math.min(d1, d2),
            compressedDiff: Math.max(d1, d2),
        };
    });
}

test.describe('High Fidelity', () => {
    test('renders symmetric blob URLs, synchronized magnifier loupe, inline reveal, and artifact diff', async ({ page }) => {
        const errors = await attachGuards(page);
        await page.goto('/games/high-fidelity.html');

        await expect(page).toHaveTitle(/High Fidelity/);
        await expect(page.locator('#back-to-games-link')).toHaveAttribute('href', 'index.html');

        const globalsCheck = await page.evaluate(() => ({
            hasGtag: typeof window.gtag === 'function',
            leakedStartGame: typeof window.startGame,
            leakedHandleChoice: typeof window.handleChoice,
        }));
        expect(globalsCheck).toEqual({
            hasGtag: true,
            leakedStartGame: 'undefined',
            leakedHandleChoice: 'undefined',
        });

        await page.locator('[data-difficulty="easy"]').click();
        await expect(page.locator('#choice-1 img')).toBeVisible();
        await expect(page.locator('#choice-2 img')).toBeVisible();
        await expect(page.locator('#round-num')).toHaveText('1');

        // Verify both sides use opaque blob: URLs (no DOM src leak)
        const srcProtocols = await page.evaluate(() => [
            document.querySelector('#choice-1 img').src.startsWith('blob:'),
            document.querySelector('#choice-2 img').src.startsWith('blob:'),
        ]);
        expect(srcProtocols).toEqual([true, true]);

        // Hover center of choice-1 and verify synchronized loupe appears on BOTH cards
        const box1 = await page.locator('#choice-1').boundingBox();
        await page.mouse.move(box1.x + box1.width / 2, box1.y + box1.height / 2);
        await expect(page.locator('#loupe-1')).toHaveClass(/visible/);
        await expect(page.locator('#loupe-2')).toHaveClass(/visible/);

        // Toggle loupe off and back on via keyboard 'L'
        await page.keyboard.press('l');
        await expect(page.locator('#loupe-toggle-btn')).toHaveAttribute('aria-pressed', 'false');
        await expect(page.locator('#loupe-1')).not.toHaveClass(/visible/);
        await page.keyboard.press('l');
        await expect(page.locator('#loupe-toggle-btn')).toHaveAttribute('aria-pressed', 'true');

        // Identify lossless side by pixel fidelity and select it
        const { losslessSide, compressedSide, losslessDiff, compressedDiff } = await detectSidesByPixels(page);
        expect(losslessDiff).toBe(0);
        expect(compressedDiff).toBeGreaterThan(50);

        await page.locator(`#choice-${losslessSide}`).click();

        // Both images remain visible with outcome-based reveal badges and inline bird attribution
        await expect(page.locator('#round-banner')).toHaveClass(/reveal-correct/);
        await expect(page.locator('#banner-verdict')).toContainText('✓ Correct!');
        await expect(page.locator('#bird-credit a')).toHaveAttribute('href', 'https://birds.cowneck.com/');
        await expect(page.locator(`#choice-${losslessSide}`)).toHaveClass(/reveal-picked-correct/);
        await expect(page.locator(`#choice-${compressedSide}`)).toHaveClass(/reveal-unpicked-compressed/);
        await expect(page.locator(`#badge-${losslessSide}`)).toHaveClass(/badge-picked-correct/);
        await expect(page.locator(`#badge-${losslessSide}`)).toContainText('✓ Your pick • Original (Lossless)');
        await expect(page.locator(`#badge-${compressedSide}`)).toHaveClass(/badge-neutral-compressed/);
        await expect(page.locator(`#badge-${compressedSide}`)).toContainText('JPEG 10%');

        // Toggle Artifact Diff heatmap on and back off
        const compImg = page.locator(`#choice-${compressedSide} img`);
        const jpegBlobUrl = await compImg.getAttribute('src');
        await page.locator('#diff-toggle-btn').click();
        await expect(page.locator('#diff-toggle-btn')).toHaveAttribute('aria-pressed', 'true');
        await expect(page.locator(`#badge-${compressedSide}`)).toContainText('Artifact Diff');
        const diffBlobUrl = await compImg.getAttribute('src');
        expect(diffBlobUrl).not.toBe(jpegBlobUrl);

        await page.keyboard.press('d');
        await expect(page.locator('#diff-toggle-btn')).toHaveAttribute('aria-pressed', 'false');
        await expect(compImg).toHaveAttribute('src', jpegBlobUrl);

        expect(errors).toEqual([]);
    });

    test('completes 10 Blitz rounds, tracks streaks, sanitizes high-score names, and replays cleanly', async ({ page }) => {
        const errors = await attachGuards(page);
        await page.goto('/games/high-fidelity.html');

        await page.locator('[data-difficulty="mid"]').click();

        for (let round = 1; round <= 10; round++) {
            await expect(page.locator('#round-num')).toHaveText(String(round));
            await expect(page.locator('#choice-1 img')).toBeVisible();
            const { losslessSide } = await detectSidesByPixels(page);
            await page.keyboard.press(String(losslessSide));
            await expect(page.locator('#round-banner')).toHaveClass(/reveal-correct/);

            if (round === 2) {
                await expect(page.locator('#streak-badge')).toBeVisible();
                await expect(page.locator('#streak-count')).toHaveText('2');
            }

            await page.locator('#next-round-btn').click();
        }

        await expect(page.locator('#feedback')).toHaveClass(/active/);
        await expect(page.locator('#feedback-icon')).toHaveText('🏆');
        await expect(page.locator('#feedback-text')).toContainText('New high score!');
        await expect(page.locator('#feedback-text')).toContainText('Accuracy: 10/10');

        const nameInput = page.locator('.high-score-input');
        await nameInput.fill('<b>Ace</b>');
        await nameInput.press('Enter');

        await expect(page.locator('#leaderboard-overlay')).toHaveClass(/active/);
        const renderedNameCell = page.locator('#leaderboard-body tr td').nth(1);
        await expect(renderedNameCell).toHaveText('<b>Ace</b>');
        expect(await renderedNameCell.locator('b').count()).toBe(0);

        await page.keyboard.press('Escape');
        await expect(page.locator('#leaderboard-overlay')).not.toHaveClass(/active/);
        await expect(page.locator('#main-menu')).not.toHaveClass(/hidden/);

        // Replay and verify round banner actions work cleanly
        await page.locator('[data-difficulty="easy"]').click();
        await expect(page.locator('#choice-1 img')).toBeVisible();
        const { losslessSide } = await detectSidesByPixels(page);
        await page.locator(`#choice-${losslessSide}`).click();
        await expect(page.locator('#next-round-btn')).toBeVisible();
        await expect(page.locator('#feedback-menu-btn')).toBeVisible();

        expect(errors).toEqual([]);
    });

    test('supports untimed 3-lives Inspector mode and ends after 3 mistakes', async ({ page }) => {
        const errors = await attachGuards(page);
        await page.goto('/games/high-fidelity.html');

        await page.locator('[data-mode="inspector"]').click();
        await expect(page.locator('#meta-hard')).toContainText('Untimed • 3 lives');
        await page.locator('[data-difficulty="hard"]').click();

        await expect(page.locator('#timer-bar-container')).toHaveClass(/hidden/);
        await expect(page.locator('#lives-display')).toHaveText('❤️❤️❤️');

        for (let strike = 1; strike <= 3; strike++) {
            await expect(page.locator('#choice-1 img')).toBeVisible();
            const { losslessSide, compressedSide } = await detectSidesByPixels(page);
            await page.locator(`#choice-${compressedSide}`).click();
            await expect(page.locator('#round-banner')).toHaveClass(/reveal-wrong/);
            await expect(page.locator(`#choice-${compressedSide}`)).toHaveClass(/reveal-picked-wrong/);
            await expect(page.locator(`#badge-${compressedSide}`)).toHaveClass(/badge-picked-wrong/);
            await expect(page.locator(`#badge-${compressedSide}`)).toContainText('✗ Your pick • JPEG 75%');
            await expect(page.locator(`#choice-${losslessSide}`)).toHaveClass(/reveal-missed-original/);
            await expect(page.locator(`#choice-${losslessSide}`)).not.toHaveClass(/reveal-picked-correct/);
            await expect(page.locator(`#badge-${losslessSide}`)).toHaveClass(/badge-neutral-original/);
            await expect(page.locator(`#badge-${losslessSide}`)).toHaveText('Original (Lossless)');

            if (strike === 3) {
                await expect(page.locator('#lives-display')).toHaveText('🖤🖤🖤');
                await expect(page.locator('#next-round-btn')).toHaveText('Final results');
            }
            await page.keyboard.press(' ');
        }

        await expect(page.locator('#feedback')).toHaveClass(/active/);
        await expect(page.locator('#feedback-icon')).toHaveText('🏆');
        await expect(page.locator('#feedback-text')).toContainText('Inspector • Hard');

        expect(errors).toEqual([]);
    });

    test('handles Escape on main-menu leaderboard and pause while images are loading', async ({ page }) => {
        const errors = await attachGuards(page, { imageDelayMs: 250 });
        await page.goto('/games/high-fidelity.html');

        await page.locator('#open-leaderboard-btn').click();
        await expect(page.locator('#leaderboard-overlay')).toHaveClass(/active/);
        await page.keyboard.press('Escape');
        await expect(page.locator('#leaderboard-overlay')).not.toHaveClass(/active/);
        await expect(page.locator('#pause-menu')).not.toHaveClass(/active/);
        await expect(page.locator('#main-menu')).not.toHaveClass(/hidden/);

        await page.locator('[data-difficulty="hard"]').click();
        await page.keyboard.press('Escape');
        await expect(page.locator('#pause-menu')).toHaveClass(/active/);

        await expect(page.locator('#choice-1 img')).toBeAttached({ timeout: 2000 });
        await page.waitForTimeout(300);
        const pausedWidth = await page.locator('#timer-bar').evaluate((el) => el.style.width);
        expect(pausedWidth).toBe('100%');

        await page.locator('#resume-btn').click();
        await expect(page.locator('#pause-menu')).not.toHaveClass(/active/);
        await page.locator('#choice-1').focus();
        await page.keyboard.press('Enter');
        await expect(page.locator('#banner-actions')).toBeVisible();

        expect(errors).toEqual([]);
    });

    test('shows connection error state when all images fail and survives blocked localStorage', async ({ page }) => {
        await attachGuards(page, { failImages: true });
        await page.addInitScript(() => {
            const deny = () => {
                throw new DOMException('Storage disabled', 'SecurityError');
            };
            Storage.prototype.getItem = deny;
            Storage.prototype.setItem = deny;
        });

        await page.goto('/games/high-fidelity.html');
        await page.locator('#open-leaderboard-btn').click();
        await expect(page.locator('#leaderboard-body')).toContainText('No high scores yet!');
        await page.locator('#close-leaderboard-btn').click();

        await page.locator('[data-difficulty="easy"]').click();
        await expect(page.locator('#feedback')).toHaveClass(/active/, { timeout: 5000 });
        await expect(page.locator('#feedback-icon')).toHaveText('⚠️');
        await expect(page.locator('#feedback-text')).toContainText('Unable to load images.');

        await page.locator('.endgame-action-btn', { hasText: 'Main menu' }).click();
        await expect(page.locator('#main-menu')).not.toHaveClass(/hidden/);
    });
});
