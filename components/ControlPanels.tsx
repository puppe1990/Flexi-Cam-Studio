"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ZoomIn, ZoomOut, ZoomInIcon as ResetZoom } from "lucide-react"
import {
  ExportFormat,
  ScreenshotFormat,
  AspectRatio,
  VideoEffect,
  RecordingState,
} from "@/types/camera"

interface ExportFormatPanelProps {
  recordingState: RecordingState
  exportFormat: ExportFormat
  onExportFormatChange: (format: ExportFormat) => void
  mp4RecordingSupported: boolean
  webCodecsSupported: boolean
}

export const ExportFormatPanel: React.FC<ExportFormatPanelProps> = ({
  recordingState,
  exportFormat,
  onExportFormatChange,
  mp4RecordingSupported,
  webCodecsSupported,
}) => {
  if (recordingState !== "stopped" && recordingState !== "editing") {
    return null
  }

  return (
    <Card className="studio-panel overflow-hidden">
      <CardContent className="pt-6">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <label className="studio-label normal-case tracking-normal">
            Export format
          </label>
          <Select value={exportFormat} onValueChange={onExportFormatChange}>
            <SelectTrigger className="w-36 bg-background border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="webm">WebM</SelectItem>
              <SelectItem value="mp4">MP4 (WhatsApp)</SelectItem>
              <SelectItem value="avi">AVI (WhatsApp)</SelectItem>
              <SelectItem value="mov">MOV (WhatsApp)</SelectItem>
              <SelectItem value="3gp">3GP (WhatsApp)</SelectItem>
            </SelectContent>
          </Select>

          {exportFormat === "mp4" && (
            <Badge
              variant="secondary"
              className="border-primary/30 bg-primary/10 text-primary font-normal"
            >
              {mp4RecordingSupported ? "Native" : "Converted"}
            </Badge>
          )}
        </div>

        {exportFormat === "mp4" &&
          !mp4RecordingSupported &&
          !webCodecsSupported && (
            <div className="mt-4 studio-callout studio-callout--warn text-left text-sm">
              MP4 export will use conversion (may have compatibility
              limitations)
            </div>
          )}
        {(exportFormat === "mp4" ||
          exportFormat === "avi" ||
          exportFormat === "mov" ||
          exportFormat === "3gp") && (
          <div className="mt-3 studio-callout studio-callout--ok text-left text-sm">
            WhatsApp-compatible format
            {exportFormat === "3gp" && " (optimized for mobile networks)"}
          </div>
        )}
        {(exportFormat === "avi" ||
          exportFormat === "mov" ||
          exportFormat === "3gp") && (
          <div className="mt-3 studio-callout studio-callout--info text-left text-sm">
            {exportFormat.toUpperCase()} may be saved as MP4 due to browser
            limitations, but the file extension will be .{exportFormat}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface ScreenshotControlPanelProps {
  recordingState: RecordingState
  screenshotFormat: ScreenshotFormat
  screenshotTimer: number
  onScreenshotFormatChange: (format: ScreenshotFormat) => void
  onScreenshotTimerChange: (timer: number) => void
}

export const ScreenshotControlPanel: React.FC<ScreenshotControlPanelProps> = ({
  recordingState,
  screenshotFormat,
  screenshotTimer,
  onScreenshotFormatChange,
  onScreenshotTimerChange,
}) => {
  if (recordingState !== "idle") {
    return null
  }

  return (
    <Card className="studio-panel overflow-hidden">
      <CardContent className="pt-6">
        <div className="flex items-center justify-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="studio-label normal-case tracking-normal">
              Screenshot
            </label>
            <Select
              value={screenshotFormat}
              onValueChange={onScreenshotFormatChange}
            >
              <SelectTrigger className="w-24 bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="jpeg">JPEG</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label className="studio-label normal-case tracking-normal">
              Timer
            </label>
            <Select
              value={screenshotTimer.toString()}
              onValueChange={(value) =>
                onScreenshotTimerChange(Number.parseInt(value))
              }
            >
              <SelectTrigger className="w-28 bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No timer</SelectItem>
                <SelectItem value="3">3 segundos</SelectItem>
                <SelectItem value="5">5 segundos</SelectItem>
                <SelectItem value="10">10 segundos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {screenshotTimer > 0 && (
            <div className="studio-status-pill">{screenshotTimer}s delay</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface AspectRatioZoomPanelProps {
  recordingState: RecordingState
  aspectRatio: AspectRatio
  zoomLevel: number
  isMirrored: boolean
  onAspectRatioChange: (ratio: AspectRatio) => void
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void
  onToggleMirror: () => void
  panOffset: { x: number; y: number }
}

export const AspectRatioZoomPanel: React.FC<AspectRatioZoomPanelProps> = ({
  recordingState,
  aspectRatio,
  zoomLevel,
  isMirrored,
  onAspectRatioChange,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onToggleMirror,
  panOffset,
}) => {
  if (recordingState !== "idle") {
    return null
  }

  return (
    <Card className="studio-panel overflow-hidden">
      <CardContent className="pt-6">
        <div className="flex items-center justify-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="studio-label normal-case tracking-normal">
              Aspect ratio
            </label>
            <Select value={aspectRatio} onValueChange={onAspectRatioChange}>
              <SelectTrigger className="w-36 bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                <SelectItem value="9:16">9:16 (Vertical)</SelectItem>
                <SelectItem value="4:3">4:3 (Classic)</SelectItem>
                <SelectItem value="1:1">1:1 (Square)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label className="studio-label normal-case tracking-normal">
              Zoom
            </label>
            <div className="flex items-center gap-1">
              <Button
                onClick={onZoomOut}
                variant="outline"
                size="sm"
                disabled={zoomLevel <= 0.5}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-mono w-12 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <Button
                onClick={onZoomIn}
                variant="outline"
                size="sm"
                disabled={zoomLevel >= 3}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                onClick={onResetZoom}
                variant="outline"
                size="sm"
                disabled={
                  zoomLevel === 1 && panOffset.x === 0 && panOffset.y === 0
                }
              >
                <ResetZoom className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="studio-label normal-case tracking-normal">
              Mirror
            </label>
            <Button
              onClick={onToggleMirror}
              variant={isMirrored ? "default" : "outline"}
              size="sm"
              className={
                isMirrored ? "bg-emerald-600 hover:bg-emerald-700" : ""
              }
            >
              {isMirrored ? "On" : "Off"}
            </Button>
          </div>

          <div className="studio-status-pill text-xs">
            {aspectRatio === "16:9" && "Standard widescreen"}
            {aspectRatio === "9:16" && "Vertical — Stories, Reels"}
            {aspectRatio === "4:3" && "Classic ratio"}
            {aspectRatio === "1:1" && "Square — Instagram"}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface EffectControlPanelProps {
  recordingState: RecordingState
  videoEffect: VideoEffect
  effectIntensity: number
  isEffectCropMode: boolean
  effectCropArea: { x: number; y: number; width: number; height: number }
  onVideoEffectChange: (effect: VideoEffect) => void
  onEffectIntensityChange: (intensity: number) => void
  onToggleEffectCropMode: () => void
}

export const EffectControlPanel: React.FC<EffectControlPanelProps> = ({
  recordingState,
  videoEffect,
  effectIntensity,
  isEffectCropMode,
  effectCropArea,
  onVideoEffectChange,
  onEffectIntensityChange,
  onToggleEffectCropMode,
}) => {
  if (recordingState !== "idle") {
    return null
  }

  return (
    <Card className="studio-panel overflow-hidden">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="studio-label normal-case tracking-normal">
                Effect
              </label>
              <Select value={videoEffect} onValueChange={onVideoEffectChange}>
                <SelectTrigger className="w-28 bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="blur">Blur</SelectItem>
                  <SelectItem value="pixelate">Pixelate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {videoEffect !== "none" && (
              <>
                <div className="flex items-center gap-2">
                  <label className="studio-label normal-case tracking-normal">
                    Intensity
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">1</span>
                    <Slider
                      value={[effectIntensity]}
                      min={1}
                      max={10}
                      step={1}
                      onValueChange={([value]) =>
                        onEffectIntensityChange(value)
                      }
                      className="w-20"
                    />
                    <span className="text-xs text-muted-foreground">10</span>
                    <span className="text-sm font-mono w-6 text-center">
                      {effectIntensity}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="studio-label normal-case tracking-normal">
                    Apply to
                  </label>
                  <Button
                    onClick={onToggleEffectCropMode}
                    variant={isEffectCropMode ? "default" : "outline"}
                    size="sm"
                  >
                    {isEffectCropMode ? "Selected area" : "Entire video"}
                  </Button>
                </div>
              </>
            )}
          </div>

          {videoEffect !== "none" && isEffectCropMode && (
            <div className="studio-callout studio-callout--accent text-sm">
              <p className="font-medium mb-1">Effect area mode active</p>
              <p>
                {videoEffect === "blur" ? "Blur" : "Pixelate"} will only be
                applied to the marked area
              </p>
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                {Math.round(effectCropArea.width * 100)}% ×{" "}
                {Math.round(effectCropArea.height * 100)}% • pos{" "}
                {Math.round(effectCropArea.x * 100)}%,{" "}
                {Math.round(effectCropArea.y * 100)}%
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
