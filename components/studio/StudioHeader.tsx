"use client"

import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Settings, Video } from "lucide-react"
import { formatTime } from "@/lib/utils/video"
import type { RecordingMode, RecordingState, VideoEffect } from "@/types/camera"

type StudioHeaderProps = {
  mp4RecordingSupported: boolean
  webCodecsSupported: boolean
  recordingMode: RecordingMode
  isCropMode: boolean
  zoomLevel: number
  isMirrored: boolean
  videoEffect: VideoEffect
  effectIntensity: number
  isEffectCropMode: boolean
  isLightMode: boolean
  lightIntensity: number
  isHDScreenshot: boolean
  recordingState: RecordingState
  recordingTime: number
}

export function StudioHeader({
  mp4RecordingSupported,
  webCodecsSupported,
  recordingMode,
  isCropMode,
  zoomLevel,
  isMirrored,
  videoEffect,
  effectIntensity,
  isEffectCropMode,
  isLightMode,
  lightIntensity,
  isHDScreenshot,
  recordingState,
  recordingTime,
}: StudioHeaderProps) {
  return (
    <header className="studio-header">
      <div className="studio-brand">
        <div className="studio-brand-icon">
          <Video className="w-6 h-6" />
        </div>
        <div>
          <h1 className="studio-brand-title">FlexiCam Studio</h1>
          <p className="studio-brand-tagline">
            Professional camera recorder & video editor
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <ThemeToggle />
        <div className="studio-status-bar">
          <div
            className={`studio-status-pill ${mp4RecordingSupported ? "studio-status-pill--ok" : "studio-status-pill--warn"}`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>
              {mp4RecordingSupported ? "Native MP4" : "MP4 via conversion"}
            </span>
          </div>
          {webCodecsSupported && (
            <Badge
              variant="secondary"
              className="border-primary/30 bg-primary/10 text-primary font-normal"
            >
              WebCodecs
            </Badge>
          )}
          <Badge
            variant="outline"
            className="border-border bg-muted/50 font-normal"
          >
            {recordingMode === "webcam"
              ? "Webcam"
              : recordingMode === "screen"
                ? "Screen"
                : "Picture-in-Picture"}
          </Badge>
          {isCropMode && (
            <Badge
              variant="outline"
              className="border-amber-500/40 bg-amber-500/10 text-amber-400 font-normal"
            >
              Crop active
            </Badge>
          )}
          {zoomLevel !== 1 && (
            <Badge variant="outline" className="font-mono font-normal">
              Zoom {Math.round(zoomLevel * 100)}%
            </Badge>
          )}
          {isMirrored && (
            <Badge
              variant="outline"
              className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-normal"
            >
              Mirrored
            </Badge>
          )}
          {videoEffect !== ("none" as VideoEffect) && (
            <Badge
              variant="outline"
              className="border-primary/40 bg-primary/10 text-primary font-normal"
            >
              {videoEffect === "blur" ? "Blur" : "Pixelate"} {effectIntensity}
              {isEffectCropMode && " (area)"}
            </Badge>
          )}
          {isLightMode && (
            <Badge
              variant="outline"
              className="border-amber-500/40 bg-amber-500/10 text-amber-400 font-normal"
            >
              Ring {lightIntensity}%
            </Badge>
          )}
          {isHDScreenshot && (
            <Badge variant="outline" className="font-mono font-normal">
              4K
            </Badge>
          )}
          {recordingState === "recording" && (
            <div className="studio-status-pill studio-status-pill--live">
              <span className="studio-rec-dot" />
              <span className="font-mono">{formatTime(recordingTime)}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
