'use client';

import { useLocalStorage } from '@/hooks/use-local-storage';
import type { QuizAttempt } from '@/lib/types';
import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function PerformancePage() {
  const [quizHistory] = useLocalStorage<QuizAttempt[]>('quizHistory', []);

  const sortedHistory = quizHistory.slice().sort((a, b) => b.completedAt - a.completedAt);

  const getScoreVariant = (score: number) => {
    if (score < 40) return 'destructive';
    if (score < 70) return 'secondary';
    return 'default';
  };

  return (
    <div className="flex flex-col">
      <Header title="Performance History" />
      <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>All Quiz Attempts</CardTitle>
            <CardDescription>A complete log of all your quizzes.</CardDescription>
          </CardHeader>
          <CardContent>
            {sortedHistory.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Board</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedHistory.map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell className="font-medium">{attempt.subject}</TableCell>
                      <TableCell>{attempt.subCategory || '-'}</TableCell>
                      <TableCell>{attempt.class}</TableCell>
                      <TableCell>{attempt.board}</TableCell>
                      <TableCell className="capitalize">{attempt.difficulty}</TableCell>
                      <TableCell>{format(new Date(attempt.completedAt), 'PPp')}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={getScoreVariant(attempt.score)}>{attempt.score}%</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex h-48 items-center justify-center">
                <p className="text-muted-foreground">Your quiz history is empty. Take a quiz to get started!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
