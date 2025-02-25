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
  background-color: ${props => props.theme.name === 'light' ? '#f6f8fa' : '#1e1e1e'};
  border-radius: 6px;
  margin: 10px 0;
  overflow: hidden;
  border: 1px solid ${props => props.theme.border};
  max-width: 100%;
  width: 100%;
`;

const CodeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background-color: ${props => props.theme.name === 'light' ? '#f0f0f0' : '#2d2d2d'};
  border-bottom: 1px solid ${props => props.theme.border};
`;

const CodeLanguage = styled.div`
  font-size: 0.8rem;
  font-weight: bold;
  color: ${props => props.theme.text};
`;

const CopyButton = styled.button`
  background: none;
  border: none;
  color: ${props => props.theme.primary};
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0;
  
  &:hover {
    text-decoration: underline;
  }
`;

const Pre = styled.pre`
  margin: 0;
  padding: 12px;
  overflow-x: auto;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.9rem;
  line-height: 1.4;
  max-width: 100%;
  word-wrap: normal;
  white-space: pre;
  text-overflow: ellipsis;
`;

const Message = styled.div`
  display: flex;
  margin-bottom: 20px;
  align-items: flex-start;
  max-width: 100%;
  width: 100%;
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: ${props => props.useModelIcon ? '0' : '50%'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  font-weight: bold;
  flex-shrink: 0;
  background-color: ${props => props.useModelIcon ? 'transparent' : (props.role === 'user' ? props.theme.primary : props.theme.secondary)};
  color: white;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
  }
`;

const Content = styled.div`
  padding: 12px 16px;
  border-radius: 8px;
  max-width: 95%;
  width: fit-content;
  white-space: pre-wrap;
  background-color: ${props => props.role === 'user' ? props.theme.messageUser : props.theme.messageAi};
  color: ${props => props.theme.text};
  box-shadow: 0 1px 2px ${props => props.theme.shadow};
  line-height: 1.5;
  overflow: hidden;
  flex: 1;
  
  /* Force code blocks to stay within container width */
  & > ${CodeBlock} {
    max-width: 100%;
  }
  
  /* Style for AI model signatures */
  & > em:last-child {
    display: block;
    margin-top: 10px;
    opacity: 0.7;
    font-size: 0.85em;
    text-align: right;
  }
`;

const Timestamp = styled.div`
  font-size: 0.7rem;
  color: ${props => props.theme.text === '#e4e6eb' ? '#aaa' : '#888'};
  margin-top: 4px;
  text-align: right;
`;

const ErrorMessage = styled(Content)`
  background-color: #ffebee;
  border: 1px solid #ffcdd2;
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