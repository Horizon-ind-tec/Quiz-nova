'use server';

/**
 * @fileOverview AI flow for generating custom quizzes based on user-specified criteria.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCustomQuizInputSchema = z.object({
  subject: z.string().describe('The subject of the quiz (e.g., Mathematics, History).'),
  subCategory: z.string().optional().describe('The sub-category of the subject (e.g., Advance Math, Physics).'),
  difficulty: z.enum(['easy', 'medium', 'hard']).describe('The difficulty level of the quiz.'),
  board: z.string().optional().describe('The educational board for the quiz (e.g., CBSE, ICSE, State Board).'),
  chapter: z.string().optional().describe('The specific chapter or topic for the quiz.'),
  totalMarks: z.number().describe('The total marks for the entire assessment.'),
  numberOfQuestions: z.coerce.number().min(1).max(100),
  quizType: z.enum(['quiz', 'exam']).describe('The type of assessment: a short interactive quiz or a formal, paper-style exam.'),
  ncert: z.boolean().optional().describe('Whether the quiz should be based on the NCERT curriculum.'),
  class: z.string().optional().describe('The class of the student.'),
  seed: z.number().optional().describe('A random seed to ensure question uniqueness.'),
  timestamp: z.number().optional().describe('A timestamp to ensure question uniqueness.'),
  isJeeOrNeet: z.boolean().optional().describe('Flag for JEE/NEET specific question generation.'),
});
export type GenerateCustomQuizInput = z.infer<typeof GenerateCustomQuizInputSchema>;

const MCQSchema = z.object({
  type: z.literal('mcq'),
  question: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.string(),
  explanation: z.string(),
  marks: z.number(),
});

const MatchSchema = z.object({
  type: z.literal('match'),
  question: z.string(),
  pairs: z.array(z.object({
    item: z.string(),
    match: z.string(),
  })),
  explanation: z.string(),
  marks: z.number(),
});

const NumericalSchema = z.object({
  type: z.literal('numerical'),
  question: z.string(),
  correctAnswer: z.number(),
  explanation: z.string(),
  marks: z.number(),
});

const ShortAnswerSchema = z.object({
  type: z.literal('shortAnswer'),
  question: z.string(),
  correctAnswer: z.string(),
  explanation: z.string(),
  marks: z.number(),
});

const LongAnswerSchema = z.object({
  type: z.literal('longAnswer'),
  question: z.string(),
  correctAnswer: z.string(),
  explanation: z.string(),
  marks: z.number(),
});

const QuestionSchema = z.union([MCQSchema, MatchSchema, NumericalSchema, ShortAnswerSchema, LongAnswerSchema]);

const GenerateCustomQuizOutputSchema = z.object({
  questions: z.array(QuestionSchema),
});
export type GenerateCustomQuizOutput = z.infer<typeof GenerateCustomQuizOutputSchema>;

export async function generateCustomQuiz(
  input: GenerateCustomQuizInput
): Promise<GenerateCustomQuizOutput> {
  const isJeeOrNeet = input.class === 'JEE (Mains + Advanced)' || input.class === 'NEET';
  const inputWithUniqueness = { 
      ...input, 
      isJeeOrNeet,
      seed: input.seed || Math.random(),
      timestamp: Date.now(),
    };
  return generateCustomQuizFlow(inputWithUniqueness);
}

const generateCustomQuizPrompt = ai.definePrompt({
  name: 'generateCustomQuizPrompt',
  model: 'googleai/gemini-2.5-flash',
  input: { schema: GenerateCustomQuizInputSchema },
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
    - You MUST generate EXACTLY {{{numberOfQuestions}}} questions.
    - You MUST ensure the 'marks' for all generated questions add up to EXACTLY {{{totalMarks}}}.
    - Assign reasonable 'marks' to each question based on its type and complexity (e.g., MCQs are usually 1-4 marks, Long Answers 5-10).

3. **Format:**
    - You MUST return ONLY a valid JSON object.
    - The JSON object must have a "questions" key containing an array of question objects.
    - Each question object must have: "type" (MUST be lowercase: 'mcq', 'match', 'numerical', 'shortAnswer', 'longAnswer'), "question", "correctAnswer", "explanation", "marks", and optionally "options" (for mcq) or "pairs" (for match).
    - **CRITICAL:** For Multiple Choice Questions (MCQ), the "options" MUST contain ONLY the plain text of the option. Do NOT include any prefixes like "a)", "b.", "(C)", or "1." inside the option strings. The frontend will handle the labeling.

4. **Constraint:**
    - Do NOT use the character sequence '*#' in your output unless explicitly mentioned or asked about in the user request.
`,
});

function extractJson(text: string) {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("Failed to parse extracted JSON:", e);
      return null;
    }
  }
  return null;
}

const generateCustomQuizFlow = ai.defineFlow(
  {
    name: 'generateCustomQuizFlow',
    inputSchema: GenerateCustomQuizInputSchema,
    outputSchema: GenerateCustomQuizOutputSchema,
  },
  async input => {
    const response = await generateCustomQuizPrompt(input);
    const extracted = extractJson(response.text);
    
    if (extracted && extracted.questions && Array.isArray(extracted.questions)) {
      extracted.questions = extracted.questions.map((q: any) => ({
        ...q,
        type: typeof q.type === 'string' ? q.type.toLowerCase() : q.type
      }));
      return extracted as GenerateCustomQuizOutput;
    }
    
    throw new Error('AI failed to generate a valid quiz structure.');
  }
);
