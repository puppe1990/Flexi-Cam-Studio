import { useState, useRef, useCallback } from "react"
import { EffectState, VideoEffect, CropArea } from "@/types/camera"

export const useEffects = () => {
  const [effectState, setEffectState] = useState<EffectState>({
    videoEffect: "none",
    effectIntensity: 5,
    isEffectCropMode: false,
    effectCropArea: { x: 0.2, y: 0.2, width: 0.6, height: 0.6 },
    isEffectDragging: false,
    isEffectResizing: false,
    effectDragStart: { x: 0, y: 0 },
    effectResizeHandle: "",
  })

  const effectCanvasRef = useRef<HTMLCanvasElement>(null)
  const previewEffectCanvasRef = useRef<HTMLCanvasElement>(null)
  const previewEffectAnimationRef = useRef<number | null>(null)

  const setVideoEffect = useCallback((effect: VideoEffect) => {
    setEffectState(prev => ({ ...prev, videoEffect: effect }))
  }, [])

  const setEffectIntensity = useCallback((intensity: number) => {
    setEffectState(prev => ({ ...prev, effectIntensity: intensity }))
  }, [])

  const toggleEffectCropMode = useCallback(() => {
    setEffectState(prev => ({
      ...prev,
      isEffectCropMode: !prev.isEffectCropMode,
      effectCropArea: !prev.isEffectCropMode ? { x: 0.2, y: 0.2, width: 0.6, height: 0.6 } : prev.effectCropArea,
    }))
  }, [])

  const handleEffectCropMouseDown = useCallback((
    e: React.MouseEvent,
    videoContainerRef: React.RefObject<HTMLDivElement>,
    handle?: string
  ) => {
    if (!videoContainerRef.current) return

    e.preventDefault()
    e.stopPropagation()

    setEffectState(prev => ({
      ...prev,
      effectDragStart: { x: e.clientX, y: e.clientY },
      isEffectDragging: !handle,
      isEffectResizing: !!handle,
      effectResizeHandle: handle || "",
    }))
  }, [])

  const handleEffectCropMouseMove = useCallback((
    e: MouseEvent,
    videoContainerRef: React.RefObject<HTMLDivElement>
  ) => {
    if (!videoContainerRef.current || (!effectState.isEffectDragging && !effectState.isEffectResizing)) return

    const rect = videoContainerRef.current.getBoundingClientRect()
    const deltaX = (e.clientX - effectState.effectDragStart.x) / rect.width
    const deltaY = (e.clientY - effectState.effectDragStart.y) / rect.height

    if (effectState.isEffectDragging) {
      setEffectState(prev => ({
        ...prev,
        effectCropArea: {
          ...prev.effectCropArea,
          x: Math.max(0, Math.min(1 - prev.effectCropArea.width, prev.effectCropArea.x + deltaX)),
          y: Math.max(0, Math.min(1 - prev.effectCropArea.height, prev.effectCropArea.y + deltaY)),
        },
        effectDragStart: { x: e.clientX, y: e.clientY },
      }))
    } else if (effectState.isEffectResizing) {
      setEffectState(prev => {
        const newArea = { ...prev.effectCropArea }

        switch (prev.effectResizeHandle) {
          case "nw":
            newArea.width = Math.max(0.1, prev.effectCropArea.width - deltaX)
            newArea.height = Math.max(0.1, prev.effectCropArea.height - deltaY)
            newArea.x = Math.max(0, prev.effectCropArea.x + deltaX)
            newArea.y = Math.max(0, prev.effectCropArea.y + deltaY)
            break
          case "ne":
            newArea.width = Math.max(0.1, Math.min(1 - prev.effectCropArea.x, prev.effectCropArea.width + deltaX))
            newArea.height = Math.max(0.1, prev.effectCropArea.height - deltaY)
            newArea.y = Math.max(0, prev.effectCropArea.y + deltaY)
            break
          case "sw":
            newArea.width = Math.max(0.1, prev.effectCropArea.width - deltaX)
            newArea.height = Math.max(0.1, Math.min(1 - prev.effectCropArea.y, prev.effectCropArea.height + deltaY))
            newArea.x = Math.max(0, prev.effectCropArea.x + deltaX)
            break
          case "se":
            newArea.width = Math.max(0.1, Math.min(1 - prev.effectCropArea.x, prev.effectCropArea.width + deltaX))
            newArea.height = Math.max(0.1, Math.min(1 - prev.effectCropArea.y, prev.effectCropArea.height + deltaY))
            break
        }

        return {
          ...prev,
          effectCropArea: newArea,
          effectDragStart: { x: e.clientX, y: e.clientY },
        }
      })
    }
  }, [effectState.isEffectDragging, effectState.isEffectResizing, effectState.effectDragStart, effectState.effectResizeHandle])

  const handleEffectCropMouseUp = useCallback(() => {
    setEffectState(prev => ({
      ...prev,
      isEffectDragging: false,
      isEffectResizing: false,
      effectResizeHandle: "",
    }))
  }, [])

  const startPreviewAnimation = useCallback(() => {
    if (previewEffectAnimationRef.current) {
      cancelAnimationFrame(previewEffectAnimationRef.current)
      previewEffectAnimationRef.current = null
    }
  }, [])

  const stopPreviewAnimation = useCallback(() => {
    if (previewEffectAnimationRef.current) {
      cancelAnimationFrame(previewEffectAnimationRef.current)
      previewEffectAnimationRef.current = null
    }
    if (previewEffectCanvasRef.current) {
      previewEffectCanvasRef.current.style.display = "none"
    }
  }, [])

  return {
    effectState,
    effectCanvasRef,
    previewEffectCanvasRef,
    previewEffectAnimationRef,
    setVideoEffect,
    setEffectIntensity,
    toggleEffectCropMode,
    handleEffectCropMouseDown,
    handleEffectCropMouseMove,
    handleEffectCropMouseUp,
    startPreviewAnimation,
    stopPreviewAnimation,
  }
} 