'use server';
/**
 * @fileOverview AI flow for the QuizNova Support Bot.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SupportBotInputSchema = z.object({
  message: z.string().describe('The user\'s message to support.'),
  userName: z.string(),
  userEmail: z.string(),
});
export type SupportBotInput = z.infer<typeof SupportBotInputSchema>;

const SupportBotOutputSchema = z.object({
  response: z.string().describe('The helpful response from the support bot.'),
  isRefundRequest: z.boolean().describe('Whether the user is explicitly asking for a refund or payment return.'),
  refundReason: z.string().optional().describe('The extracted reason for the refund if applicable.'),
});
export type SupportBotOutput = z.infer<typeof SupportBotOutputSchema>;

export async function supportBot(input: SupportBotInput): Promise<SupportBotOutput> {
  return supportBotFlow(input);
}

const supportBotPrompt = ai.definePrompt({
  name: 'supportBotPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: { schema: SupportBotInputSchema },
  prompt: `You are Nova Support, the official AI assistant for QuizNova.

QuizNova is an AI-powered learning ecosystem with features like:
- **Homework Helper**: Solves tough questions via text or images.
- **Exam Grader**: Grades handwritten answer sheets using AI.
- **Quiz Generator**: Creates custom quizzes for subjects and boards (CBSE, ICSE).
- **Study Planner**: Generates roadmaps for upcoming exams.
- **Chapter Notes**: High-efficiency revision material.

**USER INFO:**
- Name: {{{userName}}}
- Email: {{{userEmail}}}

**USER MESSAGE:**
"{{{message}}}"

**YOUR MISSION:**
1. Be helpful, professional, and friendly.
2. Answer questions about how QuizNova works.
3. **CRITICAL**: If the user asks for a **refund**, **payment return**, or says they **paid by mistake**, you MUST:
   - Acknowledge their request politely.
   - Inform them that you have notified the admin for manual verification.
   - Set the 'isRefundRequest' flag to true in your JSON output.
   - Extract the 'refundReason' from their message.

**JSON FORMAT REQUIRED:**
Return ONLY a JSON object with:
- "response": Your text answer to the user.
- "isRefundRequest": boolean.
- "refundReason": string (optional).

**Constraint:** Do NOT use the sequence '*#' in your response.
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

const supportBotFlow = ai.defineFlow(
  {
    name: 'supportBotFlow',
    inputSchema: SupportBotInputSchema,
    outputSchema: SupportBotOutputSchema,
  },
  async (input) => {
    const response = await supportBotPrompt(input);
    const extracted = extractJson(response.text);

    if (extracted && typeof extracted.response === 'string') {
      return extracted as SupportBotOutput;
    }
    
    throw new Error('Support bot failed to process the request.');
  }
);
