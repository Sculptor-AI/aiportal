/**
 * Gemini Live WebSocket Service
 * Connects to backend WebSocket proxy which forwards to Google's Gemini Live API
 * This keeps API keys secure on the backend
 *
 * Backend endpoint: /api/v1/live
 */

class GeminiLiveService {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.sessionActive = false;
    this.isRecording = false;

    // Callbacks
    this.onResponseCallback = null;
    this.onTranscriptionCallback = null;
    this.onErrorCallback = null;
    this.onStatusCallback = null;
    this.onAudioCallback = null;

    // Audio handling
    this.audioContext = null;
    this.audioWorklet = null;
    this.mediaStream = null;

    // Audio playback
    this.audioQueue = [];
    this.isPlaying = false;
    this.playbackAudioContext = null;

    // Configuration
    this.config = {
      model: 'models/gemini-2.5-flash-preview-native-audio',
      responseModalities: ['AUDIO'],
      voiceName: 'Aoede',
      systemInstruction: 'You are a helpful AI assistant. Be concise and friendly.'
    };
  }

  /**
   * Get WebSocket URL for backend proxy
   */
  _getWebSocketUrl() {
    const backendUrl = import.meta.env.VITE_BACKEND_API_URL || '';

    // Convert HTTP URL to WebSocket URL
    let wsUrl;
    if (backendUrl.startsWith('https://')) {
      wsUrl = backendUrl.replace('https://', 'wss://');
    } else if (backendUrl.startsWith('http://')) {
      wsUrl = backendUrl.replace('http://', 'ws://');
    } else {
      // Default to current host
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${window.location.host}`;
    }

    return `${wsUrl}/api/v1/live`;
  }

  /**
   * Connect to backend WebSocket proxy
   */
  async connect() {
    console.log('GeminiLiveService.connect() called');

    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      console.log('Already connected, skipping connection attempt');
      return;
    }

    const wsUrl = this._getWebSocketUrl();
    console.log('Connecting to backend WebSocket:', wsUrl);

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected to backend');
          this.isConnected = true;
          this.onStatusCallback?.('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          this._handleMessage(event);
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.onErrorCallback?.('WebSocket connection error');
          reject(new Error('WebSocket connection error'));
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket closed:', event.code, event.reason);
          this.isConnected = false;
          this.sessionActive = false;
          this.onStatusCallback?.('disconnected');

          if (event.code !== 1000) {
            this.onErrorCallback?.(`Connection closed: ${event.reason || 'Unknown reason'}`);
          }
        };

      } catch (error) {
        console.error('Error creating WebSocket:', error);
        this.onErrorCallback?.(error.message);
        reject(error);
      }
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  _handleMessage(event) {
    try {
      const data = JSON.parse(event.data);
      console.log('Received message:', Object.keys(data));

      // Handle connection closed from backend
      if (data.connectionClosed) {
        console.warn('Backend reported connection closed:', data.connectionClosed);
        this.sessionActive = false;
        this.onStatusCallback?.('session_ended');
        return;
      }

      // Handle errors from backend
      if (data.error) {
        console.error('Backend error:', data.error);
        this.onErrorCallback?.(data.error.message || 'Backend error');
        return;
      }

      // Setup complete acknowledgment
      if (data.setupComplete) {
        console.log('✅ Session setup complete');
        this.sessionActive = true;
        this.onStatusCallback?.('session_started');
        return;
      }

      // Server content (model responses)
      if (data.serverContent) {
        this._handleServerContent(data.serverContent);
        return;
      }

      // Tool calls (if using function calling)
      if (data.toolCall) {
        console.log('Tool call received:', data.toolCall);
        return;
      }

      // Go away message (server requesting disconnect)
      if (data.goAway) {
        console.warn('Server requesting disconnect, time left:', data.goAway.timeLeft);
        this.onErrorCallback?.('Server is closing connection');
        return;
      }

    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }

  /**
   * Handle server content responses
   */
  _handleServerContent(content) {
    // Handle model turn (generated content)
    if (content.modelTurn) {
      const parts = content.modelTurn.parts || [];

      for (const part of parts) {
        // Text response
        if (part.text) {
          console.log('Text response:', part.text);
          this.onResponseCallback?.(part.text);
        }

        // Audio response
        if (part.inlineData) {
          const { mimeType, data } = part.inlineData;
          if (mimeType?.startsWith('audio/')) {
            console.log('Audio response received');
            this._handleAudioResponse(data, mimeType);
          }
        }
      }
    }

    // Handle transcription of user input
    if (content.inputTranscription) {
      console.log('Input transcription:', content.inputTranscription.text);
      this.onTranscriptionCallback?.(content.inputTranscription.text);
    }

    // Handle transcription of model output
    if (content.outputTranscription) {
      console.log('Output transcription:', content.outputTranscription.text);
      this.onResponseCallback?.(content.outputTranscription.text);
    }

    // Handle interruption
    if (content.interrupted) {
      console.log('Response was interrupted');
      this._stopAudioPlayback();
    }

    // Handle turn complete
    if (content.turnComplete) {
      console.log('Turn complete');
      this.onStatusCallback?.('turn_complete');
    }

    // Handle generation complete
    if (content.generationComplete) {
      console.log('Generation complete');
    }
  }

  /**
   * Handle audio response from server
   */
  _handleAudioResponse(base64Data, mimeType) {
    try {
      // Decode base64 to array buffer
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Queue for playback
      this.audioQueue.push({
        data: bytes.buffer,
        sampleRate: 24000 // Gemini outputs 24kHz audio
      });

      // Start playback if not already playing
      if (!this.isPlaying) {
        this._playNextAudio();
      }

      // Notify callback
      this.onAudioCallback?.(bytes.buffer);

    } catch (error) {
      console.error('Error handling audio response:', error);
    }
  }

  /**
   * Play queued audio responses
   */
  async _playNextAudio() {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const { data, sampleRate } = this.audioQueue.shift();

    try {
      if (!this.playbackAudioContext) {
        this.playbackAudioContext = new (window.AudioContext || window.webkitAudioContext)();
      }

      // Convert Int16 PCM to Float32
      const int16Array = new Int16Array(data);
      const float32Array = new Float32Array(int16Array.length);
      for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768.0;
      }

      // Create audio buffer
      const audioBuffer = this.playbackAudioContext.createBuffer(1, float32Array.length, sampleRate);
      audioBuffer.copyToChannel(float32Array, 0);

      // Play
      const source = this.playbackAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.playbackAudioContext.destination);
      source.onended = () => this._playNextAudio();
      source.start();

    } catch (error) {
      console.error('Error playing audio:', error);
      this._playNextAudio(); // Try next in queue
    }
  }

  /**
   * Stop audio playback
   */
  _stopAudioPlayback() {
    this.audioQueue = [];
    this.isPlaying = false;
  }

  /**
   * Start a new session with configuration
   */
  async startSession(options = {}) {
    if (!this.isConnected || this.ws?.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to server');
    }

    if (this.sessionActive) {
      console.log('Session already active');
      return;
    }

    // Merge options with defaults
    const model = options.model || this.config.model;
    const responseModalities = options.responseModality === 'text' ? ['TEXT'] : ['AUDIO'];

    // Build setup message
    const setupMessage = {
      setup: {
        model: model.startsWith('models/') ? model : `models/${model}`,
        generationConfig: {
          responseModalities: responseModalities
        }
      }
    };

    // Add speech config for audio responses
    if (responseModalities.includes('AUDIO')) {
      setupMessage.setup.generationConfig.speechConfig = {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: options.voiceName || this.config.voiceName
          }
        }
      };
    }

    // Add system instruction if provided
    if (options.systemInstruction || this.config.systemInstruction) {
      setupMessage.setup.systemInstruction = {
        parts: [{ text: options.systemInstruction || this.config.systemInstruction }]
      };
    }

    // Enable transcription if requested
    if (options.inputTranscription !== false) {
      setupMessage.setup.inputAudioTranscription = {};
    }
    if (options.outputTranscription !== false) {
      setupMessage.setup.outputAudioTranscription = {};
    }

    console.log('🚀 Sending session setup:', setupMessage);

    try {
      this.ws.send(JSON.stringify(setupMessage));
      // Session will be marked active when we receive setupComplete
    } catch (error) {
      console.error('Error sending setup message:', error);
      this.onErrorCallback?.(error.message);
      throw error;
    }
  }

  /**
   * End current session
   */
  async endSession() {
    console.log('Ending session...');
    this.sessionActive = false;
    this._stopAudioPlayback();
    this.stopRecording();
    this.onStatusCallback?.('session_ended');
  }

  /**
   * Send audio chunk to Gemini
   */
  sendAudioChunk(base64AudioData, format = 'pcm') {
    if (!this.sessionActive || this.ws?.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send audio: session not active');
      return;
    }

    // Remove data URL prefix if present
    const audioData = base64AudioData.includes(',')
      ? base64AudioData.split(',')[1]
      : base64AudioData;

    const message = {
      realtimeInput: {
        mediaChunks: [{
          mimeType: 'audio/pcm;rate=16000',
          data: audioData
        }]
      }
    };

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending audio chunk:', error);
    }
  }

  /**
   * Send text message to Gemini
   */
  sendText(text) {
    if (!this.sessionActive || this.ws?.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send text: session not active');
      return;
    }

    const message = {
      clientContent: {
        turns: [{
          role: 'user',
          parts: [{ text }]
        }],
        turnComplete: true
      }
    };

    console.log('Sending text:', text);

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending text:', error);
      this.onErrorCallback?.(error.message);
    }
  }

  /**
   * Start recording from microphone with PCM conversion
   */
  async startRecording(onStopCallback) {
    if (this.isRecording) {
      console.log('Already recording');
      return;
    }

    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Create audio context for processing
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000
      });

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Use ScriptProcessorNode for PCM capture
      const bufferSize = 4096;
      const processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

      processor.onaudioprocess = (event) => {
        if (!this.isRecording) return;

        const inputData = event.inputBuffer.getChannelData(0);

        // Convert Float32 to Int16 PCM
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const sample = Math.max(-1, Math.min(1, inputData[i]));
          pcmData[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        }

        // Convert to base64
        const base64 = this._arrayBufferToBase64(pcmData.buffer);

        // Send to backend (which forwards to Gemini)
        this.sendAudioChunk(base64);
      };

      source.connect(processor);
      processor.connect(this.audioContext.destination);

      this.audioWorklet = processor;
      this.isRecording = true;
      this.onStatusCallback?.('recording_started');

      console.log('🎤 Recording started');

    } catch (error) {
      console.error('Error starting recording:', error);
      this.onErrorCallback?.('Microphone access denied. Please allow microphone access in your browser settings.');
      throw error;
    }
  }

  /**
   * Stop recording
   */
  stopRecording() {
    if (!this.isRecording) return;

    console.log('🛑 Stopping recording');

    this.isRecording = false;

    // Disconnect audio processor
    if (this.audioWorklet) {
      this.audioWorklet.disconnect();
      this.audioWorklet = null;
    }

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Stop media stream
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    this.onStatusCallback?.('recording_stopped');
  }

  /**
   * Convert ArrayBuffer to base64
   */
  _arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    console.log('Disconnecting from Gemini Live...');

    this.stopRecording();
    this._stopAudioPlayback();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    if (this.playbackAudioContext) {
      this.playbackAudioContext.close();
      this.playbackAudioContext = null;
    }

    this.isConnected = false;
    this.sessionActive = false;
  }

  // Callback setters
  onResponse(callback) { this.onResponseCallback = callback; }
  onTranscription(callback) { this.onTranscriptionCallback = callback; }
  onError(callback) { this.onErrorCallback = callback; }
  onStatus(callback) { this.onStatusCallback = callback; }
  onAudio(callback) { this.onAudioCallback = callback; }

  // Status getters
  isSessionActive() { return this.sessionActive; }
  getSessionId() { return this.sessionActive ? 'active' : null; }
  getConnectionStatus() { return this.isConnected; }
  getRecordingStatus() { return this.isRecording; }
}

export default GeminiLiveService;
