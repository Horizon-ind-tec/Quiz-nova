'use server';
/**
 * @fileOverview AI flow for handling payment notifications.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { sendEmail } from '@/services/email';

const ADMIN_EMAIL = 'wizofclassknowledge@gmail.com';

const NotifyAdminOfPaymentInputSchema = z.object({
  userId: z.string().describe("The user's unique ID."),
  userName: z.string().describe("The name of the user."),
  userEmail: z.string().email().describe("The email of the user."),
  planName: z.string().describe("The name of the plan the user is purchasing."),
  planPrice: z.string().describe("The price of the plan."),
  transactionId: z.string().describe("The unique ID for this transaction."),
  isApproval: z.boolean().optional().describe("If true, this is a notification to the student about admin approval."),
});
export type NotifyAdminOfPaymentInput = z.infer<typeof NotifyAdminOfPaymentInputSchema>;

export async function notifyAdminOfPayment(input: NotifyAdminOfPaymentInput): Promise<void> {
  await notifyAdminOfPaymentFlow(input);
}

const notifyAdminOfPaymentFlow = ai.defineFlow(
  {
    name: 'notifyAdminOfPaymentFlow',
    inputSchema: NotifyAdminOfPaymentInputSchema,
    outputSchema: z.void(),
  },
  async (input) => {
    const { userId, userName, userEmail, planName, planPrice, transactionId, isApproval } = input;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:6000';
    
    if (isApproval) {
      // Send activation request email to the STUDENT with YES/NO
      const notificationUrl = `${baseUrl}/notifications`;
      const subject = `Your QuizNova Plan is Verified! Confirm Your Upgrade?`;
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; text-align: center; padding: 20px;">
          <h2 style="color: #4A90E2;">Payment Confirmed!</h2>
          <p>Hey ${userName},</p>
          <p>We have successfully verified your payment for the <strong>${planName}</strong> (${planPrice}).</p>
          <p>To finalize your upgrade, please confirm by clicking <strong>YES</strong> below. If you have changed your mind, click <strong>NO</strong> and we will refund your payment.</p>
          <div style="margin: 30px 0; display: flex; justify-content: center; gap: 20px;">
            <a href="${notificationUrl}" style="background-color: #28a745; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px;">YES</a>
            <a href="${notificationUrl}" style="background-color: #dc3545; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 18px;">NO</a>
          </div>
          <p style="font-size: 12px; color: #888;">Note: Clicking either button will take you to your app's notification center to complete the action.</p>
        </div>
      `;

      await sendEmail({ to: userEmail, subject, html: htmlBody });

    } else {
      // Send notification to the ADMIN
      const approveUrl = `${baseUrl}/notifications`;
      const subject = `[Action Required] New Payment Verification: ${userName}`;
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #4A90E2;">Payment Verification Required</h2>
          <p>A student has requested a plan upgrade. Transaction ID: <strong>${transactionId}</strong></p>
          <ul>
            <li><strong>Name:</strong> ${userName}</li>
            <li><strong>Email:</strong> ${userEmail}</li>
            <li><strong>Plan:</strong> ${planName}</li>
            <li><strong>Amount:</strong> ${planPrice}</li>
          </ul>
          <p>Please log in to the admin panel to approve or deny this payment.</p>
          <div style="text-align: center; margin: 30px 0;">
              <a href="${approveUrl}" style="background-color: #4A90E2; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Admin Panel</a>
          </div>
        </div>
      `;

      await sendEmail({ to: ADMIN_EMAIL, subject, html: htmlBody });
    }
  }
);
