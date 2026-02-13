export interface MCQ {
  type: 'mcq';
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  marks: number;
}

export interface Match {
  type: 'match';
  question: string;
  pairs: { item: string; match: string }[];
  explanation:string;
  marks: number;
}

export interface Numerical {
  type: 'numerical';
  question: string;
  correctAnswer: number;
  explanation: string;
  marks: number;
}

export interface ShortAnswer {
  type: 'shortAnswer';
  question: string;
  correctAnswer: string;
  explanation: string;
  marks: number;
}

export interface LongAnswer {
  type: 'longAnswer';
  question: string;
  correctAnswer: string; // Model answer
  explanation: string;
  marks: number;
}


export type Question = MCQ | Match | Numerical | ShortAnswer | LongAnswer;


export type UserAnswers = {
  [questionIndex: number]: string | { [key: string]: string };
};


export interface Quiz {
  id: string;
  subject: string;
  subCategory?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  class: string;
  board?: string;
  chapter?: string;
  quizType: 'quiz' | 'exam';
  ncert?: boolean;
  totalMarks: number;
  timeLimit?: number; // Time limit in seconds
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
    views?: number;
    likes?: string[];
}

export interface Comment {
    id: string;
    userId: string;
    userName: string;
    text: string;
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
    createdAt: string;
    plan: 'free' | 'premium' | 'ultimate';
    paymentStatus?: 'pending' | 'confirmed';
    pendingPlan?: 'premium' | 'ultimate';
    // Gamification fields
    points: number;
    streak: number;
    lastActiveDate?: string; // ISO Date
    rank: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
}

export interface StudyTask {
  date: string; // YYYY-MM-DD
  subject: string;
  chapter: string;
  isCompleted: boolean;
}

export interface StudyPlan {
  id: string;
  userId: string;
  examDate: number; // timestamp
  subjects: {
    name: string;
    chapters: string[];
  }[];
  schedule: StudyTask[];
  createdAt: number; // timestamp
}

export interface SupportRequest {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    message: string;
    type: 'refund' | 'general' | 'bug';
    status: 'pending' | 'resolved';
    createdAt: number;
}
