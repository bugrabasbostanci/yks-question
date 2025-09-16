"use client";

import { useState, useCallback, useEffect } from "react";

interface ImageViewerState {
  isOpen: boolean;
  currentImageUrl: string | null;
  currentImageAlt: string | null;
}

interface UseImageViewerReturn {
  // State
  isOpen: boolean;
  currentImageUrl: string | null;
  currentImageAlt: string | null;

  // Actions
  openViewer: (imageUrl: string, alt?: string) => void;
  closeViewer: () => void;

  // Keyboard handlers
  handleKeyDown: (event: KeyboardEvent) => void;
}

export function useImageViewer(): UseImageViewerReturn {
  const [state, setState] = useState<ImageViewerState>({
    isOpen: false,
    currentImageUrl: null,
    currentImageAlt: null,
  });

  const openViewer = useCallback((imageUrl: string, alt = "Soru görseli") => {
    setState({
      isOpen: true,
      currentImageUrl: imageUrl,
      currentImageAlt: alt,
    });

    // Prevent body scroll when viewer is open
    document.body.style.overflow = "hidden";
  }, []);

  const closeViewer = useCallback(() => {
    setState({
      isOpen: false,
      currentImageUrl: null,
      currentImageAlt: null,
    });

    // Restore body scroll
    document.body.style.overflow = "unset";
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!state.isOpen) return;

    switch (event.key) {
      case "Escape":
        closeViewer();
        break;
      case "Enter":
      case " ": // Space key
        closeViewer();
        break;
      default:
        break;
    }
  }, [state.isOpen, closeViewer]);

  // Setup keyboard listeners
  useEffect(() => {
    if (state.isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [state.isOpen, handleKeyDown]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return {
    isOpen: state.isOpen,
    currentImageUrl: state.currentImageUrl,
    currentImageAlt: state.currentImageAlt,
    openViewer,
    closeViewer,
    handleKeyDown,
  };
}