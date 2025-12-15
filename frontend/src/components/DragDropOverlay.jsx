import React from 'react';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const folderBounce = keyframes`
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  25% {
    transform: translateY(-8px) scale(1.02);
  }
  50% {
    transform: translateY(-4px) scale(1.01);
  }
  75% {
    transform: translateY(-6px) scale(1.015);
  }
`;

const fileSlide1 = keyframes`
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) rotate(-5deg) scale(0.8);
  }
  30% {
    opacity: 1;
    transform: translate(-80%, -120%) rotate(-15deg) scale(1);
  }
  100% {
    opacity: 1;
    transform: translate(-80%, -120%) rotate(-15deg) scale(1);
  }
`;

const fileSlide2 = keyframes`
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) rotate(0deg) scale(0.8);
  }
  40% {
    opacity: 1;
    transform: translate(-50%, -140%) rotate(0deg) scale(1);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -140%) rotate(0deg) scale(1);
  }
`;

const fileSlide3 = keyframes`
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) rotate(5deg) scale(0.8);
  }
  50% {
    opacity: 1;
    transform: translate(-20%, -120%) rotate(12deg) scale(1);
  }
  100% {
    opacity: 1;
    transform: translate(-20%, -120%) rotate(12deg) scale(1);
  }
`;

const pulseGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4);
  }
  50% {
    box-shadow: 0 0 0 15px rgba(99, 102, 241, 0);
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${props => props.theme.name === 'dark' || props.theme.name === 'oled'
    ? 'rgba(0, 0, 0, 0.85)'
    : props.theme.name === 'retro'
    ? 'rgba(0, 128, 128, 0.9)'
    : 'rgba(255, 255, 255, 0.92)'};
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: ${fadeIn} 0.2s ease-out;
  pointer-events: none;
`;

const IconContainer = styled.div`
  position: relative;
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const FolderIcon = styled.div`
  position: relative;
  width: 120px;
  height: 100px;
  animation: ${folderBounce} 1.5s ease-in-out infinite;
  z-index: 2;
`;

const FolderBack = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 120px;
  height: 80px;
  background: ${props => props.theme.name === 'retro'
    ? '#C0C0C0'
    : props.theme.name === 'dark' || props.theme.name === 'oled'
    ? '#4F46E5'
    : '#6366F1'};
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '8px 8px 12px 12px'};
  box-shadow: ${props => props.theme.name === 'retro'
    ? `inset -1px -1px 0 ${props.theme.buttonShadowDark}, inset 1px 1px 0 ${props.theme.buttonHighlightLight}`
    : '0 4px 20px rgba(99, 102, 241, 0.3)'};
  animation: ${pulseGlow} 2s ease-in-out infinite;
`;

const FolderTab = styled.div`
  position: absolute;
  top: 0;
  left: 10px;
  width: 45px;
  height: 20px;
  background: ${props => props.theme.name === 'retro'
    ? '#C0C0C0'
    : props.theme.name === 'dark' || props.theme.name === 'oled'
    ? '#4F46E5'
    : '#6366F1'};
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '6px 6px 0 0'};
  box-shadow: ${props => props.theme.name === 'retro'
    ? `inset -1px -1px 0 ${props.theme.buttonShadowDark}, inset 1px 1px 0 ${props.theme.buttonHighlightLight}`
    : 'none'};
`;

const FolderFront = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 120px;
  height: 70px;
  background: ${props => props.theme.name === 'retro'
    ? '#DFDFDF'
    : props.theme.name === 'dark' || props.theme.name === 'oled'
    ? '#6366F1'
    : '#818CF8'};
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '0 8px 12px 12px'};
  box-shadow: ${props => props.theme.name === 'retro'
    ? `inset -1px -1px 0 ${props.theme.buttonShadowDark}, inset 1px 1px 0 ${props.theme.buttonHighlightLight}`
    : '0 2px 10px rgba(99, 102, 241, 0.2)'};
  z-index: 3;
`;

const FileBase = styled.div`
  position: absolute;
  width: 50px;
  height: 65px;
  background: ${props => props.theme.name === 'dark' || props.theme.name === 'oled'
    ? '#374151'
    : props.theme.name === 'retro'
    ? '#FFFFFF'
    : '#F9FAFB'};
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '6px'};
  border: ${props => props.theme.name === 'retro'
    ? `1px solid ${props.theme.buttonShadowDark}`
    : '1px solid rgba(0, 0, 0, 0.1)'};
  box-shadow: ${props => props.theme.name === 'retro'
    ? 'none'
    : '0 2px 8px rgba(0, 0, 0, 0.1)'};
  left: 50%;
  top: 50%;
  z-index: 1;

  &::before {
    content: '';
    position: absolute;
    top: 12px;
    left: 8px;
    right: 8px;
    height: 3px;
    background: ${props => props.theme.name === 'dark' || props.theme.name === 'oled'
      ? 'rgba(255, 255, 255, 0.2)'
      : 'rgba(0, 0, 0, 0.1)'};
    border-radius: 2px;
  }

  &::after {
    content: '';
    position: absolute;
    top: 20px;
    left: 8px;
    right: 8px;
    height: 3px;
    background: ${props => props.theme.name === 'dark' || props.theme.name === 'oled'
      ? 'rgba(255, 255, 255, 0.15)'
      : 'rgba(0, 0, 0, 0.07)'};
    border-radius: 2px;
  }
`;

const File1 = styled(FileBase)`
  animation: ${fileSlide1} 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  animation-delay: 0.1s;
  opacity: 0;
`;

const File2 = styled(FileBase)`
  animation: ${fileSlide2} 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  animation-delay: 0.2s;
  opacity: 0;
`;

const File3 = styled(FileBase)`
  animation: ${fileSlide3} 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  animation-delay: 0.3s;
  opacity: 0;
`;

const DropText = styled.div`
  margin-top: 24px;
  font-size: 1.25rem;
  font-weight: 600;
  color: ${props => props.theme.name === 'dark' || props.theme.name === 'oled'
    ? '#E5E7EB'
    : props.theme.name === 'retro'
    ? '#000080'
    : '#374151'};
  text-align: center;
`;

const DropSubtext = styled.div`
  margin-top: 8px;
  font-size: 0.9rem;
  color: ${props => props.theme.name === 'dark' || props.theme.name === 'oled'
    ? '#9CA3AF'
    : props.theme.name === 'retro'
    ? '#000000'
    : '#6B7280'};
  text-align: center;
`;

const DragDropOverlay = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <Overlay>
      <IconContainer>
        <File1 />
        <File2 />
        <File3 />
        <FolderIcon>
          <FolderTab />
          <FolderBack />
          <FolderFront />
        </FolderIcon>
      </IconContainer>
      <DropText>Drop files here</DropText>
      <DropSubtext>Images, PDFs, code, and text files supported</DropSubtext>
    </Overlay>
  );
};

export default DragDropOverlay;
