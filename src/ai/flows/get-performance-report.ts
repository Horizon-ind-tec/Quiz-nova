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
import { googleAI } from '@genkit-ai/google-genai';
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
  report: z.string().describe("The AI-generated conversational response to the user's question in markdown format."),
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
  model: googleAI.model('gemini-1.5-flash'),
  output: { schema: GetPerformanceReportOutputSchema },
  prompt: `You are Nova, an expert AI academic advisor. Your task is to generate a **brief, conversational performance summary** for a student based on their quiz and exam history and their specific question.

If the user's question contains phrases like "monthly report", "report card for this month", or happens to be asked near the end of the month (e.g., after the 28th), assume they are asking for a monthly report and analyze only the data from the current calendar month. Otherwise, analyze their entire history.

**Student's Question:** "{{userQuestion}}"

**Performance History (all attempts):**
{{#each quizHistory}}
- Type: {{{quizType}}}, Subject: {{{subject}}}{{#if subCategory}} ({{{subCategory}}}){{/if}}, Difficulty: {{{difficulty}}}, Score: {{{score}}}%, Date: {{completedAt}} (Unix Timestamp ms)
{{/each}}

**YOUR TASK: Generate a concise, friendly report in markdown format. The report should be a short summary.**

The report MUST have the following structure:

#### **Performance Snapshot**

*   Start with a friendly, one-sentence summary of their overall performance.
*   Identify their top 1-2 **Strengths** (subjects with highest average scores).
*   Identify their top 1-2 **Areas for Improvement** (subjects with lowest average scores).
*   Provide one or two **Actionable Tips**. Be direct and recommend a specific action, e.g., "Focus on 'easy' Physics quizzes to build confidence." or "Re-read the 'Thermodynamics' chapter."
*   Keep the entire response to about 4-5 bullet points.

**Tone:** Be encouraging, direct, and act as a personal mentor. Keep it short and to the point.
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
    const output = response.output;

    if (!output || !output.report) {
       console.error("AI did not return the expected output format for report.", response);
       // Fallback to raw text if structured output fails
       const rawText = response.text;
       if(rawText) return { report: rawText };
       throw new Error('AI failed to generate a valid report.');
    }
    
    return output;
  }
);
