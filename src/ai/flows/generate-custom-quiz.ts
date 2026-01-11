
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
  subCategory: z.string().optional().describe('The sub-category of the subject (e.g., Advance Math, Physics).'),
  difficulty: z.enum(['easy', 'medium', 'hard']).describe('The difficulty level of the quiz.'),
  board: z.string().describe('The educational board for the quiz (e.g., CBSE, ICSE, State Board).'),
  chapter: z.string().optional().describe('The specific chapter or topic for the quiz.'),
  numberOfQuestions: z.number().describe('The total number of questions to generate for the quiz.'),
  quizType: z.enum(['quiz', 'exam']).describe('The type of assessment: a short interactive quiz or a formal, paper-style exam.'),
  ncert: z.boolean().optional().describe('Whether the quiz should be based on the NCERT curriculum.'),
  class: z.string().optional().describe('The class of the student.'),
});
export type GenerateCustomQuizInput = z.infer<typeof GenerateCustomQuizInputSchema>;

const MCQSchema = z.object({
  type: z.enum(['mcq']).describe("The type of the question: Multiple Choice Question."),
  question: z.string().describe('The quiz question.'),
  options: z.array(z.string()).describe('The multiple-choice options for the question.'),
  correctAnswer: z.string().describe('The correct answer to the question.'),
  explanation: z.string().describe('The explanation for the correct answer.'),
});

const MatchSchema = z.object({
  type: z.enum(['match']).describe("The type of the question: Match the Following."),
  question: z.string().describe('A title or instruction for the matching question (e.g., "Match the capitals to their countries").'),
  pairs: z.array(z.object({
    item: z.string().describe("The item in the first column."),
    match: z.string().describe("The corresponding correct match in the second column."),
  })).describe("The pairs to be matched. The 'match' values will be shuffled for the user."),
  explanation: z.string().describe('An explanation for the correct pairings.'),
});

const NumericalSchema = z.object({
  type: z.enum(['numerical']).describe("The type of the question: Numerical Answer."),
  question: z.string().describe('The question that requires a numerical answer.'),
  correctAnswer: z.number().describe('The correct numerical answer.'),
  explanation: z.string().describe('The explanation for how to arrive at the correct answer.'),
});

const QuestionSchema = z.union([MCQSchema, MatchSchema, NumericalSchema]);


const GenerateCustomQuizOutputSchema = z.object({
  questions: z
    .array(QuestionSchema)
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
  prompt: `You are an expert quiz generator for students. Generate a quiz with exactly {{{numberOfQuestions}}} questions based on the following criteria:

Subject: {{{subject}}}
{{#if subCategory}}
Sub-category: {{{subCategory}}}
{{/if}}
Difficulty: {{{difficulty}}}
Educational Board: {{{board}}}
Assessment Type: {{{quizType}}}
{{#if chapter}}
Chapter/Topic: {{{chapter}}}
{{/if}}
{{#if ncert}}
Curriculum: NCERT
{{/if}}

- Generate a mix of question types (MCQ, Match the Following, Numerical) if the assessment type is 'exam' and the number of questions is large (e.g., >15). Otherwise, prioritize MCQs.
- Ensure you generate exactly {{{numberOfQuestions}}} questions in total.

The entire output should be a single JSON object with a "questions" key, which holds an array of question objects. Each question object must have a "type" field ('mcq', 'match', or 'numerical') and other fields appropriate for that type.

Example of the expected JSON structure:
{
  "questions": [
    {
      "type": "mcq",
      "question": "What is the capital of France?",
      "options": ["London", "Paris", "Berlin", "Rome"],
      "correctAnswer": "Paris",
      "explanation": "Paris is the capital and most populous city of France."
    },
    {
      "type": "match",
      "question": "Match the scientists to their discoveries.",
      "pairs": [
        { "item": "Isaac Newton", "match": "Laws of Motion" },
        { "item": "Albert Einstein", "match": "Theory of Relativity" },
        { "item": "Marie Curie", "match": "Radioactivity" }
      ],
      "explanation": "Newton formulated the laws of motion, Einstein developed the theory of relativity, and Curie pioneered research on radioactivity."
    },
    {
      "type": "numerical",
      "question": "What is the value of Pi rounded to two decimal places?",
      "correctAnswer": 3.14,
      "explanation": "Pi (π) is an irrational number, approximately equal to 3.14159. Rounded to two decimal places, it is 3.14."
    }
  ]
}


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
