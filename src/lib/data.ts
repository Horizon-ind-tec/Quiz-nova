import type { LucideIcon } from 'lucide-react';
import { Calculator, Atom, FlaskConical, Leaf, Scroll, Globe } from 'lucide-react';

export const CLASSES = ['7th', '8th', '9th', '10th', '11th', '12th'];

export const SUBJECTS_DATA: { name: string; icon: LucideIcon }[] = [
  { name: 'Mathematics', icon: Calculator },
  { name: 'Physics', icon: Atom },
  { name: 'Chemistry', icon: FlaskConical },
  { name: 'Biology', icon: Leaf },
  { name: 'History', icon: Scroll },
  { name: 'Geography', icon: Globe },
];

export const SUBJECTS = SUBJECTS_DATA.map(s => s.name);


export const BOARDS = ['CBSE', 'ICSE', 'State Board'];
export const DIFFICULTIES = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];
export const QUIZ_TYPES = [
  { value: 'quiz', label: 'Quiz (5 Questions)' },
  { value: 'exam', label: 'Exam (10 Questions)' },
];
