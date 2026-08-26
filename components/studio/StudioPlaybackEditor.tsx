"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

import { Play, Pause, Download, Scissors, RotateCcw } from "lucide-react"
import { formatTime } from "@/lib/utils/video"

import type { StudioStageModel } from "@/components/studio/studio-stage-model"

export function StudioPlaybackEditor({ stage }: { stage: StudioStageModel }) {
  const {
    currentTime,
    downloadOriginalVideo,
    downloadTrimmedVideo,
    exportFormat,
    isGeneratingThumbnails,
    isPlaying,
    mp4RecordingSupported,
    recordingState,
    resetRecording,
    seekTo,
    setRecordingState,
    setTrimEnd,
    setTrimStart,
    thumbnails,
    togglePlayback,
    trimEnd,
    trimStart,
    videoDuration,
  } = stage

  return (
    <>
      {/* Playback Controls */}
      {recordingState === "stopped" && (
        <div className="space-y-6">
          <div className="flex justify-center gap-4 flex-wrap">
            <Button
              onClick={togglePlayback}
              variant="outline"
              className="border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 mr-2" />
              ) : (
                <Play className="w-5 h-5 mr-2" />
              )}
              {isPlaying ? "Pause" : "Play"}
            </Button>

            <Button
              onClick={() => setRecordingState("editing")}
              variant="outline"
              className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors"
            >
              <Scissors className="w-5 h-5 mr-2" />
              Edit Video
            </Button>

            <Button
              onClick={downloadOriginalVideo}
              variant="outline"
              className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-colors"
            >
              <Download className="w-5 h-5 mr-2" />
              Download {exportFormat.toUpperCase()}
            </Button>

            <Button
              onClick={() => resetRecording(false)}
              variant="outline"
              className="border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              New Recording
            </Button>
          </div>

          {/* Enhanced Timeline with Thumbnails */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(videoDuration)}</span>
            </div>

            {/* Thumbnail Timeline */}
            {thumbnails.length > 0 && (
              <div className="relative">
                {/* Thumbnails */}
                <div className="flex justify-between items-end mb-2 px-2">
                  {thumbnails.map((thumbnail, index) => (
                    <div
                      key={index}
                      className="relative cursor-pointer group"
                      onClick={() => seekTo(thumbnail.time)}
                    >
                      <img
                        src={thumbnail.url || "/placeholder.svg"}
                        alt={`Thumbnail at ${formatTime(thumbnail.time)}`}
                        className="w-12 h-7 object-cover rounded border-2 border-transparent group-hover:border-primary transition-all duration-200 shadow-sm"
                      />
                      <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        {formatTime(thumbnail.time)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Current time indicator */}
                <div
                  className="absolute top-0 w-0.5 h-7 bg-red-500 rounded-full pointer-events-none transition-all duration-100"
                  style={{
                    left: `${(currentTime / videoDuration) * 100}%`,
                    transform: "translateX(-50%)",
                  }}
                />
              </div>
            )}

            {/* Loading indicator for thumbnails */}
            {isGeneratingThumbnails && (
              <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Generating timeline previews...
              </div>
            )}

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
        </div>
      )}

      {/* Editing Controls */}
      {recordingState === "editing" && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Trim Video</h3>
            <p className="text-sm text-muted-foreground">
              Set the start and end points for your video
            </p>
          </div>

          {/* Enhanced Trim Timeline */}
          <div className="space-y-4">
            {/* Thumbnail Timeline for Editing */}
            {thumbnails.length > 0 && (
              <div className="relative bg-slate-50 rounded-lg p-4">
                <div className="text-sm font-medium mb-3 text-slate-700">
                  Timeline Preview
                </div>
                <div className="relative">
                  {/* Thumbnails */}
                  <div className="flex justify-between items-end mb-3">
                    {thumbnails.map((thumbnail, index) => (
                      <div
                        key={index}
                        className="relative cursor-pointer group"
                        onClick={() => seekTo(thumbnail.time)}
                      >
                        <img
                          src={thumbnail.url || "/placeholder.svg"}
                          alt={`Thumbnail at ${formatTime(thumbnail.time)}`}
                          className={`w-12 h-7 object-cover rounded border-2 transition-all duration-200 shadow-sm ${
                            thumbnail.time >= trimStart &&
                            thumbnail.time <= trimEnd
                              ? "border-green-400 opacity-100"
                              : "border-slate-300 opacity-50"
                          }`}
                        />
                        <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          {formatTime(thumbnail.time)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Trim range indicator */}
                  <div
                    className="absolute top-0 h-7 bg-green-200 bg-opacity-50 border-l-2 border-r-2 border-green-500 pointer-events-none"
                    style={{
                      left: `${(trimStart / videoDuration) * 100}%`,
                      width: `${((trimEnd - trimStart) / videoDuration) * 100}%`,
                    }}
                  />

                  {/* Current time indicator */}
                  <div
                    className="absolute top-0 w-0.5 h-7 bg-red-500 rounded-full pointer-events-none transition-all duration-100"
                    style={{
                      left: `${(currentTime / videoDuration) * 100}%`,
                      transform: "translateX(-50%)",
                    }}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                Start Time: {formatTime(trimStart)}
              </label>
              <Slider
                value={[trimStart]}
                max={videoDuration || 0}
                step={0.1}
                onValueChange={([value]) => {
                  if (isFinite(value) && videoDuration > 0) {
                    const clampedValue = Math.max(0, Math.min(value, trimEnd))
                    setTrimStart(clampedValue)
                    seekTo(clampedValue)
                  }
                }}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                End Time: {formatTime(trimEnd)}
              </label>
              <Slider
                value={[trimEnd]}
                max={videoDuration || 0}
                step={0.1}
                onValueChange={([value]) => {
                  if (isFinite(value) && videoDuration > 0) {
                    const clampedValue = Math.max(
                      trimStart,
                      Math.min(value, videoDuration)
                    )
                    setTrimEnd(clampedValue)
                    seekTo(clampedValue)
                  }
                }}
                className="w-full"
              />
            </div>

            <div className="bg-slate-50 rounded-lg p-4">
              <div className="text-sm text-muted-foreground">
                <strong>Trimmed Duration:</strong>{" "}
                {formatTime(trimEnd - trimStart)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Export format: {exportFormat.toUpperCase()}
                {exportFormat === "mp4" && mp4RecordingSupported && " (Native)"}
                {exportFormat === "mp4" &&
                  !mp4RecordingSupported &&
                  " (Converted)"}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 flex-wrap">
            <Button
              onClick={() => setRecordingState("stopped")}
              variant="outline"
            >
              Cancel
            </Button>

            <Button
              onClick={downloadOriginalVideo}
              variant="outline"
              className="bg-blue-50 hover:bg-blue-100"
            >
              <Download className="w-5 h-5 mr-2" />
              Download Original
            </Button>

            <Button
              onClick={downloadTrimmedVideo}
              className="bg-green-600 hover:bg-green-700"
              disabled={trimEnd - trimStart < 0.5}
            >
              <Download className="w-5 h-5 mr-2" />
              Download Trimmed {exportFormat.toUpperCase()}
            </Button>
          </div>

          {trimEnd - trimStart < 0.5 && (
            <div className="text-center text-sm text-amber-600 bg-amber-50 rounded-lg p-2">
              ⚠️ Trimmed video must be at least 0.5 seconds long
            </div>
          )}
        </div>
      )}
    </>
  )
}
