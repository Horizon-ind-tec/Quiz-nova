
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
  model: googleAI.model('gemini-2.5-flash'),
  input: { schema: GetPerformanceReportInputSchema },
  prompt: `You are Nova, an expert AI academic advisor. Your task is to generate a comprehensive, well-structured performance report for a student based on their quiz and exam history and their specific question.

If the user's question contains phrases like "monthly report", "report card for this month", or happens to be asked near the end of the month (e.g., after the 28th), assume they are asking for a monthly report and analyze only the data from the current calendar month. Otherwise, analyze their entire history.

**Student's Question:** "{{userQuestion}}"

**Performance History (all attempts):**
{{#each quizHistory}}
- Type: {{{quizType}}}, Subject: {{{subject}}}{{#if subCategory}} ({{{subCategory}}}){{/if}}, Difficulty: {{{difficulty}}}, Score: {{{score}}}%, Date: {{completedAt}} (Unix Timestamp ms)
{{/each}}

**YOUR TASK: Generate a detailed report in markdown format. The report should be structured like a professional school report card, providing deep insights.**

The report MUST have the following structure:

### **Student Performance Report**

**Analysis for: User**
**Date: [Generate a current date, e.g., "October 30, 2023"]**

---

#### **Overall Performance Summary**
*   Provide a brief, encouraging paragraph summarizing the student's performance based on their question and the provided history.
*   Mention trends, like improvement over time or consistency in certain areas.

---

#### **Subject-wise Grade Analysis**
*   For each subject in the history, calculate the average score.
*   Assign a letter grade based on this average: 90-100: A+, 80-89: A, 70-79: B+, 65-69: B, 55-64: C, below 55: F.
*   Present this in a list. Include a short, insightful comment for each subject.

**Example:**
*   **Mathematics:** Grade A (Average Score: 88%) - Excellent grasp of core concepts.
*   **Physics:** Grade C (Average Score: 62%) - Shows potential but needs more practice on numerical problems.
*   **History:** Grade B+ (Average Score: 78%) - Good understanding of key events.

---

#### **Key Insights**
*   **Strengths:** List 2-3 specific subjects or topics where the student is excelling.
*   **Areas for Improvement:** List 2-3 specific subjects or topics where the student is struggling the most. Be very specific (e.g., "Thermodynamics in Physics" or "Algebra in Mathematics").

---

#### **Your Path to 100% Mastery**
This is the most important section. Provide clear, actionable advice to help the student prepare for their real-life exams.
*   **Strategic Advice:** Give concrete steps for improvement. For example: "To master Physics, first re-read the 'Thermodynamics' chapter. Then, complete two 'easy' difficulty quizzes on that topic to build a foundation."
*   **Practice Plan:** Recommend a number of practice tests/quizzes for their weak subjects. For example: "For the next two weeks, I recommend you take 3 Physics quizzes and 2 Algebra quizzes."
*   **Target Scores:** Set clear goals for these practice tests. For example: "In these practice quizzes, you should aim for a score of at least **85%** to ensure you are ready for your final exams."
*   **Final Goal:** Conclude with an encouraging statement about how this plan will lead to success.

**Tone:** Be encouraging, insightful, and act as a personal mentor. The goal is to motivate the student.

Generate the entire response as a single markdown string in the 'report' field of the JSON output.
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
    const text = response.text;
    const cleanedText = text.replace(/^```json\s*|```\s*$/g, '').trim();

    try {
      return JSON.parse(cleanedText);
    } catch (e) {
      console.error('Failed to parse JSON from model output for report:', cleanedText);
      // Fallback: if parsing fails, wrap the raw text in the expected object structure.
      return { report: text };
    }
  }
);
