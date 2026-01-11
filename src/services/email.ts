
'use server';

import { Resend } from 'resend';

// IMPORTANT: You must configure your own RESEND_API_KEY in your environment variables.
// The code will default to a sandbox key which does not actually send emails.
const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789_sandbox');

// This is the email address the notifications will be sent from.
// IMPORTANT: For production, you must verify this domain with Resend.
const FROM_EMAIL = 'onboarding@resend.dev';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends an email using the Resend service.
 * This is a server-side function and should only be called from server components or actions.
 */
export async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: `QuizNova <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Error sending email:', error);
      // We are not re-throwing the error to avoid failing the entire operation
      // just because the email notification failed.
      return { success: false, error };
    }

    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('An unexpected error occurred while sending email:', error);
    return { success: false, error: error as Error };
  }
}
