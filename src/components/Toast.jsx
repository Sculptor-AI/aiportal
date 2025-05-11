import React, { useState, useEffect, useContext } from 'react';
import styled, { keyframes, ThemeContext } from 'styled-components';

// Pop-out animation keyframes
const popOut = keyframes`
  0% {
    transform: translateX(-100%);
    opacity: 0;
  }
  10% {
    transform: translateX(0);
    opacity: 1;
  }
  90% {
    transform: translateX(0);
    opacity: 1;
  }
  100% {
    transform: translateX(-100%);
    opacity: 0;
  }
`;

// Container for each toast
const ToastContainer = styled.div`
  position: fixed;
  z-index: 1000;
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  color: ${props => props.theme.text || '#fff'};
  max-width: 350px;
  animation: ${popOut} ${props => props.duration}ms ease-in-out;
  bottom: ${props => props.bottom || '20px'};
  left: ${props => props.left || '20px'};
  background: ${props => {
    // Use theme colors if available
    if (props.useTheme) {
      return `linear-gradient(to right, ${props.theme.primary || '#1F2937'}, ${props.theme.secondary || '#111827'})`;
    }
    
    // Special case for success with override
    if (props.type === 'success' && props.successOverride) {
      return 'linear-gradient(to right, #059669, #10B981)';
    }
    
    // Otherwise use the type-based colors
    switch (props.type) {
      case 'success':
        return 'linear-gradient(to right, #10B981, #059669)';
      case 'error':
        return 'linear-gradient(to right, #EF4444, #DC2626)';
      case 'warning':
        return 'linear-gradient(to right, #F59E0B, #D97706)';
      case 'info':
        return 'linear-gradient(to right, #3B82F6, #2563EB)';
      default:
        return 'linear-gradient(to right, #1F2937, #111827)';
    }
  }};
  
  &::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: rgba(255, 255, 255, 0.3);
    border-bottom-left-radius: 12px;
    border-bottom-right-radius: 12px;
  }
  
  cursor: ${props => props.onClick ? 'pointer' : 'default'};
  
  &:hover {
    ${props => props.onClick && `
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    `}
  }
  
  transition: transform 0.2s ease, box-shadow 0.2s ease;
`;

// Icon container
const IconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
`;

// Content container
const Content = styled.div`
  flex-grow: 1;
`;

// Title styling
const Title = styled.h4`
  margin: 0 0 4px 0;
  font-weight: 600;
  font-size: 1rem;
`;

// Message styling
const Message = styled.p`
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.9;
`;

// Close button
const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: white;
  opacity: 0.7;
  font-size: 1.2rem;
  cursor: pointer;
  margin-left: 12px;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    opacity: 1;
  }
`;

// Custom image styling
const CustomImage = styled.img`
  width: 32px;
  height: 32px;
  object-fit: contain;
  margin-right: 12px;
`;

const Toast = ({ 
  type = 'info', 
  title, 
  message, 
  duration = 5000, 
  onClose, 
  bottom = '20px',
  left = '20px',
  customImage,
  useTheme = false,
  onClick = null,
  successOverride = false
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const theme = useContext(ThemeContext);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  // Handle clicks on the toast
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  // Icons based on type
  const getIcon = () => {
    if (customImage) {
      return <CustomImage src={customImage} alt={title} />;
    }

    switch (type) {
      case 'success':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        );
      case 'error':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        );
      case 'warning':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        );
      case 'info':
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        );
    }
  };

  return (
    <ToastContainer 
      type={type} 
      duration={duration} 
      bottom={bottom} 
      left={left} 
      useTheme={useTheme}
      onClick={handleClick}
      successOverride={successOverride}
    >
      {customImage ? (
        <CustomImage src={customImage} alt={title} />
      ) : (
        <IconContainer>{getIcon()}</IconContainer>
      )}
      <Content>
        <Title>{title}</Title>
        <Message>{message}</Message>
      </Content>
      <CloseButton onClick={(e) => {
        e.stopPropagation(); // Prevent triggering the container's onClick
        onClose();
      }}>×</CloseButton>
    </ToastContainer>
  );
};

export default Toast; 