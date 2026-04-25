"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AVATAR_OPTIONS, type Difficulty, type LearningTopic, type CurriculumStep } from "@/types";
import { Brain, ArrowRight, ArrowLeft, Sparkles, BookOpen, Clock, Loader2, Key, ExternalLink, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Profile", "API Key", "Topic", "Level", "Goal", "Ready"];

export default function OnboardingPage() {
  const router = useRouter();
  const { createProfile, updateProfile, addTopic, profile } = useAppStore();

  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile?.name || "");
  const [avatarIndex, setAvatarIndex] = useState(profile?.avatarIndex || 0);
  const [apiKey, setApiKey] = useState(profile?.geminiApiKey || "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyError, setApiKeyError] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [apiKeyValidated, setApiKeyValidated] = useState(false);
  const [topicInput, setTopicInput] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [priorKnowledge, setPriorKnowledge] = useState("");
  const [dailyGoal, setDailyGoal] = useState(15);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCurriculum, setGeneratedCurriculum] = useState<{ description: string; steps: Array<{ title: string; type: string; xpReward: number; estimatedMinutes: number }> } | null>(null);
  const [error, setError] = useState("");

  const canProceed = () => {
    if (step === 0) return name.trim().length >= 2;
    if (step === 1) return true; // API key is optional
    if (step === 2) return topicInput.trim().length >= 2;
    if (step === 3) return true;
    if (step === 4) return true;
    return !!generatedCurriculum;
  };

  const validateApiKey = async (key: string) => {
    if (!key.trim()) return true; // Empty is allowed (will fall back to env var)
    setIsValidating(true);
    setApiKeyError("");
    try {
      const res = await fetch("/api/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: key.trim() }),
      });
      const data = await res.json();
      if (data.valid) {
        setApiKeyValidated(true);
        return true;
      } else {
        setApiKeyError(data.error || "Invalid API key. Please check and try again.");
        setApiKeyValidated(false);
        return false;
      }
    } catch {
      setApiKeyError("Could not validate API key. Please try again.");
      setApiKeyValidated(false);
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleNext = async () => {
    if (step === 0 && !profile) {
      createProfile(name.trim(), avatarIndex, dailyGoal, apiKey.trim() || undefined);
    }

    if (step === 1) {
      // Validate API key if provided
      if (apiKey.trim()) {
        const valid = await validateApiKey(apiKey.trim());
        if (!valid) return;
      }
      // Save API key to profile
      if (profile) {
        updateProfile({ geminiApiKey: apiKey.trim() || undefined });
      }
      setStep(2);
      return;
    }

    if (step === 4) {
      setIsGenerating(true);
      setError("");
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        const currentApiKey = apiKey.trim() || profile?.geminiApiKey;
        if (currentApiKey) headers["x-gemini-key"] = currentApiKey;

        const res = await fetch("/api/generate-curriculum", {
          method: "POST",
          headers,
          body: JSON.stringify({ topic: topicInput, difficulty, priorKnowledge }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to generate curriculum");
        }
        const data = await res.json();
        setGeneratedCurriculum(data);
        setStep(5);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not generate curriculum. Please check your API key and try again.");
      } finally {
        setIsGenerating(false);
      }
      return;
    }

    if (step < 5) setStep(step + 1);
  };

  const handleFinish = () => {
    if (!generatedCurriculum || !profile) return;

    const topicId = crypto.randomUUID();
    const curriculumSteps: CurriculumStep[] = generatedCurriculum.steps.map((s, i) => ({
      id: crypto.randomUUID(),
      title: s.title,
      type: s.type as "lesson" | "quiz",
      status: i === 0 ? "available" : "locked",
      xpReward: s.xpReward,
      estimatedMinutes: s.estimatedMinutes,
    }));

    const topic: LearningTopic = {
      id: topicId,
      name: topicInput,
      description: generatedCurriculum.description,
      difficulty,
      priorKnowledge,
      curriculum: curriculumSteps,
      currentStepIndex: 0,
      startedAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString(),
      quizScores: [],
      totalXPEarned: 0,
    };

    addTopic(topic);
    updateProfile({ onboardingComplete: true, dailyGoalMinutes: dailyGoal });
    router.push("/dashboard");
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          <span className="font-bold">LearnQuest</span>
        </div>
        <div className="flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i <= step ? "bg-primary w-8" : "bg-secondary w-2"
              )}
            />
          ))}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <Card className="w-full max-w-lg p-8 animate-fade-in">
          {/* Step 0: Name & Avatar */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Welcome to LearnQuest!</h1>
                <p className="text-muted-foreground">Let&apos;s set up your learner profile</p>
              </div>
              <Input
                id="name"
                label="What should we call you?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoFocus
              />
              <div>
                <p className="text-sm font-medium mb-3">Choose your avatar</p>
                <div className="grid grid-cols-4 gap-3">
                  {AVATAR_OPTIONS.map((a) => (
                    <button
                      key={a.index}
                      onClick={() => setAvatarIndex(a.index)}
                      className={cn(
                        "flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br text-2xl transition-all cursor-pointer",
                        a.bg,
                        avatarIndex === a.index
                          ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                          : "opacity-70 hover:opacity-100"
                      )}
                    >
                      {a.emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 1: API Key */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Key className="h-7 w-7 text-primary" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Connect Your AI</h1>
                <p className="text-muted-foreground">
                  Add your Gemini API key to power AI-generated lessons and quizzes
                </p>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <Input
                    id="api-key"
                    label="Gemini API Key"
                    type={showApiKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setApiKeyError("");
                      setApiKeyValidated(false);
                    }}
                    placeholder="AIzaSy..."
                    error={apiKeyError}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-[34px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    aria-label={showApiKey ? "Hide API key" : "Show API key"}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {apiKeyValidated && (
                  <div className="flex items-center gap-2 text-sm text-accent animate-fade-in">
                    <ShieldCheck className="h-4 w-4" />
                    <span>API key verified successfully</span>
                  </div>
                )}

                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Get a free API key from Google AI Studio
                </a>
              </div>

              {/* Security note */}
              <div className="rounded-xl border border-border bg-surface-elevated p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ShieldCheck className="h-4 w-4 text-accent" />
                  Your key is safe
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your API key is stored locally in your browser and is only sent to Google&apos;s servers 
                  for AI generation. It is never stored on our servers.
                </p>
              </div>

              {/* Skip hint */}
              {!apiKey.trim() && (
                <p className="text-xs text-muted-foreground text-center">
                  You can skip this step if a server-side API key is already configured.
                </p>
              )}
            </div>
          )}

          {/* Step 2: Topic */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">What do you want to learn?</h1>
                <p className="text-muted-foreground">Pick any topic — our AI will create a personalized curriculum</p>
              </div>
              <Input
                id="topic"
                label="Topic"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="e.g., JavaScript, Machine Learning, Guitar..."
                autoFocus
              />
              <div>
                <p className="text-sm font-medium mb-2">Popular topics</p>
                <div className="flex flex-wrap gap-2">
                  {["Python", "React", "Machine Learning", "Web Design", "Data Science", "Rust", "Docker", "TypeScript"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTopicInput(t)}
                      className={cn(
                        "rounded-full border border-border px-3 py-1 text-sm transition-colors cursor-pointer",
                        topicInput === t ? "bg-primary text-primary-foreground border-primary" : "hover:bg-secondary"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Difficulty */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">How much do you know?</h1>
                <p className="text-muted-foreground">This helps us tailor the content to your level</p>
              </div>
              <div className="space-y-3">
                {([
                  { value: "beginner", label: "Beginner", desc: "I'm completely new to this" },
                  { value: "intermediate", label: "Intermediate", desc: "I know the basics and want to go deeper" },
                  { value: "advanced", label: "Advanced", desc: "I'm experienced and want to master it" },
                ] as const).map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setDifficulty(d.value)}
                    className={cn(
                      "flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all cursor-pointer",
                      difficulty === d.value
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <div className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg font-bold text-sm",
                      difficulty === d.value ? "bg-primary text-primary-foreground" : "bg-secondary"
                    )}>
                      {d.value[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{d.label}</p>
                      <p className="text-sm text-muted-foreground">{d.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              <Input
                id="prior"
                label="Any specific experience? (optional)"
                value={priorKnowledge}
                onChange={(e) => setPriorKnowledge(e.target.value)}
                placeholder="e.g., I've done a few tutorials..."
              />
            </div>
          )}

          {/* Step 4: Daily Goal */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Set your daily goal</h1>
                <p className="text-muted-foreground">How much time can you dedicate to learning?</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[5, 10, 15, 30].map((m) => (
                  <button
                    key={m}
                    onClick={() => setDailyGoal(m)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-xl border p-5 transition-all cursor-pointer",
                      dailyGoal === m
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/30"
                    )}
                  >
                    <Clock className={cn("h-6 w-6", dailyGoal === m ? "text-primary" : "text-muted-foreground")} />
                    <span className="text-lg font-bold">{m}</span>
                    <span className="text-xs text-muted-foreground">min/day</span>
                  </button>
                ))}
              </div>
              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}
            </div>
          )}

          {/* Step 5: Preview Curriculum */}
          {step === 5 && generatedCurriculum && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Your Learning Path</h1>
                <p className="text-muted-foreground">{generatedCurriculum.description}</p>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {generatedCurriculum.steps.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-lg border border-border p-3"
                  >
                    <div className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                      s.type === "lesson" ? "bg-primary/10 text-primary" : "bg-accent/10 text-accent"
                    )}>
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{s.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant={s.type === "lesson" ? "default" : "accent"} className="text-[10px] px-1.5 py-0">
                          {s.type}
                        </Badge>
                        <span>{s.estimatedMinutes} min</span>
                        <span className="text-xp-gold">{s.xpReward} XP</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            <Button
              variant="ghost"
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            {step < 5 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isGenerating || isValidating}
                isLoading={isGenerating || isValidating}
                className="gap-1"
              >
                {isValidating ? "Validating..." : isGenerating ? "Generating..." : step === 1 ? (apiKey.trim() ? "Validate & Continue" : "Skip for Now") : step === 4 ? "Generate Path" : "Next"}
                {!isGenerating && !isValidating && <ArrowRight className="h-4 w-4" />}
              </Button>
            ) : (
              <Button onClick={handleFinish} className="gap-1" variant="accent">
                <Sparkles className="h-4 w-4" />
                Start Learning!
              </Button>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
