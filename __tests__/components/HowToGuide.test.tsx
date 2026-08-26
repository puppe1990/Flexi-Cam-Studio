import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { HowToGuide } from "@/components/studio/HowToGuide"

describe("HowToGuide", () => {
  it("renders the how-to heading and screenshot shortcut", () => {
    render(<HowToGuide />)
    expect(screen.getByText("How to Use")).toBeInTheDocument()
    expect(screen.getByText("Take Screenshot")).toBeInTheDocument()
    expect(screen.getByText("S")).toBeInTheDocument()
  })
})
