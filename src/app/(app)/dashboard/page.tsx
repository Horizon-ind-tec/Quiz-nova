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

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-background min-h-screen">
      <Header title="Dashboard" />
      <main className="flex-1 space-y-6 p-4 md:p-8 max-w-6xl mx-auto w-full">
        {/* Welcome Section */}
        <div className="flex flex-col space-y-1">
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              Welcome, {user?.displayName?.split(' ')[0] || 'Student'}!
            </h2>
            <p className="text-sm md:text-lg text-muted-foreground font-medium">Your personal learning ecosystem is ready.</p>
        </div>

        {/* Action Grid - Optimized for Mobile (2 cols) and Desktop (3-4 cols) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
             <Button asChild className="h-24 md:h-28 bg-indigo-600 hover:bg-indigo-700 shadow-md flex flex-col items-center justify-center gap-1 md:gap-2 rounded-xl transition-all hover:scale-[1.02]">
                <Link href="/helper">
                    <GraduationCap className="h-5 w-5 md:h-7 md:h-7" />
                    <span className="text-xs md:text-lg font-bold">Homework Helper</span>
                </Link>
             </Button>

             <Button asChild className="h-24 md:h-28 bg-blue-600 hover:bg-blue-700 shadow-md flex flex-col items-center justify-center gap-1 md:gap-2 rounded-xl transition-all hover:scale-[1.02]">
                <Link href="/report">
                    <BrainCircuit className="h-5 w-5 md:h-7 md:h-7" />
                    <span className="text-xs md:text-lg font-bold">AI Report</span>
                </Link>
             </Button>

              <Button asChild className="h-24 md:h-28 bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-md hover:brightness-110 flex flex-col items-center justify-center gap-1 md:gap-2 rounded-xl transition-all hover:scale-[1.02]">
                <Link href="/plans">
                    <Gem className="h-5 w-5 md:h-7 md:h-7" />
                    <span className="text-xs md:text-lg font-bold">Premium</span>
                </Link>
             </Button>

             <Button asChild variant="outline" className="h-24 md:h-28 bg-white border-2 border-slate-100 shadow-sm flex flex-col items-center justify-center gap-1 md:gap-2 rounded-xl transition-all hover:scale-[1.02] hover:bg-slate-50">
                <Link href="/coaching">
                    <BookUser className="h-5 w-5 md:h-7 md:h-7 text-blue-600" />
                    <span className="text-xs md:text-lg font-bold text-slate-800">Coaching</span>
                </Link>
             </Button>

            <Button asChild className="h-24 md:h-28 bg-blue-500 hover:bg-blue-600 shadow-md flex flex-col items-center justify-center gap-1 md:gap-2 rounded-xl transition-all hover:scale-[1.02]">
              <Link href="/quiz/create">
                <PlusCircle className="h-5 w-5 md:h-7 md:h-7" />
                <span className="text-xs md:text-lg font-bold">Create Quiz</span>
              </Link>
            </Button>

            <Button asChild className="h-24 md:h-28 bg-violet-600 hover:bg-violet-700 text-white shadow-md flex flex-col items-center justify-center gap-1 md:gap-2 rounded-xl transition-all hover:scale-[1.02]">
              <Link href="/notes">
                <FileText className="h-5 w-5 md:h-7 md:h-7" />
                <span className="text-xs md:text-lg font-bold">Chapter Notes</span>
              </Link>
            </Button>

            <Button asChild variant="destructive" className="h-24 md:h-28 bg-red-500 hover:bg-red-600 shadow-md flex flex-col items-center justify-center gap-1 md:gap-2 rounded-xl transition-all hover:scale-[1.02]">
              <Link href="/most-expected-questions">
                <Target className="h-5 w-5 md:h-7 md:h-7" />
                <span className="text-xs md:text-lg font-bold">Expected Qs</span>
              </Link>
            </Button>

            <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="secondary" className="h-24 md:h-28 bg-emerald-500 hover:bg-emerald-600 text-white shadow-md flex flex-col items-center justify-center gap-1 md:gap-2 rounded-xl transition-all hover:scale-[1.02]">
                        <CalendarDays className="h-5 w-5 md:h-7 md:h-7" />
                        <span className="text-xs md:text-lg font-bold">
                          {daysLeft !== null && daysLeft >= 0 ? `${daysLeft} Days Left` : 'Study Planner'}
                        </span>
                    </Button>
                </DialogTrigger>
                <StudyPlanDialog onOpenChange={setIsPlanDialogOpen} />
            </Dialog>
        </div>

        {/* Performance Section */}
        <Tabs value={view} onValueChange={(value) => setView(value as ViewType)} className="space-y-4 pt-6 border-t">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <TabsList className="bg-slate-100 p-1 w-full sm:w-auto">
                <TabsTrigger value="quiz" className="flex-1 sm:flex-none data-[state=active]:bg-white data-[state=active]:shadow-sm">Quiz Trends</TabsTrigger>
                <TabsTrigger value="exam" className="flex-1 sm:flex-none data-[state=active]:bg-white data-[state=active]:shadow-sm">Exam Trends</TabsTrigger>
            </TabsList>
            <Button variant="ghost" size="sm" asChild className="text-blue-600 hover:text-blue-700 w-full sm:w-auto">
                <Link href="/performance" className="font-bold justify-center">View Full History <ChevronRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
          
          <TabsContent value="quiz" className="space-y-4 outline-none">
            <div className="grid gap-4 lg:grid-cols-7">
                <Card className="lg:col-span-4 shadow-sm border-slate-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Score Progression</CardTitle>
                    <CardDescription>Your last 10 quiz results.</CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 pb-2">
                     {historyLoading ? <div className="flex h-[300px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : <PerformanceChart data={quizHistory || []} />}
                  </CardContent>
                </Card>
                <Card className="lg:col-span-3 shadow-sm border-slate-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Recent Quizzes</CardTitle>
                    <CardDescription>Your latest attempts.</CardDescription>
                  </CardHeader>
                  <CardContent className="px-0">
                    {historyLoading ? <div className="flex h-[300px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : <RecentQuizzes data={quizHistory || []} />}
                  </CardContent>
                </Card>
              </div>
          </TabsContent>
          
          <TabsContent value="exam" className="space-y-4 outline-none">
            <div className="grid gap-4 lg:grid-cols-7">
                <Card className="lg:col-span-4 shadow-sm border-slate-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Paper Performance</CardTitle>
                    <CardDescription>Handwritten scores graded by AI.</CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 pb-2">
                    {historyLoading ? <div className="flex h-[300px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : <PerformanceChart data={quizHistory || []} />}
                  </CardContent>
                </Card>
                <Card className="lg:col-span-3 shadow-sm border-slate-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Recent Exams</CardTitle>
                    <CardDescription>Latest assessments.</CardDescription>
                  </CardHeader>
                  <CardContent className="px-0">
                    {historyLoading ? <div className="flex h-[300px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : <RecentQuizzes data={quizHistory || []} />}
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
