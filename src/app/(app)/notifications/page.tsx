'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, where, doc, updateDoc } from 'firebase/firestore';
import { Loader2, UserCheck, ShieldQuestion, Bell, CheckCircle2, XCircle, Gem } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/header';
import { handlePaymentAction } from '@/app/actions';
import { useDoc } from '@/firebase/firestore/use-doc';

const ADMIN_EMAIL = 'wizofclassknowledge@gmail.com';

export default function NotificationsPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  // Admin Query: Pending user approvals
  const pendingUsersQuery = useMemoFirebase(
    () => (firestore && user?.email === ADMIN_EMAIL ? query(collection(firestore, 'users'), where('paymentStatus', '==', 'pending')) : null),
    [firestore, user]
  );
  const { data: pendingUsers, isLoading: pendingUsersLoading } = useCollection<UserProfile>(pendingUsersQuery);

  // Student View: Own profile for status checks
  const userProfileRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  const onAdminAction = async (targetUser: UserProfile, action: 'approve' | 'deny') => {
    if (!firestore || !targetUser.pendingPlan) return;
    setIsProcessing(true);
    try {
        const userDocRef = doc(firestore, 'users', targetUser.id);
        if (action === 'approve') {
            await updateDoc(userDocRef, { paymentStatus: 'confirmed' });
        } else {
            await updateDoc(userDocRef, { paymentStatus: null, pendingPlan: null });
        }

        await handlePaymentAction({ 
            targetUserId: targetUser.id, 
            targetUserEmail: targetUser.email,
            targetUserName: targetUser.name,
            pendingPlan: targetUser.pendingPlan,
            action 
        });

        toast({ title: action === 'approve' ? 'Payment Approved' : 'Payment Denied' });
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Action Failed', description: e.message });
    } finally {
        setIsProcessing(false);
    }
  };

  const onStudentAction = async (action: 'confirm' | 'cancel') => {
    if (!firestore || !user || !userProfile?.pendingPlan) return;
    setIsProcessing(true);
    try {
        const userDocRef = doc(firestore, 'users', user.uid);
        if (action === 'confirm') {
            await updateDoc(userDocRef, {
                plan: userProfile.pendingPlan,
                paymentStatus: null,
                pendingPlan: null
            });
            toast({ title: 'Plan Upgraded!', description: `Welcome to the ${userProfile.pendingPlan} plan.` });
            router.push('/dashboard');
        } else {
            await updateDoc(userDocRef, { paymentStatus: null, pendingPlan: null });
            toast({ title: 'Upgrade Cancelled', description: 'Your request has been cancelled. If payment was made, it will be refunded.' });
        }
    } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error', description: e.message });
    } finally {
        setIsProcessing(false);
    }
  }


  if (userLoading || profileLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const isUserAdmin = user?.email === ADMIN_EMAIL;
  const showStudentNotification = userProfile?.paymentStatus === 'confirmed' && userProfile?.pendingPlan;

  return (
    <div className="flex flex-col">
      <Header title="Notifications" />
      <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Your Inbox</CardTitle>
            <CardDescription>
                {isUserAdmin ? "Review and confirm pending plan upgrades from users." : "Stay updated on your account status and upgrades."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* --- ADMIN VIEW --- */}
            {isUserAdmin && (
                <>
                    {pendingUsersLoading && <Loader2 className="mx-auto my-8 h-8 w-8 animate-spin" />}
                    {!pendingUsersLoading && pendingUsers && pendingUsers.length > 0 && (
                        <div className="space-y-4">
                            {pendingUsers.map(pUser => (
                                <div key={pUser.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border p-4 gap-4 bg-muted/30">
                                    <div>
                                        <p className="font-semibold">{pUser.name} ({pUser.email})</p>
                                        <p className="text-sm text-muted-foreground">
                                            Wants to upgrade to: <span className="font-bold text-primary capitalize">{pUser.pendingPlan} Plan</span>
                                        </p>
                                    </div>
                                    <div className="flex gap-2 self-end sm:self-center">
                                        <Button size="sm" onClick={() => onAdminAction(pUser, 'approve')} disabled={isProcessing}>
                                            <UserCheck className="mr-2 h-4 w-4" /> Approve
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => onAdminAction(pUser, 'deny')} disabled={isProcessing}>
                                            <ShieldQuestion className="mr-2 h-4 w-4" /> Deny
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* --- STUDENT VIEW --- */}
            {!isUserAdmin && showStudentNotification && (
                <div className="p-6 border-2 border-primary rounded-xl bg-primary/5 space-y-4 text-center">
                    <div className="flex justify-center"><Gem className="h-12 w-12 text-primary animate-pulse" /></div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold">Payment Verified Successfully!</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Hey {userProfile?.name}, we've confirmed your payment for the <strong className="text-primary capitalize">{userProfile.pendingPlan} Plan</strong>.
                        </p>
                        <p className="text-sm font-semibold">Do you want to activate your upgrade now?</p>
                    </div>
                    <div className="flex items-center justify-center gap-4 pt-2">
                        <Button className="w-32 bg-green-600 hover:bg-green-700" onClick={() => onStudentAction('confirm')} disabled={isProcessing}>
                            <CheckCircle2 className="mr-2 h-4 w-4" /> YES
                        </Button>
                        <Button variant="outline" className="w-32 border-destructive text-destructive hover:bg-destructive/10" onClick={() => onStudentAction('cancel')} disabled={isProcessing}>
                            <XCircle className="mr-2 h-4 w-4" /> NO
                        </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground pt-4 uppercase tracking-tighter">
                        If you select NO, your request will be cancelled and a refund will be processed.
                    </p>
                </div>
            )}

            {/* --- EMPTY STATE --- */}
            {((isUserAdmin && !pendingUsersLoading && (!pendingUsers || pendingUsers.length === 0)) || (!isUserAdmin && !showStudentNotification)) && (
                <div className="flex flex-col items-center justify-center text-center py-12 text-muted-foreground">
                    <Bell className="h-12 w-12 mb-4" />
                    <h3 className="text-lg font-semibold">All caught up!</h3>
                    <p>You have no new notifications at the moment.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
