import { Screenshot } from "@/types/camera"

export const SCREENSHOT_STORAGE_KEY = "flexicam-screenshots"

type StoredScreenshot = {
  id: string
  url: string
  timestamp: string
}

function getLocalStorage(): Storage | null {
  if (typeof window === "undefined" || !window.localStorage) {
    return null
  }
  return window.localStorage
}

function isPersistableUrl(url: unknown): url is string {
  return typeof url === "string" && url.startsWith("data:image/")
}

function isStoredScreenshot(value: unknown): value is StoredScreenshot {
  if (!value || typeof value !== "object") return false
  const item = value as Record<string, unknown>
  return (
    typeof item.id === "string" &&
    isPersistableUrl(item.url) &&
    typeof item.timestamp === "string" &&
    !Number.isNaN(Date.parse(item.timestamp))
  )
}

function isQuotaExceeded(error: unknown): boolean {
  if (!error || typeof error !== "object") return false
  const { name, code } = error as { name?: string; code?: number }
  return (
    name === "QuotaExceededError" ||
    name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    code === 22 ||
    code === 1014
  )
}

function serialize(screenshots: Screenshot[]): string {
  const payload: StoredScreenshot[] = screenshots.map((screenshot) => ({
    id: screenshot.id,
    url: screenshot.url,
    timestamp: screenshot.timestamp.toISOString(),
  }))
  return JSON.stringify(payload)
}

/** Restore gallery photos from localStorage. Returns [] on SSR, missing key, or corrupt JSON.
 *  Usage: `const photos = loadScreenshots()` after mount. */
export function loadScreenshots(): Screenshot[] {
  const storage = getLocalStorage()
  if (!storage) return []

  try {
    const raw = storage.getItem(SCREENSHOT_STORAGE_KEY)
    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter(isStoredScreenshot).map((item) => ({
      id: item.id,
      url: item.url,
      timestamp: new Date(item.timestamp),
    }))
  } catch {
    return []
  }
}

/** Persist photos as data URLs. Drops oldest entries on QuotaExceededError.
 *  Usage: `saveScreenshots([newest, ...prev])` — newest first. */
export function saveScreenshots(screenshots: Screenshot[]): Screenshot[] {
  const storage = getLocalStorage()
  if (!storage) return []

  let toSave = screenshots.filter(
    (screenshot) =>
      typeof screenshot.id === "string" && isPersistableUrl(screenshot.url)
  )

  if (toSave.length === 0) {
    storage.removeItem(SCREENSHOT_STORAGE_KEY)
    return []
  }

  while (toSave.length > 0) {
    try {
      storage.setItem(SCREENSHOT_STORAGE_KEY, serialize(toSave))
      return toSave
    } catch (error) {
      if (!isQuotaExceeded(error)) {
        console.error("Failed to save screenshots to localStorage:", error)
        return []
      }

      if (toSave.length === 1) {
        storage.removeItem(SCREENSHOT_STORAGE_KEY)
        console.error("Screenshot is too large to save in localStorage")
        return []
      }

      toSave = toSave.slice(0, -1)
    }
  }

  storage.removeItem(SCREENSHOT_STORAGE_KEY)
  return []
}

/** Remove the gallery key. Usage: call from Clear All, not on unmount. */
export function clearStoredScreenshots(): void {
  const storage = getLocalStorage()
  if (!storage) return
  storage.removeItem(SCREENSHOT_STORAGE_KEY)
}

/** Convert a capture blob into a persistable `data:image/...` URL.
 *  Usage: `const url = await blobToDataUrl(blob)` then store `{ id, url, timestamp }`. */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result)
        return
      }
      reject(new Error("Failed to convert photo to a data URL"))
    }
    reader.onerror = () => {
      reject(reader.error ?? new Error("Failed to read photo blob"))
    }
    reader.readAsDataURL(blob)
  })
}
