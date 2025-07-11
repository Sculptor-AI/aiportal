import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import StreamingMarkdownRenderer from '../StreamingMarkdownRenderer';
import { processCodeBlocks } from '../../utils/codeBlockProcessor';

const MessageContainer = styled.div`
  margin: 16px 0;
  display: flex;
  flex-direction: column;
  align-items: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
  width: 100%;
`;

const MessageBubble = styled.div`
  max-width: ${props => props.$isUser ? '85%' : 'calc(100% - 30px)'};
  padding: ${props => props.$isUser ? '12px 16px' : '0'};
  padding-right: ${props => props.$isUser ? '16px' : '20px'};
  border-radius: ${props => props.$isUser ? '20px' : '0'};
  word-wrap: break-word;
  position: relative;
  margin-right: ${props => props.$isUser ? '0' : '0'};
  margin-left: ${props => props.$isUser ? 'auto' : '10px'};
  
  ${props => props.$isUser ? `
    background: ${
      props.theme.name === 'dark' || props.theme.name === 'oled' 
        ? 'rgba(40, 40, 45, 0.95)' 
        : props.theme.primary
    };
    color: ${props.theme.name === 'dark' || props.theme.name === 'oled' ? props.theme.text : 'white'};
    border-bottom-right-radius: 8px;
    box-shadow: 0 2px 10px ${props.theme.shadow};
    border: 1px solid ${props.theme.border};
  ` : `
    background: transparent;
    color: ${props.theme.text};
  `}
  
  /* Handle long content gracefully */
  word-break: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
`;

const MessageContent = styled.div`
  font-size: 16px;
  line-height: 1.4;
  
  /* Style text content */
  p {
    margin: 0 0 8px 0;
    line-height: 1.6;
    color: ${props => props.theme.text};
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  /* Handle headings */
  h1, h2, h3, h4, h5, h6 {
    margin: 16px 0 8px 0;
    font-weight: 600;
    color: ${props => props.theme.text};
    line-height: 1.3;
    &:first-child {
      margin-top: 0;
    }
  }
  
  h1 {
    font-size: 1.6rem;
    border-bottom: 2px solid ${props => props.theme.border};
    padding-bottom: 0.5rem;
  }
  
  h2 {
    font-size: 1.4rem;
    border-bottom: 1px solid ${props => props.theme.border};
    padding-bottom: 0.4rem;
  }
  
  h3 {
    font-size: 1.2rem;
  }
  
  h4 {
    font-size: 1.1rem;
  }
  
  h5 {
    font-size: 1rem;
  }
  
  h6 {
    font-size: 0.9rem;
  }
  
  /* Handle lists */
  ul, ol {
    margin: 8px 0;
    padding-left: 20px;
  }
  
  ul {
    list-style-type: none;
    padding-left: 0;
    
    li {
      position: relative;
      padding-left: 1.5em;
      margin: 4px 0;
      line-height: 1.6;
      color: ${props => props.theme.text};
      
      &:before {
        content: "•";
        position: absolute;
        left: 0.3em;
        color: ${props => props.theme.primary};
        font-weight: bold;
        font-size: 1.2em;
      }
    }
  }
  
  ol li {
    margin: 4px 0;
    line-height: 1.6;
    color: ${props => props.theme.text};
  }
  
  /* Handle blockquotes */
  blockquote {
    border-left: 4px solid ${props => props.theme.primary};
    margin: 8px 0;
    padding: 8px 0 8px 16px;
    background: ${props => props.theme.name === 'light' ? 'rgba(0, 122, 255, 0.05)' : 'rgba(10, 132, 255, 0.1)'};
    border-radius: 0 8px 8px 0;
    font-style: italic;
    color: ${props => props.theme.text};
    
    p {
      margin: 0;
      line-height: 1.6;
    }
  }
  
  /* Handle links */
  a {
    color: ${props => props.theme.primary};
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: border-bottom-color 0.2s ease;
    
    &:hover {
      border-bottom-color: ${props => props.theme.primary};
    }
  }
  
  /* Handle code blocks */
  pre {
    background: ${props => props.theme.name === 'light' ? 'rgba(246, 248, 250, 0.9)' : 'rgba(30, 30, 30, 0.9)'};
    border: 1px solid ${props => props.theme.border};
    border-radius: 8px;
    padding: 12px;
    margin: 8px 0;
    overflow-x: auto;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.5;
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
  }
  
  /* Handle inline code */
  code {
    background: ${props => props.theme.name === 'light' ? 'rgba(246, 248, 250, 0.8)' : 'rgba(30, 30, 30, 0.8)'};
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    font-size: 14px;
    border: 1px solid ${props => props.theme.border};
    color: ${props => props.theme.text};
  }
  
  /* Handle tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0;
    border: 1px solid ${props => props.theme.border};
    border-radius: 8px;
    overflow: hidden;
    background: ${props => props.theme.name === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(30, 30, 30, 0.8)'};
    backdrop-filter: blur(5px);
    -webkit-backdrop-filter: blur(5px);
  }
  
  th, td {
    padding: 8px 12px;
    text-align: left;
    border-bottom: 1px solid ${props => props.theme.border};
    color: ${props => props.theme.text};
  }
  
  th {
    background: ${props => props.theme.name === 'light' ? 'rgba(240, 240, 240, 0.8)' : 'rgba(45, 45, 45, 0.8)'};
    font-weight: 600;
  }
  
  tr:last-child td {
    border-bottom: none;
  }
  
  tr:hover {
    background: ${props => props.theme.name === 'light' ? 'rgba(0, 122, 255, 0.05)' : 'rgba(10, 132, 255, 0.1)'};
  }
  
  /* Handle horizontal rules */
  hr {
    border: none;
    height: 1px;
    background: ${props => props.theme.border};
    margin: 16px 0;
    border-radius: 1px;
  }
  
  /* Handle bold and italic */
  strong, b {
    font-weight: 700;
    color: ${props => props.theme.text};
  }
  
  em, i {
    font-style: italic;
    color: ${props => props.theme.text};
  }
`;

const MessageImage = styled.img`
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 8px 0 0 0;
  border: 1px solid ${props => props.theme.border};
`;

const LoadingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: ${props => props.theme.text}88;
  margin-top: 4px;
`;

const LoadingDots = styled.div`
  display: flex;
  gap: 2px;
  
  span {
    width: 4px;
    height: 4px;
    background: ${props => props.theme.text}88;
    border-radius: 50%;
    animation: loading 1.4s infinite ease-in-out;
    
    &:nth-child(1) { animation-delay: -0.32s; }
    &:nth-child(2) { animation-delay: -0.16s; }
    &:nth-child(3) { animation-delay: 0; }
  }
  
  @keyframes loading {
    0%, 80%, 100% {
      transform: scale(0);
      opacity: 0.5;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }
`;

const MessageTimestamp = styled.div`
  font-size: 12px;
  color: ${props => props.theme.text}66;
  margin-top: 4px;
  text-align: ${props => props.$isUser ? 'right' : 'left'};
`;

const ErrorMessage = styled.div`
  color: #ff4444;
  font-size: 14px;
  margin-top: 4px;
  padding: 8px;
  background: rgba(255, 68, 68, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(255, 68, 68, 0.2);
`;

const parseMessageContent = (content) => {
  if (!content) return [];
  
  const parts = [];
  
  // Use the new code block processor for consistency
  const segments = processCodeBlocks(content, {
    onCodeBlock: ({ language, content: codeContent, isComplete }) => ({
      type: 'code',
      language: language || 'text',
      content: codeContent
    }),
    onTextSegment: (textSegment) => ({
      type: 'text',
      content: textSegment
    })
  });
  
  return segments.length > 0 ? segments : [{ type: 'text', content }];
};

// Simple code block component for mobile
const SimpleCodeBlock = ({ language, content, theme = {} }) => (
  <pre style={{
    background: theme.name === 'dark' || theme.name === 'oled' ? 'rgba(30, 30, 30, 0.9)' : 'rgba(246, 248, 250, 0.9)',
    border: `1px solid ${theme.border || 'rgba(0,0,0,0.1)'}`,
    borderRadius: '8px',
    padding: '12px',
    margin: '8px 0',
    overflow: 'auto',
    fontFamily: 'SF Mono, Monaco, Consolas, monospace',
    fontSize: '14px',
    lineHeight: '1.4',
    color: theme.text || '#000000',
    backdropFilter: 'blur(5px)',
    WebkitBackdropFilter: 'blur(5px)'
  }}>
    <code style={{ color: 'inherit' }}>{content}</code>
  </pre>
);

const formatTextContent = (text) => {
  return text.split('\n').map((line, index, array) => (
    <React.Fragment key={index}>
      {line}
      {index < array.length - 1 && <br />}
    </React.Fragment>
  ));
};

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = diffMs / (1000 * 60 * 60);
  
  if (diffHours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

const MobileChatMessage = ({ message, settings, theme = {} }) => {
  const [imageError, setImageError] = useState(false);
  
  const isUser = message.role === 'user';
  const contentParts = parseMessageContent(message.content);
  
  return (
    <MessageContainer $isUser={isUser}>
      <MessageBubble $isUser={isUser}>
        {message.image && !imageError && (
          <MessageImage
            src={message.image}
            alt="Uploaded content"
            onError={() => setImageError(true)}
          />
        )}
        
        <MessageContent $isUser={isUser}>
          {isUser ? (
            contentParts.map((part, index) => {
              if (part.type === 'code') {
                return (
                  <SimpleCodeBlock
                    key={index}
                    language={part.language}
                    content={part.content}
                    theme={theme}
                  />
                );
              } else {
                return (
                  <div key={index}>
                    {formatTextContent(part.content)}
                  </div>
                );
              }
            })
          ) : (
            <StreamingMarkdownRenderer 
              text={message.content || ''}
              isStreaming={message.isLoading}
              showCursor={message.isLoading}
              theme={theme}
            />
          )}
        </MessageContent>
        
        {message.isLoading && !message.content && (
          <LoadingIndicator>
            <LoadingDots>
              <span></span>
              <span></span>
              <span></span>
            </LoadingDots>
            Thinking...
          </LoadingIndicator>
        )}
        
        {message.isError && (
          <ErrorMessage>
            {message.content || 'Failed to generate response. Please try again.'}
          </ErrorMessage>
        )}
      </MessageBubble>
      
      {settings?.showTimestamps && message.timestamp && (
        <MessageTimestamp $isUser={isUser}>
          {formatTimestamp(message.timestamp)}
        </MessageTimestamp>
      )}
    </MessageContainer>
  );
};

export default MobileChatMessage;