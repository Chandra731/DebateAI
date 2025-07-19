import { Timestamp } from 'firebase/firestore';

export interface Profile {
  id: string;
  email: string;
  name: string;
  photoURL?: string;
  xp?: number;
  level?: number;
  streak?: number;
  last_practiced_at?: string;
  created_at?: Timestamp;
  updated_at?: Timestamp;
  school?: string;
  friends?: string[];
  total_debates: number;
  wins: number;
  grade?: string;
  isAdmin?: boolean;
}

export interface Topic {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty_level: number;
  is_active: boolean;
  created_at: Timestamp;
}

export interface Case {
  id: string;
  user_id: string;
  topic_id: string;
  title: string;
  content: string;
  created_at: Timestamp;
}

export interface Debate {
  id: string;
  user_id: string;
  topic_id: string;
  topic_title: string;
  user_side: 'pro' | 'con';
  format: string;
  status: 'active' | 'completed';
  transcript: { speaker: string; text: string; timestamp: string }[];
  winner?: 'user' | 'ai';
  created_at: Timestamp;
  score?: number;
  is_ai?: boolean;
  ai_level?: number;
  winner_side?: 'pro' | 'con';
  side?: 'pro' | 'con';
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: string;
  is_active: boolean;
  icon: string;
  xp_reward: number;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  created_at: Timestamp;
  achievements: Achievement;
  unlocked_at?: string;
  progress?: number;
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
  display_order: number;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar_url: string;
  quote: string;
  display_order: number;
}

export interface Statistics {
  total_users: number;
  debates_completed: number;
  skills_mastered: number;
  improvementRate: number;
}

export interface GroqCompletionResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export interface ExerciseEvaluation {
  verdict: 'correct' | 'partial' | 'incorrect';
  explanation: string;
  improvement_advice: string[];
  skill_score: number;
}

export interface DebateCase {
  framing: string;
  contentions: {
    title: string;
    description: string;
    evidence: string;
  }[];
  rebuttals: string[];
  examples: string[];
  burdenAnalysis: string;
  fallacyChecks: string[];
}

export interface SkillCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  display_order: number;
  is_active: boolean;
  skills?: Skill[];
}

export interface Skill {
  id: string;
  category_id: string;
  name: string;
  description: string;
  icon: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  xp_reward: number;
  mastery_threshold: number;
  display_order: number;
  is_active: boolean;
  prerequisites?: { prerequisite_skill_id: string }[];
}

export interface UserSkillProgress {
  id?: string; // Firestore auto-generates ID for new docs
  user_id: string;
  skill_id: string;
  mastery_level: number;
  is_unlocked: boolean;
  is_mastered: boolean;
  total_xp_earned: number;
  lessons_completed: number;
  exercises_completed: number;
  first_unlocked_at?: string;
  mastered_at?: string;
  last_practiced_at?: string;
}

export interface Lesson {
  id: string;
  skill_id: string;
  category_id: string; // Added category_id
  title: string;
  description: string;
  content: LessonSection[]; // Now an array of structured sections
  learning_objectives: string[];
  estimated_duration: number;
  display_order: number;
  is_active: boolean;
}

export interface LessonSection {
  type: 'text' | 'quiz';
  title?: string;
  content?: string; // For text sections
  quiz?: QuizQuestion[]; // Now an array of quiz questions
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
}


export interface Exercise {
  id: string;
  lesson_id: string;
  title: string;
  type: 'mcq' | 'text_input' | 'speech_analysis' | 'drag_and_drop' | 'rebuttal_practice' | 'fallacy_identification';
  content: any;
  correct_answer?: any;
  ai_evaluation_prompt: string;
  max_attempts: number;
  passing_score: number;
  xp_reward: number;
  display_order: number;
  is_active: boolean;
}

export interface ExerciseAttempt {
  id?: string;
  user_id: string;
  exercise_id: string;
  attempt_number: number;
  user_answer: any;
  score: number;
  is_correct: boolean;
  ai_feedback: any;
  time_spent: number;
  completed_at: string;
}

export interface AIFeedback {
  verdict: 'correct' | 'incorrect' | 'partial';
  explanation: string;
  improvement_advice: string[];
  skill_score: number;
  unlock_next_skill: boolean;
  detailed_analysis?: any;
  mini_lessons?: MiniLesson[];
}

export interface MiniLesson {
  title: string;
  content: string;
  quiz: Quiz;
}

export interface Quiz {
  question: string;
  options: string[];
  correct_answer: string;
}

export interface UserLearningGoals {
  user_id: string;
  goals: string[];
  updated_at: string;
}

export interface LearningAnalytics {
  totalSkillsUnlocked: number;
  totalSkillsMastered: number;
  totalLessonsCompleted: number;
  totalExercisesAttempted: number;
  averageScore: number;
  totalXPEarned: number;
  skillProgress: (UserSkillProgress & { skill?: Skill })[];
  recentActivity: (any)[];
}
