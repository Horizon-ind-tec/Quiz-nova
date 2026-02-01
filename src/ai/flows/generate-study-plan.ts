'use server';
/**
 * @fileOverview AI flow for generating a personalized study plan.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { format } from 'date-fns';

const GenerateStudyPlanInputSchema = z.object({
  examDate: z.string().describe("The final exam date in YYYY-MM-DD format."),
  subjects: z.array(z.object({
    name: z.string(),
    chapters: z.array(z.string()),
  })),
  startDate: z.string(),
});
export type GenerateStudyPlanInput = z.infer<typeof GenerateStudyPlanInputSchema>;

const StudyTaskSchema = z.object({
  date: z.string(),
  subject: z.string(),
  chapter: z.string(),
});

const GenerateStudyPlanOutputSchema = z.object({
  schedule: z.array(StudyTaskSchema),
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
  model: 'googleai/gemini-2.5-flash',
  input: { schema: GenerateStudyPlanInputSchema },
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
  3.  Try to alternate between different subjects to keep the studying engaging.
  4.  Ensure every single chapter provided is included in the schedule exactly once.
  5.  The final output must be a valid JSON object with a "schedule" array. Each item in the array must have "date", "subject", and "chapter" fields.
  `,
});

function extractJson(text: string) {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      return null;
    }
  }
  return null;
}

const generateStudyPlanFlow = ai.defineFlow(
  {
    name: 'generateStudyPlanFlow',
    inputSchema: GenerateStudyPlanInputSchema,
    outputSchema: GenerateStudyPlanOutputSchema,
  },
  async (input) => {
    const response = await generateStudyPlanPrompt(input);
    const extracted = extractJson(response.text);

    if (extracted && Array.isArray(extracted.schedule)) {
      return extracted as GenerateStudyPlanOutput;
    }
    
    throw new Error('AI failed to generate a valid study plan.');
  }
);
