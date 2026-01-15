
export interface MCQ {
  type: 'mcq';
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface Match {
  type: 'match';
  question: string;
  pairs: { item: string; match: string }[];
  explanation: string;
}

export interface Numerical {
  type: 'numerical';
  question: string;
  correctAnswer: number;
  explanation: string;
}


export type Question = MCQ | Match | Numerical;


export type UserAnswers = {
  [questionIndex: number]: string | { [key: string]: string };
};


export interface Quiz {
  id: string;
  subject: string;
  subCategory?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  class: string;
  board: string;
  chapter?: string;
  quizType: 'quiz' | 'exam';
  ncert?: boolean;
  questions: Question[];
  createdAt: number;
}

export interface QuizAttempt extends Quiz {
  userId: string;
  score: number;
  userAnswers: UserAnswers;
  completedAt: number;
  completionTime: number;
}


// Types for the AI Grading Flow
export interface GradedAnswer {
  questionIndex: number;
  userAnswer: string;
  isCorrect: boolean;
}

export interface GradeExamOutput {
  score: number;
  gradedAnswers: GradedAnswer[];
  generalFeedback: string;
}

// Video Coaching Types
export interface Video {
    id: string;
    class: string;
    subject: string;
    subCategory?: string;
    chapter: string;
    title: string;
    youtubeUrl: string;
    createdAt: number;
}

export interface Subject {
    id: string;
    name: string;
}

export interface Chapter {
    id: string;
    name: string;
    subjectId: string;
}


export interface UserProfile {
    id: string;
    email: string;
    name: string;
    createdAt: number;
    plan: 'free' | 'premium' | 'ultimate';
    paymentStatus?: 'pending' | 'confirmed';
    pendingPlan?: 'premium' | 'ultimate';
}
