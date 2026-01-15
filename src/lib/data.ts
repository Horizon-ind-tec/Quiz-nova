
import type { LucideIcon } from 'lucide-react';
import { Calculator, Atom, FlaskConical, Leaf, Scroll, Globe, Scale, Landmark, Rocket, Microscope, Presentation, Plane, Cpu, BrainCircuit, Palette, Briefcase } from 'lucide-react';

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
    subCategories: [
      { name: 'Basic', description: 'Core concepts and fundamentals.' },
      { name: 'Advance', description: 'Complex topics and problem-solving.' }
    ]
  },
  {
    name: 'Science',
    icon: Microscope,
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
      { name: 'Politics/Civics', }
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
    subCategories: [
        { name: 'Computer Science' },
        { name: 'Information Practices' }
    ]
  },
  {
    name: 'AI',
    icon: BrainCircuit,
    subCategories: [
        { name: 'Basics', description: 'Fundamental concepts of AI.' },
        { name: 'Advanced', description: 'In-depth topics and theories.' }
    ]
  },
  {
    name: 'Art',
    icon: Palette,
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
