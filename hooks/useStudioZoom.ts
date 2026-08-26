import {
  useCallback,
  useEffect,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react"

export function useStudioZoom(canPan: boolean) {
  const [zoomLevel, setZoomLevel] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [isMirrored, setIsMirrored] = useState(false)

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

  const toggleMirror = useCallback(() => {
    setIsMirrored((prev) => !prev)
  }, [])

  const handlePanStart = useCallback(
    (e: ReactMouseEvent) => {
      if (zoomLevel > 1 && canPan) {
        setIsPanning(true)
        setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
      }
    },
    [zoomLevel, panOffset, canPan]
  )

  const handlePanMove = useCallback(
    (e: MouseEvent) => {
      if (!isPanning || zoomLevel <= 1) return
      const maxPan = 100 * (zoomLevel - 1)
      const clampedX = Math.max(
        -maxPan,
        Math.min(maxPan, e.clientX - panStart.x)
      )
      const clampedY = Math.max(
        -maxPan,
        Math.min(maxPan, e.clientY - panStart.y)
      )
      setPanOffset({ x: clampedX, y: clampedY })
    },
    [isPanning, zoomLevel, panStart]
  )

  const handlePanEnd = useCallback(() => {
    setIsPanning(false)
  }, [])

  useEffect(() => {
    if (!isPanning) return
    document.addEventListener("mousemove", handlePanMove)
    document.addEventListener("mouseup", handlePanEnd)
    return () => {
      document.removeEventListener("mousemove", handlePanMove)
      document.removeEventListener("mouseup", handlePanEnd)
    }
  }, [isPanning, handlePanMove, handlePanEnd])

  return {
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
  }
}
