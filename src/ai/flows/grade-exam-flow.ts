
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
    input: { schema: GradeExamInputSchema },
    output: { schema: GradeExamOutputSchema },
    prompt: `You are an expert AI Exam Grader. Your task is to analyze images of a student's handwritten answer sheet and grade their answers against a provided list of questions and correct answers.

    **Instructions:**
    1.  Carefully examine the handwritten answers in the provided images:
        {{#each answerSheetImages}}
        - Image: {{media url=this}}
        {{/each}}
    
    2.  Here are the exam questions and their correct answers. The questions are in order.
        {{#each questions}}
        - **Question {{add @index 1}} (Type: {{{type}}})**:
          - **Question:** {{{question}}}
          - **Correct Answer / Model Answer:** 
            {{#if (eq type 'mcq')}}
              {{correctAnswer}}
            {{/if}}
            {{#if (eq type 'numerical')}}
              {{correctAnswer}}
            {{/if}}
            {{#if (eq type 'match')}}
              {{#each correctAnswer}}
              - {{{item}}} -> {{{match}}}
              {{/each}}
            {{/if}}
            {{#if (eq type 'shortAnswer')}}
              {{correctAnswer}}
            {{/if}}
            {{#if (eq type 'longAnswer')}}
              {{correctAnswer}}
            {{/if}}
        {{/each}}

    3.  For each question, find the student's answer in the images. The answers should be in the same order as the questions.
    4.  Compare the student's answer to the correct answer.
        - For MCQs, the user might write the option letter (A, B, C, D) or the full answer text. Your job is to map this back to the correct option text.
        - For Match the Following, the user might write pairs like "1 -> c", "Item -> Match". You must determine if their pairings are correct based on the provided correct answers.
        - For Numerical questions, the number must match exactly.
        - For Short and Long Answer questions, the 'Correct Answer' is a model answer. You do not need to match it word-for-word. Instead, assess if the student's answer captures the key points and demonstrates understanding of the concept. Be lenient with phrasing but strict on factual accuracy.

    5. Determine if the student's answer for each question is correct.
    
    6. Calculate the final score as a percentage of correct answers. For example, if 15 out of 30 are correct, the score is 50.
    
    7. Provide overall feedback on the user's performance, highlighting areas of strength and weakness.
    
    **Output Format:**
    You must return a valid JSON object that strictly follows this structure. For each question, include the extracted user answer and whether it was correct.
    
    Example:
    {
      "score": 80,
      "gradedAnswers": [
        {
          "questionIndex": 0,
          "userAnswer": "Paris",
          "isCorrect": true
        },
        {
          "questionIndex": 1,
          "userAnswer": "The user matched 'Newton' to 'Laws of Motion' and 'Einstein' to 'Theory of Relativity'.",
          "isCorrect": true
        },
        {
          "questionIndex": 2,
          "userAnswer": "3.14",
          "isCorrect": true
        },
        {
          "questionIndex": 3,
          "userAnswer": "London",
          "isCorrect": false
        }
      ],
      "generalFeedback": "Great job on the matching and numerical questions! You seem to have a good grasp of the core concepts. Review the material on European capitals for the next exam."
    }
    `,
    helpers: {
      add: (a: number, b: number) => a + b,
      eq: (a: any, b: any) => a === b,
    },
});

const gradeExamFlow = ai.defineFlow(
  {
    name: 'gradeExamFlow',
    inputSchema: GradeExamInputSchema,
    outputSchema: GradeExamOutputSchema,
  },
  async (input) => {
    const { output } = await gradeExamPrompt(input);
    
    if (!output) {
        throw new Error('AI failed to generate a grade.');
    }
    
    return output;
  }
);
