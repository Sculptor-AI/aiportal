import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import ChatMessage from './ChatMessage'; // Reuse the existing ChatMessage component

const SharedViewContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  max-width: 800px; /* Limit width for readability */
  margin: 0 auto; /* Center the container */
  padding: 20px;
  background-color: ${props => props.theme.chat}; /* Use theme background */
  color: ${props => props.theme.text};
  overflow-y: auto; /* Allow scrolling for long chats */
`;

const Header = styled.h1`
  text-align: center;
  margin-bottom: 30px;
  font-weight: 500;
  color: ${props => props.theme.text};
  border-bottom: 1px solid ${props => props.theme.border};
  padding-bottom: 15px;
`;

const MessageList = styled.div`
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 15px; /* Spacing between messages */
`;

const ErrorMessage = styled.div`
  text-align: center;
  margin-top: 50px;
  font-size: 1.2rem;
  color: ${props => props.theme.text}aa;
`;

const SharedChatView = ({ theme }) => { // Assuming theme is passed down or context is used
  const [chat, setChat] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      // Get chat ID from URL query parameter
      const urlParams = new URLSearchParams(window.location.search);
      const chatId = urlParams.get('id');

      if (!chatId) {
        setError('No chat ID provided in the URL.');
        setLoading(false);
        return;
      }

      // Attempt to load all chats from localStorage
      const storedChats = JSON.parse(localStorage.getItem('chats') || '[]');
      
      // Find the specific chat by ID
      const foundChat = storedChats.find(c => c.id === chatId);

      if (foundChat) {
        setChat(foundChat);
      } else {
        setError('Chat not found. This link may be invalid or the chat may have been deleted.');
      }
    } catch (err) {
      console.error("Error loading shared chat:", err);
      setError('Could not load chat data.');
    } finally {
      setLoading(false);
    }
  }, []); // Run only once on mount

  if (loading) {
    // Optional: Add a loading indicator
    return <SharedViewContainer>Loading...</SharedViewContainer>;
  }

  if (error) {
    return (
      <SharedViewContainer>
        <Header>Shared Chat</Header>
        <ErrorMessage>{error}</ErrorMessage>
      </SharedViewContainer>
    );
  }

  return (
    <>
      <SharedViewContainer>
        <Header>{chat.title || 'Shared Conversation'}</Header>
        <MessageList>
          {chat.messages.map((message, index) => (
            <ChatMessage
              key={message.id || index} // Use message.id if available, fallback to index
              message={message}
              isLastMessage={index === chat.messages.length - 1}
              // Pass necessary props for ChatMessage rendering (adjust as needed)
              // Example: Don't pass handlers like onEdit, onDelete for read-only
            />
          ))}
        </MessageList>
      </SharedViewContainer>
    </>
  );
};

export default SharedChatView; 