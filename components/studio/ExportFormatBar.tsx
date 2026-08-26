"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ExportFormat, RecordingState } from "@/types/camera"

type ExportFormatBarProps = {
  recordingState: RecordingState
  exportFormat: ExportFormat
  onExportFormatChange: (format: ExportFormat) => void
  mp4RecordingSupported: boolean
  webCodecsSupported: boolean
}

export function ExportFormatBar({
  recordingState,
  exportFormat,
  onExportFormatChange,
  mp4RecordingSupported,
  webCodecsSupported,
}: ExportFormatBarProps) {
  if (recordingState !== "stopped" && recordingState !== "editing") return null

  return (
    <Card className="studio-panel overflow-hidden">
      <CardContent className="pt-6">
        <div className="flex items-center justify-center gap-6">
          <label className="text-sm font-semibold text-muted-foreground">
            Export Format:
          </label>
          <Select
            value={exportFormat}
            onValueChange={(value: ExportFormat) => onExportFormatChange(value)}
          >
            <SelectTrigger className="w-40 h-10 bg-background border-border rounded-lg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border rounded-lg shadow-xl">
              <SelectItem value="webm">WebM</SelectItem>
              <SelectItem value="mp4">MP4 (WhatsApp)</SelectItem>
              <SelectItem value="avi">AVI (WhatsApp)</SelectItem>
              <SelectItem value="mov">MOV (WhatsApp)</SelectItem>
              <SelectItem value="3gp">3GP (WhatsApp)</SelectItem>
            </SelectContent>
          </Select>

          {exportFormat === "mp4" && (
            <Badge
              variant="secondary"
              className="border-primary/30 bg-primary/10 text-primary"
            >
              {mp4RecordingSupported ? "Native" : "Converted"}
            </Badge>
          )}
        </div>

        {exportFormat === "mp4" &&
          !mp4RecordingSupported &&
          !webCodecsSupported && (
            <div className="mt-4 studio-callout studio-callout--warn text-left">
              <div className="flex items-center justify-center gap-2 mb-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span className="font-semibold">Note</span>
              </div>
              MP4 export will use conversion method (may have compatibility
              limitations)
            </div>
          )}
        {(exportFormat === "mp4" ||
          exportFormat === "avi" ||
          exportFormat === "mov" ||
          exportFormat === "3gp") && (
          <div className="mt-4 studio-callout studio-callout--ok text-left">
            <div className="flex items-center justify-center gap-2 mb-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-semibold">Compatible</span>
            </div>
            This format is compatible with WhatsApp
            {exportFormat === "3gp" && " (optimized for mobile networks)"}
          </div>
        )}
        {(exportFormat === "avi" ||
          exportFormat === "mov" ||
          exportFormat === "3gp") && (
          <div className="mt-4 studio-callout studio-callout--info text-left">
            <div className="flex items-center justify-center gap-2 mb-1">
              <svg
                className="w-4 h-4"
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
              <span className="font-semibold">Info</span>
            </div>
            {exportFormat.toUpperCase()} format may be saved as MP4 due to
            browser limitations, but the file extension will be .{exportFormat}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
