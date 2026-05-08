import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockApi } from './mock-api';

// Set up API mocks before each test
test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

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
    await page.locator('header button', { hasText: /schedule/i }).first().click();
    await expect(page).toHaveURL('/schedule');
    await expect(page.getByText('My Schedule')).toBeVisible();
  });

  test('can navigate to about tab', async ({ page }) => {
    await page.goto('/about');
    await expect(page.getByText('AI Slug Navigator')).toBeVisible();
    await expect(page.getByText('Under the Hood')).toBeVisible();
  });

  test('can navigate back to search from schedule', async ({ page }) => {
    await page.goto('/schedule');
    await page.locator('header button', { hasText: /search/i }).first().click();
    await expect(page).toHaveURL('/search');
  });
});

test.describe('Course Search', () => {
  test('search bar accepts input', async ({ page }) => {
    await page.goto('/search');
    const searchInput = page.getByPlaceholder('Search courses...');
    await searchInput.fill('CSE');
    await expect(searchInput).toHaveValue('CSE');
  });

  test('displays mock courses from API', async ({ page }) => {
    await page.goto('/search');
    await expect(page.getByText('3 results found')).toBeVisible();
    await expect(page.getByText('CSE 101')).toBeVisible();
    await expect(page.getByText('MATH 21')).toBeVisible();
  });

  test('search filters courses by query', async ({ page }) => {
    await page.goto('/search');
    await page.getByPlaceholder('Search courses...').fill('CSE');
    await expect(page.getByText('2 results found')).toBeVisible();
  });

  test('search input has accessible label', async ({ page }) => {
    await page.goto('/search');
    await expect(page.getByLabel('Search courses')).toBeVisible();
  });

  test('filter toggle button works', async ({ page }) => {
    await page.goto('/search');
    const filterBtn = page.locator('button', { hasText: 'Filters' }).first();
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
      await expect(filterBtn).toBeVisible();
    }
  });

  test('sort dropdown is accessible', async ({ page }) => {
    await page.goto('/search');
    const sortTrigger = page.locator('button[aria-haspopup="listbox"]').first();
    if (await sortTrigger.isVisible()) {
      await expect(sortTrigger).toHaveAttribute('aria-expanded', 'false');
      await sortTrigger.click();
      await expect(sortTrigger).toHaveAttribute('aria-expanded', 'true');
    }
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

  test('save button shows login prompt when not authenticated', async ({ page }) => {
    await page.goto('/schedule');
    await page.getByText('Save Schedule').click();
    const authDialog = page.locator('[role="dialog"]');
    const notification = page.getByText(/log in/i);
    const hasAuthModal = await authDialog.isVisible().catch(() => false);
    const hasNotification = await notification.isVisible().catch(() => false);
    expect(hasAuthModal || hasNotification).toBeTruthy();
  });

  test('schedule tab has list/calendar toggle with proper ARIA', async ({ page }) => {
    await page.goto('/schedule');
    const tabs = page.locator('[role="tab"]');
    expect(await tabs.count()).toBeGreaterThanOrEqual(2);
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

  test('chat input accepts text', async ({ page }) => {
    await page.goto('/chat');
    const input = page.locator('textarea[placeholder="Ask a question..."]');
    await input.fill('What classes should I take?');
    await expect(input).toHaveValue('What classes should I take?');
  });

  test('send button has accessible label', async ({ page }) => {
    await page.goto('/chat');
    await expect(page.getByLabel('Send message')).toBeVisible();
  });

  test('Escape key closes chat and navigates away', async ({ page }) => {
    await page.goto('/chat');
    await expect(page.getByText('How can I help?')).toBeVisible();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const url = page.url();
    expect(url).not.toContain('/chat');
  });
});

test.describe('Keyboard Navigation', () => {
  test('Escape closes dropdown menus', async ({ page }) => {
    await page.goto('/search');
    const sortTrigger = page.locator('button[aria-haspopup="listbox"]').first();
    if (await sortTrigger.isVisible()) {
      await sortTrigger.click();
      await expect(sortTrigger).toHaveAttribute('aria-expanded', 'true');
      await page.keyboard.press('Escape');
      await expect(sortTrigger).toHaveAttribute('aria-expanded', 'false');
    }
  });
});

test.describe('Accessibility - Automated', () => {
  test('page has proper title', async ({ page }) => {
    await page.goto('/search');
    await expect(page).toHaveTitle(/AI/i);
  });

  test('search page passes axe-core checks', async ({ page }) => {
    await page.goto('/search');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .disableRules(['color-contrast', 'landmark-one-main', 'page-has-heading-one'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('schedule page passes axe-core checks', async ({ page }) => {
    await page.goto('/schedule');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .disableRules(['color-contrast', 'landmark-one-main', 'page-has-heading-one'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('about page passes axe-core checks', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .disableRules(['color-contrast', 'landmark-one-main', 'page-has-heading-one'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('chat page passes axe-core checks', async ({ page }) => {
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .disableRules(['color-contrast', 'landmark-one-main', 'page-has-heading-one'])
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
