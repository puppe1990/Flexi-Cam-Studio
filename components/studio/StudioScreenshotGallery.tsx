"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, ImageIcon } from "lucide-react"
import type { Screenshot } from "@/types/camera"

type StudioScreenshotGalleryProps = {
  screenshots: Screenshot[]
  screenshotCount: number
  isDownloadingAll: boolean
  downloadProgress: number
  onDownloadAll: () => void
  onClearAll: () => void
  onScreenshotClick: (index: number) => void
  onDownloadScreenshot: (screenshot: Screenshot) => void
}

export function StudioScreenshotGallery({
  screenshots,
  screenshotCount,
  isDownloadingAll,
  downloadProgress,
  onDownloadAll,
  onClearAll,
  onScreenshotClick,
  onDownloadScreenshot,
}: StudioScreenshotGalleryProps) {
  if (screenshots.length === 0) return null

  return (
    <Card className="studio-panel overflow-hidden">
      <CardHeader className="studio-panel-header pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-3">
            <div className="studio-icon-btn">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-foreground">
              Recent Screenshots ({screenshotCount})
            </span>
          </CardTitle>
          <div className="flex items-center gap-3">
            {screenshots.length > 1 && (
              <Button
                onClick={onDownloadAll}
                variant="outline"
                size="sm"
                disabled={isDownloadingAll}
                className={`shadow-sm transition-all duration-300 ${
                  isDownloadingAll
                    ? "border-border text-muted-foreground cursor-not-allowed opacity-60"
                    : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                }`}
              >
                {isDownloadingAll ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    {downloadProgress < 60
                      ? `Preparing... ${downloadProgress}%`
                      : downloadProgress < 95
                        ? `Creating ZIP... ${downloadProgress}%`
                        : `Downloading... ${downloadProgress}%`}
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download All ({screenshots.length}) ZIP
                  </>
                )}
              </Button>
            )}
            <Button
              onClick={onClearAll}
              variant="outline"
              size="sm"
              className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all duration-300"
            >
              Clear All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Grid Layout for Better Viewing */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-4 max-h-96 overflow-y-auto">
          {screenshots.map((screenshot, index) => (
            <div key={screenshot.id} className="group">
              <div className="relative">
                <img
                  src={screenshot.url || "/placeholder.svg"}
                  alt={`Screenshot ${index + 1}`}
                  className="w-full aspect-[3/4] object-cover bg-muted rounded-lg border-2 border-transparent group-hover:border-primary transition-all duration-300 cursor-pointer shadow-sm group-hover:shadow-lg"
                  onClick={() => onScreenshotClick(index)}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-lg flex items-center justify-center">
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onScreenshotClick(index)
                      }}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground p-1.5 rounded-full transition-all duration-200"
                      title="View"
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
                      className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded-full transition-all duration-200"
                      title="Download"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                {/* Screenshot Number Badge */}
                <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                  {index + 1}
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-1.5 text-center font-mono truncate">
                {screenshot.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>

        {/* Show total count and scroll hint if many screenshots */}
        {screenshots.length > 12 && (
          <div className="mt-4 text-center text-sm text-muted-foreground studio-callout studio-callout--info text-left">
            📸 Showing all {screenshots.length} screenshots • Scroll up/down to
            see more • Click "Download All" to get ZIP file
          </div>
        )}
      </CardContent>
    </Card>
  )
}
