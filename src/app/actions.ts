'use server';

import {
  generateCustomQuiz,
  GenerateCustomQuizInput,
  GenerateCustomQuizOutput,
} from '@/ai/flows/generate-custom-quiz';

export async function generateQuizAction(
  input: GenerateCustomQuizInput
): Promise<GenerateCustomQuizOutput> {
  return await generateCustomQuiz(input);
}
