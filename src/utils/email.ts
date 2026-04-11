import { Resend } from 'resend';

// Lazy initialize Resend client to ensure env vars are loaded
function getResendClient() {
  return new Resend(process.env.RESEND_API_KEY);
}

export interface InvitationEmailData {
  recipientEmail: string;
  recipientName?: string;
  groupName: string;
  senderName: string;
  acceptUrl: string;
}

export async function sendGroupInvitationEmail(data: InvitationEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('⚠️  RESEND_API_KEY not set - skipping email (dev mode)');
      return { success: true }; // Don't fail in dev if no API key
    }

    const resend = getResendClient();

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
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev', // Default to Resend test email
      to: data.recipientEmail,
      subject: `${data.senderName} invited you to ${data.groupName} on Split`,
      html: htmlContent,
    });

    if (result.error) {
      console.error('❌ Email send failed:', result.error);
      return { success: false, error: result.error.message };
    }

    console.log('✓ Invitation email sent:', result.data?.id);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending invitation email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
