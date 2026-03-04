import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import StreamingMarkdownRenderer from '../StreamingMarkdownRenderer';
import { processCodeBlocks } from '../../utils/codeBlockProcessor';
import { useTranslation } from '../../contexts/TranslationContext';

const MessageContainer = styled.div`
  margin: 6px 0;
  display: flex;
  flex-direction: column;
  align-items: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
  width: 100%;
`;

const MessageBubble = styled.div`
  max-width: ${props => props.$isUser ? '82%' : 'calc(100% - 8px)'};
  padding: ${props => props.$isUser ? '10px 14px' : '4px 0'};
  border-radius: ${props => props.$isUser ? '18px' : '0'};
  word-wrap: break-word;
  position: relative;
  margin-left: ${props => props.$isUser ? 'auto' : '4px'};
  
  ${props => props.$isUser ? `
    background: ${(() => {
      const p = props.theme.buttonGradient || props.theme.primary;
      if (props.theme.isDark) return props.theme.messageUser || 'rgba(40, 40, 45, 0.95)';
      if (typeof p === 'string' && p.includes('gradient')) return p;
      return props.theme.primary;
    })()};
    color: ${props.theme.isDark ? props.theme.text : (props.theme.primaryForeground || 'white')};
    border-bottom-right-radius: 6px;
    box-shadow: 0 1px 6px ${props.theme.shadow || 'rgba(0,0,0,0.06)'};
  ` : `
    background: transparent;
    color: ${props.theme.text};
  `}
  
  word-break: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
`;

const MessageContent = styled.div`
  font-size: 15px;
  line-height: 1.5;
  
  p {
    margin: 0 0 6px 0;
    line-height: 1.55;
    color: inherit;
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  h1, h2, h3, h4, h5, h6 {
    margin: 14px 0 6px 0;
    font-weight: 650;
    color: ${props => props.theme.text};
    line-height: 1.25;
    letter-spacing: -0.02em;
    &:first-child {
      margin-top: 0;
    }
  }
  
  h1 {
    font-size: 1.5rem;
    border-bottom: 1px solid ${props => props.theme.border};
    padding-bottom: 0.4rem;
  }
  
  h2 {
    font-size: 1.3rem;
    border-bottom: 0.5px solid ${props => props.theme.border};
    padding-bottom: 0.3rem;
  }
  
  h3 { font-size: 1.15rem; }
  h4 { font-size: 1.05rem; }
  h5 { font-size: 1rem; }
  h6 { font-size: 0.9rem; }
  
  ul, ol {
    margin: 6px 0;
    padding-left: 18px;
  }
  
  ul {
    list-style-type: none;
    padding-left: 0;
    
    li {
      position: relative;
      padding-left: 1.4em;
      margin: 3px 0;
      line-height: 1.55;
      color: ${props => props.theme.text};
      
      &:before {
        content: "";
        position: absolute;
        left: 0.3em;
        top: 0.6em;
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: ${props => {
          const p = props.theme.primary;
          if (typeof p === 'string' && !p.includes('gradient')) return p;
          return props.theme.text + '44';
        }};
      }
    }
  }
  
  ol li {
    margin: 3px 0;
    line-height: 1.55;
    color: ${props => props.theme.text};
  }
  
  blockquote {
    border-left: 3px solid ${props => {
      const p = props.theme.primary;
      if (typeof p === 'string' && !p.includes('gradient')) return p;
      return props.theme.border;
    }};
    margin: 6px 0;
    padding: 6px 0 6px 14px;
    background: ${props => props.theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'};
    border-radius: 0 8px 8px 0;
    font-style: italic;
    color: ${props => props.theme.text};
    
    p {
      margin: 0;
      line-height: 1.55;
    }
  }
  
  a {
    color: ${props => {
      const p = props.theme.primary;
      if (typeof p === 'string' && !p.includes('gradient')) return p;
      return props.theme.text;
    }};
    text-decoration: none;
    text-decoration-skip-ink: auto;
  }
  
  pre {
    background: ${props => props.theme.isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)'};
    border: 0.5px solid ${props => props.theme.border};
    border-radius: 10px;
    padding: 12px;
    margin: 6px 0;
    overflow-x: auto;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
    font-size: 13px;
    line-height: 1.5;
    -webkit-overflow-scrolling: touch;
  }
  
  code {
    background: ${props => props.theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'};
    padding: 2px 5px;
    border-radius: 5px;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, monospace;
    font-size: 13.5px;
    color: ${props => props.theme.text};
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 6px 0;
    border: 0.5px solid ${props => props.theme.border};
    border-radius: 10px;
    overflow: hidden;
    background: ${props => props.theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'};
  }
  
  th, td {
    padding: 8px 10px;
    text-align: left;
    border-bottom: 0.5px solid ${props => props.theme.border};
    color: ${props => props.theme.text};
    font-size: 14px;
  }
  
  th {
    background: ${props => props.theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'};
    font-weight: 600;
  }
  
  tr:last-child td {
    border-bottom: none;
  }
  
  hr {
    border: none;
    height: 0.5px;
    background: ${props => props.theme.border};
    margin: 14px 0;
  }
  
  strong, b {
    font-weight: 650;
    color: ${props => props.theme.text};
  }
  
  em, i {
    font-style: italic;
    color: inherit;
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
  font-size: 13px;
  color: ${props => props.theme.textSecondary || (props.theme.text + '77')};
  margin-top: 4px;
  letter-spacing: -0.01em;
`;

const LoadingDots = styled.div`
  display: flex;
  gap: 3px;
  
  span {
    width: 5px;
    height: 5px;
    background: ${props => {
      const p = props.theme.primary;
      if (typeof p === 'string' && !p.includes('gradient')) return p + '88';
      return props.theme.text + '55';
    }};
    border-radius: 50%;
    animation: mobileLoadPulse 1.4s infinite ease-in-out;
    
    &:nth-child(1) { animation-delay: -0.32s; }
    &:nth-child(2) { animation-delay: -0.16s; }
    &:nth-child(3) { animation-delay: 0; }
  }
  
  @keyframes mobileLoadPulse {
    0%, 80%, 100% {
      transform: scale(0.4);
      opacity: 0.3;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }
`;

const MessageTimestamp = styled.div`
  font-size: 11px;
  color: ${props => props.theme.textSecondary || (props.theme.text + '55')};
  margin-top: 3px;
  text-align: ${props => props.$isUser ? 'right' : 'left'};
  padding: 0 2px;
  letter-spacing: 0.01em;
`;

const ErrorMessage = styled.div`
  color: #ff3b30;
  font-size: 13px;
  margin-top: 4px;
  padding: 8px 12px;
  background: rgba(255, 59, 48, 0.08);
  border-radius: 10px;
  border: 0.5px solid rgba(255, 59, 48, 0.15);
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
  const { t } = useTranslation();
  const [imageError, setImageError] = useState(false);
  
  const isUser = message.role === 'user';
  const contentParts = parseMessageContent(message.content);
  
  return (
    <MessageContainer $isUser={isUser}>
      <MessageBubble $isUser={isUser}>
        {message.image && !imageError && (
          <MessageImage
            src={message.image}
            alt={t('chat.attachments.uploaded')}
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
            {t('chat.status.thinking')}
          </LoadingIndicator>
        )}
        
        {message.isError && (
          <ErrorMessage>
            {message.content || t('chat.errors.generic')}
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
