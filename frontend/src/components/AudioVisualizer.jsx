import React from 'react';
import styled, { keyframes, css } from 'styled-components';

const bounce = keyframes`
  0%, 100% {
    transform: scaleY(0.32);
    opacity: 0.55;
  }

  40% {
    transform: scaleY(0.88);
    opacity: 0.9;
  }

  70% {
    transform: scaleY(0.56);
    opacity: 0.72;
  }
`;

const VisualizerContainer = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  pointer-events: none;
`;

const Bar = styled.div`
  width: 7px;
  max-width: 7px;
  min-height: 18%;
  max-height: 26%;
  height: ${props => props.$isActive ? '100%' : '24%'};
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), ${props => props.theme.primaryColor || '#4285f4'});
  transform-origin: bottom center;
  animation: ${props => props.$isActive ? css`${bounce} 1150ms cubic-bezier(0.4, 0, 0.2, 1) infinite` : 'none'};
  transition: opacity 180ms ease, height 180ms ease;
  
  &:nth-child(1) { animation-delay: 0s; }
  &:nth-child(2) { animation-delay: 0.18s; }
  &:nth-child(3) { animation-delay: 0.34s; }
  &:nth-child(4) { animation-delay: 0.12s; }
  &:nth-child(5) { animation-delay: 0.26s; }
`;

const AudioVisualizer = ({ isActive }) => {
  return (
    <VisualizerContainer aria-hidden="true">
      <Bar $isActive={isActive} />
      <Bar $isActive={isActive} />
      <Bar $isActive={isActive} />
      <Bar $isActive={isActive} />
      <Bar $isActive={isActive} />
    </VisualizerContainer>
  );
};

export default AudioVisualizer;
