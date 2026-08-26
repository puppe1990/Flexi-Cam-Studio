import { describe, expect, it } from "vitest"
import { formatTime } from "@/lib/utils/video"

describe("formatTime", () => {
  it("formats whole seconds as MM:SS with zero padding", () => {
    expect(formatTime(0)).toBe("00:00")
    expect(formatTime(5)).toBe("00:05")
    expect(formatTime(65)).toBe("01:05")
    expect(formatTime(600)).toBe("10:00")
  })

  it("floors fractional seconds", () => {
    expect(formatTime(1.9)).toBe("00:01")
  })
})
