"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ImageIcon, Download } from "lucide-react"
import { Screenshot } from "@/types/camera"

interface ScreenshotGalleryProps {
  screenshots: Screenshot[]
  screenshotCount: number
  onDownloadAll: () => void
  onClearAll: () => void
  onScreenshotClick: (index: number) => void
  onDownloadScreenshot: (screenshot: Screenshot) => void
}

export const ScreenshotGallery: React.FC<ScreenshotGalleryProps> = ({
  screenshots,
  screenshotCount,
  onDownloadAll,
  onClearAll,
  onScreenshotClick,
  onDownloadScreenshot,
}) => {
  if (screenshots.length === 0) {
    return null
  }

  return (
    <Card className="studio-panel overflow-hidden">
      <CardHeader className="studio-panel-header pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-3 font-semibold">
            <div className="studio-icon-btn p-1.5">
              <ImageIcon className="w-4 h-4" />
            </div>
            Screenshots ({screenshotCount})
          </CardTitle>
          <div className="flex items-center gap-2">
            {screenshots.length > 1 && (
              <Button
                onClick={onDownloadAll}
                variant="outline"
                size="sm"
                className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              >
                <Download className="w-4 h-4 mr-1" />
                Download ZIP
              </Button>
            )}
            <Button onClick={onClearAll} variant="outline" size="sm">
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex gap-3 overflow-x-auto pb-2">
          {screenshots.map((screenshot, index) => (
            <div key={screenshot.id} className="flex-shrink-0 group">
              <div className="relative">
                <img
                  src={screenshot.url || "/placeholder.svg"}
                  alt="Screenshot"
                  className="w-24 h-16 object-cover rounded-md border border-border group-hover:border-primary transition-colors cursor-pointer"
                  onClick={() => onScreenshotClick(index)}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all rounded-md flex items-center justify-center">
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onScreenshotClick(index)
                      }}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground p-1 rounded-full"
                      title="Ver"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDownloadScreenshot(screenshot)
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white p-1 rounded-full"
                      title="Baixar"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-1 text-center font-mono">
                {screenshot.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
