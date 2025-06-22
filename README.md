# Flexi Cam Studio

A powerful web-based camera recording and editing application built with Next.js and React. This application provides professional-grade video recording capabilities directly in your browser, with advanced editing features and effects.
<img width="1705" alt="Screenshot 2025-06-22 at 12 02 48" src="https://github.com/user-attachments/assets/ab6ec121-e768-41b7-ba3f-0d2c7368d835" />

## Features

### Video Recording
- 📹 Camera recording with real-time preview
- ⏱️ Recording timer and duration tracking
- 📊 Multiple export formats (WebM, MP4, AVI, MOV, 3GP)
- 💾 Automatic file naming with timestamps

### Video Editing
- ✂️ Video trimming with start/end points
- 🎯 Crop tool with draggable/resizable interface
- 📐 Multiple aspect ratios (16:9, 9:16, 4:3, 1:1)
- 🔍 Zoom and pan capabilities
- ↔️ Mirror effect toggle

### Effects and Filters
- 🌫️ Blur effect with adjustable intensity
- 🎨 Pixelate effect
- 🎯 Effect-specific cropping
- 🎭 Real-time effect preview

### Screenshot System
- 📸 Screenshot capture in PNG and JPEG formats
- ⏲️ Timer functionality for delayed captures
- ⚡ Flash effect for better visibility
- 🖼️ Screenshot gallery with modal view
- 📥 Batch download of screenshots

## Tech Stack

- **Framework**: Next.js 13+ (App Router)
- **UI Library**: React
- **Styling**: Tailwind CSS
- **Components**: Radix UI
- **File Handling**: JSZip
- **Video Processing**: Web APIs (MediaRecorder, Canvas)

## Prerequisites

- Node.js 18.0.0 or later
- npm or yarn package manager
- Modern web browser with camera access
- WebCodecs support (for advanced features)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/camera-recorder.git
cd camera-recorder
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Recording Video
1. Click the camera icon to start recording
2. Use the pause button to temporarily stop recording
3. Click the stop button to end recording
4. The recorded video will be available for editing

### Taking Screenshots
1. Click the camera icon while recording or viewing a video
2. Use the timer option for delayed captures
3. View captured screenshots in the gallery
4. Download individual or all screenshots

### Editing Video
1. Use the trim controls to set start and end points
2. Apply crop by dragging the crop handles
3. Adjust aspect ratio using the ratio selector
4. Apply effects using the effect controls
5. Use zoom and pan for detailed editing

### Exporting
1. Select your desired export format
2. Click the download button
3. The video will be processed and downloaded automatically

## Browser Support

- Chrome 94+
- Firefox 92+
- Safari 15+
- Edge 94+

Note: Some features may require specific browser capabilities. The application will automatically detect and disable unsupported features.

## Development

### Project Structure
```
app/
├── layout.tsx      # Root layout
├── page.tsx        # Main application page
└── globals.css     # Global styles
components/
└── ui/            # UI components
    └── button.tsx # Button component
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Radix UI](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [JSZip](https://stuk.github.io/jszip/) 
