import React, { useState, useRef, useEffect } from 'react';
import styled, { useTheme } from 'styled-components';
import { sendMessage, sendMessageToBackend, streamMessageFromBackend } from '../services/aiService';
import { useToast } from '../contexts/ToastContext';
import MobileChatMessage from './MobileChatMessage';
import MobileFileUpload from './MobileFileUpload';
import PopupMenu from './ToolMenuModal';
import {
  ActionChipsContainer,
  ActionChip,
  RetroIconWrapper
} from './ChatWindow.styled';
import * as pdfjsLib from 'pdfjs-dist';
import PdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?worker';

pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker();

const MobileChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${props => props.theme.background};
  position: relative;
`;

const SectionHeaderStyled = styled.div`
  padding: 0 0 10px 0;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme.text}88;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 16px;
  padding-bottom: env(safe-area-inset-bottom);
  
  /* Hide scrollbar */
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 32px;
  color: ${props => props.theme.text}88;
  
  h3 {
    margin: 0 0 8px 0;
    font-size: 20px;
    font-weight: 600;
    color: ${props => props.theme.text};
  }
  
  p {
    margin: 0;
    font-size: 16px;
    line-height: 1.5;
  }
`;

const InputContainer = styled.div`
  padding: 16px;
  background: ${props => props.theme.background};
  border-top: 1px solid ${props => props.theme.border};
  padding-bottom: max(16px, env(safe-area-inset-bottom));
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  background: ${props => props.theme.inputBackground};
  border: 1px solid ${props => props.theme.border};
  border-radius: 20px;
  padding: 8px 12px;
  min-height: 44px;
`;

const MessageInput = styled.textarea`
  flex: 1;
  border: none;
  background: transparent;
  color: ${props => props.theme.text};
  font-family: inherit;
  font-size: 16px;
  resize: none;
  outline: none;
  min-height: 28px;
  max-height: 120px;
  line-height: 1.4;
  
  &::placeholder {
    color: ${props => props.theme.text}88;
  }
  
  /* Prevent zoom on iOS */
  @media screen and (-webkit-min-device-pixel-ratio: 0) {
    font-size: 16px;
  }
`;

const SendButton = styled.button`
  background: ${props => props.disabled ? props.theme.border : props.theme.primary};
  color: white;
  border: none;
  border-radius: 16px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  touch-action: manipulation;
  transition: all 0.2s ease;
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
  
  &:active:not(:disabled) {
    transform: scale(0.95);
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const AttachButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.text}88;
  padding: 4px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  touch-action: manipulation;
  
  &:active {
    background: ${props => props.theme.border};
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const MobileChatWindow = ({ 
  chat, 
  addMessage,
  updateMessage,
  updateChatTitle,
  selectedModel, 
  settings, 
  availableModels,
  onModelChange
}) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [selectedActionChip, setSelectedActionChip] = useState(null);
  const [thinkingMode, setThinkingMode] = useState(null);
  const [createType, setCreateType] = useState(null);
  const [showModeModal, setShowModeModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modeMenuRect, setModeMenuRect] = useState(null);
  const [createMenuRect, setCreateMenuRect] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const modeAnchorRef = useRef(null);
  const createAnchorRef = useRef(null);
  const toast = useToast();
  const theme = useTheme();

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
    }
  }, [inputMessage]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateId = () => {
    return Date.now().toString() + Math.floor(Math.random() * 1000).toString();
  };

  const handleFileSelect = async (file) => {
    if (!file) {
      setUploadedFile(null);
      return;
    }

    const isImage = file.type.startsWith('image/');
    const isText = file.type === 'text/plain';
    const isPdf = file.type === 'application/pdf';

    if (!isImage && !isText && !isPdf) {
      toast.showToast('Unsupported file type', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.showToast('File too large. Max size is 10MB.', 'error');
      return;
    }

    setIsProcessingFile(true);
    setUploadedFile({ file, type: file.type.split('/')[0], content: 'Processing...', name: file.name });

    try {
      if (isImage) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setUploadedFile({
            file,
            type: 'image',
            content: reader.result,
            dataUrl: reader.result,
            name: file.name
          });
          setIsProcessingFile(false);
        };
        reader.onerror = () => {
          setIsProcessingFile(false);
          toast.showToast('Error reading image file', 'error');
          setUploadedFile(null);
        };
        reader.readAsDataURL(file);
      } else if (isText) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setUploadedFile({
            file,
            type: 'text',
            content: reader.result,
            text: reader.result,
            name: file.name
          });
          setIsProcessingFile(false);
        };
        reader.onerror = () => {
          setIsProcessingFile(false);
          toast.showToast('Error reading text file', 'error');
          setUploadedFile(null);
        };
        reader.readAsText(file);
      } else if (isPdf) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          let fullText = '';
          
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map(item => item.str).join(' ') + '\n';
          }
          
          if (!fullText.trim()) {
            fullText = "This appears to be a scanned PDF without extractable text.";
          }
          
          const trimmedText = fullText.trim();
          setUploadedFile({
            file,
            type: 'pdf',
            content: trimmedText,
            text: trimmedText,
            name: file.name
          });
          setIsProcessingFile(false);
        } catch (error) {
          console.error('Error extracting PDF text:', error);
          setIsProcessingFile(false);
          toast.showToast('Error extracting text from PDF', 'error');
          setUploadedFile(null);
        }
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast.showToast(`Error processing ${file.type} file`, 'error');
      setUploadedFile(null);
      setIsProcessingFile(false);
    }
  };

  const handleModeSelect = (mode) => {
    setThinkingMode(mode);
    setSelectedActionChip(null);
  };

  const handleCreateSelect = (type) => {
    setCreateType(type);
    if (type === 'image') {
      setSelectedActionChip('create-image');
    } else if (type === 'video') {
      setSelectedActionChip('create-video');
    } else {
      setSelectedActionChip(null);
    }
  };

  const handleSendMessage = async () => {
    console.log('[Mobile] Send button clicked');

    const messageToSend = inputMessage.trim();
    const currentImageData = uploadedFile?.dataUrl;
    const currentFileText = uploadedFile?.text;
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

    console.log('[Mobile] Message state:', {
      messageToSend,
      hasImage: !!currentImageData,
      hasFile: !!currentFileText,
      uploadedFile
    });

    if (!messageToSend && !currentImageData && !currentFileText) {
      console.log('[Mobile] No content to send, returning early');
      return;
    }
    
    console.log('[Mobile] Loading states:', {
      isLoading,
      isProcessingFile,
      chatId: chat?.id,
      hasChat: !!chat
    });
    
    if (isLoading || isProcessingFile || !chat?.id) {
      console.log('[Mobile] Blocked by loading state or missing chat, returning early');
      return;
    }

    const currentChatId = chat.id;
    const currentModel = selectedModel;
    const currentHistory = chat.messages;

    console.log('[Mobile] Model check:', {
      selectedModel,
      availableModels: availableModels?.length,
      currentModel
    });

    // Find the full model object for the current model
    const currentModelObj = availableModels?.find(model => model.id === currentModel);
    const isBackendModel = currentModelObj?.isBackendModel === true;

    console.log('[Mobile] Model details:', {
      currentModelObj,
      isBackendModel,
      availableModelsExists: !!availableModels,
      modelCount: availableModels?.length || 0
    });

    // If we can't find the model config, log a warning
    if (!currentModelObj && availableModels?.length > 0) {
      console.warn('[Mobile] Model not found in availableModels:', currentModel);
    }

    setIsLoading(true);

    // Add user message to chat
    const userMessage = {
      id: generateId(),
      role: 'user',
      content: messageToSend || '',
      timestamp: new Date().toISOString(),
    };

    if (currentImageData) {
      userMessage.image = currentImageData;
    }

    if (uploadedFile) {
      userMessage.file = {
        type: uploadedFile.type,
        name: uploadedFile.name
      };
    }

    addMessage(currentChatId, userMessage);

    // Clear inputs
    setInputMessage('');
    setUploadedFile(null);

    // Create AI message placeholder
    const aiMessageId = generateId();
    const aiMessage = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      isLoading: true,
      timestamp: new Date().toISOString(),
      modelId: currentModel,
    };

    addMessage(currentChatId, aiMessage);

    // Update chat title if it's a new chat
    if (currentHistory.length === 0) {
      updateChatTitle(currentChatId, messageToSend);
    }

    setTimeout(scrollToBottom, 100);

    let streamedContent = '';

    try {
      if (isBackendModel) {
        const supportsStreaming = currentModelObj?.supportsStreaming !== false;
        
        if (supportsStreaming) {
          await streamMessageFromBackend(
            currentModel,
            messageToSend,
            (chunk) => {
              streamedContent += chunk;
              updateMessage(currentChatId, aiMessageId, { content: streamedContent, isLoading: true });
            },
            selectedActionChip === 'search',
            selectedActionChip === 'deep-research',
            selectedActionChip === 'create-image',
            currentImageData,
            currentFileText,
            thinkingModeSystemPrompt,
            thinkingMode
          );

          updateMessage(currentChatId, aiMessageId, { content: streamedContent, isLoading: false });
        } else {
          const backendResponse = await sendMessageToBackend(
            currentModel,
            messageToSend,
            selectedActionChip === 'search',
            selectedActionChip === 'deep-research',
            selectedActionChip === 'create-image',
            currentImageData,
            currentFileText,
            thinkingModeSystemPrompt,
            thinkingMode
          );

          updateMessage(currentChatId, aiMessageId, {
            content: backendResponse.response || 'No response from backend',
            isLoading: false,
            sources: backendResponse.sources || null
          });
        }
      } else {
        // Client-side API
        const formattedHistory = currentHistory.map(msg => ({
          role: msg.role,
          content: msg.content,
          ...(msg.image && { image: msg.image })
        }));

        const messageGenerator = sendMessage(
          messageToSend,
          currentModel,
          formattedHistory,
          currentImageData,
          currentFileText,
          selectedActionChip === 'search',
          selectedActionChip === 'deep-research',
          selectedActionChip === 'create-image',
          thinkingModeSystemPrompt
        );

        for await (const chunk of messageGenerator) {
          streamedContent += chunk;
          updateMessage(currentChatId, aiMessageId, { content: streamedContent, isLoading: true });
        }

        updateMessage(currentChatId, aiMessageId, { content: streamedContent, isLoading: false });
      }
    } catch (error) {
      console.error('Error generating response:', error);

      updateMessage(currentChatId, aiMessageId, {
        content: `Error: ${error.message || 'Failed to generate response'}`,
        isLoading: false,
        isError: true
      });

      toast.showToast(`Error with ${currentModel}: ${error.message || 'Failed to generate response'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input
    e.target.value = '';
  };

  const getPlaceholderText = () => {
    if (isLoading) return "Generating response...";
    if (isProcessingFile) return "Processing file...";
    if (uploadedFile) return `Attached: ${uploadedFile.name}`;
    return "Message";
  };

  const isSendButtonDisabled = isLoading || isProcessingFile || (!inputMessage.trim() && !uploadedFile);
  
  // Log button state changes
  useEffect(() => {
    console.log('[Mobile] Send button disabled state:', {
      disabled: isSendButtonDisabled,
      isLoading,
      isProcessingFile,
      hasMessage: !!inputMessage.trim(),
      hasFile: !!uploadedFile
    });
  }, [isSendButtonDisabled, isLoading, isProcessingFile, inputMessage, uploadedFile]);

  if (!chat) {
    return (
      <MobileChatContainer>
        <EmptyState>
          <h3>No chat selected</h3>
          <p>Create a new chat to get started</p>
        </EmptyState>
      </MobileChatContainer>
    );
  }

  const hasMessages = chat.messages && chat.messages.length > 0;

  return (
    <MobileChatContainer>
      <MessagesContainer>
        {!hasMessages ? (
          <EmptyState>
            <h3>Start a conversation</h3>
            <p>Ask me anything, and I'll do my best to help!</p>
          </EmptyState>
        ) : (
          <>
            {chat.messages.map(message => (
              <MobileChatMessage
                key={message.id}
                message={message}
                settings={settings}
              />
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </MessagesContainer>

      <InputContainer>
        <InputWrapper>
          <AttachButton onClick={handleAttachClick} disabled={isLoading || isProcessingFile}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
            </svg>
          </AttachButton>
          
          <MessageInput
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={getPlaceholderText()}
            disabled={isLoading || isProcessingFile}
            rows={1}
          />
          
          <SendButton
            onClick={handleSendMessage}
            onTouchEnd={(e) => {
              e.preventDefault();
              console.log('[Mobile] Touch end on send button');
              if (!isSendButtonDisabled) {
                handleSendMessage();
              }
            }}
            disabled={isSendButtonDisabled}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13"></path>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </SendButton>
        </InputWrapper>

        <ActionChipsContainer>
          <ActionChip
            ref={modeAnchorRef}
            selected={thinkingMode !== null}
            onClick={() => {
              if (modeAnchorRef.current) {
                modeAnchorRef.current.offsetHeight;
                const currentRect = modeAnchorRef.current.getBoundingClientRect();
                setModeMenuRect(currentRect);
              }
              setShowModeModal(true);
            }}
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
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
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
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path></svg>
            )}
            Deep research
          </ActionChip>

          <ActionChip
            ref={createAnchorRef}
            selected={selectedActionChip === 'create-image' || selectedActionChip === 'create-video'}
            onClick={() => {
              if (createAnchorRef.current) {
                createAnchorRef.current.offsetHeight;
                const currentRect = createAnchorRef.current.getBoundingClientRect();
                setCreateMenuRect(currentRect);
              }
              setShowCreateModal(true);
            }}
          >
            {theme.name === 'retro' ? (
              <RetroIconWrapper>
                <img src="/images/retroTheme/createIcon.png" alt="Create" style={{ width: '16px', height: '16px' }} />
              </RetroIconWrapper>
            ) : createType === 'image' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
            ) : createType === 'video' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            )}
            {createType === 'image' ? 'Create image' : createType === 'video' ? 'Create video' : 'Create'}
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '3px', opacity: 0.7 }}>
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </ActionChip>
        </ActionChipsContainer>

        <PopupMenu
          isOpen={showModeModal}
          onClose={() => setShowModeModal(false)}
          menuType="mode"
          currentValue={thinkingMode}
          onSelect={handleModeSelect}
          theme={theme}
          rect={modeMenuRect}
        />

        <PopupMenu
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          menuType="create"
          currentValue={createType}
          onSelect={handleCreateSelect}
          theme={theme}
          rect={createMenuRect}
        />
        
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          accept="image/*,.txt,.pdf"
          style={{ display: 'none' }}
        />
      </InputContainer>
    </MobileChatContainer>
  );
};

export default MobileChatWindow;