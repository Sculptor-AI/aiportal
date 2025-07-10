import React from 'react';
import styled, { keyframes } from 'styled-components';
import ExecutableCodeBlock from './ExecutableCodeBlock';
import { isLanguageSupported } from '../services/codeExecutionService';
import ReactKatex from '@pkasila/react-katex';
import 'katex/dist/katex.min.css';

// Styled components for markdown formatting (reused from ChatMessage)
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
      color: ${props => props.theme.text || '#000'};
    }
  }
`;

const CodeBlock = styled.div`
  background: ${props => props.theme.name === 'light' ? 'rgba(246, 248, 250, 0.8)' : 'rgba(30, 30, 30, 0.8)'};
  border: 1px solid ${props => props.theme.border || 'rgba(0,0,0,0.1)'};
  border-radius: 8px;
  overflow: hidden;
  margin: 12px 0;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace;
  font-size: 0.9em;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const CodeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: ${props => props.theme.name === 'light' ? 'rgba(240, 240, 240, 0.6)' : 'rgba(40, 40, 40, 0.8)'};
  border-bottom: 1px solid ${props => props.theme.border || 'rgba(0,0,0,0.1)'};
  font-size: 0.8em;
`;

const CodeLanguage = styled.span`
  color: ${props => props.theme.text || '#000'};
  font-weight: 500;
  text-transform: uppercase;
  font-size: 0.75em;
  letter-spacing: 0.5px;
`;

const CopyButton = styled.button`
  background: none;
  border: 1px solid ${props => props.theme.border || 'rgba(0,0,0,0.2)'};
  color: ${props => props.theme.text || '#000'};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.7em;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.theme.text || '#000'}10;
  }
`;

const Pre = styled.pre`
  margin: 0;
  padding: 12px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  background: none;
  color: ${props => props.theme.text || '#000'};
  line-height: 1.4;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    height: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0,0,0,0.1);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.3);
    border-radius: 4px;
  }
`;

const InlineCode = styled.code`
  background: ${props => props.theme.name === 'light' ? 'rgba(246, 248, 250, 0.8)' : 'rgba(30, 30, 30, 0.8)'};
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace;
  font-size: 0.9em;
  border: 1px solid ${props => props.theme.border || 'rgba(0,0,0,0.1)'};
`;

const Cursor = styled.span`
  opacity: ${props => props.$show ? 1 : 0};
  transition: opacity 0.1s ease-in-out;
  color: ${props => props.theme.text || '#000'};
  animation: blink 1s infinite;

  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
`;

// Process inline formatting (bold, italic, inline code)
const processInlineFormatting = (text, theme) => {
  if (!text) return text;
  
  const parts = [];
  let lastIndex = 0;
  
  // Handle inline code first
  const inlineCodePattern = /`([^`]+)`/g;
  let match;
  
  while ((match = inlineCodePattern.exec(text)) !== null) {
    // Add text before the code
    if (match.index > lastIndex) {
      const beforeText = text.substring(lastIndex, match.index);
      parts.push(<span key={`text-${lastIndex}`}>{processTextFormatting(beforeText, theme)}</span>);
    }
    
    // Add the inline code
    parts.push(<InlineCode key={`code-${match.index}`} theme={theme}>{match[1]}</InlineCode>);
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add any remaining text
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    parts.push(<span key={`text-${lastIndex}`}>{processTextFormatting(remainingText, theme)}</span>);
  }
  
  return parts.length > 0 ? <>{parts}</> : processTextFormatting(text, theme);
};

// Process bold and italic formatting
const processTextFormatting = (text, theme) => {
  if (!text) return text;
  
  // First handle bold text
  const boldPattern = /\*\*(.*?)\*\*/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  
  while ((match = boldPattern.exec(text)) !== null) {
    // Add text before the bold part
    if (match.index > lastIndex) {
      parts.push(<span key={`text-${lastIndex}`}>{processItalic(text.substring(lastIndex, match.index), theme)}</span>);
    }
    
    // Add the bold text (also process any italic within it)
    parts.push(<Bold key={`bold-${match.index}`}>{processItalic(match[1], theme)}</Bold>);
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add any remaining text
  if (lastIndex < text.length) {
    parts.push(<span key={`text-${lastIndex}`}>{processItalic(text.substring(lastIndex), theme)}</span>);
  }
  
  return parts.length > 0 ? <>{parts}</> : processItalic(text, theme);
};

// Process italic formatting
const processItalic = (text, theme) => {
  if (!text) return text;
  
  const italicPattern = /\*([^*]+)\*/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  
  while ((match = italicPattern.exec(text)) !== null) {
    // Add text before the italic part
    if (match.index > lastIndex) {
      parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex, match.index)}</span>);
    }
    
    // Add the italic text
    parts.push(<Italic key={`italic-${match.index}`}>{match[1]}</Italic>);
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add any remaining text
  if (lastIndex < text.length) {
    parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>);
  }
  
  return parts.length > 0 ? <>{parts}</> : text;
};

const StreamingMarkdownRenderer = ({ 
  text = '', 
  isStreaming = false,
  showCursor = true,
  theme = {}
}) => {
  if (!text) {
    return isStreaming && showCursor ? <Cursor $show={true} theme={theme}>|</Cursor> : null;
  }

  // Helper to render LaTeX
  const renderLatex = (latex, displayMode) => (
    <ReactKatex key={`latex-${Math.random()}`} displayMode={displayMode}>
      {latex}
    </ReactKatex>
  );

  // Process the text and handle code blocks
  const processContent = (content) => {
    if (content.includes('```')) {
      const segments = [];
      const lines = content.split('\n');
      let lastIndex = 0;
      let inCodeBlock = false;
      let currentLang = "";
      let codeBlockCount = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Start of code block
        if (line.startsWith('```') && !inCodeBlock) {
          // Process any text before this code block
          const textBeforeCode = lines.slice(lastIndex, i).join('\n');
          if (textBeforeCode.trim()) {
            segments.push(<span key={`text-segment-${segments.length}`}>{processMarkdown(textBeforeCode)}</span>);
          }
          
          inCodeBlock = true;
          currentLang = line.substring(3).trim() || 'code';
          lastIndex = i + 1; // Start collecting code from next line
          continue;
        }
        
        // End of code block
        if (line.startsWith('```') && inCodeBlock) {
          const codeContent = lines.slice(lastIndex, i).join('\n');
          
          // Use ExecutableCodeBlock for supported languages, regular CodeBlock for others
          if (isLanguageSupported(currentLang)) {
            segments.push(
              <ExecutableCodeBlock 
                key={`code-${codeBlockCount++}`}
                language={currentLang}
                value={codeContent}
                theme={theme}
              />
            );
          } else {
            segments.push(
              <CodeBlock key={`code-${codeBlockCount++}`} theme={theme}>
                <CodeHeader theme={theme}>
                  <CodeLanguage theme={theme}>{currentLang}</CodeLanguage>
                  <CopyButton theme={theme} onClick={() => navigator.clipboard.writeText(codeContent)}>
                    Copy
                  </CopyButton>
                </CodeHeader>
                <Pre theme={theme}>{codeContent}</Pre>
              </CodeBlock>
            );
          }
          
          inCodeBlock = false;
          lastIndex = i + 1; // Start collecting text from next line
          continue;
        }
      }
      
      // Add any remaining text after the last code block
      if (lastIndex < lines.length) {
        const textAfterCode = lines.slice(lastIndex).join('\n');
        if (textAfterCode.trim()) {
          segments.push(<span key={`text-segment-${segments.length}`}>{processMarkdown(textAfterCode)}</span>);
        }
      }
      
      // If we're in the middle of a code block (streaming), show it as a partial code block
      if (inCodeBlock && lastIndex <= lines.length) {
        const partialCode = lines.slice(lastIndex).join('\n');
        if (isLanguageSupported(currentLang)) {
          segments.push(
            <ExecutableCodeBlock 
              key={`partial-code-${codeBlockCount}`}
              language={currentLang}
              value={partialCode}
              theme={theme}
            />
          );
        } else {
          segments.push(
            <CodeBlock key={`partial-code-${codeBlockCount}`} theme={theme}>
              <CodeHeader theme={theme}>
                <CodeLanguage theme={theme}>{currentLang}</CodeLanguage>
                <CopyButton theme={theme} onClick={() => navigator.clipboard.writeText(partialCode)}>
                  Copy
                </CopyButton>
              </CodeHeader>
              <Pre theme={theme}>{partialCode}</Pre>
            </CodeBlock>
          );
        }
      }
      
      return <>{segments}</>;
    } else {
      // No code blocks, process all text as markdown
      return processMarkdown(content);
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
          <li key={`item-${i}`}>{processInlineFormatting(itemContent, theme)}</li>
        );
        continue;
      }
      
      // End of a list
      if (inList && (!line.startsWith('* ') || line === '')) {
        result.push(
          <BulletList key={`list-${i}`} theme={theme}>
            {listItems}
          </BulletList>
        );
        inList = false;
        listItems = [];
        
        if (line !== '') {
          result.push(
            <div key={`text-${i}`}>{processInlineFormatting(line, theme)}</div>
          );
        } else {
          result.push(<br key={`br-${i}`} />);
        }
        continue;
      }
      
      // Regular text line
      if (!inList && line !== '') {
        result.push(
          <div key={`text-${i}`}>{processInlineFormatting(line, theme)}</div>
        );
      } else if (!inList) {
        result.push(<br key={`br-${i}`} />);
      }
    }
    
    // Add any remaining list items
    if (inList && listItems.length > 0) {
      result.push(
        <BulletList key="list-end" theme={theme}>
          {listItems}
        </BulletList>
      );
    }
    
    return <>{result}</>;
  };

  return (
    <div style={{ fontFamily: 'inherit', lineHeight: 1.6, wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
      {processContent(text)}
      {isStreaming && showCursor && (
        <Cursor $show={true} theme={theme}>|</Cursor>
      )}
    </div>
  );
};

export default StreamingMarkdownRenderer;