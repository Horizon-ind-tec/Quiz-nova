'use server';
/**
 * @fileOverview AI flow for the Exam and Homework Helper.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const HomeworkHelperInputSchema = z.object({
  question: z.string().describe('The homework or exam question to help with.'),
  context: z.string().optional().describe('Any additional context (e.g., subject, grade level).'),
});
export type HomeworkHelperInput = z.infer<typeof HomeworkHelperInputSchema>;

const HomeworkHelperOutputSchema = z.object({
  explanation: z.string().describe('The step-by-step explanation and answer.'),
});
export type HomeworkHelperOutput = z.infer<typeof HomeworkHelperOutputSchema>;

export async function homeworkHelper(input: HomeworkHelperInput): Promise<HomeworkHelperOutput> {
  return homeworkHelperFlow(input);
}

const homeworkHelperPrompt = ai.definePrompt({
  name: 'homeworkHelperPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: { schema: HomeworkHelperInputSchema },
  prompt: `You are Nova, an expert academic tutor. Your goal is to help students understand their homework and exam questions.

**Student's Question:**
"{{{question}}}"

{{#if context}}**Context/Subject:** {{{context}}}{{/if}}

**Instructions:**
1. Provide a clear, step-by-step explanation of how to arrive at the answer.
2. Don't just give the answer; teach the underlying concept.
3. Use a friendly, encouraging, and mentoring tone.
4. Keep the formatting clean using Markdown (bolding, lists, etc.).
5. If the question is ambiguous, ask for clarification or provide the most likely interpretation.
6. **Constraint:** Do NOT use the sequence '*#' in your response unless explicitly asked about '*#' by the student.

Response Format:
Return your response as a valid JSON object with a single key "explanation".
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

const homeworkHelperFlow = ai.defineFlow(
  {
    name: 'homeworkHelperFlow',
    inputSchema: HomeworkHelperInputSchema,
    outputSchema: HomeworkHelperOutputSchema,
  },
  async (input) => {
    const response = await homeworkHelperPrompt(input);
    const extracted = extractJson(response.text);

    if (extracted && extracted.explanation) {
      return extracted as HomeworkHelperOutput;
    }
    
    throw new Error('AI failed to provide a helpful explanation.');
  }
);