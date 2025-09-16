"use client";

// Edge Runtime configuration for Cloudflare Pages
export const runtime = 'edge';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUpload } from "@/components/file-upload";
import { DatabaseService } from "@/lib/database";
import { StorageService } from "@/lib/storage";
import { useQuestionStore } from "@/lib/store";
import { SUBJECT_LABELS } from "@/lib/types";
import type { Subject, DifficultyLevel, QuestionFormData } from "@/lib/types";

interface ProcessedImage {
  original: File;
  compressed: File;
  thumbnail: File;
}

export default function UploadPage() {
  const router = useRouter();
  const { addQuestion } = useQuestionStore();

  const [formData, setFormData] = useState<QuestionFormData>({
    title: "",
    subject: "math" as Subject,
    difficulty_level: undefined,
    tags: [],
    notes: "",
  });

  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (
    field: keyof QuestionFormData,
    value: string | Subject | DifficultyLevel | string[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async () => {
    if (processedImages.length === 0) {
      setError("Lütfen en az bir görsel yükleyin");
      return;
    }

    if (!formData.subject) {
      setError("Lütfen bir ders seçin");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const image = processedImages[0];
      const questionId = crypto.randomUUID();

      // Upload files to storage
      const uploadResult = await StorageService.uploadBoth(
        image.compressed,
        image.thumbnail,
        questionId
      );

      if (uploadResult.error) {
        throw uploadResult.error;
      }

      // Create question in database
      const createResult = await DatabaseService.createQuestion(
        formData,
        uploadResult.data!.imagePath,
        uploadResult.data!.thumbnailPath
      );

      if (createResult.error) {
        throw createResult.error;
      }

      // Update store
      addQuestion(createResult.data!);

      // Redirect to home
      router.push("/");
    } catch (error) {
      console.error("Error creating question:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Soru oluşturulurken hata oluştu"
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Geri
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Yeni Soru Ekle</h1>
          <p className="text-muted-foreground">
            Soru görselinizi yükleyin ve detayları ekleyin
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Soru Görseli</CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload onFilesProcessed={setProcessedImages} maxFiles={1} />
          </CardContent>
        </Card>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Soru Detayları</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Başlık (Opsiyonel)
              </label>
              <Input
                placeholder="Soru hakkında kısa açıklama..."
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
              />
            </div>

            {/* Subject */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Ders <span className="text-destructive">*</span>
              </label>
              <Select
                value={formData.subject}
                onValueChange={(value) =>
                  handleInputChange("subject", value as Subject)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ders seçin" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SUBJECT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Zorluk Seviyesi
              </label>
              <div className="flex gap-2">
                {([1, 2, 3, 4, 5] as DifficultyLevel[]).map((level) => (
                  <Button
                    key={level}
                    variant={
                      formData.difficulty_level === level
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => handleInputChange("difficulty_level", level)}
                  >
                    {level}⭐
                  </Button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Etiketler
              </label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Etiket ekle..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddTag}
                  disabled={!tagInput.trim()}
                >
                  Ekle
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {formData.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium mb-2 block">Notlar</label>
              <textarea
                placeholder="Bu soru hakkında notlarınız..."
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <p className="text-destructive text-sm font-medium">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={uploading}
        >
          İptal
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={uploading || processedImages.length === 0}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Kaydediliyor...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Soruyu Kaydet
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
