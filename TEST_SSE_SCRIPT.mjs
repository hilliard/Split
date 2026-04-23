#!/usr/bin/env node

/**
 * SSE Real-Time Updates Test Script
 *
 * This script provides manual and automated test scenarios for Server-Sent Events
 * in the Split expense tracking application.
 *
 * REQUIREMENTS:
 * - App running on http://localhost:3000 (or configured URL)
 * - Test users created: cathyd, charlie
 * - At least one shared event/group between test users
 *
 * MANUAL TEST SCENARIOS (Run in browser):
 */

const TEST_SCENARIOS = {
  SCENARIO_1: {
    name: 'Same User - Two Tabs (Activity Creation)',
    steps: [
      '1. Open http://localhost:3000 in Tab A - Log in as: cathyd / password123',
      '2. Navigate to an event (e.g., Houston Party People event)',
      '3. Open http://localhost:3000 in Tab B - Log in as: cathyd / password123',
      '4. Navigate to the SAME event in Tab B',
      "5. Tab B (DevTools → Console) - Verify: '✅ Connected to real-time updates'",
      "6. Tab B - Click '+ Add Activity' button",
      "7. Enter activity title: 'SSE Test Activity'",
      '8. Submit the form',
      '',
      'EXPECTED RESULTS in Tab A:',
      "  ✅ Green toast notification appears: 'New activity: SSE Test Activity'",
      '  ✅ Toast auto-dismisses after 3 seconds',
      '  ✅ Activities list refreshes and shows new activity',
      "  ✅ DevTools Console shows: '📢 New activity: {activity object}'",
    ],
  },

  SCENARIO_2: {
    name: 'Different Users - Incognito + Normal (Activity Creation)',
    steps: [
      '1. Tab A (Normal) - Log in as: cathyd / password123',
      '2. Navigate to Houston Party People event',
      '3. Tab B (Incognito/Private) - Log in as: charlie / CharliePass123',
      '4. Navigate to the SAME event',
      '5. Both tabs open DevTools → Console',
      "6. Tab B - Click '+ Add Activity'",
      "7. Enter title: 'Multi-User SSE Test'",
      '8. Submit',
      '',
      'EXPECTED RESULTS in Tab A:',
      '  ✅ Toast notification appears immediately',
      '  ✅ Activity appears in list (created by charlie)',
      '  ✅ No page reload required',
      '',
      'EXPECTED RESULTS in Tab B:',
      '  ✅ Activity creation succeeds (API returns 201)',
    ],
  },

  SCENARIO_3: {
    name: 'Connection Resilience - Tab Close & Reconnect',
    steps: [
      '1. Tab A - Log in as: cathyd',
      '2. Open event → DevTools → Network tab',
      "3. Filter: 'stream' - You should see: GET /api/events/stream?eventId=... with status 200",
      "4. This request should show 'pending' (long-lived connection)",
      '5. Leave Tab A open',
      '6. Tab B - Log in as: charlie',
      '7. Create activity in Tab B',
      '8. Tab A - Should receive notification',
      '9. Close Tab A',
      '10. Tab B - Create another activity',
      '11. Re-open Tab A (new tab same URL)',
      '12. Should auto-connect to stream (new connection ID)',
      '',
      'EXPECTED RESULTS:',
      '  ✅ First activity triggers notification in Tab A',
      '  ✅ No errors in console after Tab A closes',
      '  ✅ New Tab A connection shows in Network tab',
      '  ✅ Can receive notifications after reconnecting',
    ],
  },

  SCENARIO_4: {
    name: 'Performance - Multiple Activities Rapid Fire',
    steps: [
      '1. Tab A - Log in as: cathyd',
      '2. Tab B - Log in as: charlie',
      '3. Both open DevTools → Performance tab → start recording',
      '4. Tab B - Rapidly create 5 activities (with delays between)',
      '5. Tab A should receive 5 notifications',
      '6. Stop recording in both DevTools',
      '',
      'EXPECTED RESULTS:',
      '  ✅ All 5 notifications appear in Tab A',
      '  ✅ No console errors',
      '  ✅ Tab A remains responsive',
      '  ✅ Tab B creation succeeds for all',
      '  ✅ Performance: < 100ms latency between create & notification',
    ],
  },

  SCENARIO_5: {
    name: 'Network Interruption Recovery',
    steps: [
      '1. Tab A - Log in as: cathyd → open event',
      "2. DevTools → Network tab → throttle to 'Slow 3G'",
      '3. Tab B - Log in as: charlie → same event',
      '4. Tab B - Create activity',
      '5. Tab A - Should eventually receive notification (may take 10-30s)',
      "6. DevTools → Network → back to 'No throttling'",
      '7. Tab B - Create another activity',
      '8. Tab A - Should receive notification quickly',
      '',
      'EXPECTED RESULTS:',
      '  ✅ Notification eventually arrives despite throttling',
      '  ✅ No permanent connection loss',
      '  ✅ Connection recovers after throttling removed',
      '  ✅ No duplicate notifications',
    ],
  },

  SCENARIO_6: {
    name: 'Concurrent Users in Different Events',
    steps: [
      '1. Tab A - Log in as: cathyd → Event 1',
      '2. Tab B - Log in as: charlie → Event 1 (same as Tab A)',
      '3. Tab C - Log in as: cathyd → Event 2 (different event)',
      '4. Tab B - Create activity in Event 1',
      '5. Check Tab A and Tab C',
      '',
      'EXPECTED RESULTS:',
      '  ✅ Tab A (Event 1): Receives notification',
      '  ✅ Tab C (Event 2): Does NOT receive notification (correct!)',
      '  ✅ Broadcasts only sent to correct eventId subscribers',
    ],
  },

  SCENARIO_7: {
    name: 'Memory Leak Check - Long Session',
    steps: [
      '1. Tab A - Log in as: cathyd → Event page',
      '2. DevTools → Memory tab',
      '3. Take heap snapshot (baseline)',
      '4. Create 10 activities from Tab B over 5 minutes',
      '5. Receive 10 notifications in Tab A',
      '6. After 5 minutes → Take another heap snapshot',
      '7. Compare heap sizes',
      '',
      'EXPECTED RESULTS:',
      '  ✅ Heap size increase < 5MB',
      '  ✅ No detached DOM nodes',
      '  ✅ Client registry cleans up properly',
      '  ✅ Connection remains stable',
    ],
  },

  SCENARIO_8: {
    name: 'Browser Compatibility Check',
    steps: [
      'Test in each browser:',
      '  - Chrome/Chromium (EventSource native)',
      '  - Firefox (EventSource native)',
      '  - Safari (EventSource native)',
      '  - Edge (EventSource native)',
      '',
      'For each:',
      '1. Log in → open event',
      "2. Check DevTools console for: '✅ Connected to real-time updates'",
      '3. Create activity from another user',
      '4. Verify notification appears',
    ],
  },
};

// ============================================================================
// AUTOMATED TEST HELPER (for use with Playwright or similar)
// ============================================================================

const AUTOMATED_TEST_TEMPLATE = `
import { test, expect } from '@playwright/test';

test.describe('SSE Real-Time Updates', () => {
  
  const BASE_URL = 'http://localhost:3000';
  
  test('should connect to SSE stream on event page load', async ({ page }) => {
    // Login
    await page.goto(BASE_URL + '/auth/login');
    await page.fill('input[name="username"]', 'cathyd');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button:has-text("Login")');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    
    // Navigate to an event
    const eventLink = await page.locator('[data-testid="event-link"]').first();
    const eventId = await eventLink.getAttribute('href');
    await page.goto(BASE_URL + eventLink);
    
    // Check for SSE connection message in console
    const consoleLogs = [];
    page.on('console', msg => consoleLogs.push(msg.text()));
    
    // Wait a moment for connection
    await page.waitForTimeout(1000);
    
    expect(consoleLogs.some(log => log.includes('Connected to real-time'))).toBe(true);
  });

  test('should receive real-time notification when activity is created', async ({ browser }) => {
    // Create two browser contexts (simulate two users)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // User 1: cathyd - login and open event
    await page1.goto(BASE_URL + '/auth/login');
    await page1.fill('input[name="username"]', 'cathyd');
    await page1.fill('input[name="password"]', 'password123');
    await page1.click('button:has-text("Login")');
    await page1.waitForURL('**/dashboard**');
    
    // Navigate to event (adjust selector as needed)
    const eventId = 'some-event-id'; // Replace with actual test event ID
    await page1.goto(BASE_URL + '/events/' + eventId);
    
    // User 2: charlie - login and open same event
    await page2.goto(BASE_URL + '/auth/login');
    await page2.fill('input[name="username"]', 'charlie');
    await page2.fill('input[name="password"]', 'CharliePass123');
    await page2.click('button:has-text("Login")');
    await page2.waitForURL('**/dashboard**');
    await page2.goto(BASE_URL + '/events/' + eventId);
    
    // page2: Create activity
    await page2.click('button:has-text("Add Activity")');
    await page2.fill('input[name="title"]', 'Test Activity SSE');
    await page2.click('button:has-text("Create")');
    
    // page1: Check for toast notification
    const toast = page1.locator('#toast-message');
    await expect(toast).toContainText('Test Activity SSE', { timeout: 5000 });
    
    await context1.close();
    await context2.close();
  });

  test('should refresh activities list after receiving notification', async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    // Setup both pages (login and navigate to same event)
    // ... (same as above test)
    
    // Count activities before
    const countBefore = await page1.locator('[data-testid="activity-item"]').count();
    
    // Create activity in page2
    // ... (same as above)
    
    // Wait for list refresh
    await page1.waitForTimeout(1500); // SSE refresh delay
    
    const countAfter = await page1.locator('[data-testid="activity-item"]').count();
    expect(countAfter).toBe(countBefore + 1);
    
    await context1.close();
    await context2.close();
  });

  test('should auto-reconnect on SSE connection loss', async ({ page }) => {
    // Login and open event
    await page.goto(BASE_URL + '/auth/login');
    // ... (login steps)
    
    const eventPage = BASE_URL + '/events/some-event-id';
    await page.goto(eventPage);
    
    // Simulate connection drop via DevTools
    await page.context().setOffline(true);
    await page.waitForTimeout(2000);
    await page.context().setOffline(false);
    
    // Should automatically reconnect
    await page.waitForTimeout(3000);
    
    // Check console for reconnection message
    const consoleLogs = [];
    page.on('console', msg => consoleLogs.push(msg.text()));
    
    expect(consoleLogs.some(log => 
      log.includes('Connection lost') || log.includes('auto-reconnect')
    )).toBe(true);
  });
});
`;

// ============================================================================
// DISPLAY HELPER
// ============================================================================

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                   SSE Real-Time Updates - Test Script                      ║
║                                                                            ║
║  This script provides comprehensive testing scenarios for Server-Sent      ║
║  Events (SSE) in the Split expense tracking application.                  ║
╚════════════════════════════════════════════════════════════════════════════╝

📋 TEST SCENARIOS:
`);

Object.entries(TEST_SCENARIOS).forEach(([key, scenario]) => {
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${key}: ${scenario.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  scenario.steps.forEach((step) => console.log(step));
});

console.log(`

╔════════════════════════════════════════════════════════════════════════════╗
║                         QUICK START CHECKLIST                             ║
╚════════════════════════════════════════════════════════════════════════════╝

Before Testing:
  ☐ Run: npm run dev
  ☐ Verify app runs on http://localhost:3000
  ☐ Verify users exist: cathyd, charlie
  ☐ Verify shared event exists: "Houston Party People"

Quick Test (5 minutes):
  ☐ Run Scenario 1: Same User - Two Tabs
  ☐ If notification appears → SSE is working! ✅

Full Test Suite (30 minutes):
  ☐ Run all 8 scenarios in order
  ☐ Document any failures
  ☐ Check DevTools Console for errors
  ☐ Check DevTools Network tab for /api/events/stream calls

Expected Network Activity:
  ✅ Initial request: GET /api/events/stream?eventId=XXX → 200 (pending)
  ✅ Activity create: POST /api/activities/create → 201
  ✅ SSE event received (data: {...} chunks in stream request)

Key Files for Debugging:
  📄 src/pages/api/events/stream.ts (SSE endpoint)
  📄 src/pages/api/activities/create.ts (activity creation + broadcast)
  📄 src/pages/events/[id].astro (EventSource client listener)

Common Issues & Solutions:

  Issue: "Connected to real-time updates" doesn't appear
  → Check: console.log in browser DevTools → Console tab
  → Fix: Verify sessionId cookie is set, event page loaded

  Issue: Toast doesn't appear when activity created
  → Check: Network tab for /api/events/stream (should be pending)
  → Check: No JavaScript errors in console
  → Fix: Make sure both users are on same event page

  Issue: Toast appears but activities list doesn't refresh
  → Check: loadContent() function exists and is callable
  → Fix: Refresh manually or check for JS errors

  Issue: Connection drops frequently
  → Check: Browser console for errors
  → Fix: Verify session hasn't expired (24 hour limit)

Automated Testing:

  For Playwright integration, use the test template above.
  Save as: src/tests/sse.spec.ts
  Run: npx playwright test sse.spec.ts

  Key assertions to add:
    - Toast notification appears within 5 seconds
    - Activity list refreshes automatically
    - No console errors
    - Connection auto-recovers after disconnect
    - Correct eventId isolation (no cross-event notifications)

Performance Benchmarks (from Scenario 4):
  ✅ Latency: < 500ms (create → notification)
  ✅ Toast render: < 100ms
  ✅ List refresh: < 1000ms
  ✅ Memory: < 5MB increase per 10 notifications

`);

// Note: Playwright test template included above - copy to src/tests/sse.spec.ts when ready
