import React, { useState, useRef, useEffect } from 'react';
import styled, { keyframes, css, useTheme } from 'styled-components';
import ChatMessage from './ChatMessage';
import { sendMessage, sendMessageToBackend, streamMessageFromBackend } from '../services/aiService';
import ModelSelector from './ModelSelector';
import FileUploadButton from './FileUploadButton';
import { useToast } from '../contexts/ToastContext';
import * as pdfjsLib from 'pdfjs-dist'; // Import pdfjs
import PdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?worker'; // Import worker using Vite's worker syntax

// Use Vite's worker import approach instead of CDN
pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker();

const ChatWindowContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%; /* Always takes full width */
  margin-left: 0; /* No margin - sidebar will overlay */
  transition: width 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  background: ${props => props.theme.name === 'retro' ? 'rgb(0, 128, 128)' : props.theme.chat};
  backdrop-filter: ${props => props.theme.name === 'retro' ? 'none' : props.theme.glassEffect};
  -webkit-backdrop-filter: ${props => props.theme.name === 'retro' ? 'none' : props.theme.glassEffect};
  font-size: ${props => {
    switch(props.fontSize) {
      case 'small': return '0.9rem';
      case 'large': return '1.1rem';
      default: return '1rem';
    }
  }};
  position: relative;
  overflow: hidden;
`;

const ChatHeader = styled.div`
  padding: 15px 20px;
  display: flex;
  align-items: flex-start; // Change from center to flex-start for better alignment
  justify-content: ${props => props.sidebarCollapsed ? 'space-between' : 'flex-end'};
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  z-index: 10;
  position: relative;
`;

const ChatTitleSection = styled.div`
  display: ${props => props.sidebarCollapsed ? 'flex' : 'none'};
  flex-direction: column;
  flex: 1;
  gap: 4px; // Use gap instead of margin for more consistent spacing
  padding-left: 60px; // Increased padding to better align with the hamburger button (20px left + 40px width)
`;

const ChatTitle = styled.h2`
  font-size: 1.2rem;
  font-weight: 500;
  margin: 0;
  color: ${props => props.theme.name === 'retro' ? '#FFFFFF' : props.theme.text};
  flex: 1;
  line-height: 1.4; // Improve line height for better visual balance
`;

const ModelSelectorWrapper = styled.div`
  // Remove the margin-top and use the parent's gap instead
  max-width: 240px;
  z-index: 10;
  
  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px;
  padding-bottom: ${props => props.theme.name === 'retro' ? '140px' : '115px'}; /* Add extra padding for retro theme */
  display: flex;
  flex-direction: column;
  width: 100%;
  position: relative;
  
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

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// Create keyframes for moving input to bottom (without left property)
const moveInputToBottom = keyframes`
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

const moveInputToBottomMobile = keyframes`
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

// Keyframes for EmptyState exit animation
const emptyStateExitAnimation = keyframes`
  from {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -55%); /* Fade and move slightly up */
  }
`;

const InputContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed !important;
  width: 100% !important; /* Takes full available width up to max-width */
  max-width: ${props => props.theme.name === 'retro' ? '750px' : '700px'} !important; /* Apply max-width here */
  padding: 0 !important;
  z-index: 100 !important;
  pointer-events: none;
  flex-direction: column;
  margin-left: 0 !important;
  transition: all 0.3s cubic-bezier(0.25, 1, 0.5, 1) !important;

  ${({ isEmpty, animateDown, theme, sidebarCollapsed }) => {
    const bottomPosition = theme.name === 'retro' ? '40px' : '30px';
    const mobileBottomPosition = theme.name === 'retro' ? '30px' : '20px';
    // Always center at 50% regardless of sidebar state
    const centerPosition = '50%';
    
    if (animateDown) {
      // When animateDown is true, isEmpty is false.
      // The element starts at the centered position and animates to the bottom.
      return css`
        top: 50%; /* Start position for the animation - NO !important */
        transform: translate(-50%, -50%); /* Start position - NO !important */
        bottom: auto; /* Ensure bottom is not conflicting - NO !important */
        left: ${centerPosition} !important; /* Always center in viewport */
        
        animation-name: ${moveInputToBottom};
        animation-duration: 0.5s;
        animation-timing-function: ease-out;
        animation-fill-mode: forwards;

        @media (max-width: 768px) {
          animation-name: ${moveInputToBottomMobile};
          left: 50% !important; /* On mobile, always center in viewport */
        }
      `;
    } else if (isEmpty) { // Centered, no animation
      return css`
        top: 50% !important;
        transform: translate(-50%, -50%) !important;
        bottom: auto !important;
        left: ${centerPosition} !important; /* Always center in viewport */
        
        @media (max-width: 768px) {
          left: 50% !important; /* On mobile, always center in viewport */
        }
      `;
    } else { // At bottom, no animation (isEmpty is false, animateDown is false)
      return css`
        top: auto !important;
        bottom: ${bottomPosition} !important;
        transform: translateX(-50%) !important;
        left: ${centerPosition} !important; /* Always center in viewport */
        
        @media (max-width: 768px) {
          bottom: ${mobileBottomPosition} !important;
          left: 50% !important; /* On mobile, always center in viewport */
        }
      `;
    }
  }}
`;

const MessageInputWrapper = styled.div`
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

const InputRow = styled.div`
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

const MessageInput = styled.textarea`
  width: 100%;
  padding: 15px 50px 15px ${props => props.theme.name === 'retro' ? '50px' : '60px'};
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
    padding: 13px 45px 13px ${props => props.theme.name === 'retro' ? '48px' : '55px'};
    min-height: 45px;
  }
`;

const SendButton = styled.button`
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

const EmptyState = styled.div`
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
  z-index: 5; // Higher than MainGreeting (4) but lower than InputContainer (100)
  pointer-events: none; /* Allow clicks to pass through */
  opacity: 1; /* Default opacity */

  ${({ isExiting }) => isExiting && css`
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

// Add ActionChipsContainer styled component
const ActionChipsContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  margin-top: ${props => props.theme.name === 'retro' ? '8px' : '2px'};
  margin-bottom: ${props => props.theme.name === 'retro' ? '8px' : '4px'};
  gap: ${props => props.theme.name === 'retro' ? '12px' : '8px'};
  pointer-events: auto;
  width: ${props => props.theme.name === 'retro' ? '90%' : '95%'};
`;

const ActionChip = styled.button`
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

const ChipDropdownButton = styled.button`
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

const ChipDropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 5px;
  background: ${props => props.theme.name === 'retro' ? props.theme.buttonFace : props.theme.inputBackground};
  border: 1px solid ${props => props.theme.border};
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '8px'}; /* Square corners for retro */
  box-shadow: ${props => props.theme.name === 'retro' ? 
    `1px 1px 0 0 ${props.theme.buttonHighlightLight}, -1px -1px 0 0 ${props.theme.buttonShadowDark}, 1px 1px 0 0 ${props.theme.buttonHighlightSoft} inset, -1px -1px 0 0 ${props.theme.buttonShadowSoft} inset` :
    '0 2px 10px rgba(0, 0, 0, 0.1)'};
  width: 150px;
  overflow: hidden;
  z-index: 10;
`;

const ChipDropdownItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  background: ${props => props.$active && props.theme.name !== 'retro' ? 'rgba(0, 0, 0, 0.05)' : 'transparent'};
  border: none;
  text-align: left;
  font-size: 13px;
  cursor: pointer;
  color: ${props => props.theme.name === 'retro' ? props.theme.buttonText : props.theme.text};
  font-family: ${props => props.theme.name === 'retro' ? 'MSW98UI, MS Sans Serif, Tahoma, sans-serif' : 'inherit'};
  
  &:hover {
    background: ${props => props.theme.name === 'retro' ? props.theme.buttonFace : 'rgba(0, 0, 0, 0.05)'}; 
    /* For retro, ensure hover doesn't change background unless it implies selection highlight */
    ${props => props.theme.name === 'retro' && props.$active && `
      /* Simulate inset press for active/hovered retro dropdown item */
      box-shadow: -1px -1px 0 0 ${props.theme.buttonHighlightSoft} inset, 1px 1px 0 0 ${props.theme.buttonShadowSoft} inset;
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
    `}
  }
  
  svg {
    width: 14px;
    height: 14px;
    filter: ${props => props.theme.name === 'retro' ? 'grayscale(1) brightness(0.5)': 'none'}; /* Retro icons might need adjustment */
  }
`;

// Create a RetroIconWrapper component for ActionChips
const RetroIconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
`;

const ChatWindow = ({ 
  chat, 
  addMessage,
  updateMessage,
  updateChatTitle,
  selectedModel: initialSelectedModel, 
  settings, 
  sidebarCollapsed = false, 
  availableModels,
  onAttachmentChange,
  onModelChange
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(initialSelectedModel || 'gemini-2-flash');
  const [selectedActionChip, setSelectedActionChip] = useState(null); // Added state for selected chip
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);
  const [thinkingMode, setThinkingMode] = useState(null); // null for not selected, 'thinking' or 'instant'
  const [createType, setCreateType] = useState(null); // null for not selected, 'image' or 'video'
  const modeDropdownRef = useRef(null);
  const createDropdownRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(chat?.title || 'New Conversation');
  const [uploadedFileData, setUploadedFileData] = useState(null); // { file: File, type: 'image' | 'text', content: string | null }
  const [resetFileUpload, setResetFileUpload] = useState(false); // Renamed state
  const inputRef = useRef(null); // Add ref for the textarea
  const [isProcessingFile, setIsProcessingFile] = useState(false); // State for file processing
  const toast = useToast();
  const theme = useTheme();

  // Helper function to add alerts/toasts
  const addAlert = (alertOptions) => {
    if (toast && toast.showToast) {
      toast.showToast(alertOptions.message, alertOptions.type, {
        autoHide: alertOptions.autoHide,
        actionText: alertOptions.actionText,
        onAction: alertOptions.onAction
      });
    } else {
      // Fallback if toast context is not available
      console.warn("Toast notification failed:", alertOptions.message);
      alert(alertOptions.message);
    }
  };

  // Helper function to generate unique IDs for messages
  const generateId = () => {
    return Date.now().toString() + Math.floor(Math.random() * 1000).toString();
  };

  const chatIsEmpty = !chat || chat.messages.length === 0;

  const prevIsEmptyRef = useRef(chatIsEmpty);
  const [animateDown, setAnimateDown] = useState(false);

  // Determine if the animation should START in this specific render cycle
  const shouldStartAnimationThisRender = prevIsEmptyRef.current && !chatIsEmpty;

  useEffect(() => {
    // This effect manages the animateDown state for the duration of the animation
    if (shouldStartAnimationThisRender) {
      setAnimateDown(true); // Keep animation styles active
      const timer = setTimeout(() => {
        setAnimateDown(false); // Turn off animation styles after duration
      }, 500); // Corresponds to animation-duration
      return () => clearTimeout(timer);
    }
  }, [shouldStartAnimationThisRender]); // Re-run if the trigger condition changes

  // Update prevIsEmptyRef *after* all render logic, for the next render cycle
  useEffect(() => {
    prevIsEmptyRef.current = chatIsEmpty;
  }); // No dependency array, runs after every render

  // If chat becomes empty again (e.g. messages deleted), ensure animateDown is reset
  useEffect(() => {
    if (chatIsEmpty) {
      setAnimateDown(false);
    }
  }, [chatIsEmpty]);

  // Calculate the effective signal to pass to InputContainer
  // This ensures animation starts immediately on the correct render
  const effectiveAnimateDownSignal = animateDown || shouldStartAnimationThisRender;

  // Find the current model data for display
  const modelDisplay = {
    'gemini-2-flash': { name: 'Gemini 2 Flash', provider: 'Google AI' },
    'claude-3.7-sonnet': { name: 'Claude 3.7 Sonnet', provider: 'Anthropic' },
    'chatgpt-4o': { name: 'ChatGPT 4o', provider: 'OpenAI' }
  }[selectedModel] || { name: selectedModel, provider: 'AI' };
  
  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);
  
  useEffect(() => {
    if (initialSelectedModel && initialSelectedModel !== selectedModel) {
      setSelectedModel(initialSelectedModel);
    }
  }, [initialSelectedModel]);
  
  useEffect(() => {
    if (chat?.id && initialSelectedModel && sidebarCollapsed) {
      setSelectedModel(initialSelectedModel);
      setResetFileUpload(false);
    }
  }, [chat?.id, initialSelectedModel, sidebarCollapsed]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'; // Reset height
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`; // Set to scroll height
      
      // Add or remove scrollbar based on content height
      // Assuming ~20px per line of text, show scrollbar after ~4 lines (80px)
      const lineHeight = parseInt(getComputedStyle(inputRef.current).lineHeight) || 20;
      const fourLinesHeight = lineHeight * 4;
      
      if (inputRef.current.scrollHeight > fourLinesHeight) {
        inputRef.current.classList.add('show-scrollbar');
      } else {
        inputRef.current.classList.remove('show-scrollbar');
      }
    }
  }, [inputMessage]); // Adjust height and scrollbar visibility based on inputMessage

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Renamed from handleSendMessage
  const submitMessage = async () => {
    const messageToSend = inputMessage.trim();
    const currentImageData = uploadedFileData?.dataUrl;
    const currentFileText = uploadedFileData?.text;

    console.log("Submit message called with:", { 
      hasMessage: !!messageToSend, 
      hasImage: !!currentImageData, 
      hasFileText: !!currentFileText,
      fileType: uploadedFileData?.type,
      fileName: uploadedFileData?.name
    });

    if (!messageToSend && !currentImageData && !currentFileText) return;
    if (isLoading || isProcessingFile || !chat?.id) return; // Prevent sending if already busy or no chat selected
    
    // Capture the selected action chip value before resetting
    const currentActionChip = selectedActionChip;

    const currentChatId = chat.id; // Capture chat ID before clearing state
    const currentModel = selectedModel; // Capture selected model
    const currentHistory = chat.messages; // Capture current history

    // Find the full model object for the current model
    const currentModelObj = availableModels.find(model => model.id === currentModel);
    const isBackendModel = currentModelObj?.isBackendModel === true;

    // Check for API key based on selected model
    let apiKeyMissing = false;
    let apiKeyMessage = "";
    
    // Get the user settings that might contain API keys
    const userSettingsStr = sessionStorage.getItem('ai_portal_current_user');
    const localSettingsStr = localStorage.getItem('settings');
    const userSettings = userSettingsStr ? JSON.parse(userSettingsStr)?.settings || {} : {};
    const localSettings = localSettingsStr ? JSON.parse(localSettingsStr) || {} : {};
    const settings = userSettings || localSettings;
    
    // Check API keys based on selected model
    if (currentModel.startsWith('gemini') && 
        !settings.googleApiKey && 
        !import.meta.env.VITE_GOOGLE_API_KEY) {
      apiKeyMissing = true;
      apiKeyMessage = "Google API key is missing. Please add it in Settings.";
    }
    
    // More API key checks, exact check depends on the model
    if (currentModel.startsWith('gpt-') && 
        !settings.openaiApiKey && 
        !import.meta.env.VITE_OPENAI_API_KEY) {
      apiKeyMissing = true;
      apiKeyMessage = "OpenAI API key is missing. Please add it in Settings.";
    }
    
    if (currentModel.startsWith('claude-') && 
        !settings.anthropicApiKey && 
        !import.meta.env.VITE_ANTHROPIC_API_KEY) {
      apiKeyMissing = true;
      apiKeyMessage = "Anthropic API key is missing. Please add it in Settings.";
    }
    
    // Handle missing API key
    if (apiKeyMissing) {
      addAlert({
        message: apiKeyMessage, 
        type: 'error', 
        autoHide: true, 
        actionText: 'Settings', 
        onAction: () => setShowSettings(true)
      });
      return;
    }
    
    setIsLoading(true); // Start loading state
    
    // Add user message to chat
    const userMessage = {
      id: generateId(),
      role: 'user',
      content: messageToSend || '',
      timestamp: new Date().toISOString(),
    };
    
    // Add image to user message if present
    if (currentImageData) {
      userMessage.image = currentImageData;
    }
    
    // Add file data to user message if present
    if (uploadedFileData) {
      userMessage.file = {
        type: uploadedFileData.type,
        name: uploadedFileData.name
      };
    }
    
    // Add the user message to chat
    addMessage(currentChatId, userMessage);
    
    // Capture file text before clearing state
    const fileTextToSend = currentFileText;
    const imageDataToSend = currentImageData;
    
    // Clear inputs and reset state for next message
    setInputMessage('');
    setUploadedFileData(null);
    
    // Trigger a reset of the file upload component
    setResetFileUpload(true);
    setTimeout(() => setResetFileUpload(false), 0);
    
    if (onAttachmentChange) {
      onAttachmentChange(false); // Inform parent attachment was cleared
    }
    
    // Compute message indices for sending to API
    const formattedHistory = currentHistory.map(msg => ({
      role: msg.role,
      content: msg.content,
      ...(msg.image && { image: msg.image })
    }));
    
    // Create placeholder for AI response
    const aiMessageId = generateId();
    const aiMessage = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      isLoading: true,
      timestamp: new Date().toISOString(),
      modelId: currentModel,
    };
    
    // Add the placeholder AI message to chat
    addMessage(currentChatId, aiMessage);
    
    // Update the chat title if it's a new chat
    if (currentHistory.length === 0) {
      updateChatTitle(currentChatId, messageToSend);
    }
    
    // Ensure view is scrolled to the latest message
    setTimeout(scrollToBottom, 100);
    
    let streamedContent = ''; // Used for streaming responses
    
    try {
      // Use backend API if it's a backend model
      if (isBackendModel) {
        console.log(`[ChatWindow] Using backend API for model: ${currentModel}`);
        
        // Check if the model supports streaming
        const supportsStreaming = currentModelObj?.supportsStreaming !== false;
        
        // Define the thinking mode system prompt
        const thinkingModeSystemPrompt = thinkingMode === 'thinking' ? 
          `You are a Deep Analysis Chain of Thought model that provides thorough, well-structured explanations. For every response:

1. FIRST: Put your comprehensive thinking process inside <think></think> tags following these steps:
   - Begin with problem decomposition - break down the question into its core components and underlying assumptions
   - Explore the conceptual space deeply, considering multiple perspectives and approaches
   - When providing solutions (including code):
     * Focus on developing one high-quality solution
     * Prioritize clarity and simplicity unless complexity is justified
     * Think through tradeoffs and design decisions explicitly
   - Identify potential edge cases, limitations, or hidden assumptions
   - Perform a critical self-review of your thinking:
     * Question your reasoning process and initial assumptions
     * Look for logical gaps, biases, or oversimplifications
     * Consider counterarguments or alternative perspectives
   - Evaluate your final solution against these criteria:
     * Correctness: Does it solve the problem accurately?
     * Depth: Have you considered the problem deeply enough?
     * Simplicity: Is this the simplest valid solution?
     * Completeness: Does it address the core question and handle relevant edge cases?

2. THEN: Provide your answer outside the tags - be concise and focused while maintaining clarity

When explaining concepts:
- Break your answer into logical paragraphs
- Use headings only when they improve understanding
- Include concrete examples that illustrate key points
- Focus on the most important aspects rather than attempting to cover everything` : null;
        
        console.log(`[ChatWindow] Current thinkingMode: ${thinkingMode}, Using system prompt: ${thinkingModeSystemPrompt ? 'YES' : 'NO'}`);
        if (thinkingModeSystemPrompt) {
          console.log(`[ChatWindow] System prompt (first 50 chars): ${thinkingModeSystemPrompt.substring(0, 50)}...`);
        }
        
        // For backend models, we need to prepend the system prompt to the user's message
        let finalMessageToSend = messageToSend;
        let systemPromptForApi = null;
        
        if (isBackendModel && thinkingModeSystemPrompt) {
          // Prepend the system prompt to the user's message for backend models
          finalMessageToSend = `System Instructions: ${thinkingModeSystemPrompt}\n\nUser Message: ${messageToSend}`;
          console.log(`[ChatWindow] Prepended system prompt to user message for backend model.`);
        } else if (thinkingModeSystemPrompt) {
          // For client-side models, we'll pass it as a separate parameter
          systemPromptForApi = thinkingModeSystemPrompt;
        }
        
        if (supportsStreaming) {
          // Use streaming API for backend models that support it
          await streamMessageFromBackend(
            currentModel, 
            finalMessageToSend,
            (chunk) => {
              streamedContent += chunk;
              updateMessage(currentChatId, aiMessageId, { content: streamedContent, isLoading: true });
            },
            currentActionChip === 'search',
            currentActionChip === 'deep-research',
            currentActionChip === 'create-image',
            imageDataToSend, // Use captured value
            fileTextToSend,  // Use captured value
            systemPromptForApi, // Use separate parameter for client-side models
            thinkingMode // Pass thinkingMode as mode
          );
          
          // Finalize the message when streaming is complete
          const messageUpdates = { content: streamedContent, isLoading: false };
          
          // Check if we have search sources stored from the response
          if (window.__lastSearchSources && Array.isArray(window.__lastSearchSources) && 
              (currentActionChip === 'search' || currentActionChip === 'deep-research')) {
            console.log('Adding sources to message:', window.__lastSearchSources);
            messageUpdates.sources = window.__lastSearchSources;
            // Clear the global variable after using it
            window.__lastSearchSources = null;
          }
          
          updateMessage(currentChatId, aiMessageId, messageUpdates);
          console.log(`[ChatWindow] Backend streaming finished for ${currentModel}.`);
        } else {
          // Use non-streaming API for models that don't support streaming
          const backendResponse = await sendMessageToBackend(
            currentModel,
            finalMessageToSend,
            currentActionChip === 'search',
            currentActionChip === 'deep-research',
            currentActionChip === 'create-image',
            imageDataToSend, // Use captured value
            fileTextToSend,   // Use captured value
            systemPromptForApi, // Use separate parameter for client-side models
            thinkingMode // Pass thinkingMode as mode
          );
          
          // Update the placeholder message with the backend response
          updateMessage(currentChatId, aiMessageId, { 
            content: backendResponse.response || 'No response from backend', 
            isLoading: false,
            sources: backendResponse.sources || null
          });
          console.log(`[ChatWindow] Backend response received for ${currentModel}.`);
        }
      } else {
        // Use client-side API for direct models
        const messageGenerator = sendMessage(
          messageToSend, 
          currentModel, 
          formattedHistory, 
          imageDataToSend,
          fileTextToSend, // Use captured value for file text
          currentActionChip === 'search',
          currentActionChip === 'deep-research',
          currentActionChip === 'create-image',
          thinkingModeSystemPrompt // Keep using system prompt parameter for client-side models
        );
        
        for await (const chunk of messageGenerator) {
          streamedContent += chunk;
          updateMessage(currentChatId, aiMessageId, { content: streamedContent, isLoading: true });
        }
        
        // Finalize the message when streaming is complete
        updateMessage(currentChatId, aiMessageId, { content: streamedContent, isLoading: false });
        console.log(`[ChatWindow] Client-side streaming finished for ${currentModel}.`);
      }
    } catch (error) {
      console.error('[ChatWindow] Error generating response:', error);
      
      // Show error message to user
      updateMessage(currentChatId, aiMessageId, { 
        content: `Error: ${error.message || 'Failed to generate response'}`, 
        isLoading: false,
        isError: true
      });
      
      // Add a helpful toast notification
      addAlert({
        message: `Error with ${currentModel}: ${error.message || 'Failed to generate response'}`,
        type: 'error',
        autoHide: true
      });
    } finally {
      setIsLoading(false); // Turn off loading indicator regardless of outcome
      setSelectedActionChip(null); // Reset action chip selection
    }
  };

  // Handle sending message on Enter key press
  const handleKeyDown = (event) => {
    if (settings.sendWithEnter && event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent default Enter behavior (new line)
      submitMessage();
    } else if (!settings.sendWithEnter && event.key === 'Enter' && event.shiftKey) {
      // If sendWithEnter is false, allow Shift+Enter to send if desired (optional, but common UX)
      // Or, if Shift+Enter is purely for newlines when sendWithEnter is false, this block can be removed.
      // For now, let's assume Shift+Enter should also send if sendWithEnter is false and Enter alone makes a newline.
      // This specific behavior might need clarification based on desired UX.
      // If the intention is that Enter *only* creates a newline when sendWithEnter is false,
      // and *only* send button works, then this 'else if' is not needed.
      // However, current setup has Enter creating newlines by default if not prevented.
      // Let's assume for now: if sendWithEnter is true, Enter sends. If false, Shift+Enter sends.
      // If sendWithEnter is false and user hits just Enter, it makes a new line (default textarea behavior).
      event.preventDefault(); 
      submitMessage();
    } else if (event.key === 'Enter' && !event.shiftKey && !settings.sendWithEnter) {
      // This case is when sendWithEnter is false, and the user presses Enter without Shift.
      // We do *not* preventDefault here, allowing Enter to create a new line.
      // No call to submitMessage().
    }
  };

  // Handle file selection (from button or paste)
  const handleFileSelected = async (file) => { // Make async
    if (!file) {
      setUploadedFileData(null);
      if (onAttachmentChange) {
        onAttachmentChange(false);
      }
      return;
    }
    const isImage = file.type.startsWith('image/');
    const isText = file.type === 'text/plain';
    const isPdf = file.type === 'application/pdf';

    if (isImage || isText || isPdf) {
      if (file.size > 10 * 1024 * 1024) { 
        alert('File too large. Max size is 10MB.');
        return; 
      }

      setIsProcessingFile(true); // Start processing indicator
      setUploadedFileData({ file: file, type: file.type.split('/')[0], content: 'Processing...', name: file.name }); // Show processing state
      
      if (onAttachmentChange) {
        onAttachmentChange(true);
      }

      try {
        if (isImage) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setUploadedFileData({ 
              file: file, 
              type: 'image', 
              content: reader.result, 
              dataUrl: reader.result, // Add dataUrl for image data
              name: file.name 
            });
            setIsProcessingFile(false);
          };
          reader.onerror = () => { 
            setIsProcessingFile(false); 
            alert('Error reading image file.'); 
            if (onAttachmentChange) {
              onAttachmentChange(false);
            }
          };
          reader.readAsDataURL(file);
        } else if (isText) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setUploadedFileData({ 
              file: file, 
              type: 'text', 
              content: reader.result, 
              text: reader.result, // Add text field for text content
              name: file.name 
            });
            setIsProcessingFile(false);
          };
          reader.onerror = () => { 
            setIsProcessingFile(false); 
            alert('Error reading text file.'); 
            if (onAttachmentChange) {
              onAttachmentChange(false);
            }
          };
          reader.readAsText(file);
        } else if (isPdf) {
          try {
            // Extract text from PDF
            console.log("Starting PDF extraction for:", file.name);
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            console.log(`PDF loaded successfully with ${pdf.numPages} pages`);
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              fullText += textContent.items.map(item => item.str).join(' ') + '\n'; // Add newline between pages
            }
            
            // Make sure text is not empty
            if (!fullText.trim()) {
              console.warn("Extracted empty text from PDF - might be scanned/image-based");
              fullText = "This appears to be a scanned PDF without extractable text.";
            }
            
            console.log(`Extracted ${fullText.length} characters from PDF`);
            const trimmedText = fullText.trim();
            
            // Make sure we consistently set both content and text fields
            const fileData = { 
              file: file, 
              type: 'pdf', 
              content: trimmedText, 
              text: trimmedText, // Essential: This field is used when sending
              name: file.name 
            };
            
            setUploadedFileData(fileData);
            console.log("PDF data set to state:", fileData);
            setIsProcessingFile(false);
          } catch (error) {
            console.error('Error extracting PDF text:', error);
            setIsProcessingFile(false);
            alert('Error extracting text from PDF: ' + error.message);
            if (onAttachmentChange) {
              onAttachmentChange(false);
            }
          }
        }
        setResetFileUpload(false); // Ensure reset is false if a valid file is selected
      } catch (error) {
         console.error('Error processing file:', error);
         alert(`Error processing ${file.type} file: ${error.message}`);
         setUploadedFileData(null);
         setIsProcessingFile(false);
         setResetFileUpload(true); // Trigger reset
         setTimeout(() => setResetFileUpload(false), 0); // Reset trigger
         if (onAttachmentChange) {
           onAttachmentChange(false);
         }
      }
    } else {
       alert('Unsupported file type selected.');
       setUploadedFileData(null);
       // No need to set setIsProcessingFile(false) here as it wasn't set true
       if (onAttachmentChange) {
         onAttachmentChange(false);
       }
    }
  };

  // Handle paste event for images (keep this for image pasting)
  const handlePaste = (event) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        event.preventDefault(); // Prevent pasting file path as text
        const file = item.getAsFile();
        if (file) {
          // Reuse the existing file selection logic
          handleFileSelected(file);
          // DO NOT trigger resetFileUpload here; FileUploadButton should show its preview
          // setResetFileUpload(true);
          // setTimeout(() => setResetFileUpload(false), 0);
        }
        break; // Handle only the first image found
      }
    }
    // Allow default paste behavior for text etc. if no image was found
  };

  const handleStartEditing = () => {
    setIsEditingTitle(true);
    setEditedTitle(chat?.title || 'New Conversation');
  };

  const handleTitleChange = (e) => {
    setEditedTitle(e.target.value);
  };

  const handleTitleSave = () => {
    if (editedTitle.trim()) {
      updateChatTitle(chat.id, editedTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === 'Escape') {
      setIsEditingTitle(false);
      setEditedTitle(chat?.title || 'New Conversation');
    }
  };

  // Conditions for EmptyState visibility and animation
  const showEmptyStateStatic = chatIsEmpty && !effectiveAnimateDownSignal;
  // Animate out if it *was* empty (implied by shouldStartAnimationThisRender or animateDown) 
  // and input is moving (effectiveAnimateDownSignal is true)
  const animateEmptyStateOut = (!chatIsEmpty || shouldStartAnimationThisRender) && effectiveAnimateDownSignal;

  // Effect to notify parent about attachment changes
  useEffect(() => {
    if (onAttachmentChange) {
      onAttachmentChange(!!uploadedFileData);
    }
  }, [uploadedFileData, onAttachmentChange]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(event.target)) {
        setShowModeDropdown(false);
      }
      if (createDropdownRef.current && !createDropdownRef.current.contains(event.target)) {
        setShowCreateDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!chat) {
    return (
      <ChatWindowContainer fontSize={settings?.fontSize} sidebarCollapsed={sidebarCollapsed}>
        <EmptyState isExiting={animateEmptyStateOut}>
        </EmptyState>
        <InputContainer isEmpty={true} animateDown={false} sidebarCollapsed={sidebarCollapsed}>
          <MessageInputWrapper isEmpty={true}>
            <FileUploadButton 
              onFileSelected={handleFileSelected} 
              disabled={true}
              resetFile={resetFileUpload} 
              externalFile={uploadedFileData?.file} 
            />
            <MessageInput
              ref={inputRef} 
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste} 
              placeholder={getPlaceholderText()}
              disabled={true}
              rows={1}
              style={{ maxHeight: '150px', overflowY: 'auto' }} 
            />
            <SendButton
              onClick={submitMessage}
              disabled={true}
            >
              {theme.name === 'retro' ? (
                <img src="/images/retroTheme/sendIcon.png" alt="Send" style={{ width: '16px', height: '16px' }} />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13"></path>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              )}
            </SendButton>
          </MessageInputWrapper>
        </InputContainer>
      </ChatWindowContainer>
    );
  }
  
  // Handle model change
  const handleModelChange = (modelId) => {
    setSelectedModel(modelId); // Update local state
    
    // Pass the model change up to the parent component
    if (availableModels) {
      // Store in localStorage for persistence across refreshes
      localStorage.setItem('selectedModel', modelId);
      
      // If the parent passed an onModelChange handler, call it
      if (onModelChange && typeof onModelChange === 'function') {
        onModelChange(modelId);
      }
    }
  };

  const [isFocused, setIsFocused] = useState(false);
  
  // Handle focus mode
  const inputFocusChange = (isFocusedState) => {
    if (sidebarCollapsed) {
      setIsFocused(isFocusedState);
    }
  };

  // Clear attached file data
  const clearUploadedFile = () => {
    setUploadedFileData(null);
    setResetFileUpload(prev => !prev); // Toggle to trigger reset in FileUploadButton
    if (onAttachmentChange) {
      onAttachmentChange(false);
    }
  };

  // Update placeholder and disabled state based on processing
  const getPlaceholderText = () => {
    if (isLoading) return "Waiting for response...";
    if (isProcessingFile) return "Processing file...";
    if (uploadedFileData) return `Attached: ${uploadedFileData.name}. Add text or send.`;
    return "Type message, paste image, or attach file...";
  };

  return (
    <ChatWindowContainer fontSize={settings?.fontSize} sidebarCollapsed={sidebarCollapsed}>
      <ChatHeader 
        style={{ 
          opacity: (sidebarCollapsed && isFocused) ? '0' : '1',
          transition: 'opacity 0.3s ease'
        }}
        sidebarCollapsed={sidebarCollapsed}
      >
        <ChatTitleSection sidebarCollapsed={sidebarCollapsed}>
          <ChatTitle>
            {isEditingTitle ? (
              <input
                type="text"
                value={editedTitle}
                onChange={handleTitleChange}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                autoFocus
                style={{ 
                  fontSize: '1.2rem', 
                  fontWeight: '500', 
                  width: '100%', 
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `1px solid ${props => props.theme.border}`,
                  color: 'inherit'
                }}
              />
            ) : (
              <div onClick={handleStartEditing} style={{ cursor: 'pointer' }}>
                {chat?.title || 'New Conversation'}
              </div>
            )}
          </ChatTitle>
        </ChatTitleSection>
        
        {/* Move ModelSelector back to the top right */}
        {thinkingMode !== 'instant' && (
          <ModelSelectorWrapper>
            <ModelSelector
              selectedModel={selectedModel}
              models={availableModels}
              onChange={handleModelChange}
              key="model-selector"
              theme={theme}
            />
          </ModelSelectorWrapper>
        )}
      </ChatHeader>
      
      {(showEmptyStateStatic || animateEmptyStateOut) && (
        <EmptyState isExiting={animateEmptyStateOut}>
        </EmptyState>
      )}
      
      {!chatIsEmpty && (
          <MessageList>
            {Array.isArray(chat.messages) && chat.messages.map(message => (
              <ChatMessage 
                key={message.id} 
                message={message} 
                showModelIcons={settings.showModelIcons}
                settings={settings}
              />
            ))}
            <div ref={messagesEndRef} />
          </MessageList>
      )}
      
      <InputContainer isEmpty={chatIsEmpty} animateDown={effectiveAnimateDownSignal} sidebarCollapsed={sidebarCollapsed}>
        <MessageInputWrapper isEmpty={chatIsEmpty}>
          <InputRow>
            <FileUploadButton 
              onFileSelected={handleFileSelected} 
              disabled={isLoading || isProcessingFile} // Disable while processing
              resetFile={resetFileUpload} 
              externalFile={uploadedFileData?.file} 
            />
            <MessageInput
              ref={inputRef} 
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown} // Changed from handleSendMessage
              onPaste={handlePaste} 
              placeholder={getPlaceholderText()} // Use dynamic placeholder
              disabled={isLoading || isProcessingFile} // Disable while processing
              rows={1}
              style={{ maxHeight: '150px', overflowY: 'auto' }} 
            />
            <SendButton
              onClick={submitMessage} // Changed from handleSendMessage
              disabled={isLoading || isProcessingFile || (!inputMessage.trim() && !uploadedFileData)} // Also disable while processing
            >
              {theme.name === 'retro' ? (
                <img src="/images/retroTheme/sendIcon.png" alt="Send" style={{ width: '16px', height: '16px' }} />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13"></path>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              )}
            </SendButton>
          </InputRow>
          
          {/* Action Chips */}
          <ActionChipsContainer>
            <ActionChip 
              ref={modeDropdownRef}
              selected={thinkingMode !== null}
              onClick={() => setShowModeDropdown(!showModeDropdown)}
            >
              {theme.name === 'retro' ? (
                <RetroIconWrapper>
                  <img src="/images/retroTheme/modeIcon.png" alt="Mode" style={{ width: '16px', height: '16px' }} />
                </RetroIconWrapper>
              ) : thinkingMode === 'thinking' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
                  <line x1="16" y1="8" x2="2" y2="22"></line>
                  <line x1="17.5" y1="15" x2="9" y2="15"></line>
                </svg>
              ) : thinkingMode === 'instant' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                  <rect x="9" y="9" width="6" height="6"></rect>
                  <line x1="9" y1="2" x2="9" y2="4"></line>
                  <line x1="15" y1="2" x2="15" y2="4"></line>
                  <line x1="9" y1="20" x2="9" y2="22"></line>
                  <line x1="15" y1="20" x2="15" y2="22"></line>
                  <line x1="20" y1="9" x2="22" y2="9"></line>
                  <line x1="20" y1="14" x2="22" y2="14"></line>
                  <line x1="2" y1="9" x2="4" y2="9"></line>
                  <line x1="2" y1="14" x2="4" y2="14"></line>
                </svg>
              )}
              {thinkingMode === 'thinking' ? 'Thinking' : thinkingMode === 'instant' ? 'Instant' : 'Mode'}
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '3px', opacity: 0.7 }}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
              
              {showModeDropdown && (
                <ChipDropdownMenu>
                  <ChipDropdownItem 
                    $active={thinkingMode === null} 
                    onClick={(e) => {
                      e.stopPropagation();
                      setThinkingMode(null);
                      setSelectedActionChip(null);
                      setShowModeDropdown(false);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>
                      <rect x="9" y="9" width="6" height="6"></rect>
                      <line x1="9" y1="2" x2="9" y2="4"></line>
                      <line x1="15" y1="2" x2="15" y2="4"></line>
                      <line x1="9" y1="20" x2="9" y2="22"></line>
                      <line x1="15" y1="20" x2="15" y2="22"></line>
                      <line x1="20" y1="9" x2="22" y2="9"></line>
                      <line x1="20" y1="14" x2="22" y2="14"></line>
                      <line x1="2" y1="9" x2="4" y2="9"></line>
                      <line x1="2" y1="14" x2="4" y2="14"></line>
                    </svg>
                    Default
                  </ChipDropdownItem>
                  <ChipDropdownItem 
                    $active={thinkingMode === 'thinking'} 
                    onClick={(e) => {
                      e.stopPropagation();
                      setThinkingMode('thinking');
                      setSelectedActionChip(null);
                      setShowModeDropdown(false);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
                      <line x1="16" y1="8" x2="2" y2="22"></line>
                      <line x1="17.5" y1="15" x2="9" y2="15"></line>
                    </svg>
                    Thinking
                  </ChipDropdownItem>
                  <ChipDropdownItem 
                    $active={thinkingMode === 'instant'} 
                    onClick={(e) => {
                      e.stopPropagation();
                      setThinkingMode('instant');
                      setSelectedActionChip(null);
                      setShowModeDropdown(false);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                    </svg>
                    Instant
                  </ChipDropdownItem>
                </ChipDropdownMenu>
              )}
            </ActionChip>
            <ActionChip 
              selected={selectedActionChip === 'search'} 
              onClick={() => {
                if (selectedActionChip === 'search') {
                  setSelectedActionChip(null);
                } else {
                  setSelectedActionChip('search');
                  setThinkingMode(null);
                }
              }}
            >
              {theme.name === 'retro' ? (
                <RetroIconWrapper>
                  <img src="/images/retroTheme/searchIcon.png" alt="Search" style={{ width: '16px', height: '16px' }} />
                </RetroIconWrapper>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              )}
              Search
            </ActionChip>
            <ActionChip 
              selected={selectedActionChip === 'deep-research'} 
              onClick={() => {
                if (selectedActionChip === 'deep-research') {
                  setSelectedActionChip(null);
                } else {
                  setSelectedActionChip('deep-research');
                  setThinkingMode(null);
                }
              }}
            >
              {theme.name === 'retro' ? (
                <RetroIconWrapper>
                  <img src="/images/retroTheme/deepResearch.png" alt="Deep Research" style={{ width: '16px', height: '16px' }} />
                </RetroIconWrapper>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path>
                </svg>
              )}
              Deep research
            </ActionChip>
            <ActionChip 
              ref={createDropdownRef}
              selected={selectedActionChip === 'create-image' || selectedActionChip === 'create-video'}
              onClick={() => setShowCreateDropdown(!showCreateDropdown)}
            >
              {theme.name === 'retro' ? (
                <RetroIconWrapper>
                  <img src="/images/retroTheme/createIcon.png" alt="Create" style={{ width: '16px', height: '16px' }} />
                </RetroIconWrapper>
              ) : createType === 'image' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              ) : createType === 'video' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                  <line x1="7" y1="2" x2="7" y2="22"></line>
                  <line x1="17" y1="2" x2="17" y2="22"></line>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="16"></line>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
              )}
              {createType === 'image' ? 'Create image' : createType === 'video' ? 'Create video' : 'Create'}
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '3px', opacity: 0.7 }}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
              
              {showCreateDropdown && (
                <ChipDropdownMenu>
                  <ChipDropdownItem 
                    $active={createType === null} 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCreateType(null);
                      setSelectedActionChip(null);
                      setShowCreateDropdown(false);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="16"></line>
                      <line x1="8" y1="12" x2="16" y2="12"></line>
                    </svg>
                    Default
                  </ChipDropdownItem>
                  <ChipDropdownItem 
                    $active={createType === 'image'} 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCreateType('image');
                      setSelectedActionChip('create-image');
                      setShowCreateDropdown(false);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    Image
                  </ChipDropdownItem>
                  <ChipDropdownItem 
                    $active={createType === 'video'} 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCreateType('video');
                      setSelectedActionChip('create-video');
                      setShowCreateDropdown(false);
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                      <line x1="7" y1="2" x2="7" y2="22"></line>
                      <line x1="17" y1="2" x2="17" y2="22"></line>
                    </svg>
                    Video
                  </ChipDropdownItem>
                </ChipDropdownMenu>
              )}
            </ActionChip>
          </ActionChipsContainer>
        </MessageInputWrapper>
      </InputContainer>
    </ChatWindowContainer>
  );
};

export default ChatWindow;


