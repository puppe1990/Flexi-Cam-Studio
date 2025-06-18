"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download } from "lucide-react"

// Types
type VideoEffect = "none" | "blur" | "pixelate"

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

interface VideoEffectsEditorProps {
  videoEffect: VideoEffect
  setVideoEffect: (effect: VideoEffect) => void
  effectIntensity: number
  setEffectIntensity: (intensity: number) => void
  isEffectCropMode: boolean
  setIsEffectCropMode: (enabled: boolean) => void
  effectCropArea: CropArea
  handleEffectCropMouseDown: (e: React.MouseEvent, handle?: string) => void
  applyManualBlur: (imageData: ImageData, radius: number) => ImageData
  downloadBlob: (blob: Blob, filename: string) => void
}

export default function VideoEffectsEditor({
  videoEffect,
  setVideoEffect,
  effectIntensity,
  setEffectIntensity,
  isEffectCropMode,
  setIsEffectCropMode,
  effectCropArea,
  handleEffectCropMouseDown,
  applyManualBlur,
  downloadBlob,
}: VideoEffectsEditorProps) {
  // Video Effects Editor state
  const [isVideoEditorMode, setIsVideoEditorMode] = useState(false)
  const [uploadedVideoFile, setUploadedVideoFile] = useState<File | null>(null)
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null)
  const [editorVideoRef, setEditorVideoRef] = useState<HTMLVideoElement | null>(null)
  const [isProcessingEffects, setIsProcessingEffects] = useState(false)
  const [effectsProgress, setEffectsProgress] = useState(0)

  // Video Editor refs
  const editorVideoContainerRef = useRef<HTMLDivElement>(null)
  const editorEffectCanvasRef = useRef<HTMLCanvasElement>(null)
  const editorPreviewCanvasRef = useRef<HTMLCanvasElement>(null)
  const editorEffectAnimationRef = useRef<number | null>(null)

  // Toggle effect crop mode
  const toggleEffectCropMode = useCallback(() => {
    setIsEffectCropMode(!isEffectCropMode)
  }, [isEffectCropMode, setIsEffectCropMode])

  // Drag and drop state
  const [isDragOver, setIsDragOver] = useState(false)

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    const videoFile = files.find(file => file.type.startsWith('video/'))
    
    if (videoFile) {
      // Clean up previous video
      if (uploadedVideoUrl) {
        URL.revokeObjectURL(uploadedVideoUrl)
      }
      
      setUploadedVideoFile(videoFile)
      const url = URL.createObjectURL(videoFile)
      setUploadedVideoUrl(url)
      setIsVideoEditorMode(true)
    }
  }, [uploadedVideoUrl])

  // Video Editor Functions
  const handleVideoUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('video/')) {
      // Clean up previous video
      if (uploadedVideoUrl) {
        URL.revokeObjectURL(uploadedVideoUrl)
      }
      
      setUploadedVideoFile(file)
      const url = URL.createObjectURL(file)
      setUploadedVideoUrl(url)
      setIsVideoEditorMode(true)
    }
  }, [uploadedVideoUrl])

  const exitVideoEditor = useCallback(() => {
    setIsVideoEditorMode(false)
    setUploadedVideoFile(null)
    if (uploadedVideoUrl) {
      URL.revokeObjectURL(uploadedVideoUrl)
      setUploadedVideoUrl(null)
    }
    setIsProcessingEffects(false)
    setEffectsProgress(0)
    
    // Cancel any ongoing animation
    if (editorEffectAnimationRef.current) {
      cancelAnimationFrame(editorEffectAnimationRef.current)
      editorEffectAnimationRef.current = null
    }
  }, [uploadedVideoUrl])

  // Update effect preview for video editor
  const updateEditorEffectPreview = useCallback(() => {
    if (!editorPreviewCanvasRef.current || !editorVideoRef || !editorVideoContainerRef.current) return
    
    const canvas = editorPreviewCanvasRef.current
    const video = editorVideoRef
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Only show effect preview when effects are enabled
    if (videoEffect === ("none" as VideoEffect)) {
      canvas.style.display = "none"
      return
    }

    canvas.style.display = "block"
    
    // Get container dimensions
    const containerRect = editorVideoContainerRef.current.getBoundingClientRect()
    
    // Set canvas size to match container
    canvas.width = containerRect.width
    canvas.height = containerRect.height
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Calculate video display area (similar to main video)
    const videoWidth = video.videoWidth || 1280
    const videoHeight = video.videoHeight || 720
    const videoAspectRatio = videoWidth / videoHeight
    const containerAspectRatio = containerRect.width / containerRect.height
    
    let displayedVideoWidth: number
    let displayedVideoHeight: number
    let videoOffsetX = 0
    let videoOffsetY = 0
    
    if (Math.abs(videoAspectRatio - containerAspectRatio) < 0.01) {
      displayedVideoWidth = containerRect.width
      displayedVideoHeight = containerRect.height
    } else if (videoAspectRatio > containerAspectRatio) {
      displayedVideoWidth = containerRect.width
      displayedVideoHeight = containerRect.width / videoAspectRatio
      videoOffsetY = (containerRect.height - displayedVideoHeight) / 2
    } else {
      displayedVideoWidth = containerRect.height * videoAspectRatio
      displayedVideoHeight = containerRect.height
      videoOffsetX = (containerRect.width - displayedVideoWidth) / 2
    }

    // Apply effect to appropriate area
    if (isEffectCropMode) {
      // Apply effect to selected area
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

      // Calculate source rectangle on video
      const videoEffectStartX = (effectStartX - videoOffsetX) * (videoWidth / displayedVideoWidth)
      const videoEffectStartY = (effectStartY - videoOffsetY) * (videoHeight / displayedVideoHeight)
      const videoEffectWidth = effectWidth * (videoWidth / displayedVideoWidth)
      const videoEffectHeight = effectHeight * (videoHeight / displayedVideoHeight)

      // Clamp to video bounds
      const clampedX = Math.max(0, Math.min(videoEffectStartX, videoWidth))
      const clampedY = Math.max(0, Math.min(videoEffectStartY, videoHeight))
      const clampedWidth = Math.max(1, Math.min(videoEffectWidth, videoWidth - clampedX))
      const clampedHeight = Math.max(1, Math.min(videoEffectHeight, videoHeight - clampedY))

      // Draw the video section to the temporary canvas
      tempCtx.drawImage(
        video,
        clampedX, clampedY, clampedWidth, clampedHeight,
        0, 0, effectWidth, effectHeight
      )

      // Apply the effect
      if (videoEffect === "blur") {
        const blurAmount = effectIntensity * 2
        try {
          tempCtx.filter = `blur(${blurAmount}px)`
          tempCtx.drawImage(tempCanvas, 0, 0)
        } catch (error) {
          // Fallback to manual blur
          const imageData = tempCtx.getImageData(0, 0, effectWidth, effectHeight)
          const blurredData = applyManualBlur(imageData, Math.ceil(blurAmount / 2))
          tempCtx.putImageData(blurredData, 0, 0)
        }
      } else if (videoEffect === "pixelate") {
        const pixelSize = Math.max(2, effectIntensity * 4)
        const scaledWidth = Math.max(1, Math.floor(effectWidth / pixelSize))
        const scaledHeight = Math.max(1, Math.floor(effectHeight / pixelSize))

        const pixelCanvas = document.createElement("canvas")
        const pixelCtx = pixelCanvas.getContext("2d")
        if (!pixelCtx) return

        pixelCanvas.width = scaledWidth
        pixelCanvas.height = scaledHeight

        pixelCtx.imageSmoothingEnabled = false
        tempCtx.imageSmoothingEnabled = false

        pixelCtx.drawImage(tempCanvas, 0, 0, effectWidth, effectHeight, 0, 0, scaledWidth, scaledHeight)
        
        tempCtx.clearRect(0, 0, effectWidth, effectHeight)
        tempCtx.drawImage(pixelCanvas, 0, 0, scaledWidth, scaledHeight, 0, 0, effectWidth, effectHeight)
      }

      // Draw the processed area to the main canvas
      ctx.drawImage(tempCanvas, 0, 0, effectWidth, effectHeight, effectStartX, effectStartY, effectWidth, effectHeight)
    }

    // Continue animation
    if (videoEffect !== ("none" as VideoEffect)) {
      editorEffectAnimationRef.current = requestAnimationFrame(updateEditorEffectPreview)
    }
  }, [videoEffect, effectIntensity, effectCropArea, isEffectCropMode, editorVideoRef, applyManualBlur])

  // Process uploaded video with effects
  const processVideoWithEffects = useCallback(async () => {
    if (!uploadedVideoFile || !editorVideoRef || !editorEffectCanvasRef.current) return

    setIsProcessingEffects(true)
    setEffectsProgress(0)

    try {
      const canvas = editorEffectCanvasRef.current
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Canvas context not available")

      // Set canvas dimensions to match video
      canvas.width = editorVideoRef.videoWidth || 1280
      canvas.height = editorVideoRef.videoHeight || 720

      // Create canvas stream for recording
      const canvasStream = canvas.captureStream(30)
      
      // Set up MediaRecorder
      const mediaRecorder = new MediaRecorder(canvasStream, {
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
          const processedBlob = new Blob(chunks, { type: "video/webm" })
          resolve(processedBlob)
        }

        mediaRecorder.onerror = reject

        // Start recording
        mediaRecorder.start()

        // Process video frames
        const video = editorVideoRef
        const duration = video.duration
        const fps = 30
        const totalFrames = Math.floor(duration * fps)
        let currentFrame = 0

        video.currentTime = 0

        const processFrame = () => {
          if (currentFrame >= totalFrames) {
            mediaRecorder.stop()
            return
          }

          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height)

          // Draw the original video frame
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

          // Apply effects
          if (videoEffect !== ("none" as VideoEffect)) {
            if (isEffectCropMode) {
              // Apply effect to selected area only
              const videoWidth = video.videoWidth || 1280
              const videoHeight = video.videoHeight || 720
              
              const effectX = effectCropArea.x * videoWidth
              const effectY = effectCropArea.y * videoHeight
              const effectWidth = effectCropArea.width * videoWidth
              const effectHeight = effectCropArea.height * videoHeight

              const clampedX = Math.max(0, Math.min(effectX, videoWidth))
              const clampedY = Math.max(0, Math.min(effectY, videoHeight))
              const clampedWidth = Math.max(1, Math.min(effectWidth, videoWidth - clampedX))
              const clampedHeight = Math.max(1, Math.min(effectHeight, videoHeight - clampedY))

              // Extract the area to be affected
              const imageData = ctx.getImageData(clampedX, clampedY, clampedWidth, clampedHeight)
              
              if (videoEffect === "blur") {
                const blurAmount = effectIntensity * 2
                const tempCanvas = document.createElement("canvas")
                const tempCtx = tempCanvas.getContext("2d")
                if (tempCtx) {
                  tempCanvas.width = clampedWidth
                  tempCanvas.height = clampedHeight
                  tempCtx.putImageData(imageData, 0, 0)
                  tempCtx.filter = `blur(${blurAmount}px)`
                  tempCtx.drawImage(tempCanvas, 0, 0)
                  ctx.drawImage(tempCanvas, 0, 0, clampedWidth, clampedHeight, clampedX, clampedY, clampedWidth, clampedHeight)
                }
              } else if (videoEffect === "pixelate") {
                const pixelSize = Math.max(1, effectIntensity * 3)
                const scaledWidth = Math.max(1, Math.floor(clampedWidth / pixelSize))
                const scaledHeight = Math.max(1, Math.floor(clampedHeight / pixelSize))

                const tempCanvas = document.createElement("canvas")
                const tempCtx = tempCanvas.getContext("2d")
                if (tempCtx) {
                  tempCanvas.width = clampedWidth
                  tempCanvas.height = clampedHeight
                  tempCtx.putImageData(imageData, 0, 0)
                  
                  const pixelCanvas = document.createElement("canvas")
                  const pixelCtx = pixelCanvas.getContext("2d")
                  if (pixelCtx) {
                    pixelCanvas.width = scaledWidth
                    pixelCanvas.height = scaledHeight
                    pixelCtx.imageSmoothingEnabled = false
                    tempCtx.imageSmoothingEnabled = false
                    
                    pixelCtx.drawImage(tempCanvas, 0, 0, clampedWidth, clampedHeight, 0, 0, scaledWidth, scaledHeight)
                    tempCtx.clearRect(0, 0, clampedWidth, clampedHeight)
                    tempCtx.drawImage(pixelCanvas, 0, 0, scaledWidth, scaledHeight, 0, 0, clampedWidth, clampedHeight)
                    
                    ctx.drawImage(tempCanvas, 0, 0, clampedWidth, clampedHeight, clampedX, clampedY, clampedWidth, clampedHeight)
                  }
                }
              }
            } else {
              // Apply effect to entire frame
              if (videoEffect === "blur") {
                const blurAmount = effectIntensity * 2
                ctx.filter = `blur(${blurAmount}px)`
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
              } else if (videoEffect === "pixelate") {
                const pixelSize = effectIntensity * 3
                const scaledWidth = Math.max(1, Math.floor(canvas.width / pixelSize))
                const scaledHeight = Math.max(1, Math.floor(canvas.height / pixelSize))

                ctx.imageSmoothingEnabled = false
                ctx.drawImage(video, 0, 0, scaledWidth, scaledHeight)
                
                const imageData = ctx.getImageData(0, 0, scaledWidth, scaledHeight)
                ctx.clearRect(0, 0, canvas.width, canvas.height)
                ctx.putImageData(imageData, 0, 0)
                ctx.drawImage(canvas, 0, 0, scaledWidth, scaledHeight, 0, 0, canvas.width, canvas.height)
              }
            }
          }

          // Update progress
          const progress = (currentFrame / totalFrames) * 100
          setEffectsProgress(progress)

          currentFrame++
          const nextTime = currentFrame / fps

          if (nextTime <= duration) {
            video.currentTime = nextTime
            requestAnimationFrame(processFrame)
          } else {
            mediaRecorder.stop()
          }
        }

        video.onseeked = () => {
          if (currentFrame === 0) {
            processFrame()
          }
        }

        // Timeout fallback
        setTimeout(() => {
          if (mediaRecorder.state === "recording") {
            mediaRecorder.stop()
          }
        }, (duration + 10) * 1000)
      })
    } catch (error) {
      console.error("Error processing video:", error)
      throw error
    } finally {
      setIsProcessingEffects(false)
      setEffectsProgress(0)
    }
  }, [uploadedVideoFile, editorVideoRef, videoEffect, effectIntensity, isEffectCropMode, effectCropArea])

  const downloadProcessedVideo = useCallback(async () => {
    try {
      const processedBlob = await processVideoWithEffects()
      if (processedBlob) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
        const filename = `processed-video-${timestamp}.webm`
        downloadBlob(processedBlob, filename)
      }
    } catch (error) {
      console.error("Error downloading processed video:", error)
    }
  }, [processVideoWithEffects, downloadBlob])

  // Start/stop effect preview animation for video editor
  useEffect(() => {
    if (isVideoEditorMode && videoEffect !== ("none" as VideoEffect)) {
      // Cancel any existing animation before starting a new one
      if (editorEffectAnimationRef.current) {
        cancelAnimationFrame(editorEffectAnimationRef.current)
        editorEffectAnimationRef.current = null
      }
      updateEditorEffectPreview()
    } else if (editorEffectAnimationRef.current) {
      cancelAnimationFrame(editorEffectAnimationRef.current)
      editorEffectAnimationRef.current = null
      if (editorPreviewCanvasRef.current) {
        editorPreviewCanvasRef.current.style.display = "none"
      }
    }

    return () => {
      if (editorEffectAnimationRef.current) {
        cancelAnimationFrame(editorEffectAnimationRef.current)
        editorEffectAnimationRef.current = null
      }
    }
  }, [isVideoEditorMode, videoEffect, effectIntensity, isEffectCropMode, updateEditorEffectPreview])

  // Clean up video editor on unmount
  useEffect(() => {
    return () => {
      if (uploadedVideoUrl) {
        URL.revokeObjectURL(uploadedVideoUrl)
      }
      if (editorEffectAnimationRef.current) {
        cancelAnimationFrame(editorEffectAnimationRef.current)
      }
    }
  }, [uploadedVideoUrl])

  return (
    <>
      {/* Video Effects Editor Card */}
      {!isVideoEditorMode && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4zM6 6v12h12V6H6z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 11V9m4 2V9m-4 4v2m4-2v2" />
              </svg>
              Video Effects Editor
            </CardTitle>
            <p className="text-sm text-slate-600">Upload and apply effects to existing videos with live preview</p>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div 
                className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
                  isDragOver 
                    ? "border-blue-500 bg-blue-50" 
                    : "border-slate-300 hover:border-blue-400"
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                  id="video-upload"
                />
                <label htmlFor="video-upload" className="cursor-pointer">
                  <div className="space-y-3">
                    <svg 
                      className={`w-12 h-12 mx-auto transition-colors ${
                        isDragOver ? "text-blue-500" : "text-slate-400"
                      }`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <div>
                      <p className={`text-lg font-semibold transition-colors ${
                        isDragOver ? "text-blue-700" : "text-slate-700"
                      }`}>
                        {isDragOver ? "Drop video file here" : "Upload Video File"}
                      </p>
                      <p className="text-sm text-slate-500">Click to select or drag and drop</p>
                      <p className="text-xs text-slate-400 mt-1">Supports MP4, WebM, AVI, MOV, and other video formats</p>
                    </div>
                  </div>
                </label>
              </div>
              <div className="text-xs text-slate-500">
                ✨ Apply blur, pixelate, and area effects • 🎬 Live preview while editing • 📥 Export processed video
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Video Effects Editor Interface */}
      {isVideoEditorMode && uploadedVideoUrl && (
        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Video Effects Editor
                {videoEffect !== ("none" as VideoEffect) && (
                  <Badge variant="outline" className="text-xs border-purple-300 text-purple-600">
                    {videoEffect === "blur" ? "Blur" : "Pixelate"} {effectIntensity}
                    {isEffectCropMode && " (Area)"}
                  </Badge>
                )}
              </CardTitle>
              <Button onClick={exitVideoEditor} variant="outline" size="sm">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Exit Editor
              </Button>
            </div>
            <p className="text-sm text-slate-600">Apply effects to your video with live preview</p>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Effect Controls for Editor */}
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Effect:</label>
                  <Select value={videoEffect} onValueChange={(value: VideoEffect) => setVideoEffect(value)}>
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

                {videoEffect !== ("none" as VideoEffect) && (
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
                          onValueChange={([value]) => setEffectIntensity(value)}
                          className="w-20"
                        />
                        <span className="text-xs text-slate-500">10</span>
                        <span className="text-sm font-mono w-6 text-center">{effectIntensity}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Apply to:</label>
                      <Button
                        onClick={toggleEffectCropMode}
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
            </div>

            {/* Video Preview for Editor */}
            <div
              ref={editorVideoContainerRef}
              className="relative bg-black rounded-lg overflow-hidden"
              style={{ aspectRatio: "16/9" }}
            >
              <video
                ref={(el) => setEditorVideoRef(el)}
                src={uploadedVideoUrl}
                className="w-full h-full object-contain"
                controls
                onLoadedMetadata={() => {
                  if (editorVideoRef) {
                    console.log("Video loaded:", {
                      width: editorVideoRef.videoWidth,
                      height: editorVideoRef.videoHeight,
                      duration: editorVideoRef.duration
                    })
                  }
                }}
              />

              {/* Effect Preview Canvas for Editor */}
              <canvas
                ref={editorPreviewCanvasRef}
                className="absolute inset-0 pointer-events-none"
                style={{ display: "none", zIndex: 5 }}
              />

              {/* Effect Crop Overlay for Editor */}
              {isEffectCropMode && videoEffect !== ("none" as VideoEffect) && editorVideoContainerRef.current && (
                <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
                  {(() => {
                    const containerRect = editorVideoContainerRef.current!.getBoundingClientRect()
                    
                    return (
                      <div
                        className="absolute border-2 border-purple-400 bg-purple-400/10 cursor-move pointer-events-auto"
                        style={{
                          left: `${effectCropArea.x * 100}%`,
                          top: `${effectCropArea.y * 100}%`,
                          width: `${effectCropArea.width * 100}%`,
                          height: `${effectCropArea.height * 100}%`,
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
                    )
                  })()}

                  {/* Dimmed overlay for non-effect areas */}
                  <div className="absolute inset-0 bg-black/20 pointer-events-none">
                    <div
                      className="absolute bg-transparent"
                      style={{
                        left: `${effectCropArea.x * 100}%`,
                        top: `${effectCropArea.y * 100}%`,
                        width: `${effectCropArea.width * 100}%`,
                        height: `${effectCropArea.height * 100}%`,
                        boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.2)`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Processing Overlay for Editor */}
              {isProcessingEffects && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="bg-white rounded-lg p-6 text-center space-y-4">
                    <div className="text-lg font-semibold">Processing Video with Effects...</div>
                    <div className="w-64 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${effectsProgress}%` }}
                      />
                    </div>
                    <div className="text-sm text-slate-600">{Math.round(effectsProgress)}%</div>
                    <div className="text-xs text-slate-500">
                      Applying {videoEffect === "blur" ? "blur" : "pixelate"} effect
                      {isEffectCropMode && " to selected area"}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Effect Info for Editor */}
            {videoEffect !== ("none" as VideoEffect) && (
              <div className="text-center text-sm text-slate-600 bg-purple-50 rounded-lg p-3">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="font-medium">
                    Live Preview: {videoEffect === "blur" ? "Blur Effect" : "Pixelate Effect"} (Intensity: {effectIntensity})
                    {isEffectCropMode && " - Area Mode"}
                  </span>
                </div>
                <p>
                  {isEffectCropMode
                    ? `Effect will be applied only to the selected area when processing`
                    : `Effect will be applied to the entire video when processing`}
                </p>
                {isEffectCropMode && (
                  <p className="text-xs text-slate-500 mt-1">
                    Area: {Math.round(effectCropArea.width * 100)}% × {Math.round(effectCropArea.height * 100)}% •
                    Position: {Math.round(effectCropArea.x * 100)}%, {Math.round(effectCropArea.y * 100)}%
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons for Editor */}
            <div className="flex justify-center gap-4 flex-wrap">
              <Button onClick={exitVideoEditor} variant="outline">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </Button>

              <Button
                onClick={downloadProcessedVideo}
                className="bg-purple-600 hover:bg-purple-700"
                disabled={isProcessingEffects || videoEffect === ("none" as VideoEffect)}
              >
                <Download className="w-4 h-4 mr-2" />
                {isProcessingEffects 
                  ? `Processing... ${Math.round(effectsProgress)}%`
                  : `Process & Download ${videoEffect === ("none" as VideoEffect) ? "(Select Effect)" : ""}`
                }
              </Button>
            </div>

            {videoEffect === ("none" as VideoEffect) && (
              <div className="text-center text-sm text-amber-600 bg-amber-50 rounded-lg p-2">
                ⚠️ Please select an effect to process the video
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Hidden Canvas for Processing */}
      <canvas ref={editorEffectCanvasRef} className="hidden" />
    </>
  )
} 