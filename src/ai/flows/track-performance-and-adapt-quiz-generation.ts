'use server';
/**
 * @fileOverview This file defines a Genkit flow to track user quiz performance.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TrackPerformanceAndAdaptQuizGenerationInputSchema = z.object({
  userId: z.string(),
  quizResults: z.array(
    z.object({
      subject: z.string(),
      score: z.number(),
      difficulty: z.string(),
    })
  ),
  userPreferences: z.object({
    class: z.string(),
    board: z.string(),
  }),
  currentDifficulty: z.string().optional(),
});
export type TrackPerformanceAndAdaptQuizGenerationInput = z.infer<typeof TrackPerformanceAndAdaptQuizGenerationInputSchema>;

const TrackPerformanceAndAdaptQuizGenerationOutputSchema = z.object({
  newDifficulty: z.string(),
  focusAreas: z.array(z.string()),
  explanation: z.string(),
});
export type TrackPerformanceAndAdaptQuizGenerationOutput = z.infer<typeof TrackPerformanceAndAdaptQuizGenerationOutputSchema>;

export async function trackPerformanceAndAdaptQuizGeneration(
  input: TrackPerformanceAndAdaptQuizGenerationInput
): Promise<TrackPerformanceAndAdaptQuizGenerationOutput> {
  return trackPerformanceAndAdaptQuizGenerationFlow(input);
}

const adaptQuizPrompt = ai.definePrompt({
  name: 'adaptQuizPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: { schema: TrackPerformanceAndAdaptQuizGenerationInputSchema },
  prompt: `You are an AI quiz adaptation expert. Analyze the student's quiz performance and determine how to adjust future quiz generation.

  User ID: {{{userId}}}
  User Class: {{{userPreferences.class}}}
  User Board: {{{userPreferences.board}}}
  Current Difficulty: {{{currentDifficulty}}}

  Quiz Results:
  {{#each quizResults}}
  - Subject: {{{subject}}}, Score: {{{score}}}, Difficulty: {{{difficulty}}}
  {{/each}}

  Based on this data, recommend a new difficulty level and specific focus areas for future quizzes.
  Return your response as a valid JSON object with: "newDifficulty", "focusAreas" (array), and "explanation".
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

const trackPerformanceAndAdaptQuizGenerationFlow = ai.defineFlow(
  {
    name: 'trackPerformanceAndAdaptQuizGenerationFlow',
    inputSchema: TrackPerformanceAndAdaptQuizGenerationInputSchema,
    outputSchema: TrackPerformanceAndAdaptQuizGenerationOutputSchema,
  },
  async input => {
    const response = await adaptQuizPrompt(input);
    const extracted = extractJson(response.text);

    if (extracted && extracted.newDifficulty) {
      return extracted as TrackPerformanceAndAdaptQuizGenerationOutput;
    }

    throw new Error("The AI failed to adapt the quiz generation.");
  }
);
