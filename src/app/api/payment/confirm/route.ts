
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { firebaseConfig } from '@/firebase/config';
import { initFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
// This ensures we only initialize it once.
const adminApp = initializeApp({
    credential: {
        projectId: firebaseConfig.projectId,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    }
}, 'payment-confirmation');

const adminDb = getFirestore(adminApp);
const adminAuth = getAdminAuth(adminApp);


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
                plan: userData.pendingPlan,
                paymentStatus: 'confirmed',
                pendingPlan: null,
            });
            message = `Successfully approved plan upgrade for ${userData.name}.`;
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
        { headers: { 'Content-Type': 'text/html' } 
    });


  } catch (error) {
    console.error('Error processing payment confirmation:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return new NextResponse(`<html><body><h1>Error</h1><p>${errorMessage}</p></body></html>`, { status: 500, headers: { 'Content-Type': 'text/html' } });
  }
}

    