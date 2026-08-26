/** Orchestrates camera, screenshot, crop, PIP, and export for the live studio.
 *  Still oversized — extract the next feature into hooks/ or lib/, do not add more here. */
import { useState, useRef, useEffect, useCallback } from "react"
import JSZip from "jszip"
import {
  blobToDataUrl,
  clearStoredScreenshots,
  loadScreenshots,
  saveScreenshots,
} from "@/lib/screenshot-storage"
import {
  applyManualBlur,
  checkVideoSupport,
  downloadBlob,
} from "@/lib/utils/video"
import { computeVideoDisplayArea } from "@/lib/video-display-area"
import { useStudioZoom } from "@/hooks/useStudioZoom"
import type {
  AspectRatio,
  CropArea,
  ExportFormat,
  PipPosition,
  RecordingMode,
  RecordingState,
  ScreenshotFormat,
  VideoEffect,
} from "@/types/camera"

export function useStudioSession() {
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
  const [thumbnails, setThumbnails] = useState<
    Array<{ time: number; url: string }>
  >([])
  const [isGeneratingThumbnails, setIsGeneratingThumbnails] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportFormat>("webm")
  const [webCodecsSupported, setWebCodecsSupported] = useState(false)
  const [mp4RecordingSupported, setMp4RecordingSupported] = useState(false)
  const [screenshotFormat, setScreenshotFormat] =
    useState<ScreenshotFormat>("png")
  const [screenshots, setScreenshots] = useState<
    Array<{ id: string; url: string; timestamp: Date }>
  >([])
  const [showFlash, setShowFlash] = useState(false)
  const [screenshotCount, setScreenshotCount] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isHDScreenshot, setIsHDScreenshot] = useState(false)

  // Add mounted state to prevent hydration errors
  const [isMounted, setIsMounted] = useState(false)

  // Timer functionality for screenshots
  const [screenshotTimer, setScreenshotTimer] = useState<number>(0) // 0 = no timer
  const [isTimerActive, setIsTimerActive] = useState(false)
  const [timerCountdown, setTimerCountdown] = useState<number>(0)
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false)

  // Crop functionality
  const [isCropMode, setIsCropMode] = useState(false)
  const [cropArea, setCropArea] = useState<CropArea>({
    x: 0.1,
    y: 0.1,
    width: 0.8,
    height: 0.8,
  })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeHandle, setResizeHandle] = useState<string>("")
  const [, setVideoContainerSize] = useState({ width: 0, height: 0 })

  // Aspect ratio functionality
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9")

  // Effect functionality
  const [videoEffect, setVideoEffect] = useState<VideoEffect>("none")
  const [effectIntensity, setEffectIntensity] = useState(5) // 1-10 scale

  // Effect crop functionality
  const [isEffectCropMode, setIsEffectCropMode] = useState(false)
  const [effectCropArea, setEffectCropArea] = useState<CropArea>({
    x: 0.2,
    y: 0.2,
    width: 0.6,
    height: 0.6,
  })
  const [isEffectDragging, setIsEffectDragging] = useState(false)
  const [isEffectResizing, setIsEffectResizing] = useState(false)
  const [effectDragStart, setEffectDragStart] = useState({ x: 0, y: 0 })
  const [effectResizeHandle, setEffectResizeHandle] = useState<string>("")

  const {
    zoomLevel,
    panOffset,
    isPanning,
    isMirrored,
    setIsMirrored,
    zoomIn,
    zoomOut,
    resetZoom,
    toggleMirror,
    handlePanStart,
  } = useStudioZoom(!isCropMode && !isEffectCropMode)

  // Modal functionality for screenshot viewing
  const [isScreenshotModalOpen, setIsScreenshotModalOpen] = useState(false)
  const [selectedScreenshotIndex, setSelectedScreenshotIndex] = useState(0)

  // Light mode functionality
  const [isLightMode, setIsLightMode] = useState(false)
  const [lightIntensity, setLightIntensity] = useState(100) // 0-100 percentage

  // Picture-in-Picture functionality
  const [recordingMode, setRecordingMode] = useState<RecordingMode>("webcam")
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
  const [pipPosition, setPipPosition] = useState<PipPosition>({
    x: 80,
    y: 20,
    width: 25,
    height: 25,
  })
  const [screenError, setScreenError] = useState<string | null>(null)
  const [isPipDragging, setIsPipDragging] = useState(false)
  const [isPipResizing, setIsPipResizing] = useState(false)
  const [pipDragStart, setPipDragStart] = useState({ x: 0, y: 0 })

  // Tab management

  const videoContainerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const screenshotCanvasRef = useRef<HTMLCanvasElement>(null)
  const cropCanvasRef = useRef<HTMLCanvasElement>(null)
  const effectCanvasRef = useRef<HTMLCanvasElement>(null)
  const previewEffectCanvasRef = useRef<HTMLCanvasElement>(null)
  const pipCanvasRef = useRef<HTMLCanvasElement>(null)
  const screenVideoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const croppedStreamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const previewEffectAnimationRef = useRef<number | null>(null)
  const pipAnimationRef = useRef<number | null>(null)
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
        containerHeight: 0,
      }
    }

    const video = videoRef.current
    const container = videoContainerRef.current
    const containerRect = isFullscreen
      ? video.getBoundingClientRect()
      : container.getBoundingClientRect()

    return computeVideoDisplayArea({
      videoWidth: video.videoWidth || 1280,
      videoHeight: video.videoHeight || 720,
      containerWidth: containerRect.width,
      containerHeight: containerRect.height,
    })
  }, [isFullscreen])

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
      mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm",
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
        } else if (
          MediaRecorder.isTypeSupported("video/mp4;codecs=avc1.42E01E")
        ) {
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
        (duration + 10) * 1000
      )
    })
  }, [recordedBlob, trimStart, trimEnd, exportFormat])

  // Download original video as fallback
  const downloadOriginalVideo = useCallback(() => {
    if (!recordedBlob) return

    // Use the selected export format for the filename, even if the actual format is different
    downloadBlob(
      recordedBlob,
      `original-video-${Date.now()}.${exportFormat}`,
      exportFormat
    )
    setRecordingState("stopped")
  }, [recordedBlob, exportFormat])

  // Process and download video with format selection
  const downloadTrimmedVideo = useCallback(async () => {
    if (!recordedBlob || !videoRef.current) return

    // If no trimming is needed, download original video
    if (
      Math.abs(trimStart - 0) < 0.1 &&
      Math.abs(trimEnd - videoDuration) < 0.1
    ) {
      downloadBlob(
        recordedBlob,
        `recorded-video-${Date.now()}.${exportFormat}`,
        exportFormat
      )
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

      downloadBlob(
        processedBlob,
        `trimmed-video-${Date.now()}.${exportFormat}`,
        exportFormat
      )
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
  ])

  // Check WebCodecs and MP4 support
  useEffect(() => {
    const checkSupport = () => {
      const support = checkVideoSupport()
      setWebCodecsSupported(support.webCodecsSupported)
      setMp4RecordingSupported(support.mp4RecordingSupported)

      if (support.mp4RecordingSupported || support.webCodecsSupported) {
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
            aspectRatio: 9 / 16,
          } // Vertical
          break
        case "4:3":
          videoConstraints = {
            width: { ideal: 960, min: 640, max: 1440 },
            height: { ideal: 720, min: 480, max: 1080 },
            aspectRatio: 4 / 3,
          } // Classic
          break
        case "1:1":
          videoConstraints = {
            width: { ideal: 720, min: 480, max: 1080 },
            height: { ideal: 720, min: 480, max: 1080 },
            aspectRatio: 1,
          } // Square
          break
        case "16:9":
        default:
          videoConstraints = {
            width: { ideal: 1280, min: 854, max: 1920 },
            height: { ideal: 720, min: 480, max: 1080 },
            aspectRatio: 16 / 9,
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
              aspectRatio:
                (videoRef.current?.videoWidth || 0) /
                (videoRef.current?.videoHeight || 1),
            },
            containerExpected:
              aspectRatio === "9:16"
                ? 9 / 16
                : aspectRatio === "4:3"
                  ? 4 / 3
                  : aspectRatio === "1:1"
                    ? 1
                    : 16 / 9,
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
    if (
      !cropCanvasRef.current ||
      !videoRef.current ||
      !streamRef.current ||
      !videoContainerRef.current
    )
      return null

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
    const videoCropStartX =
      (cropStartX - videoOffsetX) * (videoWidth / displayedVideoWidth)
    const videoCropStartY =
      (cropStartY - videoOffsetY) * (videoHeight / displayedVideoHeight)
    const videoCropWidth = cropWidth * (videoWidth / displayedVideoWidth)
    const videoCropHeight = cropHeight * (videoHeight / displayedVideoHeight)

    // Clamp to video bounds
    const clampedX = Math.max(0, Math.min(videoCropStartX, videoWidth))
    const clampedY = Math.max(0, Math.min(videoCropStartY, videoHeight))
    const clampedWidth = Math.max(
      1,
      Math.min(videoCropWidth, videoWidth - clampedX)
    )
    const clampedHeight = Math.max(
      1,
      Math.min(videoCropHeight, videoHeight - clampedY)
    )

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
          clampedHeight // Destination rectangle on canvas (flipped)
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
          clampedHeight // Destination rectangle on canvas
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

  // Shared function to calculate effect area coordinates in video space
  const calculateEffectAreaInVideoSpace = useCallback(
    (canvasWidth: number, canvasHeight: number) => {
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
      const videoEffectStartX =
        (effectStartX - videoArea.videoOffsetX) *
        (videoWidth / videoArea.displayedVideoWidth)
      const videoEffectStartY =
        (effectStartY - videoArea.videoOffsetY) *
        (videoHeight / videoArea.displayedVideoHeight)
      const videoEffectWidth =
        effectWidth * (videoWidth / videoArea.displayedVideoWidth)
      const videoEffectHeight =
        effectHeight * (videoHeight / videoArea.displayedVideoHeight)

      // For screenshots, we need to scale to canvas dimensions if different from video dimensions
      const scaleX = canvasWidth / videoWidth
      const scaleY = canvasHeight / videoHeight

      const clampedX = Math.max(
        0,
        Math.min(videoEffectStartX * scaleX, canvasWidth)
      )
      const clampedY = Math.max(
        0,
        Math.min(videoEffectStartY * scaleY, canvasHeight)
      )
      const clampedWidth = Math.max(
        1,
        Math.min(videoEffectWidth * scaleX, canvasWidth - clampedX)
      )
      const clampedHeight = Math.max(
        1,
        Math.min(videoEffectHeight * scaleY, canvasHeight - clampedY)
      )

      return {
        x: clampedX,
        y: clampedY,
        width: clampedWidth,
        height: clampedHeight,
      }
    },
    [effectCropArea, getVideoDisplayArea]
  )

  // Create real-time effect preview overlay
  const updateEffectPreview = useCallback(() => {
    if (
      !previewEffectCanvasRef.current ||
      !videoRef.current ||
      !videoContainerRef.current
    )
      return

    const canvas = previewEffectCanvasRef.current
    const video = videoRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Only show effect preview in effect crop mode and when idle to reduce performance impact
    if (
      !isEffectCropMode ||
      videoEffect === ("none" as VideoEffect) ||
      recordingState !== "idle"
    ) {
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

    // Effect crop mode - apply effect to selected area only
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

    const videoEffectStartX =
      (effectStartX - videoArea.videoOffsetX) *
      (videoWidth / videoArea.displayedVideoWidth)
    const videoEffectStartY =
      (effectStartY - videoArea.videoOffsetY) *
      (videoHeight / videoArea.displayedVideoHeight)
    const videoEffectWidth =
      effectWidth * (videoWidth / videoArea.displayedVideoWidth)
    const videoEffectHeight =
      effectHeight * (videoHeight / videoArea.displayedVideoHeight)

    // Clamp to video bounds
    const clampedX = Math.max(0, Math.min(videoEffectStartX, videoWidth))
    const clampedY = Math.max(0, Math.min(videoEffectStartY, videoHeight))
    const clampedWidth = Math.max(
      1,
      Math.min(videoEffectWidth, videoWidth - clampedX)
    )
    const clampedHeight = Math.max(
      1,
      Math.min(videoEffectHeight, videoHeight - clampedY)
    )

    // Draw the video section to the temporary canvas
    if (isMirrored) {
      tempCtx.save()
      tempCtx.scale(-1, 1)
      tempCtx.drawImage(
        video,
        clampedX,
        clampedY,
        clampedWidth,
        clampedHeight,
        -effectWidth,
        0,
        effectWidth,
        effectHeight
      )
      tempCtx.restore()
    } else {
      tempCtx.drawImage(
        video,
        clampedX,
        clampedY,
        clampedWidth,
        clampedHeight,
        0,
        0,
        effectWidth,
        effectHeight
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
        const blurredData = applyManualBlur(
          imageData,
          Math.ceil(blurAmount / 2)
        )
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
      pixelCtx.drawImage(
        tempCanvas,
        0,
        0,
        effectWidth,
        effectHeight,
        0,
        0,
        scaledWidth,
        scaledHeight
      )

      // Clear the temp canvas and draw the pixelated version back at full size
      tempCtx.clearRect(0, 0, effectWidth, effectHeight)
      tempCtx.drawImage(
        pixelCanvas,
        0,
        0,
        scaledWidth,
        scaledHeight,
        0,
        0,
        effectWidth,
        effectHeight
      )
    }

    // Draw the processed area to the main canvas
    ctx.drawImage(
      tempCanvas,
      0,
      0,
      effectWidth,
      effectHeight,
      effectStartX,
      effectStartY,
      effectWidth,
      effectHeight
    )

    // Continue animation with reduced frame rate for better performance
    if (
      isEffectCropMode &&
      videoEffect !== ("none" as VideoEffect) &&
      recordingState === "idle"
    ) {
      // Limit to ~15 FPS for preview to reduce CPU usage
      setTimeout(() => {
        previewEffectAnimationRef.current =
          requestAnimationFrame(updateEffectPreview)
      }, 67) // ~15 FPS (1000ms / 15 ≈ 67ms)
    }
  }, [
    isEffectCropMode,
    videoEffect,
    effectIntensity,
    effectCropArea,
    isMirrored,
    recordingState,
    applyManualBlur,
  ])

  // Start/stop effect preview animation
  useEffect(() => {
    if (
      isEffectCropMode &&
      videoEffect !== ("none" as VideoEffect) &&
      recordingState === "idle"
    ) {
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
  }, [
    isEffectCropMode,
    videoEffect,
    effectIntensity,
    recordingState,
    updateEffectPreview,
  ])

  // Create effect stream with blur or pixelation (with optional crop area)
  const createEffectStream = useCallback(() => {
    if (!effectCanvasRef.current || !videoRef.current || !streamRef.current)
      return null

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
        const effectArea = calculateEffectAreaInVideoSpace(
          canvas.width,
          canvas.height
        )
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
        const imageData = ctx.getImageData(
          clampedX,
          clampedY,
          clampedWidth,
          clampedHeight
        )
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
          const scaledHeight = Math.max(
            1,
            Math.floor(clampedHeight / pixelSize)
          )

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
          pixelCtx.drawImage(
            tempCanvas,
            0,
            0,
            clampedWidth,
            clampedHeight,
            0,
            0,
            scaledWidth,
            scaledHeight
          )

          // Clear the temp canvas and draw the pixelated version back at full size
          tempCtx.clearRect(0, 0, clampedWidth, clampedHeight)
          tempCtx.drawImage(
            pixelCanvas,
            0,
            0,
            scaledWidth,
            scaledHeight,
            0,
            0,
            clampedWidth,
            clampedHeight
          )
        }

        // Draw the affected area back to the main canvas
        ctx.drawImage(
          tempCanvas,
          0,
          0,
          clampedWidth,
          clampedHeight,
          clampedX,
          clampedY,
          clampedWidth,
          clampedHeight
        )
      } else if (videoEffect !== ("none" as VideoEffect) && !isEffectCropMode) {
        // Apply effect to entire video - need to redraw the video with effect
        ctx.clearRect(0, 0, canvas.width, canvas.height)

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

          // Reset filter for future draws
          ctx.filter = "none"
        } else if (videoEffect === "pixelate") {
          const pixelSize = Math.max(1, effectIntensity * 3)
          const scaledWidth = Math.max(1, Math.floor(canvas.width / pixelSize))
          const scaledHeight = Math.max(
            1,
            Math.floor(canvas.height / pixelSize)
          )

          // Create a temporary smaller canvas for pixelation
          const pixelCanvas = document.createElement("canvas")
          const pixelCtx = pixelCanvas.getContext("2d")
          if (!pixelCtx) return

          pixelCanvas.width = scaledWidth
          pixelCanvas.height = scaledHeight
          pixelCtx.imageSmoothingEnabled = false

          // Draw video to small canvas
          if (isMirrored) {
            pixelCtx.save()
            pixelCtx.scale(-1, 1)
            pixelCtx.drawImage(
              video,
              -scaledWidth,
              0,
              scaledWidth,
              scaledHeight
            )
            pixelCtx.restore()
          } else {
            pixelCtx.drawImage(video, 0, 0, scaledWidth, scaledHeight)
          }

          // Draw the small canvas back to main canvas at full size for pixelated effect
          ctx.imageSmoothingEnabled = false
          ctx.drawImage(
            pixelCanvas,
            0,
            0,
            scaledWidth,
            scaledHeight,
            0,
            0,
            canvas.width,
            canvas.height
          )
          ctx.imageSmoothingEnabled = true
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
  }, [
    videoEffect,
    effectIntensity,
    isMirrored,
    isEffectCropMode,
    effectCropArea,
    isFullscreen,
    calculateEffectAreaInVideoSpace,
  ])

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

  // Light mode controls (ring light around camera — fullscreen only)
  const toggleLightMode = useCallback(() => {
    setIsLightMode((prev) => !prev)
  }, [])

  const adjustLightIntensity = useCallback((intensity: number) => {
    setLightIntensity(Math.max(10, Math.min(100, intensity)))
  }, [])

  // Screen capture functionality
  const startScreenCapture = useCallback(async () => {
    try {
      setScreenError(null)
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: true,
      })

      setScreenStream(displayStream)

      if (screenVideoRef.current) {
        screenVideoRef.current.srcObject = displayStream
      }

      // Handle stream end (user stops sharing)
      displayStream.getVideoTracks()[0].onended = () => {
        setScreenStream(null)
        setRecordingMode("webcam")
        setScreenError("Screen sharing stopped")
      }
    } catch (error) {
      console.error("Error starting screen capture:", error)
      setScreenError(
        "Unable to start screen capture. Please check permissions."
      )
      setRecordingMode("webcam")
    }
  }, [])

  const stopScreenCapture = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop())
      setScreenStream(null)
    }
    setScreenError(null)
  }, [screenStream])

  // PIP Canvas composition
  const updatePipCanvas = useCallback(() => {
    if (
      !pipCanvasRef.current ||
      !screenVideoRef.current ||
      !videoRef.current ||
      recordingMode !== "pip"
    )
      return

    const canvas = pipCanvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const screenVideo = screenVideoRef.current
    const webcamVideo = videoRef.current

    // Set canvas size to screen video size
    const screenWidth = screenVideo.videoWidth || 1920
    const screenHeight = screenVideo.videoHeight || 1080
    canvas.width = screenWidth
    canvas.height = screenHeight

    // Clear canvas
    ctx.clearRect(0, 0, screenWidth, screenHeight)

    // Draw screen capture (background)
    ctx.drawImage(screenVideo, 0, 0, screenWidth, screenHeight)

    // Calculate webcam overlay position and size (centered positioning)
    const pipW = (pipPosition.width / 100) * screenWidth
    const pipH = (pipPosition.height / 100) * screenHeight
    const pipX = (pipPosition.x / 100) * screenWidth - pipW / 2
    const pipY = (pipPosition.y / 100) * screenHeight - pipH / 2

    // Draw webcam overlay with rounded corners and border
    ctx.save()

    // Create rounded rectangle path
    const radius = 8
    ctx.beginPath()
    ctx.roundRect(pipX, pipY, pipW, pipH, radius)
    ctx.clip()

    // Draw webcam video (mirrored if enabled)
    if (isMirrored) {
      ctx.save()
      ctx.scale(-1, 1)
      ctx.drawImage(webcamVideo, -(pipX + pipW), pipY, pipW, pipH)
      ctx.restore()
    } else {
      ctx.drawImage(webcamVideo, pipX, pipY, pipW, pipH)
    }

    ctx.restore()

    // Draw border around webcam
    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.roundRect(pipX, pipY, pipW, pipH, radius)
    ctx.stroke()

    // Continue animation
    if (recordingMode === "pip") {
      pipAnimationRef.current = requestAnimationFrame(updatePipCanvas)
    }
  }, [recordingMode, pipPosition, isMirrored])

  // Start/stop PIP canvas animation
  useEffect(() => {
    if (recordingMode === "pip" && screenStream && streamRef.current) {
      updatePipCanvas()
    } else if (pipAnimationRef.current) {
      cancelAnimationFrame(pipAnimationRef.current)
      pipAnimationRef.current = null
    }

    return () => {
      if (pipAnimationRef.current) {
        cancelAnimationFrame(pipAnimationRef.current)
        pipAnimationRef.current = null
      }
    }
  }, [recordingMode, screenStream, updatePipCanvas])

  // Create PIP stream
  const createPipStream = useCallback(() => {
    if (!pipCanvasRef.current || recordingMode !== "pip") return null

    const canvas = pipCanvasRef.current
    const canvasStream = canvas.captureStream(30)

    // Add audio from screen capture
    if (screenStream) {
      const audioTracks = screenStream.getAudioTracks()
      if (audioTracks.length > 0) {
        canvasStream.addTrack(audioTracks[0])
      }
    }

    return canvasStream
  }, [recordingMode, screenStream])

  // Recording mode controls
  const switchToWebcam = useCallback(() => {
    stopScreenCapture()
    setRecordingMode("webcam")
  }, [stopScreenCapture])

  const switchToScreen = useCallback(async () => {
    await startScreenCapture()
    if (screenStream) {
      setRecordingMode("screen")
    }
  }, [startScreenCapture, screenStream])

  const switchToPip = useCallback(async () => {
    if (!screenStream) {
      await startScreenCapture()
    }
    if (screenStream) {
      setRecordingMode("pip")
    }
  }, [screenStream, startScreenCapture])

  // PIP position controls
  const handlePipMouseDown = useCallback(
    (e: React.MouseEvent, action: "drag" | "resize") => {
      if (!videoContainerRef.current) return

      e.preventDefault()
      e.stopPropagation()

      const rect = videoContainerRef.current.getBoundingClientRect()
      const relativeX = ((e.clientX - rect.left) / rect.width) * 100
      const relativeY = ((e.clientY - rect.top) / rect.height) * 100

      setPipDragStart({ x: relativeX, y: relativeY })

      if (action === "drag") {
        setIsPipDragging(true)
      } else {
        setIsPipResizing(true)
      }
    },
    []
  )

  const handlePipMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!videoContainerRef.current || (!isPipDragging && !isPipResizing))
        return

      const rect = videoContainerRef.current.getBoundingClientRect()
      const relativeX = ((e.clientX - rect.left) / rect.width) * 100
      const relativeY = ((e.clientY - rect.top) / rect.height) * 100

      if (isPipDragging) {
        const deltaX = relativeX - pipDragStart.x
        const deltaY = relativeY - pipDragStart.y

        setPipPosition((prev) => {
          const halfWidth = prev.width / 2
          const halfHeight = prev.height / 2
          return {
            ...prev,
            x: Math.max(halfWidth, Math.min(100 - halfWidth, prev.x + deltaX)),
            y: Math.max(
              halfHeight,
              Math.min(100 - halfHeight, prev.y + deltaY)
            ),
          }
        })

        setPipDragStart({ x: relativeX, y: relativeY })
      } else if (isPipResizing) {
        setPipPosition((prev) => {
          const centerX = prev.x
          const centerY = prev.y

          // Calculate new size based on distance from center
          const newWidth = Math.max(
            15,
            Math.min(40, Math.abs(relativeX - centerX) * 2)
          )
          const newHeight = Math.max(
            15,
            Math.min(40, Math.abs(relativeY - centerY) * 2)
          )

          return {
            ...prev,
            width: newWidth,
            height: newHeight,
          }
        })
      }
    },
    [isPipDragging, isPipResizing, pipDragStart]
  )

  const handlePipMouseUp = useCallback(() => {
    setIsPipDragging(false)
    setIsPipResizing(false)
  }, [])

  // Add PIP mouse event listeners
  useEffect(() => {
    if (isPipDragging || isPipResizing) {
      document.addEventListener("mousemove", handlePipMouseMove)
      document.addEventListener("mouseup", handlePipMouseUp)
      return () => {
        document.removeEventListener("mousemove", handlePipMouseMove)
        document.removeEventListener("mouseup", handlePipMouseUp)
      }
    }
  }, [isPipDragging, isPipResizing, handlePipMouseMove, handlePipMouseUp])

  // Handle crop area mouse events
  const handleCropMouseDown = useCallback(
    (e: React.MouseEvent, handle?: string) => {
      if (!videoContainerRef.current || !videoRef.current) return

      e.preventDefault()
      e.stopPropagation()

      // Mouse handling uses video bounds when coordinate conversion is enabled
      // const rect = isFullscreen
      //   ? videoRef.current.getBoundingClientRect()
      //   : videoContainerRef.current.getBoundingClientRect()
      // const videoArea = getVideoDisplayArea()

      setDragStart({ x: e.clientX, y: e.clientY })

      if (handle) {
        setIsResizing(true)
        setResizeHandle(handle)
      } else {
        setIsDragging(true)
      }
    },
    [getVideoDisplayArea, isFullscreen]
  )

  // Handle effect crop area mouse events
  const handleEffectCropMouseDown = useCallback(
    (e: React.MouseEvent, handle?: string) => {
      if (!videoContainerRef.current || !videoRef.current) return

      e.preventDefault()
      e.stopPropagation()

      // Mouse handling uses video bounds when coordinate conversion is enabled
      // const rect = isFullscreen
      //   ? videoRef.current.getBoundingClientRect()
      //   : videoContainerRef.current.getBoundingClientRect()
      // const videoArea = getVideoDisplayArea()

      setEffectDragStart({ x: e.clientX, y: e.clientY })

      if (handle) {
        setIsEffectResizing(true)
        setEffectResizeHandle(handle)
      } else {
        setIsEffectDragging(true)
      }
    },
    [getVideoDisplayArea, isFullscreen]
  )

  const handleCropMouseMove = useCallback(
    (e: MouseEvent) => {
      if (
        !videoContainerRef.current ||
        !videoRef.current ||
        (!isDragging && !isResizing && !isEffectDragging && !isEffectResizing)
      )
        return

      // Use the correct element bounds based on fullscreen mode
      // const rect = isFullscreen
      //   ? videoRef.current.getBoundingClientRect()
      //   : videoContainerRef.current.getBoundingClientRect()
      const videoArea = getVideoDisplayArea()

      // Handle regular crop area
      if (isDragging || isResizing) {
        const deltaX = (e.clientX - dragStart.x) / videoArea.displayedVideoWidth
        const deltaY =
          (e.clientY - dragStart.y) / videoArea.displayedVideoHeight

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
                newArea.width = Math.max(
                  0.1,
                  Math.min(1 - prev.x, prev.width + deltaX)
                )
                newArea.height = Math.max(0.1, prev.height - deltaY)
                newArea.y = Math.max(0, prev.y + deltaY)
                break
              case "sw":
                newArea.width = Math.max(0.1, prev.width - deltaX)
                newArea.height = Math.max(
                  0.1,
                  Math.min(1 - prev.y, prev.height + deltaY)
                )
                newArea.x = Math.max(0, prev.x + deltaX)
                break
              case "se":
                newArea.width = Math.max(
                  0.1,
                  Math.min(1 - prev.x, prev.width + deltaX)
                )
                newArea.height = Math.max(
                  0.1,
                  Math.min(1 - prev.y, prev.height + deltaY)
                )
                break
            }

            return newArea
          })
        }

        setDragStart({ x: e.clientX, y: e.clientY })
      }

      // Handle effect crop area
      if (isEffectDragging || isEffectResizing) {
        const deltaX =
          (e.clientX - effectDragStart.x) / videoArea.displayedVideoWidth
        const deltaY =
          (e.clientY - effectDragStart.y) / videoArea.displayedVideoHeight

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
                newArea.width = Math.max(
                  0.1,
                  Math.min(1 - prev.x, prev.width + deltaX)
                )
                newArea.height = Math.max(0.1, prev.height - deltaY)
                newArea.y = Math.max(0, prev.y + deltaY)
                break
              case "sw":
                newArea.width = Math.max(0.1, prev.width - deltaX)
                newArea.height = Math.max(
                  0.1,
                  Math.min(1 - prev.y, prev.height + deltaY)
                )
                newArea.x = Math.max(0, prev.x + deltaX)
                break
              case "se":
                newArea.width = Math.max(
                  0.1,
                  Math.min(1 - prev.x, prev.width + deltaX)
                )
                newArea.height = Math.max(
                  0.1,
                  Math.min(1 - prev.y, prev.height + deltaY)
                )
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
    ]
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
    if (
      (isCropMode && (isDragging || isResizing)) ||
      (isEffectCropMode && (isEffectDragging || isEffectResizing))
    ) {
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
    [screenshots.length]
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
    [screenshots.length]
  )

  // Apply effects to screenshot canvas
  const applyEffectToScreenshot = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      canvas: HTMLCanvasElement,
      mode: "crop" | "full"
    ) => {
      if (!isEffectCropMode && mode === "full") {
        // Apply effect to entire screenshot when not in effect crop mode
        if (videoEffect === "blur") {
          const blurAmount = effectIntensity * 2
          try {
            ctx.filter = `blur(${blurAmount}px)`
            ctx.drawImage(canvas, 0, 0)
            ctx.filter = "none"
          } catch {
            // Fallback to manual blur
            const imageData = ctx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height
            )
            const blurredData = applyManualBlur(
              imageData,
              Math.ceil(blurAmount / 2)
            )
            ctx.putImageData(blurredData, 0, 0)
          }
        } else if (videoEffect === "pixelate") {
          const pixelSize = Math.max(2, effectIntensity * 4)
          const scaledWidth = Math.max(1, Math.floor(canvas.width / pixelSize))
          const scaledHeight = Math.max(
            1,
            Math.floor(canvas.height / pixelSize)
          )

          // Create a temporary canvas to hold the original image
          const originalCanvas = document.createElement("canvas")
          const originalCtx = originalCanvas.getContext("2d")
          if (!originalCtx) return

          originalCanvas.width = canvas.width
          originalCanvas.height = canvas.height
          originalCtx.drawImage(canvas, 0, 0)

          // Create pixelation canvas
          const pixelCanvas = document.createElement("canvas")
          const pixelCtx = pixelCanvas.getContext("2d")
          if (pixelCtx) {
            pixelCanvas.width = scaledWidth
            pixelCanvas.height = scaledHeight
            pixelCtx.imageSmoothingEnabled = false

            // Draw original to small canvas
            pixelCtx.drawImage(
              originalCanvas,
              0,
              0,
              canvas.width,
              canvas.height,
              0,
              0,
              scaledWidth,
              scaledHeight
            )

            // Clear main canvas and draw pixelated version back at full size
            ctx.imageSmoothingEnabled = false
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(
              pixelCanvas,
              0,
              0,
              scaledWidth,
              scaledHeight,
              0,
              0,
              canvas.width,
              canvas.height
            )
            ctx.imageSmoothingEnabled = true
          }
        }
        return
      }

      if (!isEffectCropMode) return

      // Calculate effect area using consistent coordinate system
      const effectAreaInCanvas =
        mode === "crop"
          ? { x: 0, y: 0, width: canvas.width, height: canvas.height } // For crop mode, apply to whole cropped area
          : calculateEffectAreaInVideoSpace(canvas.width, canvas.height) // For full mode, use calculated area

      // Extract the effect area
      const imageData = ctx.getImageData(
        effectAreaInCanvas.x,
        effectAreaInCanvas.y,
        effectAreaInCanvas.width,
        effectAreaInCanvas.height
      )

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
            ctx.drawImage(
              tempCanvas,
              0,
              0,
              effectAreaInCanvas.width,
              effectAreaInCanvas.height,
              effectAreaInCanvas.x,
              effectAreaInCanvas.y,
              effectAreaInCanvas.width,
              effectAreaInCanvas.height
            )
          }
        } catch {
          // Fallback to manual blur
          const blurredData = applyManualBlur(
            imageData,
            Math.ceil(blurAmount / 2)
          )
          ctx.putImageData(
            blurredData,
            effectAreaInCanvas.x,
            effectAreaInCanvas.y
          )
        }
      } else if (videoEffect === "pixelate") {
        const pixelSize = Math.max(2, effectIntensity * 4)
        const scaledWidth = Math.max(
          1,
          Math.floor(effectAreaInCanvas.width / pixelSize)
        )
        const scaledHeight = Math.max(
          1,
          Math.floor(effectAreaInCanvas.height / pixelSize)
        )

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
            pixelCtx.drawImage(
              tempCanvas,
              0,
              0,
              effectAreaInCanvas.width,
              effectAreaInCanvas.height,
              0,
              0,
              scaledWidth,
              scaledHeight
            )

            // Draw back at full size
            tempCtx.imageSmoothingEnabled = false
            tempCtx.clearRect(
              0,
              0,
              effectAreaInCanvas.width,
              effectAreaInCanvas.height
            )
            tempCtx.drawImage(
              pixelCanvas,
              0,
              0,
              scaledWidth,
              scaledHeight,
              0,
              0,
              effectAreaInCanvas.width,
              effectAreaInCanvas.height
            )

            // Draw the pixelated area back to the main canvas
            ctx.drawImage(
              tempCanvas,
              0,
              0,
              effectAreaInCanvas.width,
              effectAreaInCanvas.height,
              effectAreaInCanvas.x,
              effectAreaInCanvas.y,
              effectAreaInCanvas.width,
              effectAreaInCanvas.height
            )
          }
        }
      }
    },
    [
      videoEffect,
      effectIntensity,
      isEffectCropMode,
      calculateEffectAreaInVideoSpace,
      applyManualBlur,
    ]
  )

  // Take screenshot (with crop if enabled and timer support)
  const takeScreenshot = useCallback(
    async (withTimer = true) => {
      console.log("📸 takeScreenshot called:", {
        withTimer,
        isTimerActive,
        isCapturingScreenshot,
        screenshotTimer,
      })

      if (
        !videoRef.current ||
        !screenshotCanvasRef.current ||
        recordingState !== "idle"
      ) {
        console.log("📸 Early return:", {
          hasVideo: !!videoRef.current,
          hasCanvas: !!screenshotCanvasRef.current,
          recordingState,
        })
        return
      }

      // Prevent multiple simultaneous screenshot captures using ref for immediate protection
      if (isCapturingRef.current || isCapturingScreenshot) {
        console.log("📸 Already capturing screenshot, ignoring call")
        return
      }

      // If timer is set and this is a manual trigger, start countdown
      if (withTimer && screenshotTimer > 0 && !isTimerActive) {
        console.log("📸 Starting timer countdown:", screenshotTimer)

        // Clear any existing timer
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current)
        }

        setIsTimerActive(true)
        setTimerCountdown(screenshotTimer)

        let currentCount = screenshotTimer
        timerIntervalRef.current = setInterval(() => {
          currentCount--
          console.log("📸 Timer countdown:", currentCount)
          setTimerCountdown(currentCount)

          if (currentCount <= 0) {
            console.log("📸 Timer finished, taking screenshot")
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
      console.log("📸 Taking direct screenshot")
      actuallyTakeScreenshot()
    },
    [recordingState, screenshotTimer, isTimerActive, isCapturingScreenshot]
  )

  // Separate function for the actual screenshot logic to avoid recursion
  const actuallyTakeScreenshot = useCallback(async () => {
    console.log("📸 actuallyTakeScreenshot called:", {
      isCapturingScreenshot,
      isCapturingRef: isCapturingRef.current,
    })

    if (
      !videoRef.current ||
      !screenshotCanvasRef.current ||
      recordingState !== "idle"
    ) {
      console.log("📸 actuallyTakeScreenshot early return:", {
        hasVideo: !!videoRef.current,
        hasCanvas: !!screenshotCanvasRef.current,
        recordingState,
      })
      return
    }

    // Prevent multiple simultaneous captures using ref for immediate protection
    if (isCapturingRef.current || isCapturingScreenshot) {
      console.log(
        "📸 Already capturing screenshot in actuallyTakeScreenshot, ignoring"
      )
      return
    }

    console.log("📸 Starting screenshot capture")
    isCapturingRef.current = true
    setIsCapturingScreenshot(true)

    // Safety timeout to reset flags in case something goes wrong
    const safetyTimeout = setTimeout(() => {
      console.log("📸 Safety timeout triggered, resetting capture flags")
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
      const videoCropStartX =
        (cropStartX - videoOffsetX) * (videoWidth / displayedVideoWidth)
      const videoCropStartY =
        (cropStartY - videoOffsetY) * (videoHeight / displayedVideoHeight)
      const videoCropWidth = cropWidth * (videoWidth / displayedVideoWidth)
      const videoCropHeight = cropHeight * (videoHeight / displayedVideoHeight)

      // Clamp to video bounds
      const clampedX = Math.max(0, Math.min(videoCropStartX, videoWidth))
      const clampedY = Math.max(0, Math.min(videoCropStartY, videoHeight))
      const clampedWidth = Math.max(
        1,
        Math.min(videoCropWidth, videoWidth - clampedX)
      )
      const clampedHeight = Math.max(
        1,
        Math.min(videoCropHeight, videoHeight - clampedY)
      )

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
          clampedHeight
        )
        ctx.restore()
      } else {
        ctx.drawImage(
          video,
          clampedX,
          clampedY,
          clampedWidth,
          clampedHeight,
          0,
          0,
          clampedWidth,
          clampedHeight
        )
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

      // Calculate screenshot dimensions based on selected aspect ratio and HD setting
      let screenshotWidth: number
      let screenshotHeight: number

      // Use exact dimensions for each aspect ratio, with HD option for higher resolution
      if (isHDScreenshot) {
        // HD/4K dimensions for better quality
        switch (aspectRatio) {
          case "9:16":
            screenshotWidth = 2160 // 4K vertical
            screenshotHeight = 3840
            break
          case "4:3":
            screenshotWidth = 2880 // Enhanced 4:3
            screenshotHeight = 2160
            break
          case "1:1":
            screenshotWidth = 2160 // 4K square
            screenshotHeight = 2160
            break
          default: // "16:9"
            screenshotWidth = 3840 // 4K landscape
            screenshotHeight = 2160
            break
        }
      } else {
        // Standard HD dimensions
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
      }

      canvas.width = screenshotWidth
      canvas.height = screenshotHeight

      // Debug screenshot dimensions
      console.log(
        `📸 Screenshot FINAL dimensions for ${aspectRatio} (${isHDScreenshot ? "HD/4K" : "Standard"}):`,
        {
          targetAspectRatio,
          screenshotSize: { width: screenshotWidth, height: screenshotHeight },
          actualAspectRatio: screenshotWidth / screenshotHeight,
          videoSize: {
            width: videoWidth,
            height: videoHeight,
            aspectRatio: videoAspectRatio,
          },
          isVertical: screenshotHeight > screenshotWidth,
          expectedVertical: aspectRatio === "9:16",
          isHD: isHDScreenshot,
        }
      )

      // Clear canvas with black background
      ctx.fillStyle = "#000000"
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
          willFillHeight: true,
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
          0,
          0,
          videoWidth,
          videoHeight,
          -(drawX + drawWidth),
          drawY,
          drawWidth,
          drawHeight
        )
        ctx.restore()
      } else {
        ctx.drawImage(
          video,
          0,
          0,
          videoWidth,
          videoHeight,
          drawX,
          drawY,
          drawWidth,
          drawHeight
        )
      }
    }

    // Apply effects if enabled
    if (videoEffect !== ("none" as VideoEffect)) {
      applyEffectToScreenshot(ctx, canvas, isCropMode ? "crop" : "full")
    }

    // Show flash effect
    setShowFlash(true)
    setTimeout(() => setShowFlash(false), 200)

    // Convert canvas to blob
    const quality = screenshotFormat === "jpeg" ? 0.9 : undefined

    // Final debug log before saving
    console.log(
      `💾 Saving screenshot with canvas dimensions (${isHDScreenshot ? "HD/4K" : "Standard"}):`,
      {
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        aspectRatio: canvas.width / canvas.height,
        expectedAspectRatio: aspectRatio,
        isCorrectVertical:
          aspectRatio === "9:16" && canvas.height > canvas.width,
        isHD: isHDScreenshot,
        resolution: `${canvas.width}x${canvas.height}`,
      }
    )

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          clearTimeout(safetyTimeout)
          isCapturingRef.current = false
          setIsCapturingScreenshot(false)
          return
        }

        try {
          const screenshotId = `screenshot-${Date.now()}`
          const screenshotUrl = await blobToDataUrl(blob)

          const newScreenshot = {
            id: screenshotId,
            url: screenshotUrl,
            timestamp: new Date(),
          }

          setScreenshots((prev) => {
            const next = [newScreenshot, ...prev]
            saveScreenshots(next)
            return next
          })
          setScreenshotCount((prev) => prev + 1)

          console.log(
            `✅ Screenshot saved successfully! Resolution: ${canvas.width}x${canvas.height} (${isHDScreenshot ? "HD/4K" : "Standard"}) - Vertical: ${canvas.height > canvas.width}`
          )
        } catch (error) {
          console.error("Error creating screenshot:", error)
        } finally {
          clearTimeout(safetyTimeout)
          isCapturingRef.current = false
          setIsCapturingScreenshot(false)
          console.log("📸 Screenshot capture completed, flags reset")
        }
      },
      `image/${screenshotFormat}`,
      quality
    )
  }, [
    recordingState,
    screenshotFormat,
    isCropMode,
    cropArea,
    isFullscreen,
    isMirrored,
    isEffectCropMode,
    videoEffect,
    effectIntensity,
    applyEffectToScreenshot,
    aspectRatio,
    getVideoDisplayArea,
    isCapturingScreenshot,
    isHDScreenshot,
  ])

  // Cancel screenshot timer
  const cancelScreenshotTimer = useCallback(() => {
    console.log("📸 Timer cancelled")

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
    [screenshotFormat]
  )

  // State for download progress
  const [isDownloadingAll, setIsDownloadingAll] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)

  // Download all screenshots as ZIP with progress indication
  const downloadAllScreenshots = useCallback(async () => {
    if (screenshots.length === 0 || isDownloadingAll) return

    setIsDownloadingAll(true)
    setDownloadProgress(0)

    try {
      const zip = new JSZip()
      const totalScreenshots = screenshots.length

      console.log(`Starting download of ${totalScreenshots} screenshots...`)

      // Add each screenshot to the ZIP with progress tracking
      for (let i = 0; i < totalScreenshots; i++) {
        const screenshot = screenshots[i]

        try {
          // Update progress
          setDownloadProgress(Math.round((i / totalScreenshots) * 50)) // First 50% for fetching

          // Fetch the blob from the URL with timeout
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

          const response = await fetch(screenshot.url, {
            signal: controller.signal,
          })
          clearTimeout(timeoutId)

          if (!response.ok) {
            throw new Error(
              `Failed to fetch screenshot ${i + 1}: ${response.status}`
            )
          }

          const blob = await response.blob()

          // Create filename with timestamp and index
          const timestamp = screenshot.timestamp.getTime()
          const filename = `screenshot-${timestamp}-${String(i + 1).padStart(3, "0")}.${screenshotFormat}`

          // Add to ZIP
          zip.file(filename, blob)

          console.log(`Added screenshot ${i + 1}/${totalScreenshots} to ZIP`)
        } catch (error) {
          console.error(`Error processing screenshot ${i + 1}:`, error)
          // Continue with other screenshots
        }
      }

      // Update progress for ZIP generation
      setDownloadProgress(60)
      console.log("Generating ZIP file...")

      // Generate ZIP file with progress callback
      const zipBlob = await zip.generateAsync(
        {
          type: "blob",
          compression: "DEFLATE",
          compressionOptions: { level: 6 },
        },
        (metadata) => {
          // Update progress during ZIP generation (60-90%)
          const zipProgress = 60 + metadata.percent * 0.3
          setDownloadProgress(Math.round(zipProgress))
        }
      )

      setDownloadProgress(95)

      // Download ZIP
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      const zipFilename = `FlexiCam-Screenshots-${timestamp}-${totalScreenshots}files.zip`

      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = zipFilename
      a.style.display = "none"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      setDownloadProgress(100)
      console.log(
        `Successfully created ZIP with ${totalScreenshots} screenshots`
      )

      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(url)
        setIsDownloadingAll(false)
        setDownloadProgress(0)
      }, 2000)
    } catch (error) {
      console.error("Error creating ZIP file:", error)
      setDownloadProgress(0)

      // Fallback: download screenshots individually with user confirmation
      const fallbackDownload = window.confirm(
        `Failed to create ZIP file. Would you like to download all ${screenshots.length} screenshots individually? This will trigger multiple downloads.`
      )

      if (fallbackDownload) {
        console.log("Starting individual downloads...")
        screenshots.forEach((screenshot, index) => {
          setTimeout(() => {
            try {
              downloadScreenshot(screenshot)
            } catch (error) {
              console.error(`Error downloading screenshot ${index + 1}:`, error)
            }
          }, index * 800) // Stagger downloads to avoid browser blocking
        })
      }

      setIsDownloadingAll(false)
    }
  }, [screenshots, screenshotFormat, downloadScreenshot, isDownloadingAll])

  // Clear screenshots - simplified to avoid circular dependencies
  const clearScreenshots = useCallback(() => {
    setScreenshots((prevScreenshots) => {
      prevScreenshots.forEach((screenshot) => {
        if (!screenshot.url.startsWith("data:")) {
          URL.revokeObjectURL(screenshot.url)
        }
      })
      return []
    })
    clearStoredScreenshots()
  }, [])

  // Start recording with format selection and crop support
  const startRecording = useCallback(() => {
    // Check required streams based on recording mode
    if (recordingMode === "webcam" && !streamRef.current) return
    if (recordingMode === "screen" && !screenStream) return
    if (recordingMode === "pip" && (!streamRef.current || !screenStream)) return

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

      // Determine recording stream based on mode
      let recordingStream: MediaStream | null = null

      if (recordingMode === "screen") {
        // Screen recording only
        recordingStream = screenStream
      } else if (recordingMode === "pip") {
        // Picture-in-picture mode
        const pipStream = createPipStream()
        if (pipStream) {
          recordingStream = pipStream
          croppedStreamRef.current = pipStream
        }
      } else {
        // Webcam mode - apply effects, crop, or mirror as needed
        recordingStream = streamRef.current

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
      }

      if (!recordingStream) {
        throw new Error("No valid recording stream available")
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
    recordingMode,
    screenStream,
    exportFormat,
    mp4RecordingSupported,
    isCropMode,
    createCroppedStream,
    isMirrored,
    videoEffect,
    isEffectCropMode,
    createEffectStream,
    createPipStream,
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

  // Force light mode recalculation when aspect ratio changes
  useEffect(() => {
    if (isLightMode && isFullscreen) {
      // Add a small delay to ensure video layout has adjusted to new aspect ratio
      const timeoutId = setTimeout(() => {
        // Force re-render by updating a state that doesn't affect the video
        setVideoContainerSize((prev) => ({ ...prev }))
      }, 150)

      return () => clearTimeout(timeoutId)
    }
  }, [aspectRatio, isLightMode, isFullscreen])

  // Handle fullscreen change events
  const handleFullscreenChange = useCallback(() => {
    const wasFullscreen = isFullscreen
    const nowFullscreen = !!document.fullscreenElement

    setIsFullscreen(nowFullscreen)

    // Turn off light mode when exiting fullscreen (since it only works in fullscreen)
    if (wasFullscreen && !nowFullscreen && isLightMode) {
      setIsLightMode(false)
    }

    // If fullscreen state changed and crop modes are active, recalculate positions
    if (wasFullscreen !== nowFullscreen) {
      recalculateCropAreas()
    }
  }, [isFullscreen, isLightMode, recalculateCropAreas])

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
  const resetRecording = useCallback(
    (clearScreenshots = false) => {
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

      // Clean up thumbnails (these are tied to specific videos)
      setThumbnails((prevThumbnails) => {
        prevThumbnails.forEach((thumbnail) => {
          if (!thumbnail.url.startsWith("data:")) {
            URL.revokeObjectURL(thumbnail.url)
          }
        })
        return []
      })

      // Only clear screenshots if explicitly requested
      // Screenshots are independent of recordings and should persist across sessions
      if (clearScreenshots) {
        setScreenshots((prevScreenshots) => {
          prevScreenshots.forEach((screenshot) => {
            URL.revokeObjectURL(screenshot.url)
          })
          return []
        })
      }

      if (videoRef.current) {
        videoRef.current.src = ""
        videoRef.current.srcObject = streamRef.current
      }
    },
    [resetZoom]
  )

  // Set mounted state to prevent hydration errors
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return
    const stored = loadScreenshots()
    if (stored.length === 0) return
    setScreenshots(stored)
    setScreenshotCount(stored.length)
  }, [isMounted])

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
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop())
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
      if (pipAnimationRef.current) {
        cancelAnimationFrame(pipAnimationRef.current)
      }
      // Note: Screenshots and thumbnails cleanup moved to separate effect to prevent
      // clearing them when camera reinitializes due to aspect ratio changes
    }
  }, [isMounted, initializeCamera])

  // Cleanup screenshots and thumbnails only on component unmount
  useEffect(() => {
    // This effect only runs once on mount and cleans up on unmount
    return () => {
      // Cleanup screenshots on unmount only
      setScreenshots((prevScreenshots) => {
        prevScreenshots.forEach((screenshot) => {
          if (!screenshot.url.startsWith("data:")) {
            URL.revokeObjectURL(screenshot.url)
          }
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
  }, []) // Empty dependency array - only runs on mount/unmount

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
    if (
      recordingState === "stopped" &&
      videoDuration > 0 &&
      !isGeneratingThumbnails &&
      thumbnails.length === 0
    ) {
      generateThumbnails()
    }
  }, [
    recordingState,
    videoDuration,
    isGeneratingThumbnails,
    thumbnails.length,
    generateThumbnails,
  ])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in an input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      // Prevent default behavior for our shortcuts
      const shortcuts = [
        "KeyC",
        "KeyS",
        "KeyR",
        "Space",
        "Equal",
        "Minus",
        "Digit0",
        "KeyM",
        "KeyL",
      ]
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

        case "KeyL":
          // L key - ring light (fullscreen only)
          if (recordingState === "idle" && isFullscreen) {
            toggleLightMode()
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
    toggleLightMode,
    adjustLightIntensity,
    isScreenshotModalOpen,
    navigateScreenshot,
    closeScreenshotModal,
  ])

  return {
    adjustLightIntensity,
    aspectRatio,
    cameraError,
    cancelScreenshotTimer,
    canvasRef,
    clearScreenshots,
    closeScreenshotModal,
    cropArea,
    cropCanvasRef,
    currentTime,
    downloadAllScreenshots,
    downloadOriginalVideo,
    downloadProgress,
    downloadScreenshot,
    downloadTrimmedVideo,
    effectCanvasRef,
    effectCropArea,
    effectIntensity,
    exportFormat,
    getVideoDisplayArea,
    handleCropMouseDown,
    handleEffectCropMouseDown,
    handlePanStart,
    handlePipMouseDown,
    isCapturingScreenshot,
    isCropMode,
    isDownloadingAll,
    isEffectCropMode,
    isFullscreen,
    isGeneratingThumbnails,
    isHDScreenshot,
    isLightMode,
    isMirrored,
    isMounted,
    isPanning,
    isPlaying,
    isScreenshotModalOpen,
    isTimerActive,
    lightIntensity,
    mp4RecordingSupported,
    navigateScreenshot,
    openScreenshotModal,
    panOffset,
    pipCanvasRef,
    pipPosition,
    previewEffectCanvasRef,
    processingProgress,
    recordingMode,
    recordingState,
    recordingTime,
    resetRecording,
    resetZoom,
    screenError,
    screenStream,
    screenVideoRef,
    screenshotCanvasRef,
    screenshotCount,
    screenshotFormat,
    screenshotTimer,
    screenshots,
    seekTo,
    selectedScreenshotIndex,
    setAspectRatio,
    setEffectIntensity,
    setExportFormat,
    setIsHDScreenshot,
    setRecordingState,
    setScreenshotFormat,
    setScreenshotTimer,
    setSelectedScreenshotIndex,
    setTrimEnd,
    setTrimStart,
    setVideoEffect,
    showFlash,
    startRecording,
    stopRecording,
    switchToPip,
    switchToScreen,
    switchToWebcam,
    takeScreenshot,
    thumbnails,
    timerCountdown,
    toggleCropMode,
    toggleEffectCropMode,
    toggleFullscreen,
    toggleLightMode,
    toggleMirror,
    togglePlayback,
    trimEnd,
    trimStart,
    videoContainerRef,
    videoDuration,
    videoEffect,
    videoRef,
    webCodecsSupported,
    zoomIn,
    zoomLevel,
    zoomOut,
  }
}
