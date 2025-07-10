class GeminiLiveService {
  constructor() {
    this.ws = null;
    this.sessionId = null;
    this.isConnected = false;
    this.onTranscriptionCallback = null;
    this.onResponseCallback = null;
    this.onErrorCallback = null;
    this.onStatusCallback = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
  }

  // Connect directly to Google's Gemini Live API
  async connect(apiKey = null) {
    if (this.isConnected) {
      return;
    }
    
    // Get API key from environment or parameter
    const googleApiKey = apiKey || import.meta.env.VITE_GOOGLE_API_KEY || localStorage.getItem('google_api_key');
    
    if (!googleApiKey) {
      const error = 'Google API key is required for Gemini Live API. Please set VITE_GOOGLE_API_KEY in your environment or provide it as a parameter.';
      this.onErrorCallback?.(error);
      throw new Error(error);
    }
    
    try {
      // Connect to Google's Gemini Live API WebSocket endpoint
      const wsUrl = `wss://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:streamGenerateContent?key=${googleApiKey}`;
      
      this.ws = new WebSocket(wsUrl);
      
      return new Promise((resolve, reject) => {
        const connectionTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
            try {
              this.ws.close();
            } catch (e) {
              // Ignore close errors
            }
          }
          if (!this.isConnected) {
            const error = 'Connection to Gemini Live API timed out';
            this.onErrorCallback?.(error);
            reject(new Error(error));
          }
        }, 10000); // 10 second timeout for Google's API
        
        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          this.isConnected = true;
          this.onStatusCallback?.('connected');
          console.log('✅ Connected to Gemini Live API');
          resolve();
        };
        
        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleGeminiMessage(data);
          } catch (error) {
            console.error('Error parsing Gemini API message:', error);
          }
        };
        
        this.ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          console.error('Gemini Live API connection failed:', error);
          const errorMessage = 'Failed to connect to Gemini Live API. Please check your API key and internet connection.';
          this.onErrorCallback?.(errorMessage);
          reject(new Error(errorMessage));
        };
        
        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          if (this.isConnected) {
            this.isConnected = false;
            this.onStatusCallback?.('disconnected');
          }
          console.log('Gemini Live API connection closed:', event.code, event.reason);
        };
      });
    } catch (error) {
      console.error('Error connecting to Gemini Live API:', error);
      this.onErrorCallback?.(error.message);
      throw error;
    }
  }
  

  // Handle incoming messages from Google's Gemini Live API
  handleGeminiMessage(data) {
    try {
      // Handle different types of messages from Gemini Live API
      if (data.candidates && data.candidates.length > 0) {
        const candidate = data.candidates[0];
        
        // Handle content updates
        if (candidate.content && candidate.content.parts) {
          const textParts = candidate.content.parts.filter(part => part.text);
          if (textParts.length > 0) {
            const response = textParts.map(part => part.text).join('');
            this.onResponseCallback?.(response);
          }
        }
        
        // Handle audio transcription if available
        if (candidate.transcription) {
          this.onTranscriptionCallback?.(candidate.transcription);
        }
      }
      
      // Handle server events
      if (data.serverEvents) {
        data.serverEvents.forEach(event => {
          if (event.turnComplete) {
            console.log('Turn completed');
          } else if (event.interrupted) {
            console.log('Turn interrupted');
          }
        });
      }
      
      // Handle usage metadata
      if (data.usageMetadata) {
        console.log('Usage metadata:', data.usageMetadata);
      }
      
    } catch (error) {
      console.error('Error handling Gemini message:', error);
      this.onErrorCallback?.('Error processing response from Gemini Live API');
    }
  }

  // Start a new session with Gemini Live API
  startSession(options = {}) {
    if (!this.isConnected) {
      throw new Error('Not connected to Gemini Live API');
    }

    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Send setup message to Gemini Live API
    const setupMessage = {
      setup: {
        model: 'models/gemini-2.0-flash-exp',
        generationConfig: {
          responseModalities: ['TEXT'], // Can be 'TEXT' or 'AUDIO'
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Aoede' // Available voices: Aoede, Charon, Fenrir, Kore, Puck
              }
            }
          }
        },
        systemInstruction: {
          parts: [{
            text: 'You are a helpful AI assistant. Respond naturally to voice conversations.'
          }]
        }
      }
    };

    console.log('🚀 Starting Gemini Live session...');
    this.ws.send(JSON.stringify(setupMessage));
    
    // Mark session as active
    this.onStatusCallback?.('session_started');
  }

  // End current session
  endSession() {
    if (this.ws && this.isConnected) {
      this.ws.send(JSON.stringify({
        type: 'end_session'
      }));
      this.sessionId = null;
    }
  }

  // Send audio chunk to Gemini Live API
  sendAudioChunk(audioData, format = 'webm', sampleRate = 16000, channels = 1) {
    if (!this.isConnected || !this.sessionId) {
      throw new Error('Session not active');
    }

    try {
      // Convert audio to base64 if it's not already
      const base64Audio = audioData.startsWith('data:') ? audioData.split(',')[1] : audioData;
      
      // Send audio data to Gemini Live API
      const audioMessage = {
        realtimeInput: {
          mediaChunks: [{
            mimeType: `audio/${format}`,
            data: base64Audio
          }]
        }
      };

      this.ws.send(JSON.stringify(audioMessage));
      console.log('🎤 Audio chunk sent to Gemini Live API');
    } catch (error) {
      console.error('Error sending audio chunk:', error);
      this.onErrorCallback?.('Failed to send audio to Gemini Live API');
    }
  }

  // Start recording from microphone
  async startRecording() {
    if (this.isRecording) {
      console.warn('Already recording');
      return;
    }

    try {
      console.log('🎤 Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });

      console.log('✅ Microphone access granted');
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          this.processAudioChunk(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        console.log('🎤 Recording stopped');
      };

      this.mediaRecorder.start(1000); // Send chunks every 1 second
      this.isRecording = true;
      this.onStatusCallback?.('recording_started');
      console.log('🎤 Recording started');
    } catch (error) {
      console.error('Microphone access error:', error);
      const errorMessage = error instanceof Error ? error.message : 
                         error instanceof Event ? 'Microphone access failed' : 
                         'Failed to start recording';
      this.onErrorCallback?.(errorMessage);
      throw new Error(errorMessage);
    }
  }

  // Stop recording
  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.onStatusCallback?.('recording_stopped');
    }
  }

  // Process audio chunk and send to server
  async processAudioChunk(audioBlob) {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      this.sendAudioChunk(base64Audio, 'webm', 16000, 1);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 
                         error instanceof Event ? 'Audio processing failed' : 
                         'Failed to process audio';
      this.onErrorCallback?.(errorMessage);
    }
  }

  // Set callback functions
  onTranscription(callback) {
    this.onTranscriptionCallback = callback;
  }

  onResponse(callback) {
    this.onResponseCallback = callback;
  }

  onError(callback) {
    this.onErrorCallback = callback;
  }

  onStatus(callback) {
    this.onStatusCallback = callback;
  }

  // REST API methods for fallback
  async startSessionREST(options = {}) {
    const defaultOptions = {
      session_id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      model: 'gemini-live-2.5-flash-preview',
      response_modality: 'text',
      input_transcription: true,
      output_transcription: true
    };

    const sessionOptions = { ...defaultOptions, ...options };

    try {
      const response = await fetch('/api/v1/live-audio/session/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sessionOptions)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.sessionId = sessionOptions.session_id;
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 
                         error instanceof Event ? 'Failed to start session' : 
                         'Session start failed';
      this.onErrorCallback?.(errorMessage);
      throw new Error(errorMessage);
    }
  }

  async transcribeAudioREST(audioData, format = 'webm', sampleRate = 16000, channels = 1) {
    if (!this.sessionId) {
      throw new Error('No active session');
    }

    try {
      const response = await fetch('/api/v1/live-audio/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: this.sessionId,
          audio_data: audioData,
          format,
          sample_rate: sampleRate,
          channels
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 
                         error instanceof Event ? 'Failed to transcribe audio' : 
                         'Transcription failed';
      this.onErrorCallback?.(errorMessage);
      throw new Error(errorMessage);
    }
  }

  async endSessionREST() {
    if (!this.sessionId) {
      return;
    }

    try {
      const response = await fetch('/api/v1/live-audio/session/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: this.sessionId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.sessionId = null;
      return await response.json();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 
                         error instanceof Event ? 'Failed to end session' : 
                         'Session end failed';
      this.onErrorCallback?.(errorMessage);
      throw new Error(errorMessage);
    }
  }

  // Utility methods
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.sessionId = null;
  }

  isSessionActive() {
    return this.sessionId !== null;
  }

  getSessionId() {
    return this.sessionId;
  }

  getConnectionStatus() {
    return this.isConnected;
  }

  getRecordingStatus() {
    return this.isRecording;
  }
}

export default GeminiLiveService;