"use client"

import { ImageIcon } from "lucide-react"
import { formatTime } from "@/lib/utils/video"

import type { StudioStageModel } from "@/components/studio/studio-stage-model"

export function StudioCaptureOverlays({ stage }: { stage: StudioStageModel }) {
  const {
    cancelScreenshotTimer,
    exportFormat,
    isCropMode,
    isTimerActive,
    mp4RecordingSupported,
    processingProgress,
    recordingState,
    recordingTime,
    screenshotTimer,
    timerCountdown,
  } = stage

  return (
    <>
      {/* Recording Overlay */}
      {recordingState === "recording" && (
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          REC {formatTime(recordingTime)} {isCropMode && "(Cropped)"}
        </div>
      )}

      {/* Processing Overlay */}
      {recordingState === "processing" && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-card border border-border rounded-xl p-6 text-center space-y-4">
            <div className="text-lg font-semibold">
              {exportFormat === "mp4"
                ? "Converting to MP4..."
                : "Processing Video..."}
            </div>
            <div className="w-64 bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${processingProgress}%` }}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {Math.round(processingProgress)}%
            </div>
            {exportFormat === "mp4" && (
              <div className="text-xs text-muted-foreground">
                {mp4RecordingSupported
                  ? "Using native MP4 encoding"
                  : "Converting from WebM to MP4"}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timer Countdown Overlay */}
      {isTimerActive && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center animate-in fade-in duration-300">
          <div className="relative">
            {/* Outer Ring with Progress */}
            <div className="relative w-48 h-48">
              {/* Background Circle */}
              <svg
                className="w-48 h-48 transform -rotate-90"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="2"
                  fill="none"
                />
                {/* Progress Circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="url(#timerGradient)"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="283"
                  strokeDashoffset={
                    283 -
                    (283 * (screenshotTimer - timerCountdown)) / screenshotTimer
                  }
                  className="transition-all duration-1000 ease-linear"
                />
                <defs>
                  <linearGradient
                    id="timerGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="50%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#EC4899" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Inner Content */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-card rounded-full w-36 h-36 flex items-center justify-center shadow-2xl border border-border">
                  <div className="text-center">
                    {/* Main Number */}
                    <div className="text-6xl font-black text-primary font-mono animate-pulse transition-transform duration-300">
                      {timerCountdown}
                    </div>
                    {/* Status Text */}
                    <div className="text-sm font-medium text-muted-foreground mt-2 tracking-wide">
                      Taking screenshot...
                    </div>
                    {/* Progress Dots */}
                    <div className="flex justify-center gap-1 mt-3">
                      {Array.from({ length: screenshotTimer }).map(
                        (_, index) => (
                          <div
                            key={index}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                              index < screenshotTimer - timerCountdown
                                ? "bg-primary scale-110"
                                : "bg-slate-300"
                            }`}
                          />
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cancel Button - Floating outside */}
            <button
              onClick={cancelScreenshotTimer}
              className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 bg-destructive hover:bg-destructive/90 text-destructive-foreground px-6 py-3 rounded-full text-sm font-semibold transition-all duration-200 border border-destructive/50"
            >
              <svg
                className="w-4 h-4 mr-2 inline"
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
              Cancel Timer
            </button>

            {/* Camera Icon */}
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
              <div className="bg-primary p-3 rounded-full shadow-lg">
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
