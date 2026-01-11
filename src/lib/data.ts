import type { LucideIcon } from 'lucide-react';
import { Calculator, Atom, FlaskConical, Leaf, Scroll, Globe, Scale, Landmark, Rocket, Microscope, Presentation, Plane } from 'lucide-react';

export const CLASSES = ['7th', '8th', '9th', '10th', '11th', '12th'];

export const SUBJECTS_DATA: { 
  name: string; 
  icon: LucideIcon;
  subCategories?: { name: string; description?: string }[];
}[] = [
  { 
    name: 'Mathematics', 
    icon: Calculator,
    subCategories: [
      { name: 'Math', description: 'Core concepts and fundamentals.' },
      { name: 'Advance Math', description: 'Complex topics and problem-solving.' }
    ]
  },
  {
    name: 'Science',
    icon: Microscope,
    subCategories: [
      { name: 'Physics' },
      { name: 'Chemistry' },
      { name: 'Biology' }
    ]
  },
  {
    name: 'Social Science',
    icon: Landmark,
    subCategories: [
      { name: 'History' },
      { name: 'Geography' },
      { name: 'Politics/Civics', }
    ]
  },
  {
    name: 'Astronomy',
    icon: Rocket,
    subCategories: [
      { name: 'Basics', description: 'Fundamental concepts of astronomy.' },
      { name: 'Advance', description: 'In-depth topics and theories.' }
    ]
  },
  { name: 'General Knowledge', icon: Globe },
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
  { value: 'exam', label: 'Exam (30 Questions)' },
];
