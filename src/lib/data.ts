
import type { LucideIcon } from 'lucide-react';
import { Calculator, Atom, Scroll, Globe, Landmark, Cpu, BrainCircuit, Palette, Briefcase } from 'lucide-react';

export const CLASSES = ['7th', '8th', '9th', '10th', '11th', '12th', 'JEE (Mains + Advanced)', 'NEET'];

export const SUBJECTS_DATA: { 
  name: string; 
  icon: LucideIcon;
  multiSelect?: boolean;
  subCategories?: { name: string; description?: string }[];
}[] = [
  { 
    name: 'Mathematics', 
    icon: Calculator,
    multiSelect: true,
    subCategories: [
      { name: 'Basic', description: 'Core concepts and fundamentals.' },
      { name: 'Advance', description: 'Complex topics and problem-solving.' }
    ]
  },
  { 
    name: 'Science', 
    icon: Atom,
    multiSelect: true,
    subCategories: [
      { name: 'Physics' },
      { name: 'Chemistry' },
      { name: 'Biology' }
    ]
  },
  { 
    name: 'Social Science', 
    icon: Landmark,
    multiSelect: true,
    subCategories: [
      { name: 'History' },
      { name: 'Geography' },
      { name: 'Civics' }
    ]
  },
  {
    name: 'English',
    icon: Scroll,
    multiSelect: true,
    subCategories: [
        { name: 'English' },
        { name: 'Supplementary' }
    ]
  },
  {
    name: 'Hindi',
    icon: Scroll,
    multiSelect: true,
    subCategories: [
        { name: 'Hindi' },
        { name: 'Supplementary' }
    ]
  },
  {
    name: 'Commerce',
    icon: Briefcase,
    multiSelect: true,
    subCategories: [
        { name: 'Accountancy' },
        { name: 'Business Studies' },
        { name: 'Economics' }
    ]
  },
  {
    name: 'Computer',
    icon: Cpu,
    multiSelect: true,
    subCategories: [
        { name: 'Computer Science' },
        { name: 'Information Practices' }
    ]
  },
  {
    name: 'AI',
    icon: BrainCircuit,
    multiSelect: true,
    subCategories: [
        { name: 'Basics', description: 'Fundamental concepts of AI.' },
        { name: 'Advanced', description: 'In-depth topics and theories.' }
    ]
  },
  {
    name: 'Art',
    icon: Palette,
    multiSelect: true,
     subCategories: [
        { name: 'Painting' },
        { name: 'Sculpture' },
        { name: 'History of Art' }
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
