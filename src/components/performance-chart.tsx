'use client';

import type { QuizAttempt } from '@/lib/types';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { format } from 'date-fns';

const chartConfig = {
  score: {
    label: 'Score',
    color: 'hsl(var(--chart-1))',
  },
};

interface PerformanceChartProps {
  data: QuizAttempt[];
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  const chartData = data
    .slice() // Create a copy to avoid mutating the original array
    .sort((a, b) => a.completedAt - b.completedAt) // Sort by completion time
    .slice(-10) // Get the last 10 attempts
    .map(attempt => ({
      date: format(new Date(attempt.completedAt), 'MMM d'),
      score: attempt.score,
    }));

  if (data.length === 0) {
    return (
      <div className="flex h-[350px] w-full items-center justify-center">
        <p className="text-muted-foreground">Take a quiz or exam to see your performance chart.</p>
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[350px] w-full">
      <BarChart
        accessibilityLayer
        data={chartData}
        margin={{
          top: 5,
          right: 20,
          left: -10,
          bottom: 5,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => value}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          domain={[0, 100]}
        />
        <Tooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <Bar
          dataKey="score"
          fill="var(--color-score)"
          radius={4}
        />
      </BarChart>
    </ChartContainer>
  );
}
