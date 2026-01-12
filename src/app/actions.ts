
'use server';
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });

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
import type { Question, QuizAttempt } from '@/lib/types';
import { 
  getPerformanceReport,
  type GetPerformanceReportOutput
} from '@/ai/flows/get-performance-report';
import { notifyAdminOfPayment, type NotifyAdminOfPaymentInput } from '@/ai/flows/notify-admin-of-payment';

import { initializeApp, getApps, App, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { firebaseConfig } from '@/firebase/config';

let adminDb: Firestore;
let adminApp: App;

// Initialize Firebase Admin SDK only if env vars are present
if (process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
  if (!getApps().some(app => app.name === 'actions')) {
      adminApp = initializeApp({
          credential: applicationDefault(),
          projectId: firebaseConfig.projectId,
      }, 'actions');
  } else {
      adminApp = getApps().find(app => app.name === 'actions')!;
  }
  adminDb = getFirestore(adminApp);
}


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


export async function handlePaymentAction(input: { targetUserId: string, action: 'approve' | 'deny' }): Promise<void> {
  if (!adminDb) {
    throw new Error('Firebase Admin SDK not initialized. Server environment is not configured.');
  }

  const { targetUserId, action } = input;
  
  const userRef = adminDb.collection('users').doc(targetUserId);
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
