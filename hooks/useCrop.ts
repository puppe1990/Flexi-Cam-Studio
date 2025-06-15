import { useState, useCallback } from "react"
import { CropState, CropArea } from "@/types/camera"

export const useCrop = () => {
  const [cropState, setCropState] = useState<CropState>({
    isCropMode: false,
    cropArea: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
    isDragging: false,
    isResizing: false,
    dragStart: { x: 0, y: 0 },
    resizeHandle: "",
    videoContainerSize: { width: 0, height: 0 },
  })

  const toggleCropMode = useCallback(() => {
    setCropState(prev => ({
      ...prev,
      isCropMode: !prev.isCropMode,
      cropArea: !prev.isCropMode ? { x: 0.1, y: 0.1, width: 0.8, height: 0.8 } : prev.cropArea,
    }))
  }, [])

  const handleCropMouseDown = useCallback((
    e: React.MouseEvent,
    videoContainerRef: React.RefObject<HTMLDivElement>,
    handle?: string
  ) => {
    if (!videoContainerRef.current) return

    e.preventDefault()
    e.stopPropagation()

    setCropState(prev => ({
      ...prev,
      dragStart: { x: e.clientX, y: e.clientY },
      isDragging: !handle,
      isResizing: !!handle,
      resizeHandle: handle || "",
    }))
  }, [])

  const handleCropMouseMove = useCallback((
    e: MouseEvent,
    videoContainerRef: React.RefObject<HTMLDivElement>
  ) => {
    if (!videoContainerRef.current || (!cropState.isDragging && !cropState.isResizing)) return

    const rect = videoContainerRef.current.getBoundingClientRect()
    const deltaX = (e.clientX - cropState.dragStart.x) / rect.width
    const deltaY = (e.clientY - cropState.dragStart.y) / rect.height

    if (cropState.isDragging) {
      setCropState(prev => ({
        ...prev,
        cropArea: {
          ...prev.cropArea,
          x: Math.max(0, Math.min(1 - prev.cropArea.width, prev.cropArea.x + deltaX)),
          y: Math.max(0, Math.min(1 - prev.cropArea.height, prev.cropArea.y + deltaY)),
        },
        dragStart: { x: e.clientX, y: e.clientY },
      }))
    } else if (cropState.isResizing) {
      setCropState(prev => {
        const newArea = { ...prev.cropArea }

        switch (prev.resizeHandle) {
          case "nw":
            newArea.width = Math.max(0.1, prev.cropArea.width - deltaX)
            newArea.height = Math.max(0.1, prev.cropArea.height - deltaY)
            newArea.x = Math.max(0, prev.cropArea.x + deltaX)
            newArea.y = Math.max(0, prev.cropArea.y + deltaY)
            break
          case "ne":
            newArea.width = Math.max(0.1, Math.min(1 - prev.cropArea.x, prev.cropArea.width + deltaX))
            newArea.height = Math.max(0.1, prev.cropArea.height - deltaY)
            newArea.y = Math.max(0, prev.cropArea.y + deltaY)
            break
          case "sw":
            newArea.width = Math.max(0.1, prev.cropArea.width - deltaX)
            newArea.height = Math.max(0.1, Math.min(1 - prev.cropArea.y, prev.cropArea.height + deltaY))
            newArea.x = Math.max(0, prev.cropArea.x + deltaX)
            break
          case "se":
            newArea.width = Math.max(0.1, Math.min(1 - prev.cropArea.x, prev.cropArea.width + deltaX))
            newArea.height = Math.max(0.1, Math.min(1 - prev.cropArea.y, prev.cropArea.height + deltaY))
            break
        }

        return {
          ...prev,
          cropArea: newArea,
          dragStart: { x: e.clientX, y: e.clientY },
        }
      })
    }
  }, [cropState.isDragging, cropState.isResizing, cropState.dragStart, cropState.resizeHandle])

  const handleCropMouseUp = useCallback(() => {
    setCropState(prev => ({
      ...prev,
      isDragging: false,
      isResizing: false,
      resizeHandle: "",
    }))
  }, [])

  const updateVideoContainerSize = useCallback((size: { width: number; height: number }) => {
    setCropState(prev => ({ ...prev, videoContainerSize: size }))
  }, [])

  return {
    cropState,
    toggleCropMode,
    handleCropMouseDown,
    handleCropMouseMove,
    handleCropMouseUp,
    updateVideoContainerSize,
  }
} 