
'use server';
/**
 * @fileOverview AI flow for grading handwritten exam answers from images.
 *
 * This file defines a Genkit flow that takes images of handwritten answers and a quiz object,
 * then uses a multimodal LLM to analyze the images, extract the user's answers, compare them
 * to the correct answers, and calculate a final score.
 *
 * @exports gradeExam - The main function to grade an exam from images.
 * @exports GradeExamInput - The input type for the gradeExam function.
 * @exports GradeExamOutput - The output type for the gradeExam function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'genkit';
import type { Question } from '@/lib/types';

// Define the schema for a single question to be passed to the AI
const QuestionSchemaForAI = z.object({
  type: z.enum(['mcq', 'match', 'numerical', 'shortAnswer', 'longAnswer']),
  question: z.string(),
  // For the AI, correctAnswer can be string, number, or array of pairs for matching
  correctAnswer: z.union([
    z.string(), 
    z.number(), 
    z.array(z.object({ item: z.string(), match: z.string() }))
  ]),
  // Options are only for MCQs
  options: z.array(z.string()).optional(),
});


const GradeExamInputSchema = z.object({
  answerSheetImages: z.array(z.string()).describe(
    "An array of photos of the user's handwritten answer sheets, as data URIs. Each URI must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
  questions: z.array(QuestionSchemaForAI).describe('The array of questions from the exam, including their correct answers.'),
});
export type GradeExamInput = z.infer<typeof GradeExamInputSchema>;

const GradedAnswerSchema = z.object({
  questionIndex: z.number().describe("The index of the question being graded."),
  userAnswer: z.string().describe("The answer the user wrote, as interpreted from the image."),
  isCorrect: z.boolean().describe("Whether the user's answer is correct."),
});

const GradeExamOutputSchema = z.object({
  score: z.number().describe('The final calculated score as a percentage (0-100).'),
  gradedAnswers: z.array(GradedAnswerSchema).describe("An array of the user's graded answers."),
  generalFeedback: z.string().describe("Overall feedback on the user's performance."),
});
export type GradeExamOutput = z.infer<typeof GradeExamOutputSchema>;

// Main function to initiate the flow
export async function gradeExam(input: GradeExamInput): Promise<GradeExamOutput> {
  return gradeExamFlow(input);
}


const gradeExamPrompt = ai.definePrompt({
    name: 'gradeExamPrompt',
    model: googleAI.model('gemini-2.5-flash'),
    prompt: `You are an expert AI Exam Grader. Your task is to analyze images of a student's handwritten answer sheet and grade them.

    **Instructions:**
    1.  Carefully examine the handwritten answers in the provided images:
        {{#each answerSheetImages}}
        - Image: {{media url=this}}
        {{/each}}
    
    2.  Here are the exam questions and their correct answers, in order.
        {{#each questions}}
        - **Question {{add @index 1}} (Type: {{{type}}})**:
          - Question: {{{question}}}
          - Correct Answer: [Redacted for brevity]
        {{/each}}

    3.  For each question, find the student's answer in the images and determine if it is correct. For subjective answers (short/long), assess if the key points are captured. Be lenient with phrasing.
    4. Calculate the final score as a percentage.
    5. Provide a single sentence of general feedback.
    
    **Output Format:**
    Return a valid JSON object. Do not include markdown.
    Example:
    {
      "score": 80,
      "gradedAnswers": [
        { "questionIndex": 0, "userAnswer": "Paris", "isCorrect": true },
        { "questionIndex": 1, "userAnswer": "User matched correctly.", "isCorrect": true },
        { "questionIndex": 2, "userAnswer": "3.14", "isCorrect": true },
        { "questionIndex": 3, "userAnswer": "London", "isCorrect": false }
      ],
      "generalFeedback": "Great job, but review European capitals."
    }
    `,
    helpers: {
      add: (a: number, b: number) => a + b,
    },
});

const gradeExamFlow = ai.defineFlow(
  {
    name: 'gradeExamFlow',
    inputSchema: GradeExamInputSchema,
    outputSchema: GradeExamOutputSchema,
  },
  async (input) => {
    const response = await gradeExamPrompt(input);
    const text = response.text;
    const cleanedText = text.replace(/^```json\s*|```\s*$/g, '').trim();

    try {
        const output = JSON.parse(cleanedText);
        if (!output) {
            throw new Error('AI failed to generate a grade.');
        }
        return output;
    } catch (e) {
        console.error("Failed to parse JSON from model output for grading:", cleanedText);
        throw new Error("The AI returned a response that was not valid JSON.");
    }
  }
);
