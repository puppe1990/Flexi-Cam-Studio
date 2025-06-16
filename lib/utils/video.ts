import { ExportFormat } from "@/types/camera"

export const downloadBlob = (blob: Blob, filename: string, exportFormat: ExportFormat) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  let finalFilename = filename
  let extension = exportFormat

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
}

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

export const checkVideoSupport = () => {
  // Check WebCodecs support
  const webCodecsSupported = "VideoEncoder" in window && "VideoDecoder" in window && "AudioEncoder" in window

  // Check MP4 recording support
  const mp4Supported =
    MediaRecorder.isTypeSupported("video/mp4") || MediaRecorder.isTypeSupported("video/mp4;codecs=avc1")

  return {
    webCodecsSupported,
    mp4RecordingSupported: mp4Supported,
  }
}

export const calculateVideoAspectRatio = (
  videoWidth: number,
  videoHeight: number,
  containerWidth: number,
  containerHeight: number,
) => {
  const videoAspectRatio = videoWidth / videoHeight
  const containerAspectRatio = containerWidth / containerHeight

  let displayedVideoWidth: number
  let displayedVideoHeight: number
  let videoOffsetX = 0
  let videoOffsetY = 0

  if (videoAspectRatio > containerAspectRatio) {
    displayedVideoWidth = containerWidth
    displayedVideoHeight = containerWidth / videoAspectRatio
    videoOffsetX = 0
    videoOffsetY = (containerHeight - displayedVideoHeight) / 2
  } else {
    displayedVideoWidth = containerHeight * videoAspectRatio
    displayedVideoHeight = containerHeight
    videoOffsetX = (containerWidth - displayedVideoWidth) / 2
    videoOffsetY = 0
  }

  return {
    displayedVideoWidth,
    displayedVideoHeight,
    videoOffsetX,
    videoOffsetY,
  }
}

export const applyManualBlur = (imageData: ImageData, radius: number): ImageData => {
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
} 