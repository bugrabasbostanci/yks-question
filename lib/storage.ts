import { supabase } from "@/utils/supabase/client";

export class StorageService {
  private static readonly BUCKETS = {
    IMAGES: "question-images",
    THUMBNAILS: "question-thumbnails",
  } as const;

  // Upload image to storage
  static async uploadImage(file: File, questionId: string) {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${questionId}.${fileExt}`;
      const filePath = `${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}/${fileName}`;

      const { error } = await supabase.storage
        .from(this.BUCKETS.IMAGES)
        .upload(filePath, file, {
          cacheControl: "31536000", // 1 year cache
          upsert: false,
        });

      if (error) throw error;

      return { data: filePath, error: null };
    } catch (error) {
      console.error("Error uploading image:", error);
      return { data: null, error: error as Error };
    }
  }

  // Upload thumbnail to storage
  static async uploadThumbnail(file: File, questionId: string) {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${questionId}_thumb.${fileExt}`;
      const filePath = `${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}/${fileName}`;

      const { error } = await supabase.storage
        .from(this.BUCKETS.THUMBNAILS)
        .upload(filePath, file, {
          cacheControl: "31536000", // 1 year cache
          upsert: false,
        });

      if (error) throw error;

      return { data: filePath, error: null };
    } catch (error) {
      console.error("Error uploading thumbnail:", error);
      return { data: null, error: error as Error };
    }
  }

  // Get public URL for image
  static getImageUrl(path: string) {
    const { data } = supabase.storage
      .from(this.BUCKETS.IMAGES)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  // Get public URL for thumbnail
  static getThumbnailUrl(path: string) {
    const { data } = supabase.storage
      .from(this.BUCKETS.THUMBNAILS)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  // Delete image from storage
  static async deleteImage(path: string) {
    try {
      const { error } = await supabase.storage
        .from(this.BUCKETS.IMAGES)
        .remove([path]);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error("Error deleting image:", error);
      return { error: error as Error };
    }
  }

  // Delete thumbnail from storage
  static async deleteThumbnail(path: string) {
    try {
      const { error } = await supabase.storage
        .from(this.BUCKETS.THUMBNAILS)
        .remove([path]);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error("Error deleting thumbnail:", error);
      return { error: error as Error };
    }
  }

  // Upload both image and thumbnail
  static async uploadBoth(imageFile: File, thumbnailFile: File, questionId: string) {
    try {
      const [imageResult, thumbnailResult] = await Promise.all([
        this.uploadImage(imageFile, questionId),
        this.uploadThumbnail(thumbnailFile, questionId),
      ]);

      if (imageResult.error) throw imageResult.error;
      if (thumbnailResult.error) throw thumbnailResult.error;

      return {
        data: {
          imagePath: imageResult.data!,
          thumbnailPath: thumbnailResult.data!,
        },
        error: null,
      };
    } catch (error) {
      console.error("Error uploading files:", error);
      return { data: null, error: error as Error };
    }
  }

  // Delete both image and thumbnail
  static async deleteBoth(imagePath: string, thumbnailPath?: string) {
    try {
      const deletePromises = [this.deleteImage(imagePath)];

      if (thumbnailPath) {
        deletePromises.push(this.deleteThumbnail(thumbnailPath));
      }

      const results = await Promise.all(deletePromises);

      // Check if any deletion failed
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error(`Failed to delete some files: ${errors.map(e => e.error?.message).join(", ")}`);
      }

      return { error: null };
    } catch (error) {
      console.error("Error deleting files:", error);
      return { error: error as Error };
    }
  }
}