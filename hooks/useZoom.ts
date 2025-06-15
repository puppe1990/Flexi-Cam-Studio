import { useState, useCallback } from "react"
import { ZoomState } from "@/types/camera"

export const useZoom = () => {
  const [zoomState, setZoomState] = useState<ZoomState>({
    zoomLevel: 1,
    panOffset: { x: 0, y: 0 },
    isPanning: false,
    panStart: { x: 0, y: 0 },
  })

  const zoomIn = useCallback(() => {
    setZoomState(prev => ({
      ...prev,
      zoomLevel: Math.min(prev.zoomLevel + 0.25, 3),
    }))
  }, [])

  const zoomOut = useCallback(() => {
    setZoomState(prev => ({
      ...prev,
      zoomLevel: Math.max(prev.zoomLevel - 0.25, 0.5),
    }))
  }, [])

  const resetZoom = useCallback(() => {
    setZoomState(prev => ({
      ...prev,
      zoomLevel: 1,
      panOffset: { x: 0, y: 0 },
    }))
  }, [])

  const handlePanStart = useCallback((
    e: React.MouseEvent,
    isCropMode: boolean,
    isEffectCropMode: boolean
  ) => {
    if (zoomState.zoomLevel > 1 && !isCropMode && !isEffectCropMode) {
      setZoomState(prev => ({
        ...prev,
        isPanning: true,
        panStart: { x: e.clientX - prev.panOffset.x, y: e.clientY - prev.panOffset.y },
      }))
    }
  }, [zoomState.zoomLevel])

  const handlePanMove = useCallback((e: MouseEvent) => {
    if (zoomState.isPanning && zoomState.zoomLevel > 1) {
      const newX = e.clientX - zoomState.panStart.x
      const newY = e.clientY - zoomState.panStart.y

      // Calculate bounds to prevent panning too far
      const maxPan = 100 * (zoomState.zoomLevel - 1)
      const clampedX = Math.max(-maxPan, Math.min(maxPan, newX))
      const clampedY = Math.max(-maxPan, Math.min(maxPan, newY))

      setZoomState(prev => ({
        ...prev,
        panOffset: { x: clampedX, y: clampedY },
      }))
    }
  }, [zoomState.isPanning, zoomState.zoomLevel, zoomState.panStart])

  const handlePanEnd = useCallback(() => {
    setZoomState(prev => ({ ...prev, isPanning: false }))
  }, [])

  return {
    zoomState,
    zoomIn,
    zoomOut,
    resetZoom,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
  }
} 