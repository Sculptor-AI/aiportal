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
      serviceRef.current.onTranscription((data) => {
        setTranscription(data.transcript || '');
        setInputTranscription(data.inputTranscription || '');
        setOutputTranscription(data.outputTranscription || '');
      });

      serviceRef.current.onResponse((data) => {
        setResponse(data.response || data.transcript || '');
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
        setStatus(newStatus);
        setIsConnected(newStatus === 'connected' || newStatus === 'session_started');
        setSessionActive(newStatus === 'session_started');
        setIsRecording(newStatus === 'recording_started');
        
        if (newStatus === 'recording_stopped') {
          setIsRecording(false);
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
        await serviceRef.current.connect(apiKey);
        setError(null);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 
                           error instanceof Event ? 'Connection failed' : 
                           typeof error === 'string' ? error : 
                           'Failed to connect';
        setError(errorMessage);
        console.error('Failed to connect to Gemini Live API:', error);
      }
    }
  }, [apiKey, isConnected]);

  // Start session
  const startSession = useCallback(async () => {
    if (serviceRef.current && isConnected) {
      try {
        const sessionOptions = {
          model,
          response_modality: responseModality,
          input_transcription: inputTranscriptionEnabled,
          output_transcription: outputTranscriptionEnabled
        };
        
        serviceRef.current.startSession(sessionOptions);
        setError(null);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 
                           error instanceof Event ? 'Failed to start session' : 
                           typeof error === 'string' ? error : 
                           'Failed to start session';
        setError(errorMessage);
        console.error('Failed to start session:', error);
      }
    }
  }, [isConnected, model, responseModality, inputTranscriptionEnabled, outputTranscriptionEnabled]);

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