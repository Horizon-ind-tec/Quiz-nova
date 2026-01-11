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
  score: number;
  userAnswers: UserAnswers;
  completedAt: number;
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
