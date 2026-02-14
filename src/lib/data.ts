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

// ===== AURA LEVEL SYSTEM DATA =====
export const AURA_LEVELS = [
  { level: 1, min: 0, rank: 'Bronze' },
  { level: 2, min: 100, rank: 'Bronze' },
  { level: 3, min: 250, rank: 'Bronze' },
  { level: 4, min: 450, rank: 'Bronze' },
  { level: 5, min: 700, rank: 'Bronze' },
  { level: 6, min: 1000, rank: 'Silver' },
  { level: 7, min: 1350, rank: 'Silver' },
  { level: 8, min: 1750, rank: 'Silver' },
  { level: 9, min: 2200, rank: 'Silver' },
  { level: 10, min: 2700, rank: 'Silver' },
  { level: 11, min: 3300, rank: 'Platinum' },
  { level: 12, min: 4000, rank: 'Platinum' },
  { level: 13, min: 4800, rank: 'Platinum' },
  { level: 14, min: 5700, rank: 'Platinum' },
  { level: 15, min: 6700, rank: 'Platinum' },
  { level: 16, min: 7800, rank: 'Gold' },
  { level: 17, min: 9000, rank: 'Gold' },
  { level: 18, min: 10300, rank: 'Gold' },
  { level: 19, min: 11700, rank: 'Gold' },
  { level: 20, min: 13200, rank: 'Gold' },
  { level: 21, min: 15000, rank: 'Ruby' },
  { level: 22, min: 17000, rank: 'Ruby' },
  { level: 23, min: 19200, rank: 'Ruby' },
  { level: 24, min: 21700, rank: 'Ruby' },
  { level: 25, min: 24500, rank: 'Ruby' },
] as const;

export type UserRank = (typeof AURA_LEVELS)[number]['rank'];

export function getAuraStatus(points: number) {
  let currentLevel = AURA_LEVELS[0];
  for (let i = 0; i < AURA_LEVELS.length; i++) {
    if (points >= AURA_LEVELS[i].min) {
      currentLevel = AURA_LEVELS[i];
    } else {
      break;
    }
  }
  
  const nextLevelIndex = AURA_LEVELS.findIndex(l => l.level === currentLevel.level + 1);
  const nextLevel = nextLevelIndex !== -1 ? AURA_LEVELS[nextLevelIndex] : null;
  
  return {
    level: currentLevel.level,
    rank: currentLevel.rank as UserRank,
    min: currentLevel.min,
    nextMin: nextLevel ? nextLevel.min : currentLevel.min + 5000,
    isMax: !nextLevel
  };
}
