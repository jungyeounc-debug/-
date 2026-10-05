export type PersonaId = 'ruda' | 'sori' | 'hajin';

export interface Persona {
  id: PersonaId;
  name: string;
  tagline: string;
  avatar: string;
  badge: string;
  color: string;
  accentBg: string;
  description: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  emotionalTemperature?: number;
  detectedEmotion?: string;
  comfortQuote?: string;
  followUpQuestions?: string[];
}

export interface CourseStop {
  step: number;
  name: string;
  category: string;
  time: string;
  description: string;
  recommendedItem: string;
  estimatedCost: string;
  soloOrCoupleTip: string;
  searchKeyword: string;
}

export interface DateCourse {
  id: string;
  title: string;
  subtitle: string;
  mode: 'solo' | 'romance';
  region: string;
  vibe: string;
  totalEstimatedCost: string;
  totalDuration: string;
  summary: string;
  tips: string;
  stops: CourseStop[];
  createdAt: string;
}

export interface SavedItem {
  id: string;
  type: 'course' | 'quote';
  title: string;
  content: string;
  date: string;
  courseData?: DateCourse;
}
