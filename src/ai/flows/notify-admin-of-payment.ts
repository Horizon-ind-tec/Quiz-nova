
'use server';
/**
 * @fileOverview AI flow for notifying the admin about a pending user payment.
 *
 * This file defines a Genkit flow that is triggered when a user initiates a payment.
 * It uses the email service to send a notification to the admin.
 *
 * @exports notifyAdminOfPayment - The main function to trigger the notification.
 * @exports NotifyAdminOfPaymentInput - The input type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { sendEmail } from '@/services/email';

const ADMIN_EMAIL = 'wizofclassknowledge@gmail.com';

const NotifyAdminOfPaymentInputSchema = z.object({
  userName: z.string().describe("The name of the user who initiated the payment."),
  userEmail: z.string().email().describe("The email of the user."),
  planName: z.string().describe("The name of the plan the user is purchasing (e.g., 'Premium Plan')."),
  planPrice: z.string().describe("The price of the plan (e.g., '₹500')."),
});
export type NotifyAdminOfPaymentInput = z.infer<typeof NotifyAdminOfPaymentInputSchema>;

export async function notifyAdminOfPayment(input: NotifyAdminOfPaymentInput): Promise<void> {
  return notifyAdminOfPaymentFlow(input);
}

const notifyAdminOfPaymentFlow = ai.defineFlow(
  {
    name: 'notifyAdminOfPaymentFlow',
    inputSchema: NotifyAdminOfPaymentInputSchema,
    outputSchema: z.void(),
  },
  async (input) => {
    const { userName, userEmail, planName, planPrice } = input;

    const subject = `New Payment on QuizNova: ${userName}`;
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #333;">Payment Confirmation</h2>
        <p>A user has successfully upgraded their plan.</p>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <h3>User Details:</h3>
        <ul>
          <li><strong>Name:</strong> ${userName}</li>
          <li><strong>Email:</strong> ${userEmail}</li>
        </ul>
        <h3>Plan Details:</h3>
        <ul>
          <li><strong>Plan:</strong> ${planName}</li>
          <li><strong>Amount:</strong> ${planPrice}</li>
        </ul>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <p style="margin-top: 20px; font-size: 12px; color: #888;">
          This is an automated notification from the QuizNova application. The user's plan has been automatically upgraded. No further action is required.
        </p>
      </div>
    `;

    await sendEmail({
      to: ADMIN_EMAIL,
      subject,
      html: htmlBody,
    });
  }
);
