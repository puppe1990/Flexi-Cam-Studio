import { useState, useRef, useCallback } from "react"
import { CameraState, AspectRatio } from "@/types/camera"
import { checkVideoSupport } from "@/lib/utils/video"

export const useCamera = () => {
  const [cameraState, setCameraState] = useState<CameraState>({
    recordingState: "idle",
    recordedBlob: null,
    recordingTime: 0,
    videoDuration: 0,
    trimStart: 0,
    trimEnd: 0,
    isPlaying: false,
    currentTime: 0,
    processingProgress: 0,
    cameraError: null,
    thumbnails: [],
    isGeneratingThumbnails: false,
    exportFormat: "webm",
    webCodecsSupported: false,
    mp4RecordingSupported: false,
  })

  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMirrored, setIsMirrored] = useState(false)

  const streamRef = useRef<MediaStream | null>(null)

  const initializeCamera = useCallback(async () => {
    try {
      setCameraState(prev => ({ ...prev, cameraError: null }))

      // Calculate video constraints based on aspect ratio
      let videoConstraints: MediaTrackConstraints

      switch (aspectRatio) {
        case "9:16":
          videoConstraints = { width: 720, height: 1280 } // Vertical
          break
        case "4:3":
          videoConstraints = { width: 960, height: 720 } // Classic
          break
        case "1:1":
          videoConstraints = { width: 720, height: 720 } // Square
          break
        case "16:9":
        default:
          videoConstraints = { width: 1280, height: 720 } // Landscape
          break
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: true,
      })
      streamRef.current = stream

      // Check video support
      const support = checkVideoSupport()
      setCameraState(prev => ({
        ...prev,
        webCodecsSupported: support.webCodecsSupported,
        mp4RecordingSupported: support.mp4RecordingSupported,
        exportFormat: support.mp4RecordingSupported ? "mp4" : "webm",
      }))

      return stream
    } catch (error) {
      console.error("Error accessing camera:", error)
      setCameraState(prev => ({
        ...prev,
        cameraError: "Unable to access camera. Please check permissions."
      }))
      return null
    }
  }, [aspectRatio])

  const toggleMirror = useCallback(() => {
    setIsMirrored(prev => !prev)
  }, [])

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        // Element will be passed from the component
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error)
    }
  }, [])

  const updateCameraState = useCallback((updates: Partial<CameraState>) => {
    setCameraState(prev => ({ ...prev, ...updates }))
  }, [])

  const resetCamera = useCallback(() => {
    setCameraState({
      recordingState: "idle",
      recordedBlob: null,
      recordingTime: 0,
      videoDuration: 0,
      trimStart: 0,
      trimEnd: 0,
      isPlaying: false,
      currentTime: 0,
      processingProgress: 0,
      cameraError: null,
      thumbnails: [],
      isGeneratingThumbnails: false,
      exportFormat: "webm",
      webCodecsSupported: false,
      mp4RecordingSupported: false,
    })
  }, [])

  return {
    cameraState,
    aspectRatio,
    setAspectRatio,
    isFullscreen,
    setIsFullscreen,
    isMirrored,
    streamRef,
    initializeCamera,
    toggleMirror,
    toggleFullscreen,
    updateCameraState,
    resetCamera,
  }
} 