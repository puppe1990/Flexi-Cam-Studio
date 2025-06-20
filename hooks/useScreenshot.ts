import { useState, useRef, useCallback } from "react"
import { ScreenshotState, Screenshot, ScreenshotFormat } from "@/types/camera"
import JSZip from "jszip"

export const useScreenshot = () => {
  const [screenshotState, setScreenshotState] = useState<ScreenshotState>({
    screenshotFormat: "png",
    screenshots: [],
    showFlash: false,
    screenshotCount: 0,
    screenshotTimer: 0,
    isTimerActive: false,
    timerCountdown: 0,
    isScreenshotModalOpen: false,
    selectedScreenshotIndex: 0,
  })

  const screenshotCanvasRef = useRef<HTMLCanvasElement>(null)

  const setShowFlash = useCallback((show: boolean) => {
    setScreenshotState(prev => ({ ...prev, showFlash: show }))
  }, [])

  const addScreenshot = useCallback((screenshot: Screenshot) => {
    setScreenshotState(prev => ({
      ...prev,
      screenshots: [screenshot, ...prev.screenshots], // Keep all screenshots
      screenshotCount: prev.screenshotCount + 1,
    }))
  }, [])

  const downloadScreenshot = useCallback((screenshot: Screenshot) => {
    try {
      const a = document.createElement("a")
      a.href = screenshot.url
      a.download = `screenshot-${screenshot.timestamp.getTime()}.${screenshotState.screenshotFormat}`
      a.style.display = "none"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error downloading screenshot:", error)
      window.open(screenshot.url, "_blank")
    }
  }, [screenshotState.screenshotFormat])

  const downloadAllScreenshots = useCallback(async () => {
    if (screenshotState.screenshots.length === 0) return

    try {
      const zip = new JSZip()

      for (let i = 0; i < screenshotState.screenshots.length; i++) {
        const screenshot = screenshotState.screenshots[i]
        const response = await fetch(screenshot.url)
        const blob = await response.blob()
        const filename = `screenshot-${screenshot.timestamp.getTime()}-${i + 1}.${screenshotState.screenshotFormat}`
        zip.file(filename, blob)
      }

      const zipBlob = await zip.generateAsync({ type: "blob" })
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
      screenshotState.screenshots.forEach((screenshot, index) => {
        setTimeout(() => {
          downloadScreenshot(screenshot)
        }, index * 500)
      })
    }
  }, [screenshotState.screenshots, screenshotState.screenshotFormat, downloadScreenshot])

  const clearScreenshots = useCallback(() => {
    setScreenshotState(prev => {
      prev.screenshots.forEach((screenshot) => {
        URL.revokeObjectURL(screenshot.url)
      })
      return { ...prev, screenshots: [] }
    })
  }, [])

  const openScreenshotModal = useCallback((index: number) => {
    if (screenshotState.screenshots.length > 0 && index >= 0 && index < screenshotState.screenshots.length) {
      setScreenshotState(prev => ({
        ...prev,
        selectedScreenshotIndex: index,
        isScreenshotModalOpen: true,
      }))
    }
  }, [screenshotState.screenshots.length])

  const closeScreenshotModal = useCallback(() => {
    setScreenshotState(prev => ({ ...prev, isScreenshotModalOpen: false }))
  }, [])

  const navigateScreenshot = useCallback((direction: "prev" | "next") => {
    setScreenshotState(prev => ({
      ...prev,
      selectedScreenshotIndex: direction === "prev" 
        ? prev.selectedScreenshotIndex > 0 ? prev.selectedScreenshotIndex - 1 : prev.screenshots.length - 1
        : prev.selectedScreenshotIndex < prev.screenshots.length - 1 ? prev.selectedScreenshotIndex + 1 : 0
    }))
  }, [])

  const updateScreenshotFormat = useCallback((format: ScreenshotFormat) => {
    setScreenshotState(prev => ({ ...prev, screenshotFormat: format }))
  }, [])

  const updateScreenshotTimer = useCallback((timer: number) => {
    setScreenshotState(prev => ({ ...prev, screenshotTimer: timer }))
  }, [])

  const startTimerCountdown = useCallback((onComplete: () => void) => {
    const countdown = screenshotState.screenshotTimer
    setScreenshotState(prev => ({
      ...prev,
      isTimerActive: true,
      timerCountdown: countdown,
    }))

    const countdownInterval = setInterval(() => {
      setScreenshotState(prev => {
        const newCountdown = prev.timerCountdown - 1
        if (newCountdown <= 0) {
          clearInterval(countdownInterval)
          onComplete()
          return {
            ...prev,
            isTimerActive: false,
            timerCountdown: 0,
          }
        }
        return { ...prev, timerCountdown: newCountdown }
      })
    }, 1000)

    return countdownInterval
  }, [screenshotState.screenshotTimer])

  const cancelTimer = useCallback(() => {
    setScreenshotState(prev => ({
      ...prev,
      isTimerActive: false,
      timerCountdown: 0,
    }))
  }, [])

  return {
    screenshotState,
    screenshotCanvasRef,
    setShowFlash,
    addScreenshot,
    downloadScreenshot,
    downloadAllScreenshots,
    clearScreenshots,
    openScreenshotModal,
    closeScreenshotModal,
    navigateScreenshot,
    updateScreenshotFormat,
    updateScreenshotTimer,
    startTimerCountdown,
    cancelTimer,
  }
} 