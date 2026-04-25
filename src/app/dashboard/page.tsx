"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { XPBar } from "@/components/gamification/xp-bar";
import { StreakCounter } from "@/components/gamification/streak-counter";
import { AchievementCard } from "@/components/gamification/achievement-card";
import { TopicCard } from "@/components/learning/topic-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { AVATAR_OPTIONS } from "@/types";
import { getLevelFromXP } from "@/lib/gamification";
import { Brain, Plus, BookOpen, Sparkles, Trophy, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const router = useRouter();
  const { profile, recordActivity, updateProfile } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!profile?.onboardingComplete) {
      router.replace("/onboarding");
      return;
    }
    recordActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount, not on every profile change
  }, []);

  if (!mounted || !profile) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const avatar = AVATAR_OPTIONS[profile.avatarIndex] || AVATAR_OPTIONS[0];
  const { title: levelTitle } = getLevelFromXP(profile.totalXP);
  const activeTopics = profile.topics.filter((t) => !t.completedAt);
  const completedTopics = profile.topics.filter((t) => t.completedAt);

  return (
    <div className="min-h-dvh bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg hidden sm:block">LearnQuest</span>
          </div>
          <div className="flex items-center gap-3">
            <StreakCounter streak={profile.currentStreak} />
            <ThemeToggle />
            <div className={cn("flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br text-lg", avatar.bg)}>
              {avatar.emoji}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Welcome & XP */}
        <section className="animate-slide-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                Welcome back, <span className="text-gradient">{profile.name}</span>!
              </h1>
              <p className="text-muted-foreground mt-1">
                Level {profile.level} · {levelTitle} · {profile.totalXP.toLocaleString()} XP
              </p>
            </div>
            <Button onClick={() => router.push("/onboarding")} className="gap-2 shrink-0">
              <Plus className="h-4 w-4" />
              New Topic
            </Button>
          </div>
          <Card className="p-5">
            <XPBar totalXP={profile.totalXP} />
          </Card>
        </section>

        {/* Active Topics */}
        <section className="animate-slide-up" style={{ animationDelay: "100ms" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Active Learning
            </h2>
            {activeTopics.length > 0 && (
              <Badge variant="secondary">{activeTopics.length} topic{activeTopics.length !== 1 ? "s" : ""}</Badge>
            )}
          </div>

          {activeTopics.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeTopics.map((topic) => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  onClick={() => router.push(`/learn/${topic.id}`)}
                />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-1">No active topics</h3>
              <p className="text-sm text-muted-foreground mb-4">Start learning something new!</p>
              <Button onClick={() => router.push("/onboarding")} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Topic
              </Button>
            </Card>
          )}
        </section>

        {/* Completed Topics */}
        {completedTopics.length > 0 && (
          <section className="animate-slide-up" style={{ animationDelay: "200ms" }}>
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-accent" />
              Completed
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedTopics.map((topic) => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  onClick={() => router.push(`/learn/${topic.id}`)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Achievements */}
        <section className="animate-slide-up" style={{ animationDelay: "300ms" }}>
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-xp-gold" />
            Achievements
            <Badge variant="xp">{profile.achievements.length}</Badge>
          </h2>
          {profile.achievements.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {profile.achievements.map((a) => (
                <AchievementCard key={a.id} achievement={a} />
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Complete lessons and quizzes to unlock achievements!
              </p>
            </Card>
          )}
        </section>

        {/* Quick Stats */}
        <section className="animate-slide-up" style={{ animationDelay: "400ms" }}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Topics Started", value: profile.topics.length, icon: BookOpen },
              { label: "Lessons Done", value: profile.topics.reduce((s, t) => s + t.curriculum.filter((c) => c.status === "completed" && c.type === "lesson").length, 0), icon: Sparkles },
              { label: "Quizzes Passed", value: profile.topics.reduce((s, t) => s + t.quizScores.length, 0), icon: Trophy },
              { label: "Longest Streak", value: `${profile.longestStreak} days`, icon: Brain },
            ].map((stat) => (
              <Card key={stat.label} className="p-4 text-center">
                <stat.icon className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
