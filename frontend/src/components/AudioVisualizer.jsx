import React from 'react';
import styled, { keyframes, css } from 'styled-components';

const bounce = keyframes`
  0%, 100% { transform: scaleY(0.3); }
  50% { transform: scaleY(1); }
`;

const VisualizerContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 60px;
  width: 80px;
`;

const Bar = styled.div`
  width: 8px;
  max-height: 100%;
  background-color: ${props => props.theme.primaryColor || '#4285f4'};
  border-radius: 4px;
  animation: ${props => props.$isActive ? css`${bounce} 1s ease-in-out infinite` : 'none'};
  height: ${props => props.$isActive ? '100%' : '20%'};
  transition: height 0.3s ease;
  
  &:nth-child(1) { animation-delay: 0s; }
  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.4s; }
  &:nth-child(4) { animation-delay: 0.1s; }
  &:nth-child(5) { animation-delay: 0.3s; }
`;

const AudioVisualizer = ({ isActive }) => {
    return (
        <VisualizerContainer>
            <Bar $isActive={isActive} />
            <Bar $isActive={isActive} />
            <Bar $isActive={isActive} style={{ height: isActive ? '100%' : '30%' }} />
            <Bar $isActive={isActive} />
            <Bar $isActive={isActive} />
        </VisualizerContainer>
    );
};

export default AudioVisualizer;
