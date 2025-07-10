# Gemini Live API Integration

This document explains how the Gemini Live API has been integrated into the Sculptor AI Portal.

## Overview

The integration adds real-time audio transcription and conversation capabilities to the existing live chat interface. Users can now speak directly to the AI and receive text responses in real-time.

## Files Added/Modified

### New Files
- `src/services/geminiLiveService.js` - Service class for handling Gemini Live API WebSocket connections
- `src/hooks/useGeminiLive.js` - React hook for easy integration with React components
- `server.js` - Node.js server with WebSocket support for Gemini Live API
- `test-integration.js` - Test script to verify the integration

### Modified Files
- `src/components/LiveModeUI.jsx` - Enhanced with real-time audio transcription
- `src/components/ChatInputArea.jsx` - Updated waveform button with live mode indicators
- `src/components/ChatWindow.styled.js` - Added styling for active live mode states
- `package.json` - Added WebSocket and server dependencies

## Features

### ✅ Implemented
- **Real-time Audio Transcription**: Speech-to-text conversion
- **WebSocket Streaming**: Low-latency audio streaming
- **Session Management**: Automatic session lifecycle handling
- **Visual Feedback**: Active state indicators and transcription display
- **Error Handling**: Comprehensive error handling and user feedback
- **REST API Fallback**: Alternative HTTP endpoints for compatibility

### 🎯 Key Components

#### GeminiLiveService
- Manages WebSocket connections to the live audio server
- Handles audio recording and streaming
- Provides callback-based event handling
- Supports both WebSocket and REST API modes

#### useGeminiLive Hook
- React hook for easy integration with components
- Manages connection state and session lifecycle
- Provides simplified API for React components
- Handles audio recording and playback

#### Enhanced LiveModeUI
- Real-time transcription display
- Status indicators for connection and recording states
- Integration with existing camera and screen sharing features
- Responsive design for mobile and desktop

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Add to your `.env` file:
```bash
GOOGLE_API_KEY=your_google_api_key_here
```

### 3. Build the Frontend
```bash
npm run build
```

### 4. Start the Server
```bash
npm run server
```

### 5. Test the Integration
```bash
node test-integration.js
```

## Usage

### Basic Usage
1. Click the waveform button in the chat input area
2. The LiveModeUI will open with connection status
3. Click the microphone button to start recording
4. Speak into your microphone
5. See real-time transcription appear below the controls
6. AI responses will appear in the response area

### Advanced Features
- **Session Management**: Sessions automatically expire after 15 minutes
- **Error Recovery**: Automatic reconnection on connection loss
- **Multiple Formats**: Support for WebM, WAV, and PCM audio formats
- **Responsive Design**: Works on both desktop and mobile devices

## API Endpoints

### WebSocket
- **Endpoint**: `ws://localhost:3000/ws/live-audio`
- **Purpose**: Real-time audio streaming and transcription

### REST API
- `POST /api/v1/live-audio/session/start` - Start a new session
- `POST /api/v1/live-audio/transcribe` - Send audio for transcription
- `POST /api/v1/live-audio/session/end` - End a session
- `GET /api/v1/live-audio/sessions` - Get active sessions

## Architecture

```
Frontend (React)
├── LiveModeUI.jsx
├── useGeminiLive.js
└── geminiLiveService.js
          ↓
WebSocket Connection
          ↓
Backend Server (Node.js)
├── WebSocket Handler
├── Session Management
├── Audio Processing
└── Gemini Live API Integration
```

## Configuration

### Available Models
- `gemini-live-2.5-flash-preview` (recommended)
- `gemini-2.0-flash-live-001`
- `gemini-2.5-flash-preview-native-audio-dialog`

### Response Modes
- `text` - Text responses only
- `audio` - Audio responses only (not both simultaneously)

### Audio Settings
- **Input**: 16kHz, mono, 16-bit PCM
- **Output**: 24kHz (for audio responses)
- **Formats**: WebM, WAV, PCM with automatic conversion

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check if server is running on port 3000
   - Verify firewall settings
   - Ensure no other service is using port 3000

2. **Microphone Access Denied**
   - Grant microphone permissions in browser
   - Use HTTPS for production (required for getUserMedia)
   - Check browser compatibility

3. **Audio Not Transcribing**
   - Verify Google API key is set
   - Check microphone is working
   - Ensure audio format is supported

4. **Session Timeout**
   - Sessions expire after 15 minutes (Gemini API limit)
   - Start a new session if needed
   - Check session status endpoint

### Debug Mode
Set `NODE_ENV=development` for detailed logging.

## Production Deployment

### Requirements
- Node.js 16+ with ES modules support
- HTTPS (required for microphone access)
- WebSocket support on hosting platform
- Google API key with Gemini Live API access

### Recommendations
- Use WSS (WebSocket Secure) for production
- Implement rate limiting for API endpoints
- Add user authentication for session management
- Monitor session usage and cleanup
- Set up proper logging and monitoring

## Performance Considerations

- WebSocket connections provide lower latency than REST
- Audio chunks are processed in 1-second intervals
- Sessions are automatically cleaned up every 5 minutes
- Memory usage is optimized with automatic buffer management

## Security

- API key is server-side only (not exposed to frontend)
- Session IDs are generated with cryptographic randomness
- WebSocket connections are isolated per session
- Audio data is not persisted by default

## Future Enhancements

- [ ] Support for multiple concurrent sessions
- [ ] Audio response playback
- [ ] Voice activity detection
- [ ] Custom wake words
- [ ] Audio effects and filters
- [ ] Persistent session storage
- [ ] Advanced analytics and monitoring

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review server logs for errors
3. Test with the integration test script
4. Verify all dependencies are installed correctly