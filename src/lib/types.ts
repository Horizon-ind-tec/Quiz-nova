export interface Question {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  userAnswer?: string;
}

export interface Quiz {
  id: string;
  subject: string;
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
  userAnswers: string[];
  completedAt: number;
}
