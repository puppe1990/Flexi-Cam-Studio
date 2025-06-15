export type RecordingState = "idle" | "recording" | "stopped" | "editing" | "processing"
export type ExportFormat = "webm" | "mp4" | "avi" | "mov" | "3gp"
export type ScreenshotFormat = "png" | "jpeg"
export type AspectRatio = "16:9" | "9:16" | "4:3" | "1:1"
export type VideoEffect = "none" | "blur" | "pixelate"

export interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export interface Screenshot {
  id: string
  url: string
  timestamp: Date
}

export interface Thumbnail {
  time: number
  url: string
}

export interface CameraState {
  recordingState: RecordingState
  recordedBlob: Blob | null
  recordingTime: number
  videoDuration: number
  trimStart: number
  trimEnd: number
  isPlaying: boolean
  currentTime: number
  processingProgress: number
  cameraError: string | null
  thumbnails: Thumbnail[]
  isGeneratingThumbnails: boolean
  exportFormat: ExportFormat
  webCodecsSupported: boolean
  mp4RecordingSupported: boolean
}

export interface ScreenshotState {
  screenshotFormat: ScreenshotFormat
  screenshots: Screenshot[]
  showFlash: boolean
  screenshotCount: number
  screenshotTimer: number
  isTimerActive: boolean
  timerCountdown: number
  isScreenshotModalOpen: boolean
  selectedScreenshotIndex: number
}

export interface CropState {
  isCropMode: boolean
  cropArea: CropArea
  isDragging: boolean
  isResizing: boolean
  dragStart: { x: number; y: number }
  resizeHandle: string
  videoContainerSize: { width: number; height: number }
}

export interface ZoomState {
  zoomLevel: number
  panOffset: { x: number; y: number }
  isPanning: boolean
  panStart: { x: number; y: number }
}

export interface EffectState {
  videoEffect: VideoEffect
  effectIntensity: number
  isEffectCropMode: boolean
  effectCropArea: CropArea
  isEffectDragging: boolean
  isEffectResizing: boolean
  effectDragStart: { x: number; y: number }
  effectResizeHandle: string
}

export interface VideoRefs {
  videoContainerRef: React.RefObject<HTMLDivElement>
  videoRef: React.RefObject<HTMLVideoElement>
  canvasRef: React.RefObject<HTMLCanvasElement>
  screenshotCanvasRef: React.RefObject<HTMLCanvasElement>
  cropCanvasRef: React.RefObject<HTMLCanvasElement>
  effectCanvasRef: React.RefObject<HTMLCanvasElement>
  previewEffectCanvasRef: React.RefObject<HTMLCanvasElement>
  mediaRecorderRef: React.RefObject<MediaRecorder | null>
  streamRef: React.RefObject<MediaStream | null>
  croppedStreamRef: React.RefObject<MediaStream | null>
  chunksRef: React.RefObject<Blob[]>
  recordingIntervalRef: React.RefObject<NodeJS.Timeout | null>
  previewEffectAnimationRef: React.RefObject<number | null>
} 