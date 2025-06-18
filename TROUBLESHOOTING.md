# Background Replacement Troubleshooting Guide

## Quick Test Steps

### 1. Basic Setup
1. Open the app in your browser (should be running on http://localhost:3000)
2. Allow camera permissions when prompted
3. Go to the "Effect Controls" section
4. Select "Background Replacement" from the Effect dropdown

### 2. Load the AI Model
- You should see "Load AI Model" button appear
- Click it and wait for loading (10-15 seconds first time)
- Look for "✅ AI model loaded and ready for background replacement" message
- Check browser console for "✅ BodyPix model loaded successfully!" message

### 3. Test Background Types
1. **Start with "Blur Background"** (easiest to test)
   - Should see your background becoming blurred while you remain in focus
2. **Try "Solid Color"** 
   - Pick a bright color like red or green
   - Background should change to that color
3. **Upload Custom Image**
   - Use a simple image (landscape, pattern, etc.)
   - Should replace background with your image

## Common Issues & Solutions

### ❌ "Load AI Model" button doesn't work
**Check Console:**
```bash
# Open browser dev tools (F12) and look for:
# ✅ "BodyPix model loaded successfully!"
# ❌ Or any error messages
```

**Solutions:**
- Ensure good internet connection (model downloads 10MB)
- Try refreshing the page
- Clear browser cache
- Try a different browser (Chrome works best)

### ❌ Model loads but background doesn't change
**Check Console:**
```bash
# Look for these debug messages:
# "🔍 Running segmentation..."
# "✅ Segmentation completed: [object]"
```

**Solutions:**
- Ensure you have good lighting
- Try moving to see if effect activates
- Stand against a simple, contrasting background
- Check if camera permissions are properly granted

### ❌ Background replacement is choppy/slow
**Performance Issues:**
- Background replacement is CPU intensive
- Close other browser tabs
- Use Chrome for best performance
- Ensure good lighting (helps AI work better)
- Lower video resolution in browser settings

### ❌ Poor edge detection (fuzzy edges around person)
**Segmentation Quality Issues:**
- Ensure even lighting on your face/body
- Avoid busy backgrounds behind you
- Wear clothing that contrasts with background
- Stand still for a moment to let AI adjust
- Try adjusting position relative to camera

## Debug Mode

### Enable Console Logging
1. Open browser developer tools (F12)
2. Go to Console tab
3. Select "Background Replacement" effect
4. Look for these messages:

```bash
✅ BodyPix model loaded successfully!    # Model loaded
🔍 Running segmentation...                # Processing started  
✅ Segmentation completed: [object]      # Processing completed
BodyPix model not loaded                 # Model not ready
Background replacement failed: [error]   # Error occurred
```

### Test Model Loading Manually
1. Open browser console (F12)
2. Type: `console.log(bodyPixModel)` (should not be null)
3. Check network tab for model download progress

## Browser Compatibility

### ✅ Fully Supported
- Chrome 80+
- Firefox 75+
- Safari 14+
- Edge 80+

### ⚠️ Partial Support
- Mobile browsers (slower performance)
- Older browsers (may not work)

### ❌ Not Supported
- Internet Explorer
- Very old mobile browsers
- Browsers without WebGL

## Performance Tips

### Optimal Conditions
1. **Lighting:** Even, front-facing light
2. **Background:** Simple, uncluttered  
3. **Clothing:** Avoid colors matching intended background
4. **Position:** Stay centered, avoid edge of frame
5. **Movement:** Smooth movements work better

### System Requirements
- Modern CPU (Intel i5/AMD Ryzen or better)
- 4GB+ RAM available
- Dedicated GPU helps but not required
- Stable internet for initial model download

## Manual Installation Check

If issues persist, verify dependencies:

```bash
# Check if packages are installed
npm list @tensorflow/tfjs @tensorflow-models/body-pix

# Should show:
# ├── @tensorflow/tfjs@4.22.0
# ├── @tensorflow-models/body-pix@2.2.1

# If missing, reinstall:
npm install @tensorflow/tfjs @tensorflow-models/body-pix --legacy-peer-deps
```

## Still Not Working?

### Fallback Options
1. Try basic effects first (Blur, Pixelate) to ensure app works
2. Test on different device/browser
3. Check if camera works with other video apps
4. Verify browser permissions for camera access

### Getting Help
1. Check browser console for error messages
2. Test with minimal background (solid wall)
3. Try different lighting conditions
4. Test on different browsers

### Report Issues
If still having problems, please provide:
- Browser version and OS
- Console error messages
- Steps you tried
- What you expected vs what happened 