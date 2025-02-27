import React, { useState, useRef, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import ChatMessage from './ChatMessage';
import { sendMessage } from '../services/aiService';
import ModelSelector from './ModelSelector';

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
  z-index: 5;
  position: relative;
`;

const ChatTitleSection = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  gap: 4px; // Use gap instead of margin for more consistent spacing
  padding-left: 5px; // Add padding to shift title right to align with the logo
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
`;

const MessageInput = styled.textarea`
  width: 100%;
  padding: 14px 50px 14px 18px;
  border-radius: 24px;
  border: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.inputBackground};
  color: ${props => props.theme.text};
  font-family: inherit;
  font-size: inherit;
  resize: none;
  min-height: 50px;
  max-height: 150px;
  overflow-y: auto;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: rgba(0, 122, 255, 0.5);
    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
  }
  
  @media (max-width: 768px) {
    padding: 12px 45px 12px 15px;
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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${props => props.theme.text}aa;
  text-align: center;
  padding: 20px;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  
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

const ChatWindow = ({ chat, addMessage, selectedModel: initialSelectedModel, updateChatTitle, settings, focusMode = false }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(initialSelectedModel || 'gemini-2-flash');
  const messagesEndRef = useRef(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(chat?.title || 'New Conversation');

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
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !chat) return;
    
    // Store the message to send before clearing the input
    const messageToSend = inputMessage.trim();
    
    // Create a unique ID for this message
    const userMessageId = Date.now();
    
    // Create user message object
    const userMessage = {
      id: userMessageId,
      role: 'user',
      content: messageToSend,
      timestamp: new Date().toISOString()
    };
    
    // Add user message to the chat
    addMessage(chat.id, userMessage);
    
    // Clear input and show loading state
    setInputMessage('');
    setIsLoading(true);
    
    console.log("Sending message to", selectedModel + ":", messageToSend);
    
    try {
      // Filter history to include only user/assistant messages without UI-specific properties
      const processedHistory = chat.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Send the message to the AI service
      const aiResponse = await sendMessage(messageToSend, selectedModel, processedHistory);
      
      console.log("Received AI response from", selectedModel + ":", aiResponse);
      
      // Create AI message object with a different ID
      const aiMessage = {
        id: userMessageId + 1, // Ensure different ID from user message
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString(),
        modelId: selectedModel // Add the model ID for the icon
      };
      
      // Add AI response to the chat
      addMessage(chat.id, aiMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Create error message
      const errorMessage = {
        id: userMessageId + 1,
        role: 'assistant',
        content: `I encountered an error with the ${selectedModel} API. Error details: ${error.message}`,
        timestamp: new Date().toISOString(),
        isError: true
      };
      
      // Add error message to the chat
      addMessage(chat.id, errorMessage);
    } finally {
      // Hide loading state
      setIsLoading(false);
    }
  };
  
  const handleKeyDown = (e) => {
    // Only send on Enter if the setting is enabled
    if (e.key === 'Enter' && !e.shiftKey && settings?.sendWithEnter) {
      e.preventDefault();
      handleSendMessage();
    }
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
    { id: 'chatgpt-4o', name: 'ChatGPT 4o' }
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
          {isLoading && (
            <ChatMessage 
              message={{ 
                role: 'assistant', 
                content: 'Thinking...', 
                isLoading: true 
              }} 
              showModelIcons={settings.showModelIcons}
              settings={settings}
            />
          )}
          <div ref={messagesEndRef} />
        </MessageList>
      )}
      
      <InputContainer isEmpty={chatIsEmpty}>
        <MessageInputWrapper isEmpty={chatIsEmpty}>
          <MessageInput 
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => inputFocusChange(true)}
            onBlur={() => inputFocusChange(false)}
            placeholder="Type your message here..."
            disabled={isLoading}
          />
          <SendButton 
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
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