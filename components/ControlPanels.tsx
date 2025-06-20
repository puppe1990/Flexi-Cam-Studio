"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ZoomIn, ZoomOut, ZoomInIcon as ResetZoom } from "lucide-react"
import { 
  ExportFormat, 
  ScreenshotFormat, 
  AspectRatio, 
  VideoEffect, 
  RecordingState 
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
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-center gap-4">
          <label className="text-sm font-medium">Export Format:</label>
          <Select value={exportFormat} onValueChange={onExportFormatChange}>
            <SelectTrigger className="w-32">
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
            <Badge variant="secondary" className="text-xs">
              {mp4RecordingSupported ? "Native" : "Converted"}
            </Badge>
          )}
        </div>

        {exportFormat === "mp4" && !mp4RecordingSupported && !webCodecsSupported && (
          <div className="mt-2 text-center text-sm text-amber-600 bg-amber-50 rounded-lg p-2">
            ⚠️ MP4 export will use conversion method (may have compatibility limitations)
          </div>
        )}
        {(exportFormat === "mp4" || exportFormat === "avi" || exportFormat === "mov" || exportFormat === "3gp") && (
          <div className="mt-2 text-center text-sm text-green-600 bg-green-50 rounded-lg p-2">
            ✅ This format is compatible with WhatsApp
            {exportFormat === "3gp" && " (optimized for mobile networks)"}
          </div>
        )}
        {(exportFormat === "avi" || exportFormat === "mov" || exportFormat === "3gp") && (
          <div className="mt-2 text-center text-sm text-blue-600 bg-blue-50 rounded-lg p-2">
            ℹ️ Note: {exportFormat.toUpperCase()} format may be saved as MP4 due to browser limitations, but the
            file extension will be .{exportFormat}
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
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Screenshot Format:</label>
            <Select value={screenshotFormat} onValueChange={onScreenshotFormatChange}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="jpeg">JPEG</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Timer:</label>
            <Select
              value={screenshotTimer.toString()}
              onValueChange={(value) => onScreenshotTimerChange(Number.parseInt(value))}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No Timer</SelectItem>
                <SelectItem value="3">3 seconds</SelectItem>
                <SelectItem value="5">5 seconds</SelectItem>
                <SelectItem value="10">10 seconds</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {screenshotTimer > 0 && (
            <div className="text-xs text-slate-500 bg-blue-50 px-3 py-1 rounded-full">
              📸 {screenshotTimer}s delay enabled
            </div>
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
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Video Aspect Ratio:</label>
            <Select value={aspectRatio} onValueChange={onAspectRatioChange}>
              <SelectTrigger className="w-32">
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
            <label className="text-sm font-medium">Zoom:</label>
            <div className="flex items-center gap-1">
              <Button onClick={onZoomOut} variant="outline" size="sm" disabled={zoomLevel <= 0.5}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-mono w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
              <Button onClick={onZoomIn} variant="outline" size="sm" disabled={zoomLevel >= 3}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                onClick={onResetZoom}
                variant="outline"
                size="sm"
                disabled={zoomLevel === 1 && panOffset.x === 0 && panOffset.y === 0}
              >
                <ResetZoom className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Mirror:</label>
            <Button
              onClick={onToggleMirror}
              variant={isMirrored ? "default" : "outline"}
              size="sm"
              className={isMirrored ? "bg-green-500 hover:bg-green-600" : ""}
            >
              {isMirrored ? "On" : "Off"}
            </Button>
          </div>

          <div className="text-xs text-slate-500 bg-blue-50 px-3 py-1 rounded-full">
            {aspectRatio === "16:9" && "📺 Standard widescreen"}
            {aspectRatio === "9:16" && "📱 Mobile vertical (Stories, Reels)"}
            {aspectRatio === "4:3" && "📷 Classic camera ratio"}
            {aspectRatio === "1:1" && "⬜ Square (Instagram posts)"}
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
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Effect:</label>
              <Select value={videoEffect} onValueChange={onVideoEffectChange}>
                <SelectTrigger className="w-28">
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
                  <label className="text-sm font-medium">Intensity:</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">1</span>
                    <Slider
                      value={[effectIntensity]}
                      min={1}
                      max={10}
                      step={1}
                      onValueChange={([value]) => onEffectIntensityChange(value)}
                      className="w-20"
                    />
                    <span className="text-xs text-slate-500">10</span>
                    <span className="text-sm font-mono w-6 text-center">{effectIntensity}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Apply to:</label>
                  <Button
                    onClick={onToggleEffectCropMode}
                    variant={isEffectCropMode ? "default" : "outline"}
                    size="sm"
                    className={isEffectCropMode ? "bg-purple-500 hover:bg-purple-600" : ""}
                  >
                    {isEffectCropMode ? "Selected Area" : "Entire Video"}
                  </Button>
                </div>
              </>
            )}
          </div>

          {videoEffect !== "none" && isEffectCropMode && (
            <div className="text-center text-sm text-slate-600 bg-purple-50 rounded-lg p-3">
              <div className="flex items-center justify-center gap-2 mb-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span className="font-medium">Effect Area Mode Active</span>
              </div>
              <p>{videoEffect === "blur" ? "Blur" : "Pixelate"} effect will only be applied to the purple area</p>
              <p className="text-xs text-slate-500 mt-1">
                Area: {Math.round(effectCropArea.width * 100)}% × {Math.round(effectCropArea.height * 100)}% •
                Position: {Math.round(effectCropArea.x * 100)}%, {Math.round(effectCropArea.y * 100)}%
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 