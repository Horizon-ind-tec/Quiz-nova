'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { useDoc } from '@/firebase/firestore/use-doc';
import { doc } from 'firebase/firestore';
import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import type { UserProfile } from '@/lib/types';


export default function PaymentConfirmationPage() {
    const { user, loading: userLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const userProfileRef = useMemoFirebase(
        () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
        [firestore, user]
    );

    const { data: userProfile, isLoading: profileLoading } = useDoc<UserProfile>(userProfileRef);

    const [progress, setProgress] = useState(20);

    useEffect(() => {
        if (userProfile?.paymentStatus === 'confirmed') {
            setProgress(100);
            setTimeout(() => {
                router.push('/dashboard');
            }, 1000); // Wait 1 second before redirecting
        } else {
            setProgress(20);
        }
    }, [userProfile, router]);


    if (userLoading || profileLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    if (!user) {
         router.replace('/login');
         return null;
    }


    return (
        <div className="flex flex-col h-screen">
            <Header title="Payment Confirmation" />
            <main className="flex-1 flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center">
                    <CardHeader>
                        <CardTitle>Confirming Your Payment</CardTitle>
                        <CardDescription>
                           Please wait while we confirm your payment. This page will update automatically.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Progress value={progress} className="w-full" />
                        <p className="text-muted-foreground animate-pulse">
                           {progress < 100 ? 'We are confirming your payment...' : 'Payment confirmed! Redirecting...'}
                        </p>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}
