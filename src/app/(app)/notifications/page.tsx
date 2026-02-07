'use client';

import { useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, where, doc, updateDoc } from 'firebase/firestore';
import { Loader2, UserCheck, ShieldQuestion, Bell } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/header';
import { handlePaymentAction } from '@/app/actions';

const ADMIN_EMAIL = 'wizofclassknowledge@gmail.com';

export default function NotificationsPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const pendingUsersQuery = useMemoFirebase(
    () => (firestore && user?.email === ADMIN_EMAIL ? query(collection(firestore, 'users'), where('paymentStatus', '==', 'pending')) : null),
    [firestore, user]
  );
  
  const { data: pendingUsers, isLoading: pendingUsersLoading, error } = useCollection<UserProfile>(pendingUsersQuery);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  const onPaymentAction = async (targetUser: UserProfile, action: 'approve' | 'deny') => {
    if (!firestore || !targetUser.pendingPlan) return;

    try {
        // 1. Update Firestore on the client side (leveraging isAdmin rule) to bypass Admin SDK issues
        const userDocRef = doc(firestore, 'users', targetUser.id);
        if (action === 'approve') {
            await updateDoc(userDocRef, {
                paymentStatus: 'confirmed',
            });
        } else {
            await updateDoc(userDocRef, {
                paymentStatus: null,
                pendingPlan: null,
            });
        }

        // 2. Trigger non-blocking email notifications via server action
        await handlePaymentAction({ 
            targetUserId: targetUser.id, 
            targetUserEmail: targetUser.email,
            targetUserName: targetUser.name,
            pendingPlan: targetUser.pendingPlan,
            action 
        });

        if (action === 'approve') {
            toast({
                title: 'Payment Approved',
                description: `A confirmation email has been sent to ${targetUser.name}.`,
            });
        } else {
            toast({
                title: 'Payment Denied',
                description: `The plan for ${targetUser.name} has been rejected.`,
            });
        }
    } catch (e: any) {
        toast({
            variant: 'destructive',
            title: 'Action Failed',
            description: e.message || "Could not process the payment action.",
        });
    }
  };


  if (userLoading || !user) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const isUserAdmin = user.email === ADMIN_EMAIL;

  return (
    <div className="flex flex-col">
      <Header title="Notifications" />
      <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Your Inbox</CardTitle>
            <CardDescription>
                {isUserAdmin ? "Review and confirm pending plan upgrades from users." : "Here are your recent account notifications."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isUserAdmin ? (
                <>
                    {pendingUsersLoading && <Loader2 className="mx-auto my-8 h-8 w-8 animate-spin" />}
                    {error && <p className="text-destructive">Error loading pending payments: {error.message}</p>}
                    
                    {!pendingUsersLoading && pendingUsers && pendingUsers.length > 0 && (
                        <div className="space-y-4">
                            {pendingUsers.map(pUser => (
                                <div key={pUser.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg border p-4 gap-4">
                                    <div>
                                        <p className="font-semibold">{pUser.name} ({pUser.email})</p>
                                        <p className="text-sm text-muted-foreground">
                                            Wants to upgrade to: <span className="font-bold text-primary capitalize">{pUser.pendingPlan} Plan</span>
                                        </p>
                                    </div>
                                    <div className="flex gap-2 self-end sm:self-center">
                                        <Button size="sm" onClick={() => onPaymentAction(pUser, 'approve')}>
                                            <UserCheck className="mr-2 h-4 w-4" /> Approve
                                        </Button>
                                        <Button size="sm" variant="destructive" onClick={() => onPaymentAction(pUser, 'deny')}>
                                            <ShieldQuestion className="mr-2 h-4 w-4" /> Deny
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!pendingUsersLoading && (!pendingUsers || pendingUsers.length === 0) && (
                        <div className="flex flex-col items-center justify-center text-center py-12 text-muted-foreground">
                            <Bell className="h-12 w-12 mb-4" />
                            <h3 className="text-lg font-semibold">All caught up!</h3>
                            <p>You have no pending notifications.</p>
                        </div>
                    )}
                </>
            ) : (
                <div className="flex flex-col items-center justify-center text-center py-12 text-muted-foreground">
                    <Bell className="h-12 w-12 mb-4" />
                    <h3 className="text-lg font-semibold">All caught up!</h3>
                    <p>You have no new notifications.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
