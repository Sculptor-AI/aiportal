# Gemini Live API Implementation

## Overview

This implementation provides real-time audio transcription and conversation capabilities using Google's Gemini Live API. The system supports both HTTP REST endpoints and WebSocket streaming for low-latency audio processing.

## Features

### ✅ Implemented Features

- **Real-time Audio Transcription**: Convert speech to text in real-time
- **Voice Activity Detection**: Automatic speech detection and interruption handling
- **Dual Response Modes**: Choose between text or audio responses (not both simultaneously)
- **Input/Output Transcription**: Optional transcription of both input and output audio
- **Session Management**: 15-minute session limits with automatic cleanup
- **WebSocket Streaming**: Real-time bi-directional audio streaming
- **Audio Format Support**: WebM, WAV, and PCM with automatic conversion
- **Multiple Models**: Support for different Gemini Live models

### 🎯 Key Capabilities

- **Low Latency**: Designed for real-time conversation applications
- **Automatic Audio Processing**: Converts audio to required format (16-bit PCM, 16kHz, mono)
- **Session Persistence**: Maintains conversation context within sessions
- **Error Handling**: Comprehensive error handling and validation
- **Scalable Architecture**: Supports multiple concurrent sessions

## Setup Instructions

### 1. Environment Configuration

Add the following to your `.env` file:

```bash
# Google API Key for Gemini Live API
GOOGLE_API_KEY=your_google_api_key_here
```

### 2. Get Google API Key

1. Go to [Google AI Studio](https://ai.google.dev/)
2. Create a new project or select an existing one
3. Navigate to "Get API Key"
4. Create a new API key
5. Copy the key and add it to your `.env` file

### 3. Test the Setup

Run the test script to verify everything is configured correctly:

```bash
node test-gemini-live.js
```

## API Endpoints

### REST Endpoints

#### Start Session
```http
POST /api/v1/live-audio/session/start
Content-Type: application/json
X-API-Key: YOUR_API_KEY

{
  "session_id": "unique_session_id",
  "model": "gemini-live-2.5-flash-preview",
  "response_modality": "text",
  "input_transcription": true,
  "output_transcription": true
}
```

#### Process Audio Chunk
```http
POST /api/v1/live-audio/transcribe
Content-Type: application/json
X-API-Key: YOUR_API_KEY

{
  "session_id": "unique_session_id",
  "audio_data": "base64_encoded_audio_data",
  "format": "webm",
  "sample_rate": 16000,
  "channels": 1
}
```

#### End Session
```http
POST /api/v1/live-audio/session/end
Content-Type: application/json
X-API-Key: YOUR_API_KEY

{
  "session_id": "unique_session_id"
}
```

#### Get Session Status
```http
GET /api/v1/live-audio/session/{session_id}/status
X-API-Key: YOUR_API_KEY
```

#### Get Active Sessions
```http
GET /api/v1/live-audio/sessions
X-API-Key: YOUR_API_KEY
```

### WebSocket Streaming

**URL**: `ws://localhost:3000/ws/live-audio` (or `wss://` for HTTPS)

#### Message Types

**Start Session**:
```json
{
  "type": "start_session",
  "session_id": "unique_session_id",
  "model": "gemini-live-2.5-flash-preview",
  "response_modality": "text",
  "input_transcription": true,
  "output_transcription": true
}
```

**Send Audio Chunk**:
```json
{
  "type": "audio_chunk",
  "audio_data": "base64_encoded_audio_data",
  "format": "webm",
  "sample_rate": 16000,
  "channels": 1
}
```

**End Session**:
```json
{
  "type": "end_session"
}
```

## Available Models

### Half-Cascade Models (Recommended)
- `gemini-live-2.5-flash-preview` - Best balance of performance and features
- `gemini-2.0-flash-live-001` - Alternative half-cascade model

### Native Audio Models
- `gemini-2.5-flash-preview-native-audio-dialog` - Natural speech output
- `gemini-2.5-flash-exp-native-audio-thinking-dialog` - With thinking capabilities

## Usage Examples

### Frontend Integration

#### Basic Audio Transcription
```javascript
// Start session
const sessionResponse = await fetch('/api/v1/live-audio/session/start', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your_api_key'
  },
  body: JSON.stringify({
    session_id: 'session_123',
    model: 'gemini-live-2.5-flash-preview',
    response_modality: 'text'
  })
});

// Process audio chunk
const audioResponse = await fetch('/api/v1/live-audio/transcribe', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your_api_key'
  },
  body: JSON.stringify({
    session_id: 'session_123',
    audio_data: base64AudioData,
    format: 'webm',
    sample_rate: 16000
  })
});
```

#### WebSocket Streaming
```javascript
const ws = new WebSocket('ws://localhost:3000/ws/live-audio');

ws.onopen = () => {
  // Start session
  ws.send(JSON.stringify({
    type: 'start_session',
    session_id: 'streaming_session_123',
    model: 'gemini-live-2.5-flash-preview',
    response_modality: 'text'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'transcription_result') {
    console.log('Transcription:', data.data.transcript);
    console.log('Input:', data.data.inputTranscription);
  }
};

// Send audio chunk
ws.send(JSON.stringify({
  type: 'audio_chunk',
  audio_data: base64AudioData,
  format: 'webm',
  sample_rate: 16000
}));
```

#### Real-time Microphone Streaming
```javascript
// Get microphone access
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    sampleRate: 16000,
    channelCount: 1,
    echoCancellation: true,
    noiseSuppression: true
  }
});

const mediaRecorder = new MediaRecorder(stream);

mediaRecorder.ondataavailable = async (event) => {
  if (event.data.size > 0 && ws.readyState === WebSocket.OPEN) {
    const arrayBuffer = await event.data.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    ws.send(JSON.stringify({
      type: 'audio_chunk',
      audio_data: base64Audio,
      format: 'webm',
      sample_rate: 16000
    }));
  }
};

mediaRecorder.start(1000); // Send chunks every 1 second
```

## Architecture

### Service Layer (`liveAudioService.js`)
- Manages Gemini Live API connections
- Handles session lifecycle
- Processes audio format conversion
- Manages active sessions and cleanup

### Controller Layer (`liveAudioController.js`)
- HTTP endpoint handlers
- WebSocket connection management
- Request/response validation
- Error handling

### Route Layer (`liveAudioRoutes.js`)
- API route definitions
- Authentication middleware
- Request routing

## Interactive Documentation

The implementation includes a comprehensive interactive documentation interface:

1. Start the server: `npm start`
2. Open `http://localhost:3000/docs/`
3. Navigate to the "Live Audio" tab
4. Test both REST endpoints and WebSocket streaming

## Important Notes

### Session Limits
- Each session has a **15-minute maximum duration** (Gemini Live API limit)
- Sessions are automatically cleaned up after expiration
- Monitor active sessions using the `/sessions` endpoint

### Audio Processing
- Audio is automatically converted to 16-bit PCM, 16kHz, mono
- Input formats: WebM, WAV, PCM
- Output audio (if requested) is 24kHz

### Response Modality
- Choose either "text" OR "audio" response per session
- Cannot have both text and audio responses simultaneously
- Input transcription and output transcription are optional

### Performance Considerations
- WebSocket streaming provides lower latency than REST endpoints
- Sessions are cleaned up every 5 minutes automatically
- Audio chunks are optionally saved for debugging

## Error Handling

The implementation includes comprehensive error handling:

- Invalid session IDs
- Expired sessions
- Audio format conversion errors
- Gemini API connection errors
- WebSocket connection issues

## Testing

Use the interactive HTML documentation to test all features:

1. **Session Management**: Create, monitor, and end sessions
2. **File Upload**: Test with audio files
3. **Real-time Recording**: Test microphone input
4. **WebSocket Streaming**: Test real-time bi-directional communication

## Troubleshooting

### Common Issues

1. **"Session not found"**: Ensure session was created before sending audio
2. **"Audio processing failed"**: Check audio format and base64 encoding
3. **"Invalid API key"**: Verify GOOGLE_API_KEY is set correctly
4. **WebSocket connection fails**: Check server is running and port is accessible

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
```

### Session Cleanup

Sessions are automatically cleaned up, but you can manually trigger cleanup:
```javascript
import { cleanupExpiredSessions } from './controllers/liveAudioController.js';
cleanupExpiredSessions();
```

## Production Deployment

For production use:

1. Set `GOOGLE_API_KEY` in production environment
2. Use HTTPS for WebSocket connections (WSS)
3. Consider rate limiting for API endpoints
4. Monitor session usage and cleanup
5. Set appropriate CORS policies
6. Use proper logging and monitoring
7. Consider caching for frequently accessed data

## Next Steps

The implementation is complete and ready for production use. You can now:

1. Integrate with your frontend application
2. Customize the UI for your specific use case
3. Add additional features like session persistence
4. Implement user-specific session management
5. Add metrics and monitoring
6. Scale horizontally with session clustering

The system provides a solid foundation for real-time audio applications with Google's Gemini Live API.