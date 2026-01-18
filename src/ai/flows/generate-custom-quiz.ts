
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
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';

const GenerateCustomQuizInputSchema = z.object({
  subject: z.string().describe('The subject of the quiz (e.g., Mathematics, History).'),
  subCategory: z.string().optional().describe('The sub-category of the subject (e.g., Advance Math, Physics).'),
  difficulty: z.enum(['easy', 'medium', 'hard']).describe('The difficulty level of the quiz.'),
  board: z.string().optional().describe('The educational board for the quiz (e.g., CBSE, ICSE, State Board).'),
  chapter: z.string().optional().describe('The specific chapter or topic for the quiz.'),
  totalMarks: z.number().describe('The total marks for the entire assessment.').optional(),
  numberOfQuestions: z.number().describe('The exact number of questions to generate.').optional(),
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

const ShortAnswerSchema = z.object({
  type: z.enum(['shortAnswer']).describe("The type of the question: Short Answer (e.g., one-word, define the term, 2-3 sentences)."),
  question: z.string().describe('The question that requires a short textual answer.'),
  correctAnswer: z.string().describe('The model correct answer.'),
  explanation: z.string().describe('An explanation for the correct answer.'),
  marks: z.number().describe('The marks assigned to this question.'),
});

const LongAnswerSchema = z.object({
  type: z.enum(['longAnswer']).describe("The type of the question: Long Answer (e.g., paragraph-length response)."),
  question: z.string().describe('The question that requires a detailed, long textual answer.'),
  correctAnswer: z.string().describe('A model answer providing key points and structure.'),
  explanation: z.string().describe('An explanation of what a good answer should contain.'),
  marks: z.number().describe('The marks assigned to this question.'),
});

const QuestionSchema = z.union([MCQSchema, MatchSchema, NumericalSchema, ShortAnswerSchema, LongAnswerSchema]);


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
  model: googleAI.model('gemini-2.5-flash'),
  prompt: `You are an expert question paper generator for students.

{{#if numberOfQuestions}}
Generate EXACTLY {{{numberOfQuestions}}} questions based on the following criteria.
You MUST assign sensible marks to each question (e.g., 1, 2, 5 marks) to create a balanced assessment.
The total marks will be the sum of the marks for each question you create.
{{else}}
Generate a question paper with a TOTAL of {{{totalMarks}}} marks based on the following criteria.
{{/if}}

Subject: {{{subject}}}
{{#if subCategory}}
Sub-category: {{{subCategory}}}
{{/if}}
Difficulty: {{{difficulty}}}
{{#if board}}
Educational Board: {{{board}}}
{{/if}}
Assessment Type: {{{quizType}}}
{{#if chapter}}
Chapter/Topic: {{{chapter}}}
{{/if}}
{{#if ncert}}
Curriculum: NCERT
{{/if}}

**VERY IMPORTANT INSTRUCTIONS:**
{{#if numberOfQuestions}}
1.  You MUST generate exactly {{{numberOfQuestions}}} questions.
2.  Assign a "marks" field to each question. Choose marks that are appropriate for the question's difficulty and type.
{{else}}
1.  The sum of marks for ALL generated questions MUST be EXACTLY equal to the 'totalMarks' ({{{totalMarks}}}).
2.  You MUST determine the number of questions to generate based on the \`totalMarks\`. Follow this algorithm precisely:
    - For \`totalMarks\` <= 10, generate 5-7 questions.
    - For \`totalMarks\` between 11 and 25, generate 8-12 questions.
    - For \`totalMarks\` between 26 and 50, generate 15-20 questions.
    - For \`totalMarks\` between 51 and 75, generate 20-25 questions.
    - For \`totalMarks\` > 75, generate 25-30 questions.
3.  You must create a mix of questions with varying marks (e.g., 1, 2, 4, 5 marks). Avoid creating questions worth more than 5 marks unless it is a 'longAnswer' type question that requires a detailed response.
{{/if}}
4.  Each generated question object MUST have a "marks" field indicating the marks for that question.
5.  You MUST generate a completely new and unique set of questions for every request. Use the unique request fingerprint to ensure uniqueness.
6.  For 'exam' type assessments, generate a mix of question types including Multiple Choice (MCQ), Match the Following, Numerical, Short Answer, and Long Answer questions.
7.  For 'quiz' type assessments, generate ONLY MCQ and Numerical questions.
8.  For subjects like 'Social Science', 'History', 'Politics/Civics', or 'Biology', you SHOULD include a good number of Short Answer and Long Answer questions in 'exam' mode. For other subjects, use them where appropriate to create a balanced paper.


Unique Request Fingerprint:
- Seed: {{{seed}}}
- Timestamp: {{{timestamp}}}

Return a response as a valid JSON object only. Do not include any text outside the JSON. The JSON object should have a "questions" key, which holds an array of question objects. Each question object must have a "type", "marks", and other fields appropriate for that type.
`,
});

const generateCustomQuizFlow = ai.defineFlow(
  {
    name: 'generateCustomQuizFlow',
    inputSchema: GenerateCustomQuizInputSchema,
    outputSchema: GenerateCustomQuizOutputSchema,
  },
  async input => {
    const response = await generateCustomQuizPrompt(input);
    const text = response.text;
    
    // Sometimes the model might still wrap the JSON in markdown backticks
    const cleanedText = text.replace(/^```json\s*|```\s*$/g, '').trim();

    try {
        return JSON.parse(cleanedText);
    } catch (e) {
        console.error("Failed to parse JSON from model output:", cleanedText);
        throw new Error("The AI returned a response that was not valid JSON.");
    }
  }
);
