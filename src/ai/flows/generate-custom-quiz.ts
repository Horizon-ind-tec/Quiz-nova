
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
  totalMarks: z.number().describe('The total marks for the entire assessment.'),
  numberOfQuestions: z.coerce.number().min(1, "Must have at least 1 question.").max(100, "Cannot exceed 100 questions."),
  quizType: z.enum(['quiz', 'exam']).describe('The type of assessment: a short interactive quiz or a formal, paper-style exam.'),
  ncert: z.boolean().optional().describe('Whether the quiz should be based on the NCERT curriculum.'),
  class: z.string().optional().describe('The class of the student.'),
  seed: z.number().optional().describe('A random seed to ensure question uniqueness.'),
  timestamp: z.number().optional().describe('A timestamp to ensure question uniqueness.'),
  isJeeOrNeet: z.boolean().optional().describe('Flag for JEE/NEET specific question generation.'),
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
  const isJeeOrNeet = input.class === 'JEE (Mains + Advanced)' || input.class === 'NEET';
  const isQuizTypeQuiz = input.quizType === 'quiz';
  const isQuizTypeExam = input.quizType === 'exam';

  // Add a random seed and timestamp to ensure uniqueness
  const inputWithUniqueness = { 
      ...input, 
      isJeeOrNeet,
      isQuizTypeQuiz,
      isQuizTypeExam,
      seed: input.seed || Math.random(),
      timestamp: Date.now(),
    };
  return generateCustomQuizFlow(inputWithUniqueness);
}

const generateCustomQuizPrompt = ai.definePrompt({
  name: 'generateCustomQuizPrompt',
  model: googleAI.model('gemini-2.5-flash'),
  output: { schema: GenerateCustomQuizOutputSchema },
  prompt: `You are an expert exam question generator.

Your task is to generate a set of questions based on the user's request.

**USER REQUEST:**
- Subject: {{{subject}}}
- Class: {{{class}}}
- Difficulty: {{{difficulty}}}
{{#if subCategory}}- Sub-category: {{{subCategory}}}{{/if}}
{{#if chapter}}- Chapter/Topic: {{{chapter}}}{{/if}}
{{#if board}}- Board: {{{board}}}{{/if}}
{{#if ncert}}- Curriculum: NCERT{{/if}}

**ASSESSMENT DETAILS:**
- Type: {{{quizType}}}
- Target Number of Questions: {{{numberOfQuestions}}}
- Target Total Marks: {{{totalMarks}}}

**INSTRUCTIONS:**
1.  **Question Types:**
    - If this is for **JEE or NEET**, you MUST generate ONLY Multiple Choice (MCQ) and Numerical questions.
    - If this is an interactive **'quiz'**, you MUST generate ONLY Multiple Choice (MCQ) and Numerical questions. It is forbidden to generate 'match' type questions.
    - If this is a paper-style **'exam'**, generate a mix of question types (MCQ, Match, Numerical, Short Answer, Long Answer).

2.  **Quantity & Marks:**
    - You MUST generate exactly 'Number of Questions'.
    - You MUST ensure their marks add up to exactly 'Total Marks'.
    - Assign reasonable 'marks' to each question based on its type and complexity (e.g., MCQs are usually 1-4 marks, Long Answers 5-10).
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
    const output = response.output;
    
    if (!output || !output.questions) {
      console.error("AI did not return the expected output format.", response);
      throw new Error('AI failed to generate a valid quiz structure.');
    }
    
    return output;
  }
);
