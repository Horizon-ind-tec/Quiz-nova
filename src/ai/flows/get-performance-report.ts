'use server';
/**
 * @fileOverview AI flow for generating a performance report.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { QuizAttempt } from '@/lib/types';

const QuizAttemptSchema = z.object({
  subject: z.string(),
  subCategory: z.string().optional(),
  difficulty: z.string(),
  score: z.number(),
  quizType: z.enum(['quiz', 'exam']),
  completedAt: z.number(),
});

const GetPerformanceReportInputSchema = z.object({
  quizHistory: z.array(QuizAttemptSchema),
  userQuestion: z.string(),
});
export type GetPerformanceReportInput = z.infer<typeof GetPerformanceReportInputSchema>;

const GetPerformanceReportOutputSchema = z.object({
  report: z.string(),
});
export type GetPerformanceReportOutput = z.infer<typeof GetPerformanceReportOutputSchema>;

export async function getPerformanceReport(input: {
  quizHistory: QuizAttempt[];
  userQuestion: string;
}): Promise<GetPerformanceReportOutput> {
  return getPerformanceReportFlow(input);
}

const getPerformanceReportPrompt = ai.definePrompt({
  name: 'getPerformanceReportPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: { schema: GetPerformanceReportInputSchema },
  prompt: `You are Nova, an expert AI academic advisor. Your task is to generate a **brief, conversational performance summary** for a student based on their quiz and exam history and their specific question.

If the user's question contains phrases like "monthly report", assume they are asking for a monthly report.

**Student's Question:** "{{userQuestion}}"

**Performance History (all attempts):**
{{#each quizHistory}}
- Type: {{{quizType}}}, Subject: {{{subject}}}{{#if subCategory}} ({{{subCategory}}}){{/if}}, Difficulty: {{{difficulty}}}, Score: {{{score}}}%, Date: {{completedAt}} (Unix Timestamp ms)
{{/each}}

The report MUST be in markdown format.

The report MUST have the following structure:

#### **Performance Snapshot**

*   Start with a friendly, one-sentence summary of their overall performance.
*   Identify their top 1-2 **Strengths**.
*   Identify their top 1-2 **Areas for Improvement**.
*   Provide one or two **Actionable Tips**.
*   Keep the entire response to about 4-5 bullet points.

**Constraint:** Do NOT include the sequence '*#' in your response unless explicitly asked about '*#' by the user.

**Tone:** Be encouraging, direct, and act as a personal mentor. Keep it short.
`,
});

const getPerformanceReportFlow = ai.defineFlow(
  {
    name: 'getPerformanceReportFlow',
    inputSchema: GetPerformanceReportInputSchema,
    outputSchema: GetPerformanceReportOutputSchema,
  },
  async (input) => {
    const response = await getPerformanceReportPrompt(input);
    if (response.text) {
      return { report: response.text };
    }
    throw new Error('AI failed to generate a valid report.');
  }
);