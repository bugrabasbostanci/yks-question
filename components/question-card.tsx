"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { StorageService } from "@/lib/storage";
import { useQuestionStore } from "@/lib/store";
import type { Question } from "@/lib/types";
import { SUBJECT_LABELS } from "@/lib/types";

interface QuestionCardProps {
  question: Question;
  onClick?: () => void;
  className?: string;
  priority?: boolean;
}

export function QuestionCard({
  question,
  onClick,
  className,
  priority = false,
}: QuestionCardProps) {
  const [imageError, setImageError] = useState(false);
  const { toggleFavorite, toggleSolved } = useQuestionStore();

  const imageUrl = question.thumbnail_path
    ? StorageService.getThumbnailUrl(question.thumbnail_path)
    : StorageService.getImageUrl(question.image_path);

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleFavorite(question.id);
  };

  const handleSolvedToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleSolved(question.id);
  };

  const getDifficultyColor = (level?: number) => {
    switch (level) {
      case 1:
        return "bg-green-500";
      case 2:
        return "bg-blue-500";
      case 3:
        return "bg-yellow-500";
      case 4:
        return "bg-orange-500";
      case 5:
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]",
        question.is_solved && "ring-2 ring-green-200 dark:ring-green-800",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-0">
        {/* Image Section */}
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-xl">
          {!imageError ? (
            <Image
              src={imageUrl}
              alt={question.title || "Soru görseli"}
              fill
              priority={priority}
              className="object-cover transition-transform duration-200 group-hover:scale-105"
              onError={() => setImageError(true)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-muted">
              <span className="text-muted-foreground">Görsel yüklenemedi</span>
            </div>
          )}

          {/* Overlay Buttons */}
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              size="icon"
              variant={question.is_favorite ? "default" : "secondary"}
              className="h-8 w-8 bg-white/90 hover:bg-white dark:bg-black/90 dark:hover:bg-black"
              onClick={handleFavoriteToggle}
            >
              <Heart
                className={cn(
                  "h-4 w-4",
                  question.is_favorite && "fill-red-500 text-red-500"
                )}
              />
            </Button>

            <Button
              size="icon"
              variant={question.is_solved ? "default" : "secondary"}
              className="h-8 w-8 bg-white/90 hover:bg-white dark:bg-black/90 dark:hover:bg-black"
              onClick={handleSolvedToggle}
            >
              <BookOpen
                className={cn(
                  "h-4 w-4",
                  question.is_solved && "fill-green-500 text-green-500"
                )}
              />
            </Button>
          </div>

          {/* Status Indicators */}
          <div className="absolute top-2 left-2 flex gap-1">
            {question.is_favorite && (
              <Badge variant="default" className="bg-red-500 hover:bg-red-600">
                <Heart className="h-3 w-3 mr-1 fill-current" />
                Favori
              </Badge>
            )}
            {question.is_solved && (
              <Badge
                variant="default"
                className="bg-green-500 hover:bg-green-600"
              >
                <BookOpen className="h-3 w-3 mr-1 fill-current" />
                Çözüldü
              </Badge>
            )}
          </div>

          {/* Difficulty Indicator */}
          {question.difficulty_level && (
            <div className="absolute bottom-2 left-2">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      question.difficulty_level && i < question.difficulty_level
                        ? getDifficultyColor(question.difficulty_level)
                        : "bg-gray-300 dark:bg-gray-600"
                    )}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4">
          {/* Subject Badge */}
          <div className="mb-2">
            <Badge variant="secondary" className="text-xs">
              {SUBJECT_LABELS[question.subject]}
            </Badge>
          </div>

          {/* Title */}
          {question.title && (
            <h3 className="font-medium text-sm mb-2 line-clamp-2 text-foreground">
              {question.title}
            </h3>
          )}

          {/* Tags */}
          {question.tags && question.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {question.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-xs px-1.5 py-0.5"
                >
                  {tag}
                </Badge>
              ))}
              {question.tags.length > 3 && (
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                  +{question.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Date */}
          <p className="text-xs text-muted-foreground">
            {new Date(question.created_at).toLocaleDateString("tr-TR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      </CardContent>

    </Card>
  );
}
