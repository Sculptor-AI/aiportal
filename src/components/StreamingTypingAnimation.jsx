import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

const TypingContainer = styled.div`
  font-family: inherit;
  line-height: 1.6;
  word-wrap: break-word;
  white-space: pre-wrap;
`;

const Cursor = styled.span`
  opacity: ${props => props.$show ? 1 : 0};
  transition: opacity 0.1s ease-in-out;
  color: ${props => props.theme.text || '#000'};
  animation: blink 1s infinite;

  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
`;

const StreamingTypingAnimation = ({ 
  text = '', 
  isStreaming = false,
  speed = 30,
  showCursor = true,
  onCharacterTyped = () => {},
  theme = {}
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [showTypingCursor, setShowTypingCursor] = useState(false);
  const timeoutRef = useRef(null);
  const lastTextRef = useRef('');
  const displayedLengthRef = useRef(0);

  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // If not streaming, show all text immediately
    if (!isStreaming) {
      setDisplayedText(text);
      setShowTypingCursor(false);
      displayedLengthRef.current = text.length;
      return;
    }

    // If text is shorter than what we've already displayed, reset
    if (text.length < displayedLengthRef.current) {
      setDisplayedText(text);
      displayedLengthRef.current = text.length;
      setShowTypingCursor(true);
      return;
    }

    // If text hasn't changed, don't do anything
    if (text === lastTextRef.current) {
      return;
    }

    lastTextRef.current = text;
    setShowTypingCursor(true);

    // Function to type out characters one by one
    const typeNextCharacter = () => {
      const currentLength = displayedLengthRef.current;
      
      if (currentLength < text.length) {
        const nextChar = text[currentLength];
        setDisplayedText(text.substring(0, currentLength + 1));
        displayedLengthRef.current = currentLength + 1;
        onCharacterTyped(nextChar);
        
        // Schedule next character
        timeoutRef.current = setTimeout(typeNextCharacter, speed);
      } else {
        // Finished typing, hide cursor after a delay
        setTimeout(() => setShowTypingCursor(false), 1000);
      }
    };

    // Start typing if there are new characters to show
    if (displayedLengthRef.current < text.length) {
      timeoutRef.current = setTimeout(typeNextCharacter, speed);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, isStreaming, speed]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <TypingContainer>
      {displayedText}
      {showCursor && (isStreaming || showTypingCursor) && (
        <Cursor $show={showTypingCursor} theme={theme}>|</Cursor>
      )}
    </TypingContainer>
  );
};

export default StreamingTypingAnimation;