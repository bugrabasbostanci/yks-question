import { create } from "zustand";
import { DatabaseService } from "./database";
import type { Question, FilterOptions, Subject } from "./types";

interface LoadMoreResult {
  hasMoreData: boolean;
  loadedCount: number;
}

interface QuestionStore {
  // State
  questions: Question[];
  filteredQuestions: Question[];
  currentQuestion: Question | null;
  filters: FilterOptions;
  loading: boolean;
  hasLoaded: boolean;
  error: string | null;
  stats: {
    total: number;
    favorites: number;
    solved: number;
    bySubject: Record<Subject, number>;
  } | null;
  // Internal state for race condition protection
  currentRequestId: string | null;

  // Actions
  loadQuestions: (filters?: FilterOptions) => Promise<void>;
  loadMoreQuestions: () => Promise<LoadMoreResult>;
  setFilters: (filters: FilterOptions) => void;
  clearFilters: () => void;
  setCurrentQuestion: (question: Question | null) => void;
  toggleFavorite: (id: string) => Promise<void>;
  toggleSolved: (id: string) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  addQuestion: (question: Question) => void;
  updateQuestion: (id: string, updates: Partial<Question>) => void;
  loadStatistics: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useQuestionStore = create<QuestionStore>((set, get) => ({
  // Initial state
  questions: [],
  filteredQuestions: [],
  currentQuestion: null,
  filters: {},
  loading: false,
  hasLoaded: false,
  error: null,
  stats: null,
  currentRequestId: null,

  // Load questions with optional filters
  loadQuestions: async (filters) => {
    // Generate unique request ID to handle race conditions
    const requestId = Math.random().toString(36).substring(7);
    const { currentRequestId, loading } = get();

    // Cancel if there's already a loading request
    if (loading && currentRequestId) {
      return;
    }

    set({ loading: true, error: null, currentRequestId: requestId });

    try {
      const { data, error } = await DatabaseService.getQuestions(filters, 0, 20);

      // Check if this request is still the current one (race condition protection)
      const { currentRequestId: latestRequestId } = get();
      if (latestRequestId !== requestId) {
        return; // Another request has been initiated, ignore this result
      }

      if (error) throw error;

      set({
        questions: data || [],
        filteredQuestions: data || [],
        filters: filters || {},
        loading: false,
        hasLoaded: true,
        currentRequestId: null,
      });
    } catch (error) {
      // Check if this request is still the current one
      const { currentRequestId: latestRequestId } = get();
      if (latestRequestId !== requestId) {
        return; // Another request has been initiated, ignore this error
      }

      set({
        error: error instanceof Error ? error.message : "Sorular yüklenirken hata oluştu",
        loading: false,
        hasLoaded: true,
        currentRequestId: null,
      });
    }
  },

  // Load more questions (pagination)
  loadMoreQuestions: async () => {
    const { questions, filters, loading, currentRequestId } = get();

    // Prevent multiple concurrent loadMore requests
    if (loading || currentRequestId) return { hasMoreData: false, loadedCount: 0 };

    // Generate unique request ID
    const requestId = Math.random().toString(36).substring(7);
    set({ loading: true, currentRequestId: requestId });

    try {
      const { data, error } = await DatabaseService.getQuestions(
        filters,
        questions.length,
        20
      );

      // Check if this request is still current
      const { currentRequestId: latestRequestId } = get();
      if (latestRequestId !== requestId) {
        return { hasMoreData: false, loadedCount: 0 }; // Another request has been initiated, ignore this result
      }

      if (error) throw error;

      // If no more data, don't update the loading state unnecessarily
      if (!data || data.length === 0) {
        set({ loading: false, currentRequestId: null });
        return { hasMoreData: false, loadedCount: 0 };
      }

      set({
        questions: [...questions, ...data],
        filteredQuestions: [...questions, ...data],
        loading: false,
        currentRequestId: null,
      });

      return { hasMoreData: data.length === 20, loadedCount: data.length };
    } catch (error) {
      // Check if this request is still current
      const { currentRequestId: latestRequestId } = get();
      if (latestRequestId !== requestId) {
        return { hasMoreData: false, loadedCount: 0 }; // Another request has been initiated, ignore this error
      }

      set({
        error: error instanceof Error ? error.message : "Daha fazla soru yüklenirken hata oluştu",
        loading: false,
        currentRequestId: null,
      });

      return { hasMoreData: false, loadedCount: 0 };
    }
  },

  // Set filters and reload questions
  setFilters: (newFilters) => {
    const { filters: currentFilters } = get();

    // Only reload if filters actually changed to prevent unnecessary requests
    const filtersChanged = JSON.stringify(currentFilters) !== JSON.stringify(newFilters);

    if (filtersChanged) {
      set({ filters: newFilters, hasLoaded: false });
      get().loadQuestions(newFilters);
    }
  },

  // Clear all filters
  clearFilters: () => {
    const { filters: currentFilters } = get();

    // Only clear and reload if filters are not already empty
    const hasFilters = Object.keys(currentFilters).length > 0;

    if (hasFilters) {
      set({ filters: {}, hasLoaded: false });
      get().loadQuestions({});
    }
  },

  // Set current question for detail view
  setCurrentQuestion: (question) => {
    set({ currentQuestion: question });
  },

  // Toggle favorite status
  toggleFavorite: async (id) => {
    const { questions, filteredQuestions } = get();
    const question = questions.find((q) => q.id === id);
    if (!question) return;

    try {
      const { data, error } = await DatabaseService.toggleFavorite(
        id,
        !question.is_favorite
      );

      if (error) throw error;

      set({
        questions: questions.map((q) => (q.id === id ? data! : q)),
        filteredQuestions: filteredQuestions.map((q) => (q.id === id ? data! : q)),
      });

      // Update current question if it's the same
      const { currentQuestion } = get();
      if (currentQuestion?.id === id) {
        set({ currentQuestion: data });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Favori durumu güncellenirken hata oluştu",
      });
    }
  },

  // Toggle solved status
  toggleSolved: async (id) => {
    const { questions, filteredQuestions } = get();
    const question = questions.find((q) => q.id === id);
    if (!question) return;

    try {
      const { data, error } = await DatabaseService.toggleSolved(
        id,
        !question.is_solved
      );

      if (error) throw error;

      set({
        questions: questions.map((q) => (q.id === id ? data! : q)),
        filteredQuestions: filteredQuestions.map((q) => (q.id === id ? data! : q)),
      });

      // Update current question if it's the same
      const { currentQuestion } = get();
      if (currentQuestion?.id === id) {
        set({ currentQuestion: data });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Çözüldü durumu güncellenirken hata oluştu",
      });
    }
  },

  // Delete question
  deleteQuestion: async (id) => {
    const { questions, filteredQuestions } = get();

    try {
      const { error } = await DatabaseService.deleteQuestion(id);

      if (error) throw error;

      set({
        questions: questions.filter((q) => q.id !== id),
        filteredQuestions: filteredQuestions.filter((q) => q.id !== id),
      });

      // Clear current question if it's the deleted one
      const { currentQuestion } = get();
      if (currentQuestion?.id === id) {
        set({ currentQuestion: null });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Soru silinirken hata oluştu",
      });
    }
  },

  // Add new question to store
  addQuestion: (question) => {
    const { questions, filteredQuestions } = get();
    set({
      questions: [question, ...questions],
      filteredQuestions: [question, ...filteredQuestions],
    });
  },

  // Update existing question in store
  updateQuestion: (id, updates) => {
    const { questions, filteredQuestions } = get();
    set({
      questions: questions.map((q) => (q.id === id ? { ...q, ...updates } : q)),
      filteredQuestions: filteredQuestions.map((q) => (q.id === id ? { ...q, ...updates } : q)),
    });

    // Update current question if it's the same
    const { currentQuestion } = get();
    if (currentQuestion?.id === id) {
      set({ currentQuestion: { ...currentQuestion, ...updates } });
    }
  },

  // Load statistics
  loadStatistics: async () => {
    try {
      const { data, error } = await DatabaseService.getStatistics();

      if (error) throw error;

      set({ stats: data });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "İstatistikler yüklenirken hata oluştu",
      });
    }
  },

  // Set loading state
  setLoading: (loading) => {
    set({ loading });
  },

  // Set error state
  setError: (error) => {
    set({ error });
  },
}));