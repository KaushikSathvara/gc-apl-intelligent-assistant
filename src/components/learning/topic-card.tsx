"use client";

import { BookOpen, Clock, ChevronRight } from "lucide-react";
import type { LearningTopic } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface TopicCardProps {
  topic: LearningTopic;
  onClick: () => void;
  className?: string;
}

export function TopicCard({ topic, onClick, className }: TopicCardProps) {
  const completed = topic.curriculum.filter((s) => s.status === "completed").length;
  const total = topic.curriculum.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isComplete = !!topic.completedAt;

  return (
    <Card
      className={cn(
        "group cursor-pointer overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-300",
        isComplete && "border-accent/30",
        className
      )}
      onClick={onClick}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <Badge variant={isComplete ? "accent" : "secondary"}>
            {topic.difficulty}
          </Badge>
        </div>

        <h3 className="font-semibold text-base mb-1 line-clamp-1 group-hover:text-primary transition-colors">
          {topic.name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {topic.description}
        </p>

        <Progress value={completed} max={total} size="sm" gradient />

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="tabular-nums">{completed}/{total} steps</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {topic.curriculum.reduce((s, c) => s + c.estimatedMinutes, 0)} min
            </span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </Card>
  );
}
