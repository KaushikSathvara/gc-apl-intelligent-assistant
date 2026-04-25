"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { calculateQuizXP } from "@/lib/gamification";
import type { QuizQuestion } from "@/types";
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, Brain, Sparkles, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export default function QuizPage({ params }: { params: Promise<{ topicId: string; stepId: string }> }) {
  const { topicId, stepId } = use(params);
  const router = useRouter();
  const { profile, completeQuiz, updateStep } = useAppStore();

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const topic = profile?.topics.find((t) => t.id === topicId);
  const step = topic?.curriculum.find((s) => s.id === stepId);

  useEffect(() => {
    setMounted(true);
    if (!profile?.onboardingComplete || !topic || !step) {
      router.replace("/dashboard");
      return;
    }
    loadQuiz();
  }, []);

  const loadQuiz = async () => {
    if (!topic || !step) return;
    setIsLoading(true);
    updateStep(topicId, stepId, { status: "in-progress" });

    const prevLesson = topic.curriculum
      .filter((s) => s.status === "completed" && s.type === "lesson")
      .pop();

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (profile?.geminiApiKey) headers["x-gemini-key"] = profile.geminiApiKey;

      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers,
        body: JSON.stringify({
          topic: topic.name,
          lessonTitle: prevLesson?.title || step.title,
          keyTakeaways: prevLesson?.keyTakeaways || [],
          difficulty: topic.difficulty,
        }),
      });
      if (!res.ok) throw new Error("Failed to generate quiz");
      const data = await res.json();
      setQuestions(data.questions || []);
    } catch {
      setQuestions([{
        question: "Quiz generation failed. Please check your API key.",
        options: ["Try again", "Go back", "Skip", "Retry"],
        correctIndex: 0,
        explanation: "There was an error generating the quiz.",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted || !profile || !topic || !step) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  const handleAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
    setShowResult(true);
    if (index === currentQ.correctIndex) {
      setCorrectCount((c) => c + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      const finalCorrect = selectedAnswer === currentQ.correctIndex ? correctCount : correctCount;
      const xpEarned = calculateQuizXP(finalCorrect, questions.length);
      completeQuiz(topicId, stepId, {
        stepId,
        score: finalCorrect,
        totalQuestions: questions.length,
        correctAnswers: finalCorrect,
        completedAt: new Date().toISOString(),
        xpEarned,
      });
      setIsFinished(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <Brain className="h-12 w-12 text-primary animate-float" />
          <Sparkles className="h-5 w-5 text-xp-gold absolute -top-1 -right-1 animate-spin-slow" />
        </div>
        <p className="text-muted-foreground">Preparing your quiz...</p>
      </div>
    );
  }

  if (isFinished) {
    const percentage = Math.round((correctCount / questions.length) * 100);
    const xpEarned = calculateQuizXP(correctCount, questions.length);
    const passed = percentage >= 70;

    return (
      <div className="min-h-dvh flex items-center justify-center px-6">
        <Card className="w-full max-w-md p-8 text-center animate-bounce-in">
          <div className={cn(
            "mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full",
            passed ? "bg-accent/10" : "bg-destructive/10"
          )}>
            {passed ? (
              <Trophy className="h-10 w-10 text-accent" />
            ) : (
              <XCircle className="h-10 w-10 text-destructive" />
            )}
          </div>

          <h1 className="text-2xl font-bold mb-2">
            {passed ? "Great job!" : "Keep practicing!"}
          </h1>
          <p className="text-muted-foreground mb-6">
            You scored {correctCount}/{questions.length} ({percentage}%)
          </p>

          <div className="flex items-center justify-center gap-2 mb-8">
            <Badge variant="xp" className="text-base px-4 py-1.5 gap-1">
              <Sparkles className="h-4 w-4" />
              +{xpEarned} XP
            </Badge>
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={() => router.push(`/learn/${topicId}`)} className="gap-2">
              Continue Learning
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/learn/${topicId}`)} className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Exit
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground tabular-nums">
              {currentIndex + 1}/{questions.length}
            </span>
            <Progress value={currentIndex + 1} max={questions.length} size="sm" gradient className="w-24" />
          </div>
        </div>
      </header>

      {/* Question */}
      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-2xl animate-fade-in" key={currentIndex}>
          <h2 className="text-xl font-bold mb-8 text-center">{currentQ.question}</h2>

          <div className="grid grid-cols-1 gap-3 mb-8">
            {currentQ.options.map((opt, i) => {
              const isSelected = selectedAnswer === i;
              const isCorrect = i === currentQ.correctIndex;

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={showResult}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-4 text-left transition-all duration-200 cursor-pointer",
                    !showResult && "hover:border-primary/30 hover:bg-primary/5",
                    showResult && isCorrect && "border-accent bg-accent/10 ring-1 ring-accent/30",
                    showResult && isSelected && !isCorrect && "border-destructive bg-destructive/10 ring-1 ring-destructive/30",
                    !showResult && "border-border"
                  )}
                >
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-medium",
                    showResult && isCorrect ? "bg-accent text-accent-foreground" :
                    showResult && isSelected ? "bg-destructive text-destructive-foreground" :
                    "bg-secondary"
                  )}>
                    {showResult && isCorrect ? <CheckCircle className="h-4 w-4" /> :
                     showResult && isSelected ? <XCircle className="h-4 w-4" /> :
                     String.fromCharCode(65 + i)}
                  </div>
                  <span className="text-sm">{opt}</span>
                </button>
              );
            })}
          </div>

          {showResult && (
            <div className="animate-slide-up">
              <Card className={cn(
                "p-4 mb-6",
                selectedAnswer === currentQ.correctIndex ? "border-accent/20 bg-accent/5" : "border-destructive/20 bg-destructive/5"
              )}>
                <p className="text-sm font-medium mb-1">
                  {selectedAnswer === currentQ.correctIndex ? "✓ Correct!" : "✗ Incorrect"}
                </p>
                <p className="text-sm text-muted-foreground">{currentQ.explanation}</p>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleNext} className="gap-2">
                  {currentIndex < questions.length - 1 ? "Next Question" : "See Results"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
