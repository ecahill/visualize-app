export interface User {
  id: string;
  name: string;
  email: string;
  joinDate: Date;
  streakDays: number;
}

export interface Affirmation {
  id: string;
  text: string;
  category: 'love' | 'abundance' | 'success' | 'health' | 'confidence' | 'growth';
  isFavorite: boolean;
  createdAt: Date;
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood: 1 | 2 | 3 | 4 | 5;
  gratitudeItems: string[];
  manifestationGoals: string[];
  createdAt: Date;
  tags: string[];
}

export interface VisionBoardItem {
  id: string;
  title: string;
  description?: string;
  imageUri?: string;
  category: 'career' | 'relationships' | 'health' | 'travel' | 'material' | 'personal';
  priority: 'low' | 'medium' | 'high';
  targetDate?: Date;
  isAchieved: boolean;
  createdAt: Date;
}

export interface DailyRitual {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  category: 'meditation' | 'visualization' | 'gratitude' | 'affirmation' | 'journaling';
  isCompleted: boolean;
  completedAt?: Date;
}

export interface RitualTemplate {
  id: string;
  name: string;
  description: string;
  steps: string[];
  duration: number;
  category: DailyRitual['category'];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface ManifestationGoal {
  id: string;
  title: string;
  description: string;
  category: VisionBoardItem['category'];
  targetDate: Date;
  steps: string[];
  isAchieved: boolean;
  createdAt: Date;
}

export interface DailyProgress {
  date: string; // YYYY-MM-DD format
  ritualsCompleted: number;
  journalWritten: boolean;
  affirmationsRead: boolean;
  visionBoardViewed: boolean;
  mood: 1 | 2 | 3 | 4 | 5;
}