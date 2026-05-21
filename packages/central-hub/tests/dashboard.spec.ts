import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('should load the dashboard and show the heading', async ({ page }) => {
    // Navigate to the dashboard page
    await page.goto('http://localhost:3000/dashboard');

    // Wait for the heading to be visible
    const heading = page.locator('h1:text("Dashboard")');
    await expect(heading).toBeVisible();
  });

  test('should have a sidebar with navigation links', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');

    // Check for the sidebar
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();

    // Check for a few navigation links
    await expect(page.locator('text="Dashboard"')).toBeVisible();
    await expect(page.locator('text="Websites"')).toBeVisible();
    await expect(page.locator('text="Products"')).toBeVisible();
  });
});