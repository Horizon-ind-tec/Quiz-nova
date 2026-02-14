'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { PlusCircle, BrainCircuit, Gem, BookUser, CalendarDays, Loader2, Target, GraduationCap, ChevronRight, FileText, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/header';
import { PerformanceChart } from '@/components/performance-chart';
import { RecentQuizzes } from '@/components/recent-quizzes';
import { UserStats } from '@/components/user-stats';
import type { QuizAttempt, UserProfile } from '@/lib/types';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc, getDoc, increment } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { differenceInCalendarDays, isYesterday, isToday, format } from 'date-fns';
import { StudyPlanDialog } from '@/components/study-plan-dialog';
import { useDoc } from '@/firebase/firestore/use-doc';

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

  const profileRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: profile } = useDoc<UserProfile>(profileRef);

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

  // Streak Logic & Aura Bonus
  useEffect(() => {
    const updateStreak = async () => {
        if (!user || !firestore || !profile) return;
        
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const lastActive = profile.lastActiveDate;

        if (!lastActive) {
            // New user activity
            await updateDoc(doc(firestore, 'users', user.uid), {
                streak: 1,
                lastActiveDate: todayStr,
                points: increment(15) // +15 Aura for Daily streak
            });
            return;
        }

        if (isToday(new Date(lastActive))) return; // Already updated today

        if (isYesterday(new Date(lastActive))) {
            // Increment streak
            const newStreak = (profile.streak || 0) + 1;
            let bonusPoints = 15; // +15 Aura for Daily streak
            
            if (newStreak > 0 && newStreak % 7 === 0) {
                bonusPoints += 100; // Special Bonus: 7-day streak → +100 Aura
                toast({ title: "7-Day Mega Streak!", description: "+100 Aura Bonus!" });
            }

            await updateDoc(doc(firestore, 'users', user.uid), {
                streak: newStreak,
                lastActiveDate: todayStr,
                points: increment(bonusPoints)
            });
        } else {
            // Reset streak
            await updateDoc(doc(firestore, 'users', user.uid), {
                streak: 1,
                lastActiveDate: todayStr,
                points: increment(15)
            });
        }
    };

    if (profile) updateStreak();
  }, [profile, user, firestore, toast]);

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
      <main className="flex-1 space-y-6 p-3 md:p-8 max-w-6xl mx-auto w-full pb-24 md:pb-8">
        
        {/* Welcome Section */}
        <div className="flex items-end justify-between">
            <div className="flex flex-col space-y-0.5">
                <h2 className="text-xl md:text-3xl font-black tracking-tight text-slate-900">
                Hey, {user?.displayName?.split(' ')[0] || 'Student'}!
                </h2>
                <p className="text-xs md:text-base text-muted-foreground font-semibold">Your AI learning roadmap is ready.</p>
            </div>
            <Button asChild variant="outline" size="sm" className="rounded-full border-2 border-indigo-100 bg-indigo-50 text-indigo-600 font-black uppercase text-[10px] tracking-widest h-8 px-4">
                <Link href="/leaderboard"><Trophy className="mr-2 h-3.5 w-3.5" /> Leaderboard</Link>
            </Button>
        </div>

        {/* Gamification Bar */}
        <UserStats profile={profile} />

        {/* Action Grid - Highly Optimized for Mobile Browsing */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 md:gap-4">
             <Button asChild className="h-20 md:h-28 bg-indigo-600 hover:bg-indigo-700 shadow-sm flex flex-col items-center justify-center gap-1 rounded-xl transition-all active:scale-95">
                <Link href="/helper">
                    <GraduationCap className="h-5 w-5 md:h-7" />
                    <span className="text-[10px] md:text-base font-bold uppercase tracking-tight">Homework Help</span>
                </Link>
             </Button>

             <Button asChild className="h-20 md:h-28 bg-blue-600 hover:bg-blue-700 shadow-sm flex flex-col items-center justify-center gap-1 rounded-xl transition-all active:scale-95">
                <Link href="/report">
                    <BrainCircuit className="h-5 w-5 md:h-7" />
                    <span className="text-[10px] md:text-base font-bold uppercase tracking-tight">AI Report</span>
                </Link>
             </Button>

              <Button asChild className="h-20 md:h-28 bg-gradient-to-br from-amber-400 to-orange-600 text-white shadow-sm hover:brightness-110 flex flex-col items-center justify-center gap-1 rounded-xl transition-all active:scale-95">
                <Link href="/plans">
                    <Gem className="h-5 w-5 md:h-7" />
                    <span className="text-[10px] md:text-base font-bold uppercase tracking-tight">Premium</span>
                </Link>
             </Button>

             <Button asChild variant="outline" className="h-20 md:h-28 bg-white border-2 border-slate-100 shadow-sm flex flex-col items-center justify-center gap-1 rounded-xl transition-all active:scale-95 hover:bg-slate-50">
                <Link href="/coaching">
                    <BookUser className="h-5 w-5 md:h-7 text-blue-600" />
                    <span className="text-[10px] md:text-base font-bold uppercase tracking-tight text-slate-800">Coaching</span>
                </Link>
             </Button>

            <Button asChild className="h-20 md:h-28 bg-blue-500 hover:bg-blue-600 shadow-sm flex flex-col items-center justify-center gap-1 rounded-xl transition-all active:scale-95">
              <Link href="/quiz/create">
                <PlusCircle className="h-5 w-5 md:h-7" />
                <span className="text-[10px] md:text-base font-bold uppercase tracking-tight">New Quiz</span>
              </Link>
            </Button>

            <Button asChild className="h-20 md:h-28 bg-violet-600 hover:bg-violet-700 text-white shadow-sm flex flex-col items-center justify-center gap-1 rounded-xl transition-all active:scale-95">
              <Link href="/notes">
                <FileText className="h-5 w-5 md:h-7" />
                <span className="text-[10px] md:text-base font-bold uppercase tracking-tight">Notes</span>
              </Link>
            </Button>

            <Button asChild variant="destructive" className="h-20 md:h-28 bg-red-500 hover:bg-red-600 shadow-sm flex flex-col items-center justify-center gap-1 rounded-xl transition-all active:scale-95">
              <Link href="/most-expected-questions">
                <Target className="h-5 w-5 md:h-7" />
                <span className="text-[10px] md:text-base font-bold uppercase tracking-tight">Expected Qs</span>
              </Link>
            </Button>

            <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="secondary" className="h-20 md:h-28 bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm flex flex-col items-center justify-center gap-1 rounded-xl transition-all active:scale-95">
                        <CalendarDays className="h-5 w-5 md:h-7" />
                        <span className="text-[10px] md:text-base font-bold uppercase tracking-tight">
                          {daysLeft !== null && daysLeft >= 0 ? `${daysLeft} Days Left` : 'Planner'}
                        </span>
                    </Button>
                </DialogTrigger>
                <StudyPlanDialog onOpenChange={setIsPlanDialogOpen} />
            </Dialog>
        </div>

        {/* Performance Section */}
        <Tabs value={view} onValueChange={(value) => setView(value as ViewType)} className="space-y-3 pt-4 border-t">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <TabsList className="bg-slate-100 p-1 w-full sm:w-auto grid grid-cols-2">
                <TabsTrigger value="quiz" className="text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Quiz Trends</TabsTrigger>
                <TabsTrigger value="exam" className="text-xs font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">Exam Trends</TabsTrigger>
            </TabsList>
            <Button variant="ghost" size="sm" asChild className="text-blue-600 hover:text-blue-700 w-full sm:w-auto h-8">
                <Link href="/performance" className="font-bold justify-center text-xs">Full History <ChevronRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
          
          <TabsContent value="quiz" className="space-y-4 outline-none">
            <div className="grid gap-4 lg:grid-cols-7">
                <Card className="lg:col-span-4 shadow-sm border-slate-200">
                  <CardHeader className="pb-2 px-4">
                    <CardTitle className="text-base md:text-lg">Score Progression</CardTitle>
                    <CardDescription className="text-xs">Your last 10 quiz results.</CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 pb-2">
                     {historyLoading ? <div className="flex h-[250px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : <PerformanceChart data={quizHistory || []} />}
                  </CardContent>
                </Card>
                <Card className="lg:col-span-3 shadow-sm border-slate-200">
                  <CardHeader className="pb-2 px-4">
                    <CardTitle className="text-base md:text-lg">Recent Quizzes</CardTitle>
                    <CardDescription className="text-xs">Your latest attempts.</CardDescription>
                  </CardHeader>
                  <CardContent className="px-0">
                    {historyLoading ? <div className="flex h-[250px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : <RecentQuizzes data={quizHistory || []} />}
                  </CardContent>
                </Card>
              </div>
          </TabsContent>
          
          <TabsContent value="exam" className="space-y-4 outline-none">
            <div className="grid gap-4 lg:grid-cols-7">
                <Card className="lg:col-span-4 shadow-sm border-slate-200">
                  <CardHeader className="pb-2 px-4">
                    <CardTitle className="text-base md:text-lg">Paper Performance</CardTitle>
                    <CardDescription className="text-xs">Handwritten scores graded by AI.</CardDescription>
                  </CardHeader>
                  <CardContent className="px-2 pb-2">
                    {historyLoading ? <div className="flex h-[250px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : <PerformanceChart data={quizHistory || []} />}
                  </CardContent>
                </Card>
                <Card className="lg:col-span-3 shadow-sm border-slate-200">
                  <CardHeader className="pb-2 px-4">
                    <CardTitle className="text-base md:text-lg">Recent Exams</CardTitle>
                    <CardDescription className="text-xs">Latest assessments.</CardDescription>
                  </CardHeader>
                  <CardContent className="px-0">
                    {historyLoading ? <div className="flex h-[250px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : <RecentQuizzes data={quizHistory || []} />}
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
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        }>
            <DashboardContent />
        </Suspense>
    )
}
