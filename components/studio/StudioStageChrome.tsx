"use client"

import { Button } from "@/components/ui/button"

import { ZoomIn, ZoomOut, ZoomInIcon as ResetZoom } from "lucide-react"

import type { StudioStageModel } from "@/components/studio/studio-stage-model"

export function StudioStageChrome({ stage }: { stage: StudioStageModel }) {
  const {
    aspectRatio,
    getVideoDisplayArea,
    isFullscreen,
    isLightMode,
    isMounted,
    lightIntensity,
    panOffset,
    recordingState,
    resetZoom,
    showFlash,
    toggleFullscreen,
    zoomIn,
    zoomLevel,
    zoomOut,
  } = stage

  return (
    <>
      {/* Zoom Controls Overlay */}
      {isMounted && recordingState === "idle" && !isFullscreen && (
        <div className="absolute top-4 left-4 flex flex-col gap-2 bg-black/50 backdrop-blur-sm rounded-lg p-2">
          <Button
            onClick={zoomIn}
            variant="outline"
            size="sm"
            disabled={zoomLevel >= 3}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <div className="text-white text-xs font-mono text-center">
            {Math.round(zoomLevel * 100)}%
          </div>
          <Button
            onClick={zoomOut}
            variant="outline"
            size="sm"
            disabled={zoomLevel <= 0.5}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          {(zoomLevel !== 1 || panOffset.x !== 0 || panOffset.y !== 0) && (
            <Button
              onClick={resetZoom}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <ResetZoom className="w-4 h-4" />
            </Button>
          )}

          {/* Ring light — fullscreen only */}
          <div className="border-t border-white/20 pt-2 mt-2">
            <Button
              onClick={() => {}}
              variant="outline"
              size="sm"
              disabled
              className="bg-white/5 border-white/20 text-white/40 cursor-not-allowed"
              title="Ring light (fullscreen only)"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </Button>
          </div>
        </div>
      )}

      {/* Fullscreen Toggle Button */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 backdrop-blur-sm"
        style={{ zIndex: 20 }} // Higher z-index to appear above light
        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
      >
        {isFullscreen ? (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            />
          </svg>
        )}
      </button>

      {/* Flash Effect */}
      {showFlash && (
        <div className="absolute inset-0 bg-white opacity-80 pointer-events-none animate-pulse" />
      )}

      {/* Light Mode - Complete Ring Around Camera in Fullscreen */}
      {isLightMode &&
        isFullscreen &&
        (() => {
          const videoArea = getVideoDisplayArea()
          const lightBorderWidth = 80 // Width of light ring around video

          // Validate video area calculations to prevent chaos during aspect ratio changes
          if (
            !videoArea ||
            videoArea.displayedVideoWidth <= 0 ||
            videoArea.displayedVideoHeight <= 0
          ) {
            return null // Don't render light if video dimensions are invalid
          }

          // Special handling for specific aspect ratios
          const isVertical = aspectRatio === "9:16"
          const isSquare = aspectRatio === "1:1"
          const screenWidth = window.innerWidth
          const screenHeight = window.innerHeight

          // For vertical and square videos, ensure proper centering calculations
          let adjustedVideoArea = videoArea
          if (isVertical || isSquare) {
            // Force recalculation for special aspect ratios to ensure proper centering
            const videoWidth = videoArea.displayedVideoWidth
            const videoHeight = videoArea.displayedVideoHeight

            // Center the video both horizontally and vertically
            const centeredOffsetX = Math.max(0, (screenWidth - videoWidth) / 2)
            const centeredOffsetY = Math.max(
              0,
              (screenHeight - videoHeight) / 2
            )

            adjustedVideoArea = {
              ...videoArea,
              videoOffsetX: centeredOffsetX,
              videoOffsetY: centeredOffsetY,
              displayedVideoWidth: videoWidth,
              displayedVideoHeight: Math.min(videoHeight, screenHeight),
            }
          }

          // For 9:16 and 1:1, create full-screen light around video (no overlay on video)
          if (isVertical || isSquare) {
            return (
              <div
                key={`light-${aspectRatio}-${adjustedVideoArea.displayedVideoWidth}-${adjustedVideoArea.displayedVideoHeight}`}
                className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                style={{ zIndex: 10 }}
              >
                {/* Top area - full width */}
                <div
                  className="absolute bg-white transition-all duration-300"
                  style={{
                    left: 0,
                    top: 0,
                    width: `${screenWidth}px`,
                    height: `${Math.max(0, adjustedVideoArea.videoOffsetY)}px`,
                    opacity: lightIntensity / 100,
                  }}
                />

                {/* Bottom area - full width */}
                <div
                  className="absolute bg-white transition-all duration-300"
                  style={{
                    left: 0,
                    top: `${adjustedVideoArea.videoOffsetY + adjustedVideoArea.displayedVideoHeight}px`,
                    width: `${screenWidth}px`,
                    height: `${Math.max(0, screenHeight - (adjustedVideoArea.videoOffsetY + adjustedVideoArea.displayedVideoHeight))}px`,
                    opacity: lightIntensity / 100,
                  }}
                />

                {/* Left area - next to video */}
                <div
                  className="absolute bg-white transition-all duration-300"
                  style={{
                    left: 0,
                    top: `${adjustedVideoArea.videoOffsetY}px`,
                    width: `${Math.max(0, adjustedVideoArea.videoOffsetX)}px`,
                    height: `${adjustedVideoArea.displayedVideoHeight}px`,
                    opacity: lightIntensity / 100,
                  }}
                />

                {/* Right area - next to video */}
                <div
                  className="absolute bg-white transition-all duration-300"
                  style={{
                    left: `${adjustedVideoArea.videoOffsetX + adjustedVideoArea.displayedVideoWidth}px`,
                    top: `${adjustedVideoArea.videoOffsetY}px`,
                    width: `${Math.max(0, screenWidth - (adjustedVideoArea.videoOffsetX + adjustedVideoArea.displayedVideoWidth))}px`,
                    height: `${adjustedVideoArea.displayedVideoHeight}px`,
                    opacity: lightIntensity / 100,
                  }}
                />
              </div>
            )
          }

          // For other aspect ratios, use simplified full-area approach with video cutout
          const videoLeft = adjustedVideoArea.videoOffsetX
          const videoTop = adjustedVideoArea.videoOffsetY
          const videoWidth = adjustedVideoArea.displayedVideoWidth
          const videoHeight = adjustedVideoArea.displayedVideoHeight

          return (
            <div
              key={`light-${aspectRatio}-${videoWidth}-${videoHeight}`}
              className="absolute inset-0 pointer-events-none transition-opacity duration-300"
              style={{ zIndex: 10 }} // Lower z-index so controls can overlay
            >
              {/* Top area - full width above video */}
              <div
                className="absolute bg-white transition-all duration-300"
                style={{
                  left: 0,
                  top: 0,
                  width: `${screenWidth}px`,
                  height: `${Math.max(0, videoTop - lightBorderWidth)}px`,
                  opacity: lightIntensity / 100,
                }}
              />

              {/* Bottom area - full width below video */}
              <div
                className="absolute bg-white transition-all duration-300"
                style={{
                  left: 0,
                  top: `${videoTop + videoHeight + lightBorderWidth}px`,
                  width: `${screenWidth}px`,
                  height: `${Math.max(0, screenHeight - (videoTop + videoHeight + lightBorderWidth))}px`,
                  opacity: lightIntensity / 100,
                }}
              />

              {/* Left area - full height beside video */}
              <div
                className="absolute bg-white transition-all duration-300"
                style={{
                  left: 0,
                  top: 0,
                  width: `${Math.max(0, videoLeft - lightBorderWidth)}px`,
                  height: `${screenHeight}px`,
                  opacity: lightIntensity / 100,
                }}
              />

              {/* Right area - full height beside video */}
              <div
                className="absolute bg-white transition-all duration-300"
                style={{
                  left: `${videoLeft + videoWidth + lightBorderWidth}px`,
                  top: 0,
                  width: `${Math.max(0, screenWidth - (videoLeft + videoWidth + lightBorderWidth))}px`,
                  height: `${screenHeight}px`,
                  opacity: lightIntensity / 100,
                }}
              />

              {/* Ring areas around video */}
              {/* Top ring */}
              <div
                className="absolute bg-white transition-all duration-300"
                style={{
                  left: `${Math.max(0, videoLeft - lightBorderWidth)}px`,
                  top: `${Math.max(0, videoTop - lightBorderWidth)}px`,
                  width: `${videoWidth + lightBorderWidth * 2}px`,
                  height: `${lightBorderWidth}px`,
                  opacity: lightIntensity / 100,
                }}
              />

              {/* Bottom ring */}
              <div
                className="absolute bg-white transition-all duration-300"
                style={{
                  left: `${Math.max(0, videoLeft - lightBorderWidth)}px`,
                  top: `${videoTop + videoHeight}px`,
                  width: `${videoWidth + lightBorderWidth * 2}px`,
                  height: `${lightBorderWidth}px`,
                  opacity: lightIntensity / 100,
                }}
              />

              {/* Left ring */}
              <div
                className="absolute bg-white transition-all duration-300"
                style={{
                  left: `${Math.max(0, videoLeft - lightBorderWidth)}px`,
                  top: `${videoTop}px`,
                  width: `${lightBorderWidth}px`,
                  height: `${videoHeight}px`,
                  opacity: lightIntensity / 100,
                }}
              />

              {/* Right ring */}
              <div
                className="absolute bg-white transition-all duration-300"
                style={{
                  left: `${videoLeft + videoWidth}px`,
                  top: `${videoTop}px`,
                  width: `${lightBorderWidth}px`,
                  height: `${videoHeight}px`,
                  opacity: lightIntensity / 100,
                }}
              />
            </div>
          )
        })()}
    </>
  )
}
