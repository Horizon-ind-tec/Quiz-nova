
import { NextRequest, NextResponse } from 'next/server';
import type { Firestore } from 'firebase-admin/firestore';
import { getAdminDb } from '@/firebase/admin';
import { notifyAdminOfPayment } from '@/ai/flows/notify-admin-of-payment';

export async function GET(request: NextRequest) {
  let db: Firestore;
  try {
      db = await getAdminDb('api-confirm');
  } catch (err) {
      const errorHtml = `<html><body style="font-family: sans-serif; display: grid; place-content: center; height: 100vh; text-align: center;"><div><h1 style="color: #dc2626;">Configuration Error</h1><p>The server is not configured for Firebase Admin operations. Please check environment variables.</p></div></body></html>`;
      return new NextResponse(errorHtml, { status: 500, headers: { 'Content-Type': 'text/html' } });
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const userId = searchParams.get('userId');

  if (!action || !userId || !['approve', 'deny'].includes(action)) {
    return new NextResponse('Bad Request: Missing or invalid parameters.', { status: 400 });
  }

  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        return new NextResponse(`User with ID ${userId} not found.`, { status: 404 });
    }

    const userData = userDoc.data()!;
    let message = '';
    
    if (action === 'approve') {
        if (userData.pendingPlan) {
            await userRef.update({
                paymentStatus: 'confirmed',
            });
            
            // Trigger the notification flow to send the activation email to the user
            await notifyAdminOfPayment({
                userId: userId,
                userName: userData.name,
                userEmail: userData.email,
                planName: userData.pendingPlan,
                planPrice: userData.pendingPlan === 'premium' ? '₹500' : '₹1000',
                transactionId: `Nova${userData.pendingPlan === 'premium' ? '+' : '$'}${userId.slice(0,9).toLowerCase()}`,
                isApproval: true,
            });

            message = `Successfully approved plan upgrade for ${userData.name}. An activation email has been sent to them.`;
        } else {
            message = `User ${userData.name} had no pending plan to approve.`;
        }
    } else { // deny
        await userRef.update({
            paymentStatus: null,
            pendingPlan: null,
        });
        message = `Successfully denied plan upgrade for ${userData.name}.`;
    }

     return new NextResponse(`
        <html>
            <body style="font-family: sans-serif; display: grid; place-content: center; height: 100vh; text-align: center;">
                <div>
                    <h1 style="color: #22c55e;">Action Complete</h1>
                    <p>${message}</p>
                    <p style="margin-top: 20px; font-size: 12px; color: #888;">You can close this tab.</p>
                </div>
            </body>
        </html>`, 
        { headers: { 'Content-Type': 'text/html' } }
    );

  } catch (error) {
    console.error('Error processing payment confirmation:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return new NextResponse(`<html><body><h1>Error</h1><p>${errorMessage}</p></body></html>`, { status: 500, headers: { 'Content-Type': 'text/html' } });
  }
}
