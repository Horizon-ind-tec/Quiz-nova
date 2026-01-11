
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
import type { Question, QuizAttempt } from '@/lib/types';
import { 
  getPerformanceReport,
  GetPerformanceReportOutput
} from '@/ai/flows/get-performance-report';
import { notifyAdminOfPayment, NotifyAdminOfPaymentInput } from '@/ai/flows/notify-admin-of-payment';


export async function generateQuizAction(
  input: GenerateCustomQuizInput,
): Promise<GenerateCustomQuizOutput> {
  return await generateCustomQuiz(input);
}


export async function gradeExamAction(
  input: { answerSheetImages: string[], questions: Question[] }
): Promise<GradeExamOutput> {
  // Ensure we are passing the correct structure to the flow
  const gradeInput: GradeExamInput = {
    answerSheetImages: input.answerSheetImages,
    questions: input.questions.map(q => {
      // The AI prompt expects the correctAnswer structure for matching questions to be the pairs array
      if (q.type === 'match') {
        return { ...q, correctAnswer: q.pairs as any };
      }
      return q as any;
    })
  };
  return await gradeExam(gradeInput);
}

export async function getPerformanceReportAction(
  input: { quizHistory: QuizAttempt[], userQuestion: string }
): Promise<GetPerformanceReportOutput> {
  const mappedHistory = input.quizHistory.map(h => ({
      subject: h.subject,
      subCategory: h.subCategory,
      difficulty: h.difficulty,
      score: h.score,
      quizType: h.quizType,
      completedAt: h.completedAt,
  }));
  return await getPerformanceReport({ ...input, quizHistory: mappedHistory });
}


export async function notifyAdminOfPaymentAction(input: NotifyAdminOfPaymentInput): Promise<void> {
    await notifyAdminOfPayment(input);
}

    