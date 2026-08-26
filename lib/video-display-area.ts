export type VideoDisplayArea = {
  displayedVideoWidth: number
  displayedVideoHeight: number
  videoOffsetX: number
  videoOffsetY: number
  containerWidth: number
  containerHeight: number
}

const EMPTY_AREA: VideoDisplayArea = {
  displayedVideoWidth: 0,
  displayedVideoHeight: 0,
  videoOffsetX: 0,
  videoOffsetY: 0,
  containerWidth: 0,
  containerHeight: 0,
}

/** Fit a video rectangle inside a container with letterbox/pillarbox.
 *  Usage: `computeVideoDisplayArea({ videoWidth: 1920, videoHeight: 1080, containerWidth: 400, containerHeight: 400 })` */
export function computeVideoDisplayArea(input: {
  videoWidth: number
  videoHeight: number
  containerWidth: number
  containerHeight: number
}): VideoDisplayArea {
  const { videoWidth, videoHeight, containerWidth, containerHeight } = input
  if (!containerWidth || !containerHeight) return EMPTY_AREA

  const videoAspectRatio = videoWidth / videoHeight
  const containerAspectRatio = containerWidth / containerHeight
  const aspectRatioTolerance = 0.01
  const aspectRatioDiff = Math.abs(videoAspectRatio - containerAspectRatio)

  if (aspectRatioDiff < aspectRatioTolerance) {
    return {
      displayedVideoWidth: containerWidth,
      displayedVideoHeight: containerHeight,
      videoOffsetX: 0,
      videoOffsetY: 0,
      containerWidth,
      containerHeight,
    }
  }

  if (videoAspectRatio > containerAspectRatio) {
    const displayedVideoWidth = containerWidth
    const displayedVideoHeight = containerWidth / videoAspectRatio
    return {
      displayedVideoWidth,
      displayedVideoHeight,
      videoOffsetX: 0,
      videoOffsetY: (containerHeight - displayedVideoHeight) / 2,
      containerWidth,
      containerHeight,
    }
  }

  const displayedVideoHeight = containerHeight
  const displayedVideoWidth = containerHeight * videoAspectRatio
  return {
    displayedVideoWidth,
    displayedVideoHeight,
    videoOffsetX: (containerWidth - displayedVideoWidth) / 2,
    videoOffsetY: 0,
    containerWidth,
    containerHeight,
  }
}
