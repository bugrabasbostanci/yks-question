"use client";

import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ImageProcessor } from "@/lib/image-processing";
import Image from "next/image";

interface ProcessedImage {
  original: File;
  compressed: File;
  thumbnail: File;
  compressionRatio: string;
  originalSize: string;
  compressedSize: string;
  thumbnailSize: string;
}

interface FileUploadProps {
  onFilesProcessed: (images: ProcessedImage[]) => void;
  maxFiles?: number;
  className?: string;
}

export function FileUpload({
  onFilesProcessed,
  maxFiles = 1,
  className,
}: FileUploadProps) {
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const processingRef = useRef(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (processingRef.current) return;
      processingRef.current = true;

      setProcessing(true);
      setError(null);

      try {
        const results: ProcessedImage[] = [];

        for (const file of acceptedFiles.slice(0, maxFiles)) {
          // Validate file
          const validation = ImageProcessor.validateImageFile(file);
          if (!validation.isValid) {
            setError(validation.error || "Dosya geçersiz");
            continue;
          }

          try {
            const processed = await ImageProcessor.processImage(file);
            results.push(processed);
          } catch (error) {
            console.error("Error processing image:", error);
            setError(`Görsel işlenirken hata oluştu: ${file.name}`);
          }
        }

        setProcessedImages(results);
        onFilesProcessed(results);
      } catch (error) {
        console.error("Error in onDrop:", error);
        setError("Dosyalar işlenirken beklenmeyen bir hata oluştu");
      } finally {
        setProcessing(false);
        processingRef.current = false;
      }
    },
    [maxFiles, onFilesProcessed]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: {
        "image/*": [".jpeg", ".jpg", ".png", ".webp"],
      },
      maxFiles,
      maxSize: 10 * 1024 * 1024, // 10MB
      disabled: processing,
    });

  const removeImage = (index: number) => {
    const newImages = processedImages.filter((_, i) => i !== index);
    setProcessedImages(newImages);
    onFilesProcessed(newImages);
  };

  const clearAll = () => {
    setProcessedImages([]);
    setError(null);
    onFilesProcessed([]);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop Zone */}
      <Card
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          isDragActive && !isDragReject && "border-primary bg-primary/5",
          isDragReject && "border-destructive bg-destructive/5",
          processing && "cursor-not-allowed opacity-50"
        )}
      >
        <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <input {...getInputProps()} />

          {processing ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div>
                <p className="text-lg font-medium">Görsel işleniyor...</p>
                <p className="text-sm text-muted-foreground">
                  Sıkıştırma ve thumbnail oluşturuluyor
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-primary/10 p-4">
                <Upload className="h-8 w-8 text-primary" />
              </div>

              <div>
                <p className="text-lg font-medium">
                  {isDragActive
                    ? "Dosyaları buraya bırakın"
                    : "Soru görselini yükleyin"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Sürükle-bırak veya tıklayarak seçin
                </p>
              </div>

              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="secondary">JPEG</Badge>
                <Badge variant="secondary">PNG</Badge>
                <Badge variant="secondary">WebP</Badge>
                <Badge variant="secondary">Max 10MB</Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-destructive">
              <X className="h-4 w-4" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processed Images */}
      {processedImages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">İşlenen Görseller</h3>
            <Button variant="outline" size="sm" onClick={clearAll}>
              <X className="h-4 w-4 mr-2" />
              Temizle
            </Button>
          </div>

          <div className="space-y-3">
            {processedImages.map((image, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Image Preview */}
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <Image
                        src={URL.createObjectURL(image.compressed)}
                        alt="Preview"
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Image Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium text-sm truncate pr-2">
                          {image.original.name}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeImage(index)}
                          className="h-6 w-6 p-0 flex-shrink-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3">
                        <div className="flex justify-between">
                          <span>Orijinal:</span>
                          <span className="font-medium">
                            {image.originalSize}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Thumbnail:</span>
                          <span className="font-medium">
                            {image.thumbnailSize}
                          </span>
                        </div>
                        <div className="flex justify-between col-span-2">
                          <span>Sıkıştırılmış:</span>
                          <span className="font-medium">
                            {image.compressedSize}
                          </span>
                        </div>
                      </div>

                      <div>
                        <Badge variant="default" className="text-xs">
                          <Check className="h-3 w-3 mr-1" />%
                          {image.compressionRatio} tasarruf
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
