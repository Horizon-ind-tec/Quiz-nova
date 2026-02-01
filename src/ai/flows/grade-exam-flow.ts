'use server';
/**
 * @fileOverview AI flow for grading handwritten exam answers from images.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const QuestionSchemaForAI = z.object({
  type: z.enum(['mcq', 'match', 'numerical', 'shortAnswer', 'longAnswer']),
  question: z.string(),
  correctAnswer: z.any(),
  options: z.array(z.string()).optional(),
});

const GradeExamInputSchema = z.object({
  answerSheetImages: z.array(z.string()),
  questions: z.array(QuestionSchemaForAI),
});
export type GradeExamInput = z.infer<typeof GradeExamInputSchema>;

const GradedAnswerSchema = z.object({
  questionIndex: z.number(),
  userAnswer: z.string(),
  isCorrect: z.boolean(),
});

const GradeExamOutputSchema = z.object({
  score: z.number(),
  gradedAnswers: z.array(GradedAnswerSchema),
  generalFeedback: z.string(),
});
export type GradeExamOutput = z.infer<typeof GradeExamOutputSchema>;

export async function gradeExam(input: GradeExamInput): Promise<GradeExamOutput> {
  return gradeExamFlow(input);
}

const gradeExamPrompt = ai.definePrompt({
    name: 'gradeExamPrompt',
    model: 'googleai/gemini-2.5-flash',
    input: { schema: GradeExamInputSchema },
    prompt: `You are an expert AI Exam Grader. Your task is to analyze images of a student's handwritten answer sheet and grade them.

    **Instructions:**
    1.  Carefully examine the handwritten answers in the provided images:
        {{#each answerSheetImages}}
        - Image: {{media url=this}}
        {{/each}}
    
    2.  Here are the exam questions and their correct answers, in order. The question index is zero-based.
        {{#each questions}}
        - **Question {{ @index }} (Type: {{{type}}})**:
          - Question: {{{question}}}
          - Correct Answer: [Redacted for brevity]
        {{/each}}

    3.  For each question, find the student's answer in the images and determine if it is correct. For subjective answers (short/long), assess if the key points are captured.
    4. Calculate the final score as a percentage.
    5. Provide a single sentence of general feedback.
    6. Return the result as a valid JSON object with: "score", "gradedAnswers" (array of {questionIndex, userAnswer, isCorrect}), and "generalFeedback".
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

const gradeExamFlow = ai.defineFlow(
  {
    name: 'gradeExamFlow',
    inputSchema: GradeExamInputSchema,
    outputSchema: GradeExamOutputSchema,
  },
  async (input) => {
    const response = await gradeExamPrompt(input);
    const extracted = extractJson(response.text);

    if (extracted && typeof extracted.score === 'number') {
      return extracted as GradeExamOutput;
    }
    
    throw new Error("The AI failed to grade the exam.");
  }
);
