
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
  numberOfQuestions: z.coerce.number().min(1, "Must have at least 1 question.").max(100, "Cannot exceed 100 questions.").optional(),
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
{{#if numberOfQuestions}}
- Number of Questions: {{{numberOfQuestions}}}
{{else}}
- Total Marks: {{{totalMarks}}}
{{/if}}

**INSTRUCTIONS:**
1.  **Question Types:**
    - If this is for **JEE or NEET**, you MUST generate ONLY Multiple Choice (MCQ) and Numerical questions.
    - If this is an interactive **'quiz'**, you MUST generate ONLY Multiple Choice (MCQ) and Numerical questions. It is forbidden to generate 'match' type questions.
    - If this is a paper-style **'exam'**, generate a mix of question types (MCQ, Match, Numerical, Short Answer, Long Answer).

2.  **Quantity & Marks:**
    - If 'Number of Questions' is given, generate EXACTLY that many questions. Assign reasonable 'marks' to each.
    - If 'Total Marks' is given, generate a suitable number of questions so their marks add up to the total.
    - For JEE/NEET exams, be aware that questions often have different values (e.g., some are worth 4 marks, some 2). Distribute marks realistically based on the question type and difficulty.

3.  **Output Format:**
    - You MUST output a single valid JSON object.
    - The JSON object must have one key: "questions".
    - The value of "questions" must be an array of question objects.
    - Each question object must have all the required fields for its 'type', including 'marks' and 'explanation'.
    - Do not add any text or markdown before or after the JSON object.
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
    
    // First, try to remove markdown fences if they exist.
    let cleanedText = text.replace(/^```json\s*|```\s*$/g, '').trim();

    // Then, extract the content between the first '{' and the last '}'.
    const firstBrace = cleanedText.indexOf('{');
    const lastBrace = cleanedText.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
      console.error("Could not find a valid JSON object in the model's response:", text);
      throw new Error("The AI's response did not contain a recognizable JSON object.");
    }
    
    const jsonString = cleanedText.substring(firstBrace, lastBrace + 1);

    try {
        const output = JSON.parse(jsonString);
        if (!output || !output.questions) {
            throw new Error('AI returned a valid JSON object, but it was missing the required "questions" key.');
        }
        return output;
    } catch (e) {
        console.error("Failed to parse JSON from model output for quiz generation:", jsonString);
        const parseError = e instanceof Error ? e.message : String(e);
        throw new Error(`The AI returned a response that was not valid JSON. Parser error: ${parseError}`);
    }
  }
);
