"use client"

import React from "react"
// import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Camera, Video } from "lucide-react"
import { Video } from "lucide-react"

// Import custom hooks
// import { useCamera } from "@/hooks/useCamera"
import { useScreenshot } from "@/hooks/useScreenshot"

// Import components
import { ScreenshotGallery } from "@/components/ScreenshotGallery"

export default function CameraRecorderModular() {
  // const { cameraState, initializeCamera } = useCamera()
  const { screenshotState, downloadScreenshot, downloadAllScreenshots, clearScreenshots, openScreenshotModal } = useScreenshot()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center justify-center gap-2">
            <Video className="w-8 h-8 text-blue-600" />
            Camera Recorder & Editor (Modular)
          </h1>
          <p className="text-slate-600">Modular architecture with custom hooks and components</p>
        </div>

        <ScreenshotGallery
          screenshots={screenshotState.screenshots}
          screenshotCount={screenshotState.screenshotCount}
          onDownloadAll={downloadAllScreenshots}
          onClearAll={clearScreenshots}
          onScreenshotClick={openScreenshotModal}
          onDownloadScreenshot={downloadScreenshot}
        />

        <Card>
          <CardHeader>
            <CardTitle>Modular Implementation Complete!</CardTitle>
          </CardHeader>
          <CardContent>
            <p>The large page.tsx file has been broken down into:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Types:</strong> types/camera.ts</li>
              <li><strong>Utilities:</strong> lib/utils/video.ts</li>
              <li><strong>Hooks:</strong> hooks/useCamera.ts, useScreenshot.ts, useCrop.ts, useZoom.ts, useEffects.ts</li>
              <li><strong>Components:</strong> components/ScreenshotGallery.tsx, ScreenshotModal.tsx, ControlPanels.tsx</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 