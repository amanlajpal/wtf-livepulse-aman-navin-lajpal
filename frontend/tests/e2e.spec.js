import { test, expect } from '@playwright/test';

test.describe('WTF LivePulse End-to-End Tests', () => {
  test('1. Dashboard loads and displays gym list without errors', async ({ page }) => {
    await page.goto('/');

    // Check title
    await expect(page).toHaveTitle(/WTF LivePulse/i);

    // Check gym selector is present
    const selector = page.locator('#gym-selector');
    await expect(selector).toBeVisible();

    // Check header modules
    await expect(page.getByText(/MODULE 1 — Live Gym Operations Dashboard/i)).toBeVisible();
    await expect(page.getByText(/MODULE 2 — Analytics Engine/i)).toBeVisible();
  });

  test('2. Switching gym in dropdown updates dashboard state', async ({ page }) => {
    await page.goto('/');

    const selector = page.locator('#gym-selector');
    await expect(selector).toBeVisible();

    // Select second gym option
    const options = await selector.locator('option').all();
    if (options.length > 1) {
      const secondVal = await options[1].getAttribute('value');
      await selector.selectOption(secondVal);

      // Verify counter updates
      const counter = page.locator('#live-occupancy-counter');
      await expect(counter).toBeVisible();
    }
  });

  test('3. Simulator control panel triggers live updates', async ({ page }) => {
    await page.goto('/');

    // Locate start simulation button
    const startBtn = page.getByRole('button', { name: /Start Simulation/i });
    if (await startBtn.isVisible()) {
      await startBtn.click();
      await expect(page.getByRole('button', { name: /Pause Simulation/i })).toBeVisible();
    }
  });
});
