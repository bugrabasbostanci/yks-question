export class ImageProcessor {
  // Compress image on client side
  static async compressImage(
    file: File,
    maxWidth = 800,
    quality = 0.75
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      img.onload = () => {
        // Calculate proportional dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        // Draw and compress
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to compress image"));
              return;
            }

            const compressedFile = new File([blob], file.name, {
              type: "image/webp", // Use WebP for better compression
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          "image/webp",
          quality
        );
      };

      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Create thumbnail
  static async createThumbnail(file: File, size = 300): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      img.onload = () => {
        // Square thumbnail with center crop
        const minDimension = Math.min(img.width, img.height);

        canvas.width = size;
        canvas.height = size;

        // Calculate crop position (center)
        const cropX = (img.width - minDimension) / 2;
        const cropY = (img.height - minDimension) / 2;

        // Draw cropped and scaled image
        ctx.drawImage(
          img,
          cropX,
          cropY,
          minDimension,
          minDimension,
          0,
          0,
          size,
          size
        );

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Failed to create thumbnail"));
              return;
            }

            const thumbnailFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, "_thumb.webp"),
              {
                type: "image/webp",
                lastModified: Date.now(),
              }
            );
            resolve(thumbnailFile);
          },
          "image/webp",
          0.65 // Optimized quality for smaller thumbnails
        );
      };

      img.onerror = () => {
        reject(new Error("Failed to load image for thumbnail"));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  // Process both main image and thumbnail
  static async processImage(file: File) {
    try {
      const [compressed, thumbnail] = await Promise.all([
        this.compressImage(file, 800, 0.75),
        this.createThumbnail(file, 300),
      ]);

      return {
        original: file,
        compressed,
        thumbnail,
        compressionRatio: ((file.size - compressed.size) / file.size * 100).toFixed(1),
        originalSize: this.formatFileSize(file.size),
        compressedSize: this.formatFileSize(compressed.size),
        thumbnailSize: this.formatFileSize(thumbnail.size),
      };
    } catch (error) {
      console.error("Error processing image:", error);
      throw error;
    }
  }

  // Format file size for display
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";

    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  // Validate image file
  static validateImageFile(file: File): { isValid: boolean; error?: string } {
    // Check file type
    if (!file.type.startsWith("image/")) {
      return { isValid: false, error: "Dosya bir resim olmalıdır" };
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { isValid: false, error: "Dosya boyutu 10MB'dan büyük olamaz" };
    }

    // Check supported formats
    const supportedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!supportedTypes.includes(file.type)) {
      return { isValid: false, error: "Desteklenen formatlar: JPEG, PNG, WebP" };
    }

    return { isValid: true };
  }
}