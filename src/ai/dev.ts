
import { config } from 'dotenv';
config();

import '@/ai/flows/track-performance-and-adapt-quiz-generation.ts';
import '@/ai/flows/generate-custom-quiz.ts';
import '@/ai/flows/grade-exam-flow.ts';
import '@/ai/flows/get-performance-report.ts';
import '@/ai/flows/notify-admin-of-payment.ts';
import '@/ai/flows/generate-study-plan.ts';
