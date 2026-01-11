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
import { z } from 'genkit';
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
  prompt: `You are an encouraging and insightful AI academic advisor named Nova. Your role is to analyze a student's quiz and exam history to answer their questions about their performance.

**Student's Question:** "{{userQuestion}}"

**Performance History:**
Here is the student's full performance history. Analyze it carefully, paying attention to subjects, difficulties, scores, and trends over time.
{{#each quizHistory}}
- Type: {{{quizType}}}, Subject: {{{subject}}}{{#if subCategory}} ({{{subCategory}}}){{/if}}, Difficulty: {{{difficulty}}}, Score: {{{score}}}%
{{/each}}

**Your Task:**
1.  **Analyze the data:** Look for patterns, strengths, and weaknesses. Are they struggling with a particular subject? Do their scores drop at higher difficulties? Are they improving over time?
2.  **Answer the question directly:** Start your response by directly addressing the student's question.
3.  **Provide specific examples:** Use data from their history to support your analysis. For example, "I noticed you scored 90% on your easy Math quiz, but 45% on the hard one. This suggests you have a good grasp of the fundamentals but might need more practice with complex problems."
4.  **Offer actionable advice:** Give concrete, encouraging suggestions for improvement. For instance, "To improve your exam scores, I recommend taking more 'quiz' type assessments on your weaker subjects to build your confidence and knowledge before tackling a full 30-question exam." or "You're doing great in Physics! To take it to the next level, try tackling some 'hard' difficulty quizzes."
5.  **Maintain a positive and conversational tone:** Be supportive and motivating. Your goal is to empower the student, not to discourage them. End with a positive and encouraging note.

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
