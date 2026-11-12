import fs from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

const PORT = 5198;
const baseURL = process.env.BASE_URL || `http://127.0.0.1:${PORT}`;
const systemChromium = ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']
    .find((candidate) => fs.existsSync(candidate));

const browserLaunchUse = process.env.CHROME_PATH
    ? { launchOptions: { executablePath: process.env.CHROME_PATH } }
    : systemChromium
      ? { launchOptions: { executablePath: systemChromium } }
      : { channel: 'chrome' };

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    workers: 2,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    reporter: 'list',
    use: {
        baseURL,
        ...browserLaunchUse,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'], ...browserLaunchUse },
        },
    ],
    webServer: process.env.BASE_URL
        ? undefined
        : {
              command: `python3 -m http.server ${PORT} --bind 127.0.0.1`,
              url: baseURL,
              reuseExistingServer: true,
              stdout: 'ignore',
              stderr: 'pipe',
          },
});
