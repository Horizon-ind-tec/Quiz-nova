'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Loader2, CalendarCheck, CheckCircle2, Circle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import type { StudyPlan } from '@/lib/types';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useEffect } from 'react';

export default function StudyPlanPage() {
    const { user, loading: userLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();

    const studyPlanQuery = useMemoFirebase(
        () => (firestore && user ? query(collection(firestore, 'users', user.uid, 'studyPlans'), orderBy('createdAt', 'desc'), limit(1)) : null),
        [firestore, user]
    );

    const { data: studyPlans, isLoading: planLoading } = useCollection<StudyPlan>(studyPlanQuery);
    const studyPlan = studyPlans?.[0];
    
    useEffect(() => {
        if (!userLoading && !user) {
            router.push('/login');
        }
    }, [user, userLoading, router]);

    const isLoading = userLoading || planLoading;
    
    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="flex flex-col">
            <Header title="Your AI Study Plan" />
            <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                           <CalendarCheck className="h-6 w-6 text-primary" />
                           Your Roadmap to Success
                        </CardTitle>
                        {studyPlan ? (
                            <CardDescription>
                                Here is your personalized study schedule, leading up to your exam on {format(new Date(studyPlan.examDate), 'PPP')}.
                            </CardDescription>
                        ) : (
                             <CardDescription>
                                You don't have a study plan yet. Create one from the dashboard!
                            </CardDescription>
                        )}
                    </CardHeader>
                    <CardContent>
                       {studyPlan && studyPlan.schedule.length > 0 ? (
                            <div className="space-y-6">
                                {studyPlan.schedule.map((task, index) => (
                                    <div key={index} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="flex flex-col items-center justify-center bg-secondary text-secondary-foreground rounded-md p-2 w-20 text-center">
                                            <span className="text-sm font-bold uppercase">{format(new Date(task.date.replace(/-/g, '/')), 'MMM')}</span>
                                            <span className="text-2xl font-bold">{format(new Date(task.date.replace(/-/g, '/')), 'dd')}</span>
                                        </div>
                                        <div className="flex-1">
                                            <Badge variant="outline" className="mb-1">{task.subject}</Badge>
                                            <p className="font-semibold text-lg">{task.chapter}</p>
                                        </div>
                                        <div>
                                            {task.isCompleted ? (
                                                <CheckCircle2 className="h-6 w-6 text-green-500" />
                                            ) : (
                                                 <Circle className="h-6 w-6 text-muted-foreground" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                       ) : (
                           <div className="flex flex-col items-center justify-center text-center py-12 text-muted-foreground">
                                <h3 className="text-lg font-semibold">No Study Plan Found</h3>
                                <p>Head back to the dashboard to create your personalized plan.</p>
                                <Button asChild className="mt-4">
                                    <Link href="/dashboard">Go to Dashboard</Link>
                                </Button>
                           </div>
                       )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
