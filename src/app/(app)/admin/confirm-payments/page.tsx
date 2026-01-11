'use client';

import { useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';


export default function AdminConfirmPaymentsPage() {
    const firestore = useFirestore();
    const { toast } = useToast();

    const pendingUsersQuery = useMemoFirebase(
        () => (firestore ? query(collection(firestore, 'users'), where('paymentStatus', '==', 'pending')) : null),
        [firestore]
    );

    const { data: pendingUsers, isLoading: usersLoading } = useCollection<UserProfile>(pendingUsersQuery);
    
    const handleConfirmPayment = async (userId: string, plan: 'premium' | 'ultimate') => {
        if (!firestore) return;

        const userDocRef = doc(firestore, 'users', userId);
        try {
            await updateDoc(userDocRef, {
                plan: plan,
                paymentStatus: 'confirmed',
                pendingPlan: null, // Using null to remove the field
            });
            toast({
                title: 'Payment Confirmed',
                description: `User ${userId} has been upgraded to the ${plan} plan.`,
            });
        } catch (error) {
             console.error("Error confirming payment:", error);
             toast({
                variant: 'destructive',
                title: 'Error',
                description: (error as Error).message || 'Failed to confirm payment.',
            });
        }
    };

    return (
        <div className="flex flex-col">
            <Header title="Confirm Payments" />
            <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Pending Payments</CardTitle>
                        <CardDescription>Review and confirm payments from users who have upgraded their plan.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {usersLoading ? (
                            <div className="flex h-64 items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : pendingUsers && pendingUsers.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Requested Plan</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pendingUsers.map(user => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant={user.pendingPlan === 'premium' ? 'default' : 'secondary'} className="capitalize">
                                                    {user.pendingPlan}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {user.pendingPlan && (
                                                    <Button 
                                                        size="sm"
                                                        onClick={() => handleConfirmPayment(user.id, user.pendingPlan!)}
                                                    >
                                                        <CheckCircle className="mr-2 h-4 w-4" />
                                                        Confirm Payment
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                             <div className="flex h-64 flex-col items-center justify-center text-center">
                                <h3 className="text-lg font-semibold">No Pending Payments</h3>
                                <p className="text-muted-foreground">All user payments are up to date.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
