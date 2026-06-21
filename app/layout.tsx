import type { Metadata } from "next"
import { Outfit, JetBrains_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "FlexiCam Studio",
  description:
    "Professional camera recorder and video editor with real-time effects, multiple formats, and advanced editing tools",
  generator: "FlexiCam Studio",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${jetbrainsMono.variable} font-sans`}
        style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
