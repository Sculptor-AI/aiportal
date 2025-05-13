import React, { useState, useRef, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import ChatMessage from './ChatMessage';
import { sendMessage } from '../services/aiService';
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
  width: 100%; /* Ensure it takes full width when sidebar is hidden */
  background: ${props => props.theme.chat};
  backdrop-filter: ${props => props.theme.glassEffect};
  -webkit-backdrop-filter: ${props => props.theme.glassEffect};
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
  justify-content: space-between;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  z-index: 10;
  position: relative;
`;

const ChatTitleSection = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 4px; // Use gap instead of margin for more consistent spacing
  padding-left: 45px; // Add padding to shift title right to align with the logo
`;

const ChatTitle = styled.h2`
  font-size: 1.2rem;
  font-weight: 500;
  margin: 0;
  color: ${props => props.theme.text};
  flex: 1;
  line-height: 1.4; // Improve line height for better visual balance
`;

const ModelSelectorWrapper = styled.div`
  // Remove the margin-top and use the parent's gap instead
  max-width: 240px;
  
  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px;
  display: flex;
  flex-direction: column;
  width: 100%;
  position: relative;
  
  /* Stylish scrollbar */
  &::-webkit-scrollbar {
    width: 5px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.border};
    border-radius: 10px;
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

// New keyframes for moving input to bottom
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
  width: 100% !important;
  max-width: 100% !important;
  padding: 0 !important;
  z-index: 100 !important;
  pointer-events: none;
  left: 50% !important; // Common style, applied to both states
  flex-direction: column;

  ${({ isEmpty, animateDown }) => {
    if (animateDown) {
      // When animateDown is true, isEmpty is false.
      // The element starts at the centered position and animates to the bottom.
      return css`
        top: 50%; /* Start position for the animation - NO !important */
        transform: translate(-50%, -50%); /* Start position - NO !important */
        bottom: auto; /* Ensure bottom is not conflicting - NO !important */
        
        animation-name: ${moveInputToBottom};
        animation-duration: 0.5s;
        animation-timing-function: ease-out;
        animation-fill-mode: forwards;

        @media (max-width: 768px) {
          animation-name: ${moveInputToBottomMobile};
        }
      `;
    } else if (isEmpty) { // Centered, no animation
      return css`
        top: 50% !important;
        transform: translate(-50%, -50%) !important;
        bottom: auto !important; 
      `;
    } else { // At bottom, no animation (isEmpty is false, animateDown is false)
      return css`
        top: auto !important;
        bottom: 30px !important;
        transform: translateX(-50%) !important;
        @media (max-width: 768px) {
          bottom: 20px !important;
        }
      `;
    }
  }}
`;

const MessageInputWrapper = styled.div`
  position: relative;
  width: 100%;
  max-width: 700px !important; /* Match the width from the image */
  margin: 0 20px !important; /* Add horizontal margins */
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: auto;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1) !important; /* Add subtle shadow for depth */
  border-radius: 24px !important; /* Match the input's border radius */
  background: ${props => props.theme.inputBackground};
  border: 1px solid ${props => props.theme.border};
  padding-bottom: 8px;
`;

const InputRow = styled.div`
  display: flex;
  width: 100%;
  position: relative;
  align-items: center;
`;

const MessageInput = styled.textarea`
  width: 100%;
  padding: 15px 50px 15px 60px;
  border-radius: 24px;
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
    padding: 13px 45px 13px 55px;
    min-height: 45px;
  }
`;

const SendButton = styled.button`
  background: ${props => props.disabled 
    ? '#ccc' 
    : props.theme.buttonGradient};
  color: white;
  border: none;
  border-radius: 50%;
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
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  
  &:hover:not(:disabled) {
    background: ${props => props.theme.buttonHoverGradient};
    transform: translateY(-50%) scale(1.05);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  
  &:disabled {
    cursor: not-allowed;
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
  color: ${props => props.theme.text}aa;
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
  margin-top: 2px;
  margin-bottom: 4px;
  gap: 8px;
  pointer-events: auto;
  width: 95%;
`;

const ActionChip = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  background-color: rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.05);
  color: ${props => props.theme.text}99;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.06);
    color: ${props => props.theme.text};
  }

  svg {
    width: 15px;
    height: 15px;
    opacity: 0.7;
  }
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
  const messagesEndRef = useRef(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(chat?.title || 'New Conversation');
  const [uploadedFileData, setUploadedFileData] = useState(null); // { file: File, type: 'image' | 'text', content: string | null }
  const [resetFileUpload, setResetFileUpload] = useState(false); // Renamed state
  const inputRef = useRef(null); // Add ref for the textarea
  const [isProcessingFile, setIsProcessingFile] = useState(false); // State for file processing
  const toast = useToast();

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

    if (!messageToSend && !currentImageData && !currentFileText) return;
    if (isLoading || isProcessingFile || !chat?.id) return; // Prevent sending if already busy or no chat selected

    const currentChatId = chat.id; // Capture chat ID before clearing state
    const currentModel = selectedModel; // Capture selected model
    const currentHistory = chat.messages; // Capture current history

    // --- Optimistic UI Update --- 
    const userMessage = {
      id: Date.now(), // Use timestamp as temp ID
      role: 'user',
      content: messageToSend,
      image: currentImageData,
      fileInfo: uploadedFileData ? { name: uploadedFileData.name, type: uploadedFileData.type } : undefined,
      model: currentModel // Associate message with model used
    };
    addMessage(currentChatId, userMessage); // Use the updated addMessage from context
    
    // Add placeholder AI message
    const aiMessageId = userMessage.id + 1; // Temporary ID for the streaming message
    const placeholderAiMessage = {
        id: aiMessageId,
        role: 'assistant',
        content: '', // Start empty
        isLoading: true,
        modelId: currentModel // Store which model is responding
    };
    addMessage(currentChatId, placeholderAiMessage);
    // --- End Optimistic UI Update ---

    // Clear input and reset file upload state *after* capturing needed data
    setInputMessage('');
    clearUploadedFile(); // Assumes this handles resetting related state
    inputRef.current?.style.setProperty('height', 'auto'); // Reset input height
    setIsLoading(true); // Set loading state for the whole operation

    console.log(`[ChatWindow] Attempting to send message to ${currentModel}`); // Log model being used
    let streamedContent = '';

    try {
      await sendMessage(
        currentModel,      // Pass captured model
        messageToSend,     // Pass user input text
        currentHistory,    // Pass captured history
        (chunk) => {       // Callback for receiving chunks
          streamedContent += chunk;
          // Update the placeholder message content chunk by chunk
          updateMessage(currentChatId, aiMessageId, { content: streamedContent, isLoading: true });
        },
        (error) => {       // Callback for errors during streaming
          console.error(`Error streaming response from ${currentModel}:`, error);
          updateMessage(currentChatId, aiMessageId, {
            content: `Error: ${error.message || 'Failed to get response'}`,
            isError: true,
            isLoading: false
          });
        },
        currentImageData,  // Pass image data
        currentFileText,   // Pass file text content
        settings           // Pass settings object
      );
      // If sendMessage completes without calling the error callback, finalize the message
       updateMessage(currentChatId, aiMessageId, { content: streamedContent, isLoading: false });
       console.log(`[ChatWindow] Streaming finished successfully for ${currentModel}.`);

    } catch (error) { // Catch errors thrown directly by sendMessage setup (e.g., network issues)
       console.error(`Error setting up sendMessage for ${currentModel}:`, error);
        updateMessage(currentChatId, aiMessageId, {
            content: `Setup Error: ${error.message || 'Failed to initiate connection'}`,
            isError: true,
            isLoading: false
        });
    } finally {
      setIsLoading(false); // Turn off loading indicator regardless of outcome
      // Note: The final updateMessage call inside the try block handles success
      // The error callback inside sendMessage or the catch block handles errors
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
           // Extract text from PDF
           const arrayBuffer = await file.arrayBuffer();
           const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
           let fullText = '';
           for (let i = 1; i <= pdf.numPages; i++) {
             const page = await pdf.getPage(i);
             const textContent = await page.getTextContent();
             fullText += textContent.items.map(item => item.str).join(' ') + '\n'; // Add newline between pages
           }
           setUploadedFileData({ 
             file: file, 
             type: 'pdf', 
             content: fullText.trim(), 
             text: fullText.trim(), // Add text field for PDF content
             name: file.name 
           });
           setIsProcessingFile(false);
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

  if (!chat) {
    return (
      <ChatWindowContainer fontSize={settings?.fontSize}>
        <EmptyState isExiting={animateEmptyStateOut}>
        </EmptyState>
        <InputContainer isEmpty={true} animateDown={false}>
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
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13"></path>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
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
    <ChatWindowContainer fontSize={settings?.fontSize}>
      <ChatHeader 
        style={{ 
          opacity: (sidebarCollapsed && isFocused) ? '0' : '1',
          transition: 'opacity 0.3s ease'
        }}
      >
        <ChatTitleSection>
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
        <ModelSelectorWrapper>
          <ModelSelector
            selectedModel={selectedModel}
            models={availableModels}
            onChange={handleModelChange}
            key="model-selector"
          />
        </ModelSelectorWrapper>
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
      
      <InputContainer isEmpty={chatIsEmpty} animateDown={effectiveAnimateDownSignal}>
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
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13"></path>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </SendButton>
          </InputRow>
          
          {/* Action Chips */}
          <ActionChipsContainer>
            <ActionChip>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              Search
            </ActionChip>
            <ActionChip>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path>
              </svg>
              Deep research
            </ActionChip>
            <ActionChip>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              Create image
            </ActionChip>
          </ActionChipsContainer>
        </MessageInputWrapper>
      </InputContainer>
    </ChatWindowContainer>
  );
};

export default ChatWindow;


