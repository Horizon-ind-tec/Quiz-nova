'use server';

import {
  generateCustomQuiz,
  GenerateCustomQuizInput,
  GenerateCustomQuizOutput,
} from '@/ai/flows/generate-custom-quiz';
import {
  gradeExam,
  GradeExamInput,
  GradeExamOutput
} from '@/ai/flows/grade-exam-flow';
import type { Question } from '@/lib/types';


export async function generateQuizAction(
  input: GenerateCustomQuizInput
): Promise<GenerateCustomQuizOutput> {
  return await generateCustomQuiz(input);
}


export async function gradeExamAction(
  input: { answerSheetImages: string[], questions: Question[] }
): Promise<GradeExamOutput> {
  return await gradeExam(input);
}
