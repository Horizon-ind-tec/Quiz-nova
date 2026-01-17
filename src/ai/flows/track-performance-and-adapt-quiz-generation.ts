'use server';
/**
 * @fileOverview This file defines a Genkit flow to track user quiz performance and adapt future quiz generation accordingly.
 *
 * - trackPerformanceAndAdaptQuizGeneration - The main function to initiate the flow.
 * - TrackPerformanceAndAdaptQuizGenerationInput - The input type for the flow, including quiz results and user preferences.
 * - TrackPerformanceAndAdaptQuizGenerationOutput - The output type for the flow, providing updated quiz generation parameters.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input schema for the flow
const TrackPerformanceAndAdaptQuizGenerationInputSchema = z.object({
  userId: z.string().describe('The unique identifier of the user.'),
  quizResults: z.array(
    z.object({
      subject: z.string().describe('The subject of the quiz.'),
      score: z.number().describe('The score obtained in the quiz (0-100).'),
      difficulty: z.string().describe('The difficulty level of the quiz (e.g., easy, medium, hard).'),
    })
  ).describe('An array of quiz results for the user.'),
  userPreferences: z.object({
    class: z.string().describe('The class of the user.'),
    board: z.string().describe('The educational board of the user.'),
  }).describe('User preferences for quiz generation.'),
  currentDifficulty: z.string().optional().describe('The current difficulty level for quiz generation.'),
});
export type TrackPerformanceAndAdaptQuizGenerationInput = z.infer<typeof TrackPerformanceAndAdaptQuizGenerationInputSchema>;

// Output schema for the flow
const TrackPerformanceAndAdaptQuizGenerationOutputSchema = z.object({
  newDifficulty: z.string().describe('The adjusted difficulty level for future quiz generation.'),
  focusAreas: z.array(z.string()).describe('Specific areas or subjects to focus on in future quizzes.'),
  explanation: z.string().describe('An explanation of why these adjustments were made.'),
});
export type TrackPerformanceAndAdaptQuizGenerationOutput = z.infer<typeof TrackPerformanceAndAdaptQuizGenerationOutputSchema>;

// Main function to initiate the flow
export async function trackPerformanceAndAdaptQuizGeneration(
  input: TrackPerformanceAndAdaptQuizGenerationInput
): Promise<TrackPerformanceAndAdaptQuizGenerationOutput> {
  return trackPerformanceAndAdaptQuizGenerationFlow(input);
}

const adaptQuizPrompt = ai.definePrompt({
  name: 'adaptQuizPrompt',
  model: 'googleai/gemini-1.5-pro-latest',
  input: { schema: TrackPerformanceAndAdaptQuizGenerationInputSchema },
  output: { schema: TrackPerformanceAndAdaptQuizGenerationOutputSchema },
  prompt: `You are an AI quiz adaptation expert. Analyze the student's quiz performance and determine how to adjust future quiz generation to focus on their weaker areas.

  User ID: {{{userId}}}
  User Class: {{{userPreferences.class}}}
  User Board: {{{userPreferences.board}}}
  Current Difficulty: {{{currentDifficulty}}}

  Quiz Results:
  {{#each quizResults}}
  - Subject: {{{subject}}}, Score: {{{score}}}, Difficulty: {{{difficulty}}}
  {{/each}}

  Based on this data, recommend a new difficulty level and specific focus areas for future quizzes.
  Explain why you are recommending these adjustments. Ensure the explanation is clear and concise.

  Output in the following format:
  {
    "newDifficulty": "<new difficulty level>",
    "focusAreas": ["<area 1>", "<area 2>", ...],
    "explanation": "<explanation of adjustments>"
  }`,
});

// Genkit flow definition
const trackPerformanceAndAdaptQuizGenerationFlow = ai.defineFlow(
  {
    name: 'trackPerformanceAndAdaptQuizGenerationFlow',
    inputSchema: TrackPerformanceAndAdaptQuizGenerationInputSchema,
    outputSchema: TrackPerformanceAndAdaptQuizGenerationOutputSchema,
  },
  async input => {
    const { output } = await adaptQuizPrompt(input);
    return output!;
  }
);
