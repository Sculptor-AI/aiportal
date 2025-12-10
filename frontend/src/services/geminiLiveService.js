class GeminiLiveService {
  constructor() {
    this.baseUrl = 'https://api.sculptorai.org/api/v1/live-audio';
    this.apiKey = null;
    this.sessionId = null;
    this.isConnected = false;
    this.onResponseCallback = null;
    this.onTranscriptionCallback = null;
    this.onErrorCallback = null;
    this.onStatusCallback = null;
    this.mediaRecorder = null;
    this.isRecording = false;
  }

  // Connect using REST API instead of WebSocket
  async connect(apiKey = null) {
    console.log('GeminiLiveService.connect() called');
    
    if (this.isConnected) {
      console.log('Already connected, skipping connection attempt');
      return;
    }

    // Get API key using the same pattern as aiService
    if (!apiKey) {
      console.log('No API key provided, attempting to get from session storage...');
      // Get user's assigned backend API key from session
      try {
        const userJSON = sessionStorage.getItem('ai_portal_current_user');
        if (userJSON) {
          const user = JSON.parse(userJSON);
          console.log('Found user in session storage:', user.username);
          // User's assigned backend API key should be stored as their accessToken
          if (user.accessToken && user.accessToken.startsWith('ak_')) {
            apiKey = user.accessToken;
            console.log('Using user API key from session storage');
          } else {
            console.log('User accessToken does not start with ak_:', user.accessToken ? user.accessToken.substring(0, 10) + '...' : 'null');
          }
        } else {
          console.log('No user found in session storage');
        }
      } catch (e) {
        console.error('Error getting user session:', e);
      }

      // Fallback API key for development/testing (same as aiService)
      if (!apiKey) {
        console.log('Using fallback API key for development');
        apiKey = 'ak_2156e9306161e1c00b64688d4736bf00aecddd486f2a838c44a6e40144b52c19';
      }
    }

    // Store the API key for future requests
    this.apiKey = apiKey;
    console.log('Using API key:', apiKey ? apiKey.substring(0, 10) + '...' : 'null');
    
    if (!this.apiKey) {
      const error = 'API key is required for live audio service. Please log in to access this feature.';
      console.error('Connection failed:', error);
      this.onErrorCallback?.(error);
      throw new Error(error);
    }

    try {
      console.log('Testing connection to:', `${this.baseUrl}/sessions`);
      
      // Test connection to the API
      const response = await fetch(`${this.baseUrl}/sessions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        this.isConnected = true;
        this.onStatusCallback?.('connected');
        console.log('✅ Connected to live audio backend via REST API');
      } else {
        const errorText = await response.text().catch(() => '');
        console.error('Connection failed with status:', response.status, response.statusText);
        console.error('Error response body:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
      }
    } catch (error) {
      console.error('Error connecting to live audio server:', error);
      const errorMessage = `Failed to connect to live audio server: ${error.message}`;
      this.onErrorCallback?.(errorMessage);
      throw new Error(errorMessage);
    }
  }

  // Handle polling for responses (since we're using REST instead of WebSocket)
  async pollForResponse() {
    if (!this.sessionId || !this.apiKey) return;

    try {
      const response = await fetch(`${this.baseUrl}/session/${this.sessionId}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Handle any response data if needed
      }
    } catch (error) {
      console.error('Error polling for response:', error);
    }
  }

  // Start a new session using REST API
  async startSession(options = {}) {
    // Wait a bit if we just connected to ensure connection is stable
    if (this.isConnected) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!this.isConnected) {
      throw new Error('Not connected to live audio server');
    }

    if (!this.apiKey) {
      throw new Error('API key is required');
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startMessage = {
      session_id: sessionId,
      model: options.model || 'gemini-live-2.5-flash-preview',
      response_modality: 'text',
      input_transcription: true,
      output_transcription: true,
    };

    try {
      console.log('🚀 Starting live audio session with backend...', startMessage);
      
      const response = await fetch(`${this.baseUrl}/session/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify(startMessage),
      });

      if (response.ok) {
        const data = await response.json();
        this.sessionId = sessionId;
        this.onStatusCallback?.('session_started');
        console.log('Backend confirmed session started:', sessionId);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error starting session:', error);
      this.onErrorCallback?.(error.message);
      throw error;
    }
  }

  // End current session using REST API
  async endSession() {
    if (!this.sessionId || !this.apiKey) return;

    try {
      console.log('Ending session with backend...');
      
      const response = await fetch(`${this.baseUrl}/session/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify({
          session_id: this.sessionId,
        }),
      });

      if (response.ok) {
        this.sessionId = null;
        this.onStatusCallback?.('session_ended');
        console.log('Backend confirmed session ended');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error ending session:', error);
      this.onErrorCallback?.(error.message);
    }
  }

  // Send audio chunk using REST API
  async sendAudioChunk(audioData, format = 'webm') {
    if (!this.sessionId || !this.apiKey) return;

    try {
      const base64Audio = audioData.startsWith('data:') ? audioData.split(',')[1] : audioData;
      const audioMessage = {
        session_id: this.sessionId,
        audio_data: base64Audio,
        format: format,
        sample_rate: 16000,
        channels: 1,
      };

      const response = await fetch(`${this.baseUrl}/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify(audioMessage),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Handle the response data
        if (data.transcript || data.inputTranscription) {
          this.onTranscriptionCallback?.(data.transcript || data.inputTranscription);
        }
        if (data.response) {
          this.onResponseCallback?.(data.response);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error sending audio chunk:', error);
      this.onErrorCallback?.(`Failed to send audio: ${error.message}`);
    }
  }

  // Start recording from microphone
  startRecording(onStopCallback) {
    if (this.isRecording) return;
    navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true, noiseSuppression: true }
    })
    .then(stream => {
        this.isRecording = true;
        this.onStatusCallback?.('recording_started');
        this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        
        this.mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    this.sendAudioChunk(reader.result.toString(), 'webm');
                };
                reader.readAsDataURL(event.data);
            }
        };
        
        this.mediaRecorder.onstop = () => {
            this.isRecording = false;
            this.onStatusCallback?.('recording_stopped');
            stream.getTracks().forEach(track => track.stop());
            if (onStopCallback) onStopCallback();
        };
        
        this.mediaRecorder.start(1000);
    })
    .catch(error => {
        console.error('Error accessing microphone:', error);
        this.onErrorCallback?.('Microphone access denied. Please allow microphone access in your browser settings.');
    });
  }

  // Stop recording
  stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }
  }

  onResponse(callback) { this.onResponseCallback = callback; }
  onTranscription(callback) { this.onTranscriptionCallback = callback; }
  onError(callback) { this.onErrorCallback = callback; }
  onStatus(callback) { this.onStatusCallback = callback; }

  // Disconnect and cleanup
  disconnect() {
    this.isConnected = false;
    this.sessionId = null;
    this.apiKey = null;
    
    // Stop recording if active
    if (this.isRecording) {
      this.stopRecording();
    }
  }

  // Utility methods for compatibility
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