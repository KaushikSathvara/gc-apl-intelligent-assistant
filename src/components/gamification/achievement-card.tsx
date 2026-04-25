"use client";

import { Star, Flame, Zap, Target, BookOpen, Trophy, Gem } from "lucide-react";
import type { Achievement } from "@/types";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ElementType> = {
  star: Star,
  flame: Flame,
  zap: Zap,
  target: Target,
  "book-open": BookOpen,
  trophy: Trophy,
  gem: Gem,
};

interface AchievementCardProps {
  achievement: Achievement;
  isNew?: boolean;
  className?: string;
}

export function AchievementCard({ achievement, isNew, className }: AchievementCardProps) {
  const Icon = iconMap[achievement.icon] || Star;

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:shadow-md",
        isNew && "animate-bounce-in ring-2 ring-xp-gold/50",
        className
      )}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/10">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold truncate">{achievement.title}</p>
        <p className="text-xs text-muted-foreground truncate">{achievement.description}</p>
      </div>
      {isNew && (
        <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-xp-gold text-[10px] font-bold text-xp-gold-foreground">
          !
        </span>
      )}
    </div>
  );
}
