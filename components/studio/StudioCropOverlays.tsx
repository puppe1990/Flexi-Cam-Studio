"use client"

import type { VideoEffect } from "@/types/camera"
import type { StudioStageModel } from "@/components/studio/studio-stage-model"

export function StudioCropOverlays({ stage }: { stage: StudioStageModel }) {
  const {
    cropArea,
    effectCropArea,
    getVideoDisplayArea,
    handleCropMouseDown,
    handleEffectCropMouseDown,
    isCropMode,
    isEffectCropMode,
    isMounted,
    previewEffectCanvasRef,
    recordingState,
    videoEffect,
  } = stage

  return (
    <>
      {/* Crop Overlay */}
      {isMounted &&
        isCropMode &&
        recordingState === "idle" &&
        (() => {
          const videoArea = getVideoDisplayArea()
          const cropOverlay = (
            <div
              key="crop-overlay"
              className="absolute inset-0 pointer-events-none"
            >
              {/* Crop area overlay - positioned relative to actual video display area */}
              <div
                className="absolute border-2 border-orange-400 bg-orange-400/10 cursor-move pointer-events-auto"
                style={{
                  left: `${videoArea.videoOffsetX + cropArea.x * videoArea.displayedVideoWidth}px`,
                  top: `${videoArea.videoOffsetY + cropArea.y * videoArea.displayedVideoHeight}px`,
                  width: `${cropArea.width * videoArea.displayedVideoWidth}px`,
                  height: `${cropArea.height * videoArea.displayedVideoHeight}px`,
                }}
                onMouseDown={(e) => handleCropMouseDown(e)}
              >
                {/* Resize handles */}
                <div
                  className="absolute -top-1 -left-1 w-3 h-3 bg-orange-400 border border-white cursor-nw-resize pointer-events-auto"
                  onMouseDown={(e) => handleCropMouseDown(e, "nw")}
                />
                <div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 border border-white cursor-ne-resize pointer-events-auto"
                  onMouseDown={(e) => handleCropMouseDown(e, "ne")}
                />
                <div
                  className="absolute -bottom-1 -left-1 w-3 h-3 bg-orange-400 border border-white cursor-sw-resize pointer-events-auto"
                  onMouseDown={(e) => handleCropMouseDown(e, "sw")}
                />
                <div
                  className="absolute -bottom-1 -right-1 w-3 h-3 bg-orange-400 border border-white cursor-se-resize pointer-events-auto"
                  onMouseDown={(e) => handleCropMouseDown(e, "se")}
                />

                {/* Center indicator */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-xs bg-orange-500 px-2 py-1 rounded pointer-events-none">
                  Crop Area
                </div>
              </div>

              {/* Dimmed overlay for non-crop areas */}
              <div className="absolute inset-0 bg-black/40 pointer-events-none">
                <div
                  className="absolute bg-transparent"
                  style={{
                    left: `${videoArea.videoOffsetX + cropArea.x * videoArea.displayedVideoWidth}px`,
                    top: `${videoArea.videoOffsetY + cropArea.y * videoArea.displayedVideoHeight}px`,
                    width: `${cropArea.width * videoArea.displayedVideoWidth}px`,
                    height: `${cropArea.height * videoArea.displayedVideoHeight}px`,
                    boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.4)`,
                  }}
                />
              </div>
            </div>
          )
          return cropOverlay
        })()}

      {/* Real-time Effect Preview Canvas */}
      <canvas
        ref={previewEffectCanvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          display: "none",
          zIndex: 5,
        }}
      />

      {/* Effect Crop Overlay */}
      {isMounted &&
        isEffectCropMode &&
        recordingState === "idle" &&
        videoEffect !== ("none" as VideoEffect) &&
        (() => {
          const videoArea = getVideoDisplayArea()
          const effectOverlay = (
            <div
              key="effect-crop-overlay"
              className="absolute inset-0 pointer-events-none"
              style={{ zIndex: 10 }}
            >
              {/* Effect crop area overlay - positioned relative to actual video display area */}
              <div
                className="absolute border-2 border-purple-400 bg-purple-400/10 cursor-move pointer-events-auto"
                style={{
                  left: `${videoArea.videoOffsetX + effectCropArea.x * videoArea.displayedVideoWidth}px`,
                  top: `${videoArea.videoOffsetY + effectCropArea.y * videoArea.displayedVideoHeight}px`,
                  width: `${effectCropArea.width * videoArea.displayedVideoWidth}px`,
                  height: `${effectCropArea.height * videoArea.displayedVideoHeight}px`,
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

              {/* Dimmed overlay for non-effect areas */}
              <div className="absolute inset-0 bg-black/20 pointer-events-none">
                <div
                  className="absolute bg-transparent"
                  style={{
                    left: `${videoArea.videoOffsetX + effectCropArea.x * videoArea.displayedVideoWidth}px`,
                    top: `${videoArea.videoOffsetY + effectCropArea.y * videoArea.displayedVideoHeight}px`,
                    width: `${effectCropArea.width * videoArea.displayedVideoWidth}px`,
                    height: `${effectCropArea.height * videoArea.displayedVideoHeight}px`,
                    boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.2)`,
                  }}
                />
              </div>
            </div>
          )
          return effectOverlay
        })()}
    </>
  )
}
