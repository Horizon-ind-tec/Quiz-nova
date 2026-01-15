
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
  totalMarks: z.number().describe('The total marks for the entire assessment.'),
  quizType: z.enum(['quiz', 'exam']).describe('The type of assessment: a short interactive quiz or a formal, paper-style exam.'),
  ncert: z.boolean().optional().describe('Whether the quiz should be based on the NCERT curriculum.'),
  class: z.string().optional().describe('The class of the student.'),
  seed: z.number().optional().describe('A random seed to ensure question uniqueness.'),
  timestamp: z.number().optional().describe('A timestamp to ensure question uniqueness.'),
});
export type GenerateCustomQuizInput = z.infer<typeof GenerateCustomQuizInputSchema>;

const MCQSchema = z.object({
  type: z.enum(['mcq']).describe("The type of the question: Multiple Choice Question."),
  question: z.string().describe('The quiz question.'),
  options: z.array(z.string()).describe('The multiple-choice options for the question.'),
  correctAnswer: z.string().describe('The correct answer to the question.'),
  explanation: z.string().describe('The explanation for the correct answer.'),
  marks: z.number().describe('The marks assigned to this question.'),
});

const MatchSchema = z.object({
  type: z.enum(['match']).describe("The type of the question: Match the Following."),
  question: z.string().describe('A title or instruction for the matching question (e.g., "Match the capitals to their countries").'),
  pairs: z.array(z.object({
    item: z.string().describe("The item in the first column."),
    match: z.string().describe("The corresponding correct match in the second column."),
  })).describe("The pairs to be matched. The 'match' values will be shuffled for the user."),
  explanation: z.string().describe('An explanation for the correct pairings.'),
  marks: z.number().describe('The marks assigned to this question.'),
});

const NumericalSchema = z.object({
  type: z.enum(['numerical']).describe("The type of the question: Numerical Answer."),
  question: z.string().describe('The question that requires a numerical answer.'),
  correctAnswer: z.number().describe('The correct numerical answer.'),
  explanation: z.string().describe('The explanation for how to arrive at the correct answer.'),
  marks: z.number().describe('The marks assigned to this question.'),
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
  // Add a random seed and timestamp to ensure uniqueness
  const inputWithUniqueness = { 
      ...input, 
      seed: input.seed || Math.random(),
      timestamp: Date.now(),
    };
  return generateCustomQuizFlow(inputWithUniqueness);
}

const generateCustomQuizPrompt = ai.definePrompt({
  name: 'generateCustomQuizPrompt',
  input: {schema: GenerateCustomQuizInputSchema},
  output: {schema: GenerateCustomQuizOutputSchema},
  prompt: `You are an expert question paper generator for students. Generate a question paper with a TOTAL of {{{totalMarks}}} marks based on the following criteria:

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

**VERY IMPORTANT INSTRUCTIONS:**
1.  The sum of marks for ALL generated questions MUST be EXACTLY equal to the 'totalMarks' ({{{totalMarks}}}).
2.  You will decide the number of questions to generate. Create a mix of questions with different marks (e.g., 1, 2, 4, 5 marks per question).
3.  Each generated question object MUST have a "marks" field indicating the marks for that question.
4.  You MUST generate a completely new and unique set of questions for every request. Use the unique request fingerprint to ensure uniqueness.

Unique Request Fingerprint:
- Seed: {{{seed}}}
- Timestamp: {{{timestamp}}}

- Generate a mix of question types (MCQ, Match the Following, Numerical) if the assessment type is 'exam'. Otherwise, prioritize MCQs for 'quiz' type.

The entire output should be a single JSON object with a "questions" key, which holds an array of question objects. Each question object must have a "type", "marks", and other fields appropriate for that type.

Example of the expected JSON structure for totalMarks: 10
{
  "questions": [
    {
      "type": "mcq",
      "question": "What is the capital of France?",
      "options": ["London", "Paris", "Berlin", "Rome"],
      "correctAnswer": "Paris",
      "explanation": "Paris is the capital and most populous city of France.",
      "marks": 1
    },
    {
      "type": "match",
      "question": "Match the scientists to their discoveries.",
      "pairs": [
        { "item": "Isaac Newton", "match": "Laws of Motion" },
        { "item": "Albert Einstein", "match": "Theory of Relativity" },
        { "item": "Marie Curie", "match": "Radioactivity" }
      ],
      "explanation": "Newton formulated the laws of motion, Einstein developed the theory of relativity, and Curie pioneered research on radioactivity.",
      "marks": 4
    },
    {
      "type": "numerical",
      "question": "What is the value of Pi rounded to two decimal places?",
      "correctAnswer": 3.14,
      "explanation": "Pi (π) is an irrational number, approximately equal to 3.14159. Rounded to two decimal places, it is 3.14.",
      "marks": 1
    },
    {
        "type": "mcq",
        "question": "What is the largest planet in our solar system?",
        "options": ["Earth", "Mars", "Jupiter", "Saturn"],
        "correctAnswer": "Jupiter",
        "explanation": "Jupiter is the largest planet in our solar system by a significant margin.",
        "marks": 4
    }
  ]
}


Ensure the total marks add up to {{{totalMarks}}}. Ensure the generated JSON is valid. Do not include any text outside the JSON.
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

    