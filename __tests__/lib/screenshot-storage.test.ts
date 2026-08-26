import { afterEach, describe, expect, it, vi } from "vitest"
import {
  SCREENSHOT_STORAGE_KEY,
  blobToDataUrl,
  clearStoredScreenshots,
  loadScreenshots,
  saveScreenshots,
} from "@/lib/screenshot-storage"
import { Screenshot } from "@/types/camera"

const tinyPng =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="

function makeScreenshot(overrides: Partial<Screenshot> = {}): Screenshot {
  return {
    id: "screenshot-1",
    url: tinyPng,
    timestamp: new Date("2026-08-26T12:00:00.000Z"),
    ...overrides,
  }
}

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe("saveScreenshots / loadScreenshots", () => {
  it("persists screenshots to localStorage and restores them with Date timestamps", () => {
    const screenshots = [
      makeScreenshot({ id: "shot-a" }),
      makeScreenshot({
        id: "shot-b",
        timestamp: new Date("2026-08-26T13:00:00.000Z"),
      }),
    ]

    saveScreenshots(screenshots)

    const raw = localStorage.getItem(SCREENSHOT_STORAGE_KEY)
    expect(raw).toBeTruthy()
    expect(JSON.parse(raw as string)).toEqual([
      {
        id: "shot-a",
        url: tinyPng,
        timestamp: "2026-08-26T12:00:00.000Z",
      },
      {
        id: "shot-b",
        url: tinyPng,
        timestamp: "2026-08-26T13:00:00.000Z",
      },
    ])

    const restored = loadScreenshots()
    expect(restored).toHaveLength(2)
    expect(restored[0].id).toBe("shot-a")
    expect(restored[0].url).toBe(tinyPng)
    expect(restored[0].timestamp).toBeInstanceOf(Date)
    expect(restored[0].timestamp.toISOString()).toBe("2026-08-26T12:00:00.000Z")
    expect(restored[1].id).toBe("shot-b")
  })

  it("returns an empty list when nothing is stored", () => {
    expect(loadScreenshots()).toEqual([])
  })

  it("returns an empty list when stored JSON is invalid", () => {
    localStorage.setItem(SCREENSHOT_STORAGE_KEY, "{not-json")
    expect(loadScreenshots()).toEqual([])
  })

  it("skips entries that are not persistable image data URLs", () => {
    localStorage.setItem(
      SCREENSHOT_STORAGE_KEY,
      JSON.stringify([
        {
          id: "blob-shot",
          url: "blob:http://localhost/abc",
          timestamp: "2026-08-26T12:00:00.000Z",
        },
        {
          id: "good-shot",
          url: tinyPng,
          timestamp: "2026-08-26T12:00:00.000Z",
        },
        { id: 1, url: tinyPng, timestamp: "2026-08-26T12:00:00.000Z" },
      ])
    )

    const restored = loadScreenshots()
    expect(restored).toEqual([
      {
        id: "good-shot",
        url: tinyPng,
        timestamp: new Date("2026-08-26T12:00:00.000Z"),
      },
    ])
  })

  it("does not persist blob URLs", () => {
    saveScreenshots([
      makeScreenshot({
        id: "blob-shot",
        url: "blob:http://localhost/abc",
      }),
      makeScreenshot({ id: "data-shot" }),
    ])

    const restored = loadScreenshots()
    expect(restored.map((shot) => shot.id)).toEqual(["data-shot"])
  })
})

describe("clearStoredScreenshots", () => {
  it("removes screenshots from localStorage", () => {
    saveScreenshots([makeScreenshot()])
    expect(localStorage.getItem(SCREENSHOT_STORAGE_KEY)).toBeTruthy()

    clearStoredScreenshots()
    expect(localStorage.getItem(SCREENSHOT_STORAGE_KEY)).toBeNull()
    expect(loadScreenshots()).toEqual([])
  })
})

describe("quota handling", () => {
  it("drops oldest screenshots until the newest ones fit", () => {
    const newest = makeScreenshot({ id: "newest" })
    const middle = makeScreenshot({ id: "middle" })
    const oldest = makeScreenshot({ id: "oldest" })

    let attempts = 0
    const originalSetItem = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (
      this: Storage,
      key,
      value
    ) {
      attempts += 1
      const parsed = JSON.parse(value) as Array<{ id: string }>
      if (parsed.length > 2) {
        const error = new DOMException(
          "The quota has been exceeded.",
          "QuotaExceededError"
        )
        throw error
      }
      return originalSetItem.call(this, key, value)
    })

    const persisted = saveScreenshots([newest, middle, oldest])

    expect(persisted.map((shot) => shot.id)).toEqual(["newest", "middle"])
    expect(loadScreenshots().map((shot) => shot.id)).toEqual([
      "newest",
      "middle",
    ])
    expect(attempts).toBeGreaterThan(1)
  })
})

describe("blobToDataUrl", () => {
  it("converts an image blob into a data URL", async () => {
    const blob = new Blob(["fake-image-bytes"], { type: "image/png" })
    const dataUrl = await blobToDataUrl(blob)

    expect(dataUrl.startsWith("data:image/png;base64,")).toBe(true)
    expect(dataUrl.length).toBeGreaterThan("data:image/png;base64,".length)
  })
})
