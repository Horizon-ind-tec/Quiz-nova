'use server';
/**
 * @fileOverview AI flow for generating a personalized study plan.
 *
 * This file defines a Genkit flow that takes an exam date, a list of subjects with chapters,
 * and generates a day-by-day study schedule to cover all topics before the exam.
 *
 * @exports generateStudyPlan - The main function to generate a study plan.
 * @exports GenerateStudyPlanInput - The input type for the function.
 * @exports GenerateStudyPlanOutput - The output type for the function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';
import { format } from 'date-fns';

const GenerateStudyPlanInputSchema = z.object({
  examDate: z.string().describe("The final exam date in YYYY-MM-DD format."),
  subjects: z.array(z.object({
    name: z.string().describe("The name of the subject."),
    chapters: z.array(z.string()).describe("The list of chapters to study for this subject."),
  })).describe("The list of subjects and chapters to include in the plan."),
  startDate: z.string().describe("The start date for the plan in YYYY-MM-DD format (usually today)."),
});
export type GenerateStudyPlanInput = z.infer<typeof GenerateStudyPlanInputSchema>;

const StudyTaskSchema = z.object({
  date: z.string().describe("The date for this study task in YYYY-MM-DD format."),
  subject: z.string().describe("The subject to study on this date."),
  chapter: z.string().describe("The specific chapter to study."),
});

const GenerateStudyPlanOutputSchema = z.object({
  schedule: z.array(StudyTaskSchema).describe("The day-by-day study schedule."),
});
export type GenerateStudyPlanOutput = z.infer<typeof GenerateStudyPlanOutputSchema>;

export async function generateStudyPlan(
  input: { examDate: Date; subjects: { name: string; chapters: string[] }[] }
): Promise<GenerateStudyPlanOutput> {
  const flowInput: GenerateStudyPlanInput = {
    examDate: format(input.examDate, 'yyyy-MM-dd'),
    subjects: input.subjects,
    startDate: format(new Date(), 'yyyy-MM-dd'),
  };
  return generateStudyPlanFlow(flowInput);
}

const generateStudyPlanPrompt = ai.definePrompt({
  name: 'generateStudyPlanPrompt',
  model: googleAI.model('gemini-1.5-flash'),
  output: { schema: GenerateStudyPlanOutputSchema },
  prompt: `You are an expert academic planner. Your task is to create a realistic, balanced, and effective study schedule for a student.

  **Student's Goal:**
  - Start Date: {{startDate}}
  - Exam Date: {{examDate}}
  - Subjects and Chapters to cover:
    {{#each subjects}}
    - **{{name}}**: {{#each chapters}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
    {{/each}}

  **Your Instructions:**
  1.  Create a day-by-day schedule starting from the 'Start Date' and ending a day or two before the 'Exam Date' to leave time for revision.
  2.  Distribute the chapters evenly across the available days. Avoid overloading any single day.
  3.  Try to alternate between different subjects to keep the studying engaging. For example, don't schedule the same subject for more than two consecutive days if possible.
  4.  Ensure every single chapter provided is included in the schedule exactly once.
  5.  The final output must be a JSON object that strictly follows the provided schema. Do not include any extra text or explanations.
  `,
});

const generateStudyPlanFlow = ai.defineFlow(
  {
    name: 'generateStudyPlanFlow',
    inputSchema: GenerateStudyPlanInputSchema,
    outputSchema: GenerateStudyPlanOutputSchema,
  },
  async (input) => {
    const response = await generateStudyPlanPrompt(input);
    const output = response.output;

    if (!output?.schedule) {
      console.error("AI did not return the expected schedule format.", response);
      throw new Error('AI failed to generate a valid study plan.');
    }
    
    return output;
  }
);
