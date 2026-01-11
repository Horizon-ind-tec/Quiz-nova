
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { firebaseConfig } from '@/firebase/config';

// Ensure Firebase Admin is initialized only once
if (!getApps().some(app => app.name === 'payment-activation')) {
    initializeApp({
        credential: {
            projectId: firebaseConfig.projectId,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
            privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, '\n'),
        }
    }, 'payment-activation');
}

const adminDb = getFirestore('payment-activation');
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return new NextResponse('Bad Request: Missing userId parameter.', { status: 400 });
  }

  try {
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return new NextResponse(`User with ID ${userId} not found.`, { status: 404 });
    }

    const userData = userDoc.data()!;
    let message = '';
    let title = '';

    // Check if the plan is already active or if the status is correct
    if (userData.paymentStatus === 'confirmed' && userData.pendingPlan) {
        // Activate the plan
        await userRef.update({
            plan: userData.pendingPlan,
            pendingPlan: null, // Clear the pending plan
        });
        title = "Activation Successful!";
        message = `Your ${userData.pendingPlan} plan is now active! You can now access all the premium features.`;
    } else if (userData.plan !== 'free') {
        title = "Already Active";
        message = `Your ${userData.plan} plan is already active. No further action is needed.`;
    } else {
        title = "Activation Failed";
        message = "There was an issue activating your plan. It might be that the payment was not confirmed. Please contact support.";
        // Redirect to dashboard after a delay
        return NextResponse.redirect(`${appUrl}/dashboard?status=error`, 302);
    }

    // Redirect to a success page on the dashboard
    return NextResponse.redirect(`${appUrl}/dashboard?status=success&plan=${userData.pendingPlan || userData.plan}`, 302);

  } catch (error) {
    console.error('Error processing payment activation:', error);
    // Redirect to an error page on the dashboard
    return NextResponse.redirect(`${appUrl}/dashboard?status=error`, 302);
  }
}
