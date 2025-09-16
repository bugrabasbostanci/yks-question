import { supabase } from "@/utils/supabase/client";
import type { Question, QuestionFormData, FilterOptions, Subject } from "./types";

export class DatabaseService {
  private static lastConnectionCheck = 0;
  private static connectionCheckInterval = 30000; // 30 seconds

  // Check database connection (cached for performance)
  static async checkConnection() {
    const now = Date.now();

    // Skip check if we've verified connection recently
    if (now - this.lastConnectionCheck < this.connectionCheckInterval) {
      return { connected: true, error: null };
    }

    try {
      const { error } = await supabase
        .from("questions")
        .select("id")
        .limit(1);

      if (error) throw error;

      this.lastConnectionCheck = now;
      return { connected: true, error: null };
    } catch (error) {
      console.error("Database connection check failed:", error);
      return {
        connected: false,
        error: error instanceof Error ? error : new Error("Database connection failed")
      };
    }
  }

  // Get all questions with optional filtering
  static async getQuestions(filters?: FilterOptions, offset = 0, limit = 20) {
    try {

      let query = supabase
        .from("questions")
        .select("*")
        .range(offset, offset + limit - 1)
        .order("created_at", { ascending: false });

      // Apply filters
      if (filters?.subjects?.length) {
        query = query.in("subject", filters.subjects);
      }

      if (filters?.difficulty_levels?.length) {
        query = query.in("difficulty_level", filters.difficulty_levels);
      }

      if (filters?.tags?.length) {
        query = query.overlaps("tags", filters.tags);
      }

      if (filters?.is_favorite !== undefined) {
        query = query.eq("is_favorite", filters.is_favorite);
      }

      if (filters?.is_solved !== undefined) {
        query = query.eq("is_solved", filters.is_solved);
      }

      if (filters?.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data: data as Question[], error: null };
    } catch (error) {
      console.error("Error fetching questions:", error);

      // Reset connection check cache on error to force revalidation next time
      this.lastConnectionCheck = 0;

      // Provide user-friendly error messages
      let errorMessage = "Sorular yüklenirken hata oluştu";
      if (error instanceof Error) {
        if (error.message.includes("fetch") || error.message.includes("network")) {
          errorMessage = "İnternet bağlantınızı kontrol edin";
        } else if (error.message.includes("connection") || error.message.includes("timeout")) {
          errorMessage = "Database bağlantı problemi. Lütfen tekrar deneyin";
        } else {
          errorMessage = error.message;
        }
      }

      return { data: null, error: new Error(errorMessage) };
    }
  }

  // Get single question by ID
  static async getQuestion(id: string) {
    try {
      const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return { data: data as Question, error: null };
    } catch (error) {
      console.error("Error fetching question:", error);
      return { data: null, error: error as Error };
    }
  }

  // Create new question
  static async createQuestion(
    questionData: QuestionFormData,
    imagePath: string,
    thumbnailPath?: string
  ) {
    try {
      const { data, error } = await supabase
        .from("questions")
        .insert({
          ...questionData,
          image_path: imagePath,
          thumbnail_path: thumbnailPath,
        })
        .select()
        .single();

      if (error) throw error;
      return { data: data as Question, error: null };
    } catch (error) {
      console.error("Error creating question:", error);
      return { data: null, error: error as Error };
    }
  }

  // Update question
  static async updateQuestion(id: string, updates: Partial<QuestionFormData>) {
    try {
      const { data, error } = await supabase
        .from("questions")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { data: data as Question, error: null };
    } catch (error) {
      console.error("Error updating question:", error);
      return { data: null, error: error as Error };
    }
  }

  // Toggle favorite status
  static async toggleFavorite(id: string, isFavorite: boolean) {
    try {
      const { data, error } = await supabase
        .from("questions")
        .update({ is_favorite: isFavorite })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { data: data as Question, error: null };
    } catch (error) {
      console.error("Error toggling favorite:", error);
      return { data: null, error: error as Error };
    }
  }

  // Toggle solved status
  static async toggleSolved(id: string, isSolved: boolean) {
    try {
      const { data, error } = await supabase
        .from("questions")
        .update({ is_solved: isSolved })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { data: data as Question, error: null };
    } catch (error) {
      console.error("Error toggling solved:", error);
      return { data: null, error: error as Error };
    }
  }

  // Delete question
  static async deleteQuestion(id: string) {
    try {
      const { error } = await supabase.from("questions").delete().eq("id", id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error("Error deleting question:", error);
      return { error: error as Error };
    }
  }

  // Get statistics
  static async getStatistics() {
    try {
      const { data, error } = await supabase
        .from("questions")
        .select("subject, is_favorite, is_solved");

      if (error) throw error;

      const stats = {
        total: data.length,
        favorites: data.filter((q) => q.is_favorite).length,
        solved: data.filter((q) => q.is_solved).length,
        bySubject: {} as Record<Subject, number>,
      };

      // Count by subject
      data.forEach((question) => {
        const subject = question.subject as Subject;
        stats.bySubject[subject] = (stats.bySubject[subject] || 0) + 1;
      });

      return { data: stats, error: null };
    } catch (error) {
      console.error("Error getting statistics:", error);
      return { data: null, error: error as Error };
    }
  }

  // Get unique tags
  static async getUniqueTags() {
    try {
      const { data, error } = await supabase
        .from("questions")
        .select("tags");

      if (error) throw error;

      const allTags = data.flatMap((question) => question.tags || []);
      const uniqueTags = [...new Set(allTags)].sort();

      return { data: uniqueTags, error: null };
    } catch (error) {
      console.error("Error getting unique tags:", error);
      return { data: null, error: error as Error };
    }
  }
}