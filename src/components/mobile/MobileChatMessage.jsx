import React, { useState } from 'react';
import styled from 'styled-components';
import StreamingMarkdownRenderer from '../StreamingMarkdownRenderer';

const MessageContainer = styled.div`
  margin: 16px 0;
  display: flex;
  flex-direction: column;
  align-items: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
`;

const MessageBubble = styled.div`
  max-width: 85%;
  padding: 12px 16px;
  border-radius: 18px;
  word-wrap: break-word;
  position: relative;
  
  ${props => props.$isUser ? `
    background: ${props.theme.primary};
    color: white;
    border-bottom-right-radius: 8px;
    margin-left: auto;
  ` : `
    background: ${props.theme.inputBackground};
    color: ${props.theme.text};
    border-bottom-left-radius: 8px;
    border: 1px solid ${props.theme.border};
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
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  /* Handle lists */
  ul, ol {
    margin: 8px 0;
    padding-left: 20px;
  }
  
  li {
    margin: 4px 0;
  }
  
  /* Handle headings */
  h1, h2, h3, h4, h5, h6 {
    margin: 16px 0 8px 0;
    font-weight: 600;
    &:first-child {
      margin-top: 0;
    }
  }
  
  /* Handle code blocks */
  pre {
    background: ${props => props.theme.codeBackground || '#f5f5f5'};
    border-radius: 8px;
    padding: 12px;
    margin: 8px 0;
    overflow-x: auto;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    font-size: 14px;
    border: 1px solid ${props => props.theme.border};
  }
  
  /* Handle inline code */
  code {
    background: ${props => props.theme.codeBackground || '#f5f5f5'};
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    font-size: 14px;
    border: 1px solid ${props => props.theme.border};
  }
  
  /* Handle blockquotes */
  blockquote {
    border-left: 4px solid ${props => props.theme.primary};
    margin: 8px 0;
    padding: 8px 0 8px 16px;
    background: ${props => props.theme.inputBackground};
    border-radius: 0 8px 8px 0;
  }
  
  /* Handle links */
  a {
    color: ${props => props.theme.primary};
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
  
  /* Handle tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0;
    border: 1px solid ${props => props.theme.border};
    border-radius: 8px;
    overflow: hidden;
  }
  
  th, td {
    padding: 8px 12px;
    text-align: left;
    border-bottom: 1px solid ${props => props.theme.border};
  }
  
  th {
    background: ${props => props.theme.inputBackground};
    font-weight: 600;
  }
  
  tr:last-child td {
    border-bottom: none;
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
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
  let lastIndex = 0;
  let match;
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      const textBefore = content.slice(lastIndex, match.index);
      if (textBefore.trim()) {
        parts.push({ type: 'text', content: textBefore });
      }
    }
    
    // Add code block
    parts.push({
      type: 'code',
      language: match[1] || 'text',
      content: match[2]
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < content.length) {
    const remainingText = content.slice(lastIndex);
    if (remainingText.trim()) {
      parts.push({ type: 'text', content: remainingText });
    }
  }
  
  return parts.length > 0 ? parts : [{ type: 'text', content }];
};

// Simple code block component for mobile
const SimpleCodeBlock = ({ language, content }) => (
  <pre style={{
    background: '#f5f5f5',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '12px',
    margin: '8px 0',
    overflow: 'auto',
    fontFamily: 'Monaco, Consolas, monospace',
    fontSize: '14px',
    lineHeight: '1.4'
  }}>
    <code>{content}</code>
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