import { useState, useEffect, useRef, useCallback } from 'react';
import GeminiLiveService from '../services/geminiLiveService';

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
    apiKey = null,
    model = 'gemini-2.0-flash-exp',
    responseModality = 'text',
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
        setResponse(responseText || '');
      });

      serviceRef.current.onError((error) => {
        const errorMessage = error instanceof Error ? error.message : 
                           error instanceof Event ? 'Connection failed' : 
                           typeof error === 'string' ? error : 
                           'Unknown error occurred';
        setError(errorMessage);
        console.error('Gemini Live Error:', error);
      });

      serviceRef.current.onStatus((newStatus) => {
        console.log('Status callback received:', newStatus);
        setStatus(newStatus);
        const newIsConnected = newStatus === 'connected' || newStatus === 'session_started';
        console.log('Setting isConnected to:', newIsConnected);
        setIsConnected(newIsConnected);
        setSessionActive(newStatus === 'session_started');
        setIsRecording(newStatus === 'recording_started');
        
        if (newStatus === 'recording_stopped') {
          setIsRecording(false);
        }
        
        if (newStatus === 'session_ended') {
          setSessionActive(false);
        }
      });
    }

    // Auto-connect if enabled
    if (autoConnect && !isConnected) {
      connect();
    }

    // Cleanup
    return () => {
      if (serviceRef.current) {
        serviceRef.current.disconnect();
      }
    };
  }, [autoConnect, isConnected]);

  // Connect to Gemini Live API
  const connect = useCallback(async () => {
    if (serviceRef.current && !isConnected) {
      try {
        console.log('Attempting to connect to Gemini Live API...');
        await serviceRef.current.connect(apiKey);
        setError(null);
        console.log('Successfully connected to Gemini Live API');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 
                           error instanceof Event ? 'Connection failed' : 
                           typeof error === 'string' ? error : 
                           'Failed to connect';
        setError(errorMessage);
        console.error('Failed to connect to Gemini Live API:', error);
      }
    } else if (isConnected) {
      console.log('Already connected to Gemini Live API');
    }
  }, [apiKey, isConnected]);

  // Start session
  const startSession = useCallback(async () => {
    if (serviceRef.current) {
      // Check the actual service connection status instead of hook state
      const actualConnectionStatus = serviceRef.current.getConnectionStatus();
      
      if (!actualConnectionStatus) {
        console.warn('Service not connected, attempting to connect first...');
        try {
          await serviceRef.current.connect(apiKey);
          // Wait a bit for connection to stabilize
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error('Failed to connect before starting session:', error);
          throw error;
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
          inputTranscription: inputTranscriptionEnabled,
          outputTranscription: outputTranscriptionEnabled
        };
        
        await serviceRef.current.startSession(sessionOptions);
        setError(null);
        console.log('Session started successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 
                           error instanceof Event ? 'Failed to start session' : 
                           typeof error === 'string' ? error : 
                           'Failed to start session';
        setError(errorMessage);
        console.error('Failed to start session:', error);
      }
    }
  }, [apiKey, model, responseModality, inputTranscriptionEnabled, outputTranscriptionEnabled]);

  // End session
  const endSession = useCallback(() => {
    if (serviceRef.current && sessionActive) {
      serviceRef.current.endSession();
      setSessionActive(false);
    }
  }, [sessionActive]);

  // Start recording
  const startRecording = useCallback(async () => {
    if (serviceRef.current && sessionActive && !isRecording) {
      try {
        await serviceRef.current.startRecording();
        setError(null);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 
                           error instanceof Event ? 'Failed to start recording' : 
                           typeof error === 'string' ? error : 
                           'Failed to start recording';
        setError(errorMessage);
        console.error('Failed to start recording:', error);
      }
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

  // Send audio chunk manually
  const sendAudioChunk = useCallback((audioData, format = 'webm', sampleRate = 16000, channels = 1) => {
    if (serviceRef.current && sessionActive) {
      try {
        serviceRef.current.sendAudioChunk(audioData, format, sampleRate, channels);
        setError(null);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 
                           error instanceof Event ? 'Failed to send audio chunk' : 
                           typeof error === 'string' ? error : 
                           'Failed to send audio chunk';
        setError(errorMessage);
        console.error('Failed to send audio chunk:', error);
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
    sendAudioChunk,
    clearTranscription,
    clearResponse,
    clearError,
    getSessionInfo
  };
};

export default useGeminiLive;