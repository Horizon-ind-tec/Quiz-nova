
'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { PlusCircle, BrainCircuit, Gem, BookUser, CalendarDays, Loader2, Target, GraduationCap, ChevronRight, FileText } from 'lucide-react';
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
        <div className="flex flex-col space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Welcome back, {user.displayName || 'Student'}!</h2>
            <p className="text-muted-foreground">Your personalized AI learning hub.</p>
        </div>

        {/* --- Feature Grid --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
             <Button asChild className="h-24 bg-indigo-600 hover:bg-indigo-700 shadow-md flex flex-col items-center justify-center gap-1 group">
                <Link href="/helper">
                    <GraduationCap className="h-6 w-6 mb-1 transition-transform group-hover:scale-110" />
                    <span className="font-semibold">Homework Helper AI</span>
                </Link>
             </Button>
             <Button asChild className="h-24 bg-blue-600 hover:bg-blue-700 shadow-md flex flex-col items-center justify-center gap-1 group">
                <Link href="/report">
                    <BrainCircuit className="h-6 w-6 mb-1 transition-transform group-hover:scale-110" />
                    <span className="font-semibold">AI Learning Report</span>
                </Link>
             </Button>
              <Button asChild className="h-24 bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg hover:brightness-110 flex flex-col items-center justify-center gap-1 group">
                <Link href="/plans">
                    <Gem className="h-6 w-6 mb-1 transition-transform group-hover:scale-110" />
                    <span className="font-semibold">Upgrade to Premium</span>
                </Link>
             </Button>
             <Button asChild variant="outline" className="h-24 border-2 flex flex-col items-center justify-center gap-1 group">
                <Link href="/coaching">
                    <BookUser className="h-6 w-6 mb-1 text-primary transition-transform group-hover:scale-110" />
                    <span className="font-semibold text-foreground">Video Coaching</span>
                </Link>
             </Button>
            <Button asChild className="h-24 shadow-md flex flex-col items-center justify-center gap-1 group">
              <Link href="/quiz/create">
                <PlusCircle className="h-6 w-6 mb-1 transition-transform group-hover:scale-110" />
                <span className="font-semibold">Create New Quiz</span>
              </Link>
            </Button>
            <Button asChild className="h-24 bg-violet-600 hover:bg-violet-700 text-white shadow-md flex flex-col items-center justify-center gap-1 group">
              <Link href="/notes">
                <FileText className="h-6 w-6 mb-1 transition-transform group-hover:scale-110" />
                <span className="font-semibold">AI Chapter Notes</span>
              </Link>
            </Button>
            <Button asChild variant="destructive" className="h-24 shadow-md flex flex-col items-center justify-center gap-1 group">
              <Link href="/most-expected-questions">
                <Target className="h-6 w-6 mb-1 transition-transform group-hover:scale-110" />
                <span className="font-semibold">Expected Questions</span>
              </Link>
            </Button>
            <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="secondary" className="h-24 shadow-md flex flex-col items-center justify-center gap-1 group">
                        <CalendarDays className="h-6 w-6 mb-1 text-primary transition-transform group-hover:scale-110" />
                        <span className="font-semibold">{daysLeft !== null && daysLeft >= 0 ? `${daysLeft} Days Left` : 'AI Study Planner'}</span>
                    </Button>
                </DialogTrigger>
                <StudyPlanDialog onOpenChange={setIsPlanDialogOpen} />
            </Dialog>
        </div>

        <Tabs value={view} onValueChange={(value) => setView(value as ViewType)} className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <TabsList>
                <TabsTrigger value="quiz">Quiz Performance</TabsTrigger>
                <TabsTrigger value="exam">Exam Performance</TabsTrigger>
            </TabsList>
            <Button variant="ghost" size="sm" asChild>
                <Link href="/performance">View All <ChevronRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          <TabsContent value="quiz" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 shadow-sm">
                  <CardHeader>
                    <CardTitle>Quiz Trends</CardTitle>
                    <CardDescription>Your score history for generated quizzes.</CardDescription>
                  </CardHeader>
                  <CardContent className="pl-2">
                     {historyLoading ? <div className="flex h-[350px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div> : <PerformanceChart data={quizHistory || []} />}
                  </CardContent>
                </Card>
                <Card className="col-span-4 lg:col-span-3 shadow-sm">
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Your last 5 quiz attempts.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {historyLoading ? <div className="flex h-[350px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div> : <RecentQuizzes data={quizHistory || []} />}
                  </CardContent>
                </Card>
              </div>
          </TabsContent>
          <TabsContent value="exam" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 shadow-sm">
                  <CardHeader>
                    <CardTitle>Exam Performance</CardTitle>
                    <CardDescription>Handwritten paper scores graded by AI.</CardDescription>
                  </CardHeader>
                  <CardContent className="pl-2">
                    {historyLoading ? <div className="flex h-[350px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div> : <PerformanceChart data={quizHistory || []} />}
                  </CardContent>
                </Card>
                <Card className="col-span-4 lg:col-span-3 shadow-sm">
                  <CardHeader>
                    <CardTitle>Recent Exams</CardTitle>
                    <CardDescription>Latest paper assessments.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {historyLoading ? <div className="flex h-[350px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div> : <RecentQuizzes data={quizHistory || []} />}
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
