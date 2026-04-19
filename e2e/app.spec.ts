import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('homepage redirects to /search', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/search');
  });

  test('search page loads with header and search bar', async ({ page }) => {
    await page.goto('/search');
    await expect(page.locator('header')).toBeVisible();
    await expect(page.getByPlaceholder('Search courses...')).toBeVisible();
  });

  test('can navigate to schedule tab', async ({ page }) => {
    await page.goto('/search');
    // Click schedule tab in header (desktop)
    await page.locator('header button', { hasText: /schedule/i }).first().click();
    await expect(page).toHaveURL('/schedule');
    await expect(page.getByText('My Schedule')).toBeVisible();
  });

  test('can navigate to about tab', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByText('AI Slug Navigator')).toBeVisible();
    await expect(page.getByText('Under the Hood')).toBeVisible();
  });
});

test.describe('Course Search', () => {
  test('search bar accepts input', async ({ page }) => {
    await page.goto('/search');
    const searchInput = page.getByPlaceholder('Search courses...');
    await searchInput.fill('CSE');
    await expect(searchInput).toHaveValue('CSE');
  });

  test('results count is displayed', async ({ page }) => {
    await page.goto('/search');
    await expect(page.getByText(/results found/)).toBeVisible();
  });
});

test.describe('Schedule Page', () => {
  test('shows empty schedule state', async ({ page }) => {
    await page.goto('/schedule');
    await expect(page.getByText(/Add courses from Search/)).toBeVisible();
  });

  test('shows unit counter', async ({ page }) => {
    await page.goto('/schedule');
    await expect(page.getByText('Total Units')).toBeVisible();
  });

  test('shows save schedule button', async ({ page }) => {
    await page.goto('/schedule');
    await expect(page.getByText('Save Schedule')).toBeVisible();
  });
});

test.describe('Chat', () => {
  test('chat page opens chat sidebar', async ({ page }) => {
    await page.goto('/chat');
    await expect(page.getByText('How can I help?')).toBeVisible();
  });

  test('shows suggested prompts', async ({ page }) => {
    await page.goto('/chat');
    await expect(page.getByText('Find an easy GE')).toBeVisible();
    await expect(page.getByText('No Friday classes')).toBeVisible();
    await expect(page.getByText('Balance workload')).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('page has proper title', async ({ page }) => {
    await page.goto('/search');
    await expect(page).toHaveTitle(/AI/i);
  });

  test('send button has accessible label', async ({ page }) => {
    await page.goto('/chat');
    await expect(page.getByLabel('Send message')).toBeVisible();
  });
});
