"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Camera,
  Square,
  Play,
  Pause,
  Download,
  Scissors,
  RotateCcw,
  Video,
  Clock,
  Settings,
  ImageIcon,
  Crop,
  Move,
  ZoomIn,
  ZoomOut,
  ZoomInIcon as ResetZoom,
  Film,
  Edit3,
} from "lucide-react"

import JSZip from "jszip"
import VideoEffectsEditor from "@/components/VideoEffectsEditor"

// Types (can be imported from types/camera.ts)
type RecordingState = "idle" | "recording" | "stopped" | "editing" | "processing"
type ExportFormat = "webm" | "mp4" | "avi" | "mov" | "3gp"
type ScreenshotFormat = "png" | "jpeg"
type AspectRatio = "16:9" | "9:16" | "4:3" | "1:1"

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

export default function CameraRecorder() {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle")
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [videoDuration, setVideoDuration] = useState(0)
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [thumbnails, setThumbnails] = useState<Array<{ time: number; url: string }>>([])
  const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportFormat>("webm")
  const [webCodecsSupported, setWebCodecsSupported] = useState(false)
  const [mp4RecordingSupported, setMp4RecordingSupported] = useState(false)
  const [screenshotFormat, setScreenshotFormat] = useState<ScreenshotFormat>("png")
  const [screenshots, setScreenshots] = useState<Array<{ id: string; url: string; timestamp: Date }>>([])
  const [showFlash, setShowFlash] = useState(false)
  const [screenshotCount, setScreenshotCount] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Add mounted state to prevent hydration errors
  const [isMounted, setIsMounted] = useState(false)

  // Timer functionality for screenshots
  const [screenshotTimer, setScreenshotTimer] = useState<number>(0) // 0 = no timer
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [timerCountdown, setTimerCountdown] = useState<number>(0)
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false)

  // Crop functionality
  const [isCropMode, setIsCropMode] = useState(false)
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeHandle, setResizeHandle] = useState<string>("")
  const [, setVideoContainerSize] = useState({ width: 0, height: 0 })

  // Aspect ratio functionality
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "4:3" | "1:1">("16:9")

  // Zoom functionality
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  // Mirror functionality
  const [isMirrored, setIsMirrored] = useState(false)

  // Effect functionality
  type VideoEffect = "none" | "blur" | "pixelate"
  const [videoEffect, setVideoEffect] = useState<VideoEffect>("none")
  const [effectIntensity, setEffectIntensity] = useState(5) // 1-10 scale

  // Effect crop functionality
  const [isEffectCropMode, setIsEffectCropMode] = useState(false)
  const [effectCropArea, setEffectCropArea] = useState<CropArea>({ x: 0.2, y: 0.2, width: 0.6, height: 0.6 })
  const [isEffectDragging, setIsEffectDragging] = useState(false)
  const [isEffectResizing, setIsEffectResizing] = useState(false)
  const [effectDragStart, setEffectDragStart] = useState({ x: 0, y: 0 })
  const [effectResizeHandle, setEffectResizeHandle] = useState<string>("")

  // Modal functionality for screenshot viewing
  const [isScreenshotModalOpen, setIsScreenshotModalOpen] = useState(false)
  const [selectedScreenshotIndex, setSelectedScreenshotIndex] = useState(0)

  // Tab management
  const [activeTab, setActiveTab] = useState("camera")



  const videoContainerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const screenshotCanvasRef = useRef<HTMLCanvasElement>(null)
  const cropCanvasRef = useRef<HTMLCanvasElement>(null)
  const effectCanvasRef = useRef<HTMLCanvasElement>(null)
  const previewEffectCanvasRef = useRef<HTMLCanvasElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const croppedStreamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const previewEffectAnimationRef = useRef<number | null>(null)
  const isCapturingRef = useRef<boolean>(false)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)



  // Helper function to calculate actual video display area within container
  const getVideoDisplayArea = useCallback(() => {
    if (!videoRef.current || !videoContainerRef.current) {
      return {
        displayedVideoWidth: 0,
        displayedVideoHeight: 0,
        videoOffsetX: 0,
        videoOffsetY: 0,
        containerWidth: 0,
        containerHeight: 0
      }
    }

    const video = videoRef.current
    const container = videoContainerRef.current
    
    const videoWidth = video.videoWidth || 1280
    const videoHeight = video.videoHeight || 720
    const videoAspectRatio = videoWidth / videoHeight
    
    // In fullscreen mode, we need to get the actual video element bounds instead of container
    let containerRect: DOMRect
    if (isFullscreen) {
      // In fullscreen, use the video element's actual bounds
      containerRect = video.getBoundingClientRect()
    } else {
      // In normal mode, use the container bounds
      containerRect = container.getBoundingClientRect()
    }
    
    const containerAspectRatio = containerRect.width / containerRect.height
    
    let displayedVideoWidth: number
    let displayedVideoHeight: number
    let videoOffsetX = 0
    let videoOffsetY = 0
    
    // Use a small tolerance for aspect ratio comparison to handle floating point precision
    const aspectRatioTolerance = 0.01
    const aspectRatioDiff = Math.abs(videoAspectRatio - containerAspectRatio)
    
    if (aspectRatioDiff < aspectRatioTolerance) {
      // Aspect ratios are essentially the same - video fills container
      displayedVideoWidth = containerRect.width
      displayedVideoHeight = containerRect.height
      videoOffsetX = 0
      videoOffsetY = 0
    } else if (videoAspectRatio > containerAspectRatio) {
      // Video is wider than container - constrain by width (letterboxed)
      displayedVideoWidth = containerRect.width
      displayedVideoHeight = containerRect.width / videoAspectRatio
      videoOffsetX = 0
      videoOffsetY = (containerRect.height - displayedVideoHeight) / 2
    } else {
      // Video is taller than container - constrain by height (pillarboxed)
      displayedVideoWidth = containerRect.height * videoAspectRatio
      displayedVideoHeight = containerRect.height
      videoOffsetX = (containerRect.width - displayedVideoWidth) / 2
      videoOffsetY = 0
    }
    
    // Debug logging with fullscreen info (only when crop modes are active)
    if (isCropMode || isEffectCropMode) {
      console.log(`📐 Video Display Area (${aspectRatio}, ${isFullscreen ? 'FULLSCREEN' : 'NORMAL'}):`, {
        video: { width: videoWidth, height: videoHeight, aspectRatio: videoAspectRatio },
        container: { width: containerRect.width, height: containerRect.height, aspectRatio: containerAspectRatio },
        displayed: { width: displayedVideoWidth, height: displayedVideoHeight },
        offset: { x: videoOffsetX, y: videoOffsetY },
        aspectRatioDiff,
        tolerance: 0.01,
        mode: isFullscreen ? 'fullscreen' : 'normal',
        cropMode: isCropMode,
        effectCropMode: isEffectCropMode
      })
    }
    
    return {
      displayedVideoWidth,
      displayedVideoHeight,
      videoOffsetX,
      videoOffsetY,
      containerWidth: containerRect.width,
      containerHeight: containerRect.height
    }
  }, [aspectRatio, isFullscreen, isCropMode, isEffectCropMode])

  // Utility function to download blob with better file handling
  const downloadBlob = useCallback(
    (blob: Blob, filename: string) => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      let finalFilename = filename
      let extension = exportFormat // Use the selected export format directly

      // Override extension based on actual blob type if it's different
      if (blob.type.includes("mp4")) {
        extension = "mp4"
      } else if (blob.type.includes("webm")) {
        extension = "webm"
      } else if (blob.type.includes("avi") || blob.type.includes("msvideo")) {
        extension = "avi"
      } else if (blob.type.includes("quicktime")) {
        extension = "mov"
      } else if (blob.type.includes("3gpp")) {
        extension = "3gp"
      }

      finalFilename = `video-${timestamp}.${extension}`

      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = finalFilename
      a.style.display = "none"

      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 1000)
    },
    [exportFormat],
  )

  // Zoom controls
  const zoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3))
  }, [])

  const zoomOut = useCallback(() => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5))
  }, [])

  const resetZoom = useCallback(() => {
    setZoomLevel(1)
    setPanOffset({ x: 0, y: 0 })
  }, [])

  // Mirror controls
  const toggleMirror = useCallback(() => {
    setIsMirrored((prev) => !prev)
  }, [])

  // Pan controls
  const handlePanStart = useCallback(
    (e: React.MouseEvent) => {
      if (zoomLevel > 1 && !isCropMode && !isEffectCropMode) {
        setIsPanning(true)
        setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
      }
    },
    [zoomLevel, panOffset, isCropMode, isEffectCropMode],
  )

  const handlePanMove = useCallback(
    (e: MouseEvent) => {
      if (isPanning && zoomLevel > 1) {
        const newX = e.clientX - panStart.x
        const newY = e.clientY - panStart.y

        // Calculate bounds to prevent panning too far
        const maxPan = 100 * (zoomLevel - 1)
        const clampedX = Math.max(-maxPan, Math.min(maxPan, newX))
        const clampedY = Math.max(-maxPan, Math.min(maxPan, newY))

        setPanOffset({ x: clampedX, y: clampedY })
      }
    },
    [isPanning, zoomLevel, panStart],
  )

  const handlePanEnd = useCallback(() => {
    setIsPanning(false)
  }, [])

  // Add pan event listeners
  useEffect(() => {
    if (isPanning) {
      document.addEventListener("mousemove", handlePanMove)
      document.addEventListener("mouseup", handlePanEnd)
      return () => {
        document.removeEventListener("mousemove", handlePanMove)
        document.removeEventListener("mouseup", handlePanEnd)
      }
    }
  }, [isPanning, handlePanMove, handlePanEnd])

  // Simplified video trimming using Web APIs (WebM)
  const trimVideoWithWebAPIs = useCallback(async () => {
    if (!recordedBlob || !canvasRef.current) {
      throw new Error("Video or canvas not available")
    }

    const video = document.createElement("video")
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx) throw new Error("Canvas context not available")

    // Set up video
    video.src = URL.createObjectURL(recordedBlob)
    video.muted = true
    video.crossOrigin = "anonymous"

    await new Promise((resolve, reject) => {
      video.onloadedmetadata = resolve
      video.onerror = reject
    })

    // Set canvas dimensions
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    // Create MediaRecorder for the canvas stream
    const stream = canvas.captureStream(30)
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9") ? "video/webm;codecs=vp9" : "video/webm",
    })

    const chunks: Blob[] = []

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data)
      }
    }

    return new Promise<Blob>((resolve, reject) => {
      mediaRecorder.onstop = () => {
        const trimmedBlob = new Blob(chunks, { type: "video/webm" })
        resolve(trimmedBlob)
      }

      mediaRecorder.onerror = reject

      // Start recording
      mediaRecorder.start()

      // Process video frames
      const duration = trimEnd - trimStart
      const fps = 30
      const totalFrames = Math.floor(duration * fps)
      let currentFrame = 0

      video.currentTime = trimStart

      const processNextFrame = () => {
        if (currentFrame >= totalFrames) {
          mediaRecorder.stop()
          return
        }

        // Draw current frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Update progress
        const progress = (currentFrame / totalFrames) * 100
        setProcessingProgress(progress)

        currentFrame++
        const nextTime = trimStart + currentFrame / fps

        if (nextTime <= trimEnd) {
          video.currentTime = nextTime
          // Use requestAnimationFrame for smoother processing
          requestAnimationFrame(processNextFrame)
        } else {
          mediaRecorder.stop()
        }
      }

      video.onseeked = () => {
        processNextFrame()
      }
    })
  }, [recordedBlob, trimStart, trimEnd])

  // Improved video conversion with support for multiple WhatsApp formats
  const convertVideo = useCallback(async () => {
    if (!recordedBlob || !canvasRef.current) {
      throw new Error("Video or canvas not available")
    }

    const video = document.createElement("video")
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    if (!ctx) throw new Error("Canvas context not available")

    // Set up video
    video.src = URL.createObjectURL(recordedBlob)
    video.muted = true
    video.crossOrigin = "anonymous"

    await new Promise((resolve, reject) => {
      video.onloadedmetadata = resolve
      video.onerror = reject
    })

    // WhatsApp-optimized dimensions based on format
    let targetWidth = 720
    let targetHeight = 480
    let fps = 25
    let videoBitrate = 1000000 // 1 Mbps
    let audioBitrate = 128000 // 128 kbps

    // Format-specific optimizations
    switch (exportFormat) {
      case "3gp":
        targetWidth = 320
        targetHeight = 240
        fps = 15
        videoBitrate = 500000 // 500 kbps for smaller file
        audioBitrate = 64000 // 64 kbps
        break
      case "avi":
        targetWidth = 640
        targetHeight = 480
        fps = 30
        videoBitrate = 1500000 // 1.5 Mbps
        break
      case "mov":
        targetWidth = 720
        targetHeight = 480
        fps = 30
        videoBitrate = 2000000 // 2 Mbps for better quality
        break
      case "mp4":
      default:
        // Keep default values
        break
    }

    canvas.width = targetWidth
    canvas.height = targetHeight

    // Create audio context for better audio handling
    let audioStream: MediaStream | null = null
    try {
      const audioContext = new AudioContext()
      const source = audioContext.createMediaElementSource(video)
      const dest = audioContext.createMediaStreamDestination()
      source.connect(dest)
      audioStream = dest.stream
    } catch (error) {
      console.warn("Could not process audio:", error)
    }

    // Create canvas stream
    const canvasStream = canvas.captureStream(fps)

    // Add audio track if available
    if (audioStream && audioStream.getAudioTracks().length > 0) {
      const audioTrack = audioStream.getAudioTracks()[0]
      canvasStream.addTrack(audioTrack)
    }

    // Format-specific MediaRecorder options
    const options: MediaRecorderOptions = {
      videoBitsPerSecond: videoBitrate,
      audioBitsPerSecond: audioBitrate,
    }

    // Try different codecs based on format and browser support
    let mimeType = "video/webm" // fallback

    switch (exportFormat) {
      case "mp4":
        if (MediaRecorder.isTypeSupported("video/mp4;codecs=avc1.42001E")) {
          mimeType = "video/mp4;codecs=avc1.42001E" // H.264 Constrained Baseline
        } else if (MediaRecorder.isTypeSupported("video/mp4;codecs=avc1.42E01E")) {
          mimeType = "video/mp4;codecs=avc1.42E01E" // H.264 Baseline
        } else if (MediaRecorder.isTypeSupported("video/mp4;codecs=avc1")) {
          mimeType = "video/mp4;codecs=avc1"
        } else if (MediaRecorder.isTypeSupported("video/mp4")) {
          mimeType = "video/mp4"
        }
        break
      case "avi":
        // AVI typically uses older codecs, try MJPEG or fallback
        if (MediaRecorder.isTypeSupported("video/x-msvideo")) {
          mimeType = "video/x-msvideo"
        } else if (MediaRecorder.isTypeSupported("video/avi")) {
          mimeType = "video/avi"
        } else {
          // Fallback to MP4 and rename file
          mimeType = "video/mp4"
        }
        break
      case "mov":
        // MOV format (QuickTime)
        if (MediaRecorder.isTypeSupported("video/quicktime")) {
          mimeType = "video/quicktime"
        } else if (MediaRecorder.isTypeSupported("video/mp4")) {
          mimeType = "video/mp4" // MP4 is compatible with MOV
        }
        break
      case "3gp":
        // 3GP format for mobile
        if (MediaRecorder.isTypeSupported("video/3gpp")) {
          mimeType = "video/3gpp"
        } else if (MediaRecorder.isTypeSupported("video/mp4")) {
          mimeType = "video/mp4" // MP4 as fallback
        }
        break
    }

    options.mimeType = mimeType

    const mediaRecorder = new MediaRecorder(canvasStream, options)
    const chunks: Blob[] = []

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data)
      }
    }

    return new Promise<Blob>((resolve, reject) => {
      mediaRecorder.onstop = () => {
        // Create blob with proper MIME type for the target format
        let finalMimeType = mimeType
        switch (exportFormat) {
          case "mp4":
            finalMimeType = "video/mp4"
            break
          case "avi":
            finalMimeType = "video/x-msvideo"
            break
          case "mov":
            finalMimeType = "video/quicktime"
            break
          case "3gp":
            finalMimeType = "video/3gpp"
            break
          default:
            finalMimeType = "video/webm"
        }

        const convertedBlob = new Blob(chunks, { type: finalMimeType })

        // Clean up audio context
        if (audioStream) {
          audioStream.getTracks().forEach((track) => track.stop())
        }

        resolve(convertedBlob)
      }

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event)
        reject(new Error("Recording failed"))
      }

      // Start recording
      mediaRecorder.start(250)

      // Process video with format-specific frame rate
      const duration = trimEnd - trimStart
      const frameInterval = 1000 / fps
      const totalFrames = Math.floor(duration * fps)
      let currentFrame = 0
      let startTime = performance.now()

      video.currentTime = trimStart

      const processFrame = () => {
        if (currentFrame >= totalFrames) {
          mediaRecorder.stop()
          return
        }

        // Draw frame with proper scaling
        const videoAspect = video.videoWidth / video.videoHeight
        const canvasAspect = targetWidth / targetHeight

        let drawWidth = targetWidth
        let drawHeight = targetHeight
        let offsetX = 0
        let offsetY = 0

        if (videoAspect > canvasAspect) {
          drawHeight = targetHeight
          drawWidth = targetHeight * videoAspect
          offsetX = (targetWidth - drawWidth) / 2
        } else {
          drawWidth = targetWidth
          drawHeight = targetWidth / videoAspect
          offsetY = (targetHeight - drawHeight) / 2
        }

        // Clear canvas with black background
        ctx.fillStyle = "#000000"
        ctx.fillRect(0, 0, targetWidth, targetHeight)
        ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight)

        // Update progress
        const progress = (currentFrame / totalFrames) * 100
        setProcessingProgress(progress)

        currentFrame++
        const nextTime = trimStart + currentFrame / fps

        if (nextTime <= trimEnd) {
          video.currentTime = nextTime

          // Maintain consistent timing
          const expectedTime = startTime + currentFrame * frameInterval
          const actualTime = performance.now()
          const delay = Math.max(0, expectedTime - actualTime)

          setTimeout(() => {
            requestAnimationFrame(processFrame)
          }, delay)
        } else {
          mediaRecorder.stop()
        }
      }

      video.onseeked = () => {
        if (currentFrame === 0) {
          startTime = performance.now()
          processFrame()
        }
      }

      // Timeout fallback
      setTimeout(
        () => {
          if (mediaRecorder.state === "recording") {
            console.warn("Recording timeout, stopping...")
            mediaRecorder.stop()
          }
        },
        (duration + 10) * 1000,
      )
    })
  }, [recordedBlob, trimStart, trimEnd, exportFormat])

  // Download original video as fallback
  const downloadOriginalVideo = useCallback(() => {
    if (!recordedBlob) return

    // Use the selected export format for the filename, even if the actual format is different
    downloadBlob(recordedBlob, `original-video-${Date.now()}.${exportFormat}`)
    setRecordingState("stopped")
  }, [recordedBlob, exportFormat, downloadBlob])

  // Process and download video with format selection
  const downloadTrimmedVideo = useCallback(async () => {
    if (!recordedBlob || !videoRef.current) return

    // If no trimming is needed, download original video
    if (Math.abs(trimStart - 0) < 0.1 && Math.abs(trimEnd - videoDuration) < 0.1) {
      downloadBlob(recordedBlob, `recorded-video-${Date.now()}.${exportFormat}`)
      return
    }

    setRecordingState("processing")
    setProcessingProgress(0)

    try {
      let processedBlob: Blob

      if (exportFormat !== "webm") {
        // Convert to selected format
        processedBlob = await convertVideo()
      } else {
        // Use WebM export
        processedBlob = await trimVideoWithWebAPIs()
      }

      downloadBlob(processedBlob, `trimmed-video-${Date.now()}.${exportFormat}`)
    } catch (error) {
      console.error("Export failed, downloading original:", error)
      // Fallback: download original video
      downloadOriginalVideo()
    } finally {
      setRecordingState("stopped")
      setProcessingProgress(0)
    }
  }, [
    recordedBlob,
    trimStart,
    trimEnd,
    videoDuration,
    exportFormat,
    convertVideo,
    trimVideoWithWebAPIs,
    downloadOriginalVideo,
    downloadBlob,
  ])

  // Check WebCodecs and MP4 support
  useEffect(() => {
    const checkSupport = () => {
      // Check WebCodecs support
      const webCodecsSupported = "VideoEncoder" in window && "VideoDecoder" in window && "AudioEncoder" in window
      setWebCodecsSupported(webCodecsSupported)

      // Check MP4 recording support
      const mp4Supported =
        MediaRecorder.isTypeSupported("video/mp4") || MediaRecorder.isTypeSupported("video/mp4;codecs=avc1")
      setMp4RecordingSupported(mp4Supported)

      // Set default format based on support
      if (mp4Supported || webCodecsSupported) {
        setExportFormat("mp4")
      }
    }
    checkSupport()
  }, [])

  // Update video container size for crop calculations
  useEffect(() => {
    const updateContainerSize = () => {
      if (videoContainerRef.current) {
        const rect = videoContainerRef.current.getBoundingClientRect()
        setVideoContainerSize({ width: rect.width, height: rect.height })
      }
    }

    updateContainerSize()
    window.addEventListener("resize", updateContainerSize)
    return () => window.removeEventListener("resize", updateContainerSize)
  }, [])

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    try {
      setCameraError(null)

      // Calculate video constraints based on aspect ratio
      let videoConstraints: MediaTrackConstraints

      switch (aspectRatio) {
        case "9:16":
          videoConstraints = { 
            width: { ideal: 720, min: 480, max: 1080 }, 
            height: { ideal: 1280, min: 854, max: 1920 },
            aspectRatio: 9/16
          } // Vertical
          break
        case "4:3":
          videoConstraints = { 
            width: { ideal: 960, min: 640, max: 1440 }, 
            height: { ideal: 720, min: 480, max: 1080 },
            aspectRatio: 4/3
          } // Classic
          break
        case "1:1":
          videoConstraints = { 
            width: { ideal: 720, min: 480, max: 1080 }, 
            height: { ideal: 720, min: 480, max: 1080 },
            aspectRatio: 1
          } // Square
          break
        case "16:9":
        default:
          videoConstraints = { 
            width: { ideal: 1280, min: 854, max: 1920 }, 
            height: { ideal: 720, min: 480, max: 1080 },
            aspectRatio: 16/9
          } // Landscape
          break
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: true,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        
        // Debug: Log actual video dimensions once video loads
        videoRef.current.onloadedmetadata = () => {
          console.log(`📹 Camera for ${aspectRatio}:`, {
            requested: videoConstraints,
            actual: {
              width: videoRef.current?.videoWidth,
              height: videoRef.current?.videoHeight,
              aspectRatio: (videoRef.current?.videoWidth || 0) / (videoRef.current?.videoHeight || 1)
            },
            containerExpected: aspectRatio === "9:16" ? 9/16 : aspectRatio === "4:3" ? 4/3 : aspectRatio === "1:1" ? 1 : 16/9
          })
        }
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      setCameraError("Unable to access camera. Please check permissions.")
    }
  }, [aspectRatio])

  // Create cropped stream from canvas
  const createCroppedStream = useCallback(() => {
    if (!cropCanvasRef.current || !videoRef.current || !streamRef.current || !videoContainerRef.current) return null

    const canvas = cropCanvasRef.current
    const video = videoRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    // Get the actual video dimensions
    const videoWidth = video.videoWidth || 1280
    const videoHeight = video.videoHeight || 720
    const videoAspectRatio = videoWidth / videoHeight

    // Get the container dimensions - handle fullscreen vs normal mode
    let containerRect: DOMRect
    let containerAspectRatio: number

    if (isFullscreen) {
      // In fullscreen, calculate based on the actual displayed video size
      const videoElement = video.getBoundingClientRect()
      containerRect = videoElement
      containerAspectRatio = videoElement.width / videoElement.height
    } else {
      // In normal mode, use the container
      containerRect = videoContainerRef.current.getBoundingClientRect()
      containerAspectRatio = containerRect.width / containerRect.height
    }

    // Calculate how the video is actually displayed within the container (using same logic as getVideoDisplayArea)
    let displayedVideoWidth: number
    let displayedVideoHeight: number
    let videoOffsetX = 0
    let videoOffsetY = 0

    // Use a small tolerance for aspect ratio comparison to handle floating point precision
    const aspectRatioTolerance = 0.01
    const aspectRatioDiff = Math.abs(videoAspectRatio - containerAspectRatio)
    
    if (aspectRatioDiff < aspectRatioTolerance) {
      // Aspect ratios are essentially the same - video fills container
      displayedVideoWidth = containerRect.width
      displayedVideoHeight = containerRect.height
      videoOffsetX = 0
      videoOffsetY = 0
    } else if (videoAspectRatio > containerAspectRatio) {
      // Video is wider than container - constrain by width (letterboxed)
      displayedVideoWidth = containerRect.width
      displayedVideoHeight = containerRect.width / videoAspectRatio
      videoOffsetX = 0
      videoOffsetY = (containerRect.height - displayedVideoHeight) / 2
    } else {
      // Video is taller than container - constrain by height (pillarboxed)
      displayedVideoWidth = containerRect.height * videoAspectRatio
      displayedVideoHeight = containerRect.height
      videoOffsetX = (containerRect.width - displayedVideoWidth) / 2
      videoOffsetY = 0
    }

    // Convert crop area from container percentage to actual pixel coordinates on the displayed video
    const cropStartX = cropArea.x * containerRect.width
    const cropStartY = cropArea.y * containerRect.height
    const cropWidth = cropArea.width * containerRect.width
    const cropHeight = cropArea.height * containerRect.height

    // Adjust for video offset within container and convert to video coordinates
    const videoCropStartX = (cropStartX - videoOffsetX) * (videoWidth / displayedVideoWidth)
    const videoCropStartY = (cropStartY - videoOffsetY) * (videoHeight / displayedVideoHeight)
    const videoCropWidth = cropWidth * (videoWidth / displayedVideoWidth)
    const videoCropHeight = cropHeight * (videoHeight / displayedVideoHeight)

    // Clamp to video bounds
    const clampedX = Math.max(0, Math.min(videoCropStartX, videoWidth))
    const clampedY = Math.max(0, Math.min(videoCropStartY, videoHeight))
    const clampedWidth = Math.max(1, Math.min(videoCropWidth, videoWidth - clampedX))
    const clampedHeight = Math.max(1, Math.min(videoCropHeight, videoHeight - clampedY))

    // Set canvas size to crop dimensions
    canvas.width = clampedWidth
    canvas.height = clampedHeight

    // Draw cropped video frame
    const drawFrame = () => {
      if (isMirrored) {
        // Apply horizontal flip for mirrored recording
        ctx.save()
        ctx.scale(-1, 1)
        ctx.drawImage(
          video,
          clampedX,
          clampedY,
          clampedWidth,
          clampedHeight, // Source rectangle from video
          -clampedWidth,
          0,
          clampedWidth,
          clampedHeight, // Destination rectangle on canvas (flipped)
        )
        ctx.restore()
      } else {
        ctx.drawImage(
          video,
          clampedX,
          clampedY,
          clampedWidth,
          clampedHeight, // Source rectangle from video
          0,
          0,
          clampedWidth,
          clampedHeight, // Destination rectangle on canvas
        )
      }
      requestAnimationFrame(drawFrame)
    }
    drawFrame()

    // Get audio track from original stream
    const audioTracks = streamRef.current.getAudioTracks()
    const canvasStream = canvas.captureStream(30)

    // Add audio track to canvas stream
    if (audioTracks.length > 0) {
      canvasStream.addTrack(audioTracks[0])
    }

    return canvasStream
  }, [cropArea, isFullscreen, isMirrored])

  // Manual blur function as fallback
  const applyManualBlur = useCallback((imageData: ImageData, radius: number): ImageData => {
    const { data, width, height } = imageData
    const output = new ImageData(width, height)
    const outputData = output.data

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0, g = 0, b = 0, a = 0
        let count = 0

        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = Math.max(0, Math.min(width - 1, x + dx))
            const ny = Math.max(0, Math.min(height - 1, y + dy))
            const i = (ny * width + nx) * 4

            r += data[i]
            g += data[i + 1]
            b += data[i + 2]
            a += data[i + 3]
            count++
          }
        }

        const i = (y * width + x) * 4
        outputData[i] = r / count
        outputData[i + 1] = g / count
        outputData[i + 2] = b / count
        outputData[i + 3] = a / count
      }
    }

    return output
  }, [])

  // Shared function to calculate effect area coordinates in video space
  const calculateEffectAreaInVideoSpace = useCallback((canvasWidth: number, canvasHeight: number) => {
    if (!videoRef.current || !videoContainerRef.current) {
      return { x: 0, y: 0, width: canvasWidth, height: canvasHeight }
    }

    const video = videoRef.current
    const videoWidth = video.videoWidth || 1280
    const videoHeight = video.videoHeight || 720

    // Use the same logic as getVideoDisplayArea to ensure consistency
    const videoArea = getVideoDisplayArea()
    
    // Convert effect crop area from container percentage to video coordinates
    const effectStartX = effectCropArea.x * videoArea.containerWidth
    const effectStartY = effectCropArea.y * videoArea.containerHeight
    const effectWidth = effectCropArea.width * videoArea.containerWidth
    const effectHeight = effectCropArea.height * videoArea.containerHeight

    // Convert to video coordinate space
    const videoEffectStartX = (effectStartX - videoArea.videoOffsetX) * (videoWidth / videoArea.displayedVideoWidth)
    const videoEffectStartY = (effectStartY - videoArea.videoOffsetY) * (videoHeight / videoArea.displayedVideoHeight)
    const videoEffectWidth = effectWidth * (videoWidth / videoArea.displayedVideoWidth)
    const videoEffectHeight = effectHeight * (videoHeight / videoArea.displayedVideoHeight)

    // For screenshots, we need to scale to canvas dimensions if different from video dimensions
    const scaleX = canvasWidth / videoWidth
    const scaleY = canvasHeight / videoHeight

    const clampedX = Math.max(0, Math.min(videoEffectStartX * scaleX, canvasWidth))
    const clampedY = Math.max(0, Math.min(videoEffectStartY * scaleY, canvasHeight))
    const clampedWidth = Math.max(1, Math.min(videoEffectWidth * scaleX, canvasWidth - clampedX))
    const clampedHeight = Math.max(1, Math.min(videoEffectHeight * scaleY, canvasHeight - clampedY))

    return {
      x: clampedX,
      y: clampedY,
      width: clampedWidth,
      height: clampedHeight
    }
  }, [effectCropArea, getVideoDisplayArea])

  // Create real-time effect preview overlay
  const updateEffectPreview = useCallback(() => {
    if (!previewEffectCanvasRef.current || !videoRef.current || !videoContainerRef.current) return
    
    const canvas = previewEffectCanvasRef.current
    const video = videoRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Only show effect preview when effect crop mode is active (works during recording too)
    if (!isEffectCropMode || videoEffect === ("none" as VideoEffect)) {
      canvas.style.display = "none"
      return
    }

    canvas.style.display = "block"
    
    // Get container dimensions
    const containerRect = videoContainerRef.current.getBoundingClientRect()
    
    // Set canvas size to match container
    canvas.width = containerRect.width
    canvas.height = containerRect.height
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Use consistent coordinate calculation for video display area
    const videoArea = getVideoDisplayArea()
    
    // Convert effect crop area to canvas coordinates (preview canvas matches container size)
    const effectStartX = effectCropArea.x * containerRect.width
    const effectStartY = effectCropArea.y * containerRect.height
    const effectWidth = effectCropArea.width * containerRect.width
    const effectHeight = effectCropArea.height * containerRect.height

    // Create a temporary canvas for the effect area
    const tempCanvas = document.createElement("canvas")
    const tempCtx = tempCanvas.getContext("2d")
    if (!tempCtx) return

    tempCanvas.width = effectWidth
    tempCanvas.height = effectHeight

    // Calculate the source rectangle on the video using consistent logic
    const videoWidth = video.videoWidth || 1280
    const videoHeight = video.videoHeight || 720
    
    const videoEffectStartX = (effectStartX - videoArea.videoOffsetX) * (videoWidth / videoArea.displayedVideoWidth)
    const videoEffectStartY = (effectStartY - videoArea.videoOffsetY) * (videoHeight / videoArea.displayedVideoHeight)
    const videoEffectWidth = effectWidth * (videoWidth / videoArea.displayedVideoWidth)
    const videoEffectHeight = effectHeight * (videoHeight / videoArea.displayedVideoHeight)

    // Clamp to video bounds
    const clampedX = Math.max(0, Math.min(videoEffectStartX, videoWidth))
    const clampedY = Math.max(0, Math.min(videoEffectStartY, videoHeight))
    const clampedWidth = Math.max(1, Math.min(videoEffectWidth, videoWidth - clampedX))
    const clampedHeight = Math.max(1, Math.min(videoEffectHeight, videoHeight - clampedY))

    // Draw the video section to the temporary canvas
    if (isMirrored) {
      tempCtx.save()
      tempCtx.scale(-1, 1)
      tempCtx.drawImage(
        video,
        clampedX, clampedY, clampedWidth, clampedHeight,
        -effectWidth, 0, effectWidth, effectHeight
      )
      tempCtx.restore()
    } else {
      tempCtx.drawImage(
        video,
        clampedX, clampedY, clampedWidth, clampedHeight,
        0, 0, effectWidth, effectHeight
      )
    }

    // Apply the effect
    if (videoEffect === "blur") {
      const blurAmount = effectIntensity * 2
      
      try {
        // Method 1: Try CSS filter blur (most efficient)
        const blurCanvas = document.createElement("canvas")
        const blurCtx = blurCanvas.getContext("2d")
        if (!blurCtx) return

        blurCanvas.width = effectWidth
        blurCanvas.height = effectHeight

        // Apply blur using CSS filter
        blurCtx.filter = `blur(${blurAmount}px)`
        blurCtx.drawImage(tempCanvas, 0, 0)
        
        // Clear the temp canvas and draw the blurred version
        tempCtx.clearRect(0, 0, effectWidth, effectHeight)
        tempCtx.drawImage(blurCanvas, 0, 0)
      } catch {
        // Fallback: Manual blur using multiple passes (less efficient but more compatible)
        const imageData = tempCtx.getImageData(0, 0, effectWidth, effectHeight)
        const blurredData = applyManualBlur(imageData, Math.ceil(blurAmount / 2))
        tempCtx.putImageData(blurredData, 0, 0)
      }
    } else if (videoEffect === "pixelate") {
      const pixelSize = Math.max(2, effectIntensity * 4)
      const scaledWidth = Math.max(1, Math.floor(effectWidth / pixelSize))
      const scaledHeight = Math.max(1, Math.floor(effectHeight / pixelSize))

      // Create smaller canvas for pixelation
      const pixelCanvas = document.createElement("canvas")
      const pixelCtx = pixelCanvas.getContext("2d")
      if (!pixelCtx) return

      pixelCanvas.width = scaledWidth
      pixelCanvas.height = scaledHeight

      // Disable image smoothing for crisp pixels
      pixelCtx.imageSmoothingEnabled = false
      tempCtx.imageSmoothingEnabled = false

      // Draw the image at reduced size
      pixelCtx.drawImage(tempCanvas, 0, 0, effectWidth, effectHeight, 0, 0, scaledWidth, scaledHeight)
      
      // Clear the temp canvas and draw the pixelated version back at full size
      tempCtx.clearRect(0, 0, effectWidth, effectHeight)
      tempCtx.drawImage(pixelCanvas, 0, 0, scaledWidth, scaledHeight, 0, 0, effectWidth, effectHeight)
    }

    // Draw the processed area to the main canvas
    ctx.drawImage(tempCanvas, 0, 0, effectWidth, effectHeight, effectStartX, effectStartY, effectWidth, effectHeight)

    // Continue animation (works during recording too)
    if (isEffectCropMode && videoEffect !== ("none" as VideoEffect)) {
      previewEffectAnimationRef.current = requestAnimationFrame(updateEffectPreview)
    }
  }, [isEffectCropMode, videoEffect, effectIntensity, effectCropArea, isMirrored, recordingState, applyManualBlur])

  // Start/stop effect preview animation
  useEffect(() => {
    if (isEffectCropMode && videoEffect !== ("none" as VideoEffect)) {
      // Cancel any existing animation before starting a new one
      if (previewEffectAnimationRef.current) {
        cancelAnimationFrame(previewEffectAnimationRef.current)
        previewEffectAnimationRef.current = null
      }
      updateEffectPreview()
    } else if (previewEffectAnimationRef.current) {
      cancelAnimationFrame(previewEffectAnimationRef.current)
      previewEffectAnimationRef.current = null
      if (previewEffectCanvasRef.current) {
        previewEffectCanvasRef.current.style.display = "none"
      }
    }

    return () => {
      if (previewEffectAnimationRef.current) {
        cancelAnimationFrame(previewEffectAnimationRef.current)
        previewEffectAnimationRef.current = null
      }
    }
  }, [isEffectCropMode, videoEffect, effectIntensity, recordingState, updateEffectPreview])



  // Create effect stream with blur or pixelation (with optional crop area)
  const createEffectStream = useCallback(() => {
    if (!effectCanvasRef.current || !videoRef.current || !streamRef.current) return null

    const canvas = effectCanvasRef.current
    const video = videoRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    // Set canvas size to match video
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720

    const drawFrame = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw the original video first
      if (isMirrored) {
        ctx.save()
        ctx.scale(-1, 1)
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height)
        ctx.restore()
      } else {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      }

      // Apply effect to specific area if effect crop mode is enabled
      if (isEffectCropMode && videoEffect !== ("none" as VideoEffect)) {
        // Use consistent coordinate calculation
        const effectArea = calculateEffectAreaInVideoSpace(canvas.width, canvas.height)
        const clampedX = effectArea.x
        const clampedY = effectArea.y
        const clampedWidth = effectArea.width
        const clampedHeight = effectArea.height

        // Create a temporary canvas for the effect area
        const tempCanvas = document.createElement("canvas")
        const tempCtx = tempCanvas.getContext("2d")
        if (!tempCtx) return

        tempCanvas.width = clampedWidth
        tempCanvas.height = clampedHeight

        // Extract the area to be affected from the main canvas (which already has the video drawn)
        const imageData = ctx.getImageData(clampedX, clampedY, clampedWidth, clampedHeight)
        tempCtx.putImageData(imageData, 0, 0)

        // Apply effect to the temporary canvas
        if (videoEffect === "blur") {
          const blurAmount = effectIntensity * 2
          tempCtx.filter = `blur(${blurAmount}px)`
          // Draw the canvas onto itself with the blur filter
          tempCtx.drawImage(tempCanvas, 0, 0)
        } else if (videoEffect === "pixelate") {
          const pixelSize = Math.max(1, effectIntensity * 3)
          const scaledWidth = Math.max(1, Math.floor(clampedWidth / pixelSize))
          const scaledHeight = Math.max(1, Math.floor(clampedHeight / pixelSize))

          // Create a smaller version for pixelation
          const pixelCanvas = document.createElement("canvas")
          const pixelCtx = pixelCanvas.getContext("2d")
          if (!pixelCtx) return

          pixelCanvas.width = scaledWidth
          pixelCanvas.height = scaledHeight

          // Disable smoothing for pixelated effect
          pixelCtx.imageSmoothingEnabled = false
          tempCtx.imageSmoothingEnabled = false

          // Draw the area at reduced size
          pixelCtx.drawImage(tempCanvas, 0, 0, clampedWidth, clampedHeight, 0, 0, scaledWidth, scaledHeight)

          // Clear the temp canvas and draw the pixelated version back at full size
          tempCtx.clearRect(0, 0, clampedWidth, clampedHeight)
          tempCtx.drawImage(pixelCanvas, 0, 0, scaledWidth, scaledHeight, 0, 0, clampedWidth, clampedHeight)
        }

        // Draw the affected area back to the main canvas
        ctx.drawImage(tempCanvas, 0, 0, clampedWidth, clampedHeight, clampedX, clampedY, clampedWidth, clampedHeight)
      } else if (videoEffect !== ("none" as VideoEffect) && !isEffectCropMode) {
        // Apply effect to entire video
        if (videoEffect === "blur") {
          const blurAmount = effectIntensity * 2
          ctx.filter = `blur(${blurAmount}px)`

          if (isMirrored) {
            ctx.save()
            ctx.scale(-1, 1)
            ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height)
            ctx.restore()
          } else {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
          }
        } else if (videoEffect === "pixelate") {
          const pixelSize = effectIntensity * 3
          const scaledWidth = Math.max(1, Math.floor(canvas.width / pixelSize))
          const scaledHeight = Math.max(1, Math.floor(canvas.height / pixelSize))

          ctx.imageSmoothingEnabled = false

          if (isMirrored) {
            ctx.save()
            ctx.scale(-1, 1)
            ctx.drawImage(video, -scaledWidth, 0, scaledWidth, scaledHeight)
            ctx.restore()
          } else {
            ctx.drawImage(video, 0, 0, scaledWidth, scaledHeight)
          }

          const imageData = ctx.getImageData(0, 0, scaledWidth, scaledHeight)
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.putImageData(imageData, 0, 0)
          ctx.drawImage(canvas, 0, 0, scaledWidth, scaledHeight, 0, 0, canvas.width, canvas.height)
        }
      }

      requestAnimationFrame(drawFrame)
    }
    drawFrame()

    // Get audio track from original stream
    const audioTracks = streamRef.current.getAudioTracks()
    const canvasStream = canvas.captureStream(30)

    // Add audio track to canvas stream
    if (audioTracks.length > 0) {
      canvasStream.addTrack(audioTracks[0])
    }

    return canvasStream
  }, [videoEffect, effectIntensity, isMirrored, isEffectCropMode, effectCropArea, isFullscreen, calculateEffectAreaInVideoSpace])

  // Toggle crop mode
  const toggleCropMode = useCallback(() => {
    setIsCropMode(!isCropMode)
    if (!isCropMode) {
      // Reset crop area when entering crop mode
      setCropArea({ x: 0.1, y: 0.1, width: 0.8, height: 0.8 })
    }
  }, [isCropMode])

  // Toggle effect crop mode
  const toggleEffectCropMode = useCallback(() => {
    setIsEffectCropMode(!isEffectCropMode)
    if (!isEffectCropMode) {
      // Reset effect crop area when entering effect crop mode
      setEffectCropArea({ x: 0.2, y: 0.2, width: 0.6, height: 0.6 })
    }
  }, [isEffectCropMode])





  



  // Handle crop area mouse events
  const handleCropMouseDown = useCallback((e: React.MouseEvent, handle?: string) => {
    if (!videoContainerRef.current || !videoRef.current) return

    e.preventDefault()
    e.stopPropagation()

    // Use the correct element bounds based on fullscreen mode
    const rect = isFullscreen 
      ? videoRef.current.getBoundingClientRect()
      : videoContainerRef.current.getBoundingClientRect()
    const videoArea = getVideoDisplayArea()
    
    // Convert mouse coordinates relative to the actual video display area
    // const relativeX = (e.clientX - rect.left - videoArea.videoOffsetX) / videoArea.displayedVideoWidth
    // const relativeY = (e.clientY - rect.top - videoArea.videoOffsetY) / videoArea.displayedVideoHeight

    setDragStart({ x: e.clientX, y: e.clientY })

    if (handle) {
      setIsResizing(true)
      setResizeHandle(handle)
    } else {
      setIsDragging(true)
    }
  }, [getVideoDisplayArea, isFullscreen])

  // Handle effect crop area mouse events
  const handleEffectCropMouseDown = useCallback((e: React.MouseEvent, handle?: string) => {
    if (!videoContainerRef.current || !videoRef.current) return

    e.preventDefault()
    e.stopPropagation()

    // Use the correct element bounds based on fullscreen mode
    const rect = isFullscreen 
      ? videoRef.current.getBoundingClientRect()
      : videoContainerRef.current.getBoundingClientRect()
    const videoArea = getVideoDisplayArea()
    
    // Convert mouse coordinates relative to the actual video display area
    // const relativeX = (e.clientX - rect.left - videoArea.videoOffsetX) / videoArea.displayedVideoWidth
    // const relativeY = (e.clientY - rect.top - videoArea.videoOffsetY) / videoArea.displayedVideoHeight

    setEffectDragStart({ x: e.clientX, y: e.clientY })

    if (handle) {
      setIsEffectResizing(true)
      setEffectResizeHandle(handle)
    } else {
      setIsEffectDragging(true)
    }
  }, [getVideoDisplayArea, isFullscreen])

  const handleCropMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!videoContainerRef.current || !videoRef.current || (!isDragging && !isResizing && !isEffectDragging && !isEffectResizing)) return

      // Use the correct element bounds based on fullscreen mode
      // const rect = isFullscreen 
      //   ? videoRef.current.getBoundingClientRect()
      //   : videoContainerRef.current.getBoundingClientRect()
      const videoArea = getVideoDisplayArea()

      // Handle regular crop area
      if (isDragging || isResizing) {
        const deltaX = (e.clientX - dragStart.x) / videoArea.displayedVideoWidth
        const deltaY = (e.clientY - dragStart.y) / videoArea.displayedVideoHeight

        if (isDragging) {
          setCropArea((prev) => ({
            ...prev,
            x: Math.max(0, Math.min(1 - prev.width, prev.x + deltaX)),
            y: Math.max(0, Math.min(1 - prev.height, prev.y + deltaY)),
          }))
        } else if (isResizing) {
          setCropArea((prev) => {
            const newArea = { ...prev }

            switch (resizeHandle) {
              case "nw":
                newArea.width = Math.max(0.1, prev.width - deltaX)
                newArea.height = Math.max(0.1, prev.height - deltaY)
                newArea.x = Math.max(0, prev.x + deltaX)
                newArea.y = Math.max(0, prev.y + deltaY)
                break
              case "ne":
                newArea.width = Math.max(0.1, Math.min(1 - prev.x, prev.width + deltaX))
                newArea.height = Math.max(0.1, prev.height - deltaY)
                newArea.y = Math.max(0, prev.y + deltaY)
                break
              case "sw":
                newArea.width = Math.max(0.1, prev.width - deltaX)
                newArea.height = Math.max(0.1, Math.min(1 - prev.y, prev.height + deltaY))
                newArea.x = Math.max(0, prev.x + deltaX)
                break
              case "se":
                newArea.width = Math.max(0.1, Math.min(1 - prev.x, prev.width + deltaX))
                newArea.height = Math.max(0.1, Math.min(1 - prev.y, prev.height + deltaY))
                break
            }

            return newArea
          })
        }

        setDragStart({ x: e.clientX, y: e.clientY })
      }

      // Handle effect crop area
      if (isEffectDragging || isEffectResizing) {
        const deltaX = (e.clientX - effectDragStart.x) / videoArea.displayedVideoWidth
        const deltaY = (e.clientY - effectDragStart.y) / videoArea.displayedVideoHeight

        if (isEffectDragging) {
          setEffectCropArea((prev) => ({
            ...prev,
            x: Math.max(0, Math.min(1 - prev.width, prev.x + deltaX)),
            y: Math.max(0, Math.min(1 - prev.height, prev.y + deltaY)),
          }))
        } else if (isEffectResizing) {
          setEffectCropArea((prev) => {
            const newArea = { ...prev }

            switch (effectResizeHandle) {
              case "nw":
                newArea.width = Math.max(0.1, prev.width - deltaX)
                newArea.height = Math.max(0.1, prev.height - deltaY)
                newArea.x = Math.max(0, prev.x + deltaX)
                newArea.y = Math.max(0, prev.y + deltaY)
                break
              case "ne":
                newArea.width = Math.max(0.1, Math.min(1 - prev.x, prev.width + deltaX))
                newArea.height = Math.max(0.1, prev.height - deltaY)
                newArea.y = Math.max(0, prev.y + deltaY)
                break
              case "sw":
                newArea.width = Math.max(0.1, prev.width - deltaX)
                newArea.height = Math.max(0.1, Math.min(1 - prev.y, prev.height + deltaY))
                newArea.x = Math.max(0, prev.x + deltaX)
                break
              case "se":
                newArea.width = Math.max(0.1, Math.min(1 - prev.x, prev.width + deltaX))
                newArea.height = Math.max(0.1, Math.min(1 - prev.y, prev.height + deltaY))
                break
            }

            return newArea
          })
        }

        setEffectDragStart({ x: e.clientX, y: e.clientY })
      }
    },
    [
      isDragging,
      isResizing,
      isEffectDragging,
      isEffectResizing,
      dragStart,
      effectDragStart,
      resizeHandle,
      effectResizeHandle,
      getVideoDisplayArea,
      isFullscreen,
    ],
  )

  const handleCropMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeHandle("")
    setIsEffectDragging(false)
    setIsEffectResizing(false)
    setEffectResizeHandle("")
  }, [])

  // Add mouse event listeners for crop functionality
  useEffect(() => {
    if ((isCropMode && (isDragging || isResizing)) || (isEffectCropMode && (isEffectDragging || isEffectResizing))) {
      document.addEventListener("mousemove", handleCropMouseMove)
      document.addEventListener("mouseup", handleCropMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleCropMouseMove)
        document.removeEventListener("mouseup", handleCropMouseUp)
      }
    }
  }, [
    isCropMode,
    isDragging,
    isResizing,
    isEffectCropMode,
    isEffectDragging,
    isEffectResizing,
    handleCropMouseMove,
    handleCropMouseUp,
  ])

  // Screenshot modal functions
  const openScreenshotModal = useCallback(
    (index: number) => {
      if (screenshots.length > 0 && index >= 0 && index < screenshots.length) {
        setSelectedScreenshotIndex(index)
        setIsScreenshotModalOpen(true)
      }
    },
    [screenshots.length],
  )

  const closeScreenshotModal = useCallback(() => {
    setIsScreenshotModalOpen(false)
  }, [])

  const navigateScreenshot = useCallback(
    (direction: "prev" | "next") => {
      setSelectedScreenshotIndex((prev) => {
        if (direction === "prev") {
          return prev > 0 ? prev - 1 : screenshots.length - 1
        } else {
          return prev < screenshots.length - 1 ? prev + 1 : 0
        }
      })
    },
    [screenshots.length],
  )

  // Apply effects to screenshot canvas
  const applyEffectToScreenshot = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, mode: "crop" | "full") => {
    if (!isEffectCropMode && mode === "full") {
      // Apply effect to entire screenshot when not in effect crop mode
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      
      if (videoEffect === "blur") {
        const blurAmount = effectIntensity * 2
        try {
          ctx.filter = `blur(${blurAmount}px)`
          ctx.drawImage(canvas, 0, 0)
        } catch {
          // Fallback to manual blur
          const blurredData = applyManualBlur(imageData, Math.ceil(blurAmount / 2))
          ctx.putImageData(blurredData, 0, 0)
        }
      } else if (videoEffect === "pixelate") {
        const pixelSize = Math.max(2, effectIntensity * 4)
        const scaledWidth = Math.max(1, Math.floor(canvas.width / pixelSize))
        const scaledHeight = Math.max(1, Math.floor(canvas.height / pixelSize))

        const pixelCanvas = document.createElement("canvas")
        const pixelCtx = pixelCanvas.getContext("2d")
        if (pixelCtx) {
          pixelCanvas.width = scaledWidth
          pixelCanvas.height = scaledHeight
          pixelCtx.imageSmoothingEnabled = false
          pixelCtx.putImageData(imageData, 0, 0)
          
          // Draw at reduced size
          pixelCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, scaledWidth, scaledHeight)
          
          // Draw back at full size
          ctx.imageSmoothingEnabled = false
          ctx.clearRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(pixelCanvas, 0, 0, scaledWidth, scaledHeight, 0, 0, canvas.width, canvas.height)
        }
      }
      return
    }

    if (!isEffectCropMode) return

    // Calculate effect area using consistent coordinate system
    const effectAreaInCanvas = mode === "crop" 
      ? { x: 0, y: 0, width: canvas.width, height: canvas.height } // For crop mode, apply to whole cropped area
      : calculateEffectAreaInVideoSpace(canvas.width, canvas.height) // For full mode, use calculated area

    // Extract the effect area
    const imageData = ctx.getImageData(effectAreaInCanvas.x, effectAreaInCanvas.y, effectAreaInCanvas.width, effectAreaInCanvas.height)

    if (videoEffect === "blur") {
      const blurAmount = effectIntensity * 2
      try {
        // Create temporary canvas for blur effect
        const tempCanvas = document.createElement("canvas")
        const tempCtx = tempCanvas.getContext("2d")
        if (tempCtx) {
          tempCanvas.width = effectAreaInCanvas.width
          tempCanvas.height = effectAreaInCanvas.height
          tempCtx.putImageData(imageData, 0, 0)
          tempCtx.filter = `blur(${blurAmount}px)`
          tempCtx.drawImage(tempCanvas, 0, 0)
          
          // Draw the blurred area back to the main canvas
          ctx.drawImage(tempCanvas, 0, 0, effectAreaInCanvas.width, effectAreaInCanvas.height, 
                       effectAreaInCanvas.x, effectAreaInCanvas.y, effectAreaInCanvas.width, effectAreaInCanvas.height)
        }
      } catch {
        // Fallback to manual blur
        const blurredData = applyManualBlur(imageData, Math.ceil(blurAmount / 2))
        ctx.putImageData(blurredData, effectAreaInCanvas.x, effectAreaInCanvas.y)
      }
    } else if (videoEffect === "pixelate") {
      const pixelSize = Math.max(2, effectIntensity * 4)
      const scaledWidth = Math.max(1, Math.floor(effectAreaInCanvas.width / pixelSize))
      const scaledHeight = Math.max(1, Math.floor(effectAreaInCanvas.height / pixelSize))

      const pixelCanvas = document.createElement("canvas")
      const pixelCtx = pixelCanvas.getContext("2d")
      if (pixelCtx) {
        pixelCanvas.width = scaledWidth
        pixelCanvas.height = scaledHeight
        pixelCtx.imageSmoothingEnabled = false

        // Create temp canvas with original effect area
        const tempCanvas = document.createElement("canvas")
        const tempCtx = tempCanvas.getContext("2d")
        if (tempCtx) {
          tempCanvas.width = effectAreaInCanvas.width
          tempCanvas.height = effectAreaInCanvas.height
          tempCtx.putImageData(imageData, 0, 0)
          
          // Draw at reduced size for pixelation
          pixelCtx.drawImage(tempCanvas, 0, 0, effectAreaInCanvas.width, effectAreaInCanvas.height, 0, 0, scaledWidth, scaledHeight)

          // Draw back at full size
          tempCtx.imageSmoothingEnabled = false
          tempCtx.clearRect(0, 0, effectAreaInCanvas.width, effectAreaInCanvas.height)
          tempCtx.drawImage(pixelCanvas, 0, 0, scaledWidth, scaledHeight, 0, 0, effectAreaInCanvas.width, effectAreaInCanvas.height)
          
          // Draw the pixelated area back to the main canvas
          ctx.drawImage(tempCanvas, 0, 0, effectAreaInCanvas.width, effectAreaInCanvas.height, 
                       effectAreaInCanvas.x, effectAreaInCanvas.y, effectAreaInCanvas.width, effectAreaInCanvas.height)
        }
      }
    }
  }, [videoEffect, effectIntensity, isEffectCropMode, calculateEffectAreaInVideoSpace, applyManualBlur])

  // Take screenshot (with crop if enabled and timer support)
  const takeScreenshot = useCallback(
    async (withTimer = true) => {
      console.log('📸 takeScreenshot called:', { withTimer, isTimerActive, isCapturingScreenshot, screenshotTimer })
      
      if (!videoRef.current || !screenshotCanvasRef.current || recordingState !== "idle") {
        console.log('📸 Early return:', { hasVideo: !!videoRef.current, hasCanvas: !!screenshotCanvasRef.current, recordingState })
        return
      }

      // Prevent multiple simultaneous screenshot captures using ref for immediate protection
      if (isCapturingRef.current || isCapturingScreenshot) {
        console.log('📸 Already capturing screenshot, ignoring call')
        return
      }

      // If timer is set and this is a manual trigger, start countdown
      if (withTimer && screenshotTimer > 0 && !isTimerActive) {
        console.log('📸 Starting timer countdown:', screenshotTimer)
        
        // Clear any existing timer
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current)
        }
        
        setIsTimerActive(true)
        setTimerCountdown(screenshotTimer)

        let currentCount = screenshotTimer
        timerIntervalRef.current = setInterval(() => {
          currentCount--
          console.log('📸 Timer countdown:', currentCount)
          setTimerCountdown(currentCount)
          
          if (currentCount <= 0) {
            console.log('📸 Timer finished, taking screenshot')
            clearInterval(timerIntervalRef.current!)
            timerIntervalRef.current = null
            setIsTimerActive(false)
            // Schedule the actual screenshot to avoid timing conflicts
            setTimeout(() => {
              actuallyTakeScreenshot()
            }, 100)
          }
        }, 1000)

        return
      }

      // Direct screenshot without timer
      console.log('📸 Taking direct screenshot')
      actuallyTakeScreenshot()
    },
    [recordingState, screenshotTimer, isTimerActive, isCapturingScreenshot],
  )

  // Separate function for the actual screenshot logic to avoid recursion
  const actuallyTakeScreenshot = useCallback(
    async () => {
      console.log('📸 actuallyTakeScreenshot called:', { isCapturingScreenshot, isCapturingRef: isCapturingRef.current })
      
      if (!videoRef.current || !screenshotCanvasRef.current || recordingState !== "idle") {
        console.log('📸 actuallyTakeScreenshot early return:', { hasVideo: !!videoRef.current, hasCanvas: !!screenshotCanvasRef.current, recordingState })
        return
      }

      // Prevent multiple simultaneous captures using ref for immediate protection
      if (isCapturingRef.current || isCapturingScreenshot) {
        console.log('📸 Already capturing screenshot in actuallyTakeScreenshot, ignoring')
        return
      }

      console.log('📸 Starting screenshot capture')
      isCapturingRef.current = true
      setIsCapturingScreenshot(true)

      // Safety timeout to reset flags in case something goes wrong
      const safetyTimeout = setTimeout(() => {
        console.log('📸 Safety timeout triggered, resetting capture flags')
        isCapturingRef.current = false
        setIsCapturingScreenshot(false)
      }, 5000) // 5 second timeout

      const video = videoRef.current
      const canvas = screenshotCanvasRef.current
      const ctx = canvas.getContext("2d")

      if (!ctx) return

      if (isCropMode) {
        // Screenshot with crop - properly handle aspect ratios and fullscreen
        const videoWidth = video.videoWidth || 1280
        const videoHeight = video.videoHeight || 720
        const videoAspectRatio = videoWidth / videoHeight

        // Get the container dimensions - handle fullscreen vs normal mode
        let containerRect: DOMRect

        if (isFullscreen) {
          // In fullscreen, use the actual video element bounds
          containerRect = video.getBoundingClientRect()
        } else {
          // In normal mode, use the container
          const containerElement = videoContainerRef.current
          if (!containerElement) return
          containerRect = containerElement.getBoundingClientRect()
        }

        const containerAspectRatio = containerRect.width / containerRect.height

        // Calculate how the video is actually displayed within the container (using same logic as getVideoDisplayArea)
        let displayedVideoWidth: number
        let displayedVideoHeight: number
        let videoOffsetX = 0
        let videoOffsetY = 0

        // Use a small tolerance for aspect ratio comparison to handle floating point precision
        const aspectRatioTolerance = 0.01
        const aspectRatioDiff = Math.abs(videoAspectRatio - containerAspectRatio)
        
        if (aspectRatioDiff < aspectRatioTolerance) {
          // Aspect ratios are essentially the same - video fills container
          displayedVideoWidth = containerRect.width
          displayedVideoHeight = containerRect.height
          videoOffsetX = 0
          videoOffsetY = 0
        } else if (videoAspectRatio > containerAspectRatio) {
          // Video is wider than container - constrain by width (letterboxed)
          displayedVideoWidth = containerRect.width
          displayedVideoHeight = containerRect.width / videoAspectRatio
          videoOffsetX = 0
          videoOffsetY = (containerRect.height - displayedVideoHeight) / 2
        } else {
          // Video is taller than container - constrain by height (pillarboxed)
          displayedVideoWidth = containerRect.height * videoAspectRatio
          displayedVideoHeight = containerRect.height
          videoOffsetX = (containerRect.width - displayedVideoWidth) / 2
          videoOffsetY = 0
        }

        // Convert crop area from container percentage to actual pixel coordinates
        const cropStartX = cropArea.x * containerRect.width
        const cropStartY = cropArea.y * containerRect.height
        const cropWidth = cropArea.width * containerRect.width
        const cropHeight = cropArea.height * containerRect.height

        // Adjust for video offset and convert to video coordinates
        const videoCropStartX = (cropStartX - videoOffsetX) * (videoWidth / displayedVideoWidth)
        const videoCropStartY = (cropStartY - videoOffsetY) * (videoHeight / displayedVideoHeight)
        const videoCropWidth = cropWidth * (videoWidth / displayedVideoWidth)
        const videoCropHeight = cropHeight * (videoHeight / displayedVideoHeight)

        // Clamp to video bounds
        const clampedX = Math.max(0, Math.min(videoCropStartX, videoWidth))
        const clampedY = Math.max(0, Math.min(videoCropStartY, videoHeight))
        const clampedWidth = Math.max(1, Math.min(videoCropWidth, videoWidth - clampedX))
        const clampedHeight = Math.max(1, Math.min(videoCropHeight, videoHeight - clampedY))

        canvas.width = clampedWidth
        canvas.height = clampedHeight

        if (isMirrored) {
          ctx.save()
          ctx.scale(-1, 1)
          ctx.drawImage(
            video,
            clampedX,
            clampedY,
            clampedWidth,
            clampedHeight,
            -clampedWidth,
            0,
            clampedWidth,
            clampedHeight,
          )
          ctx.restore()
        } else {
          ctx.drawImage(video, clampedX, clampedY, clampedWidth, clampedHeight, 0, 0, clampedWidth, clampedHeight)
        }
      } else {
        // Full screenshot - capture in the selected aspect ratio
        const videoWidth = video.videoWidth || 1280
        const videoHeight = video.videoHeight || 720
        const videoAspectRatio = videoWidth / videoHeight
        
        // Calculate target aspect ratio
        let targetAspectRatio: number
        switch (aspectRatio) {
          case "9:16":
            targetAspectRatio = 9 / 16
            break
          case "4:3":
            targetAspectRatio = 4 / 3
            break
          case "1:1":
            targetAspectRatio = 1
            break
          default: // "16:9"
            targetAspectRatio = 16 / 9
            break
        }
        
        // Calculate screenshot dimensions based on selected aspect ratio
        let screenshotWidth: number
        let screenshotHeight: number
        
        // Use exact dimensions for each aspect ratio to avoid any rounding issues
        switch (aspectRatio) {
          case "9:16":
            screenshotWidth = 1080
            screenshotHeight = 1920
            break
          case "4:3":
            screenshotWidth = 1440
            screenshotHeight = 1080
            break
          case "1:1":
            screenshotWidth = 1080
            screenshotHeight = 1080
            break
          default: // "16:9"
            screenshotWidth = 1920
            screenshotHeight = 1080
            break
        }
        
        canvas.width = screenshotWidth
        canvas.height = screenshotHeight
        
        // Debug screenshot dimensions
        console.log(`📸 Screenshot FINAL dimensions for ${aspectRatio}:`, {
          targetAspectRatio,
          screenshotSize: { width: screenshotWidth, height: screenshotHeight },
          actualAspectRatio: screenshotWidth / screenshotHeight,
          videoSize: { width: videoWidth, height: videoHeight, aspectRatio: videoAspectRatio },
          isVertical: screenshotHeight > screenshotWidth,
          expectedVertical: aspectRatio === "9:16"
        })
        
        // Clear canvas with black background
        ctx.fillStyle = '#000000'
        ctx.fillRect(0, 0, screenshotWidth, screenshotHeight)
        
        // Calculate how to fit the video into the screenshot canvas
        let drawWidth: number
        let drawHeight: number
        let drawX = 0
        let drawY = 0
        
        // For vertical screenshots (9:16), we want to fill the height and center horizontally
        if (aspectRatio === "9:16") {
          // Always fill the height for vertical screenshots
          drawHeight = screenshotHeight
          drawWidth = Math.round(screenshotHeight * videoAspectRatio)
          drawX = Math.round((screenshotWidth - drawWidth) / 2)
          
          console.log(`📐 Vertical screenshot fitting:`, {
            videoAspectRatio,
            drawSize: { width: drawWidth, height: drawHeight },
            drawPosition: { x: drawX, y: drawY },
            willFillHeight: true
          })
        } else if (Math.abs(videoAspectRatio - targetAspectRatio) < 0.01) {
          // Video aspect ratio matches target - fill entire canvas
          drawWidth = screenshotWidth
          drawHeight = screenshotHeight
        } else if (videoAspectRatio > targetAspectRatio) {
          // Video is wider - fit by height (letterbox)
          drawHeight = screenshotHeight
          drawWidth = Math.round(screenshotHeight * videoAspectRatio)
          drawX = Math.round((screenshotWidth - drawWidth) / 2)
        } else {
          // Video is taller - fit by width (pillarbox)
          drawWidth = screenshotWidth
          drawHeight = Math.round(screenshotWidth / videoAspectRatio)
          drawY = Math.round((screenshotHeight - drawHeight) / 2)
        }
        
        // Draw the video
        if (isMirrored) {
          ctx.save()
          ctx.scale(-1, 1)
          ctx.drawImage(
            video,
            0, 0, videoWidth, videoHeight,
            -(drawX + drawWidth), drawY, drawWidth, drawHeight
          )
          ctx.restore()
        } else {
          ctx.drawImage(
            video,
            0, 0, videoWidth, videoHeight,
            drawX, drawY, drawWidth, drawHeight
          )
        }
      }

      // Apply effects if enabled
      if (isEffectCropMode && videoEffect !== ("none" as VideoEffect)) {
        applyEffectToScreenshot(ctx, canvas, isCropMode ? "crop" : "full")
      }

      // Show flash effect
      setShowFlash(true)
      setTimeout(() => setShowFlash(false), 200)

      // Convert canvas to blob
      const quality = screenshotFormat === "jpeg" ? 0.9 : undefined
      
      // Final debug log before saving
      console.log(`💾 Saving screenshot with canvas dimensions:`, {
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        aspectRatio: canvas.width / canvas.height,
        expectedAspectRatio: aspectRatio,
        isCorrectVertical: aspectRatio === "9:16" && canvas.height > canvas.width
      })
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            try {
              const screenshotId = `screenshot-${Date.now()}`
              const screenshotUrl = URL.createObjectURL(blob)

              // Add to screenshots array
              const newScreenshot = {
                id: screenshotId,
                url: screenshotUrl,
                timestamp: new Date(),
              }

              setScreenshots((prev) => [newScreenshot, ...prev]) // Keep all screenshots
              setScreenshotCount((prev) => prev + 1)
              
              console.log(`✅ Screenshot saved successfully! Check if it's vertical: ${canvas.height > canvas.width}`)
            } catch (error) {
              console.error("Error creating screenshot:", error)
            } finally {
              // Always reset the capturing flags
              clearTimeout(safetyTimeout)
              isCapturingRef.current = false
              setIsCapturingScreenshot(false)
              console.log('📸 Screenshot capture completed, flags reset')
            }
          }
        },
        `image/${screenshotFormat}`,
        quality,
      )
    },
    [recordingState, screenshotFormat, isCropMode, cropArea, isFullscreen, isMirrored, isEffectCropMode, videoEffect, effectIntensity, applyEffectToScreenshot, aspectRatio, getVideoDisplayArea, isCapturingScreenshot],
  )

  // Cancel screenshot timer
  const cancelScreenshotTimer = useCallback(() => {
    console.log('📸 Timer cancelled')
    
    // Clear timer interval
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
    
    setIsTimerActive(false)
    setTimerCountdown(0)
    isCapturingRef.current = false
    setIsCapturingScreenshot(false) // Reset capture flags when cancelling
  }, [])

  // Download screenshot
  const downloadScreenshot = useCallback(
    (screenshot: { id: string; url: string; timestamp: Date }) => {
      try {
        const a = document.createElement("a")
        a.href = screenshot.url
        a.download = `screenshot-${screenshot.timestamp.getTime()}.${screenshotFormat}`
        a.style.display = "none"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } catch (error) {
        console.error("Error downloading screenshot:", error)
        // Fallback: open in new tab
        window.open(screenshot.url, "_blank")
      }
    },
    [screenshotFormat],
  )

  // Download all screenshots as ZIP
  const downloadAllScreenshots = useCallback(async () => {
    if (screenshots.length === 0) return

    try {
      const zip = new JSZip()

      // Add each screenshot to the ZIP
      for (let i = 0; i < screenshots.length; i++) {
        const screenshot = screenshots[i]

        // Fetch the blob from the URL
        const response = await fetch(screenshot.url)
        const blob = await response.blob()

        // Create filename with timestamp and index
        const filename = `screenshot-${screenshot.timestamp.getTime()}-${i + 1}.${screenshotFormat}`

        // Add to ZIP
        zip.file(filename, blob)
      }

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: "blob" })

      // Download ZIP
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      const zipFilename = `screenshots-${timestamp}.zip`

      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = zipFilename
      a.style.display = "none"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      setTimeout(() => {
        URL.revokeObjectURL(url)
      }, 1000)
    } catch (error) {
      console.error("Error creating ZIP file:", error)
      // Fallback: download screenshots individually
      screenshots.forEach((screenshot, index) => {
        setTimeout(() => {
          downloadScreenshot(screenshot)
        }, index * 500) // Stagger downloads to avoid browser blocking
      })
    }
  }, [screenshots, screenshotFormat, downloadScreenshot])

  // Clear screenshots - simplified to avoid circular dependencies
  const clearScreenshots = useCallback(() => {
    setScreenshots((prevScreenshots) => {
      // Clean up URLs
      prevScreenshots.forEach((screenshot) => {
        URL.revokeObjectURL(screenshot.url)
      })
      return []
    })
  }, [])

  // Start recording with format selection and crop support
  const startRecording = useCallback(() => {
    if (!streamRef.current) return

    try {
      let mimeType = "video/webm;codecs=vp9"

      // Try MP4 recording first if supported and requested
      if (exportFormat === "mp4" && mp4RecordingSupported) {
        if (MediaRecorder.isTypeSupported("video/mp4;codecs=avc1")) {
          mimeType = "video/mp4;codecs=avc1"
        } else if (MediaRecorder.isTypeSupported("video/mp4")) {
          mimeType = "video/mp4"
        }
      }

      // Create mirrored stream for regular recording
      const createMirroredStream = () => {
        if (!videoRef.current || !streamRef.current) return null

        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (!ctx) return null

        const video = videoRef.current
        canvas.width = video.videoWidth || 1280
        canvas.height = video.videoHeight || 720

        const drawFrame = () => {
          ctx.save()
          ctx.scale(-1, 1)
          ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height)
          ctx.restore()
          requestAnimationFrame(drawFrame)
        }
        drawFrame()

        // Get audio track from original stream
        const audioTracks = streamRef.current.getAudioTracks()
        const canvasStream = canvas.captureStream(30)

        // Add audio track to canvas stream
        if (audioTracks.length > 0) {
          canvasStream.addTrack(audioTracks[0])
        }

        return canvasStream
      }

      // Use effect stream if any effect is enabled, cropped stream if crop mode is enabled, or mirrored stream if mirror mode is enabled
      let recordingStream = streamRef.current
      if (videoEffect !== ("none" as VideoEffect) || isEffectCropMode) {
        const effectStream = createEffectStream()
        if (effectStream) {
          recordingStream = effectStream
          croppedStreamRef.current = effectStream
        }
      } else if (isCropMode) {
        const croppedStream = createCroppedStream()
        if (croppedStream) {
          recordingStream = croppedStream
          croppedStreamRef.current = croppedStream
        }
      } else if (isMirrored) {
        const mirroredStream = createMirroredStream()
        if (mirroredStream) {
          recordingStream = mirroredStream
          croppedStreamRef.current = mirroredStream // Reuse the ref for cleanup
        }
      }

      const mediaRecorder = new MediaRecorder(recordingStream, { mimeType })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const recordedMimeType = mediaRecorder.mimeType
        const blob = new Blob(chunksRef.current, { type: recordedMimeType })
        setRecordedBlob(blob)
        setRecordingState("stopped")

        // Clean up cropped stream
        if (croppedStreamRef.current) {
          croppedStreamRef.current.getTracks().forEach((track) => track.stop())
          croppedStreamRef.current = null
        }

        // Create video URL for preview
        const videoUrl = URL.createObjectURL(blob)
        if (videoRef.current) {
          videoRef.current.srcObject = null
          videoRef.current.src = videoUrl
          videoRef.current.onloadedmetadata = () => {
            const duration = videoRef.current?.duration || 0
            if (isFinite(duration) && duration > 0) {
              setVideoDuration(duration)
              setTrimEnd(duration)
              setTrimStart(0)
              setCurrentTime(0)
            }
          }
        }
      }

      mediaRecorder.start(100)
      setRecordingState("recording")
      setRecordingTime(0)

      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (error) {
      console.error("Error starting recording:", error)
      setCameraError("Failed to start recording")
    }
  }, [
    exportFormat,
    mp4RecordingSupported,
    isCropMode,
    createCroppedStream,
    isMirrored,
    videoEffect,
    isEffectCropMode,
    createEffectStream,
  ])

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recordingState === "recording") {
      mediaRecorderRef.current.stop()
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }, [recordingState])

  // Play/pause video
  const togglePlayback = useCallback(() => {
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  // Update current time
  const updateCurrentTime = useCallback(() => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime
      if (isFinite(time)) {
        setCurrentTime(time)
      }
    }
  }, [])

  // Seek to specific time
  const seekTo = useCallback((time: number) => {
    if (!videoRef.current || !isFinite(time) || time < 0) return

    const video = videoRef.current
    const duration = video.duration

    // Only seek if video is loaded and duration is valid
    if (!isFinite(duration) || duration <= 0) return

    // Clamp time to valid range
    const clampedTime = Math.max(0, Math.min(time, duration))

    try {
      video.currentTime = clampedTime
      setCurrentTime(clampedTime)
    } catch (error) {
      console.error("Error seeking video:", error)
    }
  }, [])

  // Toggle fullscreen for video preview
  const toggleFullscreen = useCallback(async () => {
    if (!videoContainerRef.current) return

    try {
      if (!document.fullscreenElement) {
        await videoContainerRef.current.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error)
    }
  }, [])

  // Recalculate crop areas when switching between fullscreen and normal modes
  const recalculateCropAreas = useCallback(() => {
    // Force a recalculation of video display area after fullscreen change
    // This ensures crop overlays are positioned correctly
    if (isCropMode || isEffectCropMode) {
      // Trigger a re-render by updating the video container size state
      setTimeout(() => {
        if (videoContainerRef.current) {
          const rect = videoContainerRef.current.getBoundingClientRect()
          setVideoContainerSize({ width: rect.width, height: rect.height })
        }
      }, 100) // Small delay to ensure fullscreen transition is complete
    }
  }, [isCropMode, isEffectCropMode])

  // Handle fullscreen change events
  const handleFullscreenChange = useCallback(() => {
    const wasFullscreen = isFullscreen
    const nowFullscreen = !!document.fullscreenElement
    
    setIsFullscreen(nowFullscreen)
    
    // If fullscreen state changed and crop modes are active, recalculate positions
    if (wasFullscreen !== nowFullscreen) {
      recalculateCropAreas()
    }
  }, [isFullscreen, recalculateCropAreas])

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Generate thumbnails for timeline
  const generateThumbnails = useCallback(async () => {
    if (!videoRef.current || !recordedBlob || videoDuration <= 0) return

    setIsGeneratingThumbnails(true)

    try {
      // Create a temporary video element for thumbnail generation
      const video = document.createElement("video")
      video.src = URL.createObjectURL(recordedBlob)
      video.muted = true

      // Create canvas for thumbnail capture
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      // Set thumbnail dimensions
      canvas.width = 160
      canvas.height = 90

      await new Promise((resolve) => {
        video.onloadeddata = resolve
      })

      const thumbnailCount = Math.min(10, Math.floor(videoDuration / 2)) // Max 10 thumbnails or one every 2 seconds
      const interval = videoDuration / thumbnailCount
      const newThumbnails: Array<{ time: number; url: string }> = []

      for (let i = 0; i < thumbnailCount; i++) {
        const time = i * interval

        // Seek to specific time
        video.currentTime = time

        await new Promise((resolve) => {
          video.onseeked = resolve
        })

        // Draw frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Convert to blob URL
        const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.7)

        newThumbnails.push({ time, url: thumbnailUrl })
      }

      setThumbnails(newThumbnails)
      URL.revokeObjectURL(video.src)
    } catch (error) {
      console.error("Error generating thumbnails:", error)
    } finally {
      setIsGeneratingThumbnails(false)
    }
  }, [recordedBlob, videoDuration])

  // Clean up thumbnails - simplified to avoid circular dependencies
  // const cleanupThumbnails = useCallback(() => {
  //   setThumbnails((prevThumbnails) => {
  //     // Clean up URLs
  //     prevThumbnails.forEach((thumbnail) => {
  //       if (thumbnail.url.startsWith("data:")) return // Don't revoke data URLs
  //       URL.revokeObjectURL(thumbnail.url)
  //     })
  //     return []
  //   })
  // }, [])

  // Reset to start over
  const resetRecording = useCallback(() => {
    setRecordingState("idle")
    setRecordedBlob(null)
    setRecordingTime(0)
    setVideoDuration(0)
    setTrimStart(0)
    setTrimEnd(0)
    setIsPlaying(false)
    setCurrentTime(0)
    setCameraError(null)
    setIsCropMode(false)
    setIsEffectCropMode(false)
    resetZoom()
    setIsMirrored(false)

    // Clean up thumbnails
    setThumbnails((prevThumbnails) => {
      prevThumbnails.forEach((thumbnail) => {
        if (!thumbnail.url.startsWith("data:")) {
          URL.revokeObjectURL(thumbnail.url)
        }
      })
      return []
    })

    // Clean up screenshots
    setScreenshots((prevScreenshots) => {
      prevScreenshots.forEach((screenshot) => {
        URL.revokeObjectURL(screenshot.url)
      })
      return []
    })

    if (videoRef.current) {
      videoRef.current.src = ""
      videoRef.current.srcObject = streamRef.current
    }
  }, [resetZoom])

  // Set mounted state to prevent hydration errors
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Initialize camera on mount (only on client side)
  useEffect(() => {
    if (!isMounted) return
    
    initializeCamera()

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (croppedStreamRef.current) {
        croppedStreamRef.current.getTracks().forEach((track) => track.stop())
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
      // Cleanup on unmount
      setScreenshots((prevScreenshots) => {
        prevScreenshots.forEach((screenshot) => {
          URL.revokeObjectURL(screenshot.url)
        })
        return []
      })
      setThumbnails((prevThumbnails) => {
        prevThumbnails.forEach((thumbnail) => {
          if (!thumbnail.url.startsWith("data:")) {
            URL.revokeObjectURL(thumbnail.url)
          }
        })
        return []
      })
    }
  }, [isMounted, initializeCamera])

  // Update video time
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => updateCurrentTime()
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    video.addEventListener("timeupdate", handleTimeUpdate)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate)
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
    }
  }, [updateCurrentTime])

  // Add fullscreen event listener
  useEffect(() => {
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [handleFullscreenChange])

  // Recalculate crop areas when fullscreen state changes
  useEffect(() => {
    if (isCropMode || isEffectCropMode) {
      // Add a small delay to ensure the layout has updated after fullscreen change
      const timeoutId = setTimeout(() => {
        // Force a re-render of crop overlays by updating container size
        if (videoContainerRef.current) {
          const rect = videoContainerRef.current.getBoundingClientRect()
          setVideoContainerSize({ width: rect.width, height: rect.height })
        }
      }, 150) // Delay to ensure fullscreen transition is complete

      return () => clearTimeout(timeoutId)
    }
  }, [isFullscreen, isCropMode, isEffectCropMode])

  // Generate thumbnails when video is ready
  useEffect(() => {
    if (recordingState === "stopped" && videoDuration > 0 && !isGeneratingThumbnails && thumbnails.length === 0) {
      generateThumbnails()
    }
  }, [recordingState, videoDuration, isGeneratingThumbnails, thumbnails.length, generateThumbnails])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      // Prevent default behavior for our shortcuts
      const shortcuts = ["KeyC", "KeyS", "KeyR", "Space", "Equal", "Minus", "Digit0"]
      if (shortcuts.includes(event.code)) {
        event.preventDefault()
      }

      switch (event.code) {
        case "KeyC":
          // C key - Toggle crop mode (only when idle)
          if (recordingState === "idle") {
            toggleCropMode()
          }
          break

        case "KeyS":
          // S key - Take screenshot (only when idle)
          if (recordingState === "idle" && !cameraError && !isTimerActive) {
            takeScreenshot()
          }
          break

        case "KeyR":
        case "Space":
          // R key or Space - Start/Stop recording
          if (recordingState === "idle" && !cameraError) {
            startRecording()
          } else if (recordingState === "recording") {
            stopRecording()
          }
          break

        case "ArrowLeft":
          // Left arrow - Previous screenshot in modal
          if (isScreenshotModalOpen && screenshots.length > 1) {
            event.preventDefault()
            navigateScreenshot("prev")
          }
          break

        case "ArrowRight":
          // Right arrow - Next screenshot in modal
          if (isScreenshotModalOpen && screenshots.length > 1) {
            event.preventDefault()
            navigateScreenshot("next")
          }
          break

        case "Escape":
          // Escape key - Close modal, exit crop mode or fullscreen
          if (isScreenshotModalOpen) {
            closeScreenshotModal()
          } else if (isFullscreen) {
            toggleFullscreen()
          } else if (isCropMode && recordingState === "idle") {
            setIsCropMode(false)
          } else if (isEffectCropMode && recordingState === "idle") {
            setIsEffectCropMode(false)
          }
          break

        case "KeyF":
          // F key - Toggle fullscreen
          if (recordingState === "idle" || recordingState === "stopped") {
            toggleFullscreen()
          }
          break

        case "Equal":
          // + key - Zoom in
          if (recordingState === "idle") {
            zoomIn()
          }
          break

        case "Minus":
          // - key - Zoom out
          if (recordingState === "idle") {
            zoomOut()
          }
          break

        case "Digit0":
          // 0 key - Reset zoom
          if (recordingState === "idle") {
            resetZoom()
          }
          break

        case "KeyM":
          // M key - Toggle mirror
          if (recordingState === "idle") {
            toggleMirror()
          }
          break
      }
    }

    // Add event listener
    document.addEventListener("keydown", handleKeyDown)

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [
    recordingState,
    cameraError,
    isCropMode,
    isEffectCropMode,
    isFullscreen,
    toggleCropMode,
    takeScreenshot,
    startRecording,
    stopRecording,
    toggleFullscreen,
    isTimerActive,
    zoomIn,
    zoomOut,
    resetZoom,
    toggleMirror,
    isScreenshotModalOpen,
    navigateScreenshot,
    closeScreenshotModal,
  ])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg mb-4">
            <Video className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 via-blue-800 to-purple-800 bg-clip-text text-transparent">
            FlexiCam Studio
          </h1>
          <p className="text-lg text-gray-600 font-medium">Professional camera recorder & video editor with real-time effects</p>

          {/* Format Support Status */}
          <div className="flex items-center justify-center gap-4 text-sm flex-wrap">
            <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm border border-white/50">
              <Settings className="w-4 h-4 text-blue-600" />
              <span className={`font-medium ${mp4RecordingSupported ? "text-emerald-600" : "text-amber-600"}`}>
                {mp4RecordingSupported ? "Native MP4 Recording" : "MP4 via Conversion"}
              </span>
            </div>
            {webCodecsSupported && (
              <Badge variant="secondary" className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border-purple-200 shadow-sm">
                WebCodecs Available
              </Badge>
            )}
            {isCropMode && (
              <Badge variant="outline" className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-300 text-orange-700 shadow-sm">
                Crop Mode Active
              </Badge>
            )}
            {zoomLevel !== 1 && (
              <Badge variant="outline" className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-300 text-purple-700 shadow-sm">
                Zoom {Math.round(zoomLevel * 100)}%
              </Badge>
            )}
            {isMirrored && (
              <Badge variant="outline" className="bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-300 text-emerald-700 shadow-sm">
                Mirrored
              </Badge>
            )}
            {videoEffect !== ("none" as VideoEffect) && (
              <Badge variant="outline" className="bg-gradient-to-r from-violet-50 to-purple-50 border-violet-300 text-violet-700 shadow-sm">
                {videoEffect === "blur" ? "Blur" : "Pixelate"} {effectIntensity}
                {isEffectCropMode && " (Area)"}
              </Badge>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/60 backdrop-blur-sm border border-white/50 shadow-lg rounded-2xl p-1">
            <TabsTrigger 
              value="camera" 
              className="flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 font-medium"
            >
              <Camera className="w-4 h-4" />
              Camera Recorder
            </TabsTrigger>
            <TabsTrigger 
              value="editor" 
              className="flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 font-medium"
            >
              <Edit3 className="w-4 h-4" />
              Video Effects Editor
            </TabsTrigger>
            <TabsTrigger 
              value="presentation" 
              className="flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 font-medium"
            >
              <Film className="w-4 h-4" />
              Video Presentation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="camera" className="space-y-8 mt-8">
            {/* Export Format Selection */}
        {recordingState === "stopped" || recordingState === "editing" ? (
          <Card className="bg-white/70 backdrop-blur-sm border border-white/50 shadow-xl rounded-2xl overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-6">
                <label className="text-sm font-semibold text-gray-700">Export Format:</label>
                <Select value={exportFormat} onValueChange={(value: ExportFormat) => setExportFormat(value)}>
                  <SelectTrigger className="w-40 h-10 bg-white/80 border-gray-200 shadow-sm rounded-xl hover:bg-white transition-all duration-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-sm border border-white/50 shadow-xl rounded-xl">
                    <SelectItem value="webm">WebM</SelectItem>
                    <SelectItem value="mp4">MP4 (WhatsApp)</SelectItem>
                    <SelectItem value="avi">AVI (WhatsApp)</SelectItem>
                    <SelectItem value="mov">MOV (WhatsApp)</SelectItem>
                    <SelectItem value="3gp">3GP (WhatsApp)</SelectItem>
                  </SelectContent>
                </Select>

                {exportFormat === "mp4" && (
                  <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-blue-200 shadow-sm">
                    {mp4RecordingSupported ? "Native" : "Converted"}
                  </Badge>
                )}
              </div>

              {exportFormat === "mp4" && !mp4RecordingSupported && !webCodecsSupported && (
                <div className="mt-4 text-center text-sm text-amber-700 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="font-semibold">Note</span>
                  </div>
                  MP4 export will use conversion method (may have compatibility limitations)
                </div>
              )}
              {(exportFormat === "mp4" ||
                exportFormat === "avi" ||
                exportFormat === "mov" ||
                exportFormat === "3gp") && (
                <div className="mt-4 text-center text-sm text-emerald-700 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold">Compatible</span>
                  </div>
                  This format is compatible with WhatsApp
                  {exportFormat === "3gp" && " (optimized for mobile networks)"}
                </div>
              )}
              {(exportFormat === "avi" || exportFormat === "mov" || exportFormat === "3gp") && (
                <div className="mt-4 text-center text-sm text-blue-700 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold">Info</span>
                  </div>
                  {exportFormat.toUpperCase()} format may be saved as MP4 due to browser limitations, but the
                  file extension will be .{exportFormat}
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}











        {/* Main Video Card */}
        <Card className="bg-white/70 backdrop-blur-sm border border-white/50 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="pb-6 bg-gradient-to-r from-gray-50/80 to-blue-50/80 border-b border-white/50">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-xl">
                {recordingState === "recording" && (
                  <>
                    <div className="flex items-center gap-2 relative">
                      <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-red-600 rounded-full animate-pulse shadow-lg" />
                      <div className="w-4 h-4 bg-red-500/30 rounded-full animate-ping absolute" />
                    </div>
                    <span className="bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent font-bold">
                      Recording {isCropMode && "(Cropped)"}
                    </span>
                  </>
                )}
                {recordingState === "idle" && (
                  <>
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg">
                      <Camera className="w-5 h-5 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      Camera Preview {isCropMode && "(Crop Mode)"}{" "}
                      {zoomLevel !== 1 && `(${Math.round(zoomLevel * 100)}%)`}
                    </span>
                  </>
                )}
                {recordingState === "stopped" && (
                  <>
                    <div className="p-2 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl shadow-lg">
                      <Play className="w-5 h-5 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      Video Preview
                    </span>
                  </>
                )}
                {recordingState === "editing" && (
                  <>
                    <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl shadow-lg">
                      <Scissors className="w-5 h-5 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                      Video Editor
                    </span>
                  </>
                )}
                {recordingState === "processing" && (
                  <>
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl shadow-lg">
                      <Clock className="w-5 h-5 text-white animate-spin" />
                    </div>
                    <span className="bg-gradient-to-r from-purple-700 to-indigo-700 bg-clip-text text-transparent">
                      {exportFormat === "mp4" ? "Converting to MP4..." : "Processing Video..."}
                    </span>
                  </>
                )}
              </CardTitle>

              {recordingState === "recording" && (
                <Badge variant="destructive" className="animate-pulse bg-gradient-to-r from-red-500 to-red-600 shadow-lg px-4 py-2 text-white font-bold">
                  {formatTime(recordingTime)}
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6 p-8">
            {/* Error Message */}
            {cameraError && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl p-6 text-red-700 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-xl">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <span className="font-semibold">{cameraError}</span>
                </div>
              </div>
            )}

            {/* Video Display */}
            <div
              ref={videoContainerRef}
              className={`relative bg-black rounded-lg overflow-hidden ${
                !isFullscreen
                  ? "w-full"
                  : "fixed inset-0 z-50 rounded-none flex items-center justify-center"
              }`}
              style={
                isFullscreen
                  ? {
                      backgroundColor: "black",
                    }
                  : {
                      aspectRatio: aspectRatio === "16:9" ? "16/9" : 
                                   aspectRatio === "9:16" ? "9/16" :
                                   aspectRatio === "4:3" ? "4/3" : "1/1"
                    }
              }
            >
              <div
                className={
                  isFullscreen
                    ? aspectRatio === "16:9"
                      ? "w-full h-full max-h-screen"
                      : aspectRatio === "9:16"
                        ? "h-full max-h-screen w-auto max-w-[56.25vh]" // 9/16 of viewport height
                        : aspectRatio === "4:3"
                          ? "h-full max-h-screen w-auto max-w-[133.33vh]" // 4/3 of viewport height
                          : "h-full max-h-screen w-auto max-w-[100vh]" // 1:1 square
                    : "w-full h-full"
                }
                style={{
                  transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
                  cursor:
                    zoomLevel > 1 && !isCropMode && !isEffectCropMode ? (isPanning ? "grabbing" : "grab") : "default",
                }}
                onMouseDown={handlePanStart}
              >
                {isMounted ? (
                  <video
                    ref={videoRef}
                    className="w-full h-full object-contain"
                    style={{
                      transform: isMirrored ? "scaleX(-1)" : "none",
                      filter:
                        videoEffect === "blur" && !isEffectCropMode
                          ? `blur(${effectIntensity * 2}px)`
                          : videoEffect === "pixelate" && !isEffectCropMode
                            ? `contrast(1.2) saturate(1.1)`
                            : "none",
                      imageRendering: videoEffect === "pixelate" && !isEffectCropMode ? "pixelated" : "auto",
                    }}
                    autoPlay
                    muted={recordingState === "idle" || recordingState === "recording"}
                    playsInline
                  />
                ) : (
                  <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                    <div className="text-white text-center">
                      <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg opacity-75">Camera Loading...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Crop Overlay */}
              {isMounted && isCropMode && recordingState === "idle" && (() => {
                const videoArea = getVideoDisplayArea()
                const cropOverlay = (
                  <div key="crop-overlay" className="absolute inset-0 pointer-events-none">
                    {/* Crop area overlay - positioned relative to actual video display area */}
                    <div
                      className="absolute border-2 border-orange-400 bg-orange-400/10 cursor-move pointer-events-auto"
                      style={{
                        left: `${videoArea.videoOffsetX + cropArea.x * videoArea.displayedVideoWidth}px`,
                        top: `${videoArea.videoOffsetY + cropArea.y * videoArea.displayedVideoHeight}px`,
                        width: `${cropArea.width * videoArea.displayedVideoWidth}px`,
                        height: `${cropArea.height * videoArea.displayedVideoHeight}px`,
                      }}
                      onMouseDown={(e) => handleCropMouseDown(e)}
                    >
                      {/* Resize handles */}
                      <div
                        className="absolute -top-1 -left-1 w-3 h-3 bg-orange-400 border border-white cursor-nw-resize pointer-events-auto"
                        onMouseDown={(e) => handleCropMouseDown(e, "nw")}
                      />
                      <div
                        className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 border border-white cursor-ne-resize pointer-events-auto"
                        onMouseDown={(e) => handleCropMouseDown(e, "ne")}
                      />
                      <div
                        className="absolute -bottom-1 -left-1 w-3 h-3 bg-orange-400 border border-white cursor-sw-resize pointer-events-auto"
                        onMouseDown={(e) => handleCropMouseDown(e, "sw")}
                      />
                      <div
                        className="absolute -bottom-1 -right-1 w-3 h-3 bg-orange-400 border border-white cursor-se-resize pointer-events-auto"
                        onMouseDown={(e) => handleCropMouseDown(e, "se")}
                      />

                      {/* Center indicator */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xs bg-orange-500 px-2 py-1 rounded pointer-events-none">
                        Crop Area
                      </div>
                    </div>

                    {/* Dimmed overlay for non-crop areas */}
                    <div className="absolute inset-0 bg-black/40 pointer-events-none">
                      <div
                        className="absolute bg-transparent"
                        style={{
                          left: `${videoArea.videoOffsetX + cropArea.x * videoArea.displayedVideoWidth}px`,
                          top: `${videoArea.videoOffsetY + cropArea.y * videoArea.displayedVideoHeight}px`,
                          width: `${cropArea.width * videoArea.displayedVideoWidth}px`,
                          height: `${cropArea.height * videoArea.displayedVideoHeight}px`,
                          boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.4)`,
                        }}
                      />
                    </div>
                  </div>
                )
                return cropOverlay
              })()}

              {/* Real-time Effect Preview Canvas */}
              <canvas
                ref={previewEffectCanvasRef}
                className="absolute inset-0 pointer-events-none"
                style={{
                  display: "none",
                  zIndex: 5,
                }}
              />

              {/* Effect Crop Overlay */}
              {isMounted && isEffectCropMode && recordingState === "idle" && videoEffect !== ("none" as VideoEffect) && (() => {
                const videoArea = getVideoDisplayArea()
                const effectOverlay = (
                  <div key="effect-crop-overlay" className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
                    {/* Effect crop area overlay - positioned relative to actual video display area */}
                    <div
                      className="absolute border-2 border-purple-400 bg-purple-400/10 cursor-move pointer-events-auto"
                      style={{
                        left: `${videoArea.videoOffsetX + effectCropArea.x * videoArea.displayedVideoWidth}px`,
                        top: `${videoArea.videoOffsetY + effectCropArea.y * videoArea.displayedVideoHeight}px`,
                        width: `${effectCropArea.width * videoArea.displayedVideoWidth}px`,
                        height: `${effectCropArea.height * videoArea.displayedVideoHeight}px`,
                      }}
                      onMouseDown={(e) => handleEffectCropMouseDown(e)}
                    >
                      {/* Resize handles */}
                      <div
                        className="absolute -top-1 -left-1 w-3 h-3 bg-purple-400 border border-white cursor-nw-resize pointer-events-auto"
                        onMouseDown={(e) => handleEffectCropMouseDown(e, "nw")}
                      />
                      <div
                        className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 border border-white cursor-ne-resize pointer-events-auto"
                        onMouseDown={(e) => handleEffectCropMouseDown(e, "ne")}
                      />
                      <div
                        className="absolute -bottom-1 -left-1 w-3 h-3 bg-purple-400 border border-white cursor-sw-resize pointer-events-auto"
                        onMouseDown={(e) => handleEffectCropMouseDown(e, "sw")}
                      />
                      <div
                        className="absolute -bottom-1 -right-1 w-3 h-3 bg-purple-400 border border-white cursor-se-resize pointer-events-auto"
                        onMouseDown={(e) => handleEffectCropMouseDown(e, "se")}
                      />

                      {/* Center indicator */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xs bg-purple-500 px-2 py-1 rounded pointer-events-none">
                        {videoEffect === "blur" ? "Blur" : "Pixelate"} Area
                      </div>
                    </div>

                    {/* Dimmed overlay for non-effect areas */}
                    <div className="absolute inset-0 bg-black/20 pointer-events-none">
                      <div
                        className="absolute bg-transparent"
                        style={{
                          left: `${videoArea.videoOffsetX + effectCropArea.x * videoArea.displayedVideoWidth}px`,
                          top: `${videoArea.videoOffsetY + effectCropArea.y * videoArea.displayedVideoHeight}px`,
                          width: `${effectCropArea.width * videoArea.displayedVideoWidth}px`,
                          height: `${effectCropArea.height * videoArea.displayedVideoHeight}px`,
                          boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.2)`,
                        }}
                      />
                    </div>
                  </div>
                )
                return effectOverlay
              })()}

              {/* Zoom Controls Overlay */}
              {isMounted && recordingState === "idle" && !isFullscreen && (
                <div className="absolute top-4 left-4 flex flex-col gap-2 bg-black/50 backdrop-blur-sm rounded-lg p-2">
                  <Button
                    onClick={zoomIn}
                    variant="outline"
                    size="sm"
                    disabled={zoomLevel >= 3}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <div className="text-white text-xs font-mono text-center">{Math.round(zoomLevel * 100)}%</div>
                  <Button
                    onClick={zoomOut}
                    variant="outline"
                    size="sm"
                    disabled={zoomLevel <= 0.5}
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  {(zoomLevel !== 1 || panOffset.x !== 0 || panOffset.y !== 0) && (
                    <Button
                      onClick={resetZoom}
                      variant="outline"
                      size="sm"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <ResetZoom className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )}

              {/* Fullscreen Toggle Button */}
              <button
                onClick={toggleFullscreen}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all duration-200 backdrop-blur-sm"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                    />
                  </svg>
                )}
              </button>

              {/* Flash Effect */}
              {showFlash && <div className="absolute inset-0 bg-white opacity-80 pointer-events-none animate-pulse" />}

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
                  <div className="bg-white rounded-lg p-6 text-center space-y-4">
                    <div className="text-lg font-semibold">
                      {exportFormat === "mp4" ? "Converting to MP4..." : "Processing Video..."}
                    </div>
                    <div className="w-64 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${processingProgress}%` }}
                      />
                    </div>
                    <div className="text-sm text-slate-600">{Math.round(processingProgress)}%</div>
                    {exportFormat === "mp4" && (
                      <div className="text-xs text-slate-500">
                        {mp4RecordingSupported ? "Using native MP4 encoding" : "Converting from WebM to MP4"}
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
                      <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
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
                          strokeDashoffset={283 - (283 * (screenshotTimer - timerCountdown)) / screenshotTimer}
                          className="transition-all duration-1000 ease-linear"
                        />
                        <defs>
                          <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3B82F6" />
                            <stop offset="50%" stopColor="#8B5CF6" />
                            <stop offset="100%" stopColor="#EC4899" />
                          </linearGradient>
                        </defs>
                      </svg>
                      
                      {/* Inner Content */}
                      <div className="absolute inset-0 flex items-center justify-center">
                                                 <div className="bg-white/95 rounded-full w-36 h-36 flex items-center justify-center shadow-2xl border border-white/20">
                          <div className="text-center">
                            {/* Main Number */}
                            <div className="text-6xl font-black bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse scale-110 transition-transform duration-300">
                              {timerCountdown}
                            </div>
                            {/* Status Text */}
                            <div className="text-sm font-semibold text-slate-600 mt-2 tracking-wide">
                              Taking screenshot...
                            </div>
                            {/* Progress Dots */}
                            <div className="flex justify-center gap-1 mt-3">
                              {Array.from({ length: screenshotTimer }).map((_, index) => (
                                <div
                                  key={index}
                                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                    index < screenshotTimer - timerCountdown
                                      ? "bg-gradient-to-r from-blue-500 to-purple-500 scale-110"
                                      : "bg-slate-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Cancel Button - Floating outside */}
                    <button
                      onClick={cancelScreenshotTimer}
                      className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-full text-sm font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-red-400/50"
                    >
                      <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel Timer
                    </button>
                    
                    {/* Camera Icon */}
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-full shadow-lg">
                        <ImageIcon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Fullscreen Controls Overlay */}
              {isFullscreen && (
                <div
                  className={`absolute bottom-6 ${
                    aspectRatio === "9:16"
                      ? "left-1/2 transform -translate-x-1/2 w-80" // Centered for vertical
                      : "left-1/2 transform -translate-x-1/2" // Centered for all
                  } flex flex-col items-center gap-4`}
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
                          disabled={!!cameraError || isTimerActive || isCapturingScreenshot}
                        >
                          <ImageIcon className="w-4 h-4 mr-2" />
                          {isCapturingScreenshot ? "Capturing..." : isTimerActive ? `${timerCountdown}s` : "Screenshot"}
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
                      <Button onClick={stopRecording} size="sm" className="bg-red-600 hover:bg-red-700 text-white">
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
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
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
                        <span className="text-white text-xs font-medium mr-1">Aspect:</span>
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
                        <span className="text-white text-xs font-medium mr-1">Zoom:</span>
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
                        {(zoomLevel !== 1 || panOffset.x !== 0 || panOffset.y !== 0) && (
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
                        <span className="text-white text-xs font-medium mr-1">Mirror:</span>
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

                      {/* Effect Controls */}
                      <div className="flex items-center gap-1">
                        <span className="text-white text-xs font-medium mr-1">Effect:</span>
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
                            {effect === "none" ? "Off" : effect === "blur" ? "Blur" : "Pixel"}
                          </button>
                        ))}
                      </div>

                      {videoEffect !== ("none" as VideoEffect) && (
                        <>
                          <div className="flex items-center gap-1">
                            <span className="text-white text-xs font-medium mr-1">Level:</span>
                            <button
                              onClick={() => setEffectIntensity(Math.max(1, effectIntensity - 1))}
                              disabled={effectIntensity <= 1}
                              className={`px-1 py-1 rounded text-xs font-medium transition-all ${
                                effectIntensity <= 1
                                  ? "bg-white/5 text-white/30 cursor-not-allowed"
                                  : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                              }`}
                            >
                              -
                            </button>
                            <span className="text-white text-xs font-mono w-6 text-center">{effectIntensity}</span>
                            <button
                              onClick={() => setEffectIntensity(Math.min(10, effectIntensity + 1))}
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
                            <span className="text-white text-xs font-medium mr-1">Area:</span>
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
                        <span className="text-white text-xs font-medium mr-1">Timer:</span>
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
                        <span className="text-white text-xs font-medium mr-1">Format:</span>
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
            </div>

                        {/* Quick Controls Below Video Preview */}
            {!isFullscreen && (
              <div className="bg-gradient-to-r from-gray-50/80 to-blue-50/80 backdrop-blur-sm rounded-2xl p-6 space-y-6 border border-white/50 shadow-sm">
                {/* Main Camera Controls */}
                {recordingState === "idle" && (
                  <div className="flex justify-center gap-4 flex-wrap">
                    <Button
                      onClick={toggleCropMode}
                      variant={isCropMode ? "default" : "outline"}
                      size="sm"
                      className={isCropMode 
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg" 
                        : "bg-white/80 hover:bg-white border-orange-300 text-orange-700 hover:text-orange-800 transition-all duration-300"
                      }
                    >
                      <Crop className="w-4 h-4 mr-2" />
                      {isCropMode ? "Exit Crop" : "Crop"}
                    </Button>

                    <Button
                      onClick={() => takeScreenshot()}
                      variant="outline"
                      size="sm"
                      className="bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-300 text-blue-700 hover:text-blue-800 transition-all duration-300 shadow-sm"
                      disabled={!!cameraError || isTimerActive || isCapturingScreenshot}
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
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg transition-all duration-300 hover:shadow-xl"
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
                    {/* Aspect Ratio */}
                    <div className="flex items-center gap-2">
                      <label className="font-medium text-slate-700">Aspect:</label>
                      <Select value={aspectRatio} onValueChange={(value: AspectRatio) => setAspectRatio(value)}>
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
                      <label className="font-medium text-slate-700">Zoom:</label>
                      <div className="flex items-center gap-1">
                        <Button onClick={zoomOut} variant="outline" size="sm" disabled={zoomLevel <= 0.5} className="h-6 w-6 p-0">
                          <ZoomOut className="w-3 h-3" />
                        </Button>
                        <span className="text-xs font-mono w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                        <Button onClick={zoomIn} variant="outline" size="sm" disabled={zoomLevel >= 3} className="h-6 w-6 p-0">
                          <ZoomIn className="w-3 h-3" />
                        </Button>
                        {(zoomLevel !== 1 || panOffset.x !== 0 || panOffset.y !== 0) && (
                          <Button onClick={resetZoom} variant="outline" size="sm" className="h-6 w-6 p-0">
                            <ResetZoom className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Mirror Toggle */}
                    <div className="flex items-center gap-2">
                      <label className="font-medium text-slate-700">Mirror:</label>
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
                      <label className="font-medium text-slate-700">Timer:</label>
                      <Select value={screenshotTimer.toString()} onValueChange={(value) => setScreenshotTimer(Number.parseInt(value))}>
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
                      <label className="font-medium text-slate-700">Format:</label>
                      <Select value={screenshotFormat} onValueChange={(value: ScreenshotFormat) => setScreenshotFormat(value)}>
                        <SelectTrigger className="w-20 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="png">PNG</SelectItem>
                          <SelectItem value="jpeg">JPEG</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Effects Row */}
                {recordingState === "idle" && (
                  <div className="flex items-center justify-center gap-4 flex-wrap text-sm border-t pt-3">
                    <div className="flex items-center gap-2">
                      <label className="font-medium text-slate-700">Effect:</label>
                      <Select value={videoEffect} onValueChange={(value: VideoEffect) => setVideoEffect(value)}>
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
                          <label className="font-medium text-slate-700">Level:</label>
                          <div className="flex items-center gap-1">
                            <Button 
                              onClick={() => setEffectIntensity(Math.max(1, effectIntensity - 1))}
                              variant="outline" 
                              size="sm" 
                              disabled={effectIntensity <= 1}
                              className="h-6 w-6 p-0"
                            >
                              -
                            </Button>
                            <span className="text-xs font-mono w-6 text-center">{effectIntensity}</span>
                            <Button 
                              onClick={() => setEffectIntensity(Math.min(10, effectIntensity + 1))}
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
                          <label className="font-medium text-slate-700">Area:</label>
                          <Button
                            onClick={toggleEffectCropMode}
                            variant={isEffectCropMode ? "default" : "outline"}
                            size="sm"
                            className={`h-6 px-2 text-xs ${isEffectCropMode ? "bg-purple-500 hover:bg-purple-600" : ""}`}
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

            {/* Controls */}
            <div className="space-y-4">
              {/* Recording Controls */}
              {recordingState === "recording" && (
                <div className="flex justify-center gap-4">
                  <Button onClick={stopRecording} size="lg" variant="destructive">
                    <Square className="w-5 h-5 mr-2" />
                    Stop Recording
                  </Button>
                </div>
              )}

              {/* Zoom Info */}
              {recordingState === "idle" && zoomLevel !== 1 && (
                <div className="text-center text-sm text-slate-600 bg-purple-50 rounded-lg p-3">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <ZoomIn className="w-4 h-4" />
                    <span className="font-medium">Zoom Active: {Math.round(zoomLevel * 100)}%</span>
                  </div>
                  <p>Use mouse to pan when zoomed • Keyboard: +/- to zoom, 0 to reset</p>
                  {(panOffset.x !== 0 || panOffset.y !== 0) && (
                    <p className="text-xs text-slate-500 mt-1">
                      Pan offset: {Math.round(panOffset.x)}px, {Math.round(panOffset.y)}px
                    </p>
                  )}
                </div>
              )}

              {/* Mirror Info */}
              {recordingState === "idle" && isMirrored && (
                <div className="text-center text-sm text-slate-600 bg-green-50 rounded-lg p-3">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                      />
                    </svg>
                    <span className="font-medium">Mirror Mode Active</span>
                  </div>
                  <p>Video is horizontally flipped • Perfect for selfie-style recording</p>
                </div>
              )}

              {/* Effect Info */}
              {recordingState === "idle" && videoEffect !== ("none" as VideoEffect) && (
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
                    <span className="font-medium">
                      {videoEffect === "blur" ? "Blur Effect" : "Pixelate Effect"} Active (Intensity: {effectIntensity})
                      {isEffectCropMode && " - Area Mode"}
                    </span>
                  </div>
                  <p>
                    {videoEffect === "blur"
                      ? "Video is blurred for privacy or artistic effect"
                      : "Video is pixelated with retro-style blocks"}
                    {isEffectCropMode && " - Effect applied only to selected area"}
                  </p>
                </div>
              )}

              {/* Crop Mode Info */}
              {recordingState === "idle" && isCropMode && (
                <div className="text-center text-sm text-slate-600 bg-orange-50 rounded-lg p-3">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Move className="w-4 h-4" />
                    <span className="font-medium">Crop Mode Active</span>
                  </div>
                  <p>Drag the orange rectangle to move • Drag corners to resize</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Area: {Math.round(cropArea.width * 100)}% × {Math.round(cropArea.height * 100)}% • Position:{" "}
                    {Math.round(cropArea.x * 100)}%, {Math.round(cropArea.y * 100)}%
                  </p>
                </div>
              )}

              {/* Recording Controls */}
              {recordingState === "recording" && (
                <div className="flex justify-center gap-4">
                  <Button onClick={stopRecording} size="lg" variant="destructive">
                    <Square className="w-5 h-5 mr-2" />
                    Stop Recording
                  </Button>
                </div>
              )}

              {/* Playback Controls */}
              {recordingState === "stopped" && (
                <div className="space-y-6">
                  <div className="flex justify-center gap-4 flex-wrap">
                    <Button 
                      onClick={togglePlayback} 
                      variant="outline"
                      className="bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-300 text-blue-700 hover:text-blue-800 transition-all duration-300 shadow-sm"
                    >
                      {isPlaying ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                      {isPlaying ? "Pause" : "Play"}
                    </Button>

                    <Button 
                      onClick={() => setRecordingState("editing")} 
                      variant="outline"
                      className="bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 border-orange-300 text-orange-700 hover:text-orange-800 transition-all duration-300 shadow-sm"
                    >
                      <Scissors className="w-5 h-5 mr-2" />
                      Edit Video
                    </Button>

                    <Button
                      onClick={downloadOriginalVideo}
                      variant="outline"
                      className="bg-gradient-to-r from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 border-emerald-300 text-emerald-700 hover:text-emerald-800 transition-all duration-300 shadow-sm"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Download {exportFormat.toUpperCase()}
                    </Button>

                    <Button 
                      onClick={resetRecording} 
                      variant="outline"
                      className="bg-gradient-to-r from-gray-50 to-slate-50 hover:from-gray-100 hover:to-slate-100 border-gray-300 text-gray-700 hover:text-gray-800 transition-all duration-300 shadow-sm"
                    >
                      <RotateCcw className="w-5 h-5 mr-2" />
                      New Recording
                    </Button>
                  </div>

                  {/* Enhanced Timeline with Thumbnails */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-slate-600">
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
                                className="w-12 h-7 object-cover rounded border-2 border-transparent group-hover:border-blue-400 transition-all duration-200 shadow-sm"
                              />
                              <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
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
                      <div className="flex items-center justify-center py-4 text-sm text-slate-600">
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
                    <p className="text-sm text-slate-600">Set the start and end points for your video</p>
                  </div>

                  {/* Enhanced Trim Timeline */}
                  <div className="space-y-4">
                    {/* Thumbnail Timeline for Editing */}
                    {thumbnails.length > 0 && (
                      <div className="relative bg-slate-50 rounded-lg p-4">
                        <div className="text-sm font-medium mb-3 text-slate-700">Timeline Preview</div>
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
                                    thumbnail.time >= trimStart && thumbnail.time <= trimEnd
                                      ? "border-green-400 opacity-100"
                                      : "border-slate-300 opacity-50"
                                  }`}
                                />
                                <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
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
                      <label className="block text-sm font-medium mb-2">Start Time: {formatTime(trimStart)}</label>
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
                      <label className="block text-sm font-medium mb-2">End Time: {formatTime(trimEnd)}</label>
                      <Slider
                        value={[trimEnd]}
                        max={videoDuration || 0}
                        step={0.1}
                        onValueChange={([value]) => {
                          if (isFinite(value) && videoDuration > 0) {
                            const clampedValue = Math.max(trimStart, Math.min(value, videoDuration))
                            setTrimEnd(clampedValue)
                            seekTo(clampedValue)
                          }
                        }}
                        className="w-full"
                      />
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4">
                      <div className="text-sm text-slate-600">
                        <strong>Trimmed Duration:</strong> {formatTime(trimEnd - trimStart)}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Export format: {exportFormat.toUpperCase()}
                        {exportFormat === "mp4" && mp4RecordingSupported && " (Native)"}
                        {exportFormat === "mp4" && !mp4RecordingSupported && " (Converted)"}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-center gap-4 flex-wrap">
                    <Button onClick={() => setRecordingState("stopped")} variant="outline">
                      Cancel
                    </Button>

                    <Button onClick={downloadOriginalVideo} variant="outline" className="bg-blue-50 hover:bg-blue-100">
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
            </div>
          </CardContent>
        </Card>

        {/* Screenshot Gallery */}
        {screenshots.length > 0 && (
          <Card className="bg-white/70 backdrop-blur-sm border border-white/50 shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="pb-4 bg-gradient-to-r from-blue-50/80 to-purple-50/80 border-b border-white/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl shadow-lg">
                    <ImageIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Recent Screenshots ({screenshotCount})
                  </span>
                </CardTitle>
                <div className="flex items-center gap-3">
                  {screenshots.length > 1 && (
                    <Button
                      onClick={downloadAllScreenshots}
                      variant="outline"
                      size="sm"
                      className="bg-gradient-to-r from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 text-emerald-700 border-emerald-300 shadow-sm transition-all duration-300 hover:shadow-md"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download All ZIP
                    </Button>
                  )}
                  <Button 
                    onClick={clearScreenshots} 
                    variant="outline" 
                    size="sm"
                    className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all duration-300"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex gap-4 overflow-x-auto pb-3">
                {screenshots.map((screenshot, index) => (
                  <div key={screenshot.id} className="flex-shrink-0 group">
                    <div className="relative">
                      <img
                        src={screenshot.url || "/placeholder.svg"}
                        alt="Screenshot"
                        className="w-20 h-28 object-contain bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-transparent group-hover:border-blue-400 transition-all duration-300 cursor-pointer shadow-sm group-hover:shadow-lg"
                        onClick={() => openScreenshotModal(index)}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-xl flex items-center justify-center">
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openScreenshotModal(index)
                            }}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
                            title="View"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              downloadScreenshot(screenshot)
                            }}
                            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
                            title="Download"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2 text-center font-medium">
                      {screenshot.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Screenshot Modal */}
        {isScreenshotModalOpen && screenshots.length > 0 && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="relative bg-white rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                  <ImageIcon className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-lg">Screenshot Preview</h3>
                    <p className="text-sm text-slate-600">
                      {selectedScreenshotIndex + 1} of {screenshots.length} •
                      {screenshots[selectedScreenshotIndex]?.timestamp.toLocaleString()}
                    </p>
                  </div>
                </div>
                <button onClick={closeScreenshotModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="relative">
                {/* Main Image */}
                <div className="flex items-center justify-center bg-gray-50 min-h-[400px] max-h-[70vh] overflow-hidden p-4">
                  <img
                    src={screenshots[selectedScreenshotIndex]?.url || "/placeholder.svg"}
                    alt={`Screenshot ${selectedScreenshotIndex + 1}`}
                    className="max-w-full max-h-full object-contain shadow-lg rounded"
                    style={{ maxWidth: '90vw', maxHeight: '70vh' }}
                  />
                </div>

                {/* Navigation Arrows */}
                {screenshots.length > 1 && (
                  <>
                    <button
                      onClick={() => navigateScreenshot("prev")}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all backdrop-blur-sm"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => navigateScreenshot("next")}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all backdrop-blur-sm"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between p-4 border-t bg-gray-50">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span>Format: {screenshotFormat.toUpperCase()}</span>
                  {isMirrored && (
                    <Badge variant="outline" className="text-xs">
                      Mirrored
                    </Badge>
                  )}
                  {isCropMode && (
                    <Badge variant="outline" className="text-xs">
                      Cropped
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {screenshots.length > 1 && (
                    <div className="flex items-center gap-1">
                      {screenshots.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedScreenshotIndex(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === selectedScreenshotIndex ? "bg-blue-600" : "bg-gray-300 hover:bg-gray-400"
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  <Button
                    onClick={() => downloadScreenshot(screenshots[selectedScreenshotIndex])}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hidden Canvases */}
        <canvas ref={canvasRef} className="hidden" />
        <canvas ref={screenshotCanvasRef} className="hidden" />
        <canvas ref={cropCanvasRef} className="hidden" />
        <canvas ref={effectCanvasRef} className="hidden" />
        {/* Preview effect canvas is already in the video container */}

        {/* Instructions */}
        <Card className="bg-white/70 backdrop-blur-sm border border-white/50 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 border-b border-white/50">
            <CardTitle className="text-2xl flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                How to Use
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-start gap-2">
                <span className="font-semibold text-blue-600">1.</span>
                <span>
                  Choose your preferred aspect ratio (16:9 for landscape, 9:16 for vertical/mobile, 4:3 for classic, 1:1
                  for square)
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-blue-600">2.</span>
                <span>Use zoom controls to get closer to your subject or fit more in the frame</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-blue-600">3.</span>
                <span>Toggle mirror mode to flip the video horizontally (useful for selfie-style recording)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-blue-600">4.</span>
                <span>
                  Apply visual effects like blur or pixelation for privacy or artistic purposes - choose to apply to
                  entire video or just a selected area
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-blue-600">5.</span>
                <span>Enable "Crop Mode" to select a specific area of the camera feed to record</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-blue-600">6.</span>
                <span>In crop mode, drag the orange rectangle to move it, or drag the corners to resize</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-blue-600">7.</span>
                <span>
                  When using effects, toggle "Apply to: Selected Area" to blur or pixelate only a specific region
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-blue-600">8.</span>
                <span>Click "Take Screenshot" to capture still images (cropped if crop mode is active)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-blue-600">9.</span>
                <span>
                  Click on screenshots in the gallery to view them in full size with navigation and download options
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-blue-600">10.</span>
                <span>Click "Start Recording" to begin capturing video with your selected settings</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-blue-600">11.</span>
                <span>Choose your export format (MP4, AVI, MOV, 3GP for WhatsApp compatibility)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-blue-600">12.</span>
                <span>Use the playback controls to preview your recording</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-blue-600">13.</span>
                <span>Click "Edit Video" to trim your recording by setting start and end points</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-blue-600">14.</span>
                <span>Download your video in your chosen format</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-blue-600">15.</span>
                <span>Use the "Video Effects Editor" to upload existing videos and apply effects with live preview</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-blue-600">16.</span>
                <span>In the effects editor, configure blur/pixelate intensity and choose area or full video application</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-blue-600">17.</span>
                <span>Process and download your effect-enhanced video</span>
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-3 text-lg">
                <div className="p-2 bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                Keyboard Shortcuts
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center justify-between bg-gradient-to-r from-gray-50/80 to-blue-50/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/50 shadow-sm">
                  <span className="font-medium text-gray-700">Toggle Crop Mode</span>
                  <kbd className="px-3 py-1 bg-gradient-to-r from-white to-gray-50 border border-gray-300 rounded-lg text-xs font-mono shadow-sm">C</kbd>
                </div>
                <div className="flex items-center justify-between bg-gradient-to-r from-gray-50/80 to-blue-50/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/50 shadow-sm">
                  <span className="font-medium text-gray-700">Take Screenshot</span>
                  <kbd className="px-3 py-1 bg-gradient-to-r from-white to-gray-50 border border-gray-300 rounded-lg text-xs font-mono shadow-sm">S</kbd>
                </div>
                <div className="flex items-center justify-between bg-gradient-to-r from-gray-50/80 to-blue-50/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/50 shadow-sm">
                  <span className="font-medium text-gray-700">Start/Stop Recording</span>
                  <div className="flex gap-2">
                    <kbd className="px-3 py-1 bg-gradient-to-r from-white to-gray-50 border border-gray-300 rounded-lg text-xs font-mono shadow-sm">R</kbd>
                    <span className="text-gray-400 text-xs">or</span>
                    <kbd className="px-3 py-1 bg-gradient-to-r from-white to-gray-50 border border-gray-300 rounded-lg text-xs font-mono shadow-sm">Space</kbd>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-gradient-to-r from-gray-50/80 to-blue-50/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/50 shadow-sm">
                  <span className="font-medium text-gray-700">Toggle Fullscreen</span>
                  <kbd className="px-3 py-1 bg-gradient-to-r from-white to-gray-50 border border-gray-300 rounded-lg text-xs font-mono shadow-sm">F</kbd>
                </div>
                <div className="flex items-center justify-between bg-gradient-to-r from-gray-50/80 to-blue-50/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/50 shadow-sm">
                  <span className="font-medium text-gray-700">Zoom In</span>
                  <kbd className="px-3 py-1 bg-gradient-to-r from-white to-gray-50 border border-gray-300 rounded-lg text-xs font-mono shadow-sm">+</kbd>
                </div>
                <div className="flex items-center justify-between bg-gradient-to-r from-gray-50/80 to-blue-50/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/50 shadow-sm">
                  <span className="font-medium text-gray-700">Zoom Out</span>
                  <kbd className="px-3 py-1 bg-gradient-to-r from-white to-gray-50 border border-gray-300 rounded-lg text-xs font-mono shadow-sm">-</kbd>
                </div>
                <div className="flex items-center justify-between bg-gradient-to-r from-gray-50/80 to-blue-50/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/50 shadow-sm">
                  <span className="font-medium text-gray-700">Reset Zoom</span>
                  <kbd className="px-3 py-1 bg-gradient-to-r from-white to-gray-50 border border-gray-300 rounded-lg text-xs font-mono shadow-sm">0</kbd>
                </div>
                <div className="flex items-center justify-between bg-gradient-to-r from-gray-50/80 to-blue-50/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/50 shadow-sm">
                  <span className="font-medium text-gray-700">Toggle Mirror</span>
                  <kbd className="px-3 py-1 bg-gradient-to-r from-white to-gray-50 border border-gray-300 rounded-lg text-xs font-mono shadow-sm">M</kbd>
                </div>
                <div className="flex items-center justify-between bg-gradient-to-r from-gray-50/80 to-blue-50/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/50 shadow-sm">
                  <span className="font-medium text-gray-700">Exit Modes/Fullscreen</span>
                  <kbd className="px-3 py-1 bg-gradient-to-r from-white to-gray-50 border border-gray-300 rounded-lg text-xs font-mono shadow-sm">Esc</kbd>
                </div>
                <div className="flex items-center justify-between bg-gradient-to-r from-gray-50/80 to-blue-50/80 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/50 shadow-sm">
                  <span className="font-medium text-gray-700">Navigate Screenshots</span>
                  <div className="flex gap-2">
                    <kbd className="px-3 py-1 bg-gradient-to-r from-white to-gray-50 border border-gray-300 rounded-lg text-xs font-mono shadow-sm">←</kbd>
                    <kbd className="px-3 py-1 bg-gradient-to-r from-white to-gray-50 border border-gray-300 rounded-lg text-xs font-mono shadow-sm">→</kbd>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-xs">
                <p className="text-gray-600 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-200">💡 Shortcuts work when not typing in input fields</p>
                <p className="text-gray-600 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3 border border-purple-200">🖱️ When zoomed in, drag to pan the video</p>
                <p className="text-gray-600 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-3 border border-violet-200">🎨 Purple area shows where effects will be applied</p>
              </div>
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="editor" className="space-y-6">
            <VideoEffectsEditor
              videoEffect={videoEffect}
              setVideoEffect={setVideoEffect}
              effectIntensity={effectIntensity}
              setEffectIntensity={setEffectIntensity}
              isEffectCropMode={isEffectCropMode}
              setIsEffectCropMode={setIsEffectCropMode}
              effectCropArea={effectCropArea}
              handleEffectCropMouseDown={handleEffectCropMouseDown}
              applyManualBlur={applyManualBlur}
              downloadBlob={downloadBlob}
            />
          </TabsContent>

          <TabsContent value="presentation" className="h-screen flex flex-col">
            {/* Main Presentation Interface - Full Height */}
            <div className="flex flex-1 overflow-hidden">
              {/* Interactive Whiteboard Area */}
              <div className="flex-1 relative">
                {/* Toolbar */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
                  <div className="flex items-center gap-3 bg-white rounded-full shadow-lg px-4 py-2 border">
                    <Button size="sm" variant="ghost" className="rounded-full p-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                      </svg>
                    </Button>
                    <div className="w-px h-6 bg-gray-200"></div>
                    <Button size="sm" variant="ghost" className="rounded-full p-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </Button>
                    <Button size="sm" variant="ghost" className="rounded-full p-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </Button>
                    <Button size="sm" variant="ghost" className="rounded-full p-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m3 0H4a1 1 0 00-1 1v16a1 1 0 001 1h16a1 1 0 001-1V5a1 1 0 00-1-1z" />
                      </svg>
                    </Button>
                    <Button size="sm" variant="ghost" className="rounded-full p-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </Button>
                    <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white rounded-full px-4">
                      + Add Note
                    </Button>
                  </div>
                </div>

                {/* Whiteboard Canvas */}
                <div className="w-full h-full bg-gray-50 relative overflow-hidden">
                  {/* Grid Pattern */}
                  <div 
                    className="absolute inset-0 opacity-30"
                    style={{
                      backgroundImage: `
                        linear-gradient(rgba(0,0,0,.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0,0,0,.1) 1px, transparent 1px)
                      `,
                      backgroundSize: '20px 20px'
                    }}
                  ></div>

                  {/* Sticky Notes */}
                  {/* Yellow Idea Note */}
                  <div className="absolute top-32 left-32 w-48 h-32 bg-yellow-200 border border-yellow-300 rounded-lg p-3 shadow-md cursor-move hover:shadow-lg transition-shadow">
                    <div className="text-xs font-semibold text-yellow-800 mb-1">Idea</div>
                    <div className="text-sm text-yellow-900 leading-tight">
                      Launch campaign for Q3. Target early adopters!
                    </div>
                    <div className="absolute bottom-2 left-3 text-xs text-yellow-600 flex items-center gap-1">
                      <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                      Sam
                    </div>
                  </div>

                  {/* Pink Feedback Note */}
                  <div className="absolute top-48 left-80 w-44 h-28 bg-pink-200 border border-pink-300 rounded-lg p-3 shadow-md cursor-move hover:shadow-lg transition-shadow">
                    <div className="text-xs font-semibold text-pink-800 mb-1">Feedback</div>
                    <div className="text-sm text-pink-900 leading-tight">
                      Improve mobile responsiveness
                    </div>
                    <div className="absolute bottom-2 left-3 text-xs text-pink-600 flex items-center gap-1">
                      <div className="w-4 h-4 bg-pink-400 rounded-full"></div>
                      Lucy
                    </div>
                  </div>

                  {/* Blue Research Note */}
                  <div className="absolute top-20 left-96 w-52 h-36 bg-blue-200 border border-blue-300 rounded-lg p-3 shadow-md cursor-move hover:shadow-lg transition-shadow">
                    <div className="text-xs font-semibold text-blue-800 mb-1">Research</div>
                    <div className="text-sm text-blue-900 leading-tight">
                      Look into competitors' onboarding flows for inspiration.
                    </div>
                    <div className="absolute bottom-2 left-3 text-xs text-blue-600 flex items-center gap-1">
                      <div className="w-4 h-4 bg-blue-400 rounded-full"></div>
                      Alex
                    </div>
                  </div>

                  {/* Green To-do Note */}
                  <div className="absolute top-64 left-48 w-48 h-40 bg-green-200 border border-green-300 rounded-lg p-3 shadow-md cursor-move hover:shadow-lg transition-shadow">
                    <div className="text-xs font-semibold text-green-800 mb-1">To-do</div>
                    <div className="text-sm text-green-900 leading-tight">
                      • Finalize slides<br/>
                      • Review with marketing<br/>
                      • Email team by EOD
                    </div>
                    <div className="absolute bottom-2 left-3 text-xs text-green-600 flex items-center gap-1">
                      <div className="w-4 h-4 bg-green-400 rounded-full"></div>
                      Mike
                    </div>
                  </div>

                  {/* Orange Blocker Note */}
                  <div className="absolute top-32 right-80 w-44 h-32 bg-orange-200 border border-orange-300 rounded-lg p-3 shadow-md cursor-move hover:shadow-lg transition-shadow">
                    <div className="text-xs font-semibold text-orange-800 mb-1">Blocker</div>
                    <div className="text-sm text-orange-900 leading-tight">
                      API quota reached. Need an upgrade.
                    </div>
                    <div className="absolute bottom-2 left-3 text-xs text-orange-600 flex items-center gap-1">
                      <div className="w-4 h-4 bg-orange-400 rounded-full"></div>
                      Jen
                    </div>
                  </div>

                  {/* Presenter Video - Hexagonal Frame in Bottom Right */}
                  <div className="absolute bottom-8 right-8 z-10">
                    <div className="relative w-32 h-32">
                      {/* Hexagonal Clip Path */}
                      <div 
                        className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center"
                        style={{
                          clipPath: 'polygon(25% 6.7%, 75% 6.7%, 100% 50%, 75% 93.3%, 25% 93.3%, 0% 50%)'
                        }}
                      >
                        {/* Placeholder presenter - this would be the actual video stream */}
                        <div className="w-28 h-28 bg-gray-200 rounded-full flex items-center justify-center text-gray-500"
                             style={{
                               clipPath: 'polygon(25% 6.7%, 75% 6.7%, 100% 50%, 75% 93.3%, 25% 93.3%, 0% 50%)'
                             }}>
                          <Camera className="w-8 h-8" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Sidebar - Tools Panel */}
              <div className="w-80 bg-gray-900 text-white p-4 space-y-6 overflow-y-auto">
                {/* Presenter Header */}
                <div className="text-center">
                  <h2 className="text-lg font-semibold">Presenter</h2>
                  <div className="flex justify-center gap-2 mt-2">
                    <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white p-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </Button>
                    <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white p-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </Button>
                  </div>
                </div>

                {/* Real Background */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Real background</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-gray-800 border border-gray-600">
                      <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                      <span className="text-xs">Visible</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-800 cursor-pointer">
                      <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                      <span className="text-xs text-gray-400">Blurred</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 p-3 rounded-lg hover:bg-gray-800 cursor-pointer">
                      <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      </div>
                      <span className="text-xs text-gray-400">Hidden</span>
                    </div>
                  </div>
                </div>

                {/* Shape */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Shape</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="ghost" className="h-12 w-full border border-gray-600 hover:bg-gray-800">
                      <div className="w-6 h-4 border border-current rounded-sm"></div>
                    </Button>
                    <Button variant="ghost" className="h-12 w-full border border-gray-600 hover:bg-gray-800">
                      <div className="w-5 h-5 border border-current rounded-full"></div>
                    </Button>
                    <Button variant="ghost" className="h-12 w-full border border-gray-600 hover:bg-gray-800">
                      <div 
                        className="w-6 h-6 border border-current"
                        style={{
                          clipPath: 'polygon(25% 6.7%, 75% 6.7%, 100% 50%, 75% 93.3%, 25% 93.3%, 0% 50%)'
                        }}
                      ></div>
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <Button variant="ghost" className="h-12 w-full text-gray-400 hover:text-white">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                    <Button variant="ghost" className="h-12 w-full bg-red-500 hover:bg-red-600 text-white">
                      <div className="w-5 h-5 bg-white rounded"></div>
                    </Button>
                    <Button variant="ghost" className="h-12 w-full bg-blue-500 hover:bg-blue-600 text-white">
                      <div className="w-5 h-5 bg-white rounded"></div>
                    </Button>
                    <Button variant="ghost" className="h-12 w-full bg-green-500 hover:bg-green-600 text-white">
                      <div className="w-5 h-5 bg-white rounded"></div>
                    </Button>
                    <Button variant="ghost" className="h-12 w-full bg-blue-600 hover:bg-blue-700 text-white">
                      <div className="w-5 h-5 bg-white rounded"></div>
                    </Button>
                    <Button variant="ghost" className="h-12 w-full bg-purple-500 hover:bg-purple-600 text-white">
                      <div className="w-5 h-5 bg-white rounded"></div>
                    </Button>
                    <Button variant="ghost" className="h-12 w-full bg-black hover:bg-gray-800 text-white border border-gray-600">
                      <div className="w-5 h-5 bg-white rounded"></div>
                    </Button>
                  </div>
                </div>

                {/* Virtual Background */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Virtual background</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="aspect-video bg-gray-700 border-2 border-gray-500 rounded cursor-pointer hover:border-gray-400"></div>
                    <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 rounded cursor-pointer hover:opacity-80"></div>
                    <div className="aspect-video bg-gradient-to-br from-purple-500 to-pink-500 rounded cursor-pointer hover:opacity-80"></div>
                    <div className="aspect-video bg-gradient-to-br from-orange-400 to-pink-400 rounded cursor-pointer hover:opacity-80"></div>
                    <div className="aspect-video bg-gradient-to-br from-red-500 to-orange-500 rounded cursor-pointer hover:opacity-80"></div>
                    <div className="aspect-video bg-gradient-to-br from-yellow-400 to-orange-500 rounded cursor-pointer hover:opacity-80"></div>
                  </div>
                  <Button variant="ghost" className="w-full mt-2 text-gray-400 hover:text-white">
                    See all
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
      )
  }
