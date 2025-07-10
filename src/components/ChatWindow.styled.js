import styled, { keyframes, css } from 'styled-components';

export const ChatWindowContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  margin-left: ${props => props.$sidebarCollapsed ? '0' : '300px'}; /* 280px sidebar + 20px margin */
  transition: margin-left 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  background: ${props => {
    if (props.theme.name === 'retro') return 'rgb(0, 128, 128)';
    if (props.theme.name === 'dark' || props.theme.name === 'oled') {
      return props.theme.background;
    }
    return props.theme.chat;
  }};
  // backdrop-filter: ${props => props.theme.name === 'retro' ? 'none' : props.theme.glassEffect};
  // -webkit-backdrop-filter: ${props => props.theme.name === 'retro' ? 'none' : props.theme.glassEffect};
  font-size: ${props => {
    switch(props.fontSize) {
      case 'small': return '0.9rem';
      case 'large': return '1.1rem';
      default: return '1rem';
    }
  }};
  position: relative;
  z-index: 5; // Added z-index to be above MainGreeting
  /* Use visible overflow so dropdown menus (e.g., model selector) aren't clipped */
  overflow: visible;
  
  @media (max-width: 768px) {
    margin-left: 0; /* No margin on mobile - sidebar overlays */
  }
`;

export const ChatHeader = styled.div`
  padding: 5px 20px 15px ${props => props.$sidebarCollapsed ? '45px' : '20px'}; // Adjust left padding based on sidebar state
  display: flex;
  align-items: flex-start; // Change from center to flex-start for better alignment
  justify-content: flex-start;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  z-index: 101; // Changed from 10 to 101
  position: relative;
  transition: padding-left 0.3s cubic-bezier(0.25, 1, 0.5, 1);
`;

export const ChatTitleSection = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 4px; // Use gap instead of margin for more consistent spacing
  padding-left: ${props => props.$sidebarCollapsed ? '20px' : '0px'}; // Reset padding when sidebar is open
  transition: padding-left 0.3s cubic-bezier(0.25, 1, 0.5, 1);
`;

export const ChatTitle = styled.h2`
  font-size: 1.2rem;
  font-weight: 500;
  margin: 0;
  color: ${props => props.theme.name === 'retro' ? '#FFFFFF' : props.theme.text};
  flex: 1;
  line-height: 1.4; // Improve line height for better visual balance
`;

export const ModelSelectorWrapper = styled.div`
  // Remove the margin-top and use the parent's gap instead
  max-width: 240px;
  z-index: 10;
  
  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

export const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px 0;
  padding-bottom: ${props => props.theme.name === 'retro' ? '140px' : '115px'}; /* Add extra padding for retro theme */
  display: flex;
  flex-direction: column;
  width: 100%;
  position: relative;
  background: ${props => {
    if (props.theme.name === 'dark' || props.theme.name === 'oled') {
      return 'transparent';
    }
    return props.theme.name === 'retro' ? 'transparent' : 'rgba(255, 255, 255, 0.05)';
  }};
  
  /* Stylish scrollbar */
  &::-webkit-scrollbar {
    width: ${props => props.theme.name === 'retro' ? '16px' : '5px'};
  }
  
  &::-webkit-scrollbar-track {
    background: ${props => props.theme.name === 'retro' ? props.theme.buttonFace : 'transparent'};
    border: ${props => props.theme.name === 'retro' ? `1px solid ${props.theme.border}` : 'none'};
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.name === 'retro' ? props.theme.buttonFace : props.theme.border};
    border-radius: ${props => props.theme.name === 'retro' ? '0' : '10px'};
    border: ${props => props.theme.name === 'retro' ? 
      `1px solid ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight}` : 
      'none'};
    box-shadow: ${props => props.theme.name === 'retro' ? 
      `1px 1px 0 0 ${props.theme.buttonHighlightSoft} inset, -1px -1px 0 0 ${props.theme.buttonShadowSoft} inset` : 
      'none'};
  }
`;

export const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const moveInputToBottom = keyframes`
  from {
    top: 50%;
    transform: translate(-50%, -50%);
    bottom: auto;
  }
  to {
    top: auto;
    bottom: 30px;
    transform: translateX(-50%);
  }
`;

export const moveInputToBottomMobile = keyframes`
  from {
    top: 50%;
    transform: translate(-50%, -50%);
    bottom: auto;
  }
  to {
    top: auto;
    bottom: 20px;
    transform: translateX(-50%);
  }
`;

export const emptyStateExitAnimation = keyframes`
  from {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -55%); /* Fade and move slightly up */
  }
`;

export const InputContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed !important;
  width: 100% !important;
  max-width: ${props => props.theme.name === 'retro' ? '750px' : '700px'} !important;
  padding: 0 !important;
  z-index: 100 !important;
  pointer-events: ${props => props.$isWhiteboardOpen || props.$isEquationEditorOpen || props.$isGraphingOpen || props.$isFlowchartOpen || props.$isSandbox3DOpen ? 'auto' : 'none'};
  flex-direction: column;
  /* margin-left will be handled by the left property based on $sidebarCollapsed */
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1) !important;

  ${({ $isEmpty, $animateDown, theme, $sidebarCollapsed, $isWhiteboardOpen, $isEquationEditorOpen, $isGraphingOpen, $isFlowchartOpen, $isSandbox3DOpen }) => {
    const bottomPosition = theme.name === 'retro' ? '40px' : '30px';
    const mobileBottomPosition = theme.name === 'retro' ? '30px' : '20px';
    
    let rightPanelOffset = 0;
    if ($isWhiteboardOpen) rightPanelOffset -= 225; // Half of 450px
    if ($isEquationEditorOpen) rightPanelOffset -= 225; // Half of 450px
    if ($isGraphingOpen) rightPanelOffset -= 300; // Half of 600px
    if ($isFlowchartOpen) rightPanelOffset -= 225; // Half of 450px
    if ($isSandbox3DOpen) rightPanelOffset -= 225; // Half of 450px

    const centerPosition = $sidebarCollapsed 
      ? `calc(50% + ${rightPanelOffset}px)` 
      : `calc(50% + 160px + ${rightPanelOffset}px)`; // Increased from 140px to 160px to account for sidebar's 20px left margin // 140px is half of sidebar width 280px
    
    if ($animateDown) {
      return css`
        top: 50%;
        transform: translate(-50%, -50%);
        bottom: auto;
        left: ${centerPosition} !important;
        
        animation-name: ${moveInputToBottom};
        animation-duration: 0.5s;
        animation-timing-function: ease-out;
        animation-fill-mode: forwards;

        @media (max-width: 768px) {
          animation-name: ${moveInputToBottomMobile};
          left: 50% !important; /* On mobile, always center in viewport - CURRENT MOBILE STYLE */
        }
      `;
    } else if ($isEmpty) { // Centered, no animation
      return css`
        top: 50% !important;
        transform: translate(-50%, -50%) !important;
        bottom: auto !important;
        left: ${centerPosition} !important;
        
        @media (max-width: 768px) {
          left: 50% !important; /* On mobile, always center in viewport - CURRENT MOBILE STYLE */
        }
      `;
    } else { // At bottom, no animation ($isEmpty is false, $animateDown is false)
      return css`
        top: auto !important;
        bottom: ${bottomPosition} !important;
        transform: translateX(-50%) !important;
        left: ${centerPosition} !important;
        
        @media (max-width: 768px) {
          bottom: ${mobileBottomPosition} !important;
          left: 50% !important; /* On mobile, always center in viewport - CURRENT MOBILE STYLE */
        }
      `;
    }
  }}
`;

export const MessageInputWrapper = styled.div`
  position: relative;
  width: 100%; /* Takes full width of InputContainer */
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: auto;
  box-shadow: ${props => props.theme.name === 'retro' ? 
    `inset 1px 1px 0px ${props.theme.buttonHighlightLight}, inset -1px -1px 0px ${props.theme.buttonShadowDark}` : 
    '0 2px 10px rgba(0, 0, 0, 0.1)'} !important;
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '24px'} !important;
  background: ${props => props.theme.inputBackground};
  border: ${props => props.theme.name === 'retro' ? 
    `2px solid ${props.theme.buttonFace}` : 
    `1px solid ${props.theme.border}`};
  padding-bottom: ${props => props.theme.name === 'retro' ? '12px' : '8px'};
`;

export const FilesPreviewContainer = styled.div`
  display: ${props => props.$show ? 'flex' : 'none'};
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 16px 8px 16px;
  width: 100%;
  box-sizing: border-box;
  border-bottom: ${props => props.$show ? `1px solid ${props.theme.border}` : 'none'};
  background: ${props => props.theme.background};
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '24px 24px 0 0'};
`;

export const FilePreviewChip = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: ${props => props.theme.inputBackground};
  border: 1px solid ${props => props.theme.border};
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '16px'};
  font-size: 12px;
  color: ${props => props.theme.text};
  position: relative;
  max-width: 200px;
`;

export const FilePreviewIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  
  img {
    width: 16px;
    height: 16px;
    border-radius: ${props => props.theme.name === 'retro' ? '0' : '4px'};
  }
  
  svg {
    width: 16px;
    height: 16px;
    color: ${props => props.theme.text};
    opacity: 0.7;
  }
`;

export const FilePreviewName = styled.div`
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
`;

export const FilePreviewRemove = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.text};
  opacity: 0.6;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '50%'};
  flex-shrink: 0;
  
  &:hover {
    opacity: 1;
    background: ${props => props.theme.border};
  }
  
  svg {
    width: 10px;
    height: 10px;
  }
`;

export const InputRow = styled.div`
  display: flex;
  width: 100%;
  position: relative;
  align-items: center;
  
  ${props => props.theme.name === 'retro' && `
    &::before {
      content: '';
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      width: 28px;
      height: 80%;
      background: ${props.theme.buttonFace};
      border: 1px solid;
      border-color: ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight};
      box-shadow: 1px 1px 0 0 ${props.theme.buttonHighlightSoft} inset, -1px -1px 0 0 ${props.theme.buttonShadowSoft} inset;
      z-index: 5;
    }
  `}
`;

export const MessageInput = styled.textarea`
  width: 100%;
  padding: 15px 102px 15px ${props => props.theme.name === 'retro' ? '16px' : '16px'};
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '24px'};
  border: none;
  background: transparent;
  color: ${props => props.theme.text};
  font-family: inherit;
  font-size: inherit;
  resize: none;
  min-height: 50px;
  max-height: 150px;
  /* Change from auto to hidden until height threshold is reached */
  overflow-y: hidden;
  /* Hide scrollbar using browser-specific selectors */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  
  /* Hide scrollbar for Chrome, Safari and Opera */
  &::-webkit-scrollbar {
    display: none;
  }
  
  /* Show scrollbar only when content exceeds ~4 lines */
  &.show-scrollbar {
    overflow-y: auto;
    scrollbar-width: thin; /* Firefox */
    -ms-overflow-style: auto; /* IE and Edge */
    
    /* Show scrollbar for Chrome, Safari and Opera */
    &::-webkit-scrollbar {
      display: block;
      width: 6px;
    }
    
    &::-webkit-scrollbar-thumb {
      background-color: rgba(0, 0, 0, 0.2);
      border-radius: 3px;
    }
  }
  
  transition: all 0.2s ease;
  
  &::placeholder {
    color: #888;
  }
  
  &:focus {
    outline: none;
  }
  
  @media (max-width: 768px) {
    padding: 13px 102px 13px ${props => props.theme.name === 'retro' ? '16px' : '16px'};
    min-height: 45px;
  }
`;

export const WaveformButton = styled.button`
  background: ${props => {
    if (props.theme.name === 'retro') {
      return props.theme.buttonFace;
    }
    if (props.$isActive) {
      return '#ff4444';
    }
    return props.disabled ? '#ccc' : props.theme.buttonGradient;
  }};
  color: ${props => props.theme.name === 'retro' ? props.theme.buttonText : 'white'};
  border: ${props => props.theme.name === 'retro' ? 
    `1px solid ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight}` : 
    'none'};
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '50%'};
  width: 38px;
  height: 38px;
  position: absolute;
  right: 54px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: ${props => props.theme.name === 'retro' ? 
    `1px 1px 0 0 ${props.theme.buttonHighlightSoft} inset, -1px -1px 0 0 ${props.theme.buttonShadowSoft} inset` : 
    props.$isActive ? '0 0 0 2px rgba(255, 68, 68, 0.3)' : '0 2px 8px rgba(0,0,0,0.1)'};
  
  &:hover:not(:disabled) {
    background: ${props => {
      if (props.theme.name === 'retro') {
        return props.theme.buttonFace;
      }
      if (props.$isActive) {
        return '#ff6666';
      }
      return props.theme.buttonHoverGradient;
    }};
    transform: translateY(-50%) ${props => props.theme.name === 'retro' ? '' : 'scale(1.05)'};
    box-shadow: ${props => props.theme.name === 'retro' ? 
      `1px 1px 0 0 ${props.theme.buttonHighlightSoft} inset, -1px -1px 0 0 ${props.theme.buttonShadowSoft} inset` : 
      props.$isActive ? '0 0 0 2px rgba(255, 68, 68, 0.5)' : '0 4px 12px rgba(0,0,0,0.15)'};
  }
  
  &:active:not(:disabled) {
    ${props => props.theme.name === 'retro' && `
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
      box-shadow: -1px -1px 0 0 ${props.theme.buttonHighlightSoft} inset, 1px 1px 0 0 ${props.theme.buttonShadowSoft} inset;
      padding: 1px 0 0 1px;
    `}
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
  
  // Add keyframes for pulse animation
  @keyframes pulse {
    0% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
    100% {
      opacity: 1;
    }
  }
`;

export const SendButton = styled.button`
  background: ${props => {
    if (props.theme.name === 'retro') {
      return props.theme.buttonFace;
    }
    return props.disabled ? '#ccc' : props.theme.buttonGradient;
  }};
  color: ${props => props.theme.name === 'retro' ? props.theme.buttonText : 'white'};
  border: ${props => props.theme.name === 'retro' ? 
    `1px solid ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight}` : 
    'none'};
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '50%'};
  width: 38px;
  height: 38px;
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: ${props => props.theme.name === 'retro' ? 
    `1px 1px 0 0 ${props.theme.buttonHighlightSoft} inset, -1px -1px 0 0 ${props.theme.buttonShadowSoft} inset` : 
    '0 2px 8px rgba(0,0,0,0.1)'};
  
  &:hover:not(:disabled) {
    background: ${props => props.theme.name === 'retro' ? 
      props.theme.buttonFace : 
      props.theme.buttonHoverGradient};
    transform: translateY(-50%) ${props => props.theme.name === 'retro' ? '' : 'scale(1.05)'};
    box-shadow: ${props => props.theme.name === 'retro' ? 
      `1px 1px 0 0 ${props.theme.buttonHighlightSoft} inset, -1px -1px 0 0 ${props.theme.buttonShadowSoft} inset` : 
      '0 4px 12px rgba(0,0,0,0.15)'};
  }
  
  &:active:not(:disabled) {
    ${props => props.theme.name === 'retro' && `
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
      box-shadow: -1px -1px 0 0 ${props.theme.buttonHighlightSoft} inset, 1px 1px 0 0 ${props.theme.buttonShadowSoft} inset;
      padding: 1px 0 0 1px;
    `}
  }
  
  &:disabled {
    cursor: not-allowed;
    ${props => props.theme.name === 'retro' && `
      background: ${props.theme.buttonFace};
      opacity: 0.5;
    `}
  }
  
  svg {
    width: 18px;
    height: 18px;
  }
`;

export const EmptyState = styled.div`
  position: fixed;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.name === 'retro' ? '#FFFFFF' : props.theme.text}aa;
  text-align: center;
  padding: 20px;
  /* backdrop-filter: blur(5px); */ // Apply blur effect to elements behind
  /* -webkit-backdrop-filter: blur(5px); */ // Vendor prefix for backdrop-filter
  width: 100%;
  max-width: 600px;
  z-index: 8; // Lower than MainGreeting (10) but higher than ChatWindowContainer (5)
  pointer-events: none; /* Allow clicks to pass through */
  opacity: 1; /* Default opacity */

  ${({ $isExiting }) => $isExiting && css`
    animation: ${emptyStateExitAnimation} 0.5s ease-out forwards;
  `}
  
  h3 {
    margin-bottom: 0;
    font-weight: 500;
    font-size: 1.5rem;
  }
  
  p {
    max-width: 500px;
    line-height: 1.6;
    font-size: 1rem;
  }
`;

export const ActionChipsContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  margin-top: ${props => props.theme.name === 'retro' ? '8px' : '2px'};
  margin-bottom: ${props => props.theme.name === 'retro' ? '8px' : '4px'};
  gap: ${props => props.theme.name === 'retro' ? '12px' : '8px'};
  pointer-events: auto;
  width: ${props => props.theme.name === 'retro' ? '90%' : '95%'};
  overflow: hidden;
  position: relative;
`;

export const ActionChip = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '20px'};
  background-color: ${props => {
    if (props.theme.name === 'retro') {
      return props.theme.buttonFace;
    }
    return props.selected ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.03)';
  }};
  border: ${props => {
    if (props.theme.name === 'retro') {
      return props.selected ? 
        `1px solid ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark}` : 
        `1px solid ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight}`;
    }
    return props.selected ? '1px solid rgba(0, 0, 0, 0.2)' : '1px solid rgba(0, 0, 0, 0.05)';
  }};
  color: ${props => props.selected ? props.theme.text : props.theme.text + '99'};
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  box-shadow: ${props => props.theme.name === 'retro' ? 
    props.selected ?
      `-1px -1px 0 0 ${props.theme.buttonHighlightSoft} inset, 1px 1px 0 0 ${props.theme.buttonShadowSoft} inset` :
      `1px 1px 0 0 ${props.theme.buttonHighlightSoft} inset, -1px -1px 0 0 ${props.theme.buttonShadowSoft} inset` : 
    'none'};
  
  &:hover {
    background-color: ${props => {
      if (props.theme.name === 'retro') {
        return props.theme.buttonFace;
      }
      return props.selected ? 'rgba(0, 0, 0, 0.12)' : 'rgba(0, 0, 0, 0.06)';
    }};
    color: ${props => props.theme.text};
  }

  &:active:not(:disabled) {
    ${props => props.theme.name === 'retro' && `
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
      box-shadow: -1px -1px 0 0 ${props.theme.buttonHighlightSoft} inset, 1px 1px 0 0 ${props.theme.buttonShadowSoft} inset;
      padding: 7px 11px 5px 13px;
    `}
  }

  svg {
    width: 15px;
    height: 15px;
    opacity: 0.7;
  }
`;

export const ChipDropdownButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  padding: 0;
  margin-left: 3px;
  cursor: pointer;
  
  svg {
    width: 12px;
    height: 12px;
    opacity: 0.7;
  }
  
  &:hover svg {
    opacity: 1;
  }
`;

export const RetroIconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
`;

export const HammerButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '50%'};
  background-color: ${props => {
    if (props.theme.name === 'retro') {
      return props.theme.buttonFace;
    }
    return props.$isOpen ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.03)';
  }};
  border: ${props => {
    if (props.theme.name === 'retro') {
      return props.$isOpen ? 
        `1px solid ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark}` : 
        `1px solid ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight}`;
    }
    return props.$isOpen ? '1px solid rgba(0, 0, 0, 0.2)' : '1px solid rgba(0, 0, 0, 0.05)';
  }};
  cursor: pointer;
  transition: all 0.2s ease;
  // margin-right: ${props => props.theme.name === 'retro' ? '12px' : '8px'}; // Removed for uniform gap spacing
  box-shadow: ${props => props.theme.name === 'retro' ? 
    props.$isOpen ?
      `-1px -1px 0 0 ${props.theme.buttonHighlightSoft} inset, 1px 1px 0 0 ${props.theme.buttonShadowSoft} inset` :
      `1px 1px 0 0 ${props.theme.buttonHighlightSoft} inset, -1px -1px 0 0 ${props.theme.buttonShadowSoft} inset` : 
    'none'};
  
  &:hover {
    background-color: ${props => {
      if (props.theme.name === 'retro') {
        return props.theme.buttonFace;
      }
      return props.$isOpen ? 'rgba(0, 0, 0, 0.12)' : 'rgba(0, 0, 0, 0.06)';
    }};
  }

  &:active:not(:disabled) {
    ${props => props.theme.name === 'retro' && `
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
      box-shadow: -1px -1px 0 0 ${props.theme.buttonHighlightSoft} inset, 1px 1px 0 0 ${props.theme.buttonShadowSoft} inset;
      padding: 1px;
    `}
  }

  svg {
    width: 20px;
    height: 20px;
    color: ${props => props.theme.text};
    opacity: 0.8;
  }
`;

export const ToolbarContainer = styled.div`
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  flex-wrap: wrap;
  justify-content: flex-start; // Ensure items start from the left
  gap: ${props => props.theme.name === 'retro' ? '12px' : '10px'};
  padding: ${props => props.theme.name === 'retro' ? '12px' : '8px'} 0;
  margin-top: ${props => props.theme.name === 'retro' ? '8px' : '4px'};
  width: ${props => props.theme.name === 'retro' ? '90%' : '95%'}; // Match ActionChipsContainer width
  border-top: 1px solid ${props => props.theme.border};
  animation: ${fadeIn} 0.2s ease-out;
`;

export const ToolbarItem = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px; // Uniform width
  height: 36px; // Uniform height
  background: ${props => {
    if (props.theme.name === 'retro') {
      return props.theme.buttonFace;
    }
    return props.$active ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.03)';
  }};
  border: ${props => {
    if (props.theme.name === 'retro') {
      return `1px solid ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight}`;
    }
    return '1px solid rgba(0, 0, 0, 0.05)';
  }};
  border-radius: 50%; // Always a circle
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden; 
  
  box-shadow: ${props => props.theme.name === 'retro' ? 
    `1px 1px 0 0 ${props.theme.buttonHighlightSoft} inset, -1px -1px 0 0 ${props.theme.buttonShadowSoft} inset` : 
    'none'};
  
  &:hover {
    background: ${props => {
      if (props.theme.name === 'retro') {
        return props.theme.buttonFace;
      }
      return 'rgba(0, 0, 0, 0.06)';
    }};
    transform: scale(1.05); // Uniform hover scale
  }

  &:active:not(:disabled) {
    ${props => props.theme.name === 'retro' && `
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
      box-shadow: -1px -1px 0 0 ${props.theme.buttonHighlightSoft} inset, 1px 1px 0 0 ${props.theme.buttonShadowSoft} inset;
    `}
    transform: scale(0.95); // Uniform active scale
  }

  svg {
    width: 18px;
    height: 18px;
    color: ${props => props.theme.text};
    opacity: 0.8;
  }
`;

export const OverflowChipButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '20px'};
  background-color: ${props => {
    if (props.theme.name === 'retro') {
      return props.theme.buttonFace;
    }
    return 'rgba(0, 0, 0, 0.03)';
  }};
  border: ${props => {
    if (props.theme.name === 'retro') {
      return `1px solid ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight}`;
    }
    return '1px solid rgba(0, 0, 0, 0.05)';
  }};
  color: ${props => props.theme.text + '99'};
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: ${props => props.theme.name === 'retro' ? 
    `1px 1px 0 0 ${props.theme.buttonHighlightSoft} inset, -1px -1px 0 0 ${props.theme.buttonShadowSoft} inset` : 
    'none'};
  min-width: 44px;
  
  &:hover {
    background-color: ${props => {
      if (props.theme.name === 'retro') {
        return props.theme.buttonFace;
      }
      return 'rgba(0, 0, 0, 0.06)';
    }};
    color: ${props => props.theme.text};
  }

  &:active:not(:disabled) {
    ${props => props.theme.name === 'retro' && `
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
      box-shadow: -1px -1px 0 0 ${props.theme.buttonHighlightSoft} inset, 1px 1px 0 0 ${props.theme.buttonShadowSoft} inset;
      padding: 7px 11px 5px 13px;
    `}
  }
`;

export const OverflowDropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: ${props => props.theme.inputBackground};
  border: 1px solid ${props => props.theme.border};
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '8px'};
  box-shadow: ${props => props.theme.name === 'retro' ? 
    `inset 1px 1px 0px ${props.theme.buttonHighlightLight}, inset -1px -1px 0px ${props.theme.buttonShadowDark}` : 
    '0 4px 12px rgba(0, 0, 0, 0.15)'};
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 150px;
  z-index: 1000;
  
  // Animate in
  animation: fadeIn 0.2s ease-out;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`; 