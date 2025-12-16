import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';

const MatrixCanvas = styled.canvas`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 99998;
  pointer-events: none;
  opacity: 0.9;
`;

const ExitHint = styled.div`
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  color: #00ff00;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  z-index: 99999;
  text-shadow: 0 0 10px #00ff00;
  animation: blink 1.5s ease-in-out infinite;
  
  @keyframes blink {
    0%, 50%, 100% { opacity: 1; }
    25%, 75% { opacity: 0.5; }
  }
`;

const MatrixRain = ({ onExit, duration = 10000 }) => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // Set canvas size
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Matrix characters (mix of katakana, numbers, and symbols)
        const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%^&*()';
        const charArray = chars.split('');

        const fontSize = 14;
        const columns = Math.floor(canvas.width / fontSize);

        // Initialize drops at random heights
        const drops = [];
        for (let i = 0; i < columns; i++) {
            drops[i] = Math.random() * -100;
        }

        // Animation loop
        const draw = () => {
            // Semi-transparent black to create fade effect
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Green text
            ctx.fillStyle = '#0F0';
            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                // Random character
                const char = charArray[Math.floor(Math.random() * charArray.length)];

                // Draw the character
                const x = i * fontSize;
                const y = drops[i] * fontSize;

                // Varying green shades for depth effect
                const brightness = Math.random();
                if (brightness > 0.98) {
                    ctx.fillStyle = '#FFF'; // Occasional white flash
                } else if (brightness > 0.9) {
                    ctx.fillStyle = '#5F5'; // Light green
                } else {
                    ctx.fillStyle = '#0F0'; // Standard green
                }

                ctx.fillText(char, x, y);

                // Reset drop when it goes off screen
                if (y > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }

            animationRef.current = requestAnimationFrame(draw);
        };

        draw();

        // Handle escape key
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onExit?.();
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        // Auto-exit after duration
        const timeout = setTimeout(() => {
            onExit?.();
        }, duration);

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('keydown', handleKeyDown);
            clearTimeout(timeout);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [onExit, duration]);

    return (
        <>
            <MatrixCanvas ref={canvasRef} />
            <ExitHint>Press ESC to exit the Matrix...</ExitHint>
        </>
    );
};

export default MatrixRain;
