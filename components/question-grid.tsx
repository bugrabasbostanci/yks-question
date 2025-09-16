"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuestionStore } from "@/lib/store";
import { QuestionCard } from "./question-card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface QuestionGridProps {
  onQuestionClick?: (questionId: string) => void;
}

export function QuestionGrid({ onQuestionClick }: QuestionGridProps) {
  const router = useRouter();
  const {
    filteredQuestions,
    loading,
    hasLoaded,
    error,
    loadQuestions,
    loadMoreQuestions,
    setCurrentQuestion,
  } = useQuestionStore();

  // Track if there might be more data to load
  const [hasMoreData, setHasMoreData] = useState(true);

  const observerRef = useRef<IntersectionObserver | null>(null);

  // Enhanced infinite scroll logic with proper data check
  const lastQuestionElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading || !hasMoreData) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (
            entries[0].isIntersecting &&
            filteredQuestions.length > 0 &&
            !loading &&
            hasMoreData
          ) {
            loadMoreQuestions().then((result) => {
              if (!result.hasMoreData) {
                setHasMoreData(false);
              }
            });
          }
        },
        {
          rootMargin: '100px', // Trigger 100px before element is visible
          threshold: 0.1
        }
      );

      if (node) observerRef.current.observe(node);
    },
    [loading, hasMoreData, filteredQuestions.length, loadMoreQuestions]
  );

  // Load initial questions
  useEffect(() => {
    if (!hasLoaded && !loading) {
      loadQuestions().then(() => {
        // Reset pagination state on initial load
        setHasMoreData(true);
      });
    }
  }, [hasLoaded, loading, loadQuestions]);

  // Reset pagination when filters change
  const isQuestionsEmpty = filteredQuestions.length === 0;
  useEffect(() => {
    setHasMoreData(true);
  }, [isQuestionsEmpty]); // Reset when questions are cleared (new filter applied)

  const handleQuestionClick = (questionId: string) => {
    const question = filteredQuestions.find((q) => q.id === questionId);
    if (question) {
      setCurrentQuestion(question);
      onQuestionClick?.(questionId);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-destructive text-sm font-medium mb-4">
          Bir hata oluştu: {error}
        </div>
        <Button onClick={() => loadQuestions()} variant="outline" size="sm">
          Tekrar Dene
        </Button>
      </div>
    );
  }

  if (loading && !hasLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Sorular yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (!loading && hasLoaded && filteredQuestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-muted-foreground text-sm mb-4">
          Henüz soru eklenmemiş veya filtrelere uygun soru bulunamadı.
        </div>
        <Button
          onClick={() => router.push("/upload")}
          variant="default"
          size="sm"
        >
          İlk Sorunuzu Ekleyin
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Questions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredQuestions.map((question, index) => (
          <div
            key={question.id}
            ref={
              index === filteredQuestions.length - 1
                ? lastQuestionElementRef
                : undefined
            }
          >
            <QuestionCard
              question={question}
              onClick={() => handleQuestionClick(question.id)}
              priority={index < 4} // İlk 4 soru için priority true
            />
          </div>
        ))}
      </div>

      {/* Loading State - Only for load more */}
      {loading && hasLoaded && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Daha fazla soru yükleniyor...</span>
          </div>
        </div>
      )}

      {/* Load More Button (Fallback for browsers without IntersectionObserver) */}
      {!loading &&
        filteredQuestions.length > 0 &&
        hasMoreData &&
        filteredQuestions.length % 20 === 0 && (
          <div className="flex justify-center py-4">
            <Button
              onClick={() => {
                loadMoreQuestions().then((result) => {
                  if (!result.hasMoreData) {
                    setHasMoreData(false);
                  }
                });
              }}
              variant="outline"
              size="sm"
            >
              Daha Fazla Yükle
            </Button>
          </div>
        )}

      {/* Questions Count */}
      {filteredQuestions.length > 0 && (
        <div className="text-center text-sm text-muted-foreground py-2">
          Toplam {filteredQuestions.length} soru gösteriliyor
        </div>
      )}
    </div>
  );
}
