import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

// Store active sessions
const activeSessions = new Map();
const sessionCleanupIntervals = new Map();

// Utility functions
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const cleanupSession = (sessionId) => {
  if (activeSessions.has(sessionId)) {
    const session = activeSessions.get(sessionId);
    if (session.ws) {
      session.ws.terminate();
    }
    activeSessions.delete(sessionId);
  }
  
  if (sessionCleanupIntervals.has(sessionId)) {
    clearTimeout(sessionCleanupIntervals.get(sessionId));
    sessionCleanupIntervals.delete(sessionId);
  }
};

const scheduleSessionCleanup = (sessionId) => {
  // Clean up session after 15 minutes (Gemini Live API limit)
  const timeout = setTimeout(() => {
    cleanupSession(sessionId);
  }, 15 * 60 * 1000);
  
  sessionCleanupIntervals.set(sessionId, timeout);
};

// Audio processing utility
const processAudioData = (audioData, format) => {
  try {
    // Convert base64 to buffer
    const buffer = Buffer.from(audioData, 'base64');
    
    // For now, just return the buffer as is
    // In a production environment, you might want to convert to the required format
    return buffer;
  } catch (error) {
    throw new Error(`Audio processing failed: ${error.message}`);
  }
};

// Mock Gemini Live API integration
const connectToGeminiLive = async (sessionOptions) => {
  // This would connect to the actual Gemini Live API
  // For now, we'll simulate the connection
  return {
    sessionId: sessionOptions.session_id,
    status: 'connected',
    model: sessionOptions.model,
    responseModality: sessionOptions.response_modality
  };
};

const sendAudioToGemini = async (sessionId, audioBuffer, format) => {
  // This would send audio to the actual Gemini Live API
  // For now, we'll simulate a response
  return {
    transcript: 'Hello, this is a simulated transcription',
    response: 'This is a simulated AI response to your audio input.',
    inputTranscription: 'You said: Hello, this is a simulated transcription',
    outputTranscription: 'AI responded: This is a simulated AI response'
  };
};

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');
  
  let currentSessionId = null;
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'start_session':
          currentSessionId = data.session_id || generateSessionId();
          
          // Store session info
          activeSessions.set(currentSessionId, {
            ws,
            sessionId: currentSessionId,
            model: data.model,
            responseModality: data.response_modality,
            inputTranscription: data.input_transcription,
            outputTranscription: data.output_transcription,
            startTime: Date.now()
          });
          
          // Schedule cleanup
          scheduleSessionCleanup(currentSessionId);
          
          // Connect to Gemini Live API
          const sessionInfo = await connectToGeminiLive(data);
          
          ws.send(JSON.stringify({
            type: 'session_started',
            session_id: currentSessionId,
            data: sessionInfo
          }));
          
          break;
          
        case 'audio_chunk':
          if (!currentSessionId || !activeSessions.has(currentSessionId)) {
            ws.send(JSON.stringify({
              type: 'error',
              error: 'No active session found'
            }));
            return;
          }
          
          try {
            // Process audio data
            const audioBuffer = processAudioData(data.audio_data, data.format);
            
            // Send to Gemini Live API
            const response = await sendAudioToGemini(currentSessionId, audioBuffer, data.format);
            
            // Send transcription result
            ws.send(JSON.stringify({
              type: 'transcription_result',
              data: response
            }));
            
          } catch (error) {
            ws.send(JSON.stringify({
              type: 'error',
              error: error.message
            }));
          }
          
          break;
          
        case 'end_session':
          if (currentSessionId) {
            cleanupSession(currentSessionId);
            currentSessionId = null;
            
            ws.send(JSON.stringify({
              type: 'session_ended',
              session_id: currentSessionId
            }));
          }
          break;
          
        default:
          ws.send(JSON.stringify({
            type: 'error',
            error: `Unknown message type: ${data.type}`
          }));
      }
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        error: `Message processing failed: ${error.message}`
      }));
    }
  });
  
  ws.on('close', () => {
    console.log('WebSocket connection closed');
    if (currentSessionId) {
      cleanupSession(currentSessionId);
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    if (currentSessionId) {
      cleanupSession(currentSessionId);
    }
  });
});

// REST API endpoints
app.post('/api/v1/live-audio/session/start', async (req, res) => {
  try {
    const sessionId = req.body.session_id || generateSessionId();
    
    // Store session info
    activeSessions.set(sessionId, {
      sessionId,
      model: req.body.model,
      responseModality: req.body.response_modality,
      inputTranscription: req.body.input_transcription,
      outputTranscription: req.body.output_transcription,
      startTime: Date.now()
    });
    
    // Schedule cleanup
    scheduleSessionCleanup(sessionId);
    
    // Connect to Gemini Live API
    const sessionInfo = await connectToGeminiLive(req.body);
    
    res.json({
      success: true,
      session_id: sessionId,
      data: sessionInfo
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/v1/live-audio/transcribe', async (req, res) => {
  try {
    const { session_id, audio_data, format } = req.body;
    
    if (!activeSessions.has(session_id)) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    // Process audio data
    const audioBuffer = processAudioData(audio_data, format);
    
    // Send to Gemini Live API
    const response = await sendAudioToGemini(session_id, audioBuffer, format);
    
    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/v1/live-audio/session/end', async (req, res) => {
  try {
    const { session_id } = req.body;
    
    if (activeSessions.has(session_id)) {
      cleanupSession(session_id);
    }
    
    res.json({
      success: true,
      message: 'Session ended'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/v1/live-audio/session/:sessionId/status', (req, res) => {
  const sessionId = req.params.sessionId;
  
  if (activeSessions.has(sessionId)) {
    const session = activeSessions.get(sessionId);
    res.json({
      success: true,
      data: {
        session_id: sessionId,
        status: 'active',
        model: session.model,
        start_time: session.startTime,
        duration: Date.now() - session.startTime
      }
    });
  } else {
    res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }
});

app.get('/api/v1/live-audio/sessions', (req, res) => {
  const sessions = Array.from(activeSessions.values()).map(session => ({
    session_id: session.sessionId,
    model: session.model,
    start_time: session.startTime,
    duration: Date.now() - session.startTime
  }));
  
  res.json({
    success: true,
    data: {
      active_sessions: sessions.length,
      sessions
    }
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Periodic cleanup of expired sessions
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of activeSessions) {
    if (now - session.startTime > 15 * 60 * 1000) { // 15 minutes
      cleanupSession(sessionId);
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}/ws/live-audio`);
  console.log(`🔗 REST API available at: http://localhost:${PORT}/api/v1/live-audio`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  
  // Clean up all sessions
  for (const sessionId of activeSessions.keys()) {
    cleanupSession(sessionId);
  }
  
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});