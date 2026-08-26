"use client"

import { Camera } from "lucide-react"

import type { StudioStageModel } from "@/components/studio/studio-stage-model"

export function StudioCaptureFeed({ stage }: { stage: StudioStageModel }) {
  const {
    effectIntensity,
    handlePipMouseDown,
    isEffectCropMode,
    isMirrored,
    isMounted,
    pipPosition,
    recordingMode,
    recordingState,
    screenStream,
    screenVideoRef,
    videoEffect,
    videoRef,
  } = stage

  return (
    <>
      {/* Screen Recording Mode */}
      {recordingMode === "screen" && isMounted ? (
        <div className="relative w-full h-full">
          {screenStream ? (
            <video
              ref={screenVideoRef}
              className="w-full h-full object-contain"
              autoPlay
              muted={
                recordingState === "idle" || recordingState === "recording"
              }
              playsInline
            />
          ) : (
            <div className="w-full h-full bg-gray-900 flex items-center justify-center">
              <div className="text-white text-center">
                <svg
                  className="w-16 h-16 mx-auto mb-4 opacity-50"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-lg opacity-75">
                  Click "Screen" to start screen capture
                </p>
              </div>
            </div>
          )}
        </div>
      ) : recordingMode === "pip" && isMounted ? (
        /* Picture-in-Picture Mode */
        <div className="relative w-full h-full">
          {screenStream ? (
            <>
              {/* Screen capture background */}
              <video
                ref={screenVideoRef}
                className="w-full h-full object-contain"
                autoPlay
                muted={
                  recordingState === "idle" || recordingState === "recording"
                }
                playsInline
              />
              {/* Webcam Overlay - positioned relative to screen video */}
              <div
                className="absolute border-2 border-white rounded-lg overflow-hidden shadow-lg cursor-move z-10"
                style={{
                  left: `calc(${pipPosition.x}% - ${pipPosition.width / 2}%)`,
                  top: `calc(${pipPosition.y}% - ${pipPosition.height / 2}%)`,
                  width: `${Math.min(pipPosition.width, 40)}%`,
                  height: `${Math.min(pipPosition.height, 40)}%`,
                  minWidth: "120px",
                  minHeight: "90px",
                  maxWidth: "400px",
                  maxHeight: "300px",
                }}
                onMouseDown={(e) => handlePipMouseDown(e, "drag")}
              >
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  style={{
                    transform: isMirrored ? "scaleX(-1)" : "none",
                  }}
                  autoPlay
                  muted={
                    recordingState === "idle" || recordingState === "recording"
                  }
                  playsInline
                />
                {/* Resize handle */}
                <div
                  className="absolute bottom-0 right-0 w-4 h-4 bg-white bg-opacity-70 cursor-se-resize hover:bg-opacity-100 transition-all"
                  onMouseDown={(e) => handlePipMouseDown(e, "resize")}
                  style={{
                    clipPath: "polygon(100% 0, 0 100%, 100% 100%)",
                  }}
                />
                {/* Drag handle indicator */}
                <div className="absolute top-1 left-1 text-white text-xs opacity-60 pointer-events-none">
                  ⋮⋮
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-gray-900 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="relative">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 opacity-50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <Camera className="w-8 h-8 absolute -bottom-1 -right-1 opacity-75" />
                </div>
                <p className="text-lg opacity-75">
                  Click "PIP" to start Picture-in-Picture
                </p>
              </div>
            </div>
          )}
        </div>
      ) : /* Webcam Mode */
      isMounted ? (
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          style={{
            transform: isMirrored ? "scaleX(-1)" : "none",
            filter:
              videoEffect === "blur" && !isEffectCropMode
                ? `blur(${effectIntensity * 2}px)`
                : "none",
            imageRendering:
              videoEffect === "pixelate" && !isEffectCropMode
                ? "pixelated"
                : "auto",
          }}
          autoPlay
          muted={recordingState === "idle" || recordingState === "recording"}
          playsInline
        />
      ) : (
        <div className="w-full h-full bg-gray-900 flex items-center justify-center">
          <div className="text-white text-center">
            <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg opacity-75">Camera Loading...</p>
          </div>
        </div>
      )}
    </>
  )
}
