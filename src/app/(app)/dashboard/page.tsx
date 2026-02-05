'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { PlusCircle, BrainCircuit, Gem, BookUser, CalendarDays, Loader2, Target, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/header';
import { PerformanceChart } from '@/components/performance-chart';
import { RecentQuizzes } from '@/components/recent-quizzes';
import type { QuizAttempt } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { differenceInCalendarDays } from 'date-fns';
import { StudyPlanDialog } from '@/components/study-plan-dialog';

type ViewType = 'quiz' | 'exam';

function DashboardContent() {
  const [view, setView] = useState<ViewType>('quiz');
  const { user, loading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [examDate] = useLocalStorage<string | null>('examDate', null);
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);

  const status = searchParams.get('status');
  const plan = searchParams.get('plan');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  useEffect(() => {
    if (status === 'success') {
      toast({
        title: 'Plan Activated!',
        description: `Your ${plan} plan is now active. Enjoy your new features!`,
        duration: 5000,
      });
      router.replace('/dashboard', { scroll: false });
    } else if (status === 'error') {
       toast({
        variant: 'destructive',
        title: 'Activation Failed',
        description: 'There was an issue activating your plan. Please contact support.',
        duration: 5000,
      });
       router.replace('/dashboard', { scroll: false });
    }
  }, [status, plan, router, toast]);

  useEffect(() => {
    if (examDate) {
      const today = new Date();
      const targetDate = new Date(examDate);
      const diff = differenceInCalendarDays(targetDate, today);
      setDaysLeft(diff);
    } else {
      setDaysLeft(null);
    }
  }, [examDate]);

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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
             <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
                <Link href="/helper">
                    <GraduationCap className="mr-2 h-4 w-4" />
                    Exam & Homework Helper
                </Link>
             </Button>
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
            <Button asChild variant="destructive">
              <Link href="/most-expected-questions">
                <Target className="mr-2 h-4 w-4" />
                Most Expected Questions
              </Link>
            </Button>
            <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="secondary">
                        <CalendarDays className="mr-2 h-4 w-4" />
                        {daysLeft !== null && daysLeft >= 0 ? `${daysLeft} Days Left` : 'AI Study Planner'}
                    </Button>
                </DialogTrigger>
                <StudyPlanDialog onOpenChange={setIsPlanDialogOpen} />
            </Dialog>
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


export default function Dashboard() {
    return (
        <Suspense fallback={
             <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        }>
            <DashboardContent />
        </Suspense>
    )
}
