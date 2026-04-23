# Resend Development Setup Guide

Your Split project is configured to use Resend for transactional emails. This guide covers setting up a real development environment that actually sends emails (instead of test-only mode).

## Current Status

✅ **Already Configured:**

- Real Resend API Key in `.env.local`
- Domain verified: `goldtending.com`
- From email: `noreply@goldtending.com`
- Email utility functions in place

## Environment Configuration

### Development (.env.local)

```env
# Email (Resend)
RESEND_API_KEY=re_UhCqCPfT_QLDTCfjGheQKSReyWjmpdVAM
RESEND_FROM_EMAIL=noreply@goldtending.com

# Public URL for email links
PUBLIC_URL=http://localhost:4321

# Environment
NODE_ENV=development
```

### Production (.env.production)

```env
# Email (Resend) - Use same verified domain
RESEND_API_KEY=<your-production-api-key>
RESEND_FROM_EMAIL=noreply@goldtending.com

# Public URL for production
PUBLIC_URL=https://yourdomain.com

# Environment
NODE_ENV=production
```

## Key Features of Current Setup

### 1. **Automatic Fallback**

If `RESEND_API_KEY` is not set, emails are skipped without errors:

```typescript
if (!process.env.RESEND_API_KEY) {
  console.warn('⚠️  RESEND_API_KEY not set - skipping email (dev mode)');
  return { success: true };
}
```

### 2. **Verified Domain**

Your domain `goldtending.com` is verified with:

- ✅ DKIM (signing)
- ✅ SPF records configured
- ✅ Domain verification complete

### 3. **Email Templates**

Two main email types configured:

- **Group Invitations** - Sent when users invite others to groups
- **Email Verification** - Sent during account registration

## Development Best Practices

### Option 1: Send to Real Test Email (Recommended for Development)

Create a test email account and update your development config:

```env
# .env.local
RESEND_FROM_EMAIL=noreply@goldtending.com
# Capture emails to a real account for testing
RESEND_TEST_EMAIL=your-test-email@gmail.com
```

Then in email functions, you can optionally redirect:

```typescript
// In development, you can log/redirect emails
const recipientEmail =
  process.env.NODE_ENV === 'development'
    ? process.env.RESEND_TEST_EMAIL || data.recipientEmail
    : data.recipientEmail;
```

### Option 2: Use Resend Dashboard for Testing

1. Go to [dashboard.resend.com](https://dashboard.resend.com)
2. Verify sending with your account email during development
3. View email logs in the dashboard
4. Check email content before production

### Option 3: Email Preview Service

For more advanced testing, consider:

- **Mailhog** - Local SMTP server
- **Ethereal Email** - Catch-all email testing service
- **Mailtrap** - Professional email testing

## Email Verification Workflow

### Current Flow:

1. User signs up → `sendVerificationEmail()` is called
2. Email sent to user's registered email
3. User clicks verification link
4. Account is verified

### To Test:

1. Use a real email address you control during signup
2. Check your inbox for the verification email
3. Click the link with `PUBLIC_URL=http://localhost:4321`

## Group Invitation Workflow

### Current Flow:

1. User creates group and invites others → `sendGroupInvitationEmail()` is called
2. Email sent to invited email addresses
3. Invitee can accept via link

### To Test:

1. Create a test group
2. Invite a real email address
3. Accept the invitation via the email link

## Monitoring and Debugging

### View Sent Emails in Resend Dashboard

```bash
# Go to: https://dashboard.resend.com/emails
# Filter by date/status to see:
# - Delivery status (Delivered, Bounced, Complained)
# - Open/Click rates
# - Recipient addresses
# - Send timestamps
```

### Enable Debug Logging

Update `src/utils/email.ts` to add more verbose logging:

```typescript
const result = await resend.emails.send({...});

if (result.error) {
  console.error('❌ Email send failed:', {
    error: result.error,
    to: data.recipientEmail,
    timestamp: new Date().toISOString()
  });
  return { success: false, error: result.error.message };
}

console.log('✓ Verification email sent:', {
  id: result.data?.id,
  to: data.recipientEmail,
  timestamp: new Date().toISOString()
});
```

## Domain Authentication

Your domain setup includes:

| Record   | Value                                      | Status              |
| -------- | ------------------------------------------ | ------------------- |
| **DKIM** | resend.\_domainkey                         | ✅ Enabled          |
| **SPF**  | v=spf1 include:amazonses.com ~all          | ✅ Configured       |
| **MX**   | send.feedback-smtp.us-east-1.amazonses.com | ✅ Ready to receive |

This allows:

- **Sending** from `noreply@goldtending.com`
- **Receiving** replies at `send@goldtending.com`

## Handling Bounces and Failures

When emails fail:

1. Check Resend dashboard for bounce/complaint info
2. Review email address validity
3. Check spam folder if expected
4. Resend automatically removes bounced addresses

## Testing Workflow

```bash
# 1. Start development server
npm run dev

# 2. Navigate to signup page
# http://localhost:4321/auth/register

# 3. Register with a real email address
# You control (e.g., yourname+split@gmail.com)

# 4. Check your inbox for verification email

# 5. Click the verification link

# 6. Log in and create groups, invite others

# 7. Monitor email logs in Resend dashboard
# https://dashboard.resend.com/emails
```

## API Key Security

⚠️ **Important:** Your API key in `.env.local` is for development only.

- Never commit `.env.local` to git (already in .gitignore)
- Use different API keys for production
- Rotate keys periodically in Resend dashboard
- Never share your API key

## Troubleshooting

### "RESEND_API_KEY not set" Warning

- Check `.env.local` exists in project root
- Verify `RESEND_API_KEY=re_xxx` is present
- Restart dev server after changing .env

### Email Not Sending

1. Check Resend dashboard for errors
2. Verify `PUBLIC_URL` is correct for email links
3. Ensure `RESEND_FROM_EMAIL` is your verified domain
4. Check browser console for API errors

### Verification Link Expired

- Links expire after 24 hours
- User can request resend via "Resend verification email" link

### Bounced Emails

1. Check recipient email is valid
2. Review sender reputation in Resend dashboard
3. Verify domain DKIM/SPF are still configured

## Next Steps

1. **Test the workflow** - Sign up with a real email address
2. **Monitor emails** - Check Resend dashboard daily
3. **Configure production** - Set up separate Resend project for production
4. **Add error handling** - Implement retry logic for failed sends
5. **Setup webhooks** - Track bounce/complaint events (optional)

## Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend Dashboard](https://dashboard.resend.com)
- [API Reference](https://resend.com/docs/api-reference)
- [Email Template Best Practices](https://resend.com/docs/templates)
