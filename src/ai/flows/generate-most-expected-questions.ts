'use server';
/**
 * @fileOverview AI flow for generating "Most Expected Questions" for exams.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateMostExpectedQuestionsInputSchema = z.object({
  class: z.string(),
  board: z.string(),
  subject: z.string(),
  chapter: z.string(),
});
export type GenerateMostExpectedQuestionsInput = z.infer<typeof GenerateMostExpectedQuestionsInputSchema>;

const GenerateMostExpectedQuestionsOutputSchema = z.object({
  questions: z.string(),
});
export type GenerateMostExpectedQuestionsOutput = z.infer<typeof GenerateMostExpectedQuestionsOutputSchema>;

export async function generateMostExpectedQuestions(
  input: GenerateMostExpectedQuestionsInput
): Promise<GenerateMostExpectedQuestionsOutput> {
  return generateMostExpectedQuestionsFlow(input);
}

const generateMostExpectedQuestionsPrompt = ai.definePrompt({
  name: 'generateMostExpectedQuestionsPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: { schema: GenerateMostExpectedQuestionsInputSchema },
  prompt: `You are an experienced subject teacher and board-exam question paper setter.

Your task is to generate “Most Expected Questions” with solutions for the given:
- Class: {{{class}}}
- Board: {{{board}}}
- Subject: {{{subject}}}
- Chapter: {{{chapter}}}
- Latest syllabus guidelines

Think like a real examiner, not a student.

Follow this thinking process internally:
1. Identify the most important and usually asked concepts from the chapter.
2. Analyze past exam patterns, chapter depth, and marks weightage logic.
3. Apply teacher psychology:
   - Include easy, medium, and one high-thinking question
   - Prefer core concepts, derivations, definitions, and application-based questions
   - Avoid rare, low-probability subtopics
4. Frame questions exactly in board-exam style language.
5. For each question, provide a concise solution.

Output format:
- Structure the entire response as a single block of markdown text.
- Use markdown headings for mark sections (e.g., "### 1–2 Mark Questions").
- For each question:
    - Present the question using a markdown list with a hyphen (e.g., "- The question text...").
    - If it's an MCQ, list the options.
    - Provide the answer clearly, like \`**Ans.** (2)\`.
    - Provide a brief solution, starting with \`**Sol.**\`.
- Limit the list to only the most important and high-probability questions.
- Do NOT mention percentages, guarantees, or paper prediction.
- Do NOT claim exact paper matching.
- Do NOT use the character sequence '*#' unless explicitly requested in context.

End with a short note in markdown bold:
**This list is generated using examiner-style analysis and exam trends for effective preparation.**

Now generate the Most Expected Questions with solutions.
`,
});

const generateMostExpectedQuestionsFlow = ai.defineFlow(
  {
    name: 'generateMostExpectedQuestionsFlow',
    inputSchema: GenerateMostExpectedQuestionsInputSchema,
    outputSchema: GenerateMostExpectedQuestionsOutputSchema,
  },
  async (input) => {
    const response = await generateMostExpectedQuestionsPrompt(input);
    if (response.text) {
      return { questions: response.text };
    }
    throw new Error('AI failed to generate a valid list of questions.');
  }
);