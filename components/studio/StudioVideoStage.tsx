"use client"

import type { StudioStageModel } from "@/components/studio/studio-stage-model"
import { StudioCaptureFeed } from "@/components/studio/StudioCaptureFeed"
import { StudioCropOverlays } from "@/components/studio/StudioCropOverlays"
import { StudioStageChrome } from "@/components/studio/StudioStageChrome"
import { StudioCaptureOverlays } from "@/components/studio/StudioCaptureOverlays"
import { StudioFullscreenHud } from "@/components/studio/StudioFullscreenHud"

export function StudioVideoStage({ stage }: { stage: StudioStageModel }) {
  const {
    aspectRatio,
    handlePanStart,
    isCropMode,
    isEffectCropMode,
    isFullscreen,
    isPanning,
    panOffset,
    recordingMode,
    videoContainerRef,
    zoomLevel,
  } = stage

  return (
    <div
      ref={videoContainerRef}
      className={`studio-video-frame relative overflow-hidden ${
        !isFullscreen
          ? "w-full"
          : "fixed inset-0 z-50 rounded-none flex items-center justify-center"
      }`}
      style={
        isFullscreen
          ? {
              backgroundColor: "black",
            }
          : {
              aspectRatio:
                aspectRatio === "16:9"
                  ? "16/9"
                  : aspectRatio === "9:16"
                    ? "9/16"
                    : aspectRatio === "4:3"
                      ? "4/3"
                      : "1/1",
            }
      }
    >
      <div
        className={
          isFullscreen
            ? aspectRatio === "16:9"
              ? "w-full h-full max-h-screen"
              : aspectRatio === "9:16"
                ? "h-full max-h-screen w-auto max-w-[56.25vh]" // 9/16 of viewport height
                : aspectRatio === "4:3"
                  ? "h-full max-h-screen w-auto max-w-[133.33vh]" // 4/3 of viewport height
                  : "h-full max-h-screen w-auto max-w-[100vh]" // 1:1 square
            : "w-full h-full"
        }
        style={{
          transform:
            recordingMode === "screen"
              ? "none"
              : `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
          cursor:
            recordingMode === "screen"
              ? "default"
              : zoomLevel > 1 && !isCropMode && !isEffectCropMode
                ? isPanning
                  ? "grabbing"
                  : "grab"
                : "default",
        }}
        onMouseDown={recordingMode === "screen" ? undefined : handlePanStart}
      >
        <StudioCaptureFeed stage={stage} />
      </div>
      <StudioCropOverlays stage={stage} />
      <StudioStageChrome stage={stage} />
      <StudioCaptureOverlays stage={stage} />
      <StudioFullscreenHud stage={stage} />
    </div>
  )
}
