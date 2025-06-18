# Background Replacement Feature

## Overview

The FlexiCam Studio now includes AI-powered background replacement functionality that uses TensorFlow.js and BodyPix model to detect people in real-time and replace the background with your choice of:

- **Solid Colors** - Choose any color as your background
- **Custom Images** - Upload your own background images  
- **Blurred Background** - Automatically blur the original background

## How to Use

### 1. Enable Background Replacement
1. In the **Effect Controls** section, select **"Background Replacement"** from the Effect dropdown
2. Click **"Load AI Model"** to download and initialize the BodyPix model (this may take a few moments)
3. Once loaded, you'll see "✅ AI model loaded and ready for background replacement"

### 2. Choose Background Type
- **Blur Background**: Applies a blur effect to the original background while keeping you in focus
- **Solid Color**: Replace background with a solid color (green screen effect)
- **Custom Image**: Upload your own image to use as background

### 3. Customize Settings
- **For Blur**: Adjust the "Blur Intensity" slider (1-10)
- **For Color**: Click the color picker to choose your preferred background color
- **For Image**: Click "Choose File" to upload an image (JPG, PNG supported)

### 4. Record or Take Screenshots
- The background replacement works in real-time for both recording and screenshots
- All standard features (crop mode, mirror mode, etc.) work with background replacement

## Technical Details

### AI Model
- Uses **BodyPix** from TensorFlow.js for person segmentation
- Model: MobileNetV1 (optimized for performance)
- Segmentation threshold: 0.7 (good balance of accuracy and performance)
- Processing resolution: Medium (for optimal performance)

### Performance
- The AI model runs in the browser - no data is sent to external servers
- First load requires downloading ~10MB model
- Real-time processing at 30fps on modern devices
- Optimized for performance with reduced resolution processing

### Browser Compatibility
- Requires modern browsers with WebGL support
- Works best on Chrome, Firefox, Safari, Edge
- Mobile browsers supported but with reduced performance

## Installation

The required dependencies are already included:
```bash
npm install @tensorflow/tfjs @tensorflow-models/body-pix --legacy-peer-deps
```

## Troubleshooting

### Model Won't Load
- Ensure you have a stable internet connection for the initial model download
- Try refreshing the page and clicking "Load AI Model" again
- Check browser console for any error messages

### Poor Segmentation Quality
- Ensure good lighting conditions
- Stand against a contrasting background
- Avoid busy/cluttered backgrounds for better detection
- Keep steady - sudden movements may cause flickering

### Performance Issues
- Try reducing video resolution in browser settings
- Close other resource-intensive browser tabs
- Background replacement is more CPU intensive than other effects

### Custom Background Images
- Use high-resolution images for best quality
- Images will be automatically scaled to fit the video dimensions
- Supported formats: JPG, PNG, GIF

## Privacy & Security

- **100% Local Processing**: All AI processing happens in your browser
- **No Data Upload**: Your video never leaves your device
- **No Tracking**: No analytics or tracking of your usage
- **Offline Capable**: Once model is loaded, works without internet

## Tips for Best Results

1. **Lighting**: Use even, front-facing lighting
2. **Background**: Start with a simple, contrasting background
3. **Position**: Stay centered in the frame
4. **Movement**: Smooth movements work better than quick gestures
5. **Clothing**: Avoid colors that match your intended background

## Examples Use Cases

- **Virtual Meetings**: Professional backgrounds for video calls
- **Content Creation**: Clean backgrounds for tutorials or presentations  
- **Privacy**: Hide your actual location/environment
- **Creative Projects**: Artistic backgrounds for videos
- **Green Screen Effects**: Without needing an actual green screen

## Future Enhancements

Planned improvements include:
- Multiple person detection
- Background blur effects with depth
- Pre-loaded background templates
- Advanced edge refinement
- Custom segmentation models 