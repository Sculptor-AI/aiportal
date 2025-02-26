import React from 'react';
import styled, { keyframes } from 'styled-components';
import ModelIcon from './ModelIcon';

// Simple function to identify and format code blocks
const formatContentWithCodeHighlighting = (content) => {
  if (!content) return '';
  
  // Check if content contains code blocks marked with ```
  if (!content.includes('```')) return content;
  
  // Split by code block markers
  const parts = content.split(/(```(?:[\w]*)\n[\s\S]*?\n```)/g);
  
  return parts.map((part, index) => {
    // Check if this part is a code block
    if (part.startsWith('```') && part.endsWith('```')) {
      // Extract the language if specified (e.g., ```javascript)
      let language = 'code';
      const firstLineEnd = part.indexOf('\n');
      if (firstLineEnd > 3) {
        language = part.substring(3, firstLineEnd).trim();
      }
      
      // Extract the code content
      const code = part.substring(part.indexOf('\n') + 1, part.lastIndexOf('```')).trim();
      
      // Return the code in a formatted block
      return (
        <CodeBlock key={index} className={language}>
          <CodeHeader>
            <CodeLanguage>{language !== 'code' ? language : 'code'}</CodeLanguage>
            <CopyButton onClick={() => navigator.clipboard.writeText(code)}>
              Copy
            </CopyButton>
          </CodeHeader>
          <Pre>{code}</Pre>
        </CodeBlock>
      );
    }
    
    // Regular text
    return <span key={index}>{part}</span>;
  });
};

const CodeBlock = styled.div`
  background: ${props => props.theme.name === 'light' ? 'rgba(246, 248, 250, 0.8)' : 'rgba(30, 30, 30, 0.8)'};
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border-radius: 12px;
  margin: 12px 0;
  overflow: hidden;
  border: 1px solid ${props => props.theme.border};
  max-width: 100%;
  width: 100%;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const CodeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 10px 14px;
  background: ${props => props.theme.name === 'light' ? 'rgba(240, 240, 240, 0.8)' : 'rgba(45, 45, 45, 0.8)'};
  border-bottom: 1px solid ${props => props.theme.border};
`;

const CodeLanguage = styled.div`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${props => props.theme.text};
`;

const CopyButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.primary.split(',')[0].replace('linear-gradient(145deg', '').trim()};
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0;
  font-weight: 500;
  
  &:hover {
    text-decoration: underline;
  }
`;

const Pre = styled.pre`
  margin: 0;
  padding: 14px;
  overflow-x: auto;
  font-family: 'SF Mono', SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  max-width: 100%;
  word-wrap: normal;
  white-space: pre;
  text-overflow: ellipsis;
  
  /* Stylish scrollbar */
  &::-webkit-scrollbar {
    height: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.border};
    border-radius: 3px;
  }
`;

const Message = styled.div`
  display: flex;
  margin-bottom: 24px;
  align-items: flex-start;
  max-width: 100%;
  width: 100%;
`;

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: ${props => props.useModelIcon ? '0' : '50%'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 14px;
  font-weight: 600;
  flex-shrink: 0;
  background: ${props => props.useModelIcon 
    ? 'transparent' 
    : (props.role === 'user' 
        ? props.theme.buttonGradient 
        : props.theme.secondary)};
  color: white;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.15);
  }
`;

const Content = styled.div`
  padding: 15px 18px;
  border-radius: 18px;
  max-width: 90%;
  width: fit-content;
  white-space: pre-wrap;
  background: ${props => props.role === 'user' ? props.theme.messageUser : props.theme.messageAi};
  color: ${props => props.theme.text};
  box-shadow: 0 2px 10px ${props => props.theme.shadow};
  line-height: 1.6;
  overflow: hidden;
  flex: 1;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border: 1px solid ${props => props.theme.border};
  
  /* Force code blocks to stay within container width */
  & > ${CodeBlock} {
    max-width: 100%;
  }
  
  /* Style for AI model signatures */
  & > em:last-child {
    display: block;
    margin-top: 12px;
    opacity: 0.7;
    font-size: 0.85em;
    text-align: right;
    font-style: normal;
    color: ${props => props.theme.text}aa;
  }
  
  @media (max-width: 768px) {
    max-width: 100%;
    padding: 12px 14px;
  }
`;

const Timestamp = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme.text}80;
  margin-top: 6px;
  text-align: right;
`;

const ErrorMessage = styled(Content)`
  background: rgba(255, 240, 240, 0.8);
  border: 1px solid rgba(255, 200, 200, 0.4);
`;

const pulse = keyframes`
  0% { opacity: 0.5; }
  50% { opacity: 1; }
  100% { opacity: 0.5; }
`;

const LoadingDots = styled.span`
  display: inline-block;
  animation: ${pulse} 1.5s infinite;
`;

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ChatMessage = ({ message, showModelIcons = true }) => {
  const { role, content, timestamp, isError, isLoading, modelId } = message;
  
  const getAvatar = () => {
    if (role === 'user') {
      return 'U';
    } else if (showModelIcons && modelId) {
      return <ModelIcon modelId={modelId} size="small" inMessage={true} />;
    } else {
      return 'AI';
    }
  };
  
  // Determine if we should use a model icon (for AI messages with a modelId)
  const useModelIcon = role === 'assistant' && showModelIcons && modelId;

  return (
    <Message>
      <Avatar role={role} useModelIcon={useModelIcon}>{getAvatar()}</Avatar>
      {isError ? (
        <ErrorMessage role={role}>
          {content}
          {timestamp && <Timestamp>{formatTimestamp(timestamp)}</Timestamp>}
        </ErrorMessage>
      ) : (
        <Content role={role}>
          {isLoading ? (
            <LoadingDots>{content}</LoadingDots>
          ) : (
                  // Apply code syntax highlighting and model signature styling
            content.split('\n\n-').map((part, index) => {
              if (index === 0) {
                // This is the main content part
                return formatContentWithCodeHighlighting(part);
              }
              // This is the model signature part
              return <em key={index}>- {part}</em>;
            })
          )}
          {timestamp && <Timestamp>{formatTimestamp(timestamp)}</Timestamp>}
        </Content>
      )}
    </Message>
  );
};

export default ChatMessage;