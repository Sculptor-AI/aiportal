import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import ModelIcon from './ModelIcon';

const LiveModeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: ${props => props.theme.backgroundColor};
  padding: clamp(20px, 5vw, 60px);
  animation: fadeIn 0.4s ease-out;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const ModelIconContainer = styled.div`
  margin-bottom: clamp(40px, 8vh, 80px);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: scaleIn 0.6s ease-out 0.2s both;
  
  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  & > div {
    width: clamp(100px, 15vw, 180px) !important;
    height: clamp(100px, 15vw, 180px) !important;
    border-radius: 50%;
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
    background: ${props => props.theme.cardBackground || props.theme.backgroundColor};
    border: 2px solid ${props => props.theme.borderColor || 'rgba(255, 255, 255, 0.1)'};
    padding: clamp(15px, 3vw, 25px);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    
    &:hover {
      transform: scale(1.05);
      box-shadow: 0 16px 64px rgba(0, 0, 0, 0.2);
    }
    
    & img, & svg {
      width: clamp(60px, 10vw, 120px) !important;
      height: clamp(60px, 10vw, 120px) !important;
      max-width: clamp(60px, 10vw, 120px) !important;
      max-height: clamp(60px, 10vw, 120px) !important;
    }
  }
`;

const ControlsContainer = styled.div`
  display: flex;
  gap: clamp(16px, 4vw, 32px);
  align-items: center;
  animation: slideUp 0.6s ease-out 0.4s both;
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const ControlButton = styled.button`
  width: clamp(50px, 8vw, 80px);
  height: clamp(50px, 8vw, 80px);
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  
  & svg {
    width: clamp(20px, 3.5vw, 32px);
    height: clamp(20px, 3.5vw, 32px);
  }
  
  ${props => {
    if (props.variant === 'microphone') {
      return `
        background: ${props.active ? '#ff4444' : '#4CAF50'};
        color: white;
        &:hover {
          background: ${props.active ? '#ff6666' : '#66BB6A'};
          transform: scale(1.1);
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
        }
      `;
    }
    if (props.variant === 'camera') {
      return `
        background: ${props.active ? '#2196F3' : '#757575'};
        color: white;
        &:hover {
          background: ${props.active ? '#42A5F5' : '#9E9E9E'};
          transform: scale(1.1);
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
        }
      `;
    }
    if (props.variant === 'screen') {
      return `
        background: ${props.active ? '#FF9800' : '#757575'};
        color: white;
        &:hover {
          background: ${props.active ? '#FFB74D' : '#9E9E9E'};
          transform: scale(1.1);
          box-shadow: 0 6px 24px rgba(0, 0, 0, 0.2);
        }
      `;
    }
  }}
  
  &:active {
    transform: scale(0.9);
  }
`;

const ControlLabel = styled.span`
  position: absolute;
  bottom: clamp(-35px, -5vw, -40px);
  left: 50%;
  transform: translateX(-50%);
  font-size: clamp(10px, 1.5vw, 14px);
  color: ${props => props.theme.textColor || '#ffffff'};
  white-space: nowrap;
  opacity: 0.8;
  font-weight: 500;
`;

const CloseButton = styled.button`
  position: absolute;
  top: clamp(15px, 3vw, 25px);
  right: clamp(15px, 3vw, 25px);
  background: ${props => props.theme.cardBackground || 'rgba(0, 0, 0, 0.1)'};
  border: 1px solid ${props => props.theme.borderColor || 'rgba(255, 255, 255, 0.2)'};
  border-radius: 50%;
  width: clamp(35px, 5vw, 45px);
  height: clamp(35px, 5vw, 45px);
  font-size: clamp(18px, 3vw, 24px);
  cursor: pointer;
  color: ${props => props.theme.textColor || '#ffffff'};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  opacity: 0.7;
  
  &:hover {
    opacity: 1;
    transform: scale(1.1);
    background: ${props => props.theme.buttonBackground || 'rgba(255, 255, 255, 0.1)'};
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }
  
  &:active {
    transform: scale(0.9);
  }
`;

const VideoPreview = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 20px;
  background: #000;
`;

const ScreenPreview = styled.video`
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 20px;
  background: #000;
`;

const PreviewContainer = styled.div`
  width: clamp(300px, 60vw, 800px);
  height: clamp(200px, 40vh, 500px);
  ${props => props.isScreen && `
    width: clamp(400px, 70vw, 900px);
    height: clamp(250px, 45vh, 550px);
  `}
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 80px rgba(0, 0, 0, 0.25);
  border: 3px solid ${props => props.theme.borderColor || 'rgba(255, 255, 255, 0.1)'};
  background: ${props => props.theme.cardBackground || props.theme.backgroundColor};
  animation: expandIn 0.8s ease-out both;
  transition: all 0.4s ease;
  margin-bottom: clamp(30px, 10vh, 20px);
  
  @keyframes expandIn {
    from {
      opacity: 0;
      transform: scale(0.3);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  &:hover {
    transform: scale(1.02);
    box-shadow: 0 25px 100px rgba(0, 0, 0, 0.3);
  }
`;

const ErrorMessage = styled.div`
  color: ${props => props.theme.textColor || '#ffffff'};
  font-size: clamp(12px, 2vw, 16px);
  text-align: center;
  opacity: 0.8;
  margin-top: 10px;
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

  // Cleanup function to stop media streams
  const stopMediaStreams = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
    }
  };

  // Handle component cleanup
  useEffect(() => {
    return () => {
      stopMediaStreams();
    };
  }, [cameraStream, screenStream]);

  // Update video elements when streams change
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

  const handleMicrophoneToggle = () => {
    setMicrophoneActive(!microphoneActive);
  };

  const handleCameraToggle = async () => {
    if (cameraActive) {
      // Stop camera
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
      setCameraActive(false);
      setCameraError('');
    } else {
      // Start camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
          } 
        });
        setCameraStream(stream);
        setCameraActive(true);
        setCameraError('');
      } catch (error) {
        console.error('Error accessing camera:', error);
        setCameraError('Camera access denied or unavailable');
        setCameraActive(false);
      }
    }
  };

  const handleScreenShareToggle = async () => {
    if (screenShareActive) {
      // Stop screen share
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        setScreenStream(null);
      }
      setScreenShareActive(false);
      setScreenError('');
    } else {
      // Start screen share
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false 
        });
        
        // Listen for when user stops sharing via browser UI
        stream.getVideoTracks()[0].addEventListener('ended', () => {
          setScreenShareActive(false);
          setScreenStream(null);
          setScreenError('');
        });
        
        setScreenStream(stream);
        setScreenShareActive(true);
        setScreenError('');
      } catch (error) {
        console.error('Error starting screen share:', error);
        setScreenError('Screen sharing denied or unavailable');
        setScreenShareActive(false);
      }
    }
  };

  const handleClose = () => {
    stopMediaStreams();
    onClose();
  };

  return (
    <LiveModeContainer>
      <CloseButton onClick={handleClose}>×</CloseButton>
      
      {/* Show model icon only when no camera or screen share is active */}
      {!cameraActive && !screenShareActive && (
        <ModelIconContainer>
          <ModelIcon modelId={selectedModel} size="large" />
        </ModelIconContainer>
      )}
      
      {/* Show large camera preview when camera is active */}
      {cameraActive && cameraStream && (
        <PreviewContainer>
          <VideoPreview 
            ref={cameraVideoRef}
            autoPlay 
            muted 
            playsInline
          />
        </PreviewContainer>
      )}
      
      {/* Show large screen preview when screen share is active */}
      {screenShareActive && screenStream && (
        <PreviewContainer isScreen>
          <ScreenPreview 
            ref={screenVideoRef}
            autoPlay 
            muted 
            playsInline
          />
        </PreviewContainer>
      )}
      
      {/* Error messages */}
      {cameraError && <ErrorMessage>{cameraError}</ErrorMessage>}
      {screenError && <ErrorMessage>{screenError}</ErrorMessage>}
      
      <ControlsContainer>
        <ControlButton
          variant="microphone"
          active={microphoneActive}
          onClick={handleMicrophoneToggle}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            {microphoneActive ? (
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1.2-9.1c0-.66.54-1.2 1.2-1.2s1.2.54 1.2 1.2l-.01 6.2c0 .66-.53 1.2-1.19 1.2s-1.2-.54-1.2-1.2V4.9zm6.2 6.1c0 3-2.54 5.1-5.1 5.1S6.8 14 6.8 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.8z"/>
            ) : (
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1.2-9.1c0-.66.54-1.2 1.2-1.2s1.2.54 1.2 1.2l-.01 6.2c0 .66-.53 1.2-1.19 1.2s-1.2-.54-1.2-1.2V4.9zm6.2 6.1c0 3-2.54 5.1-5.1 5.1S6.8 14 6.8 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.31 6-6.72h-1.8z"/>
            )}
            {!microphoneActive && (
              <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
            )}
          </svg>
          <ControlLabel>{microphoneActive ? 'Mute' : 'Unmute'}</ControlLabel>
        </ControlButton>
        
        <ControlButton
          variant="camera"
          active={cameraActive}
          onClick={handleCameraToggle}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            {cameraActive ? (
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
            ) : (
              <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82l-1-1H16c.55 0 1 .45 1 1v3.5l4-4v11l-1.43-1.43L21 6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.55-.18L19.73 21 21 19.73 3.27 2z"/>
            )}
          </svg>
          <ControlLabel>{cameraActive ? 'Stop Video' : 'Start Video'}</ControlLabel>
        </ControlButton>
        
        <ControlButton
          variant="screen"
          active={screenShareActive}
          onClick={handleScreenShareToggle}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/>
            {screenShareActive && (
              <path d="M7 14l5-3-5-3v6z"/>
            )}
          </svg>
          <ControlLabel>{screenShareActive ? 'Stop Share' : 'Share Screen'}</ControlLabel>
        </ControlButton>
      </ControlsContainer>
    </LiveModeContainer>
  );
};

export default LiveModeUI;