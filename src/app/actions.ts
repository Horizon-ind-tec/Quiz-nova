
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


export async function handlePaymentAction(input: { targetUserId: string, action: 'approve' | 'deny' }): Promise<void> {
  const db = await getAdminDb();
  const { targetUserId, action } = input;
  
  const userRef = db.collection('users').doc(targetUserId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new Error('User not found.');
  }

  const userData = userDoc.data()!;

  if (action === 'approve') {
    if (userData.pendingPlan) {
      await userRef.update({
        paymentStatus: 'confirmed',
      });
      await notifyAdminOfPayment({
        userId: targetUserId,
        userName: userData.name,
        userEmail: userData.email,
        planName: userData.pendingPlan,
        planPrice: userData.pendingPlan === 'premium' ? '₹500' : '₹1000',
        transactionId: `Nova${userData.pendingPlan === 'premium' ? '+' : '$'}${targetUserId.slice(0, 9).toLowerCase()}`,
        isApproval: true,
      });
    } else {
      throw new Error('User has no pending plan to approve.');
    }
  } else { // deny
    await userRef.update({
      paymentStatus: null, // Or 'denied'
      pendingPlan: null,
    });
  }
}

export async function generateStudyPlanAction(input: {
  examDate: Date;
  subjects: { name: string; chapters: string[] }[];
  userId: string;
}): Promise<string> {
  const { examDate, subjects, userId } = input;

  const aiResult = await generateStudyPlan({ examDate, subjects });

  const scheduleWithCompletion: StudyTask[] = aiResult.schedule.map(task => ({
    ...task,
    isCompleted: false,
  }));

  const newStudyPlan: StudyPlan = {
    id: uuidv4(),
    userId,
    examDate: examDate.getTime(),
    subjects,
    schedule: scheduleWithCompletion,
    createdAt: Date.now(),
  };

  const db = await getAdminDb();
  const planRef = db.collection('users').doc(userId).collection('studyPlans').doc(newStudyPlan.id);
  await planRef.set(newStudyPlan);

  return newStudyPlan.id;
}


export async function generateMostExpectedQuestionsAction(
  input: GenerateMostExpectedQuestionsInput
): Promise<GenerateMostExpectedQuestionsOutput> {
    return await generateMostExpectedQuestions(input);
}
