"use client";

import { useEffect, useRef } from "react";
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageViewerProps {
  isOpen: boolean;
  imageUrl: string | null;
  imageAlt: string | null;
  onClose: () => void;
}

export function ImageViewer({ isOpen, imageUrl, imageAlt, onClose }: ImageViewerProps) {
  const transformRef = useRef<ReactZoomPanPinchRef>(null);

  // Close on overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Transform controls
  const zoomIn = () => transformRef.current?.zoomIn(0.5);
  const zoomOut = () => transformRef.current?.zoomOut(0.5);
  const resetTransform = () => transformRef.current?.resetTransform();
  const centerView = () => transformRef.current?.centerView();

  // Keyboard shortcuts for zoom controls
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "+":
        case "=":
          e.preventDefault();
          zoomIn();
          break;
        case "-":
        case "_":
          e.preventDefault();
          zoomOut();
          break;
        case "0":
          e.preventDefault();
          resetTransform();
          break;
        case "f":
        case "F":
          e.preventDefault();
          centerView();
          break;
        default:
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Prevent scroll when viewer is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  if (!imageUrl) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
          onClick={handleOverlayClick}
        >
          {/* Header Controls */}
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ delay: 0.1 }}
            className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent"
          >
            <div className="flex items-center gap-2">
              <h3 className="text-white font-medium text-sm sm:text-base truncate max-w-[200px] sm:max-w-[400px]">
                {imageAlt || "Soru görseli"}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {/* Desktop Controls */}
              <div className="hidden sm:flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={zoomIn}
                  className="text-white hover:bg-white/20"
                  title="Yakınlaştır (+ tuşu)"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={zoomOut}
                  className="text-white hover:bg-white/20"
                  title="Uzaklaştır (- tuşu)"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetTransform}
                  className="text-white hover:bg-white/20"
                  title="Sıfırla (0 tuşu)"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={centerView}
                  className="text-white hover:bg-white/20"
                  title="Ortala"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20"
                title="Kapat (ESC tuşu)"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>

          {/* Main Image Container */}
          <div className="flex items-center justify-center h-full w-full p-4 pt-16 pb-20 sm:pt-20 sm:pb-16">
            <TransformWrapper
              ref={transformRef}
              initialScale={1}
              minScale={0.5}
              maxScale={5}
              limitToBounds={false}
              centerOnInit={true}
              wheel={{ step: 0.1 }}
              doubleClick={{ disabled: false, step: 0.7 }}
              pinch={{ step: 0.1 }}
              panning={{
                excluded: ["button", "a", "input", "textarea", "select"],
              }}
              onZoomStop={(ref) => {
                // Auto-center when zooming out too much
                if (ref.state.scale < 0.8) {
                  centerView();
                }
              }}
            >
              <TransformComponent
                wrapperClass="!w-full !h-full flex items-center justify-center"
                contentClass="!w-auto !h-auto max-w-full max-h-full"
              >
                <motion.img
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ delay: 0.1 }}
                  src={imageUrl}
                  alt={imageAlt || "Soru görseli"}
                  className="max-w-full max-h-full object-contain select-none"
                  draggable={false}
                  onError={(e) => {
                    console.error("Error loading image:", e);
                  }}
                />
              </TransformComponent>
            </TransformWrapper>
          </div>

          {/* Bottom Mobile Controls */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ delay: 0.1 }}
            className="absolute bottom-0 left-0 right-0 z-10 sm:hidden p-4 bg-gradient-to-t from-black/50 to-transparent"
          >
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={zoomIn}
                className="text-white hover:bg-white/20"
              >
                <ZoomIn className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={zoomOut}
                className="text-white hover:bg-white/20"
              >
                <ZoomOut className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={resetTransform}
                className="text-white hover:bg-white/20"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={centerView}
                className="text-white hover:bg-white/20"
              >
                <Maximize2 className="h-5 w-5" />
              </Button>
            </div>

            {/* Mobile Usage Hint */}
            <div className="text-center mt-3">
              <p className="text-white/70 text-xs">
                Yakınlaştırmak için çift dokunun • Kaydırmak için sürükleyin
              </p>
            </div>
          </motion.div>

          {/* Loading/Error States */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ delay: 0.5 }}
              className="text-white/50 text-sm"
            >
              Görsel yükleniyor...
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}