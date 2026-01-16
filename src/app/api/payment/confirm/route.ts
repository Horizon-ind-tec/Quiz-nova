
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App, getApp as getAdminApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { firebaseConfig } from '@/firebase/config';
import { notifyAdminOfPayment } from '@/ai/flows/notify-admin-of-payment';
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });


let adminDb: Firestore;

function getAdminDb(): Firestore {
    if (adminDb) {
        return adminDb;
    }

    const appName = 'api-confirm';
     if (getApps().find(app => app.name === appName)) {
        adminDb = getFirestore(getAdminApp(appName));
        return adminDb;
    }

    // Check for explicit credentials in environment variables
    if (process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY && process.env.FIREBASE_ADMIN_PROJECT_ID) {
        const adminApp = initializeApp({
            credential: cert({
                projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
                clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
                privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
            }),
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        }, appName);
        
        adminDb = getFirestore(adminApp);
        return adminDb;
    }
    
    // Check if running in a Google Cloud environment
    try {
        const adminApp = initializeApp({
            credential: applicationDefault(),
            projectId: firebaseConfig.projectId,
        }, appName);
        
        adminDb = getFirestore(adminApp);
        return adminDb;
    } catch(e) {
         console.error("Default application credentials failed for /api/payment/confirm. Please set FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY, and FIREBASE_ADMIN_PROJECT_ID environment variables.", e);
         throw new Error('Firebase Admin SDK not initialized. Server environment is not configured.');
    }
}


export async function GET(request: NextRequest) {
  let db: Firestore;
  try {
      db = getAdminDb();
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
