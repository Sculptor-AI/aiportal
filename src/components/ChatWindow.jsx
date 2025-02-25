import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import ChatMessage from './ChatMessage';
import { sendMessage } from '../services/aiService';

const ChatWindowContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: ${props => props.theme.chat};
  font-size: ${props => {
    switch(props.fontSize) {
      case 'small': return '0.9rem';
      case 'large': return '1.1rem';
      default: return '1rem';
    }
  }};
`;

const ChatHeader = styled.div`
  padding: 15px;
  border-bottom: 1px solid ${props => props.theme.border};
  display: flex;
  align-items: center;
`;

const ChatTitle = styled.h2`
  font-size: 1.2rem;
  font-weight: 500;
  margin: 0;
`;

const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px;
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const InputContainer = styled.div`
  border-top: 1px solid ${props => props.theme.border};
  padding: 15px;
  display: flex;
  
  @media (max-width: 768px) {
    padding: 10px;
  }
`;

const MessageInput = styled.textarea`
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.border};
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.text};
  font-family: inherit;
  font-size: inherit;
  resize: none;
  min-height: 50px;
  max-height: 150px;
  overflow-y: auto;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary};
  }
  
  @media (max-width: 768px) {
    padding: 8px;
    min-height: 40px;
  }
`;

const SendButton = styled.button`
  background-color: ${props => props.theme.primary};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0 15px;
  margin-left: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${props => props.theme.secondary};
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  text-align: center;
  padding: 20px;
  
  h3 {
    margin-bottom: 10px;
  }
  
  p {
    max-width: 500px;
  }
`;

const ChatWindow = ({ chat, addMessage, selectedModel, updateChatTitle, settings }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);
  
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
  
  return (
    <ChatWindowContainer fontSize={settings?.fontSize}>
      <ChatHeader>
        <ChatTitle>{chat.title}</ChatTitle>
      </ChatHeader>
      
      {chat.messages.length === 0 ? (
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
              showModelIcons={settings?.showModelIcons}
            />
          ))}
          {isLoading && (
            <ChatMessage 
              message={{ 
                role: 'assistant', 
                content: 'Thinking...', 
                isLoading: true 
              }} 
            />
          )}
          <div ref={messagesEndRef} />
        </MessageList>
      )}
      
      <InputContainer>
        <MessageInput 
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message here..."
          disabled={isLoading}
        />
        <SendButton 
          onClick={handleSendMessage}
          disabled={isLoading || !inputMessage.trim()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </SendButton>
      </InputContainer>
    </ChatWindowContainer>
  );
};

export default ChatWindow;