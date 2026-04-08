# Email Invitations Setup Guide

## Overview

Group invitations now send emails to users, inviting them to join groups. This enables unlimited customer growth without pre-existing accounts.

## Setup Steps

### 1. Get a Resend API Key

Resend is a modern email service with a free tier perfect for development.

**Option A: Development (Recommended for testing)**
- If `RESEND_API_KEY` is not set, emails are skipped (useful for local testing)
- Invitations still work, just no email sent
- Check console logs to see invitation links

**Option B: Production (Real emails)**
1. Go to [resend.com](https://resend.com)
2. Sign up for free account
3. Get your API key from the dashboard
4. Add to `.env.local`:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```

### 2. Set Your App URL

For email links to work correctly:

```bash
# In .env.local
PUBLIC_URL=https://yourdomain.com  # Production
# OR
PUBLIC_URL=http://localhost:3000   # Development
```

If not set, defaults to `http://localhost:3000`

### 3. Email From Address

Emails currently send from `invitations@splitapp.dev`. 

To use your own domain in production:
1. Verify your domain in Resend dashboard
2. Update `src/utils/email.ts` line with your domain:
   ```typescript
   from: 'Split <noreply@yourdomain.com>',
   ```

## How It Works

### Invitation Flow

1. **Group owner invites** → Calls `POST /api/groups/[id]/invite`
   - Creates pending invitation record
   - Sends email (if `RESEND_API_KEY` set)
   - Email includes accept link

2. **User clicks email link** → Goes to `/invitations/[id]/accept`
   - If logged in: Shows "Accept Invitation" button
   - If not logged in: Shows "Create Account & Join" button
   - Pre-fills email from invitation

3. **User accepts** → Calls `POST /api/groups/invitations/accept`
   - Adds user to group members
   - Marks invitation as accepted
   - Redirects to dashboard

### Automatic Join on Registration

When a new user registers with an invited email:
- Auto-adds them to all pending groups for that email
- Marks invitations as accepted
- They see the groups immediately after registration

## Testing Locally

### Without Email (Recommended for quick testing)

```bash
# Just don't set RESEND_API_KEY
# Invitations work, but emails aren't sent
# Check console for invitation URLs
```

### With Real Emails

1. Get Resend API key
2. Add to `.env.local`:
   ```
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   PUBLIC_URL=http://localhost:3000
   ```
3. Create group and invite someone
4. Check their email for invitation

### Testing Email Content

1. Create a test group
2. Invite yourself (your email)
3. Check email inbox (or spam)
4. Verify links and content

## Troubleshooting

**Emails not sending?**
- Check `.env.local` has `RESEND_API_KEY` set
- Check console logs for errors
- Verify email address is correct

**Links not working?**
- Check `PUBLIC_URL` is set correctly
- Ensure invitation ID is in URL
- Check invitation hasn't expired (30 days)

**Development without emails?**
- Leave `RESEND_API_KEY` empty
- Invitation will still be created
- Check console for "Add to group" instructions

## Email Template

The invitation email includes:
- Sender name and group name
- Professional HTML layout
- "Accept Invitation" button
- Fallback text link
- 30-day expiration notice
- Unsubscribe-friendly message

## Future Enhancements

- [ ] Email templates in database (allow customization)
- [ ] HTML email preview in admin
- [ ] Bounce/complaint handling
- [ ] Batch invitation sending
- [ ] Email verification for groups
- [ ] Resend tracking (opens, clicks)

## API Reference

### POST `/api/groups/[id]/invite`
Invite someone to a group

**Request:**
```json
{
  "email": "friend@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "invitation": {
    "id": "uuid",
    "email": "friend@example.com",
    "groupId": "uuid",
    "expiresAt": "2026-05-08T..."
  }
}
```

### POST `/api/groups/invitations/accept`
Accept an invitation

**Request:**
```json
{
  "invitationId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Joined group successfully",
  "membership": { ... }
}
```
