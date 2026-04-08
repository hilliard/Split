# Invitation System - Testing Guide

## Complete User Journey

### Scenario: User A invites User B to a group

#### Setup
- User A and User B have registered accounts
- User A has created a group (or you create one on the group creation page)
- Both are logged in (can use incognito/separate browser or just switch user in database if testing locally)

---

## Test Flow 1: Dashboard Pending Invitations

### Step 1: Navigate to Group Management
1. Log in as User A
2. Go to /dashboard
3. Find the group you want to invite someone to
4. There should be a "Manage" or similar option (or navigate directly to `/groups/{groupId}/manage`)

### Step 2: Send Invitation
1. On the group management page (`/groups/{groupId}/manage`)
2. Scroll to "Invite Members" section at the top
3. Enter User B's email address
4. Click "Send Invite"
5. You should see a success toast notification: "Invitation sent successfully!"
6. The "Pending Invitations" section below should refresh and show the invited email

**Expected:**
- ✅ Toast notification appears briefly
- ✅ Pending invitations list updates
- ✅ Shows email address, who invited them, and expiration date

### Step 3: Receive Invitation on Dashboard
1. Log in as User B (different browser/incognito window OR check the database)
2. Navigate to /dashboard
3. Look for "Pending Invitations" section (above "Your Events")
4. You should see the group name and User A's name as the inviter

**Expected:**
- ✅ Shows group name
- ✅ Shows "Invited by [User A]"
- ✅ Shows expiration date (30 days from now)
- ✅ Green "Accept" button
- ✅ Gray "Decline" button

### Step 4: Accept Invitation
1. Click the green "Accept" button
2. You should see a success toast: "Invitation accepted! You've joined the group."
3. The invitation should disappear from the list

**Expected:**
- ✅ Toast notification confirms acceptance
- ✅ Invitation is removed from pending list
- ✅ User is now a member of the group

### Step 5: Verify Membership
1. Go back to /dashboard
2. Scroll to "Your Events" or look for the group in your groups list
3. The group should now be accessible/visible

**Expected:**
- ✅ User B can see/access the group they just accepted

---

## Test Flow 2: Decline Invitation

### Step 1: Send Another Invitation
1. Log in as User A
2. Go to `/groups/{groupId}/manage`
3. Invite User C (or use a different email)
4. See the success toast

### Step 2: Decline from Dashboard
1. Log in as User C
2. Go to /dashboard
3. Find the invitation in "Pending Invitations"
4. Click the gray "Decline" button
5. You should see a toast: "Invitation declined."
6. The invitation should disappear

**Expected:**
- ✅ Toast notification confirms decline
- ✅ Invitation is removed from pending list
- ✅ User C is NOT added to the group

---

## Test Flow 3: Group Management Page

### Step 1: View Group Members
1. Log in as User A (the group owner)
2. Navigate to `/groups/{groupId}/manage`
3. Scroll down to "Members" section
4. You should see all current members with:
   - First name + Last name
   - Email address
   - Join date

**Expected:**
- ✅ All members listed
- ✅ Join dates displayed correctly
- ✅ Your name is in the list (creator is added as member)

### Step 2: View Pending Invitations
1. On the same page, scroll down to "Pending Invitations" section
2. You should see all pending invitations with:
   - Email address invited
   - Who invited them
   - When it expires

**Expected:**
- ✅ Shows recent invitations you sent
- ✅ Shows expiration dates
- ✅ Email addresses are correct

---

## Test Flow 4: Email Sending (Optional - requires RESEND_API_KEY)

### If RESEND_API_KEY is set in .env.local:
1. Invite a real email address from `/groups/{groupId}/manage`
2. Check that email inbox for invitation
3. Click the link in the email
4. You should land on `/invitations/{invitationId}/accept?email=...`

**Expected:**
- ✅ Email received within a few seconds
- ✅ Email has "Split" branding
- ✅ Email contains accept button/link
- ✅ Email shows group name and inviter name

### If RESEND_API_KEY is NOT set:
- No emails are sent (system logs this gracefully)
- But invitations still work via the UI
- This is normal for development

---

## Test Flow 5: Email Link Acceptance (If Email Tests Enabled)

### Step 1: Click Email Link
1. Check your email inbox
2. Click the "Accept Invitation" button or link
3. You should be redirected to `/invitations/{invitationId}/accept?email=yourmail@example.com`

### Step 2A: If You're Logged In
1. Page shows "You've been invited to join [Group Name]"
2. Click "Accept Invitation" button
3. Get redirected to /dashboard
4. Invitation should now be in your accepted groups

**Expected:**
- ✅ Redirect to dashboard on accept
- ✅ You're now a member of the group

### Step 2B: If You're NOT Logged In
1. Page shows "You've been invited to join [Group Name]"
2. Click "Create Account & Join"
3. You're taken to registration with email pre-filled
4. Complete registration
5. After signup, you're automatically added to the group

**Expected:**
- ✅ Email is pre-filled on signup
- ✅ Auto-join happens on registration
- ✅ No manual acceptance needed after signup

---

## Checklist for Full Testing

- [ ] **Invite sent**: Toast confirms "Invitation sent successfully"
- [ ] **Pending received**: User sees invitation on dashboard
- [ ] **Accept works**: Green button accepts and removes from list
- [ ] **Decline works**: Gray button declines and removes from list
- [ ] **Members visible**: Group management shows all members with dates
- [ ] **Pending invitations visible**: Group management shows pending list
- [ ] **Dark mode**: Styles look good in both light and dark mode
- [ ] **Mobile responsive**: Pages look good on mobile (< 640px)
- [ ] **Email sending** (optional): Real emails received if API key set
- [ ] **Email acceptance** (optional): Email link acceptance flow works

---

## Troubleshooting

### Invitation doesn't appear on dashboard
- Ensure User B is logged in
- Check database: `SELECT * FROM pending_group_invitations WHERE email = 'user@example.com'`
- Verify the email matches the customer's `username` field

### Members list is empty
- Ensure you're the group owner or a member
- Check database: `SELECT * FROM group_members WHERE group_id = '{groupId}'`
- User may not have been added during group creation

### Invite form doesn't send
- Check browser console for error messages
- Verify group ID in URL matches actual group
- Ensure you're logged in (session valid)
- Check server logs for API errors

### Email not received
- Verify `RESEND_API_KEY` is set in `.env.local`
- Check spam/junk folder
- Use a different email address
- Check server logs for send errors

### Build/Deployment Issues
- Run `npm install` if dependencies changed
- Run `npm run build` to verify TypeScript compiles
- All imports use `@/` alias (don't use relative paths)

---

## Local Testing Without Real Email

You can fully test the system without email:
1. Don't set `RESEND_API_KEY`
2. Manually create `pending_group_invitations` in database (or use the invite form)
3. Manually update user rows to accept invitations
4. Or duplicate users in database for "User B" scenario

The important part is testing the UI flow, which works completely without email sending.

---

## Summary

**All Three Phases Working Together:**
1. ✅ **Phase 0**: Email sending (via Resend, gracefully skips if no API key)
2. ✅ **Phase 1**: Dashboard pending invitations section
3. ✅ **Phase 2**: Group management page with invite form and members list

**Complete Flow**: Invite → Receive → Accept → Member ✅
