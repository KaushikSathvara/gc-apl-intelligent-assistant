"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sparkles, BookOpen, Trophy, Brain, Zap, Target, ArrowRight } from "lucide-react";

export default function LandingPage() {
  const profile = useAppStore((s) => s.profile);
  const router = useRouter();

  useEffect(() => {
    if (profile?.onboardingComplete) {
      router.replace("/dashboard");
    }
  }, [profile, router]);

  return (
    <div className="min-h-dvh bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">LearnQuest</span>
        </div>
        <ThemeToggle />
      </header>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-16 pb-24 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-muted-foreground mb-8 animate-fade-in">
          <Sparkles className="h-4 w-4 text-xp-gold" />
          Powered by Gemini AI
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 animate-slide-up">
          Learn Anything,{" "}
          <span className="text-gradient">Master Everything</span>
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mb-10 animate-slide-up" style={{ animationDelay: "100ms" }}>
          Your AI-powered learning companion that creates personalized curricula,
          interactive quizzes, and tracks your progress with a gamified experience.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 animate-slide-up" style={{ animationDelay: "200ms" }}>
          <Button
            size="xl"
            onClick={() => router.push("/onboarding")}
            className="gap-2 group"
          >
            Start Learning
            <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
          </Button>
          {profile && !profile.onboardingComplete && (
            <Button variant="ghost" size="lg" onClick={() => router.push("/onboarding")}>
              Continue Setup
            </Button>
          )}
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-20 w-full animate-slide-up" style={{ animationDelay: "400ms" }}>
          {[
            {
              icon: BookOpen,
              title: "AI-Generated Lessons",
              desc: "Personalized content tailored to your level and pace",
            },
            {
              icon: Target,
              title: "Interactive Quizzes",
              desc: "Test your knowledge with smart, adaptive questions",
            },
            {
              icon: Trophy,
              title: "Gamified Progress",
              desc: "Earn XP, level up, unlock achievements, and maintain streaks",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center transition-all duration-300 hover:shadow-lg hover:border-primary/20"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 mt-16 text-center animate-slide-up" style={{ animationDelay: "600ms" }}>
          {[
            { icon: Zap, value: "10+", label: "Levels" },
            { icon: Sparkles, value: "∞", label: "Topics" },
            { icon: Trophy, value: "7+", label: "Achievements" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1">
              <stat.icon className="h-5 w-5 text-muted-foreground mb-1" />
              <span className="text-2xl font-bold">{stat.value}</span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
