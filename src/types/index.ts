// ============================================================
// LearnQuest — Core Type Definitions
// ============================================================

export interface UserProfile {
  id: string;
  name: string;
  avatarIndex: number;
  geminiApiKey?: string;
  level: number;
  totalXP: number;
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string;
  dailyGoalMinutes: number;
  achievements: Achievement[];
  topics: LearningTopic[];
  onboardingComplete: boolean;
  createdAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
  category: "streak" | "quiz" | "completion" | "milestone";
}

export interface LearningTopic {
  id: string;
  name: string;
  description: string;
  difficulty: Difficulty;
  priorKnowledge: string;
  curriculum: CurriculumStep[];
  currentStepIndex: number;
  startedAt: string;
  lastAccessedAt: string;
  completedAt?: string;
  quizScores: QuizScore[];
  totalXPEarned: number;
}

export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface CurriculumStep {
  id: string;
  title: string;
  type: "lesson" | "quiz" | "practice";
  status: "locked" | "available" | "in-progress" | "completed";
  content?: string;
  keyTakeaways?: string[];
  xpReward: number;
  estimatedMinutes: number;
  completedAt?: string;
}

export interface QuizScore {
  stepId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  completedAt: string;
  xpEarned: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

// ============================================================
// Gemini API Request/Response Types
// ============================================================

export interface CurriculumRequest {
  topic: string;
  difficulty: Difficulty;
  priorKnowledge: string;
}

export interface CurriculumResponse {
  description: string;
  steps: Array<{
    title: string;
    type: "lesson" | "quiz";
    xpReward: number;
    estimatedMinutes: number;
  }>;
}

export interface LessonRequest {
  topic: string;
  stepTitle: string;
  difficulty: Difficulty;
  previousSteps: string[];
}

export interface LessonResponse {
  content: string;
  keyTakeaways: string[];
}

export interface QuizRequest {
  topic: string;
  lessonTitle: string;
  keyTakeaways: string[];
  difficulty: Difficulty;
}

export interface QuizResponse {
  questions: QuizQuestion[];
}

// ============================================================
// Gamification Constants
// ============================================================

export const LEVEL_THRESHOLDS: Array<{ level: number; xp: number; title: string }> = [
  { level: 1, xp: 0, title: "Novice" },
  { level: 2, xp: 100, title: "Learner" },
  { level: 3, xp: 300, title: "Scholar" },
  { level: 4, xp: 600, title: "Adept" },
  { level: 5, xp: 1000, title: "Expert" },
  { level: 6, xp: 1500, title: "Master" },
  { level: 7, xp: 2500, title: "Sage" },
  { level: 8, xp: 4000, title: "Luminary" },
  { level: 9, xp: 6000, title: "Grandmaster" },
  { level: 10, xp: 10000, title: "Legend" },
];

export const XP_REWARDS = {
  LESSON_COMPLETE: 50,
  QUIZ_PASS: 100,
  QUIZ_PERFECT: 150,
  DAILY_STREAK: 25,
  TOPIC_COMPLETE: 500,
  FIRST_LESSON: 75,
} as const;

export const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, "unlockedAt">[] = [
  { id: "first-steps", title: "First Steps", description: "Complete your first lesson", icon: "star", category: "milestone" },
  { id: "hot-streak-7", title: "Hot Streak", description: "7-day learning streak", icon: "flame", category: "streak" },
  { id: "speed-learner", title: "Speed Learner", description: "Complete 3 lessons in one day", icon: "zap", category: "milestone" },
  { id: "sharpshooter", title: "Sharpshooter", description: "3 perfect quizzes in a row", icon: "target", category: "quiz" },
  { id: "bookworm", title: "Bookworm", description: "Start 5 different topics", icon: "book-open", category: "milestone" },
  { id: "topic-master", title: "Topic Master", description: "Complete an entire topic", icon: "trophy", category: "completion" },
  { id: "perfectionist", title: "Perfectionist", description: "Score 100% on 10 quizzes", icon: "gem", category: "quiz" },
];

// ============================================================
// Avatar Options
// ============================================================

export const AVATAR_OPTIONS = [
  { index: 0, emoji: "🦊", bg: "from-orange-400 to-amber-500" },
  { index: 1, emoji: "🐱", bg: "from-purple-400 to-pink-500" },
  { index: 2, emoji: "🦉", bg: "from-blue-400 to-indigo-500" },
  { index: 3, emoji: "🐼", bg: "from-slate-400 to-zinc-500" },
  { index: 4, emoji: "🦄", bg: "from-pink-400 to-rose-500" },
  { index: 5, emoji: "🐲", bg: "from-emerald-400 to-teal-500" },
  { index: 6, emoji: "🦅", bg: "from-sky-400 to-cyan-500" },
  { index: 7, emoji: "🐺", bg: "from-violet-400 to-purple-500" },
];
