'use server';

import {
  generateCustomQuiz,
  type GenerateCustomQuizInput,
  type GenerateCustomQuizOutput,
} from '@/ai/flows/generate-custom-quiz';
import {
  gradeExam,
  type GradeExamInput,
  type GradeExamOutput
} from '@/ai/flows/grade-exam-flow';
import type { Question, QuizAttempt, StudyPlan, StudyTask } from '@/lib/types';
import { 
  getPerformanceReport,
  type GetPerformanceReportOutput
} from '@/ai/flows/get-performance-report';
import { notifyAdminOfPayment, type NotifyAdminOfPaymentInput } from '@/ai/flows/notify-admin-of-payment';
import { generateStudyPlan } from '@/ai/flows/generate-study-plan';
import { getAdminDb } from '@/firebase/admin';
import { v4 as uuidv4 } from 'uuid';
import {
  generateMostExpectedQuestions,
  type GenerateMostExpectedQuestionsInput,
  type GenerateMostExpectedQuestionsOutput,
} from '@/ai/flows/generate-most-expected-questions';
import {
  homeworkHelper,
  type HomeworkHelperInput,
  type HomeworkHelperOutput
} from '@/ai/flows/homework-helper-flow';


export async function generateQuizAction(
  input: Omit<GenerateCustomQuizInput, 'generationMode'>,
): Promise<GenerateCustomQuizOutput> {
  const result = await generateCustomQuiz(input);
  if (!result || !result.questions) {
    throw new Error('AI failed to return valid questions.');
  }
  return result;
}


export async function gradeExamAction(
  input: { answerSheetImages: string[], questions: Question[] }
): Promise<GradeExamOutput> {
  const gradeInput: GradeExamInput = {
    answerSheetImages: input.answerSheetImages,
    questions: input.questions.map(q => {
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


/**
 * Handles payment verification notifications.
 * Note: Firestore updates are handled on the client by the admin to avoid Admin SDK auth issues.
 */
export async function handlePaymentAction(input: { targetUserId: string, targetUserEmail: string, targetUserName: string, pendingPlan: string, action: 'approve' | 'deny' }): Promise<void> {
  const { targetUserId, targetUserEmail, targetUserName, pendingPlan, action } = input;
  
  if (action === 'approve') {
      await notifyAdminOfPayment({
        userId: targetUserId,
        userName: targetUserName,
        userEmail: targetUserEmail,
        planName: pendingPlan,
        planPrice: pendingPlan === 'premium' ? '₹500' : '₹1000',
        transactionId: `Nova${pendingPlan === 'premium' ? '+' : '$'}${targetUserId.slice(0, 9).toLowerCase()}`,
        isApproval: true,
      });
  }
}

/**
 * Generates a study plan. The client is responsible for saving it to Firestore.
 */
export async function generateStudyPlanAction(input: {
  examDate: Date;
  subjects: { name: string; chapters: string[] }[];
}): Promise<StudyPlan> {
  const { examDate, subjects } = input;

  const aiResult = await generateStudyPlan({ examDate, subjects });

  const scheduleWithCompletion: StudyTask[] = aiResult.schedule.map(task => ({
    ...task,
    isCompleted: false,
  }));

  const newStudyPlan: StudyPlan = {
    id: uuidv4(),
    userId: '', // To be filled by client
    examDate: examDate.getTime(),
    subjects,
    schedule: scheduleWithCompletion,
    createdAt: Date.now(),
  };

  return newStudyPlan;
}


export async function generateMostExpectedQuestionsAction(
  input: GenerateMostExpectedQuestionsInput
): Promise<GenerateMostExpectedQuestionsOutput> {
    return await generateMostExpectedQuestions(input);
}

export async function homeworkHelperAction(input: HomeworkHelperInput): Promise<HomeworkHelperOutput> {
  return await homeworkHelper(input);
}
