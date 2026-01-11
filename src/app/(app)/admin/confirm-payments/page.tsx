
'use client';

import { useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, where, doc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Loader2, UserCheck, ShieldQuestion } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/header';
import { notifyAdminOfPaymentAction } from '@/app/actions';

const ADMIN_EMAIL = 'wizofclassknowledge@gmail.com';

export default function ConfirmPaymentsPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const pendingUsersQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'users'), where('paymentStatus', '==', 'pending')) : null),
    [firestore]
  );
  
  const { data: pendingUsers, isLoading: pendingUsersLoading, error } = useCollection<UserProfile>(pendingUsersQuery);

  useEffect(() => {
    if (!userLoading && (!user || user.email !== ADMIN_EMAIL)) {
      router.push('/dashboard');
    }
  }, [user, userLoading, router]);

  const handlePaymentAction = async (targetUser: UserProfile, action: 'approve' | 'deny') => {
    if (!firestore) return;
    
    const userRef = doc(firestore, 'users', targetUser.id);
    
    if (action === 'approve') {
       if (targetUser.pendingPlan) {
            updateDocumentNonBlocking(userRef, {
                paymentStatus: 'confirmed',
            });

             // This will now send the confirmation email to the user.
            await notifyAdminOfPaymentAction({
                userId: targetUser.id,
                userName: targetUser.name,
                userEmail: targetUser.email,
                planName: targetUser.pendingPlan,
                planPrice: targetUser.pendingPlan === 'premium' ? '₹500' : '₹1000',
                transactionId: `Nova${targetUser.pendingPlan === 'premium' ? '+' : '$'}${targetUser.id.slice(0,9).toLowerCase()}`,
                isApproval: true, // Flag this as an approval action
            });

            toast({
                title: 'Payment Approved',
                description: `A confirmation email has been sent to ${targetUser.name}.`,
            });
       }
    } else { // deny
        updateDocumentNonBlocking(userRef, {
            paymentStatus: null,
            pendingPlan: null,
        });
         toast({
            title: 'Payment Denied',
            description: `The plan for ${targetUser.name} has been rejected.`,
        });
    }
  };


  if (userLoading || !user) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col">
      <Header title="Confirm Payments (Admin)" />
      <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Pending Payments</CardTitle>
            <CardDescription>Review and confirm pending plan upgrades from users.</CardDescription>
          </CardHeader>
          <CardContent>
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
                                <Button size="sm" onClick={() => handlePaymentAction(pUser, 'approve')}>
                                    <UserCheck className="mr-2 h-4 w-4" /> Approve
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handlePaymentAction(pUser, 'deny')}>
                                    <ShieldQuestion className="mr-2 h-4 w-4" /> Deny
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

             {!pendingUsersLoading && (!pendingUsers || pendingUsers.length === 0) && (
                <p className="text-center text-muted-foreground py-8">No pending payments.</p>
             )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
