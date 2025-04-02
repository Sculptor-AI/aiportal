import React from 'react';
import styled, { keyframes } from 'styled-components';
import ModelIcon from './ModelIcon';

// Format markdown text including bold, italic, bullet points and code blocks
const formatContent = (content) => {
  if (!content) return '';
  
  // Convert markdown syntax to HTML using a more straightforward approach
  const processText = (text) => {
    // First, handle code blocks separately to avoid processing markdown inside them
    if (text.includes('```')) {
      const segments = [];
      let lastIndex = 0;
      let inCodeBlock = false;
      let currentLang = "";
      let currentCode = "";
      let codeBlockCount = 0;
      
      // Find all code block markers
      const lines = text.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Start of code block
        if (line.startsWith('```') && !inCodeBlock) {
          // Process any text before this code block
          if (i > 0) {
            const textBeforeCode = lines.slice(lastIndex, i).join('\n');
            if (textBeforeCode.trim()) {
              segments.push(processMarkdown(textBeforeCode));
            }
          }
          
          inCodeBlock = true;
          currentLang = line.substring(3).trim() || 'code';
          currentCode = "";
          lastIndex = i + 1; // Start collecting code from next line
          continue;
        }
        
        // End of code block
        if (line.startsWith('```') && inCodeBlock) {
          const codeContent = lines.slice(lastIndex, i).join('\n');
          
          segments.push(
            <CodeBlock key={`code-${codeBlockCount++}`} className={currentLang}>
              <CodeHeader>
                <CodeLanguage>{currentLang}</CodeLanguage>
                <CopyButton onClick={() => navigator.clipboard.writeText(codeContent)}>
                  Copy
                </CopyButton>
              </CodeHeader>
              <Pre>{codeContent}</Pre>
            </CodeBlock>
          );
          
          inCodeBlock = false;
          lastIndex = i + 1; // Start collecting text from next line
          continue;
        }
        
        // Collecting code content when inside a code block
        if (inCodeBlock) {
          continue; // We'll collect all lines in the code block at once
        }
      }
      
      // Add any remaining text after the last code block
      if (lastIndex < lines.length) {
        const textAfterCode = lines.slice(lastIndex).join('\n');
        if (textAfterCode.trim()) {
          segments.push(processMarkdown(textAfterCode));
        }
      }
      
      return <>{segments}</>;
    } else {
      // No code blocks, process all text as markdown
      return processMarkdown(text);
    }
  };
  
  // Process regular markdown (bullet points, bold, italic)
  const processMarkdown = (text) => {
    const lines = text.split('\n');
    const result = [];
    let inList = false;
    let listItems = [];
    
    // Process line by line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Bullet point
      if (line.startsWith('* ')) {
        inList = true;
        const itemContent = line.substring(2);
        listItems.push(
          <li key={`item-${i}`}>{processInlineFormatting(itemContent)}</li>
        );
        continue;
      }
      
      // End of a list
      if (inList && (!line.startsWith('* ') || line === '')) {
        result.push(
          <BulletList key={`list-${i}`}>
            {listItems}
          </BulletList>
        );
        inList = false;
        listItems = [];
        
        if (line !== '') {
          result.push(
            <div key={`text-${i}`}>{processInlineFormatting(line)}</div>
          );
        } else {
          result.push(<br key={`br-${i}`} />);
        }
        continue;
      }
      
      // Regular text line
      if (!inList && line !== '') {
        result.push(
          <div key={`text-${i}`}>{processInlineFormatting(line)}</div>
        );
      } else if (!inList) {
        result.push(<br key={`br-${i}`} />);
      }
    }
    
    // Add any remaining list items
    if (inList && listItems.length > 0) {
      result.push(
        <BulletList key="list-end">
          {listItems}
        </BulletList>
      );
    }
    
    return <>{result}</>;
  };
  
  // Process inline formatting (bold, italic)
  const processInlineFormatting = (text) => {
    // First handle bold text
    const boldPattern = /\*\*(.*?)\*\*/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = boldPattern.exec(text)) !== null) {
      // Add text before the bold part
      if (match.index > lastIndex) {
        parts.push(processItalic(text.substring(lastIndex, match.index)));
      }
      
      // Add the bold text (also process any italic within it)
      parts.push(<Bold key={`bold-${match.index}`}>{processItalic(match[1])}</Bold>);
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add any remaining text
    if (lastIndex < text.length) {
      parts.push(processItalic(text.substring(lastIndex)));
    }
    
    return <>{parts}</>;
  };
  
  // Process italic text
  const processItalic = (text) => {
    if (!text) return null;
    
    const italicPattern = /\*((?!\*).+?)\*/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = italicPattern.exec(text)) !== null) {
      // Add text before the italic part
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      
      // Add the italic text
      parts.push(<Italic key={`italic-${match.index}`}>{match[1]}</Italic>);
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add any remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return <>{parts.length > 0 ? parts : text}</>;
  };
  
  return processText(content);
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
  margin-bottom: ${props => {
    // Apply message spacing settings
    const spacing = props.theme.messageSpacing || 'comfortable';
    switch (spacing) {
      case 'compact': return '16px';
      case 'spacious': return '32px';
      default: return '24px'; // comfortable
    }
  }};
  align-items: flex-start;
  max-width: 100%;
  width: 100%;
  justify-content: ${props => props.alignment === 'right' ? 'flex-end' : 'flex-start'};
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
  border-radius: ${props => {
    // Apply bubble style
    const bubbleStyle = props.bubbleStyle || 'modern';
    switch (bubbleStyle) {
      case 'classic': return '8px';
      case 'minimal': return '0';
      default: return '18px'; // modern
    }
  }};
  max-width: 90%;
  width: fit-content;
  white-space: pre-wrap;
  background: ${props => {
    // Apply bubble style
    const bubbleStyle = props.bubbleStyle || 'modern';
    if (bubbleStyle === 'minimal') {
      return 'transparent';
    }
    return props.role === 'user' ? props.theme.messageUser : props.theme.messageAi;
  }};
  color: ${props => props.theme.text};
  box-shadow: ${props => {
    // Apply bubble style
    const bubbleStyle = props.bubbleStyle || 'modern';
    if (bubbleStyle === 'minimal') {
      return 'none';
    }
    return `0 2px 10px ${props.theme.shadow}`;
  }};
  line-height: var(--line-height, 1.6);
  overflow: hidden;
  flex: 1;
  backdrop-filter: ${props => props.bubbleStyle === 'minimal' ? 'none' : 'blur(5px)'};
  -webkit-backdrop-filter: ${props => props.bubbleStyle === 'minimal' ? 'none' : 'blur(5px)'};
  border: ${props => props.bubbleStyle === 'minimal' ? 'none' : `1px solid ${props.theme.border}`};
  
  /* Special border for bisexual theme */
  ${props => props.theme.name === 'bisexual' && `
    border: none;
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: -1px;
      left: -1px;
      right: -1px;
      bottom: -1px;
      background: ${props.role === 'user' ? 
        'linear-gradient(145deg, #D60270, #9B4F96)' : 
        'linear-gradient(145deg, #9B4F96, #0038A8)'};
      border-radius: 19px;
      z-index: -1;
      opacity: 0.3;
    }
  `}
  
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
    ${props => props.theme.name === 'bisexual' && `
      background: ${props.theme.accentGradient};
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      opacity: 0.9;
    `}
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

// Add style components for markdown formatting
const Bold = styled.span`
  font-weight: 700;
`;

const Italic = styled.span`
  font-style: italic;
`;

const BulletList = styled.ul`
  list-style-type: none;
  padding-left: 0;
  margin: 0.5em 0;
  
  li {
    position: relative;
    padding-left: 1.2em;
    margin: 0.4em 0;
    
    &:before {
      content: "•";
      position: absolute;
      left: 0.2em;
      color: ${props => props.theme.text};
    }
  }
`;

const MessageImage = styled.img`
  max-width: 100%;
  max-height: 300px;
  border-radius: 12px;
  margin-bottom: 12px;
  object-fit: contain;
  background: ${props => props.theme.name === 'light' ? 'rgba(246, 248, 250, 0.8)' : 'rgba(30, 30, 30, 0.8)'};
`;

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const ChatMessage = ({ message, showModelIcons = true, settings = {} }) => {
  const { role, content, timestamp, isError, isLoading, modelId, image } = message;
  
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

  // Get message alignment from settings
  const messageAlignment = settings.messageAlignment || 'left';

  // Get bubble style from settings
  const bubbleStyle = settings.bubbleStyle || 'modern';

  // Apply high contrast mode if set
  const highContrast = settings.highContrast || false;

  return (
    <Message alignment={messageAlignment}>
      {messageAlignment !== 'right' && <Avatar role={role} useModelIcon={useModelIcon}>{getAvatar()}</Avatar>}
      {isError ? (
        <ErrorMessage role={role} bubbleStyle={bubbleStyle}>
          {content}
          {timestamp && settings.showTimestamps && <Timestamp>{formatTimestamp(timestamp)}</Timestamp>}
        </ErrorMessage>
      ) : (
        <Content role={role} bubbleStyle={bubbleStyle} className={highContrast ? 'high-contrast' : ''}>
          {image && (
            <MessageImage src={image} alt="Uploaded image" />
          )}
          {isLoading ? (
            <LoadingDots>{content}</LoadingDots>
          ) : (
            // Apply formatting and model signature styling
            content.split('\n\n-').map((part, index) => {
              if (index === 0) {
                // This is the main content part - process markdown formatting
                return formatContent(part);
              }
              // This is the model signature part
              return <em key={index}>- {part}</em>;
            })
          )}
          {timestamp && settings.showTimestamps && <Timestamp>{formatTimestamp(timestamp)}</Timestamp>}
        </Content>
      )}
      {messageAlignment === 'right' && <Avatar role={role} useModelIcon={useModelIcon}>{getAvatar()}</Avatar>}
    </Message>
  );
};

export default ChatMessage;