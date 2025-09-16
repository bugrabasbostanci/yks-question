"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Heart, BookOpen, Edit, Trash2, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useQuestionStore } from "@/lib/store";
import { StorageService } from "@/lib/storage";
import { useImageViewer } from "@/hooks/use-image-viewer";
import { ImageViewer } from "@/components/image-viewer";
import { cn } from "@/lib/utils";
import { SUBJECT_LABELS } from "@/lib/types";

export default function QuestionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const questionId = params.id as string;

  const {
    currentQuestion,
    setCurrentQuestion,
    toggleFavorite,
    toggleSolved,
    updateQuestion,
    deleteQuestion,
  } = useQuestionStore();

  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [notes, setNotes] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const { isOpen, currentImageUrl, currentImageAlt, openViewer, closeViewer } =
    useImageViewer();

  useEffect(() => {
    const loadQuestion = async () => {
      if (!questionId) return;

      setLoading(true);

      // If we have the question in store, use it
      const { questions } = useQuestionStore.getState();
      const question = questions.find((q) => q.id === questionId);

      if (question) {
        setCurrentQuestion(question);
        setNotes(question.notes || "");
        setLoading(false);
      } else {
        // TODO: Load from database if not in store
        // For now, redirect back if question not found
        router.push("/");
      }
    };

    loadQuestion();
  }, [questionId, setCurrentQuestion, router]);

  const handleFavoriteToggle = async () => {
    if (!currentQuestion) return;
    await toggleFavorite(currentQuestion.id);
  };

  const handleSolvedToggle = async () => {
    if (!currentQuestion) return;
    await toggleSolved(currentQuestion.id);
  };

  const handleNotesUpdate = async () => {
    if (!currentQuestion) return;

    updateQuestion(currentQuestion.id, { notes });
    setIsEditingNotes(false);
  };

  const handleDeleteQuestion = async () => {
    if (!currentQuestion) return;

    // Browser-safe confirm dialog
    if (typeof window !== 'undefined' && confirm("Bu soruyu silmek istediğinizden emin misiniz?")) {
      await deleteQuestion(currentQuestion.id);
      router.push("/");
    }
  };

  const handleImageZoom = () => {
    if (currentQuestion?.image_path) {
      const fullImageUrl = StorageService.getImageUrl(
        currentQuestion.image_path
      );
      openViewer(fullImageUrl, currentQuestion.title || "Soru görseli");
    }
  };

  const getDifficultyLabel = (level?: number) => {
    const labels = {
      1: "Çok Kolay",
      2: "Kolay",
      3: "Orta",
      4: "Zor",
      5: "Çok Zor",
    };
    return level ? labels[level as keyof typeof labels] : "Belirtilmemiş";
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Soru yükleniyor...</div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="text-muted-foreground mb-4">Soru bulunamadı</div>
        <Button onClick={() => router.push("/")} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Ana Sayfaya Dön
        </Button>
      </div>
    );
  }

  const imageUrl = currentQuestion.image_path
    ? StorageService.getImageUrl(currentQuestion.image_path)
    : "";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button onClick={() => router.push("/")} variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri Dön
        </Button>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleFavoriteToggle}
            variant={currentQuestion.is_favorite ? "default" : "outline"}
            size="sm"
          >
            <Heart
              className={cn(
                "h-4 w-4 mr-2",
                currentQuestion.is_favorite && "fill-current"
              )}
            />
            {currentQuestion.is_favorite
              ? "Favoriden Çıkar"
              : "Favorilere Ekle"}
          </Button>

          <Button
            onClick={handleSolvedToggle}
            variant={currentQuestion.is_solved ? "default" : "outline"}
            size="sm"
          >
            <BookOpen
              className={cn(
                "h-4 w-4 mr-2",
                currentQuestion.is_solved && "fill-current"
              )}
            />
            {currentQuestion.is_solved ? "Çözüldü Olarak İşaretle" : "Çözüldü"}
          </Button>

          <Button variant="outline" size="sm" onClick={handleDeleteQuestion}>
            <Trash2 className="h-4 w-4 mr-2" />
            Sil
          </Button>
        </div>
      </div>

      {/* Question Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Image */}
        <div className="lg:col-span-2">
          <Card className="group relative">
            <CardContent className="p-0">
              <div
                className="relative aspect-[4/3] w-full overflow-hidden rounded-lg cursor-pointer"
                onClick={handleImageZoom}
              >
                {imageUrl && !imageError ? (
                  <>
                    <Image
                      src={imageUrl}
                      alt={currentQuestion.title || "Soru görseli"}
                      fill
                      className="object-contain transition-transform duration-200 group-hover:scale-[1.02]"
                      onError={() => setImageError(true)}
                      priority
                    />

                    {/* Zoom Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 dark:bg-black/90 rounded-full p-3 shadow-lg">
                        <ZoomIn className="h-6 w-6 text-gray-700 dark:text-gray-300" />
                      </div>
                    </div>

                    {/* Zoom Button - Mobile */}
                    <div className="absolute top-4 right-4 sm:hidden">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-10 w-10 bg-white/90 hover:bg-white dark:bg-black/90 dark:hover:bg-black shadow-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImageZoom();
                        }}
                      >
                        <ZoomIn className="h-5 w-5" />
                      </Button>
                    </div>

                    {/* Usage Hint */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-black/70 text-white text-xs px-3 py-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <span className="hidden sm:inline">
                          Büyütmek için tıklayın
                        </span>
                        <span className="sm:hidden">Zoom için dokunun</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center bg-muted">
                    <span className="text-muted-foreground">
                      {imageError ? "Görsel yüklenemedi" : "Görsel bulunamadı"}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Question Info */}
        <div className="space-y-4">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Soru Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              {currentQuestion.title && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Başlık
                  </label>
                  <p className="text-sm">{currentQuestion.title}</p>
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Ders
                </label>
                <div className="mt-1">
                  <Badge variant="secondary">
                    {SUBJECT_LABELS[currentQuestion.subject]}
                  </Badge>
                </div>
              </div>

              {/* Difficulty */}
              {currentQuestion.difficulty_level && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Zorluk
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "h-2 w-2 rounded-full",
                            currentQuestion.difficulty_level &&
                              i < currentQuestion.difficulty_level
                              ? getDifficultyColor(
                                  currentQuestion.difficulty_level
                                )
                              : "bg-gray-300 dark:bg-gray-600"
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {getDifficultyLabel(currentQuestion.difficulty_level)}
                    </span>
                  </div>
                </div>
              )}

              {/* Tags */}
              {currentQuestion.tags && currentQuestion.tags.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Etiketler
                  </label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {currentQuestion.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Status */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Durum
                </label>
                <div className="mt-1 flex gap-2">
                  {currentQuestion.is_favorite && (
                    <Badge variant="default" className="bg-red-500">
                      <Heart className="h-3 w-3 mr-1 fill-current" />
                      Favori
                    </Badge>
                  )}
                  {currentQuestion.is_solved && (
                    <Badge variant="default" className="bg-green-500">
                      <BookOpen className="h-3 w-3 mr-1 fill-current" />
                      Çözüldü
                    </Badge>
                  )}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Eklenme Tarihi
                </label>
                <p className="text-sm">
                  {new Date(currentQuestion.created_at).toLocaleDateString(
                    "tr-TR",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Notlar</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (isEditingNotes) {
                      handleNotesUpdate();
                    } else {
                      setIsEditingNotes(true);
                    }
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {isEditingNotes ? "Kaydet" : "Düzenle"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isEditingNotes ? (
                <div className="space-y-2">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Soru hakkında notlarınızı yazın..."
                    className="min-h-24"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setNotes(currentQuestion.notes || "");
                        setIsEditingNotes(false);
                      }}
                    >
                      İptal
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm">
                  {notes || (
                    <span className="text-muted-foreground italic">
                      Henüz not eklenmemiş. Düzenle butonuna tıklayarak not
                      ekleyebilirsiniz.
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Image Viewer Modal */}
      <ImageViewer
        isOpen={isOpen}
        imageUrl={currentImageUrl}
        imageAlt={currentImageAlt}
        onClose={closeViewer}
      />
    </div>
  );
}
