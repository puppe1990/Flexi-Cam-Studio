"use client"

import type React from "react"
import { Button } from "@/components/ui/button"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Camera,
  ImageIcon,
  Crop,
  ZoomIn,
  ZoomOut,
  ZoomInIcon as ResetZoom,
} from "lucide-react"

import type {
  AspectRatio,
  RecordingMode,
  ScreenshotFormat,
  VideoEffect,
} from "@/types/camera"
import type { StudioStageModel } from "@/components/studio/studio-stage-model"

export function StudioIdleToolbar({ stage }: { stage: StudioStageModel }) {
  const {
    aspectRatio,
    cameraError,
    effectIntensity,
    isCapturingScreenshot,
    isCropMode,
    isEffectCropMode,
    isFullscreen,
    isHDScreenshot,
    isMirrored,
    isTimerActive,
    panOffset,
    recordingMode,
    recordingState,
    resetZoom,
    screenshotFormat,
    screenshotTimer,
    setAspectRatio,
    setEffectIntensity,
    setIsHDScreenshot,
    setScreenshotFormat,
    setScreenshotTimer,
    setVideoEffect,
    startRecording,
    switchToPip,
    switchToScreen,
    switchToWebcam,
    takeScreenshot,
    timerCountdown,
    toggleCropMode,
    toggleEffectCropMode,
    toggleMirror,
    videoEffect,
    zoomIn,
    zoomLevel,
    zoomOut,
  } = stage

  return (
    <>
      {/* Quick Controls Below Video Preview */}
      {!isFullscreen && (
        <div className="studio-controls-bar">
          {/* Main Camera Controls */}
          {recordingState === "idle" && (
            <div className="flex justify-center gap-4 flex-wrap">
              <Button
                onClick={toggleCropMode}
                variant={isCropMode ? "default" : "outline"}
                size="sm"
                className={
                  isCropMode
                    ? "bg-amber-600 hover:bg-amber-700 text-white"
                    : "border-border text-muted-foreground hover:text-foreground transition-colors"
                }
              >
                <Crop className="w-4 h-4 mr-2" />
                {isCropMode ? "Exit Crop" : "Crop"}
              </Button>

              <Button
                onClick={() => takeScreenshot()}
                variant="outline"
                size="sm"
                className="border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                disabled={
                  !!cameraError || isTimerActive || isCapturingScreenshot
                }
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                {isCapturingScreenshot
                  ? "Capturing..."
                  : isTimerActive
                    ? `${timerCountdown}s`
                    : "Screenshot"}
              </Button>

              <Button
                onClick={startRecording}
                size="sm"
                className="studio-btn-record transition-all duration-200"
                disabled={!!cameraError}
              >
                <Camera className="w-4 h-4 mr-2" />
                Record
              </Button>
            </div>
          )}

          {/* Quick Settings Row */}
          {recordingState === "idle" && (
            <div className="flex items-center justify-center gap-6 flex-wrap text-sm">
              {/* Recording Mode */}
              <div className="flex items-center gap-2">
                <label className="studio-label normal-case tracking-normal">
                  Mode:
                </label>
                <Select
                  value={recordingMode}
                  onValueChange={(value: RecordingMode) => {
                    if (value === "webcam") switchToWebcam()
                    else if (value === "screen") switchToScreen()
                    else if (value === "pip") switchToPip()
                  }}
                >
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="webcam">Webcam</SelectItem>
                    <SelectItem value="screen">Screen</SelectItem>
                    <SelectItem value="pip">PIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Aspect Ratio */}
              <div className="flex items-center gap-2">
                <label className="studio-label normal-case tracking-normal">
                  Aspect:
                </label>
                <Select
                  value={aspectRatio}
                  onValueChange={(value: AspectRatio) => setAspectRatio(value)}
                >
                  <SelectTrigger className="w-24 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="16:9">16:9</SelectItem>
                    <SelectItem value="9:16">9:16</SelectItem>
                    <SelectItem value="4:3">4:3</SelectItem>
                    <SelectItem value="1:1">1:1</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-2">
                <label className="studio-label normal-case tracking-normal">
                  Zoom:
                </label>
                <div className="flex items-center gap-1">
                  <Button
                    onClick={zoomOut}
                    variant="outline"
                    size="sm"
                    disabled={zoomLevel <= 0.5}
                    className="h-6 w-6 p-0"
                  >
                    <ZoomOut className="w-3 h-3" />
                  </Button>
                  <span className="text-xs font-mono w-12 text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <Button
                    onClick={zoomIn}
                    variant="outline"
                    size="sm"
                    disabled={zoomLevel >= 3}
                    className="h-6 w-6 p-0"
                  >
                    <ZoomIn className="w-3 h-3" />
                  </Button>
                  {(zoomLevel !== 1 ||
                    panOffset.x !== 0 ||
                    panOffset.y !== 0) && (
                    <Button
                      onClick={resetZoom}
                      variant="outline"
                      size="sm"
                      className="h-6 w-6 p-0"
                    >
                      <ResetZoom className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Mirror Toggle */}
              <div className="flex items-center gap-2">
                <label className="studio-label normal-case tracking-normal">
                  Mirror:
                </label>
                <Button
                  onClick={toggleMirror}
                  variant={isMirrored ? "default" : "outline"}
                  size="sm"
                  className={`h-6 px-2 text-xs ${isMirrored ? "bg-green-500 hover:bg-green-600" : ""}`}
                >
                  {isMirrored ? "On" : "Off"}
                </Button>
              </div>

              {/* Timer */}
              <div className="flex items-center gap-2">
                <label className="studio-label normal-case tracking-normal">
                  Timer:
                </label>
                <Select
                  value={screenshotTimer.toString()}
                  onValueChange={(value) =>
                    setScreenshotTimer(Number.parseInt(value))
                  }
                >
                  <SelectTrigger className="w-16 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Off</SelectItem>
                    <SelectItem value="3">3s</SelectItem>
                    <SelectItem value="5">5s</SelectItem>
                    <SelectItem value="10">10s</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Format */}
              <div className="flex items-center gap-2">
                <label className="studio-label normal-case tracking-normal">
                  Format:
                </label>
                <Select
                  value={screenshotFormat}
                  onValueChange={(value: ScreenshotFormat) =>
                    setScreenshotFormat(value)
                  }
                >
                  <SelectTrigger className="w-20 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="jpeg">JPEG</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* HD Quality */}
              <div className="flex items-center gap-2">
                <label className="studio-label normal-case tracking-normal">
                  Quality:
                </label>
                <Button
                  onClick={() => setIsHDScreenshot(!isHDScreenshot)}
                  variant={isHDScreenshot ? "default" : "outline"}
                  size="sm"
                  className={`h-6 px-2 text-xs ${isHDScreenshot ? "bg-primary hover:bg-primary/90" : ""}`}
                  title={
                    isHDScreenshot
                      ? "4K Quality (3840x2160 for 16:9)"
                      : "HD Quality (1920x1080 for 16:9)"
                  }
                >
                  {isHDScreenshot ? "4K" : "HD"}
                </Button>
              </div>

              {/* Ring light — fullscreen only */}
              <div className="flex items-center gap-2">
                <label className="studio-label normal-case tracking-normal">
                  Ring light:
                </label>
                <Button
                  onClick={() => {}}
                  variant="outline"
                  size="sm"
                  disabled
                  className="h-6 px-2 text-xs opacity-50 cursor-not-allowed"
                  title="Available in fullscreen (F)"
                >
                  Fullscreen
                </Button>
              </div>
            </div>
          )}

          {/* Effects Row */}
          {recordingState === "idle" && (
            <div className="flex items-center justify-center gap-4 flex-wrap text-sm border-t pt-3">
              <div className="flex items-center gap-2">
                <label className="studio-label normal-case tracking-normal">
                  Effect:
                </label>
                <Select
                  value={videoEffect}
                  onValueChange={(value: VideoEffect) => setVideoEffect(value)}
                >
                  <SelectTrigger className="w-24 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="blur">Blur</SelectItem>
                    <SelectItem value="pixelate">Pixelate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {videoEffect !== ("none" as VideoEffect) && (
                <>
                  <div className="flex items-center gap-2">
                    <label className="studio-label normal-case tracking-normal">
                      Level:
                    </label>
                    <div className="flex items-center gap-1">
                      <Button
                        onClick={() =>
                          setEffectIntensity(Math.max(1, effectIntensity - 1))
                        }
                        variant="outline"
                        size="sm"
                        disabled={effectIntensity <= 1}
                        className="h-6 w-6 p-0"
                      >
                        -
                      </Button>
                      <span className="text-xs font-mono w-6 text-center">
                        {effectIntensity}
                      </span>
                      <Button
                        onClick={() =>
                          setEffectIntensity(Math.min(10, effectIntensity + 1))
                        }
                        variant="outline"
                        size="sm"
                        disabled={effectIntensity >= 10}
                        className="h-6 w-6 p-0"
                      >
                        +
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="studio-label normal-case tracking-normal">
                      Area:
                    </label>
                    <Button
                      onClick={toggleEffectCropMode}
                      variant={isEffectCropMode ? "default" : "outline"}
                      size="sm"
                      className={`h-6 px-2 text-xs ${isEffectCropMode ? "bg-primary hover:bg-primary/90" : ""}`}
                    >
                      {isEffectCropMode ? "On" : "Off"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}
