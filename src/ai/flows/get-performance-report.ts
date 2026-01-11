'use server';
/**
 * @fileOverview AI flow for generating a performance report based on user's quiz history.
 *
 * This file defines a Genkit flow that takes a user's quiz history and a specific question,
 * then uses an LLM to generate a conversational, insightful report analyzing their performance
 * and providing advice.
 *
 * @exports getPerformanceReport - The main function to get a performance report.
 * @exports GetPerformanceReportInput - The input type for the function.
 * @exports GetPerformanceReportOutput - The output type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { QuizAttempt } from '@/lib/types';

// Define the schema for a single quiz attempt for the AI
const QuizAttemptSchema = z.object({
  subject: z.string(),
  subCategory: z.string().optional(),
  difficulty: z.string(),
  score: z.number(),
  quizType: z.enum(['quiz', 'exam']),
  completedAt: z.number(),
});

const GetPerformanceReportInputSchema = z.object({
  quizHistory: z.array(QuizAttemptSchema).describe("The user's full history of quiz and exam attempts."),
  userQuestion: z.string().describe("The user's question about their performance."),
});
export type GetPerformanceReportInput = z.infer<typeof GetPerformanceReportInputSchema>;

const GetPerformanceReportOutputSchema = z.object({
  report: z.string().describe("The AI-generated conversational response to the user's question."),
});
export type GetPerformanceReportOutput = z.infer<typeof GetPerformanceReportOutputSchema>;

// Main function to initiate the flow
export async function getPerformanceReport(input: {
  quizHistory: QuizAttempt[];
  userQuestion: string;
}): Promise<GetPerformanceReportOutput> {
  return getPerformanceReportFlow(input);
}

const getPerformanceReportPrompt = ai.definePrompt({
  name: 'getPerformanceReportPrompt',
  input: { schema: GetPerformanceReportInputSchema },
  output: { schema: GetPerformanceReportOutputSchema },
  prompt: `You are an encouraging and insightful AI academic advisor named Nova. Your role is to answer a student's questions by analyzing their quiz and exam history.

**IMPORTANT:** Your answers must be **brief, meaningful, and easy to understand**. Get straight to the point. Use bullet points to make your advice clear and actionable.

**Student's Question:** "{{userQuestion}}"

**Performance History:**
{{#each quizHistory}}
- Type: {{{quizType}}}, Subject: {{{subject}}}{{#if subCategory}} ({{{subCategory}}}){{/if}}, Difficulty: {{{difficulty}}}, Score: {{{score}}}%
{{/each}}

**Your Task:**
1.  **Analyze the data** to find the most important patterns, strengths, or weaknesses related to the user's question.
2.  **Answer the question directly and concisely.**
3.  **Provide short, actionable advice** using bullet points.
4.  **Maintain a positive and supportive tone.**

Generate a single, coherent response in the 'report' field of the JSON output.
`,
});

const getPerformanceReportFlow = ai.defineFlow(
  {
    name: 'getPerformanceReportFlow',
    inputSchema: GetPerformanceReportInputSchema,
    outputSchema: GetPerformanceReportOutputSchema,
  },
  async (input) => {
    const { output } = await getPerformanceReportPrompt(input);
    return output!;
  }
);
