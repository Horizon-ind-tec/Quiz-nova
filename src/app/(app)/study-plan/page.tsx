'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Loader2, CalendarCheck, CheckCircle2, Circle, TrendingUp, BookOpen, Clock, Target } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/header';
import type { StudyPlan } from '@/lib/types';
import { format, differenceInCalendarDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

    const stats = useMemo(() => {
        if (!studyPlan) return null;
        
        const totalChapters = studyPlan.subjects.reduce((acc, s) => acc + s.chapters.length, 0);
        const today = new Date();
        const examDate = new Date(studyPlan.examDate);
        const totalDays = Math.max(1, differenceInCalendarDays(examDate, today));
        
        // Simplified learning metrics
        const chaptersPerDay = (totalChapters / totalDays).toFixed(1);
        const chaptersPerMonth = (totalChapters / (totalDays / 30)).toFixed(1);
        
        // Calculation logic for "Student Study Planner" dashboard
        const lossOfDays = Math.floor(totalDays * 0.1); // 10% safety margin
        const targetDays = totalDays - lossOfDays - 2; // Subtracting revision days

        return {
            totalChapters,
            totalDays,
            chaptersPerDay,
            chaptersPerMonth,
            lossOfDays,
            targetDays,
            revisionDays: 2
        };
    }, [studyPlan]);

    const isLoading = userLoading || planLoading;
    
    if (isLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!studyPlan) {
        return (
            <div className="flex flex-col h-screen">
                <Header title="Your AI Study Plan" />
                <main className="flex-1 flex flex-col items-center justify-center p-4">
                    <Card className="max-w-md w-full text-center p-8">
                        <CalendarCheck className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-bold mb-2">No Study Plan Found</h3>
                        <p className="text-muted-foreground mb-6">Head back to the dashboard to create your personalized roadmap to success.</p>
                        <Button asChild className="w-full">
                            <Link href="/dashboard">Go to Dashboard</Link>
                        </Button>
                    </Card>
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col bg-muted/20 min-h-screen">
            <Header title="AI Study Dashboard" />
            <main className="flex-1 space-y-6 p-4 md:p-8 max-w-6xl mx-auto w-full">
                
                {/* --- Student Study Planner Header --- */}
                <Card className="border-t-4 border-t-primary">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-2xl font-black text-primary uppercase tracking-tighter">Student Study Planner</CardTitle>
                            <p className="text-sm font-bold text-muted-foreground">www.QuizNova.com</p>
                        </div>
                        <div className="text-right">
                            <Badge variant="secondary" className="px-3 py-1 font-bold">EXAM DATE: {format(new Date(studyPlan.examDate), 'dd-MM-yyyy')}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* --- Metrics Grid --- */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex flex-col items-center text-center">
                                <BookOpen className="h-5 w-5 text-primary mb-2" />
                                <span className="text-xs font-bold uppercase text-muted-foreground">Total Chapters</span>
                                <span className="text-3xl font-black text-primary">{stats?.totalChapters}</span>
                            </div>
                            <div className="bg-orange-500/5 p-4 rounded-xl border border-orange-500/10 flex flex-col items-center text-center">
                                <TrendingUp className="h-5 w-5 text-orange-600 mb-2" />
                                <span className="text-xs font-bold uppercase text-muted-foreground">Chapters/Day</span>
                                <span className="text-3xl font-black text-orange-600">{stats?.chaptersPerDay}</span>
                            </div>
                            <div className="bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/10 flex flex-col items-center text-center">
                                <Target className="h-5 w-5 text-indigo-600 mb-2" />
                                <span className="text-xs font-bold uppercase text-muted-foreground">Chapters/Month</span>
                                <span className="text-3xl font-black text-indigo-600">{stats?.chaptersPerMonth}</span>
                            </div>
                            <div className="bg-green-500/5 p-4 rounded-xl border border-green-500/10 flex flex-col items-center text-center">
                                <Clock className="h-5 w-5 text-green-600 mb-2" />
                                <span className="text-xs font-bold uppercase text-muted-foreground">Study Days Left</span>
                                <span className="text-3xl font-black text-green-600">{stats?.totalDays}</span>
                            </div>
                        </div>

                        {/* --- Detailed Breakdown --- */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                            <div className="space-y-4">
                                <h4 className="font-black text-lg uppercase flex items-center gap-2 border-b pb-2">
                                    <BookOpen className="h-5 w-5" /> Subject Wise Chapters
                                </h4>
                                <Table>
                                    <TableHeader>
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="font-bold">Subject Name</TableHead>
                                            <TableHead className="text-right font-bold">Chapters</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {studyPlan.subjects.map((s, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="font-medium">{s.name}</TableCell>
                                                <TableCell className="text-right font-bold">{s.chapters.length}</TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-muted/50 font-black">
                                            <TableCell>Total Chapters to Cover</TableCell>
                                            <TableCell className="text-right">{stats?.totalChapters}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-black text-lg uppercase flex items-center gap-2 border-b pb-2">
                                    <Clock className="h-5 w-5" /> Exam Preparation Timeline
                                </h4>
                                <div className="space-y-3 pt-2">
                                    <div className="flex justify-between items-center p-3 rounded-lg bg-card border shadow-sm">
                                        <span className="font-semibold text-sm">Total days until exam</span>
                                        <span className="font-black text-primary">{stats?.totalDays} Days</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 rounded-lg bg-card border shadow-sm">
                                        <span className="font-semibold text-sm">Target days for study</span>
                                        <span className="font-black text-orange-600">{stats?.targetDays} Days</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 rounded-lg bg-card border shadow-sm">
                                        <span className="font-semibold text-sm">Buffer/Loss of days (Safety)</span>
                                        <span className="font-black text-destructive">{stats?.lossOfDays} Days</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 rounded-lg bg-card border shadow-sm">
                                        <span className="font-semibold text-sm">Final Revision days</span>
                                        <span className="font-black text-green-600">{stats?.revisionDays} Days</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* --- Daily Schedule List --- */}
                <div className="space-y-4">
                    <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                        <CalendarCheck className="h-6 w-6 text-primary" /> Daily Learning Log
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {studyPlan.schedule.map((task, index) => (
                            <div key={index} className="flex items-center gap-4 p-4 bg-card border rounded-xl hover:shadow-md transition-all">
                                <div className="flex flex-col items-center justify-center bg-primary text-primary-foreground rounded-lg p-2 w-16 text-center shadow-sm">
                                    <span className="text-[10px] font-black uppercase leading-none">{format(new Date(task.date.replace(/-/g, '/')), 'MMM')}</span>
                                    <span className="text-xl font-black leading-none mt-1">{format(new Date(task.date.replace(/-/g, '/')), 'dd')}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest bg-primary/5">{task.subject}</Badge>
                                    </div>
                                    <p className="font-bold text-sm truncate">{task.chapter}</p>
                                </div>
                                <div>
                                    {task.isCompleted ? (
                                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                                    ) : (
                                         <Circle className="h-6 w-6 text-muted-foreground opacity-30" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
