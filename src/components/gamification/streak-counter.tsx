"use client";

import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakCounterProps {
  streak: number;
  className?: string;
}

export function StreakCounter({ streak, className }: StreakCounterProps) {
  const isActive = streak > 0;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full transition-all",
          isActive
            ? "bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-lg shadow-orange-500/25"
            : "bg-secondary text-muted-foreground"
        )}
      >
        <Flame className={cn("h-5 w-5", isActive && "animate-float")} />
      </div>
      <div>
        <p className="text-sm font-bold tabular-nums">{streak} day{streak !== 1 ? "s" : ""}</p>
        <p className="text-xs text-muted-foreground">
          {isActive ? "Keep it up!" : "Start a streak!"}
        </p>
      </div>
    </div>
  );
}
