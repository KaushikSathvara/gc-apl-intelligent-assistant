"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CurriculumStep } from "@/components/learning/curriculum-step";
import { ArrowLeft, ArrowRight, Sparkles, CheckCircle, Brain, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

export default function LearnPage({ params }: { params: Promise<{ topicId: string }> }) {
  const { topicId } = use(params);
  const router = useRouter();
  const { profile, completeLesson, updateStep } = useAppStore();
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [lessonContent, setLessonContent] = useState<string>("");
  const [keyTakeaways, setKeyTakeaways] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [mounted, setMounted] = useState(false);

  const topic = profile?.topics.find((t) => t.id === topicId);

  useEffect(() => {
    setMounted(true);
    if (!profile?.onboardingComplete) {
      router.replace("/onboarding");
      return;
    }
    if (topic) {
      const current = topic.curriculum[topic.currentStepIndex];
      if (current && current.status !== "locked") {
        setActiveStepId(current.id);
        if (current.content) {
          setLessonContent(current.content);
          setKeyTakeaways(current.keyTakeaways || []);
        }
      }
    }
  }, [profile, router, topicId]);

  if (!mounted || !profile || !topic) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const activeStep = topic.curriculum.find((s) => s.id === activeStepId);
  const completed = topic.curriculum.filter((s) => s.status === "completed").length;

  const loadLesson = async (stepId: string) => {
    const step = topic.curriculum.find((s) => s.id === stepId);
    if (!step || step.type !== "lesson") return;

    if (step.content) {
      setLessonContent(step.content);
      setKeyTakeaways(step.keyTakeaways || []);
      setActiveStepId(stepId);
      return;
    }

    setIsLoading(true);
    setActiveStepId(stepId);
    updateStep(topicId, stepId, { status: "in-progress" });

    try {
      const previousSteps = topic.curriculum
        .filter((s) => s.status === "completed" && s.type === "lesson")
        .map((s) => s.title);

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (profile?.geminiApiKey) headers["x-gemini-key"] = profile.geminiApiKey;

      const res = await fetch("/api/generate-lesson", {
        method: "POST",
        headers,
        body: JSON.stringify({
          topic: topic.name,
          stepTitle: step.title,
          difficulty: topic.difficulty,
          previousSteps,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate lesson");
      const data = await res.json();
      setLessonContent(data.content);
      setKeyTakeaways(data.keyTakeaways || []);
    } catch {
      setLessonContent("### Error\nFailed to load lesson. Please check your API key and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepClick = (step: typeof topic.curriculum[0]) => {
    if (step.status === "locked") return;
    if (step.type === "quiz") {
      router.push(`/quiz/${topicId}/${step.id}`);
      return;
    }
    loadLesson(step.id);
  };

  const handleCompleteLesson = () => {
    if (!activeStepId || !lessonContent) return;
    completeLesson(topicId, activeStepId, lessonContent, keyTakeaways);

    const stepIndex = topic.curriculum.findIndex((s) => s.id === activeStepId);
    const nextStep = topic.curriculum[stepIndex + 1];
    if (nextStep) {
      if (nextStep.type === "quiz") {
        router.push(`/quiz/${topicId}/${nextStep.id}`);
      } else {
        loadLesson(nextStep.id);
      }
    }
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold truncate">{topic.name}</h1>
              <p className="text-xs text-muted-foreground">{completed}/{topic.curriculum.length} completed</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={completed} max={topic.curriculum.length} size="sm" gradient className="w-24 hidden sm:flex" />
            <Badge variant="xp">{topic.totalXPEarned} XP</Badge>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className={cn(
          "border-r border-border bg-surface overflow-y-auto transition-all duration-300 shrink-0",
          showSidebar ? "w-72" : "w-0"
        )}>
          <div className="p-3 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
              Curriculum
            </p>
            {topic.curriculum.map((step, i) => (
              <CurriculumStep
                key={step.id}
                step={step}
                index={i}
                isActive={step.id === activeStepId}
                onClick={() => handleStepClick(step)}
              />
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fade-in">
                <div className="relative">
                  <Brain className="h-12 w-12 text-primary animate-float" />
                  <Sparkles className="h-5 w-5 text-xp-gold absolute -top-1 -right-1 animate-spin-slow" />
                </div>
                <p className="text-muted-foreground">Generating your personalized lesson...</p>
              </div>
            ) : activeStep && lessonContent ? (
              <div className="animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <Badge variant={activeStep.type === "lesson" ? "default" : "accent"}>
                    {activeStep.type}
                  </Badge>
                  <h2 className="text-xl font-bold">{activeStep.title}</h2>
                </div>

                <div className="prose-content mb-8">
                  <ReactMarkdown>{lessonContent}</ReactMarkdown>
                </div>

                {keyTakeaways.length > 0 && (
                  <Card className="p-5 mb-8 border-primary/20 bg-primary/5">
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Key Takeaways
                    </h3>
                    <ul className="space-y-2">
                      {keyTakeaways.map((t, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                          {t}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                {activeStep.status !== "completed" && (
                  <div className="flex justify-end">
                    <Button onClick={handleCompleteLesson} size="lg" className="gap-2">
                      Complete & Continue
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-lg font-semibold mb-2">Select a lesson to begin</h2>
                <p className="text-sm text-muted-foreground">Choose a step from the curriculum sidebar</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
