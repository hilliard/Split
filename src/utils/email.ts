import { Resend } from 'resend';

// Lazy initialize Resend client to ensure env vars are loaded
function getResendClient() {
  return new Resend(process.env.RESEND_API_KEY);
}

// Format email data for logging
function getEmailLog(type: string, recipient: string, subject: string, id?: string) {
  return {
    timestamp: new Date().toISOString(),
    type,
    recipient,
    subject,
    from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
    environment: process.env.NODE_ENV,
    resendId: id,
    dashboardUrl: id ? `https://dashboard.resend.com/emails/${id}` : undefined,
  };
}

/**
 * Development helper: Redirect test emails to a catch-all address
 * Allows unlimited test users with fake/test email addresses
 *
 * Usage in .env.local:
 *   DEV_TEST_EMAIL_CATCH_ALL=your-email+split@gmail.com
 *
 * Then any email sent to test+anything@example.com will be redirected to the catch-all
 */
function getEffectiveRecipient(email: string): string {
  const isDev = process.env.NODE_ENV === 'development';
  const catchAll = process.env.DEV_TEST_EMAIL_CATCH_ALL;

  if (!isDev || !catchAll) {
    return email;
  }

  // Check if email looks like a test email (test+, staging+, demo+, etc.)
  const testPatterns = ['test+', 'staging+', 'demo+', 'dev+', 'qa+'];
  const isTestEmail = testPatterns.some((pattern) => email.toLowerCase().includes(pattern));

  if (isTestEmail) {
    console.log(`🧪 Test email routing: ${email} → ${catchAll}`);
    return catchAll;
  }

  return email;
}

export interface InvitationEmailData {
  recipientEmail: string;
  recipientName?: string;
  groupName: string;
  senderName: string;
  acceptUrl: string;
}

export interface VerificationEmailData {
  recipientEmail: string;
  firstName?: string;
  verificationUrl: string;
}

export async function sendGroupInvitationEmail(
  data: InvitationEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️  RESEND_API_KEY not set - email send skipped (dev mode)');
      console.info('📧 Dev Mode Email:', {
        type: 'Group Invitation',
        to: data.recipientEmail,
        subject: `${data.senderName} invited you to ${data.groupName} on Split`,
      });
      return { success: true };
    }

    const resend = getResendClient();
    const effectiveRecipient = getEffectiveRecipient(data.recipientEmail);

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">You're invited to join a group!</h2>
        
        <p>Hi${data.recipientName ? ` ${data.recipientName}` : ''},</p>
        
        <p><strong>${data.senderName}</strong> invited you to join the group <strong>"${data.groupName}"</strong> on Split.</p>
        
        <p>Split makes it easy to track shared expenses and split costs with friends.</p>
        
        <div style="margin: 30px 0;">
          <a href="${data.acceptUrl}" 
             style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Accept Invitation
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          Or copy this link: <code style="background: #f3f4f6; padding: 2px 6px;">${data.acceptUrl}</code>
        </p>
        
        <p style="color: #999; font-size: 12px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
          This invitation expires in 30 days. If you didn't expect this email or don't want to join the group, you can ignore it.
        </p>
      </div>
    `;

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: effectiveRecipient,
      subject: `${data.senderName} invited you to ${data.groupName} on Split`,
      html: htmlContent,
    });

    if (result.error) {
      console.error(
        '❌ Group invitation email failed:',
        getEmailLog(
          'Group Invitation',
          data.recipientEmail,
          `${data.senderName} invited you to ${data.groupName} on Split`
        )
      );
      return { success: false, error: result.error.message };
    }

    console.log(
      '✅ Group invitation email sent:',
      getEmailLog(
        'Group Invitation',
        data.recipientEmail,
        `${data.senderName} invited you to ${data.groupName} on Split`,
        result.data?.id
      )
    );
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending group invitation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function sendVerificationEmail(
  data: VerificationEmailData
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️  RESEND_API_KEY not set - email send skipped (dev mode)');
      console.info('📧 Dev Mode Email:', {
        type: 'Email Verification',
        to: data.recipientEmail,
        subject: 'Verify your Split account',
      });
      return { success: true };
    }

    const resend = getResendClient();
    const effectiveRecipient = getEffectiveRecipient(data.recipientEmail);

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">Verify your email address</h2>
        
        <p>Hi${data.firstName ? ` ${data.firstName}` : ''},</p>
        
        <p>Welcome to Split! Please verify your email address to complete your account setup.</p>
        
        <div style="margin: 30px 0;">
          <a href="${data.verificationUrl}" 
             style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          Or copy this link: <code style="background: #f3f4f6; padding: 2px 6px; word-break: break-all;">${data.verificationUrl}</code>
        </p>
        
        <p style="color: #999; font-size: 12px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
          This verification link expires in 24 hours. If you didn't create a Split account, you can ignore this email.
        </p>
      </div>
    `;

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: effectiveRecipient,
      subject: 'Verify your Split account',
      html: htmlContent,
    });

    if (result.error) {
      console.error(
        '❌ Email verification email failed:',
        getEmailLog('Email Verification', data.recipientEmail, 'Verify your Split account')
      );
      return { success: false, error: result.error.message };
    }

    console.log(
      '✅ Verification email sent:',
      getEmailLog(
        'Email Verification',
        data.recipientEmail,
        'Verify your Split account',
        result.data?.id
      )
    );
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
