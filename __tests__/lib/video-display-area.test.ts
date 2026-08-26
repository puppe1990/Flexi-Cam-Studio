import { describe, expect, it } from "vitest"
import { computeVideoDisplayArea } from "@/lib/video-display-area"

describe("computeVideoDisplayArea", () => {
  it("fills the container when aspect ratios match within tolerance", () => {
    const area = computeVideoDisplayArea({
      videoWidth: 1920,
      videoHeight: 1080,
      containerWidth: 1280,
      containerHeight: 720,
    })
    expect(area.displayedVideoWidth).toBe(1280)
    expect(area.displayedVideoHeight).toBe(720)
    expect(area.videoOffsetX).toBe(0)
    expect(area.videoOffsetY).toBe(0)
  })

  it("letterboxes a wide video in a taller container", () => {
    const area = computeVideoDisplayArea({
      videoWidth: 1920,
      videoHeight: 1080,
      containerWidth: 200,
      containerHeight: 200,
    })
    expect(area.displayedVideoWidth).toBe(200)
    expect(area.displayedVideoHeight).toBeCloseTo(200 / (1920 / 1080))
    expect(area.videoOffsetX).toBe(0)
    expect(area.videoOffsetY).toBeGreaterThan(0)
  })

  it("pillarboxes a tall video in a wider container", () => {
    const area = computeVideoDisplayArea({
      videoWidth: 1080,
      videoHeight: 1920,
      containerWidth: 200,
      containerHeight: 200,
    })
    expect(area.displayedVideoHeight).toBe(200)
    expect(area.displayedVideoWidth).toBeCloseTo(200 * (1080 / 1920))
    expect(area.videoOffsetY).toBe(0)
    expect(area.videoOffsetX).toBeGreaterThan(0)
  })
})
