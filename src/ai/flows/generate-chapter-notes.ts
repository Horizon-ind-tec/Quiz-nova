
'use server';
/**
 * @fileOverview AI flow for generating comprehensive chapter notes.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateChapterNotesInputSchema = z.object({
  class: z.string().describe('The class of the student.'),
  subject: z.string().describe('The subject of the notes.'),
  chapter: z.string().describe('The specific chapter name or topic.'),
  board: z.string().optional().describe('The educational board (e.g., CBSE, ICSE).'),
});
export type GenerateChapterNotesInput = z.infer<typeof GenerateChapterNotesInputSchema>;

const GenerateChapterNotesOutputSchema = z.object({
  notes: z.string().describe('The generated chapter notes in markdown format.'),
});
export type GenerateChapterNotesOutput = z.infer<typeof GenerateChapterNotesOutputSchema>;

export async function generateChapterNotes(
  input: GenerateChapterNotesInput
): Promise<GenerateChapterNotesOutput> {
  return generateChapterNotesFlow(input);
}

const generateChapterNotesPrompt = ai.definePrompt({
  name: 'generateChapterNotesPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: { schema: GenerateChapterNotesInputSchema },
  prompt: `You are a highly experienced subject teacher and notes creator. 

Your task is to generate comprehensive, easy-to-understand, and well-structured study notes for:
- **Class**: {{{class}}}
- **Subject**: {{{subject}}}
- **Chapter**: {{{chapter}}}
{{#if board}}- **Board**: {{{board}}}{{/if}}

**STRUCTURE GUIDELINES:**
1.  **Introduction**: A brief overview of the chapter.
2.  **Key Concepts**: Detailed explanations of the most important topics. Use bullet points for readability.
3.  **Important Definitions**: Clearly defined terms and terminology.
4.  **Formulae/Key Points**: If applicable, a section for important formulas or "Points to Remember."
5.  **Summary**: A quick wrap-up of the chapter essentials.

**FORMATTING INSTRUCTIONS:**
- Use Markdown for everything.
- Use # for the main title, ## for sections, and ### for sub-sections.
- Use **bold** for key terms.
- Use lists (- or 1.) for steps or points.
- Keep the language professional yet accessible for a student of this class level.

**CRITICAL CONSTRAINT:**
- Do NOT use the character sequence '*#' in your output unless explicitly asked about '*#' in the user request.

Now, generate the study notes.
`,
});

const generateChapterNotesFlow = ai.defineFlow(
  {
    name: 'generateChapterNotesFlow',
    inputSchema: GenerateChapterNotesInputSchema,
    outputSchema: GenerateChapterNotesOutputSchema,
  },
  async (input) => {
    const response = await generateChapterNotesPrompt(input);
    if (response.text) {
      return { notes: response.text };
    }
    throw new Error('AI failed to generate notes. Please try again.');
  }
);
