"use client"

import type React from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Play, Scissors, Clock } from "lucide-react"
import { formatTime } from "@/lib/utils/video"
import type { StudioStageModel } from "@/components/studio/studio-stage-model"

import { StudioVideoStage } from "@/components/studio/StudioVideoStage"
import { StudioIdleToolbar } from "@/components/studio/StudioIdleToolbar"
import { StudioSessionPanel } from "@/components/studio/StudioSessionPanel"
import { StudioPlaybackEditor } from "@/components/studio/StudioPlaybackEditor"

export function CameraHero({ stage }: { stage: StudioStageModel }) {
  const {
    cameraError,
    exportFormat,
    isCropMode,
    recordingState,
    recordingTime,
    screenError,
    zoomLevel,
  } = stage

  return (
    <Card className="studio-panel studio-panel--hero overflow-hidden">
      <CardHeader className="studio-panel-header pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-xl">
            {recordingState === "recording" && (
              <>
                <div className="flex items-center gap-2 relative">
                  <div className="studio-rec-dot w-3 h-3" />
                  <div className="w-4 h-4 bg-red-500/30 rounded-full animate-ping absolute" />
                </div>
                <span className="text-destructive font-bold">
                  Recording {isCropMode && "(Cropped)"}
                </span>
              </>
            )}
            {recordingState === "idle" && (
              <>
                <div className="studio-icon-btn">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <span className="text-foreground">
                  Camera Preview {isCropMode && "(Crop Mode)"}{" "}
                  {zoomLevel !== 1 && `(${Math.round(zoomLevel * 100)}%)`}
                </span>
              </>
            )}
            {recordingState === "stopped" && (
              <>
                <div className="studio-icon-btn bg-emerald-600">
                  <Play className="w-5 h-5 text-white" />
                </div>
                <span className="text-foreground">Video Preview</span>
              </>
            )}
            {recordingState === "editing" && (
              <>
                <div className="studio-icon-btn bg-amber-600">
                  <Scissors className="w-5 h-5 text-white" />
                </div>
                <span className="text-foreground">Video Editor</span>
              </>
            )}
            {recordingState === "processing" && (
              <>
                <div className="studio-icon-btn bg-muted text-foreground">
                  <Clock className="w-5 h-5 text-white animate-spin" />
                </div>
                <span className="text-muted-foreground">
                  {exportFormat === "mp4"
                    ? "Converting to MP4..."
                    : "Processing Video..."}
                </span>
              </>
            )}
          </CardTitle>

          {recordingState === "recording" && (
            <Badge
              variant="destructive"
              className="animate-pulse bg-destructive px-4 py-2 text-destructive-foreground font-bold font-mono"
            >
              {formatTime(recordingTime)}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-8">
        {/* Error Messages */}
        {cameraError && (
          <div className="studio-callout studio-callout--warn border-destructive/30 text-left">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-xl">
                <svg
                  className="w-5 h-5 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <span className="font-semibold">{cameraError}</span>
            </div>
          </div>
        )}

        {screenError && (
          <div className="studio-callout studio-callout--warn text-left">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-xl">
                <svg
                  className="w-5 h-5 text-orange-600"
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
              </div>
              <span className="font-semibold">{screenError}</span>
            </div>
          </div>
        )}

        <StudioVideoStage stage={stage} />
        <StudioIdleToolbar stage={stage} />
        <StudioSessionPanel stage={stage} />
        <StudioPlaybackEditor stage={stage} />
      </CardContent>
    </Card>
  )
}
