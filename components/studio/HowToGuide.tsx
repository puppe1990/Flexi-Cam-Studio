"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function HowToGuide() {
  return (
    <Card className="studio-panel overflow-hidden">
      <CardHeader className="studio-panel-header">
        <CardTitle className="text-2xl flex items-center gap-3">
          <div className="studio-icon-btn">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <span className="text-foreground">How to Use</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-8">
        <div className="space-y-2.5 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <span className="studio-step-num">1.</span>
            <span>
              Choose your preferred aspect ratio (16:9 for landscape, 9:16 for
              vertical/mobile, 4:3 for classic, 1:1 for square)
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="studio-step-num">2.</span>
            <span>
              Use zoom controls to get closer to your subject or fit more in the
              frame
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="studio-step-num">3.</span>
            <span>
              Toggle mirror mode to flip the video horizontally (useful for
              selfie-style recording)
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="studio-step-num">3.1.</span>
            <span>
              Use Light Mode (fullscreen only): Ring light for 16:9/4:3 videos,
              full-screen illumination for 9:16 vertical and 1:1 square videos -
              controls overlay on light when needed
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="studio-step-num">4.</span>
            <span>
              Apply visual effects like blur or pixelation for privacy or
              artistic purposes - choose to apply to entire video or just a
              selected area
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="studio-step-num">5.</span>
            <span>
              Enable "Crop Mode" to select a specific area of the camera feed to
              record
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="studio-step-num">6.</span>
            <span>
              In crop mode, drag the orange rectangle to move it, or drag the
              corners to resize
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="studio-step-num">7.</span>
            <span>
              When using effects, toggle "Apply to: Selected Area" to blur or
              pixelate only a specific region
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="studio-step-num">8.</span>
            <span>
              Click "Take Screenshot" to capture still images in HD (1080p) or
              4K quality (cropped if crop mode is active)
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="studio-step-num">8.1.</span>
            <span>
              Toggle "Quality" between HD and 4K for higher resolution
              screenshots (4K: 3840x2160 for 16:9, 2160x3840 for 9:16, etc.)
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="studio-step-num">8.2.</span>
            <span>
              Screenshots persist across aspect ratio changes and recording
              sessions - only cleared when you manually click "Clear All"
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="studio-step-num">9.</span>
            <span>
              Click on screenshots in the gallery to view them in full size with
              navigation and download options
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="studio-step-num">10.</span>
            <span>
              Click "Start Recording" to begin capturing video with your
              selected settings
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="studio-step-num">11.</span>
            <span>
              Choose your export format (MP4, AVI, MOV, 3GP for WhatsApp
              compatibility)
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="studio-step-num">12.</span>
            <span>Use the playback controls to preview your recording</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="studio-step-num">13.</span>
            <span>
              Click "Edit Video" to trim your recording by setting start and end
              points
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="studio-step-num">14.</span>
            <span>Download your video in your chosen format</span>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="border-t border-border pt-6">
          <h4 className="font-semibold text-foreground mb-4 flex items-center gap-3 text-lg">
            <div className="p-2 bg-muted rounded-lg">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            Keyboard Shortcuts
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="studio-kbd-row">
              <span className="font-medium text-gray-700">
                Toggle Crop Mode
              </span>
              <kbd className="studio-kbd">C</kbd>
            </div>
            <div className="studio-kbd-row">
              <span className="font-medium text-gray-700">Take Screenshot</span>
              <kbd className="studio-kbd">S</kbd>
            </div>
            <div className="studio-kbd-row">
              <span className="font-medium text-gray-700">
                Start/Stop Recording
              </span>
              <div className="flex gap-2">
                <kbd className="studio-kbd">R</kbd>
                <span className="text-gray-400 text-xs">or</span>
                <kbd className="studio-kbd">Space</kbd>
              </div>
            </div>
            <div className="studio-kbd-row">
              <span className="font-medium text-gray-700">
                Toggle Fullscreen
              </span>
              <kbd className="studio-kbd">F</kbd>
            </div>
            <div className="studio-kbd-row">
              <span className="font-medium text-gray-700">Zoom In</span>
              <kbd className="studio-kbd">+</kbd>
            </div>
            <div className="studio-kbd-row">
              <span className="font-medium text-gray-700">Zoom Out</span>
              <kbd className="studio-kbd">-</kbd>
            </div>
            <div className="studio-kbd-row">
              <span className="font-medium text-gray-700">Reset Zoom</span>
              <kbd className="studio-kbd">0</kbd>
            </div>
            <div className="studio-kbd-row">
              <span className="font-medium text-gray-700">Toggle Mirror</span>
              <kbd className="studio-kbd">M</kbd>
            </div>
            <div className="studio-kbd-row">
              <span className="font-medium text-gray-700">
                Toggle Light Mode (Fullscreen)
              </span>
              <kbd className="studio-kbd">L</kbd>
            </div>
            <div className="studio-kbd-row">
              <span className="font-medium text-gray-700">
                Exit Modes/Fullscreen
              </span>
              <kbd className="studio-kbd">Esc</kbd>
            </div>
            <div className="studio-kbd-row">
              <span className="font-medium text-gray-700">
                Navigate Screenshots
              </span>
              <div className="flex gap-2">
                <kbd className="studio-kbd">←</kbd>
                <kbd className="studio-kbd">→</kbd>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-4 text-xs">
            <p className="text-muted-foreground studio-callout studio-callout--info text-left">
              💡 Shortcuts work when not typing in input fields
            </p>
            <p className="text-muted-foreground studio-callout text-left">
              🖱️ When zoomed in, drag to pan the video
            </p>
            <p className="text-muted-foreground studio-callout studio-callout--accent text-left">
              🎨 Purple area shows where effects will be applied
            </p>
            <p className="text-muted-foreground studio-callout studio-callout--warn text-left">
              💡 Light mode: ring for 16:9/4:3, full-screen for 9:16/1:1
              (fullscreen only)
            </p>
            <p className="text-muted-foreground studio-callout text-left">
              📸 4K screenshots: Ultra high-res capture (3840x2160 for 16:9, up
              to 2160x3840 for 9:16)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
