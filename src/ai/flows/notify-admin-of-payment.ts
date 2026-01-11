
'use server';
/**
 * @fileOverview AI flow for notifying the admin about a pending user payment.
 *
 * This file defines a Genkit flow that is triggered when a user initiates a payment.
 * It uses the email service to send a notification to the admin with approval/denial actions.
 *
 * @exports notifyAdminOfPayment - The main function to trigger the notification.
 * @exports NotifyAdminOfPaymentInput - The input type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { sendEmail } from '@/services/email';

const ADMIN_EMAIL = 'wizofclassknowledge@gmail.com';

const NotifyAdminOfPaymentInputSchema = z.object({
  userId: z.string().describe("The user's unique ID."),
  userName: z.string().describe("The name of the user who initiated the payment."),
  userEmail: z.string().email().describe("The email of the user."),
  planName: z.string().describe("The name of the plan the user is purchasing (e.g., 'Premium Plan')."),
  planPrice: z.string().describe("The price of the plan (e.g., '₹500')."),
  transactionId: z.string().describe("The unique ID for this transaction."),
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
    const { userId, userName, userEmail, planName, planPrice, transactionId } = input;
    
    // Construct the base URL for the actions
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';
    const approveUrl = `${baseUrl}/api/payment/confirm?action=approve&userId=${userId}`;
    const denyUrl = `${baseUrl}/api/payment/confirm?action=deny&userId=${userId}`;

    const subject = `[Action Required] New Payment on QuizNova: ${userName}`;
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #4A90E2;">Payment Verification Required</h2>
        <p>A user has initiated a payment for a plan upgrade. Please verify the payment and take action.</p>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <h3>Transaction Details:</h3>
        <ul>
            <li><strong>Transaction ID:</strong> ${transactionId}</li>
        </ul>
        <h3>User Details:</h3>
        <ul>
          <li><strong>Name:</strong> ${userName}</li>
          <li><strong>Email:</strong> ${userEmail}</li>
          <li><strong>User ID:</strong> ${userId}</li>
        </ul>
        <h3>Plan Details:</h3>
        <ul>
          <li><strong>Plan:</strong> ${planName}</li>
          <li><strong>Amount:</strong> ${planPrice}</li>
        </ul>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <h3 style="margin-top: 20px;">Take Action:</h3>
        <p>Click one of the buttons below to approve or deny the user's plan upgrade.</p>
        <div style="text-align: center; margin: 20px 0;">
            <a href="${approveUrl}" style="background-color: #28a745; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin-right: 15px; font-weight: bold;">Approve Payment</a>
            <a href="${denyUrl}" style="background-color: #dc3545; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Deny Payment</a>
        </div>
        <p style="margin-top: 20px; font-size: 12px; color: #888;">
          This is an automated notification from the QuizNova application.
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

    