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
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Recent Screenshots ({screenshotCount})
          </CardTitle>
          <div className="flex items-center gap-2">
            {screenshots.length > 1 && (
              <Button
                onClick={onDownloadAll}
                variant="outline"
                size="sm"
                className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
              >
                <Download className="w-4 h-4 mr-1" />
                Download All ZIP
              </Button>
            )}
            <Button onClick={onClearAll} variant="outline" size="sm">
              Clear All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {screenshots.map((screenshot, index) => (
            <div key={screenshot.id} className="flex-shrink-0 group">
              <div className="relative">
                <img
                  src={screenshot.url || "/placeholder.svg"}
                  alt="Screenshot"
                  className="w-24 h-16 object-cover rounded border-2 border-transparent group-hover:border-blue-400 transition-all cursor-pointer"
                  onClick={() => onScreenshotClick(index)}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded flex items-center justify-center">
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onScreenshotClick(index)
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded"
                      title="View"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      className="bg-green-500 hover:bg-green-600 text-white p-1 rounded"
                      title="Download"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="text-xs text-slate-500 mt-1 text-center">
                {screenshot.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 