import React, { useState, useRef, useEffect } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { useTheme } from 'styled-components';
import ModelIcon from './ModelIcon';
import useGeminiLive from '../hooks/useGeminiLive';
import AudioVisualizer from './AudioVisualizer';

// --- Animations ---

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { transform: translateY(50px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

// --- Styled Components ---

const Container = styled.div`
  position: fixed;
  inset: 0;
  z-index: 2000;
  background-color: #09090b; /* Deep dark background */
  background-image: 
    radial-gradient(circle at 50% 0%, rgba(66, 133, 244, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 100% 100%, rgba(219, 68, 55, 0.1) 0%, transparent 40%);
  display: flex;
  flex-direction: column;
  color: #fff;
  animation: ${fadeIn} 0.5s ease-out;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  overflow: hidden;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  z-index: 10;
`;

const StatusBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  backdrop-filter: blur(10px);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.5px;
  
  &::before {
    content: '';
    display: block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: ${props => {
    switch (props.$status) {
      case 'connected': return '#34A853'; // Green
      case 'recording': return '#EA4335'; // Red
      case 'processing': return '#FBBC04'; // Yellow
      default: return '#9AA0A6'; // Grey
    }
  }};
    box-shadow: ${props => props.$status === 'connected' || props.$status === 'recording' ? `0 0 8px ${props.$status === 'connected' ? '#34A853' : '#EA4335'}` : 'none'};
  }
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  transition: all 0.2s ease;
  backdrop-filter: blur(5px);
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  padding-bottom: 120px; /* Space for controls */
`;

const CenterStage = styled.div`
  width: 100%;
  max-width: ${props => props.$hasVideo ? '1200px' : '600px'};
  height: ${props => props.$hasVideo ? 'calc(100vh - 200px)' : 'auto'};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: all 0.5s ease;
`;

const AvatarContainer = styled.div`
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  border: 4px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40px;
  box-shadow: 0 0 60px rgba(66, 133, 244, 0.1);
  animation: ${float} 6s ease-in-out infinite;
  
  img, svg {
    width: 80px;
    height: 80px;
    opacity: 0.9;
  }
`;

const VideoSurface = styled.video`
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 24px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
  background: #000;
  animation: ${fadeIn} 0.5s ease;
`;

const TranscriptionOverlay = styled.div`
  position: absolute;
  bottom: 0px;
  left: 0;
  right: 0;
  padding: 40px 20px 140px;
  text-align: center;
  background: linear-gradient(to top, rgba(9, 9, 11, 1) 0%, rgba(9, 9, 11, 0) 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  pointer-events: none;
`;

const TextBubble = styled.div`
  max-width: 800px;
  font-size: 24px;
  line-height: 1.4;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
  opacity: 0.9;
  margin-top: 16px;
  font-weight: 500;
  
  /* Highlight user vs AI text */
  ${props => props.$isUser && css`
    color: rgba(255, 255, 255, 0.7);
    font-size: 20px;
  `}
`;

const ControlsBar = styled.div`
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: rgba(28, 28, 30, 0.85);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 100px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  z-index: 100;
  animation: ${slideUp} 0.5s ease-out 0.2s backwards;
`;

const ControlButton = styled.button`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
  
  /* Icons size */
  svg {
    width: 24px;
    height: 24px;
  }
  
  ${props => {
    // Active State (e.g. Mic On, Camera On)
    if (props.$isActive) {
      if (props.$variant === 'danger') {
        return css`
          background: #EA4335;
          color: white;
          &:hover { background: #D93025; transform: scale(1.1); }
        `;
      }
      return css`
        background: #fff;
        color: #000;
        &:hover { background: #f0f0f0; transform: scale(1.1); }
      `;
    }
    // Inactive State
    else {
      return css`
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
        &:hover { background: rgba(255, 255, 255, 0.2); transform: scale(1.1); }
      `;
    }
  }}
`;

const ErrorBanner = styled.div`
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(234, 67, 53, 0.9);
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  backdrop-filter: blur(4px);
  animation: ${slideUp} 0.3s ease-out;
  z-index: 50;
`;

const LiveModeUI = ({ selectedModel, onClose }) => {
  const [microphoneActive, setMicrophoneActive] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [screenShareActive, setScreenShareActive] = useState(false);

  const [cameraStream, setCameraStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);

  const [cameraError, setCameraError] = useState('');
  const [screenError, setScreenError] = useState('');

  const cameraVideoRef = useRef(null);
  const screenVideoRef = useRef(null);

  // Gemini Live Hook
  const {
    isConnected,
    isRecording,
    sessionActive,
    transcription,
    response,
    error: geminiError,
    status,
    inputTranscription,
    connect,
    disconnect,
    startSession,
    endSession,
    startRecording,
    stopRecording,
  } = useGeminiLive({
    apiKey: import.meta.env.VITE_GOOGLE_API_KEY || localStorage.getItem('google_api_key'),
    model: selectedModel?.includes('gemini') ? selectedModel : 'gemini-2.0-flash-exp',
    responseModality: 'text',
    inputTranscriptionEnabled: true,
    outputTranscriptionEnabled: true,
    autoConnect: false
  });

  // Sync mic state
  useEffect(() => {
    setMicrophoneActive(isRecording);
  }, [isRecording]);

  // Initial connection
  useEffect(() => {
    const init = async () => {
      if (!isConnected) await connect();
    };
    init();

    // Cleanup
    return () => {
      stopMediaStreams();
      if (sessionActive) endSession();
      disconnect();
    };
  }, []);

  // Auto-start session when connected
  useEffect(() => {
    if (isConnected && !sessionActive && status === 'connected') {
      startSession();
    }
  }, [isConnected, sessionActive, status]);

  // Stream cleanup helper
  const stopMediaStreams = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    if (screenStream) {
      screenStream.getTracks().forEach(t => t.stop());
      setScreenStream(null);
    }
  };

  // Video refs
  useEffect(() => {
    if (cameraVideoRef.current && cameraStream) {
      cameraVideoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  // Toggle Handlers
  const handleMicrophoneToggle = async () => {
    if (microphoneActive) {
      await stopRecording();
    } else {
      if (!isConnected) await connect();
      if (!sessionActive) await startSession();
      await startRecording();
    }
  };

  const handleCameraToggle = async () => {
    if (cameraActive) {
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
        setCameraStream(null);
      }
      setCameraActive(false);
    } else {
      // Disable screen share if active (one video source at a time for simplicity)
      if (screenShareActive) handleScreenShareToggle();

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } });
        setCameraStream(stream);
        setCameraActive(true);
        setCameraError('');
      } catch (e) {
        console.error(e);
        setCameraError('Camera access denied');
      }
    }
  };

  const handleScreenShareToggle = async () => {
    if (screenShareActive) {
      if (screenStream) {
        screenStream.getTracks().forEach(t => t.stop());
        setScreenStream(null);
      }
      setScreenShareActive(false);
    } else {
      // Disable camera if active
      if (cameraActive) handleCameraToggle();

      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: 'always' }, audio: false });
        stream.getVideoTracks()[0].addEventListener('ended', () => {
          setScreenShareActive(false);
          setScreenStream(null);
        });
        setScreenStream(stream);
        setScreenShareActive(true);
        setScreenError('');
      } catch (e) {
        console.error(e);
        setScreenError('Screen share denied');
      }
    }
  };

  // Status Text
  const getStatusText = () => {
    if (!isConnected) return 'Connecting...';
    if (!sessionActive) return 'Starting...';
    if (isRecording) return 'Listening';
    if (status === 'processing') return 'Thinking';
    return 'Ready';
  };

  const getStatusColor = () => {
    if (!isConnected) return 'disconnected';
    if (isRecording) return 'recording';
    return 'connected';
  };

  const hasVideo = cameraActive || screenShareActive;

  return (
    <Container>
      <Header>
        <StatusBadge $status={getStatusColor()}>
          {getStatusText()}
        </StatusBadge>
        <CloseButton onClick={onClose} aria-label="Close Live Mode">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </CloseButton>
      </Header>

      {/* Errors */}
      {(cameraError || screenError || geminiError) && (
        <ErrorBanner>
          {cameraError || screenError || (typeof geminiError === 'string' ? geminiError : 'Connection error')}
        </ErrorBanner>
      )}

      <MainContent>
        <CenterStage $hasVideo={hasVideo}>
          {hasVideo ? (
            <VideoSurface
              ref={cameraActive ? cameraVideoRef : screenVideoRef}
              autoPlay
              muted
              playsInline
            />
          ) : (
            <AvatarContainer>
              {/* Show visualizer when recording/active, else static icon */}
              {isRecording || status === 'processing' ? (
                <AudioVisualizer isActive={true} />
              ) : (
                <ModelIcon modelId={selectedModel} size="large" />
              )}
            </AvatarContainer>
          )}

          {/* Transcriptions overlay at bottom of stage */}
          <TranscriptionOverlay>
            {inputTranscription && (
              <TextBubble $isUser>{inputTranscription}</TextBubble>
            )}
            {response && (
              <TextBubble>{response}</TextBubble>
            )}
          </TranscriptionOverlay>
        </CenterStage>
      </MainContent>

      <ControlsBar>
        <ControlButton
          $isActive={microphoneActive}
          $variant="danger" // Red when active
          onClick={handleMicrophoneToggle}
          title={microphoneActive ? "Mute Microphone" : "Unmute Microphone"}
        >
          {microphoneActive ? (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z" />
            </svg>
          )}
        </ControlButton>

        <ControlButton
          $isActive={cameraActive}
          onClick={handleCameraToggle}
          title={cameraActive ? "Turn Off Camera" : "Turn On Camera"}
        >
          {cameraActive ? (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82l-1-1H16c.55 0 1 .45 1 1v3.5l4-4v11l-1.43-1.43L21 6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.55-.18L19.73 21 21 19.73 3.27 2z" />
            </svg>
          )}
        </ControlButton>

        <ControlButton
          $isActive={screenShareActive}
          onClick={handleScreenShareToggle}
          title={screenShareActive ? "Stop Sharing" : "Share Screen"}
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z" />
          </svg>
        </ControlButton>
      </ControlsBar>
    </Container>
  );
};

export default LiveModeUI;