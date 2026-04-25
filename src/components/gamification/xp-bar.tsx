"use client";

import { getLevelFromXP, getLevelProgress } from "@/lib/gamification";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface XPBarProps {
  totalXP: number;
  className?: string;
}

export function XPBar({ totalXP, className }: XPBarProps) {
  const { level, title } = getLevelFromXP(totalXP);
  const progress = getLevelProgress(totalXP);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {level}
          </div>
          <div>
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-xs text-muted-foreground">{totalXP.toLocaleString()} XP total</p>
          </div>
        </div>
        <Badge variant="xp" className="gap-1">
          <Sparkles className="h-3 w-3" />
          {progress.percentage < 100
            ? `${progress.current}/${progress.required} to ${progress.nextLevelTitle}`
            : "Max Level!"}
        </Badge>
      </div>
      <Progress value={progress.percentage} gradient size="md" />
    </div>
  );
}
