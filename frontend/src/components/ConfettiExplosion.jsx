import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';

const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`;

const ConfettiContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 99999;
  overflow: hidden;
  animation: ${fadeOut} 0.5s ease-out 4.5s forwards;
`;

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8B500', '#00CED1', '#FF69B4', '#7FFF00', '#FF4500'
];

const ConfettiPiece = styled.div`
  position: absolute;
  width: ${props => props.$size}px;
  height: ${props => props.$size * 0.4}px;
  background: ${props => props.$color};
  top: ${props => props.$startY}%;
  left: ${props => props.$startX}%;
  animation: fall-${props => props.$id} ${props => props.$duration}s ease-out forwards;
  transform-origin: center center;
  border-radius: 2px;
  opacity: 0;
  
  @keyframes fall-${props => props.$id} {
    0% {
      transform: translateY(0) translateX(0) rotate(0deg) scale(0);
      opacity: 1;
    }
    10% {
      transform: translateY(${props => props.$yMove * 0.1}vh) translateX(${props => props.$xMove * 0.3}vw) rotate(${props => props.$rotation * 0.3}deg) scale(1);
      opacity: 1;
    }
    100% {
      transform: translateY(${props => props.$yMove}vh) translateX(${props => props.$xMove}vw) rotate(${props => props.$rotation}deg) scale(0.5);
      opacity: 0;
    }
  }
`;

const ConfettiExplosion = ({ onComplete }) => {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    // Generate confetti pieces
    const newPieces = [];
    const pieceCount = 150;

    for (let i = 0; i < pieceCount; i++) {
      const angle = (i / pieceCount) * 360;
      const velocity = 30 + Math.random() * 40;
      const xMove = Math.cos(angle * Math.PI / 180) * velocity * (0.3 + Math.random() * 0.7);
      const yMove = 60 + Math.random() * 40;

      newPieces.push({
        id: i,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 8 + Math.random() * 12,
        startX: 40 + Math.random() * 20,
        startY: 30 + Math.random() * 20,
        xMove,
        yMove,
        rotation: 360 + Math.random() * 720,
        duration: 2 + Math.random() * 2,
      });
    }

    setPieces(newPieces);

    // Auto-cleanup after animation
    const timeout = setTimeout(() => {
      onComplete?.();
    }, 5000);

    return () => clearTimeout(timeout);
  }, [onComplete]);

  return (
    <ConfettiContainer>
      {pieces.map(piece => (
        <ConfettiPiece
          key={piece.id}
          $id={piece.id}
          $color={piece.color}
          $size={piece.size}
          $startX={piece.startX}
          $startY={piece.startY}
          $xMove={piece.xMove}
          $yMove={piece.yMove}
          $rotation={piece.rotation}
          $duration={piece.duration}
        />
      ))}
    </ConfettiContainer>
  );
};

export default ConfettiExplosion;
