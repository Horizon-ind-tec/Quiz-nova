'use server';
/**
 * @fileOverview AI flow for generating a quiz from scanned notes or PDFs.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ScanToQuizInputSchema = z.object({
  mediaDataUri: z.string().describe("A photo or PDF of the notes, as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  class: z.string().optional(),
  subject: z.string().optional(),
  totalMarks: z.coerce.number(),
  numberOfQuestions: z.coerce.number(),
});
export type ScanToQuizInput = z.infer<typeof ScanToQuizInputSchema>;

const MCQSchema = z.object({
  type: z.literal('mcq'),
  question: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.string(),
  explanation: z.string(),
  marks: z.number(),
});

const ScanToQuizOutputSchema = z.object({
  questions: z.array(MCQSchema),
});
export type ScanToQuizOutput = z.infer<typeof ScanToQuizOutputSchema>;

export async function scanToQuiz(input: ScanToQuizInput): Promise<ScanToQuizOutput> {
  return scanToQuizFlow(input);
}

const scanToQuizPrompt = ai.definePrompt({
  name: 'scanToQuizPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: { schema: ScanToQuizInputSchema },
  prompt: `You are Nova, the AI Quiz Generator. 

Your task is to analyze the provided image or PDF (notes, textbook, handwritten sheets) and create a challenging quiz based on its contents.

**CONTEXT:**
- Class: {{#if class}}{{class}}{{else}}General Student{{/if}}
- Subject: {{#if subject}}{{subject}}{{else}}Extracted from content{{/if}}

**CONSTRAINTS:**
- Target Number of Questions: {{numberOfQuestions}}
- Target Total Marks: {{totalMarks}}
- Format: JSON only.
- Question Type: ONLY Multiple Choice Questions (MCQs).

**MEDIA CONTENT:**
{{media url=mediaDataUri}}

**INSTRUCTIONS:**
1. Read the provided media carefully.
2. Identify the most important educational concepts.
3. Generate EXACTLY {{numberOfQuestions}} MCQ questions that test these concepts.
4. Distribute {{totalMarks}} marks across the questions.
5. Provide a detailed explanation for the correct answer.
6. Options MUST be plain text (no "A)", "1.", etc.).

Return a JSON object with:
{
  "questions": [
    {
      "type": "mcq",
      "question": "...",
      "options": ["...", "...", "...", "..."],
      "correctAnswer": "...",
      "explanation": "...",
      "marks": 4
    }
  ]
}
`,
});

const scanToQuizFlow = ai.defineFlow(
  {
    name: 'scanToQuizFlow',
    inputSchema: ScanToQuizInputSchema,
    outputSchema: ScanToQuizOutputSchema,
  },
  async (input) => {
    const response = await scanToQuizPrompt(input);
    const text = response.text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (e) {
        throw new Error("AI output was invalid JSON.");
      }
    }
    throw new Error("AI failed to extract quiz data from the scan.");
  }
);
