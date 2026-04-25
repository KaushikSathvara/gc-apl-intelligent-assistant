"use client";

import { Check, Lock, Play, HelpCircle, Sparkles } from "lucide-react";
import type { CurriculumStep as CurriculumStepType } from "@/types";
import { cn } from "@/lib/utils";

interface CurriculumStepProps {
  step: CurriculumStepType;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

export function CurriculumStep({ step, index, isActive, onClick }: CurriculumStepProps) {
  const statusIcons = {
    locked: Lock,
    available: Play,
    "in-progress": Play,
    completed: Check,
  };
  const Icon = statusIcons[step.status];

  return (
    <button
      onClick={onClick}
      disabled={step.status === "locked"}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg p-3 text-left transition-all duration-200 cursor-pointer",
        step.status === "locked" && "opacity-50 cursor-not-allowed",
        step.status === "completed" && "opacity-80",
        isActive && "bg-primary/10 ring-1 ring-primary/20",
        step.status !== "locked" && !isActive && "hover:bg-secondary"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors",
          step.status === "completed" && "bg-accent text-accent-foreground",
          step.status === "available" && "bg-primary text-primary-foreground",
          step.status === "in-progress" && "bg-primary text-primary-foreground animate-glow-pulse",
          step.status === "locked" && "bg-secondary text-muted-foreground"
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium truncate", step.status === "completed" && "line-through text-muted-foreground")}>
          {step.title}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            {step.type === "lesson" ? <HelpCircle className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
            {step.type === "lesson" ? "Lesson" : "Quiz"}
          </span>
          <span>·</span>
          <span>{step.estimatedMinutes} min</span>
          <span>·</span>
          <span className="text-xp-gold">{step.xpReward} XP</span>
        </div>
      </div>
    </button>
  );
}
