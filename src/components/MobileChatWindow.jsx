import React, { useState, useRef, useEffect } from 'react';
import styled, { useTheme } from 'styled-components';
import { sendMessage, sendMessageToBackend, streamMessageFromBackend } from '../services/aiService';
import { generateImageApi } from '../services/imageService';
import { useToast } from '../contexts/ToastContext';
import MobileChatMessage from './MobileChatMessage';
import MobileFileUpload from './MobileFileUpload';
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

const MobileActionChipsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 16px 0;
  justify-content: flex-start;
`;

const MobileActionChip = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 20px;
  background-color: ${props => props.selected ? props.theme.primary + '20' : props.theme.inputBackground};
  border: 1px solid ${props => props.selected ? props.theme.primary : props.theme.border};
  color: ${props => props.selected ? props.theme.primary : props.theme.text + '99'};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  touch-action: manipulation;
  transition: all 0.2s ease;
  min-height: 36px;
  
  &:active {
    transform: scale(0.95);
    background-color: ${props => props.selected ? props.theme.primary + '30' : props.theme.border};
  }
  
  svg {
    width: 14px;
    height: 14px;
    opacity: 0.8;
  }
`;

const ModeMenuOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1002;
  display: ${props => props.isOpen ? 'block' : 'none'};
`;

const ModeMenuContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: ${props => props.theme.backgroundSecondary || props.theme.background};
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  z-index: 1003;
  padding: 16px;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
  box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
  max-height: 40vh;
  overflow-y: auto;
  transform: translateY(${props => props.isOpen ? '0%' : '100%'});
  transition: transform 0.3s ease-out;
`;

const ModeMenuItem = styled.div`
  display: flex;
  align-items: center;
  padding: 16px 8px;
  border-radius: 8px;
  cursor: pointer;
  gap: 12px;
  
  &:hover {
    background: ${props => props.theme.name === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};
  }
  
  &.selected {
    background: ${props => props.theme.primary + '20'};
    font-weight: bold;
  }
`;

const ModeMenuItemContent = styled.div`
  flex: 1;
`;

const ModeMenuItemName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.theme.text};
  margin-bottom: 4px;
`;

const ModeMenuItemDescription = styled.div`
  font-size: 14px;
  color: ${props => props.theme.text}88;
  line-height: 1.3;
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
  
  // Action chips state
  const [selectedActionChip, setSelectedActionChip] = useState(null);
  const [thinkingMode, setThinkingMode] = useState(null);
  const [createType, setCreateType] = useState(null);
  const [showModeModal, setShowModeModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isImagePromptMode, setIsImagePromptMode] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
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

  const handleImageGeneration = async (prompt) => {
    if (!chat?.id) return;
    
    setIsLoading(true);
    
    // Add user message indicating the prompt
    const userPromptMessage = {
      id: generateId(),
      role: 'user',
      content: `Generate image: "${prompt}"`,
      timestamp: new Date().toISOString(),
    };
    addMessage(chat.id, userPromptMessage);
    
    // Add placeholder message for the generated image
    const imagePlaceholderId = generateId();
    const imagePlaceholderMessage = {
      id: imagePlaceholderId,
      role: 'assistant',
      type: 'generated-image',
      prompt: prompt,
      status: 'loading',
      imageUrl: null,
      content: '',
      timestamp: new Date().toISOString(),
      modelId: 'image-generator',
    };
    addMessage(chat.id, imagePlaceholderMessage);
    
    setTimeout(scrollToBottom, 100);
    
    try {
      const response = await generateImageApi(prompt);
      const imageUrl = response.imageData || response.imageUrl;
      
      if (!imageUrl) {
        throw new Error('No image URL returned from API');
      }
      
      updateMessage(chat.id, imagePlaceholderId, { 
        status: 'completed', 
        imageUrl: imageUrl, 
        isLoading: false 
      });
      
      // Generate title for new chat if this is the first message
      if (chat.messages.length === 0) {
        const title = `Image: ${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}`;
        updateChatTitle(chat.id, title);
      }
    } catch (error) {
      console.error('[Mobile] Error generating image:', error);
      updateMessage(chat.id, imagePlaceholderId, { 
        status: 'error', 
        content: error.message || 'Failed to generate image', 
        isLoading: false, 
        isError: true 
      });
      toast.showToast(`Image generation failed: ${error.message || 'Unknown error'}`, 'error');
    } finally {
      setIsLoading(false);
    }
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

  const handleSendMessage = async () => {
    console.log('[Mobile] Send button clicked');
    
    // Handle image generation mode
    if (isImagePromptMode) {
      if (inputMessage.trim()) {
        await handleImageGeneration(inputMessage.trim());
        setInputMessage('');
        setIsImagePromptMode(false);
        setCreateType(null);
        setSelectedActionChip(null);
      }
      return;
    }
    
    const messageToSend = inputMessage.trim();
    const currentImageData = uploadedFile?.dataUrl;
    const currentFileText = uploadedFile?.text;

    console.log('[Mobile] Message state:', {
      messageToSend,
      hasImage: !!currentImageData,
      hasFile: !!currentFileText,
      uploadedFile,
      actionChip: selectedActionChip,
      thinkingMode
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
    setSelectedActionChip(null);
    setThinkingMode(null);

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
      // Determine action chip flags
      const isSearch = selectedActionChip === 'search';
      const isDeepResearch = selectedActionChip === 'deep-research';
      const isCreateImage = selectedActionChip === 'create-image';
      
      // Create thinking mode system prompt if needed
      const thinkingModeSystemPrompt = thinkingMode === 'thinking' ?
        `You are a Deep Analysis Chain of Thought model. You MUST provide both thinking and a final answer.

CRITICAL: Your response must have TWO parts:

1. FIRST: Put your thinking inside <think></think> tags with your reasoning process.

2. SECOND: After the </think> tag, you MUST provide your actual answer to the user's question. Do not stop after the thinking block.

Example format:
<think>
[Your reasoning here]
</think>

[Your actual answer here]

IMPORTANT: Always provide content after the </think> tag. Never end your response with just the thinking block.` : null;

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
            isSearch,
            isDeepResearch,
            isCreateImage,
            currentImageData,
            currentFileText,
            thinkingModeSystemPrompt,
            thinkingMode,
            currentHistory.map(msg => ({ role: msg.role, content: msg.content }))
          );

          const messageUpdates = { content: streamedContent, isLoading: false };
          if (window.__lastSearchSources && Array.isArray(window.__lastSearchSources) && (isSearch || isDeepResearch)) {
            messageUpdates.sources = window.__lastSearchSources;
            window.__lastSearchSources = null;
          }
          updateMessage(currentChatId, aiMessageId, messageUpdates);
        } else {
          const backendResponse = await sendMessageToBackend(
            currentModel,
            messageToSend,
            isSearch,
            isDeepResearch,
            isCreateImage,
            currentImageData,
            currentFileText,
            thinkingModeSystemPrompt,
            thinkingMode,
            currentHistory.map(msg => ({ role: msg.role, content: msg.content }))
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
          isSearch,
          isDeepResearch,
          isCreateImage,
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
    if (isImagePromptMode) return "Enter prompt for image generation...";
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
        <MobileActionChipsContainer>
          <MobileActionChip
            selected={thinkingMode !== null}
            onClick={() => setShowModeModal(true)}
          >
            {thinkingMode === 'thinking' ? (
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
          </MobileActionChip>
          
          <MobileActionChip
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
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            Search
          </MobileActionChip>
          
          <MobileActionChip
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
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path>
            </svg>
            Deep Research
          </MobileActionChip>
          
          <MobileActionChip
            selected={selectedActionChip === 'create-image' || selectedActionChip === 'create-video'}
            onClick={() => setShowCreateModal(true)}
          >
            {createType === 'image' ? (
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
            {createType === 'image' ? 'Create Image' : createType === 'video' ? 'Create Video' : 'Create'}
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '3px', opacity: 0.7 }}>
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </MobileActionChip>
        </MobileActionChipsContainer>
        
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
        
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          accept="image/*,.txt,.pdf"
          style={{ display: 'none' }}
        />
      </InputContainer>
      
      {/* Mode Selection Modal */}
      <ModeMenuOverlay isOpen={showModeModal} onClick={() => setShowModeModal(false)} />
      <ModeMenuContainer isOpen={showModeModal}>
        <ModeMenuItem
          className={thinkingMode === null ? 'selected' : ''}
          onClick={() => {
            setThinkingMode(null);
            setShowModeModal(false);
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          <ModeMenuItemContent>
            <ModeMenuItemName>Normal</ModeMenuItemName>
            <ModeMenuItemDescription>Standard AI responses</ModeMenuItemDescription>
          </ModeMenuItemContent>
        </ModeMenuItem>
        
        <ModeMenuItem
          className={thinkingMode === 'thinking' ? 'selected' : ''}
          onClick={() => {
            setThinkingMode('thinking');
            setSelectedActionChip(null);
            setShowModeModal(false);
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
            <line x1="16" y1="8" x2="2" y2="22"></line>
            <line x1="17.5" y1="15" x2="9" y2="15"></line>
          </svg>
          <ModeMenuItemContent>
            <ModeMenuItemName>Thinking Mode</ModeMenuItemName>
            <ModeMenuItemDescription>Shows detailed reasoning process</ModeMenuItemDescription>
          </ModeMenuItemContent>
        </ModeMenuItem>
        
        <ModeMenuItem
          className={thinkingMode === 'instant' ? 'selected' : ''}
          onClick={() => {
            setThinkingMode('instant');
            setSelectedActionChip(null);
            setShowModeModal(false);
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
          </svg>
          <ModeMenuItemContent>
            <ModeMenuItemName>Instant Mode</ModeMenuItemName>
            <ModeMenuItemDescription>Quick, concise responses</ModeMenuItemDescription>
          </ModeMenuItemContent>
        </ModeMenuItem>
      </ModeMenuContainer>
      
      {/* Create Modal */}
      <ModeMenuOverlay isOpen={showCreateModal} onClick={() => setShowCreateModal(false)} />
      <ModeMenuContainer isOpen={showCreateModal}>
        <ModeMenuItem
          onClick={() => {
            setCreateType('image');
            setSelectedActionChip('create-image');
            setIsImagePromptMode(true);
            setInputMessage('');
            setShowCreateModal(false);
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          <ModeMenuItemContent>
            <ModeMenuItemName>Create Image</ModeMenuItemName>
            <ModeMenuItemDescription>Generate images from text prompts</ModeMenuItemDescription>
          </ModeMenuItemContent>
        </ModeMenuItem>
        
        <ModeMenuItem
          onClick={() => {
            setCreateType('video');
            setSelectedActionChip('create-video');
            setShowCreateModal(false);
            toast.showToast('Video generation coming soon!', 'info');
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
            <line x1="7" y1="2" x2="7" y2="22"></line>
            <line x1="17" y1="2" x2="17" y2="22"></line>
          </svg>
          <ModeMenuItemContent>
            <ModeMenuItemName>Create Video</ModeMenuItemName>
            <ModeMenuItemDescription>Generate videos from text prompts (Coming Soon)</ModeMenuItemDescription>
          </ModeMenuItemContent>
        </ModeMenuItem>
      </ModeMenuContainer>
    </MobileChatContainer>
  );
};

export default MobileChatWindow;