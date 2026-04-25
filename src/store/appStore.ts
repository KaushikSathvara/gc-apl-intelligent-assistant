import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserProfile, LearningTopic, CurriculumStep, Achievement, QuizScore } from "@/types";
import { XP_REWARDS } from "@/types";
import { getLevelFromXP, updateStreak, checkAchievements } from "@/lib/gamification";

interface AppState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;

  // Profile actions
  createProfile: (name: string, avatarIndex: number, dailyGoalMinutes: number, geminiApiKey?: string) => void;
  setApiKey: (key: string) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;

  // Topic actions
  addTopic: (topic: LearningTopic) => void;
  updateTopic: (topicId: string, updates: Partial<LearningTopic>) => void;
  removeTopic: (topicId: string) => void;

  // Curriculum actions
  updateStep: (topicId: string, stepId: string, updates: Partial<CurriculumStep>) => void;
  completeLesson: (topicId: string, stepId: string, content: string, keyTakeaways: string[]) => void;
  completeQuiz: (topicId: string, stepId: string, score: QuizScore) => void;

  // Gamification
  addXP: (amount: number) => void;
  recordActivity: () => void;
  unlockAchievement: (achievement: Achievement) => void;

  // UI state
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      profile: null,
      isLoading: false,
      error: null,

      createProfile: (name, avatarIndex, dailyGoalMinutes, geminiApiKey) => {
        const profile: UserProfile = {
          id: crypto.randomUUID(),
          name,
          avatarIndex,
          geminiApiKey: geminiApiKey || undefined,
          level: 1,
          totalXP: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastActiveDate: "",
          dailyGoalMinutes,
          achievements: [],
          topics: [],
          onboardingComplete: false,
          createdAt: new Date().toISOString(),
        };
        set({ profile });
      },

      setApiKey: (key) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, geminiApiKey: key || undefined } : null,
        })),

      updateProfile: (updates) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...updates } : null,
        })),

      addTopic: (topic) =>
        set((state) => {
          if (!state.profile) return state;
          return {
            profile: {
              ...state.profile,
              topics: [...state.profile.topics, topic],
            },
          };
        }),

      updateTopic: (topicId, updates) =>
        set((state) => {
          if (!state.profile) return state;
          return {
            profile: {
              ...state.profile,
              topics: state.profile.topics.map((t) =>
                t.id === topicId ? { ...t, ...updates } : t
              ),
            },
          };
        }),

      removeTopic: (topicId) =>
        set((state) => {
          if (!state.profile) return state;
          return {
            profile: {
              ...state.profile,
              topics: state.profile.topics.filter((t) => t.id !== topicId),
            },
          };
        }),

      updateStep: (topicId, stepId, updates) =>
        set((state) => {
          if (!state.profile) return state;
          return {
            profile: {
              ...state.profile,
              topics: state.profile.topics.map((t) =>
                t.id === topicId
                  ? {
                      ...t,
                      curriculum: t.curriculum.map((s) =>
                        s.id === stepId ? { ...s, ...updates } : s
                      ),
                    }
                  : t
              ),
            },
          };
        }),

      completeLesson: (topicId, stepId, content, keyTakeaways) => {
        const state = get();
        if (!state.profile) return;

        const topic = state.profile.topics.find((t) => t.id === topicId);
        if (!topic) return;

        const stepIndex = topic.curriculum.findIndex((s) => s.id === stepId);
        const step = topic.curriculum[stepIndex];
        if (!step) return;

        const isFirst = state.profile.topics.every((t) =>
          t.curriculum.every((s) => s.status !== "completed" || s.type !== "lesson")
        );

        const xp = step.xpReward + (isFirst ? XP_REWARDS.FIRST_LESSON : 0);

        const updatedCurriculum = topic.curriculum.map((s, i) => {
          if (s.id === stepId) {
            return { ...s, status: "completed" as const, content, keyTakeaways, completedAt: new Date().toISOString() };
          }
          if (i === stepIndex + 1 && s.status === "locked") {
            return { ...s, status: "available" as const };
          }
          return s;
        });

        const allCompleted = updatedCurriculum.every((s) => s.status === "completed");

        set((st) => {
          if (!st.profile) return st;
          const newXP = st.profile.totalXP + xp;
          const { level } = getLevelFromXP(newXP);
          const updatedProfile: UserProfile = {
            ...st.profile,
            totalXP: newXP,
            level,
            topics: st.profile.topics.map((t) =>
              t.id === topicId
                ? {
                    ...t,
                    curriculum: updatedCurriculum,
                    currentStepIndex: Math.min(stepIndex + 1, updatedCurriculum.length - 1),
                    totalXPEarned: t.totalXPEarned + xp,
                    lastAccessedAt: new Date().toISOString(),
                    completedAt: allCompleted ? new Date().toISOString() : undefined,
                  }
                : t
            ),
          };

          const newAchievements = checkAchievements(updatedProfile);
          if (newAchievements.length > 0) {
            updatedProfile.achievements = [...updatedProfile.achievements, ...newAchievements];
          }
          if (allCompleted) {
            updatedProfile.totalXP += XP_REWARDS.TOPIC_COMPLETE;
          }

          return { profile: updatedProfile };
        });
      },

      completeQuiz: (topicId, stepId, score) => {
        const state = get();
        if (!state.profile) return;

        const topic = state.profile.topics.find((t) => t.id === topicId);
        if (!topic) return;

        const stepIndex = topic.curriculum.findIndex((s) => s.id === stepId);

        const updatedCurriculum = topic.curriculum.map((s, i) => {
          if (s.id === stepId) {
            return { ...s, status: "completed" as const, completedAt: new Date().toISOString() };
          }
          if (i === stepIndex + 1 && s.status === "locked") {
            return { ...s, status: "available" as const };
          }
          return s;
        });

        const allCompleted = updatedCurriculum.every((s) => s.status === "completed");

        set((st) => {
          if (!st.profile) return st;
          const newXP = st.profile.totalXP + score.xpEarned;
          const { level } = getLevelFromXP(newXP);
          const updatedProfile: UserProfile = {
            ...st.profile,
            totalXP: newXP,
            level,
            topics: st.profile.topics.map((t) =>
              t.id === topicId
                ? {
                    ...t,
                    curriculum: updatedCurriculum,
                    currentStepIndex: Math.min(stepIndex + 1, updatedCurriculum.length - 1),
                    quizScores: [...t.quizScores, score],
                    totalXPEarned: t.totalXPEarned + score.xpEarned,
                    lastAccessedAt: new Date().toISOString(),
                    completedAt: allCompleted ? new Date().toISOString() : undefined,
                  }
                : t
            ),
          };

          const newAchievements = checkAchievements(updatedProfile);
          if (newAchievements.length > 0) {
            updatedProfile.achievements = [...updatedProfile.achievements, ...newAchievements];
          }
          if (allCompleted) {
            updatedProfile.totalXP += XP_REWARDS.TOPIC_COMPLETE;
          }

          return { profile: updatedProfile };
        });
      },

      addXP: (amount) =>
        set((state) => {
          if (!state.profile) return state;
          const newXP = state.profile.totalXP + amount;
          const { level } = getLevelFromXP(newXP);
          return { profile: { ...state.profile, totalXP: newXP, level } };
        }),

      recordActivity: () =>
        set((state) => {
          if (!state.profile) return state;
          const streak = updateStreak(state.profile);
          return {
            profile: {
              ...state.profile,
              lastActiveDate: new Date().toISOString().split("T")[0],
              currentStreak: streak.currentStreak,
              longestStreak: streak.longestStreak,
            },
          };
        }),

      unlockAchievement: (achievement) =>
        set((state) => {
          if (!state.profile) return state;
          if (state.profile.achievements.some((a) => a.id === achievement.id)) return state;
          return {
            profile: {
              ...state.profile,
              achievements: [...state.profile.achievements, achievement],
            },
          };
        }),

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: "learnquest-storage",
      version: 1,
    }
  )
);
