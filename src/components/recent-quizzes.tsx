'use client';

import type { QuizAttempt } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

interface RecentQuizzesProps {
  data: QuizAttempt[];
}

export function RecentQuizzes({ data }: RecentQuizzesProps) {
  const recentAttempts = data
    .slice()
    .sort((a, b) => b.completedAt - a.completedAt)
    .slice(0, 5);

  if (recentAttempts.length === 0) {
    return (
      <div className="flex h-[350px] items-center justify-center">
        <p className="text-muted-foreground">Your recent attempts will appear here.</p>
      </div>
    );
  }

  const getScoreVariant = (score: number) => {
    if (score < 40) return 'destructive';
    if (score < 70) return 'secondary';
    return 'default';
  };

  return (
    <ScrollArea className="h-[350px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subject</TableHead>
            <TableHead>Difficulty</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recentAttempts.map((attempt) => (
            <TableRow key={attempt.id}>
              <TableCell className="font-medium">{attempt.subject}</TableCell>
              <TableCell className="capitalize">{attempt.difficulty}</TableCell>
              <TableCell>{format(new Date(attempt.completedAt), 'PP')}</TableCell>
              <TableCell className="text-right">
                <Badge variant={getScoreVariant(attempt.score)}>{attempt.score}%</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
