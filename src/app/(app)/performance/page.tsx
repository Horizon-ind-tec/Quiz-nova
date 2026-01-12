
'use client';

import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import type { QuizAttempt } from '@/lib/types';
import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { collection, query, orderBy } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

export default function PerformancePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  
  const quizHistoryQuery = useMemoFirebase(
    () =>
      firestore && user
        ? query(collection(firestore, 'users', user.uid, 'quiz_results'), orderBy('completedAt', 'desc'))
        : null,
    [firestore, user]
  );
  
  const { data: sortedHistory, isLoading: historyLoading } = useCollection<QuizAttempt>(quizHistoryQuery);

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
            {historyLoading ? (
              <div className="flex h-48 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : sortedHistory && sortedHistory.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead className="hidden sm:table-cell">Category</TableHead>
                    <TableHead className="hidden md:table-cell">Class</TableHead>
                    <TableHead className="hidden lg:table-cell">Board</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedHistory.map((attempt) => (
                    <TableRow key={attempt.id}>
                      <TableCell className="font-medium">{attempt.subject}</TableCell>
                      <TableCell className="hidden sm:table-cell">{attempt.subCategory || '-'}</TableCell>
                      <TableCell className="hidden md:table-cell">{attempt.class}</TableCell>
                      <TableCell className="hidden lg:table-cell">{attempt.board}</TableCell>
                      <TableCell className="capitalize">{attempt.difficulty}</TableCell>
                      <TableCell>{format(new Date(attempt.completedAt), 'PP')}</TableCell>
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
