
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseConfig } from '@/firebase/config';
import { notifyAdminOfPayment } from '@/ai/flows/notify-admin-of-payment';

// Ensure Firebase Admin is initialized only once
if (!getApps().some(app => app.name === 'payment-confirmation')) {
    initializeApp({
        credential: {
            projectId: firebaseConfig.projectId,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
            privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        }
    }, 'payment-confirmation');
}

const adminDb = getFirestore('payment-confirmation');

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const userId = searchParams.get('userId');

  if (!action || !userId || !['approve', 'deny'].includes(action)) {
    return new NextResponse('Bad Request: Missing or invalid parameters.', { status: 400 });
  }

  try {
    const userRef = adminDb.collection('users').doc(userId);
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
