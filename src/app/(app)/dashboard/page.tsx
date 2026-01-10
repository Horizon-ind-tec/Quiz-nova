'use client';

import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/header';
import { PerformanceChart } from '@/components/performance-chart';
import { RecentQuizzes } from '@/components/recent-quizzes';

export default function Dashboard() {
  return (
    <div className="flex flex-col">
      <Header title="Dashboard" />
      <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Welcome to QuizNova!</h2>
          <div className="flex items-center space-x-2">
            <Button asChild>
              <Link href="/quiz/create">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create New Quiz
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>Your recent quiz scores.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <PerformanceChart />
            </CardContent>
          </Card>
          <Card className="col-span-4 lg:col-span-3">
            <CardHeader>
              <CardTitle>Recent Quizzes</CardTitle>
              <CardDescription>A log of your most recent quiz attempts.</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentQuizzes />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
