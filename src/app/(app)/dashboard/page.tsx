'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlusCircle, BrainCircuit, Gem, BookUser } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/header';
import { PerformanceChart } from '@/components/performance-chart';
import { RecentQuizzes } from '@/components/recent-quizzes';
import type { QuizAttempt } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { collection, query, where } from 'firebase/firestore';

type ViewType = 'quiz' | 'exam';

export default function Dashboard() {
  const [view, setView] = useState<ViewType>('quiz');
  const { user, loading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  const quizHistoryQuery = useMemoFirebase(
    () =>
      firestore && user
        ? query(collection(firestore, 'users', user.uid, 'quiz_results'), where('quizType', '==', view))
        : null,
    [firestore, user, view]
  );

  const { data: quizHistory, isLoading: historyLoading } = useCollection<QuizAttempt>(quizHistoryQuery);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Header title="Dashboard" />
      <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-3xl font-bold tracking-tight">Welcome back, {user.displayName || 'Student'}!</h2>
            <p className="text-muted-foreground">Your personalized learning hub.</p>
          </div>
          <div className="flex items-center space-x-2">
             <Button asChild className="bg-blue-600 hover:bg-blue-700">
                <Link href="/report">
                    <BrainCircuit className="mr-2 h-4 w-4" />
                    AI Learning Report
                </Link>
             </Button>
              <Button asChild className="bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-lg hover:from-yellow-500 hover:to-amber-600">
                <Link href="/plans">
                    <Gem className="mr-2 h-4 w-4" />
                    Upgrade to Premium
                </Link>
             </Button>
             <Button asChild variant="outline">
                <Link href="/coaching">
                    <BookUser className="mr-2 h-4 w-4" />
                    Coaching
                </Link>
             </Button>
            <Button asChild>
              <Link href="/quiz/create">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Quiz
              </Link>
            </Button>
          </div>
        </div>

        <Tabs value={view} onValueChange={(value) => setView(value as ViewType)} className="space-y-4">
          <TabsList>
            <TabsTrigger value="quiz">Quiz Performance</TabsTrigger>
            <TabsTrigger value="exam">Exam Performance</TabsTrigger>
          </TabsList>
          <TabsContent value="quiz">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Performance Overview</CardTitle>
                    <CardDescription>Your recent quiz scores.</CardDescription>
                  </CardHeader>
                  <CardContent className="pl-2">
                     {historyLoading ? <Loader2 className="mx-auto h-8 w-8 animate-spin" /> : <PerformanceChart data={quizHistory || []} />}
                  </CardContent>
                </Card>
                <Card className="col-span-4 lg:col-span-3">
                  <CardHeader>
                    <CardTitle>Recent Quizzes</CardTitle>
                    <CardDescription>A log of your most recent quiz attempts.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {historyLoading ? <Loader2 className="mx-auto h-8 w-8 animate-spin" /> : <RecentQuizzes data={quizHistory || []} />}
                  </CardContent>
                </Card>
              </div>
          </TabsContent>
          <TabsContent value="exam">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Performance Overview</CardTitle>
                    <CardDescription>Your recent exam scores.</CardDescription>
                  </CardHeader>
                  <CardContent className="pl-2">
                    {historyLoading ? <Loader2 className="mx-auto h-8 w-8 animate-spin" /> : <PerformanceChart data={quizHistory || []} />}
                  </CardContent>
                </Card>
                <Card className="col-span-4 lg:col-span-3">
                  <CardHeader>
                    <CardTitle>Recent Exams</CardTitle>
                    <CardDescription>A log of your most recent exam attempts.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {historyLoading ? <Loader2 className="mx-auto h-8 w-8 animate-spin" /> : <RecentQuizzes data={quizHistory || []} />}
                  </CardContent>
                </Card>
              </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
