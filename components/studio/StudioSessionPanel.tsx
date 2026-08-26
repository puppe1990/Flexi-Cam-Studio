"use client"

import type React from "react"
import { Button } from "@/components/ui/button"

import { Camera, Square, ZoomIn, Move } from "lucide-react"

import type { VideoEffect } from "@/types/camera"
import type { StudioStageModel } from "@/components/studio/studio-stage-model"

export function StudioSessionPanel({ stage }: { stage: StudioStageModel }) {
  const {
    cropArea,
    effectIntensity,
    isCropMode,
    isEffectCropMode,
    isFullscreen,
    isLightMode,
    isMirrored,
    lightIntensity,
    panOffset,
    pipPosition,
    recordingMode,
    recordingState,
    screenStream,
    stopRecording,
    videoEffect,
    zoomLevel,
  } = stage

  return (
    <>
      {/* Controls */}
      <div className="space-y-4">
        {/* Recording Controls */}
        {recordingState === "recording" && (
          <div className="flex justify-center gap-4">
            <Button onClick={stopRecording} size="lg" variant="destructive">
              <Square className="w-5 h-5 mr-2" />
              Stop Recording
            </Button>
          </div>
        )}

        {/* Zoom Info */}
        {recordingState === "idle" && zoomLevel !== 1 && (
          <div className="studio-callout studio-callout--accent">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ZoomIn className="w-4 h-4" />
              <span className="font-medium">
                Zoom Active: {Math.round(zoomLevel * 100)}%
              </span>
            </div>
            <p>
              Use mouse to pan when zoomed • Keyboard: +/- to zoom, 0 to reset
            </p>
            {(panOffset.x !== 0 || panOffset.y !== 0) && (
              <p className="text-xs text-muted-foreground mt-1">
                Pan offset: {Math.round(panOffset.x)}px,{" "}
                {Math.round(panOffset.y)}px
              </p>
            )}
          </div>
        )}

        {/* Mirror Info */}
        {recordingState === "idle" && isMirrored && (
          <div className="studio-callout studio-callout--ok">
            <div className="flex items-center justify-center gap-2 mb-2">
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
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
              <span className="font-medium">Mirror Mode Active</span>
            </div>
            <p>
              Video is horizontally flipped • Perfect for selfie-style recording
            </p>
          </div>
        )}

        {/* Light Mode Info */}
        {recordingState === "idle" && isLightMode && isFullscreen && (
          <div className="studio-callout studio-callout--warn">
            <div className="flex items-center justify-center gap-2 mb-2">
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
              <span className="font-medium">
                Light Mode Active ({lightIntensity}%)
              </span>
            </div>
            <p>
              Professional illumination in fullscreen mode: Ring light for
              16:9/4:3 videos, full-screen light for 9:16 vertical and 1:1
              square videos • Controls overlay on top of light as needed •
              Adjust intensity with +/- controls
            </p>
          </div>
        )}

        {/* Effect Info */}
        {recordingState === "idle" &&
          videoEffect !== ("none" as VideoEffect) && (
            <div className="studio-callout studio-callout--accent">
              <div className="flex items-center justify-center gap-2 mb-2">
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
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span className="font-medium">
                  {videoEffect === "blur" ? "Blur Effect" : "Pixelate Effect"}{" "}
                  Active (Intensity: {effectIntensity})
                  {isEffectCropMode && " - Area Mode"}
                </span>
              </div>
              <p>
                {videoEffect === "blur"
                  ? "Video is blurred for privacy or artistic effect"
                  : "Video is pixelated with retro-style blocks"}
                {isEffectCropMode && " - Effect applied only to selected area"}
              </p>
            </div>
          )}

        {/* Crop Mode Info */}
        {recordingState === "idle" && isCropMode && (
          <div className="text-center text-sm text-muted-foreground bg-orange-50 rounded-lg p-3">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Move className="w-4 h-4" />
              <span className="font-medium">Crop Mode Active</span>
            </div>
            <p>Drag the orange rectangle to move • Drag corners to resize</p>
            <p className="text-xs text-muted-foreground mt-1">
              Area: {Math.round(cropArea.width * 100)}% ×{" "}
              {Math.round(cropArea.height * 100)}% • Position:{" "}
              {Math.round(cropArea.x * 100)}%, {Math.round(cropArea.y * 100)}%
            </p>
          </div>
        )}

        {/* PIP Mode Info */}
        {recordingState === "idle" &&
          recordingMode === "pip" &&
          screenStream && (
            <div className="studio-callout studio-callout--accent">
              <div className="flex items-center justify-center gap-2 mb-2">
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
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <Camera className="w-4 h-4" />
                <span className="font-medium">Picture-in-Picture Active</span>
              </div>
              <p>
                Screen capture with webcam overlay • Drag webcam to reposition •
                Drag corner to resize
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Webcam Center: {Math.round(pipPosition.x)}%,{" "}
                {Math.round(pipPosition.y)}% • Size:{" "}
                {Math.round(pipPosition.width)}% ×{" "}
                {Math.round(pipPosition.height)}%
              </p>
            </div>
          )}

        {/* Screen Recording Mode Info */}
        {recordingState === "idle" &&
          recordingMode === "screen" &&
          screenStream && (
            <div className="studio-callout studio-callout--ok">
              <div className="flex items-center justify-center gap-2 mb-2">
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
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span className="font-medium">Screen Recording Mode</span>
              </div>
              <p>
                Recording your screen with audio • Perfect for tutorials and
                presentations
              </p>
            </div>
          )}

        {/* Webcam Mode Info */}
        {recordingState === "idle" && recordingMode === "webcam" && (
          <div className="studio-callout studio-callout--info">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Camera className="w-4 h-4" />
              <span className="font-medium">Webcam Recording Mode</span>
            </div>
            <p>
              Traditional camera recording with all effects and features
              available
            </p>
          </div>
        )}

        {/* Recording Controls */}
        {recordingState === "recording" && (
          <div className="flex justify-center gap-4">
            <Button onClick={stopRecording} size="lg" variant="destructive">
              <Square className="w-5 h-5 mr-2" />
              Stop Recording
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
