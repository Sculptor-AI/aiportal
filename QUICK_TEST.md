# Quick Test Guide for Gemini Live Integration

## ✅ Fixed Issues

1. **WebSocket null reference error** - Fixed null checks in connection timeout
2. **WebSocket connection timeout** - Improved error handling and mock mode fallback
3. **Microphone unmute functionality** - Enhanced session management and recording flow

## 🧪 Testing Steps

### 1. Test the Live Mode UI
1. Open the application in your browser
2. Click the **waveform button** (🎵) in the chat input area
3. The LiveModeUI should open with status "Connected (Mock Mode)"

### 2. Test Microphone Functionality
1. Click the **microphone button** in the LiveModeUI
2. **Grant microphone permissions** when prompted
3. The button should change to "Recording..." with a red background
4. You should see console logs: "🎤 Requesting microphone access..." and "✅ Microphone access granted"

### 3. Test Mock Responses
1. While recording, speak into your microphone
2. After 1-2 seconds, you should see:
   - **Transcription**: "You said: This is a mock transcription of your audio input"
   - **Response**: "This is a simulated AI response to your speech..."
3. Click the microphone button again to stop recording

### 4. Console Output
Expected console messages:
```
🚀 Mock mode enabled - Live chat will simulate responses
ℹ️  Click the microphone button to start recording and see mock responses
🎤 Requesting microphone access...
✅ Microphone access granted
🎤 Recording started
```

## 🔧 Common Issues & Solutions

### Issue: "Microphone access denied"
**Solution**: 
- Check browser permissions for microphone access
- Make sure you're using HTTPS (required for getUserMedia)
- Try refreshing the page and granting permissions again

### Issue: "WebSocket connection failed"
**Solution**: 
- This is expected when the backend server is not running
- The system automatically falls back to mock mode
- You should see "Connected (Mock Mode)" in the status

### Issue: Button doesn't respond
**Solution**: 
- Check browser console for JavaScript errors
- Make sure you've clicked the waveform button first to open LiveModeUI
- Try refreshing the page

## 🎯 Expected Behavior

1. **Without Backend Server** (Development Mode):
   - Automatic fallback to mock mode
   - Mock transcriptions and responses
   - Full UI functionality for testing

2. **With Backend Server** (Production Mode):
   - Real WebSocket connection
   - Actual audio processing
   - Real-time transcription and responses

## 📋 Next Steps

If the test works correctly:
1. ✅ The integration is working in mock mode
2. ✅ Microphone access is functioning
3. ✅ UI updates are working properly
4. ✅ Ready for backend server integration

To use with real backend:
1. Start the WebSocket server: `npm run server`
2. The system will automatically detect and use the real connection
3. Real Gemini Live API responses will replace mock responses