"use client"

import type { RefObject } from "react"

type HiddenCaptureSurfacesProps = {
  canvasRef: RefObject<HTMLCanvasElement | null>
  screenshotCanvasRef: RefObject<HTMLCanvasElement | null>
  cropCanvasRef: RefObject<HTMLCanvasElement | null>
  effectCanvasRef: RefObject<HTMLCanvasElement | null>
  pipCanvasRef: RefObject<HTMLCanvasElement | null>
  screenVideoRef: RefObject<HTMLVideoElement | null>
}

export function HiddenCaptureSurfaces({
  canvasRef,
  screenshotCanvasRef,
  cropCanvasRef,
  effectCanvasRef,
  pipCanvasRef,
  screenVideoRef,
}: HiddenCaptureSurfacesProps) {
  return (
    <>
      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={screenshotCanvasRef} className="hidden" />
      <canvas ref={cropCanvasRef} className="hidden" />
      <canvas ref={effectCanvasRef} className="hidden" />
      <canvas ref={pipCanvasRef} className="hidden" />
      {/* Hidden video elements for screen capture */}
      <video
        ref={screenVideoRef}
        className="hidden"
        autoPlay
        muted
        playsInline
      />
      {/* Preview effect canvas is already in the video container */}
    </>
  )
}
