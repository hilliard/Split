# Test User Setup - Unlimited Development Users

You now have **three options** for creating unlimited test users without needing real email addresses:

## Option 1: Gmail Aliasing (Recommended - Simplest)

### How It Works

Gmail treats `email+anything@gmail.com` as the same inbox as `email@gmail.com` but you can filter by the label.

### Setup

```
Base email: your-email@gmail.com

Test users you can create:
- alice+split@gmail.com
- bob+split@gmail.com
- test+user1@gmail.com
- dev+alice@gmail.com
- qa+staging@gmail.com
```

All emails go to your **one real inbox** but arrive with tags you can filter.

### Pros ✅

- Zero setup required
- No configuration needed
- Works immediately
- Organized by labels in Gmail

### Cons ❌

- Limited to one real email account
- Passwords must be handled separately per test account

### Usage

```bash
npm run dev

# Register test users:
# alice+split@gmail.com → all emails to alice+split go to your inbox
# bob+split@gmail.com  → all emails to bob+split go to your inbox

# Emails arrive with headers you can filter by label
```

---

## Option 2: Test Email Routing (Automatic - Development Only)

### How It Works

Added automatic routing in the email utility: any email with `test+`, `staging+`, `demo+`, `dev+`, or `qa+` patterns gets redirected to a catch-all address.

### Setup

Add to `.env.local`:

```env
DEV_TEST_EMAIL_CATCH_ALL=your-email+split@gmail.com
```

Then restart dev server:

```bash
npm run dev
```

### Usage

Create test users with these patterns:

```
test+alice@example.com      ↓ routes to
test+bob@example.com        │ your-email+split@gmail.com
dev+staging@test.com        ↓
qa+user1@anything.com
staging+demo@test.io
demo+scenario1@localhost
```

**Console output shows the routing:**

```
🧪 Test email routing: test+alice@example.com → your-email+split@gmail.com
✅ Verification email sent: {
  recipient: "test+alice@example.com",
  sentTo: "your-email+split@gmail.com"
}
```

### Pros ✅

- Unlimited test users
- Automatic routing in code
- Works with any email pattern
- Development-only (production unaffected)

### Cons ❌

- Requires env variable setup
- Limited to one catch-all email

### Implementation Details

In `src/utils/email.ts`:

```typescript
// This automatically routes test emails to catch-all
const effectiveRecipient = getEffectiveRecipient(data.recipientEmail);

// Then emails are sent to the catch-all instead
await resend.emails.send({
  to: effectiveRecipient,  // <- automatically routed
  ...
});
```

---

## Option 3: Mailhog (Recommended for Professional Testing)

### How It Works

Mailhog is a **local SMTP server** that catches **all emails** without validation or delivery requirements.

### Installation

**Windows:**

```bash
# Install with Chocolatey
choco install mailhog

# Or download: https://github.com/mailhog/MailHog/releases
```

**Mac:**

```bash
brew install mailhog
```

**Linux:**

```bash
# Download from GitHub releases
# https://github.com/mailhog/MailHog/releases
```

### Setup

**Step 1: Start Mailhog**

```bash
# In a separate terminal
mailhog

# Output:
# MailHog v1.0.1
# Web UI listening on http://localhost:1025 (or 8025)
# SMTP listening on localhost:1025
```

**Step 2: Configure Split (`.env.local`)**

Since Resend doesn't support custom SMTP, you have two options:

**Option A: Mock Emails (Dev-Only)**

```env
# Don't send real emails, just log them
USE_MOCK_EMAIL=true
NODE_ENV=development
```

**Option B: Use catch-all with Mailhog's test domain**

```env
DEV_TEST_EMAIL_CATCH_ALL=test@mailhog.local
```

**Step 3: View Emails**

Open browser: **http://localhost:1025** (Mailhog Web UI)

- Shows all sent emails
- Click to view HTML/text
- See links and headers
- Search emails

### Pros ✅

- Unlimited test users
- No real emails needed
- Can use any email format
- Professional testing environment
- See email rendering
- Track delivery in detail

### Cons ❌

- Requires installing Mailhog
- Separate application to run
- Only for development

### Usage

```bash
# Terminal 1: Start Mailhog
mailhog

# Terminal 2: Start Split dev server
npm run dev

# Register as many test users as you want:
test@example.com
alice@anything.com
staging-user@localhost
anything@everything.com

# All emails captured by Mailhog
# View at: http://localhost:1025
```

---

## Comparison Table

| Feature              | Gmail+ | Routing | Mailhog |
| -------------------- | ------ | ------- | ------- |
| **Setup Time**       | 0 min  | 2 min   | 10 min  |
| **Unlimited Users**  | ✅     | ✅      | ✅      |
| **Real Emails**      | ✅     | ✅      | ❌      |
| **Email Details**    | ✅     | ✅      | ✅      |
| **Professional**     | ⚠️     | ⚠️      | ✅      |
| **Production Ready** | ✅     | ⚠️      | ❌      |

---

## Recommended Workflow

### For Quick Local Testing

```bash
# Use Gmail aliasing
npm run dev
# Register as test+alice@gmail.com, test+bob@gmail.com, etc.
```

### For Development Sprints

```bash
# Add to .env.local
DEV_TEST_EMAIL_CATCH_ALL=your-email+split@gmail.com

npm run dev
# Create any test users you want
```

### For Comprehensive Testing

```bash
# Terminal 1
mailhog

# Terminal 2
npm run dev

# Create unlimited test users, view detailed email logs in Mailhog UI
```

---

## Configuration Summary

### `.env.local` Options

```env
# Option 1: No setup needed (use Gmail aliasing)
# Just register with your-email+testname@gmail.com

# Option 2: Enable automatic test email routing
DEV_TEST_EMAIL_ROUTING=true
DEV_TEST_EMAIL_CATCH_ALL=your-email+split@gmail.com

# Option 3: Mock emails (skip sending entirely)
USE_MOCK_EMAIL=true

# Standard Resend config (always needed for real emails)
RESEND_API_KEY=re_UhCqCPfT_QLDTCfjGheQKSReyWjmpdVAM
RESEND_FROM_EMAIL=noreply@goldtending.com
PUBLIC_URL=http://localhost:4321
NODE_ENV=development
```

---

## Verifying Test Users Work

### Check Console Output

When you register with a test email pattern:

```
🧪 Test email routing: test+alice@example.com → your-email+split@gmail.com
✅ Verification email sent: {
  timestamp: "2026-04-22T...",
  type: "Email Verification",
  recipient: "test+alice@example.com",
  from: "noreply@goldtending.com",
  environment: "development",
  dashboardUrl: "https://dashboard.resend.com/emails/e_xxxxx"
}
```

### Check Email Inbox

If using Gmail aliasing:

- Emails arrive in your inbox
- Look for emails to `your-email+split`
- Click verification links normally

If using Mailhog:

- Open http://localhost:1025
- All emails captured there
- Click to view details

---

## Next Steps

1. **Choose your method** (Gmail aliasing is simplest)
2. **Configure .env.local** if using Option 2
3. **Start creating test users** - unlimited!
4. **Monitor in dashboard** or Resend/Mailhog UI

You can now create as many test users as needed for development! 🎉
