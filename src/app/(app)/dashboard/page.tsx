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
      <main className="flex-1 space-y-6 p-4 pt-6 md:p-8">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Welcome back, {user.displayName || 'Student'}!</h2>
          <p className="text-muted-foreground">Your personalized learning hub.</p>
        </div>

        {/* --- Main Action Buttons Stack --- */}
        <div className="flex flex-col gap-3 w-full max-w-2xl mx-auto md:mx-0">
          <Button asChild className="h-12 w-full bg-[#6366f1] hover:bg-[#5558e3] text-white text-md font-semibold rounded-md shadow-sm">
            <Link href="/helper">
              <GraduationCap className="mr-2 h-5 w-5" />
              Exam & Homework Helper
            </Link>
          </Button>

          <Button asChild className="h-12 w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-md font-semibold rounded-md shadow-sm">
            <Link href="/report">
              <BrainCircuit className="mr-2 h-5 w-5" />
              AI Learning Report
            </Link>
          </Button>

          <Button asChild className="h-12 w-full bg-[#f59e0b] hover:bg-[#d97706] text-white text-md font-semibold rounded-md shadow-sm">
            <Link href="/plans">
              <Gem className="mr-2 h-5 w-5" />
              Upgrade to Premium
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-12 w-full border-2 text-md font-semibold rounded-md shadow-sm">
            <Link href="/coaching">
              <BookUser className="mr-2 h-5 w-5" />
              Coaching
            </Link>
          </Button>

          <Button asChild className="h-12 w-full bg-[#5c85b1] hover:bg-[#4a6d91] text-white text-md font-semibold rounded-md shadow-sm">
            <Link href="/quiz/create">
              <PlusCircle className="mr-2 h-5 w-5" />
              Create New Quiz
            </Link>
          </Button>

          <Button asChild className="h-12 w-full bg-[#ef4444] hover:bg-[#dc2626] text-white text-md font-semibold rounded-md shadow-sm">
            <Link href="/most-expected-questions">
              <Target className="mr-2 h-5 w-5" />
              Most Expected Questions
            </Link>
          </Button>

          <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" className="h-12 w-full hover:bg-accent text-md font-semibold rounded-md">
                <CalendarDays className="mr-2 h-5 w-5" />
                {daysLeft !== null && daysLeft >= 0 ? `${daysLeft} Days Left` : 'AI Study Planner'}
              </Button>
            </DialogTrigger>
            <StudyPlanDialog onOpenChange={setIsPlanDialogOpen} />
          </Dialog>
        </div>

        <Tabs value={view} onValueChange={(value) => setView(value as ViewType)} className="space-y-4">
          <TabsList className="bg-transparent border-b rounded-none h-auto p-0 gap-6">
            <TabsTrigger 
              value="quiz" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none px-0 pb-2 text-md"
            >
              Quiz Performance
            </TabsTrigger>
            <TabsTrigger 
              value="exam" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none px-0 pb-2 text-md"
            >
              Exam Performance
            </TabsTrigger>
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
