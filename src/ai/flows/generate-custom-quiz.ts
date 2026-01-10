'use server';

/**
 * @fileOverview AI flow for generating custom quizzes based on user-specified criteria.
 *
 * This file defines a Genkit flow that takes in subject, difficulty, and educational board preferences,
 * and generates a custom quiz tailored to the user's needs. The flow uses a prompt to instruct the
 * language model to create the quiz and formats the output into a structured JSON.
 *
 * @exports generateCustomQuiz - The main function to generate a custom quiz.
 * @exports GenerateCustomQuizInput - The input type for the generateCustomQuiz function.
 * @exports GenerateCustomQuizOutput - The output type for the generateCustomQuiz function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCustomQuizInputSchema = z.object({
  subject: z.string().describe('The subject of the quiz (e.g., Mathematics, History).'),
  difficulty: z.enum(['easy', 'medium', 'hard']).describe('The difficulty level of the quiz.'),
  educationalBoard: z
    .string()
    .describe('The educational board for the quiz (e.g., CBSE, ICSE, State Board).'),
});
export type GenerateCustomQuizInput = z.infer<typeof GenerateCustomQuizInputSchema>;

const GenerateCustomQuizOutputSchema = z.object({
  quiz: z
    .array(
      z.object({
        question: z.string().describe('The quiz question.'),
        options: z.array(z.string()).describe('The multiple-choice options for the question.'),
        correctAnswer: z.string().describe('The correct answer to the question.'),
        explanation: z.string().describe('The explanation for the correct answer.'),
      })
    )
    .describe('The generated quiz questions, options, and answers.'),
});
export type GenerateCustomQuizOutput = z.infer<typeof GenerateCustomQuizOutputSchema>;

export async function generateCustomQuiz(
  input: GenerateCustomQuizInput
): Promise<GenerateCustomQuizOutput> {
  return generateCustomQuizFlow(input);
}

const generateCustomQuizPrompt = ai.definePrompt({
  name: 'generateCustomQuizPrompt',
  input: {schema: GenerateCustomQuizInputSchema},
  output: {schema: GenerateCustomQuizOutputSchema},
  prompt: `You are an expert quiz generator for students. Generate a quiz based on the following criteria:

Subject: {{{subject}}}
Difficulty: {{{difficulty}}}
Educational Board: {{{educationalBoard}}}

The quiz should be in JSON format. The JSON should be an array of objects. Each object should have the following fields:
- question: The quiz question.
- options: An array of multiple-choice options for the question.
- correctAnswer: The correct answer to the question.
- explanation: The explanation for the correct answer.

Here is an example of the expected JSON format:

[
  {
    "question": "What is the capital of France?",
    "options": ["London", "Paris", "Berlin", "Rome"],
    "correctAnswer": "Paris",
    "explanation": "Paris is the capital and most populous city of France."
  },
  {
    "question": "What is the chemical symbol for water?",
    "options": ["H2O", "CO2", "O2", "N2"],
    "correctAnswer": "H2O",
    "explanation": "H2O is the chemical symbol for water, representing two hydrogen atoms and one oxygen atom."
  }
]

Ensure that the generated JSON is valid and follows the specified format. Do not include any additional text or explanations outside of the JSON structure.
`,
});

const generateCustomQuizFlow = ai.defineFlow(
  {
    name: 'generateCustomQuizFlow',
    inputSchema: GenerateCustomQuizInputSchema,
    outputSchema: GenerateCustomQuizOutputSchema,
  },
  async input => {
    const {output} = await generateCustomQuizPrompt(input);
    return output!;
  }
);
