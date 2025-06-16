import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FlexiCam Studio',
  description: 'Professional camera recorder and video editor with real-time effects, multiple formats, and advanced editing tools',
  generator: 'FlexiCam Studio',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
