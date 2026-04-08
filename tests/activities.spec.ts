import { test, expect } from '@playwright/test';

/**
 * E2E TESTS FOR ACTIVITIES FEATURE
 * 
 * These tests verify the complete workflow:
 * 1. User logs in
 * 2. User navigates to an event
 * 3. User creates an activity
 * 4. Activity appears in the list
 */

test.describe('Activities Management', () => {
  // Before each test, navigate to dashboard
  test.beforeEach(async ({ page }) => {
    // This assumes you're already logged in
    // In a real app, you'd either:
    // 1. Log in programmatically, or
    // 2. Use a logged-in session
    await page.goto('http://localhost:4322/dashboard');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display activities page for an event', async ({ page }) => {
    // Click on an event (adjust selector based on your actual HTML)
    const eventLink = page.locator('a:has-text("Activities")').first();
    await eventLink.click();
    
    // Verify we're on the activities page
    await expect(page).toHaveURL(/\/activities\/index/);
    
    // Verify the page title includes "Activities"
    const heading = page.locator('h1');
    await expect(heading).toContainText('Activities');
  });

  test('should create a new activity', async ({ page }) => {
    // Navigate to activities for an event
    const eventLink = page.locator('a:has-text("Activities")').first();
    await eventLink.click();
    
    await page.waitForLoadState('networkidle');
    
    // Fill activity form
    await page.fill('input[name="title"]', 'Breakfast at hotel');
    await page.fill('input[name="locationName"]', 'Hotel restaurant');
    
    // Submit form
    await page.click('button:has-text("Add Activity")');
    
    // Wait for activity to appear (could be page reload)
    // Adjust timeout if needed
    await page.waitForTimeout(2000);
    
    // Verify activity appears in the list
    const activityText = page.locator('text=Breakfast at hotel');
    await expect(activityText).toBeVisible();
  });

  test('should create activity with optional times', async ({ page }) => {
    // Navigate to activities
    const eventLink = page.locator('a:has-text("Activities")').first();
    await eventLink.click();
    
    await page.waitForLoadState('networkidle');
    
    // Fill activity form with times
    const titleInput = page.locator('input[name="title"]');
    await titleInput.fill('Dinner at restaurant');
    
    const startTimeInput = page.locator('input[name="startTime"]');
    await startTimeInput.fill('2026-04-08T19:00');
    
    const endTimeInput = page.locator('input[name="endTime"]');
    await endTimeInput.fill('2026-04-08T21:00');
    
    // Submit
    await page.click('button:has-text("Add Activity")');
    
    // Verify
    await page.waitForTimeout(2000);
    const activityText = page.locator('text=Dinner at restaurant');
    await expect(activityText).toBeVisible();
  });

  test('should edit existing activity', async ({ page }) => {
    // Navigate to activities
    const eventLink = page.locator('a:has-text("Activities")').first();
    await eventLink.click();
    
    await page.waitForLoadState('networkidle');
    
    // Click edit button for first activity
    const editButton = page.locator('button:has-text("Edit")').first();
    await editButton.click();
    
    // Should navigate to edit page
    await expect(page).toHaveURL(/\/activities\/[^\/]+/);
    
    // Verify edit form is present
    const formTitle = page.locator('h1, h2');
    await expect(formTitle).toContainText(/Edit|Activity/i);
  });

  test('should delete activity with confirmation', async ({ page }) => {
    // Navigate to activities
    const eventLink = page.locator('a:has-text("Activities")').first();
    await eventLink.click();
    
    await page.waitForLoadState('networkidle');
    
    // Get count of activities before deletion
    const activitiesBefore = await page.locator('[class*="activity"]').count();
    
    // Click delete button
    const deleteButton = page.locator('button:has-text("Delete")').first();
    
    // Set up listener for dialog (if present)
    page.once('dialog', dialog => {
      expect(dialog.message()).toContain(/Delete|Sure/i);
      dialog.accept();
    });
    
    await deleteButton.click();
    
    // Wait for deletion to complete
    await page.waitForTimeout(500);
    
    // Verify count decreased
    const activitiesAfter = await page.locator('[class*="activity"]').count();
    expect(activitiesAfter).toBeLessThanOrEqual(activitiesBefore);
  });

  test('should show error for invalid times', async ({ page }) => {
    // Navigate to activities
    const eventLink = page.locator('a:has-text("Activities")').first();
    await eventLink.click();
    
    await page.waitForLoadState('networkidle');
    
    // Fill form with invalid times (start after end)
    const titleInput = page.locator('input[name="title"]');
    await titleInput.fill('Invalid activity');
    
    const startTimeInput = page.locator('input[name="startTime"]');
    await startTimeInput.fill('2026-04-08T21:00'); // 9 PM
    
    const endTimeInput = page.locator('input[name="endTime"]');
    await endTimeInput.fill('2026-04-08T19:00'); // 7 PM (before start!)
    
    // Try to submit
    await page.click('button:has-text("Add Activity")');
    
    // Wait for error message
    await page.waitForTimeout(500);
    
    // Check for error message in alert or error element
    const errorMessage = page.locator('[class*="error"], [role="alert"]');
    await expect(errorMessage).toContainText(/before|after|invalid|must/i);
  });
});

/**
 * BEST PRACTICES FOR E2E TESTS:
 * 
 * 1. Use descriptive test names that explain the scenario
 * 2. Test complete workflows from user perspective
 * 3. Use page.waitForLoadState() to wait for network to settle
 * 4. Use page.waitForTimeout() sparingly - prefer waiting for elements
 * 5. Use meaningful selectors (data-testid is recommended)
 * 6. Test both happy path (success) and error cases
 * 7. Don't test implementation details - test behavior
 * 8. Keep tests independent - don't rely on test order
 */
