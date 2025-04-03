import React, { useState, useRef, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import ChatMessage from './ChatMessage';
import { sendMessage } from '../services/aiService';
import ModelSelector from './ModelSelector';
import FileUploadButton from './FileUploadButton'; // Renamed import
import * as pdfjsLib from 'pdfjs-dist'; // Import pdfjs
import PdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?worker'; // Import worker using Vite's worker syntax

// Use Vite's worker import approach instead of CDN
pdfjsLib.GlobalWorkerOptions.workerPort = new PdfWorker();

const ChatWindowContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
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

const InputContainer = styled.div`
  padding: ${props => props.isEmpty ? '15px 10% 40px' : '15px'};
  display: flex;
  align-items: flex-end;
  justify-content: center;
  position: ${props => props.isEmpty ? 'absolute' : 'relative'};
  bottom: ${props => props.isEmpty ? '5%' : '0'};
  width: 100%;
  z-index: 10;
  transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  animation: ${props => props.isEmpty ? fadeIn : 'none'} 0.5s ease;
  backdrop-filter: ${props => !props.isEmpty && 'blur(5px)'};
  -webkit-backdrop-filter: ${props => !props.isEmpty && 'blur(5px)'};
  
  @media (max-width: 768px) {
    padding: ${props => props.isEmpty ? '10px 5% 40px' : '10px'};
  }
`;

const MessageInputWrapper = styled.div`
  position: relative;
  flex: 1;
  max-width: ${props => props.isEmpty ? '700px' : '100%'};
  transition: max-width 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  display: flex;
  align-items: center;
`;

const MessageInput = styled.textarea`
  width: 100%;
  padding: 15px 50px 15px 60px;
  border-radius: 24px;
  border: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.inputBackground};
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
  
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  transition: all 0.2s ease;
  vertical-align: middle;
  padding-left: 60px; /* Ensure consistent padding */
  
  &::placeholder {
    position: relative;
    top: 0;
  }
  
  &:focus {
    outline: none;
    border-color: rgba(0, 122, 255, 0.5);
    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
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
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.text}aa;
  text-align: center;
  padding: 20px;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  width: 100%;
  max-width: 600px;
  z-index: 5;
  pointer-events: none; /* Allow clicks to pass through */
  
  h3 {
    margin-bottom: 15px;
    font-weight: 500;
    font-size: 1.5rem;
  }
  
  p {
    max-width: 500px;
    line-height: 1.6;
    font-size: 1rem;
  }
`;

const ChatWindow = ({ chat, addMessage, updateMessage, selectedModel: initialSelectedModel, updateChatTitle, settings, focusMode = false }) => {
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
    if (chat?.id && initialSelectedModel && focusMode) {
      setSelectedModel(initialSelectedModel);
      setResetFileUpload(false);
    }
  }, [chat?.id, initialSelectedModel, focusMode]);

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
  
  const handleSendMessage = async () => {
    if ((!inputMessage.trim() && !uploadedFileData) || !chat) return;
    
    const messageToSend = inputMessage.trim();
    const userMessageId = Date.now();
    const fileDataToSend = uploadedFileData; // Store before clearing state
    const currentModel = selectedModel; // Capture current model for the response
    
    // Clear input, file and set processing state
    setInputMessage('');
    setUploadedFileData(null);
    setResetFileUpload(true);
    setTimeout(() => setResetFileUpload(false), 100);
    setIsLoading(true); // Keep isLoading for overall process

    let fileTextContent = null;
    if (fileDataToSend && (fileDataToSend.type === 'pdf' || fileDataToSend.type === 'text')) {
      fileTextContent = fileDataToSend.content;
    }

    // Add user message immediately
    const userMessage = {
      id: userMessageId,
      role: 'user',
      content: messageToSend,
      timestamp: new Date().toISOString(),
      ...(fileDataToSend && {
        file: {
          name: fileDataToSend.name,
          type: fileDataToSend.type, // Store 'pdf' or 'text' or 'image'
        },
        image: (fileDataToSend.type === 'image') ? fileDataToSend.content : null
      })
    };
    addMessage(chat.id, userMessage);
    
    // Add placeholder AI message
    const aiMessageId = userMessageId + 1;
    const placeholderAiMessage = {
      id: aiMessageId,
      role: 'assistant',
      content: '', // Start with empty content
      isLoading: true, // Indicate loading/streaming
      timestamp: new Date().toISOString(),
      modelId: currentModel
    };
    addMessage(chat.id, placeholderAiMessage);
    
    console.log("Sending message to", currentModel + ":", messageToSend, "with file:", fileDataToSend?.name);
    
    try {
      const processedHistory = chat.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        image: msg.image
      }));
      
      const imageDataToSend = (fileDataToSend?.type === 'image') ? fileDataToSend.content : null;
      
      // Get the async generator from the new sendMessage
      const streamGenerator = sendMessage(
        messageToSend,
        currentModel,
        processedHistory,
        imageDataToSend,
        fileTextContent
      );
      
      // Process the stream
      let streamedContent = '';
      for await (const chunk of streamGenerator) {
        streamedContent += chunk;
        // Update the placeholder message content chunk by chunk
        updateMessage(chat.id, aiMessageId, { content: streamedContent, isLoading: true }); 
      }
      
      // Final update to the AI message when streaming is complete
      updateMessage(chat.id, aiMessageId, { content: streamedContent, isLoading: false, timestamp: new Date().toISOString() });
      console.log("Streaming finished for", currentModel);

    } catch (error) {
      console.error('Error during message streaming:', error);
      // Update the placeholder message to show the error
      updateMessage(chat.id, aiMessageId, {
          content: `Error receiving response from ${currentModel}: ${error.message}`,
          isError: true,
          isLoading: false,
          timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false); // Indicate overall process finished
    }
  };
  
  const handleKeyDown = (e) => {
    // Only send on Enter if the setting is enabled
    if (e.key === 'Enter' && !e.shiftKey && settings?.sendWithEnter) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle file selection (from button or paste)
  const handleFileSelected = async (file) => { // Make async
    if (file) {
      const isImage = file.type.startsWith('image/');
      const isText = file.type === 'text/plain';
      const isPdf = file.type === 'application/pdf';

      if (isImage || isText || isPdf) {
        if (file.size > 10 * 1024 * 1024) { /* ... size check ... */ return; }

        setIsProcessingFile(true); // Start processing indicator
        setUploadedFileData({ file: file, type: file.type.split('/')[0], content: 'Processing...', name: file.name }); // Show processing state

        try {
          if (isImage) {
            const reader = new FileReader();
            reader.onloadend = () => {
              setUploadedFileData({ file: file, type: 'image', content: reader.result, name: file.name });
              setIsProcessingFile(false);
            };
            reader.onerror = () => { setIsProcessingFile(false); alert('Error reading image file.'); };
            reader.readAsDataURL(file);
          } else if (isText) {
            const reader = new FileReader();
            reader.onloadend = () => {
              setUploadedFileData({ file: file, type: 'text', content: reader.result, name: file.name });
              setIsProcessingFile(false);
            };
             reader.onerror = () => { setIsProcessingFile(false); alert('Error reading text file.'); };
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
             setUploadedFileData({ file: file, type: 'pdf', content: fullText.trim(), name: file.name });
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
        }
      } else {
         alert('Unsupported file type selected.');
         setUploadedFileData(null);
         // No need to set setIsProcessingFile(false) here as it wasn't set true
      }
    } else {
      setUploadedFileData(null);
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

  if (!chat) {
    return (
      <ChatWindowContainer fontSize={settings?.fontSize}>
        <EmptyState>
          <h3>No chat selected</h3>
          <p>Create a new chat or select an existing one to start the conversation.</p>
        </EmptyState>
      </ChatWindowContainer>
    );
  }
  
  const chatIsEmpty = chat.messages.length === 0;
  
  // Models array to pass to the ModelSelector component
  const availableModels = [
    { id: 'gemini-2-flash', name: 'Gemini 2 Flash' },
    { id: 'claude-3.7-sonnet', name: 'Claude 3.7 Sonnet' },
    { id: 'chatgpt-4o', name: 'ChatGPT 4o' },
    { id: 'nemotron-super-49b', name: 'Nemotron 49B' },  
    { id: 'ursa-minor', name: 'Ursa Minor' }
  ];
  
  // Handle model change
  const handleModelChange = (modelId) => {
    // This would need to be lifted up to the parent component
    // For now, we'll just log it
    console.log(`Model changed to: ${modelId}`);
    // In a real implementation, you would call a function passed as props
    // E.g.: onModelChange(modelId);
  };

  const [isFocused, setIsFocused] = useState(false);
  
  // Handle focus mode
  const inputFocusChange = (isFocusedState) => {
    if (focusMode) {
      setIsFocused(isFocusedState);
    }
  };

  // Clear attached file data
  const clearUploadedFile = () => {
    setUploadedFileData(null);
    setResetFileUpload(true); // Trigger reset in FileUploadButton as well
    setTimeout(() => setResetFileUpload(false), 0);
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
          opacity: (focusMode && isFocused) ? '0' : '1',
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
            onChange={(modelId) => {
              setSelectedModel(modelId);
              handleModelChange(modelId);
            }}
          />
        </ModelSelectorWrapper>
      </ChatHeader>
      
      {chatIsEmpty ? (
        <EmptyState>
          <h3>Start a conversation</h3>
          <p>Send a message to start chatting with the AI assistant. You can ask questions, get information, or just have a casual conversation.</p>
        </EmptyState>
      ) : (
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
      
      <InputContainer isEmpty={chatIsEmpty}>
        <MessageInputWrapper isEmpty={chatIsEmpty}>
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
            onKeyDown={handleKeyDown}
            onPaste={handlePaste} 
            placeholder={getPlaceholderText()} // Use dynamic placeholder
            disabled={isLoading || isProcessingFile} // Disable while processing
            rows={1}
            style={{ maxHeight: '150px', overflowY: 'auto' }} 
          />
          <SendButton
            onClick={handleSendMessage}
            disabled={isLoading || isProcessingFile || (!inputMessage.trim() && !uploadedFileData)} // Also disable while processing
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
};

export default ChatWindow;
