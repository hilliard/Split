# Invitation UI Implementation Roadmap

## Status
Email infrastructure complete. Time to build the user-facing UI.

## Phase 1: Dashboard Invitations Section

### What to Build
Add section to `/dashboard/index.astro` showing pending invitations received by current user.

**Location:** Below the "Your Events" section

**Content:**
- Heading: "Pending Invitations"
- List of invitations with:
  - Group name (who invited you)
  - Sender name (who sent the invitation)
  - "Accept" button (calls `POST /api/groups/invitations/accept`)
  - "Decline" button (marks as rejected)
  - Expiration date (when invitation expires)
  - Empty state: "No pending invitations"

**API Needed:**
```typescript
// GET /api/dashboard/pending-invitations
// Returns: Array<{
//   id, groupId, groupName, invitedBy, invitedByName, 
//   expiresAt, status
// }>
```

**Component:** Can be inline in dashboard or separate component

### Implementation Steps
1. Create endpoint: `src/pages/api/dashboard/pending-invitations.ts`
   - Query `pendingGroupInvitations` JOIN `expenseGroups` JOIN `humans`
   - Filter by email + status = 'pending' + not expired
   - Authentication required
   
2. Update `src/pages/dashboard/index.astro`
   - Fetch pending invitations on page load
   - Display with styling matching existing cards
   - Add Accept button (POST endpoint)
   - Add Decline button (PATCH endpoint)

3. Create endpoint: `src/pages/api/groups/invitations/decline.ts`
   - Mark invitation status as 'rejected'
   - Remove from display list

## Phase 2: Group Invite Form

### What to Build
Add invite form to group detail/settings page where owner can invite new members.

**Location:** 
- Option A: New `/groups/[name]/settings.astro` page
- Option B: New `/groups/manage/[id].astro` page
- Option C: Add to existing group detail page

**Content:**
- Heading: "Invite Members"
- Email input field
- "Send Invitation" button
- Success message after sending
- List of: current members + pending invitations

**Fields:**
- Email: Required, must be valid email format
- Optional: personal message (future enhancement)

**API Already Built:** `POST /api/groups/[id]/invite`

**Component:** Can be inline or separate

### Implementation Steps
1. Create new page: `src/pages/groups/[name]/manage.astro`
   - Show group name and details
   - Display current members list
   - Display pending invitations (if owner)
   - Add invite form
   - Require ownership verification

2. Add form to page
   - Email input with validation
   - Submit button (calls existing endpoint)
   - Success/error toast
   - Loading state while sending

3. Create endpoint: `src/pages/api/groups/[id]/members.ts`
   - GET: Return members + pending invitations for a group
   - Authentication: Must own group or be member
   - Used to populate the members list

## Phase 3: Member Management

### What to Build (Future)
Add ability to manage group members.

**Features:**
- Remove member from group
- Resend invitation to pending member
- Cancel pending invitation
- See member join date
- Transfer group ownership

**Not yet needed - do this after Phase 1 & 2**

## Implementation Order

1. ✅ Email infrastructure (DONE)
2. → **Pending Invitations on Dashboard** (do first)
   - Quick UI addition
   - Minimal new API
   - High visibility to users
3. → **Group Invite Form**
   - Depends on Phase 1 API patterns
   - Enables group owners to use feature
4. Member management (later)

## Database Queries Needed

### For Dashboard Invitations
```sql
SELECT 
  pgi.id,
  pgi.group_id,
  eg.name as group_name,
  h.first_name || ' ' || h.last_name as invited_by_name,
  pgi.invited_at,
  pgi.expires_at
FROM pending_group_invitations pgi
JOIN expense_groups eg ON pgi.group_id = eg.id
JOIN humans h ON pgi.invited_by = h.id
WHERE pgi.email = $1
  AND pgi.status = 'pending'
  AND pgi.expires_at > NOW()
ORDER BY pgi.invited_at DESC;
```

### For Group Members List
```sql
-- Members
SELECT h.*, gm.joined_at
FROM group_members gm
JOIN humans h ON gm.user_id = h.id
WHERE gm.group_id = $1
ORDER BY gm.joined_at;

-- Pending Invitations
SELECT id, email, invited_at, expires_at
FROM pending_group_invitations
WHERE group_id = $1 AND status = 'pending'
ORDER BY invited_at DESC;
```

## Styling Notes

**Use existing patterns from dashboard:**
- White card with subtle shadow
- Dark mode support (dark:bg-slate-800)
- Indigo accent color (indigo-600)
- Responsive grid layout
- Consistent spacing (p-5 sm:p-6)

**For lists:**
- Use grid or simple div list
- Card per invitation/member
- Right-align action buttons
- Show email for pending invitations

## Testing Checklist

- [ ] Invitations appear on dashboard for correct user
- [ ] Non-expired invitations show
- [ ] Expired invitations hidden
- [ ] Accept button works (redirects to dashboard)
- [ ] Decline button works (removes from list)
- [ ] Invite form visible on group page (for owner)
- [ ] Invalid email rejected by form
- [ ] Valid email sends invitation
- [ ] Email sent notification shows
- [ ] Pending invitations show on group members list
- [ ] Current members show on group members list
- [ ] Non-owner can't access group settings

## Files to Create/Modify

### Phase 1
- `src/pages/api/dashboard/pending-invitations.ts` (NEW)
- `src/pages/api/groups/invitations/decline.ts` (NEW)
- `src/pages/dashboard/index.astro` (MODIFY)

### Phase 2
- `src/pages/groups/[name]/manage.astro` (NEW)
- `src/pages/api/groups/[id]/members.ts` (NEW)

## Quick Implementation Timeline

- Phase 1 (Dashboard): ~30 min
- Phase 2 (Invite Form): ~30 min
- Total: ~1 hour to full UI

## Next Command

Ready to start Phase 1. Should I build the pending invitations dashboard section?
