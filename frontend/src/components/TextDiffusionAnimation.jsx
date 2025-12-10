import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

const DiffusionContainer = styled.div`
  font-family: inherit;
  line-height: 1.6;
  word-wrap: break-word;
  white-space: pre-wrap;
`;

// Global storage for animated message IDs
const ANIMATED_MESSAGES_KEY = 'mercury_animated_messages';

const getAnimatedMessages = () => {
  try {
    const stored = localStorage.getItem(ANIMATED_MESSAGES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const setMessageAnimated = (messageId) => {
  try {
    const animatedMessages = getAnimatedMessages();
    animatedMessages[messageId] = true;
    localStorage.setItem(ANIMATED_MESSAGES_KEY, JSON.stringify(animatedMessages));
  } catch {
    // Silent fail if localStorage is not available
  }
};

const TextDiffusionAnimation = ({ 
  finalText, 
  isActive = false, 
  messageId = null,
  speed = 50,
  diffusionDuration = 750,
  onComplete = () => {}
}) => {
  const [displayText, setDisplayText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef(null);
  const onCompleteRef = useRef(onComplete);

  // For large text, skip complex animation and just do a simple fade-in
  const isLargeText = finalText && finalText.length > 500;

  // Check if this message has already been animated
  const hasBeenAnimated = messageId ? getAnimatedMessages()[messageId] : false;

  // Update the callback ref when it changes
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // No longer need to reset hasAnimated since we use persistent storage

  // Generate random characters for scrambling
  const getRandomChar = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    return chars[Math.floor(Math.random() * chars.length)];
  };

  // Generate scrambled version of text
  const generateScrambledText = (text) => {
    return text.split('').map(char => {
      if (char === ' ' || char === '\n' || char === '\t') {
        return char; // Preserve whitespace
      }
      return getRandomChar();
    }).join('');
  };

  useEffect(() => {
    // Clean up any existing timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    if (!isActive || !finalText) {
      setDisplayText(finalText || '');
      setIsAnimating(false);
      return;
    }

    // If this message has already been animated, skip animation
    if (hasBeenAnimated) {
      setDisplayText(finalText);
      setIsAnimating(false);
      return;
    }

    setIsAnimating(true);
    
    if (isLargeText) {
      // For large text: simple scramble -> reveal (no character-by-character)
      setDisplayText(generateScrambledText(finalText));
      
      timeoutRef.current = setTimeout(() => {
        setDisplayText(finalText);
        setIsAnimating(false);
        if (messageId) setMessageAnimated(messageId);
        onCompleteRef.current();
      }, 300); // Much shorter for large text
    } else {
      // For small text: keep the nice diffusion effect
      setDisplayText(generateScrambledText(finalText));
      
      // Simple 3-step reveal for small text
      let step = 0;
      const totalSteps = 3;
      const stepDuration = diffusionDuration / totalSteps;
      
      const reveal = () => {
        step++;
        if (step >= totalSteps) {
          setDisplayText(finalText);
          setIsAnimating(false);
          if (messageId) setMessageAnimated(messageId);
          onCompleteRef.current();
          return;
        }
        
        // Gradually reveal more characters each step
        const revealRatio = step / totalSteps;
        const charsToReveal = Math.floor(finalText.length * revealRatio);
        
        setDisplayText(current => {
          return current.split('').map((char, index) => {
            if (index < charsToReveal) {
              return finalText[index]; // Reveal this character
            }
            if (finalText[index] === ' ' || finalText[index] === '\n' || finalText[index] === '\t') {
              return finalText[index]; // Preserve whitespace
            }
            return getRandomChar(); // Keep scrambling
          }).join('');
        });
        
        timeoutRef.current = setTimeout(reveal, stepDuration);
      };
      
      timeoutRef.current = setTimeout(reveal, stepDuration);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [finalText, isActive, diffusionDuration, hasBeenAnimated, isLargeText, messageId]); // Removed onComplete from dependencies

  // Simplified rendering - no individual character styling for performance
  return (
    <DiffusionContainer>
      <span style={{ 
        opacity: isAnimating ? 0.7 : 1,
        transition: 'opacity 0.2s ease'
      }}>
        {displayText}
      </span>
    </DiffusionContainer>
  );
};

export default TextDiffusionAnimation;