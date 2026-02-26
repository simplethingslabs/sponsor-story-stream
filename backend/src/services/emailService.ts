import { getResendClient, emailConfig, verifyResendConfig } from '../config/resend';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

// Send email helper
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!verifyResendConfig()) {
    console.warn('Email not sent: RESEND_API_KEY not configured');
    return false;
  }
  
  try {
    const client = getResendClient();
    if (!client) return false;
    await client.emails.send({
      from: emailConfig.from,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
    });
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

// Email templates
export const emailTemplates = {
  registrationPending: (name: string) => ({
    subject: 'Registration Received',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Registration Received</h2>
        <p>Hi ${name},</p>
        <p>Thank you for registering! Your application is currently under review.</p>
        <p>We'll notify you once your account has been approved.</p>
        <p>Best regards,<br>The Team</p>
      </div>
    `,
  }),
  
  registrationApproved: (name: string) => ({
    subject: 'Your Registration Has Been Approved!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Welcome!</h2>
        <p>Hi ${name},</p>
        <p>Great news! Your registration has been approved.</p>
        <p>You can now log in to your sponsor account and start making a difference.</p>
        <p><a href="${emailConfig.frontendUrl}/login" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Log In Now</a></p>
        <p>Best regards,<br>The Team</p>
      </div>
    `,
  }),
  
  registrationRejected: (name: string, reason?: string) => ({
    subject: 'Update on Your Registration',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Registration Update</h2>
        <p>Hi ${name},</p>
        <p>We regret to inform you that your registration request has not been approved at this time.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <p>Best regards,<br>The Team</p>
      </div>
    `,
  }),
  
  sponsorInvitation: (inviterName: string, personalMessage?: string) => ({
    subject: "You're Invited to Join as a Sponsor",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">You're Invited!</h2>
        <p>${inviterName} has invited you to join as a sponsor.</p>
        ${personalMessage ? `<blockquote style="border-left: 4px solid #e5e7eb; padding-left: 16px; margin: 16px 0; font-style: italic;">"${personalMessage}"</blockquote>` : ''}
        <p>As a sponsor, you'll be able to:</p>
        <ul>
          <li>View progress reports for your sponsored children</li>
          <li>Stay updated with newsletters and events</li>
          <li>Make a real difference in a child's life</li>
        </ul>
        <p><a href="${emailConfig.frontendUrl}/register?token=TOKEN_PLACEHOLDER" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Accept Invitation</a></p>
        <p style="color: #6b7280; font-size: 14px;">This invitation expires in 7 days.</p>
      </div>
    `,
  }),
  
  passwordReset: (name: string, token: string) => ({
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Password Reset</h2>
        <p>Hi ${name},</p>
        <p>You requested a password reset. Click the button below to reset your password:</p>
        <p><a href="${emailConfig.frontendUrl}/reset-password?token=${token}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
        <p style="color: #6b7280; font-size: 14px;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
      </div>
    `,
  }),
  
  newReport: (sponsorName: string, childName: string, quarter: string, year: number, reportId: string, childId: string) => ({
    subject: `New Progress Report for ${childName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Progress Report</h2>
        <p>Hi ${sponsorName},</p>
        <p>A new ${quarter} ${year} progress report is available for <strong>${childName}</strong>.</p>
        <p>See how ${childName} has been growing and learning!</p>
        <p><a href="${emailConfig.frontendUrl}/my-children/${childId}/reports/${reportId}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Report</a></p>
        <p>Best regards,<br>The Team</p>
      </div>
    `,
  }),
  
  newNewsletter: (title: string) => ({
    subject: `New Newsletter: ${title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Newsletter Available</h2>
        <p>A new newsletter has been published: <strong>${title}</strong></p>
        <p><a href="${emailConfig.frontendUrl}/newsletters" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Read Newsletter</a></p>
      </div>
    `,
  }),
  
  upcomingEvent: (eventTitle: string, eventDate: string, eventId: string) => ({
    subject: `Upcoming Event: ${eventTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Upcoming Event</h2>
        <p>Don't miss our upcoming event!</p>
        <h3>${eventTitle}</h3>
        <p><strong>Date:</strong> ${eventDate}</p>
        <p><a href="${emailConfig.frontendUrl}/events/${eventId}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Event Details</a></p>
      </div>
    `,
  }),
};
