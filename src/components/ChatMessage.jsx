import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import ModelIcon from './ModelIcon';

// Format markdown text including bold, italic, bullet points and code blocks
const formatContent = (content) => {
  if (!content) return '';
  
  // Extract thinking content if present
  const thinkingRegex = /<think>([\s\S]*?)<\/think>/;
  const thinkingMatch = content.match(thinkingRegex);
  
  let mainContent = content;
  let thinkingContent = null;
  
  if (thinkingMatch) {
    thinkingContent = thinkingMatch[1];
    // Remove the thinking tags and their content from the main content
    mainContent = content.replace(thinkingRegex, '').trim();
  }
  
  // If we have thinking content, return an object with both processed contents
  if (thinkingContent) {
    return {
      main: processText(mainContent),
      thinking: processText(thinkingContent)
    };
  }
  
  // Otherwise, just process the content normally
  return processText(mainContent);
};

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
  border-radius: ${props => props.$useModelIcon ? '0' : '50%'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 14px;
  font-weight: 600;
  flex-shrink: 0;
  background: ${props => props.$useModelIcon 
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
    const bubbleStyle = props.$bubbleStyle || 'modern';
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
    const bubbleStyle = props.$bubbleStyle || 'modern';
    if (bubbleStyle === 'minimal') {
      return 'transparent';
    }
    return props.role === 'user' ? props.theme.messageUser : props.theme.messageAi;
  }};
  color: ${props => props.theme.text};
  box-shadow: ${props => {
    // Apply bubble style
    const bubbleStyle = props.$bubbleStyle || 'modern';
    if (bubbleStyle === 'minimal') {
      return 'none';
    }
    return `0 2px 10px ${props.theme.shadow}`;
  }};
  line-height: var(--line-height, 1.6);
  overflow: hidden;
  flex: 1;
  backdrop-filter: ${props => props.$bubbleStyle === 'minimal' ? 'none' : 'blur(5px)'};
  -webkit-backdrop-filter: ${props => props.$bubbleStyle === 'minimal' ? 'none' : 'blur(5px)'};
  border: ${props => props.$bubbleStyle === 'minimal' ? 'none' : `1px solid ${props.theme.border}`};
  
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
  display: flex;
  align-items: center;
`;

const MessageActions = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
  border-top: 1px solid ${props => props.theme.border}30;
  padding-top: 8px;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  font-size: 0.8rem;
  color: ${props => props.theme.text}80;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.theme.text}10;
    color: ${props => props.theme.text};
  }
  
  svg {
    width: 14px;
    height: 14px;
  }
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

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const ThinkingContainer = styled.div`
  display: flex;
  align-items: center;
  opacity: 0.7;
  font-style: italic;
`;

const SpinnerIcon = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid ${props => props.theme.text}40;
  border-top: 2px solid ${props => props.theme.text};
  border-radius: 50%;
  margin-right: 8px;
  animation: ${spin} 1s linear infinite;
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

// New component for PDF file attachment indicator
const FileAttachmentContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  background: ${props => props.theme.name === 'light' ? 'rgba(246, 248, 250, 0.8)' : 'rgba(30, 30, 30, 0.8)'};
  border: 1px solid ${props => props.theme.border};
  max-width: fit-content;
`;

const FileIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
  color: #e64a3b; /* PDF red color */
`;

const FileName = styled.span`
  font-size: 0.9rem;
  font-weight: 500;
  color: ${props => props.theme.text};
  word-break: break-word;
`;

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// New styled components for sources display
const SourcesContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
`;

const SourceButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 16px;
  border: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.name === 'light' ? 'rgba(246, 248, 250, 0.8)' : 'rgba(30, 30, 30, 0.8)'};
  color: ${props => props.theme.text};
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.name === 'light' ? 'rgba(240, 240, 240, 0.9)' : 'rgba(45, 45, 45, 0.9)'};
    border-color: ${props => props.theme.primary.split(',')[0].replace('linear-gradient(145deg', '').trim()};
  }
`;

const SourceFavicon = styled.img`
  width: 16px;
  height: 16px;
  object-fit: contain;
  border-radius: 2px;
`;

// Add a ThinkingDropdown component
const ThinkingDropdownContainer = styled.div`
  margin: 10px 0;
  border-radius: 12px;
  overflow: hidden;
  border: none;
`;

const ThinkingHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 0;
  cursor: pointer;
  user-select: none;
  font-weight: 500;
  color: ${props => props.theme.text}aa;
  justify-content: flex-start;
  
  &:hover {
    color: ${props => props.theme.text};
  }
`;

const ThinkingArrow = styled.span`
  margin-left: 8px;
  transition: transform 0.2s ease;
  transform: ${props => props.expanded ? 'rotate(180deg)' : 'rotate(0deg)'};
  font-size: 12px;
  display: inline-block;
  width: 16px;
  text-align: center;
`;

const ThinkingContent = styled.div`
  padding: ${props => props.expanded ? '10px 0 10px 16px' : '0'};
  max-height: ${props => props.expanded ? '1000px' : '0'};
  opacity: ${props => props.expanded ? '1' : '0'};
  transition: all 0.3s ease;
  overflow: hidden;
  border-top: none;
  margin-bottom: ${props => props.expanded ? '15px' : '0'};
  margin-left: 10px;
  border-left: ${props => props.expanded ? `2px solid ${props.theme.text}30` : 'none'};
`;

const ThinkingDropdown = ({ thinkingContent }) => {
  const [expanded, setExpanded] = useState(false);
  
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  return (
    <ThinkingDropdownContainer>
      <ThinkingHeader onClick={toggleExpanded}>
        <span>Thoughts</span>
        <ThinkingArrow expanded={expanded}>▾</ThinkingArrow>
      </ThinkingHeader>
      <ThinkingContent expanded={expanded}>
        {thinkingContent}
      </ThinkingContent>
    </ThinkingDropdownContainer>
  );
};

const ChatMessage = ({ message, showModelIcons = true, settings = {} }) => {
  const { role, content, timestamp, isError, isLoading, modelId, image, file, sources } = message;
  
  const getAvatar = () => {
    if (role === 'user') {
      return 'U';
    } else if (showModelIcons && modelId) {
      const modelIconProps = {
        modelId,
        size: "small",
        $inMessage: true,
      };
      
      return <ModelIcon {...modelIconProps} />;
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

  // Check if there's a PDF file attached to the message
  const hasPdfAttachment = file && file.type === 'pdf';
  
  // Check if there's a text file attached to the message
  const hasTextAttachment = file && file.type === 'text';

  // Function to handle copying message content
  const handleCopyText = () => {
    navigator.clipboard.writeText(content)
      .then(() => {
        // Could add toast notification here if desired
        console.log('Text copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

  // Function to handle text-to-speech
  const handleReadAloud = () => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(content);
      window.speechSynthesis.speak(utterance);
    } else {
      console.error('Text-to-speech not supported in this browser');
      // Could show user notification that TTS is not supported
    }
  };

  // Determine if the message has sources to display
  const hasSources = role === 'assistant' && Array.isArray(sources) && sources.length > 0;

  // Extract domain from URL for displaying source name and favicon
  const extractDomain = (url) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain;
    } catch (e) {
      console.error('Error extracting domain:', e);
      return url;
    }
  };

  // Get favicon URL for a domain
  const getFaviconUrl = (url) => {
    try {
      const domain = new URL(url).origin;
      return `${domain}/favicon.ico`;
    } catch (e) {
      return 'https://www.google.com/s2/favicons?domain=' + url;
    }
  };

  return (
    <Message alignment={messageAlignment}>
      {messageAlignment !== 'right' && <Avatar role={role} $useModelIcon={useModelIcon}>{getAvatar()}</Avatar>}
      {isError ? (
        <ErrorMessage role={role} $bubbleStyle={bubbleStyle}>
          {content}
          {timestamp && settings.showTimestamps && <Timestamp>{formatTimestamp(timestamp)}</Timestamp>}
        </ErrorMessage>
      ) : (
        <Content role={role} $bubbleStyle={bubbleStyle} className={highContrast ? 'high-contrast' : ''}>
          {image && (
            <MessageImage src={image} alt="Uploaded image" />
          )}
          {hasPdfAttachment && (
            <FileAttachmentContainer>
              <FileIcon style={{ color: '#e64a3b' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <path d="M9 15h6"></path>
                  <path d="M9 11h6"></path>
                </svg>
              </FileIcon>
              <FileName>{file.name || 'document.pdf'}</FileName>
            </FileAttachmentContainer>
          )}
          {hasTextAttachment && (
            <FileAttachmentContainer>
              <FileIcon style={{ color: '#4285F4' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
              </FileIcon>
              <FileName>{file.name || 'document.txt'}</FileName>
            </FileAttachmentContainer>
          )}
          {isLoading ? (
            <ThinkingContainer>
              <SpinnerIcon />
              Thinking
            </ThinkingContainer>
          ) : (
            <>
              {/* Process content and show main content + thinking dropdown if applicable */}
              {(() => {
                const processedContent = formatContent(content);
                
                if (typeof processedContent === 'object' && processedContent.main && processedContent.thinking) {
                  // If content has thinking tags, show thinking dropdown first, then main content
                  return (
                    <>
                      <ThinkingDropdown thinkingContent={processedContent.thinking} />
                      {processedContent.main}
                    </>
                  );
                } else {
                  // If content has no thinking tags, display it normally (as before)
                  return content.split('\n\n-').map((part, index) => {
                    if (index === 0) {
                      // This is the main content part - process markdown formatting
                      return <React.Fragment key={`content-part-${index}`}>{formatContent(part)}</React.Fragment>;
                    }
                    // This is the model signature part
                    return <em key={`signature-part-${index}`}>- {part}</em>;
                  });
                }
              })()}
            </>
          )}
          
          {/* Message action buttons - only show for completed messages (not loading) */}
          {!isLoading && content && (
            <MessageActions>
              {timestamp && settings.showTimestamps && <Timestamp>{formatTimestamp(timestamp)}</Timestamp>}
              <div style={{ flexGrow: 1 }}></div>
              <ActionButton onClick={handleCopyText}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                Copy
              </ActionButton>
              <ActionButton onClick={handleReadAloud}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                </svg>
                Read
              </ActionButton>
            </MessageActions>
          )}
          
          {/* Sources section */}
          {hasSources && !isLoading && (
            <SourcesContainer>
              {sources.map((source, index) => {
                // Sanitize URL before use with window.open
                let safeUrl = source.url;
                if (safeUrl && !safeUrl.startsWith('http:') && !safeUrl.startsWith('https:')) {
                  console.warn(`Blocked potentially unsafe source URL: ${safeUrl}`);
                  // Fallback to a non-navigable or clearly marked invalid state if desired,
                  // or simply don't open it. For now, let's prevent opening.
                  safeUrl = '#'; // Or null, and disable the button
                }
                return (
                  <SourceButton 
                    key={`source-${index}`} 
                    onClick={() => {
                      if (safeUrl && safeUrl !== '#') {
                        window.open(safeUrl, '_blank');
                      }
                    }}
                    disabled={!safeUrl || safeUrl === '#'} // Disable if URL is unsafe/invalid
                  >
                    <SourceFavicon src={getFaviconUrl(source.url)} alt="" onError={(e) => e.target.src='https://www.google.com/s2/favicons?domain=' + source.url} />
                    {extractDomain(source.url)}
                  </SourceButton>
                );
              })}
            </SourcesContainer>
          )}
        </Content>
      )}
      {messageAlignment === 'right' && <Avatar role={role} $useModelIcon={useModelIcon}>{getAvatar()}</Avatar>}
    </Message>
  );
};

export default ChatMessage;