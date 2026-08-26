"use client"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

import {
  Camera,
  Square,
  Play,
  Pause,
  ImageIcon,
  Crop,
  ZoomIn,
  ZoomOut,
  ZoomInIcon as ResetZoom,
} from "lucide-react"
import { formatTime } from "@/lib/utils/video"
import type { VideoEffect } from "@/types/camera"
import type { StudioStageModel } from "@/components/studio/studio-stage-model"

export function StudioFullscreenHud({ stage }: { stage: StudioStageModel }) {
  const {
    aspectRatio,
    cameraError,
    currentTime,
    effectIntensity,
    isCapturingScreenshot,
    isCropMode,
    isEffectCropMode,
    isFullscreen,
    isHDScreenshot,
    isLightMode,
    isMirrored,
    isPlaying,
    isTimerActive,
    lightIntensity,
    panOffset,
    recordingState,
    resetZoom,
    screenshotFormat,
    screenshotTimer,
    seekTo,
    setAspectRatio,
    setEffectIntensity,
    setIsHDScreenshot,
    setScreenshotFormat,
    setScreenshotTimer,
    setVideoEffect,
    startRecording,
    stopRecording,
    takeScreenshot,
    timerCountdown,
    toggleCropMode,
    toggleEffectCropMode,
    toggleFullscreen,
    toggleLightMode,
    toggleMirror,
    togglePlayback,
    videoDuration,
    videoEffect,
    zoomIn,
    zoomLevel,
    zoomOut,
    adjustLightIntensity,
  } = stage

  return (
    <>
      {/* Fullscreen Controls Overlay */}
      {isFullscreen && (
        <div
          className={`absolute bottom-6 ${
            aspectRatio === "9:16"
              ? "left-1/2 transform -translate-x-1/2 w-80" // Centered for vertical
              : "left-1/2 transform -translate-x-1/2" // Centered for all
          } flex flex-col items-center gap-4`}
          style={{ zIndex: 20 }} // Higher z-index to appear above light
        >
          {/* Main Controls Row */}
          <div className="flex items-center gap-4 bg-black/70 backdrop-blur-sm rounded-full px-6 py-3">
            {/* Camera Controls in Fullscreen */}
            {recordingState === "idle" && (
              <>
                <Button
                  onClick={toggleCropMode}
                  variant={isCropMode ? "default" : "outline"}
                  size="sm"
                  className={
                    isCropMode
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                  }
                >
                  <Crop className="w-4 h-4 mr-2" />
                  {isCropMode ? "Exit Crop" : "Crop Mode"}
                </Button>
                <Button
                  onClick={() => takeScreenshot()}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
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
                  className="bg-red-500 hover:bg-red-600 text-white"
                  disabled={!!cameraError}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Record
                </Button>
              </>
            )}

            {/* Recording Controls in Fullscreen */}
            {recordingState === "recording" && (
              <Button
                onClick={stopRecording}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop
              </Button>
            )}

            {/* Playback Controls in Fullscreen */}
            {recordingState === "stopped" && (
              <>
                <Button
                  onClick={togglePlayback}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>
                <div className="text-white text-sm font-medium">
                  {formatTime(currentTime)} / {formatTime(videoDuration)}
                </div>
              </>
            )}

            {/* Exit Fullscreen Button */}
            <Button
              onClick={toggleFullscreen}
              variant="outline"
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              Exit Fullscreen
            </Button>
          </div>

          {/* Settings Row - Only show when idle */}
          {recordingState === "idle" && (
            <div className="flex items-center gap-2 bg-black/70 backdrop-blur-sm rounded-full px-4 py-2">
              {/* Aspect Ratio Buttons */}
              <div className="flex items-center gap-1">
                <span className="text-white text-xs font-medium mr-1">
                  Aspect:
                </span>
                {(["16:9", "9:16", "4:3", "1:1"] as const).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                      aspectRatio === ratio
                        ? "bg-blue-500 text-white"
                        : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>

              <div className="w-px h-4 bg-white/20" />

              {/* Zoom Controls */}
              <div className="flex items-center gap-1">
                <span className="text-white text-xs font-medium mr-1">
                  Zoom:
                </span>
                <button
                  onClick={zoomOut}
                  disabled={zoomLevel <= 0.5}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                    zoomLevel <= 0.5
                      ? "bg-white/5 text-white/30 cursor-not-allowed"
                      : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  <ZoomOut className="w-3 h-3" />
                </button>
                <span className="text-white text-xs font-mono w-12 text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={zoomIn}
                  disabled={zoomLevel >= 3}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                    zoomLevel >= 3
                      ? "bg-white/5 text-white/30 cursor-not-allowed"
                      : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  <ZoomIn className="w-3 h-3" />
                </button>
                {(zoomLevel !== 1 ||
                  panOffset.x !== 0 ||
                  panOffset.y !== 0) && (
                  <button
                    onClick={resetZoom}
                    className="px-2 py-1 rounded text-xs font-medium transition-all bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                  >
                    <ResetZoom className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="w-px h-4 bg-white/20" />

              {/* Mirror Controls */}
              <div className="flex items-center gap-1">
                <span className="text-white text-xs font-medium mr-1">
                  Mirror:
                </span>
                <button
                  onClick={toggleMirror}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                    isMirrored
                      ? "bg-green-500 text-white"
                      : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  {isMirrored ? "On" : "Off"}
                </button>
              </div>

              <div className="w-px h-4 bg-white/20" />

              {/* Light Mode Controls */}
              <div className="flex items-center gap-1">
                <span className="text-white text-xs font-medium mr-1">
                  Light:
                </span>
                <button
                  onClick={toggleLightMode}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                    isLightMode
                      ? "bg-yellow-500 text-white"
                      : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  {isLightMode ? "On" : "Off"}
                </button>
                {isLightMode && (
                  <>
                    <button
                      onClick={() => adjustLightIntensity(lightIntensity - 20)}
                      disabled={lightIntensity <= 10}
                      className={`px-1 py-1 rounded text-xs font-medium transition-all ${
                        lightIntensity <= 10
                          ? "bg-white/5 text-white/30 cursor-not-allowed"
                          : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                      }`}
                    >
                      -
                    </button>
                    <span className="text-white text-xs font-mono w-10 text-center">
                      {lightIntensity}%
                    </span>
                    <button
                      onClick={() => adjustLightIntensity(lightIntensity + 20)}
                      disabled={lightIntensity >= 100}
                      className={`px-1 py-1 rounded text-xs font-medium transition-all ${
                        lightIntensity >= 100
                          ? "bg-white/5 text-white/30 cursor-not-allowed"
                          : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                      }`}
                    >
                      +
                    </button>
                  </>
                )}
              </div>

              <div className="w-px h-4 bg-white/20" />

              {/* Effect Controls */}
              <div className="flex items-center gap-1">
                <span className="text-white text-xs font-medium mr-1">
                  Effect:
                </span>
                {(["none", "blur", "pixelate"] as const).map((effect) => (
                  <button
                    key={effect}
                    onClick={() => setVideoEffect(effect)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                      videoEffect === effect
                        ? "bg-purple-500 text-white"
                        : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                    }`}
                  >
                    {effect === "none"
                      ? "Off"
                      : effect === "blur"
                        ? "Blur"
                        : "Pixel"}
                  </button>
                ))}
              </div>

              {videoEffect !== ("none" as VideoEffect) && (
                <>
                  <div className="flex items-center gap-1">
                    <span className="text-white text-xs font-medium mr-1">
                      Level:
                    </span>
                    <button
                      onClick={() =>
                        setEffectIntensity(Math.max(1, effectIntensity - 1))
                      }
                      disabled={effectIntensity <= 1}
                      className={`px-1 py-1 rounded text-xs font-medium transition-all ${
                        effectIntensity <= 1
                          ? "bg-white/5 text-white/30 cursor-not-allowed"
                          : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                      }`}
                    >
                      -
                    </button>
                    <span className="text-white text-xs font-mono w-6 text-center">
                      {effectIntensity}
                    </span>
                    <button
                      onClick={() =>
                        setEffectIntensity(Math.min(10, effectIntensity + 1))
                      }
                      disabled={effectIntensity >= 10}
                      className={`px-1 py-1 rounded text-xs font-medium transition-all ${
                        effectIntensity >= 10
                          ? "bg-white/5 text-white/30 cursor-not-allowed"
                          : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                      }`}
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-white text-xs font-medium mr-1">
                      Area:
                    </span>
                    <button
                      onClick={toggleEffectCropMode}
                      className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                        isEffectCropMode
                          ? "bg-purple-500 text-white"
                          : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                      }`}
                    >
                      {isEffectCropMode ? "On" : "Off"}
                    </button>
                  </div>
                </>
              )}

              <div className="w-px h-4 bg-white/20" />

              {/* Timer Buttons */}
              <div className="flex items-center gap-1">
                <span className="text-white text-xs font-medium mr-1">
                  Timer:
                </span>
                {([0, 3, 5, 10] as const).map((timer) => (
                  <button
                    key={timer}
                    onClick={() => setScreenshotTimer(timer)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                      screenshotTimer === timer
                        ? "bg-green-500 text-white"
                        : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                    }`}
                  >
                    {timer === 0 ? "Off" : `${timer}s`}
                  </button>
                ))}
              </div>

              <div className="w-px h-4 bg-white/20" />

              {/* Format Buttons */}
              <div className="flex items-center gap-1">
                <span className="text-white text-xs font-medium mr-1">
                  Format:
                </span>
                {(["png", "jpeg"] as const).map((format) => (
                  <button
                    key={format}
                    onClick={() => setScreenshotFormat(format)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                      screenshotFormat === format
                        ? "bg-purple-500 text-white"
                        : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                    }`}
                  >
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="w-px h-4 bg-white/20" />

              {/* Quality Buttons */}
              <div className="flex items-center gap-1">
                <span className="text-white text-xs font-medium mr-1">
                  Quality:
                </span>
                <button
                  onClick={() => setIsHDScreenshot(!isHDScreenshot)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                    isHDScreenshot
                      ? "bg-purple-500 text-white"
                      : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                  }`}
                  title={
                    isHDScreenshot
                      ? "4K Quality (3840x2160 for 16:9)"
                      : "HD Quality (1920x1080 for 16:9)"
                  }
                >
                  {isHDScreenshot ? "4K" : "HD"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fullscreen Timeline */}
      {isFullscreen && recordingState === "stopped" && videoDuration > 0 && (
        <div
          className={`absolute bottom-20 ${
            aspectRatio === "9:16"
              ? "left-1/2 transform -translate-x-1/2 w-80" // Centered for vertical
              : "left-6 right-6" // Full width for landscape/square
          }`}
          style={{ zIndex: 20 }} // Higher z-index to appear above light
        >
          <Slider
            value={[currentTime]}
            max={videoDuration || 0}
            step={0.1}
            onValueChange={([value]) => {
              if (isFinite(value) && videoDuration > 0) {
                seekTo(value)
              }
            }}
            className="w-full"
          />
        </div>
      )}
    </>
  )
}
