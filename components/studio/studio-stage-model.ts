import type React from "react"
import type {
  AspectRatio,
  CropArea,
  ExportFormat,
  PipPosition,
  RecordingMode,
  RecordingState,
  ScreenshotFormat,
  Thumbnail,
  VideoEffect,
} from "@/types/camera"

export type StudioStageModel = {
  adjustLightIntensity: (intensity: number) => void
  aspectRatio: AspectRatio
  cameraError: string | null
  cancelScreenshotTimer: () => void
  cropArea: CropArea
  currentTime: number
  downloadOriginalVideo: () => void
  downloadTrimmedVideo: () => void
  effectCropArea: CropArea
  effectIntensity: number
  exportFormat: ExportFormat
  getVideoDisplayArea: () => {
    displayedVideoWidth: number
    displayedVideoHeight: number
    videoOffsetX: number
    videoOffsetY: number
    containerWidth: number
    containerHeight: number
  }
  handleCropMouseDown: (e: React.MouseEvent, handle?: string) => void
  handleEffectCropMouseDown: (e: React.MouseEvent, handle?: string) => void
  handlePanStart: (e: React.MouseEvent) => void
  handlePipMouseDown: (e: React.MouseEvent, action: "drag" | "resize") => void
  isCapturingScreenshot: boolean
  isCropMode: boolean
  isEffectCropMode: boolean
  isFullscreen: boolean
  isGeneratingThumbnails: boolean
  isHDScreenshot: boolean
  isLightMode: boolean
  isMirrored: boolean
  isMounted: boolean
  isPanning: boolean
  isPlaying: boolean
  isTimerActive: boolean
  lightIntensity: number
  mp4RecordingSupported: boolean
  panOffset: { x: number; y: number }
  pipPosition: PipPosition
  previewEffectCanvasRef: React.RefObject<HTMLCanvasElement | null>
  processingProgress: number
  recordingMode: RecordingMode
  recordingState: RecordingState
  recordingTime: number
  resetRecording: (clearScreenshots?: boolean) => void
  resetZoom: () => void
  screenError: string | null
  screenStream: MediaStream | null
  screenVideoRef: React.RefObject<HTMLVideoElement | null>
  screenshotFormat: ScreenshotFormat
  screenshotTimer: number
  seekTo: (time: number) => void
  setAspectRatio: (ratio: AspectRatio) => void
  setEffectIntensity: (value: number) => void
  setIsHDScreenshot: (value: boolean | ((prev: boolean) => boolean)) => void
  setRecordingState: (state: RecordingState) => void
  setScreenshotFormat: (format: ScreenshotFormat) => void
  setScreenshotTimer: (timer: number) => void
  setTrimEnd: (value: number) => void
  setTrimStart: (value: number) => void
  setVideoEffect: (effect: VideoEffect) => void
  showFlash: boolean
  startRecording: () => void
  stopRecording: () => void
  switchToPip: () => void
  switchToScreen: () => void
  switchToWebcam: () => void
  takeScreenshot: (withTimer?: boolean) => void
  thumbnails: Thumbnail[]
  timerCountdown: number
  toggleCropMode: () => void
  toggleEffectCropMode: () => void
  toggleFullscreen: () => void
  toggleLightMode: () => void
  toggleMirror: () => void
  togglePlayback: () => void
  trimEnd: number
  trimStart: number
  videoContainerRef: React.RefObject<HTMLDivElement | null>
  videoDuration: number
  videoEffect: VideoEffect
  videoRef: React.RefObject<HTMLVideoElement | null>
  zoomIn: () => void
  zoomLevel: number
  zoomOut: () => void
}
