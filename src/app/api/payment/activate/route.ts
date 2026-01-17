
import { NextRequest, NextResponse } from 'next/server';
import type { Firestore } from 'firebase-admin/firestore';
import { getAdminDb } from '@/firebase/admin';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002';


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  
  let db: Firestore;
  try {
      db = await getAdminDb('api-activate');
  } catch (err) {
      console.error((err as Error).message);
      return NextResponse.redirect(`${appUrl}/dashboard?status=error&code=admin_init`, 302);
  }

  if (!userId) {
    return new NextResponse('Bad Request: Missing userId parameter.', { status: 400 });
  }

  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return new NextResponse(`User with ID ${userId} not found.`, { status: 404 });
    }

    const userData = userDoc.data()!;
    let statusPlan = userData.pendingPlan || userData.plan;

    // Check if the plan is already active or if the status is correct
    if (userData.paymentStatus === 'confirmed' && userData.pendingPlan) {
        // Activate the plan
        await userRef.update({
            plan: userData.pendingPlan,
            paymentStatus: null, // Clear the status after activating
            pendingPlan: null, // Clear the pending plan
        });
        return NextResponse.redirect(`${appUrl}/dashboard?status=success&plan=${statusPlan}`, 302);

    } else if (userData.plan !== 'free' && !userData.pendingPlan) {
        // Still redirect to success as they are on a paid plan
        return NextResponse.redirect(`${appUrl}/dashboard?status=success&plan=${statusPlan}`, 302);

    } else {
        // Redirect to dashboard with an error
        return NextResponse.redirect(`${appUrl}/dashboard?status=error`, 302);
    }

  } catch (error) {
    console.error('Error processing payment activation:', error);
    // Redirect to an error page on the dashboard
    return NextResponse.redirect(`${appUrl}/dashboard?status=error`, 302);
  }
}
