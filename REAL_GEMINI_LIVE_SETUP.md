# 🚀 Real Gemini Live API Setup

## NO MORE MOCK MODE - REAL API CONNECTION

The integration now connects directly to Google's Gemini Live API. Here's how to set it up:

## 1. Get Your Google API Key

1. Go to **[Google AI Studio](https://ai.google.dev/)**
2. Click **"Get API Key"**
3. Create a new project or select existing
4. Generate API key
5. Copy the API key

## 2. Set Up Your API Key

Choose one of these methods:

### Method A: Environment Variable (Recommended)
Create a `.env` file in your project root:
```bash
VITE_GOOGLE_API_KEY=your_api_key_here
```

### Method B: Browser Storage (Alternative)
Open browser console and run:
```javascript
localStorage.setItem('google_api_key', 'your_api_key_here');
```

## 3. Enable Gemini Live API

1. In Google AI Studio, go to your project
2. Navigate to **API & Services** > **Library**
3. Search for "Gemini Live API"
4. Enable it for your project

## 4. Test the Connection

1. Refresh your application
2. Click the **waveform button** (🎵)
3. You should see: "Connecting to Gemini Live..."
4. Then: "Connected to Gemini Live"

## 5. Start Talking!

1. Click the **microphone button**
2. Grant microphone permissions
3. **SPEAK TO THE ACTUAL GEMINI MODEL**
4. Get real AI responses!

## Features You'll Get:

- ✅ **Real-time speech transcription**
- ✅ **Actual Gemini 2.0 Flash responses**
- ✅ **Live conversation with the model**
- ✅ **No more mock responses**
- ✅ **Professional-grade AI interaction**

## Troubleshooting:

### "Google API key is required"
- Make sure you've set the API key using one of the methods above
- Refresh the page after setting the key

### "Failed to connect to Gemini Live API"
- Check your internet connection
- Verify the API key is correct
- Make sure Gemini Live API is enabled in your Google project

### "Connection timed out"
- Check if your API key has proper permissions
- Verify your Google Cloud project has billing enabled (if required)

## Console Messages You'll See:

```
✅ Connected to Gemini Live API
🚀 Starting Gemini Live session...
🎤 Requesting microphone access...
✅ Microphone access granted
🎤 Recording started
🎤 Audio chunk sent to Gemini Live API
```

## API Details:

- **Model**: `gemini-2.0-flash-exp`
- **Voice**: Aoede (natural voice)
- **Response**: Real-time text responses
- **Connection**: Direct WebSocket to Google's servers

## Ready to Go!

Your Live Mode now connects to the **REAL GEMINI LIVE API**. No more mock responses - you're talking directly to Google's most advanced AI model!

🎤 **Start talking to Gemini Live now!**