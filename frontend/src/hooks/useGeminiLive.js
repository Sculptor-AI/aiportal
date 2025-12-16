import { useState, useEffect, useRef, useCallback } from 'react';
import GeminiLiveService from '../services/geminiLiveService';

/**
 * React hook for Gemini Live WebSocket API
 * Provides real-time audio/text communication with Gemini
 */
const useGeminiLive = (options = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [response, setResponse] = useState('');
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('disconnected');
  const [inputTranscription, setInputTranscription] = useState('');
  const [outputTranscription, setOutputTranscription] = useState('');

  const serviceRef = useRef(null);
  const {
    model = 'gemini-2.5-flash-preview-native-audio',
    responseModality = 'audio',
    voiceName = 'Aoede',
    systemInstruction = null,
    inputTranscriptionEnabled = true,
    outputTranscriptionEnabled = true,
    autoConnect = false
  } = options;

  // Initialize service
  useEffect(() => {
    if (!serviceRef.current) {
      serviceRef.current = new GeminiLiveService();

      // Set up callbacks
      serviceRef.current.onTranscription((transcriptionText) => {
        setTranscription(transcriptionText || '');
        setInputTranscription(transcriptionText || '');
      });

      serviceRef.current.onResponse((responseText) => {
        setResponse(prev => {
          // Append or replace based on whether it's streaming
          if (responseText && responseText.length > 0) {
            return responseText;
          }
          return prev;
        });
        setOutputTranscription(responseText || '');
      });

      serviceRef.current.onError((errorMsg) => {
        const errorMessage = errorMsg instanceof Error ? errorMsg.message :
                           errorMsg instanceof Event ? 'Connection failed' :
                           typeof errorMsg === 'string' ? errorMsg :
                           'Unknown error occurred';
        setError(errorMessage);
        console.error('Gemini Live Error:', errorMsg);
      });

      serviceRef.current.onStatus((newStatus) => {
        console.log('Status callback received:', newStatus);
        setStatus(newStatus);

        switch (newStatus) {
          case 'connected':
            setIsConnected(true);
            break;
          case 'disconnected':
            setIsConnected(false);
            setSessionActive(false);
            setIsRecording(false);
            break;
          case 'session_started':
            setSessionActive(true);
            break;
          case 'session_ended':
            setSessionActive(false);
            setIsRecording(false);
            break;
          case 'recording_started':
            setIsRecording(true);
            break;
          case 'recording_stopped':
            setIsRecording(false);
            break;
          case 'turn_complete':
            // Response finished
            break;
          default:
            break;
        }
      });
    }

    // Auto-connect if enabled
    if (autoConnect && !isConnected) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      if (serviceRef.current) {
        serviceRef.current.disconnect();
      }
    };
  }, []);

  // Connect to Gemini Live API (via backend proxy)
  const connect = useCallback(async () => {
    if (!serviceRef.current) return;

    if (isConnected) {
      console.log('Already connected to Gemini Live');
      return;
    }

    try {
      console.log('Attempting to connect to Gemini Live via backend...');
      await serviceRef.current.connect();
      setError(null);
      console.log('Successfully connected to Gemini Live');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message :
                         err instanceof Event ? 'Connection failed' :
                         typeof err === 'string' ? err :
                         'Failed to connect';
      setError(errorMessage);
      console.error('Failed to connect to Gemini Live:', err);
    }
  }, [isConnected]);

  // Start session
  const startSession = useCallback(async () => {
    if (!serviceRef.current) return;

    // Connect first if not connected
    if (!serviceRef.current.getConnectionStatus()) {
      console.warn('Service not connected, attempting to connect first...');
      try {
        await serviceRef.current.connect();
        // Wait a bit for connection to stabilize
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (err) {
        console.error('Failed to connect before starting session:', err);
        throw err;
      }
    }

    // Check if session is already active
    if (serviceRef.current.isSessionActive()) {
      console.log('Session already active, skipping start session');
      return;
    }

    try {
      console.log('Starting new session...');
      const sessionOptions = {
        model,
        responseModality,
        voiceName,
        systemInstruction,
        inputTranscription: inputTranscriptionEnabled,
        outputTranscription: outputTranscriptionEnabled
      };

      await serviceRef.current.startSession(sessionOptions);
      setError(null);
      console.log('Session started successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message :
                         err instanceof Event ? 'Failed to start session' :
                         typeof err === 'string' ? err :
                         'Failed to start session';
      setError(errorMessage);
      console.error('Failed to start session:', err);
    }
  }, [model, responseModality, voiceName, systemInstruction, inputTranscriptionEnabled, outputTranscriptionEnabled]);

  // End session
  const endSession = useCallback(async () => {
    if (serviceRef.current && sessionActive) {
      await serviceRef.current.endSession();
      setSessionActive(false);
    }
  }, [sessionActive]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!serviceRef.current) return;

    if (!sessionActive) {
      console.warn('Session not active, cannot start recording');
      setError('Please wait for session to start');
      return;
    }

    if (isRecording) {
      console.log('Already recording');
      return;
    }

    try {
      await serviceRef.current.startRecording();
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message :
                         err instanceof Event ? 'Failed to start recording' :
                         typeof err === 'string' ? err :
                         'Failed to start recording';
      setError(errorMessage);
      console.error('Failed to start recording:', err);
    }
  }, [sessionActive, isRecording]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (serviceRef.current && isRecording) {
      serviceRef.current.stopRecording();
    }
  }, [isRecording]);

  // Toggle recording
  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Send text message
  const sendText = useCallback((text) => {
    if (serviceRef.current && sessionActive) {
      serviceRef.current.sendText(text);
      setError(null);
    } else {
      console.warn('Cannot send text: session not active');
    }
  }, [sessionActive]);

  // Send audio chunk manually
  const sendAudioChunk = useCallback((audioData, format = 'pcm') => {
    if (serviceRef.current && sessionActive) {
      try {
        serviceRef.current.sendAudioChunk(audioData, format);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message :
                           err instanceof Event ? 'Failed to send audio chunk' :
                           typeof err === 'string' ? err :
                           'Failed to send audio chunk';
        setError(errorMessage);
        console.error('Failed to send audio chunk:', err);
      }
    }
  }, [sessionActive]);

  // Clear transcription
  const clearTranscription = useCallback(() => {
    setTranscription('');
    setInputTranscription('');
    setOutputTranscription('');
  }, []);

  // Clear response
  const clearResponse = useCallback(() => {
    setResponse('');
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.disconnect();
      setIsConnected(false);
      setSessionActive(false);
      setIsRecording(false);
    }
  }, []);

  // Get session info
  const getSessionInfo = useCallback(() => {
    if (serviceRef.current) {
      return {
        sessionId: serviceRef.current.getSessionId(),
        isConnected: serviceRef.current.getConnectionStatus(),
        isRecording: serviceRef.current.getRecordingStatus(),
        sessionActive: serviceRef.current.isSessionActive()
      };
    }
    return null;
  }, []);

  return {
    // State
    isConnected,
    isRecording,
    sessionActive,
    transcription,
    response,
    error,
    status,
    inputTranscription,
    outputTranscription,

    // Actions
    connect,
    disconnect,
    startSession,
    endSession,
    startRecording,
    stopRecording,
    toggleRecording,
    sendText,
    sendAudioChunk,
    clearTranscription,
    clearResponse,
    clearError,
    getSessionInfo
  };
};

export default useGeminiLive;
