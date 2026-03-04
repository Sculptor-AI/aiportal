import React, { useState, useRef, useEffect } from 'react';
import styled, { useTheme } from 'styled-components';
import { sendMessage, sendMessageToBackend, streamMessageFromBackend } from '../../services/aiService';
import { performDeepResearch } from '../../services/deepResearchService';
import { useToast } from '../../contexts/ToastContext';
import MobileChatMessage from './MobileChatMessage';
import MobileFileUpload from './MobileFileUpload';
import * as pdfjsLib from 'pdfjs-dist';
import PdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?worker';
import { DEEP_RESEARCH_MODEL_ID } from '../../config/modelConfig';

pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker();

const MobileChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: transparent;
  position: relative;
`;

const SectionHeaderStyled = styled.div`
  padding: 0 0 8px 0;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: ${props => props.theme.textSecondary || (props.theme.text + '88')};
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 8px 16px;
  padding-bottom: env(safe-area-inset-bottom);
  
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
  padding: 40px 32px;
  
  h3 {
    margin: 0 0 8px 0;
    font-size: 22px;
    font-weight: 650;
    color: ${props => props.theme.text};
    letter-spacing: -0.03em;
    line-height: 1.2;
  }
  
  p {
    margin: 0;
    font-size: 15px;
    line-height: 1.5;
    color: ${props => props.theme.textSecondary || (props.theme.text + '77')};
    max-width: 280px;
  }
`;

const InputContainer = styled.div`
  padding: 10px 12px;
  background: ${props => {
    const bg = props.theme.sidebar || props.theme.background;
    if (bg.includes('gradient') || bg.includes('url(')) return 'transparent';
    return bg.replace(/,\s*[\d.]+\)$/, ', 0.72)').replace(/rgb\(/, 'rgba(');
  }};
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-top: 0.5px solid ${props => props.theme.border};
  padding-bottom: max(10px, env(safe-area-inset-bottom));
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 6px;
  background: ${props => props.theme.inputBackground};
  border: 0.5px solid ${props => props.theme.border};
  border-radius: 22px;
  padding: 6px 6px 6px 14px;
  min-height: 44px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  
  &:focus-within {
    border-color: ${props => {
      const p = props.theme.primary;
      if (typeof p === 'string' && !p.includes('gradient')) return p + '66';
      return props.theme.border;
    }};
    box-shadow: 0 0 0 3px ${props => {
      const p = props.theme.primary;
      if (typeof p === 'string' && !p.includes('gradient')) return p + '12';
      return 'transparent';
    }};
  }
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
  padding: 4px 0;
  
  &::placeholder {
    color: ${props => props.theme.textSecondary || (props.theme.text + '66')};
  }
  
  @media screen and (-webkit-min-device-pixel-ratio: 0) {
    font-size: 16px;
  }
`;

const SendButton = styled.button`
  background: ${props => {
    if (props.disabled) return props.theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
    const p = props.theme.primary;
    if (typeof p === 'string' && p.includes('gradient')) return p;
    const bg = props.theme.buttonGradient || props.theme.primary;
    return bg;
  }};
  color: ${props => props.disabled 
    ? (props.theme.textSecondary || props.theme.text + '44') 
    : (props.theme.primaryForeground || 'white')};
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  touch-action: manipulation;
  transition: all 0.2s cubic-bezier(0.25, 1, 0.5, 1);
  
  &:disabled {
    cursor: not-allowed;
  }
  
  &:active:not(:disabled) {
    transform: scale(0.88);
  }
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const AttachButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.textSecondary || (props.theme.text + '77')};
  padding: 6px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  touch-action: manipulation;
  transition: all 0.15s ease;
  
  &:active {
    transform: scale(0.88);
    color: ${props => props.theme.text};
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
    
    const messageToSend = inputMessage.trim();
    const currentImageData = uploadedFile?.dataUrl;
    const currentFileText = uploadedFile?.text;

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

    if (currentModel === DEEP_RESEARCH_MODEL_ID) {
      const deepResearchMessageId = generateId();
      const deepResearchMessage = {
        id: deepResearchMessageId,
        role: 'assistant',
        type: 'deep-research',
        status: 'loading',
        query: messageToSend,
        content: messageToSend,
        progress: 0,
        statusMessage: 'Initializing deep research...',
        timestamp: new Date().toISOString(),
        modelId: currentModel
      };
      addMessage(currentChatId, deepResearchMessage);

      if (currentHistory.length === 0) {
        updateChatTitle(currentChatId, messageToSend);
      }

      setTimeout(scrollToBottom, 100);

      try {
        const maxAgents = Math.max(
          2,
          Math.min(12, Number.parseInt(settings?.deepResearchMaxAgents, 10) || 8)
        );

        await performDeepResearch(
          messageToSend,
          currentModel,
          maxAgents,
          (progress, statusMessage) => {
            const pct = Number.isFinite(progress) ? progress : 0;
            const label = statusMessage || 'Researching...';
            updateMessage(currentChatId, deepResearchMessageId, {
              status: 'loading',
              progress: pct,
              statusMessage: label,
              content: `${label} (${pct}%)`
            });
          },
          (result) => {
            updateMessage(currentChatId, deepResearchMessageId, {
              status: 'completed',
              progress: 100,
              statusMessage: 'Deep research complete',
              query: messageToSend,
              content: result.content || result.report || '',
              subQuestions: result.subQuestions || [],
              agentResults: result.agentResults || [],
              sources: result.sources || [],
              metadata: result.metadata || null,
              qualityIssues: result.qualityIssues || [],
              isLoading: false
            });
          },
          (errorMessage) => {
            updateMessage(currentChatId, deepResearchMessageId, {
              status: 'error',
              query: messageToSend,
              content: errorMessage || 'Deep research failed',
              errorMessage: errorMessage || 'Deep research failed',
              isError: true,
              isLoading: false
            });
          }
        );
      } catch (error) {
        console.error('[Mobile] Deep research failed:', error);
        updateMessage(currentChatId, deepResearchMessageId, {
          status: 'error',
          query: messageToSend,
          content: error?.message || 'Deep research failed',
          errorMessage: error?.message || 'Deep research failed',
          isError: true,
          isLoading: false
        });
        toast.showToast(`Deep research failed: ${error?.message || 'Unknown error'}`, 'error');
      } finally {
        setIsLoading(false);
      }

      return;
    }

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
            false, // search
            false, // deep research
            false, // create image
            currentImageData,
            currentFileText
          );

          updateMessage(currentChatId, aiMessageId, { content: streamedContent, isLoading: false });
        } else {
          const backendResponse = await sendMessageToBackend(
            currentModel,
            messageToSend,
            false, // search
            false, // deep research  
            false, // create image
            currentImageData,
            currentFileText
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
          false, // search
          false, // deep research
          false  // create image
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
          <h3>No chat available</h3>
          <p>Creating a new chat...</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              marginTop: '10px', 
              padding: '8px 16px', 
              background: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            Refresh Page
          </button>
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
                theme={theme}
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
