"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ImageIcon, Download } from "lucide-react"
import { Screenshot, ScreenshotFormat } from "@/types/camera"

interface ScreenshotModalProps {
  isOpen: boolean
  screenshots: Screenshot[]
  selectedIndex: number
  screenshotFormat: ScreenshotFormat
  isMirrored: boolean
  isCropMode: boolean
  onClose: () => void
  onNavigate: (direction: "prev" | "next") => void
  onDownload: (screenshot: Screenshot) => void
}

export const ScreenshotModal: React.FC<ScreenshotModalProps> = ({
  isOpen,
  screenshots,
  selectedIndex,
  screenshotFormat,
  isMirrored,
  isCropMode,
  onClose,
  onNavigate,
  onDownload,
}) => {
  if (!isOpen || screenshots.length === 0) {
    return null
  }

  const currentScreenshot = screenshots[selectedIndex]

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <ImageIcon className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-lg">Screenshot Preview</h3>
              <p className="text-sm text-slate-600">
                {selectedIndex + 1} of {screenshots.length} •{" "}
                {currentScreenshot?.timestamp.toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="relative">
          {/* Main Image */}
          <div className="flex items-center justify-center bg-gray-50 min-h-[400px] max-h-[60vh] overflow-hidden">
            <img
              src={currentScreenshot?.url || "/placeholder.svg"}
              alt={`Screenshot ${selectedIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Navigation Arrows */}
          {screenshots.length > 1 && (
            <>
              <button
                onClick={() => onNavigate("prev")}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all backdrop-blur-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => onNavigate("next")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all backdrop-blur-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Format: {screenshotFormat.toUpperCase()}</span>
            {isMirrored && (
              <Badge variant="outline" className="text-xs">
                Mirrored
              </Badge>
            )}
            {isCropMode && (
              <Badge variant="outline" className="text-xs">
                Cropped
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-3">
            {screenshots.length > 1 && (
              <div className="flex items-center gap-1">
                {screenshots.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      // This would need to be passed as a prop if we want to support direct navigation
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === selectedIndex ? "bg-blue-600" : "bg-gray-300 hover:bg-gray-400"
                    }`}
                  />
                ))}
              </div>
            )}

            <Button
              onClick={() => onDownload(currentScreenshot)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
} 