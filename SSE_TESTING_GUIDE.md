# SSE Real-Time Updates - Testing Guide

## Quick Start (5 minutes)

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: View test scenarios
node TEST_SSE_SCRIPT.mjs
```

## Test Users

- **cathyd** / password123 (member of Houston Party People)
- **charlie** / CharliePass123 (member of Houston Party People)

## Fastest Test (Scenario 1: Same User - Two Tabs)

1. Open `http://localhost:3000` in **Tab A**
   - Login: cathyd / password123
   - Go to any event

2. Open `http://localhost:3000` in **Tab B** (same browser)
   - Login: cathyd / password123
   - Go to the **SAME event** as Tab A

3. In **Tab B**: Create a new activity
   - Click "+ Add Activity"
   - Enter title: "Test SSE"
   - Submit

4. **Expected in Tab A:**
   - ✅ Green toast appears: "New activity: Test SSE"
   - ✅ Activities list refreshes automatically
   - ✅ Console shows: "📢 New activity: ..."

## Debug Checklist

### Connection Issues

```
DevTools → Network tab → Filter "stream"
```

Should show:

- Request: `GET /api/events/stream?eventId=...`
- Status: 200
- Type: XHR (or fetch)
- State: **pending** (long-lived connection)

### No Notification?

1. Check DevTools **Console** tab
   - Should show: `✅ Connected to real-time updates`
   - If not: session expired or event page didn't load

2. Check Network activity:
   - Is `/api/events/stream` showing as pending?
   - Is POST to `/api/activities/create` returning 201?

3. Manually refresh Tab A page
   - If new activity appears → backend is working, SSE issue
   - If not → activity creation failed

### Toast Not Visible?

1. Check if it's auto-hidden (dismisses after 3 seconds)
2. Create activity again from Tab B
3. Watch for green banner at bottom-right of Tab A

### No List Refresh?

1. Browser console should show errors if any
2. Check `loadContent()` function is called
3. Try manual page refresh to compare

## Test Scenarios Overview

| #   | Scenario                       | Time | Setup                   | Key Check                          |
| --- | ------------------------------ | ---- | ----------------------- | ---------------------------------- |
| 1   | Same user, 2 tabs              | 5m   | cathyd in 2 tabs        | Toast appears                      |
| 2   | Different users                | 5m   | cathyd + charlie        | Cross-user notification            |
| 3   | Connection resilience          | 10m  | Close/reopen tabs       | Auto-reconnect works               |
| 4   | Performance (5 activities)     | 10m  | Rapid creates           | All toasts appear                  |
| 5   | Network throttling             | 15m  | Slow 3G + recover       | Delayed but arrives                |
| 6   | Event isolation                | 5m   | 2 different events      | Notification only in correct event |
| 7   | Memory leak (10 notifications) | 10m  | Long session            | Heap < 5MB increase                |
| 8   | Browser compatibility          | 10m  | Chrome, Firefox, Safari | All work identically               |

**Total time for full suite: ~70 minutes**

## Key Files

```
src/pages/api/events/stream.ts
  ├─ SSE endpoint
  ├─ Client registry management
  └─ broadcastUpdate() function

src/pages/api/activities/create.ts
  ├─ Imports broadcastUpdate
  └─ Calls broadcastUpdate after activity created

src/pages/events/[id].astro
  ├─ EventSource connection
  ├─ Message listener
  └─ Toast notification + loadContent() refresh
```

## Console Messages

✅ **Good** (look for these):

```javascript
✅ Connected to real-time updates
📢 New activity: { id, title, ... }
```

❌ **Bad** (if you see these):

```javascript
❌ Session expired
❌ Error parsing SSE
Unauthorized
```

## Network Traffic Expected

### When page loads:

```
GET /api/events/stream?eventId=xxx → 200 (pending)
```

### When activity created in another tab:

```
POST /api/activities/create → 201
// SSE receives data event
data: {"type":"activity_created","activity":{...},"timestamp":"..."}
```

### Response chain:

1. User creates activity (POST)
2. Backend creates activity (DB insert)
3. Backend broadcasts to all connected clients
4. Client receives data event (< 1 second typically)
5. Client shows toast + refreshes list

## Pre-Deploy Checklist

- [ ] Scenario 1 works (same user, 2 tabs)
- [ ] Scenario 2 works (different users)
- [ ] No console errors in any scenario
- [ ] Toast notifications appear reliably
- [ ] Activities list refreshes automatically
- [ ] Connection auto-recovers after interruption
- [ ] No memory leaks after 30 minutes of activity
- [ ] All 4 modern browsers tested

## If Something Breaks

1. **Check build:**

   ```bash
   npm run build
   ```

   Should complete without errors

2. **Check logs:**
   - Terminal where `npm run dev` runs
   - Browser DevTools Console

3. **Verify endpoints exist:**

   ```bash
   # Should return connection
   curl http://localhost:3000/api/events/stream
   ```

4. **Check session:**
   - DevTools → Application → Cookies
   - Should have: `sessionId` cookie

## Automated Testing (Future)

When ready for CI/CD, test template is in TEST_SSE_SCRIPT.mjs

To add Playwright tests:

1. Copy AUTOMATED_TEST_TEMPLATE from TEST_SSE_SCRIPT.mjs
2. Save to `src/tests/sse.spec.ts`
3. Run: `npx playwright test sse.spec.ts`

## Cleanup for Deployment

Before going live:

- [ ] Remove `broadcastUpdate` calls from dev/debug endpoints
- [ ] Verify no console.log() calls remain in production code
- [ ] Check /api/events/stream handles session timeout properly
- [ ] Monitor client registry size in production
