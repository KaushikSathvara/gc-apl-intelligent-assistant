import {
  LEVEL_THRESHOLDS,
  XP_REWARDS,
  ACHIEVEMENT_DEFINITIONS,
  type Achievement,
  type UserProfile,
  type QuizScore,
} from "@/types";

export function getLevelFromXP(xp: number): { level: number; title: string } {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i].xp) {
      return { level: LEVEL_THRESHOLDS[i].level, title: LEVEL_THRESHOLDS[i].title };
    }
  }
  return { level: 1, title: "Novice" };
}

export function getLevelProgress(xp: number) {
  const { level } = getLevelFromXP(xp);
  const cur = LEVEL_THRESHOLDS.find((t) => t.level === level)!;
  const nxt = LEVEL_THRESHOLDS.find((t) => t.level === level + 1);
  if (!nxt) return { current: 0, required: 0, percentage: 100, nextLevelTitle: "Max Level" };
  const current = xp - cur.xp;
  const required = nxt.xp - cur.xp;
  return { current, required, percentage: Math.min(Math.round((current / required) * 100), 100), nextLevelTitle: nxt.title };
}

export function calculateQuizXP(score: number, total: number): number {
  const pct = (score / total) * 100;
  if (pct === 100) return XP_REWARDS.QUIZ_PERFECT;
  if (pct >= 70) return XP_REWARDS.QUIZ_PASS;
  return Math.round(XP_REWARDS.QUIZ_PASS * (pct / 100) * 0.5);
}

export function updateStreak(profile: UserProfile) {
  const today = new Date().toISOString().split("T")[0];
  if (profile.lastActiveDate === today) {
    return { currentStreak: profile.currentStreak, longestStreak: profile.longestStreak, streakBroken: false };
  }
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (profile.lastActiveDate === yesterday.toISOString().split("T")[0]) {
    const ns = profile.currentStreak + 1;
    return { currentStreak: ns, longestStreak: Math.max(ns, profile.longestStreak), streakBroken: false };
  }
  return { currentStreak: 1, longestStreak: profile.longestStreak, streakBroken: profile.currentStreak > 0 };
}

export function checkAchievements(profile: UserProfile): Achievement[] {
  const unlockedIds = new Set(profile.achievements.map((a) => a.id));
  const newAchievements: Achievement[] = [];
  const now = new Date().toISOString();
  const today = now.split("T")[0];

  const totalLessons = profile.topics.reduce(
    (s, t) => s + t.curriculum.filter((c) => c.status === "completed" && c.type === "lesson").length, 0
  );
  const totalPerfect = profile.topics.reduce(
    (s, t) => s + t.quizScores.filter((q) => q.score === q.totalQuestions).length, 0
  );
  const completedTopics = profile.topics.filter((t) => t.completedAt).length;
  const todayLessons = profile.topics.reduce(
    (s, t) => s + t.curriculum.filter((c) => c.type === "lesson" && c.completedAt?.startsWith(today)).length, 0
  );

  const allScores: QuizScore[] = profile.topics.flatMap((t) => t.quizScores).sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  let consPerf = 0;
  for (const sc of allScores) { if (sc.score === sc.totalQuestions) consPerf++; else break; }

  const checks = [
    { id: "first-steps", cond: totalLessons >= 1 },
    { id: "hot-streak-7", cond: profile.currentStreak >= 7 },
    { id: "speed-learner", cond: todayLessons >= 3 },
    { id: "sharpshooter", cond: consPerf >= 3 },
    { id: "bookworm", cond: profile.topics.length >= 5 },
    { id: "topic-master", cond: completedTopics >= 1 },
    { id: "perfectionist", cond: totalPerfect >= 10 },
  ];

  for (const { id, cond } of checks) {
    if (cond && !unlockedIds.has(id)) {
      const def = ACHIEVEMENT_DEFINITIONS.find((a) => a.id === id);
      if (def) newAchievements.push({ ...def, unlockedAt: now });
    }
  }
  return newAchievements;
}
