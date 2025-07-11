import React, { useState, useMemo, useRef, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import ModelIcon from './ModelIcon';
import TextDiffusionAnimation from './TextDiffusionAnimation';
import StreamingMarkdownRenderer from './StreamingMarkdownRenderer';
import { extractSourcesFromResponse } from '../utils/sourceExtractor';
import { processCodeBlocks } from '../utils/codeBlockProcessor';
import CodeBlockWithExecution from './CodeBlockWithExecution';
import useSupportedLanguages from '../hooks/useSupportedLanguages';
import ReactKatex from '@pkasila/react-katex';
import 'katex/dist/katex.min.css';

// Helper function to parse and render LaTeX
const renderLatex = (latex, displayMode, keyPrefix = 'latex') => (
  <ReactKatex key={`${keyPrefix}-${latex.length}-${displayMode}`} displayMode={displayMode}>
    {latex}
  </ReactKatex>
);

// Format markdown text including bold, italic, bullet points and code blocks
const robustFormatContent = (content, isLanguageExecutable = null, supportedLanguages = [], theme = {}) => {
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
      main: processText(mainContent, true, isLanguageExecutable, supportedLanguages, theme),
      thinking: processText(thinkingContent, true, isLanguageExecutable, supportedLanguages, theme)
    };
  }
  
  // Otherwise, just process the content normally
  return processText(mainContent, true, isLanguageExecutable, supportedLanguages, theme);
};

// Convert markdown syntax to HTML using a more straightforward approach
const processText = (text, enableCodeExecution = true, isLanguageExecutable = null, supportedLanguages = [], theme = {}) => {
  // Use the new code block processor for consistency
  return processCodeBlocks(text, {
    onCodeBlock: ({ language, content: codeContent, isComplete, key, theme: blockTheme }) => {
      // Use CodeBlockWithExecution if code execution is enabled and language is executable
      if (enableCodeExecution && isLanguageExecutable && isLanguageExecutable(language)) {
        return (
          <CodeBlockWithExecution
            key={key}
            language={language}
            content={codeContent}
            theme={blockTheme || theme}
            supportedLanguages={supportedLanguages}
            onExecutionComplete={(result, error, executionTime) => {
              console.log('Code execution completed:', { result, error, executionTime });
            }}
          />
        );
      }
      
      // Fall back to regular code block for non-executable languages
      return (
        <CodeBlock key={key} theme={blockTheme || theme}>
          <CodeHeader theme={blockTheme || theme}>
            <CodeLanguage theme={blockTheme || theme}>{language}</CodeLanguage>
            <CopyButton theme={blockTheme || theme} onClick={() => navigator.clipboard.writeText(codeContent)}>
              Copy
            </CopyButton>
          </CodeHeader>
          <Pre theme={blockTheme || theme}>{codeContent}</Pre>
        </CodeBlock>
      );
    },
    onTextSegment: (textSegment) => processMarkdown(textSegment, theme),
    theme
  });
};

// Update processMarkdown to handle LaTeX
const processMarkdown = (text, theme = {}) => {
  const parts = [];
  let lastIndex = 0;
  let keyCounter = 0;

  // Regex for display math: $$\n?...$$\n? or $$...$$
  const displayRegex = /\$\$\s*([\s\S]*?)\s*\$\$/g;
  // Regex for inline math: $...$ (not starting/ending with space)
  const inlineRegex = /\$([^\s].*?[^\s])\$/g;

  // First handle display math
  let match;
  while ((match = displayRegex.exec(text)) !== null) {
    // Add text before
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${keyCounter++}`}>
          {processMarkdownText(text.substring(lastIndex, match.index), theme)}
        </span>
      );
    }
    // Add LaTeX
    parts.push(renderLatex(match[1], true, `display-${keyCounter++}`));
    lastIndex = match.index + match[0].length;
  }
  // Add remaining after display
  let remaining = text.substring(lastIndex);

  // Now handle inline in the remaining parts
  lastIndex = 0;
  while ((match = inlineRegex.exec(remaining)) !== null) {
    // Add text before
    if (match.index > lastIndex) {
      parts.push(
        <span key={`text-${keyCounter++}`}>
          {processMarkdownText(remaining.substring(lastIndex, match.index), theme)}
        </span>
      );
    }
    // Add inline LaTeX
    parts.push(renderLatex(match[1], false, `inline-${keyCounter++}`));
    lastIndex = match.index + match[0].length;
  }
  // Add final remaining
  if (lastIndex < remaining.length) {
    parts.push(
      <span key={`text-${keyCounter++}`}>
        {processMarkdownText(remaining.substring(lastIndex), theme)}
      </span>
    );
  }

  return <>{parts}</>;
};

// New function for processing non-LaTeX markdown text (lines, bullets, etc.)
const processMarkdownText = (text, theme = {}) => {
  const lines = text.split('\n');
  const result = [];
  let inList = false;
  let inNumberedList = false;
  let listItems = [];
  let numberedListItems = [];
  
  // Process line by line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Headings
    if (line.startsWith('# ')) {
      if (inList) {
        result.push(
          <BulletList key={`list-${i}`} theme={theme}>
            {listItems}
          </BulletList>
        );
        inList = false;
        listItems = [];
      }
      if (inNumberedList) {
        result.push(
          <NumberedList key={`nlist-${i}`} theme={theme}>
            {numberedListItems}
          </NumberedList>
        );
        inNumberedList = false;
        numberedListItems = [];
      }
      result.push(
        <Heading1 key={`h1-${i}`} theme={theme}>
          {processInlineFormatting(line.substring(2), theme)}
        </Heading1>
      );
      continue;
    }
    
    if (line.startsWith('## ')) {
      if (inList) {
        result.push(
          <BulletList key={`list-${i}`} theme={theme}>
            {listItems}
          </BulletList>
        );
        inList = false;
        listItems = [];
      }
      if (inNumberedList) {
        result.push(
          <NumberedList key={`nlist-${i}`} theme={theme}>
            {numberedListItems}
          </NumberedList>
        );
        inNumberedList = false;
        numberedListItems = [];
      }
      result.push(
        <Heading2 key={`h2-${i}`} theme={theme}>
          {processInlineFormatting(line.substring(3), theme)}
        </Heading2>
      );
      continue;
    }
    
    if (line.startsWith('### ')) {
      if (inList) {
        result.push(
          <BulletList key={`list-${i}`} theme={theme}>
            {listItems}
          </BulletList>
        );
        inList = false;
        listItems = [];
      }
      if (inNumberedList) {
        result.push(
          <NumberedList key={`nlist-${i}`} theme={theme}>
            {numberedListItems}
          </NumberedList>
        );
        inNumberedList = false;
        numberedListItems = [];
      }
      result.push(
        <Heading3 key={`h3-${i}`} theme={theme}>
          {processInlineFormatting(line.substring(4), theme)}
        </Heading3>
      );
      continue;
    }
    
    if (line.startsWith('#### ')) {
      if (inList) {
        result.push(
          <BulletList key={`list-${i}`} theme={theme}>
            {listItems}
          </BulletList>
        );
        inList = false;
        listItems = [];
      }
      if (inNumberedList) {
        result.push(
          <NumberedList key={`nlist-${i}`} theme={theme}>
            {numberedListItems}
          </NumberedList>
        );
        inNumberedList = false;
        numberedListItems = [];
      }
      result.push(
        <Heading4 key={`h4-${i}`} theme={theme}>
          {processInlineFormatting(line.substring(5), theme)}
        </Heading4>
      );
      continue;
    }
    
    if (line.startsWith('##### ')) {
      if (inList) {
        result.push(
          <BulletList key={`list-${i}`} theme={theme}>
            {listItems}
          </BulletList>
        );
        inList = false;
        listItems = [];
      }
      if (inNumberedList) {
        result.push(
          <NumberedList key={`nlist-${i}`} theme={theme}>
            {numberedListItems}
          </NumberedList>
        );
        inNumberedList = false;
        numberedListItems = [];
      }
      result.push(
        <Heading5 key={`h5-${i}`} theme={theme}>
          {processInlineFormatting(line.substring(6), theme)}
        </Heading5>
      );
      continue;
    }
    
    if (line.startsWith('###### ')) {
      if (inList) {
        result.push(
          <BulletList key={`list-${i}`} theme={theme}>
            {listItems}
          </BulletList>
        );
        inList = false;
        listItems = [];
      }
      if (inNumberedList) {
        result.push(
          <NumberedList key={`nlist-${i}`} theme={theme}>
            {numberedListItems}
          </NumberedList>
        );
        inNumberedList = false;
        numberedListItems = [];
      }
      result.push(
        <Heading6 key={`h6-${i}`} theme={theme}>
          {processInlineFormatting(line.substring(7), theme)}
        </Heading6>
      );
      continue;
    }
    
    // Horizontal rule
    if (line === '---' || line === '***' || line === '___') {
      if (inList) {
        result.push(
          <BulletList key={`list-${i}`} theme={theme}>
            {listItems}
          </BulletList>
        );
        inList = false;
        listItems = [];
      }
      if (inNumberedList) {
        result.push(
          <NumberedList key={`nlist-${i}`} theme={theme}>
            {numberedListItems}
          </NumberedList>
        );
        inNumberedList = false;
        numberedListItems = [];
      }
      result.push(<HorizontalRule key={`hr-${i}`} theme={theme} />);
      continue;
    }
    
    // Blockquote
    if (line.startsWith('> ')) {
      if (inList) {
        result.push(
          <BulletList key={`list-${i}`}>
            {listItems}
          </BulletList>
        );
        inList = false;
        listItems = [];
      }
      if (inNumberedList) {
        result.push(
          <NumberedList key={`nlist-${i}`} theme={theme}>
            {numberedListItems}
          </NumberedList>
        );
        inNumberedList = false;
        numberedListItems = [];
      }
      result.push(
        <Blockquote key={`quote-${i}`} theme={theme}>
          <Paragraph theme={theme}>
            {processInlineFormatting(line.substring(2), theme)}
          </Paragraph>
        </Blockquote>
      );
      continue;
    }
    
    // Bullet point
    if (line.startsWith('* ') || line.startsWith('- ')) {
      if (inNumberedList) {
        result.push(
          <NumberedList key={`nlist-${i}`} theme={theme}>
            {numberedListItems}
          </NumberedList>
        );
        inNumberedList = false;
        numberedListItems = [];
      }
      inList = true;
      const itemContent = line.substring(2);
      listItems.push(
        <li key={`item-${i}`}>{processInlineFormatting(itemContent, theme)}</li>
      );
      continue;
    }
    
    // Numbered list
    const numberedMatch = line.match(/^(\d+)\.\s/);
    if (numberedMatch) {
      if (inList) {
        result.push(
          <BulletList key={`list-${i}`} theme={theme}>
            {listItems}
          </BulletList>
        );
        inList = false;
        listItems = [];
      }
      inNumberedList = true;
      const itemContent = line.substring(numberedMatch[0].length);
      numberedListItems.push(
        <li key={`nitem-${i}`}>{processInlineFormatting(itemContent, theme)}</li>
      );
      continue;
    }
    
    // End of lists
    if ((inList || inNumberedList) && line === '') {
      if (inList) {
        result.push(
          <BulletList key={`list-${i}`} theme={theme}>
            {listItems}
          </BulletList>
        );
        inList = false;
        listItems = [];
      }
      if (inNumberedList) {
        result.push(
          <NumberedList key={`nlist-${i}`} theme={theme}>
            {numberedListItems}
          </NumberedList>
        );
        inNumberedList = false;
        numberedListItems = [];
      }
      continue;
    }
    
    // Regular text line
    if (!inList && !inNumberedList && line !== '') {
      result.push(
        <Paragraph key={`p-${i}`} theme={theme}>
          {processInlineFormatting(line, theme)}
        </Paragraph>
      );
    } else if (!inList && !inNumberedList) {
      // Empty line
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
  
  if (inNumberedList && numberedListItems.length > 0) {
    result.push(
      <NumberedList key="nlist-end" theme={theme}>
        {numberedListItems}
      </NumberedList>
    );
  }
  
  return <>{result}</>;
};

// Process inline formatting (bold, italic, links)
const processInlineFormatting = (text, theme = {}) => {
  const parts = [];
  let lastIndex = 0;
  let keyCounter = 0;
  
  // Handle links first
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  
  while ((match = linkPattern.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      const beforeText = text.substring(lastIndex, match.index);
      parts.push(<span key={`text-${keyCounter++}`}>{processBoldItalic(beforeText, theme)}</span>);
    }
    
    // Add the link
    parts.push(
      <Link key={`link-${keyCounter++}`} href={match[2]} target="_blank" rel="noopener noreferrer" theme={theme}>
        {processBoldItalic(match[1], theme)}
      </Link>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add any remaining text
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    parts.push(<span key={`text-${keyCounter++}`}>{processBoldItalic(remainingText, theme)}</span>);
  }
  
  return parts.length > 0 ? <>{parts}</> : processBoldItalic(text, theme);
};

// Process bold and italic formatting
const processBoldItalic = (text, theme = {}) => {
  // First handle bold text
  const boldPattern = /\*\*(.*?)\*\*/g;
  const parts = [];
  let lastIndex = 0;
  let keyCounter = 0;
  let match;
  
  while ((match = boldPattern.exec(text)) !== null) {
    // Add text before the bold part
    if (match.index > lastIndex) {
      parts.push(<span key={`text-${keyCounter++}`}>{processItalic(text.substring(lastIndex, match.index), theme)}</span>);
    }
    
    // Add the bold text (also process any italic within it)
    parts.push(<Bold key={`bold-${keyCounter++}`} theme={theme}>{processItalic(match[1], theme)}</Bold>);
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add any remaining text
  if (lastIndex < text.length) {
    parts.push(<span key={`text-${keyCounter++}`}>{processItalic(text.substring(lastIndex), theme)}</span>);
  }
  
  return parts.length > 0 ? <>{parts}</> : processItalic(text, theme);
};

// Process italic text
const processItalic = (text, theme = {}) => {
  if (!text) return null;
  
  const italicPattern = /\*((?!\*).+?)\*/g;
  const parts = [];
  let lastIndex = 0;
  let keyCounter = 0;
  let match;
  
  while ((match = italicPattern.exec(text)) !== null) {
    // Add text before the italic part
    if (match.index > lastIndex) {
      parts.push(<span key={`text-${keyCounter++}`}>{text.substring(lastIndex, match.index)}</span>);
    }
    
    // Add the italic text
    parts.push(<Italic key={`italic-${keyCounter++}`} theme={theme}>{match[1]}</Italic>);
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add any remaining text
  if (lastIndex < text.length) {
    parts.push(<span key={`text-${keyCounter++}`}>{text.substring(lastIndex)}</span>);
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
  flex-direction: ${props => props.$alignment === 'right' ? 'column' : 'row'};
  margin-bottom: ${props => {
    // Apply message spacing settings
    const spacing = props.theme.messageSpacing || 'comfortable';
    switch (spacing) {
      case 'compact': return '16px';
      case 'spacious': return '32px';
      default: return '24px'; // comfortable
    }
  }};
  align-items: ${props => props.$alignment === 'right' ? 'flex-end' : 'flex-start'};
  max-width: 100%;
  width: 100%;
  justify-content: ${props => props.$alignment === 'right' ? 'flex-end' : 'flex-start'};
  padding: 0;
  padding-right: ${props => props.$alignment === 'right' ? '20px' : '0'};
`;

const Avatar = styled.div`
  width: ${props => props.role === 'user' ? '24px' : '36px'};
  height: ${props => props.role === 'user' ? '24px' : '36px'};
  border-radius: ${props => props.$useModelIcon ? '0' : '50%'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: ${props => props.role === 'user' ? '0' : '14px'};
  margin-left: ${props => props.role === 'user' ? '0' : '20px'};
  margin-top: ${props => props.role === 'user' ? '8px' : '0'};
  font-weight: 600;
  flex-shrink: 0;
  background: ${props => props.$useModelIcon 
    ? 'transparent' 
    : (props.role === 'user' 
        ? props.theme.buttonGradient 
        : props.theme.secondary)};
  color: ${props => props.role === 'user' ? props.theme.text : 'white'};
  transition: all 0.2s ease;
  box-shadow: ${props => props.role === 'user' ? 'none' : '0 2px 8px rgba(0, 0, 0, 0.1)'};
  order: ${props => props.role === 'user' ? '2' : '1'};
  opacity: ${props => props.role === 'user' ? '0.6' : '1'};
  
  &:hover {
    transform: ${props => props.role === 'user' ? 'none' : 'scale(1.05)'};
    box-shadow: ${props => props.role === 'user' ? 'none' : '0 3px 10px rgba(0, 0, 0, 0.15)'};
    opacity: ${props => props.role === 'user' ? '0.8' : '1'};
  }
  
  svg {
    width: ${props => props.role === 'user' ? '16px' : '20px'};
    height: ${props => props.role === 'user' ? '16px' : '20px'};
  }
`;

const MessageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  max-width: ${props => props.role === 'user' ? '70%' : 'calc(100% - 60px)'};
  flex: ${props => props.role === 'user' ? '0 1 auto' : '1'};
  order: ${props => props.role === 'user' ? '1' : '2'};
  align-items: ${props => props.role === 'user' ? 'flex-end' : 'flex-start'};
  
  @media (max-width: 768px) {
    max-width: ${props => props.role === 'user' ? '85%' : 'calc(100% - 60px)'};
  }
`;

const Content = styled.div`
  padding: ${props => props.role === 'user' ? '15px 18px' : '0'};
  padding-right: ${props => props.role === 'user' ? '18px' : '40px'};
  border-radius: ${props => props.role === 'user' ? '20px 20px 4px 20px' : '0'};
  width: fit-content;
  white-space: pre-wrap;
  background: ${props => {
    // User messages have background, AI messages are transparent
    if (props.role === 'user') {
      // For dark/oled themes, use darker backgrounds
      if (props.theme.name === 'dark' || props.theme.name === 'oled') {
        return 'rgba(40, 40, 45, 0.95)';
      }
      return props.theme.messageUser;
    } else {
      // AI messages have no background
      return 'transparent';
    }
  }};
  color: ${props => props.theme.text};
  box-shadow: ${props => {
    // Only user messages have shadow
    if (props.role === 'user') {
      return `0 2px 10px ${props.theme.shadow}`;
    }
    return 'none';
  }};
  line-height: var(--line-height, 1.6);
  overflow: hidden;
  flex: 1;
  backdrop-filter: ${props => props.role === 'user' ? 'blur(5px)' : 'none'};
  -webkit-backdrop-filter: ${props => props.role === 'user' ? 'blur(5px)' : 'none'};
  border: ${props => props.role === 'user' ? `1px solid ${props.theme.border}` : 'none'};
  margin-left: ${props => props.role === 'user' ? 'auto' : '0'};
  margin-right: ${props => props.role === 'user' ? '0' : '0'};
  position: relative;
  
  /* Bubble pointer for user messages */
  ${props => props.role === 'user' && `
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      right: -8px;
      width: 0;
      height: 0;
      border-left: 8px solid ${props.theme.name === 'dark' || props.theme.name === 'oled' 
        ? 'rgba(40, 40, 45, 0.95)' 
        : props.theme.messageUser};
      border-top: 8px solid transparent;
      border-bottom: 8px solid transparent;
    }
  `}
  
  /* Special border for bisexual theme */
  ${props => props.theme.name === 'bisexual' && props.role === 'user' && `
    border: none;
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: -1px;
      left: -1px;
      right: -1px;
      bottom: -1px;
      background: linear-gradient(145deg, #D60270, #9B4F96);
      border-radius: 19px;
      z-index: -1;
      opacity: 0.3;
    }
    
    &::after {
      border-left-color: #D60270;
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
    padding: ${props => props.role === 'user' ? '12px 14px' : '0'};
    padding-right: ${props => props.role === 'user' ? '14px' : '20px'};
    margin-right: ${props => props.role === 'user' ? '0' : '0'};
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
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 0;
  opacity: 1;
  width: fit-content;
  max-width: 100%;
  align-self: flex-start;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  font-size: 0.8rem;
  color: ${props => props.theme.text}60;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  border-radius: 8px;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.theme.text}10;
    color: ${props => props.theme.text}90;
  }
  
  svg {
    width: 16px;
    height: 16px;
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

// Add style components for markdown formatting aligned with design language
const Bold = styled.span`
  font-weight: 700;
  color: ${props => props.theme.text};
`;

const Italic = styled.span`
  font-style: italic;
  color: ${props => props.theme.text};
`;

const Heading1 = styled.h1`
  font-size: 1.8rem;
  font-weight: 700;
  margin: 1.5rem 0 1rem 0;
  color: ${props => props.theme.text};
  border-bottom: 2px solid ${props => props.theme.border};
  padding-bottom: 0.5rem;
  line-height: 1.3;
  
  &:first-child {
    margin-top: 0;
  }
`;

const Heading2 = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 1.3rem 0 0.8rem 0;
  color: ${props => props.theme.text};
  border-bottom: 1px solid ${props => props.theme.border};
  padding-bottom: 0.4rem;
  line-height: 1.3;
  
  &:first-child {
    margin-top: 0;
  }
`;

const Heading3 = styled.h3`
  font-size: 1.3rem;
  font-weight: 600;
  margin: 1.1rem 0 0.6rem 0;
  color: ${props => props.theme.text};
  line-height: 1.3;
  
  &:first-child {
    margin-top: 0;
  }
`;

const Heading4 = styled.h4`
  font-size: 1.1rem;
  font-weight: 600;
  margin: 1rem 0 0.5rem 0;
  color: ${props => props.theme.text};
  line-height: 1.3;
  
  &:first-child {
    margin-top: 0;
  }
`;

const Heading5 = styled.h5`
  font-size: 1rem;
  font-weight: 600;
  margin: 0.9rem 0 0.4rem 0;
  color: ${props => props.theme.text};
  line-height: 1.3;
  
  &:first-child {
    margin-top: 0;
  }
`;

const Heading6 = styled.h6`
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0.8rem 0 0.3rem 0;
  color: ${props => props.theme.text};
  line-height: 1.3;
  
  &:first-child {
    margin-top: 0;
  }
`;

const Paragraph = styled.p`
  margin: 0.8rem 0;
  line-height: 1.6;
  color: ${props => props.theme.text};
  
  &:first-child {
    margin-top: 0;
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const BulletList = styled.ul`
  list-style-type: none;
  padding-left: 0;
  margin: 0.8rem 0;
  
  li {
    position: relative;
    padding-left: 1.5em;
    margin: 0.5em 0;
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
`;

const NumberedList = styled.ol`
  padding-left: 1.5em;
  margin: 0.8rem 0;
  
  li {
    margin: 0.5em 0;
    line-height: 1.6;
    color: ${props => props.theme.text};
  }
`;

const Blockquote = styled.blockquote`
  border-left: 4px solid ${props => props.theme.primary};
  margin: 1rem 0;
  padding: 0.8rem 0 0.8rem 1.2rem;
  background: ${props => props.theme.name === 'light' ? 'rgba(0, 122, 255, 0.05)' : 'rgba(10, 132, 255, 0.1)'};
  border-radius: 0 8px 8px 0;
  font-style: italic;
  color: ${props => props.theme.text};
  
  p {
    margin: 0;
    line-height: 1.6;
  }
`;

const Link = styled.a`
  color: ${props => props.theme.primary};
  text-decoration: none;
  border-bottom: 1px solid transparent;
  transition: border-bottom-color 0.2s ease;
  
  &:hover {
    border-bottom-color: ${props => props.theme.primary};
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  overflow: hidden;
  background: ${props => props.theme.name === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(30, 30, 30, 0.8)'};
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
`;

const TableHeader = styled.th`
  background: ${props => props.theme.name === 'light' ? 'rgba(240, 240, 240, 0.8)' : 'rgba(45, 45, 45, 0.8)'};
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: ${props => props.theme.text};
  border-bottom: 1px solid ${props => props.theme.border};
`;

const TableCell = styled.td`
  padding: 12px;
  border-bottom: 1px solid ${props => props.theme.border};
  color: ${props => props.theme.text};
  
  &:last-child {
    border-bottom: none;
  }
`;

const TableRow = styled.tr`
  &:last-child td {
    border-bottom: none;
  }
  
  &:hover {
    background: ${props => props.theme.name === 'light' ? 'rgba(0, 122, 255, 0.05)' : 'rgba(10, 132, 255, 0.1)'};
  }
`;

const HorizontalRule = styled.hr`
  border: none;
  height: 1px;
  background: ${props => props.theme.border};
  margin: 2rem 0;
  border-radius: 1px;
`;

const MessageImage = styled.img`
  max-width: 100%;
  max-height: 300px;
  border-radius: 12px;
  margin-bottom: 12px;
  object-fit: contain;
  background: ${props => props.theme.name === 'light' ? 'rgba(246, 248, 250, 0.8)' : 'rgba(30, 30, 30, 0.8)'};
`;

// Flowchart components
const FlowchartContainer = styled.div`
  margin: 12px 0;
  padding: 16px;
  background: ${props => props.theme.name === 'light' ? 'rgba(246, 248, 250, 0.8)' : 'rgba(30, 30, 30, 0.8)'};
  border-radius: 12px;
  border: 1px solid ${props => props.theme.border};
`;

const FlowchartButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: ${props => props.theme.primary};
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 8px;
  
  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  
  svg {
    flex-shrink: 0;
  }
`;

const FlowchartPreview = styled.div`
  margin-top: 8px;
  padding: 8px;
  background: ${props => props.theme.name === 'light' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(45, 45, 45, 0.5)'};
  border-radius: 6px;
  border: 1px dashed ${props => props.theme.border};
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

const ToolActivitySection = styled.div`
  margin-bottom: 15px;
`;

const ToolActivitySectionHeader = styled.div`
  font-size: 0.9em;
  font-weight: 600;
  color: ${props => props.theme.text}dd;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ToolActivityItemHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
`;

const ToolActivityItem = styled.div`
  background: ${props => props.theme.name === 'light' ? 'rgba(248, 249, 250, 0.8)' : 'rgba(32, 33, 36, 0.8)'};
  border: 1px solid ${props => props.theme.border || '#e1e5e9'};
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 8px;
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ToolActivityIcon = styled.span`
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
`;

const ToolActivityName = styled.span`
  font-weight: 500;
  color: ${props => props.theme.text};
  flex: 1;
`;

const pulseAnimation = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
`;

const ToolActivityStatus = styled.span`
  font-size: 0.75em;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  
  ${props => {
    switch (props.status) {
      case 'pending':
        return `
          background: rgba(251, 191, 36, 0.2);
          color: #f59e0b;
          border: 1px solid rgba(251, 191, 36, 0.3);
        `;
      case 'executing':
        return `
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.3);
          animation: ${pulseAnimation} 2s infinite;
        `;
      case 'completed':
        return `
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        `;
      case 'error':
        return `
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        `;
      default:
        return `
          background: rgba(107, 114, 128, 0.2);
          color: #6b7280;
          border: 1px solid rgba(107, 114, 128, 0.3);
        `;
    }
  }}
`;

const ToolActivityDetail = styled.div`
  margin-top: 8px;
`;

const ToolActivityLabel = styled.div`
  font-size: 0.8em;
  font-weight: 500;
  color: ${props => props.theme.text}aa;
  margin-bottom: 4px;
`;

const ToolActivityValue = styled.div`
  font-size: 0.8em;
  background: ${props => props.theme.name === 'light' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(20, 21, 24, 0.7)'};
  border: 1px solid ${props => props.theme.border}50;
  border-radius: 4px;
  padding: 6px 8px;
  font-family: 'SF Mono', SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 80px;
  overflow-y: auto;
  color: ${props => props.theme.text}dd;
  
  &::-webkit-scrollbar {
    width: 3px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.border};
    border-radius: 2px;
  }
`;

const ToolActivityError = styled.div`
  font-size: 0.8em;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 4px;
  padding: 6px 8px;
  color: #ef4444;
  font-family: 'SF Mono', SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
  white-space: pre-wrap;
  word-break: break-word;
`;

const ThinkingSection = styled.div`
  ${props => props.hasToolActivity ? 'border-top: 1px solid ' + (props.theme.border || '#e1e5e9') + '30; padding-top: 15px; margin-top: 5px;' : ''}
`;

const ThinkingSectionHeader = styled.div`
  font-size: 0.9em;
  font-weight: 600;
  color: ${props => props.theme.text}dd;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ThinkingDropdown = ({ thinkingContent, toolCalls }) => {
  const [expanded, setExpanded] = useState(false);
  
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  const hasThinking = thinkingContent && thinkingContent.toString().trim();
  const hasToolActivity = toolCalls && toolCalls.length > 0;
  
  if (!hasThinking && !hasToolActivity) {
    return null;
  }
  
  const getHeaderTitle = () => {
    if (hasThinking && hasToolActivity) return 'Thoughts & Tools';
    if (hasThinking) return 'Thoughts';
    return 'Tool Activity';
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'executing': return '⚙️';
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return '🔧';
    }
  };
  
  return (
    <ThinkingDropdownContainer>
      <ThinkingHeader onClick={toggleExpanded}>
        <span>{getHeaderTitle()}</span>
        <ThinkingArrow expanded={expanded}>▾</ThinkingArrow>
      </ThinkingHeader>
      <ThinkingContent expanded={expanded}>
        {hasToolActivity && (
          <ToolActivitySection>
            <ToolActivitySectionHeader>🛠️ Tool Activity</ToolActivitySectionHeader>
            {toolCalls.map((toolCall, index) => (
              <ToolActivityItem key={toolCall.tool_id || index}>
                <ToolActivityItemHeader>
                  <ToolActivityIcon>
                    {getStatusIcon(toolCall.status)}
                  </ToolActivityIcon>
                  <ToolActivityName>
                    {toolCall.tool_name || 'Unknown Tool'}
                  </ToolActivityName>
                  <ToolActivityStatus status={toolCall.status}>
                    {toolCall.status || 'pending'}
                  </ToolActivityStatus>
                </ToolActivityItemHeader>
                
                {toolCall.parameters && Object.keys(toolCall.parameters).length > 0 && (
                  <ToolActivityDetail>
                    <ToolActivityLabel>Parameters:</ToolActivityLabel>
                    <ToolActivityValue>
                      {JSON.stringify(toolCall.parameters, null, 2)}
                    </ToolActivityValue>
                  </ToolActivityDetail>
                )}
                
                {toolCall.result && toolCall.status === 'completed' && (
                  <ToolActivityDetail>
                    <ToolActivityLabel>Result:</ToolActivityLabel>
                    <ToolActivityValue>
                      {typeof toolCall.result === 'string' ? toolCall.result : JSON.stringify(toolCall.result, null, 2)}
                    </ToolActivityValue>
                  </ToolActivityDetail>
                )}
                
                {toolCall.error && toolCall.status === 'error' && (
                  <ToolActivityDetail>
                    <ToolActivityLabel>Error:</ToolActivityLabel>
                    <ToolActivityError>
                      {toolCall.error}
                    </ToolActivityError>
                  </ToolActivityDetail>
                )}
              </ToolActivityItem>
            ))}
          </ToolActivitySection>
        )}
        
        {hasThinking && (
          <ThinkingSection hasToolActivity={hasToolActivity}>
            {hasToolActivity && <ThinkingSectionHeader>💭 Reasoning</ThinkingSectionHeader>}
            {thinkingContent}
          </ThinkingSection>
        )}
      </ThinkingContent>
    </ThinkingDropdownContainer>
  );
};

const ChatMessage = ({ message, showModelIcons = true, settings = {}, theme = {} }) => {
  const { role, content, timestamp, isError, isLoading, modelId, image, file, sources, type, status, imageUrl, prompt: imagePrompt, flowchartData, id, toolCalls, availableTools } = message;
  const { supportedLanguages, isLanguageExecutable } = useSupportedLanguages();
  
  // Debug logging
  if (role === 'assistant' && sources) {
    console.log('[ChatMessage] Message has sources:', sources);
  }
  
  // Get the prompt for both image and flowchart messages
  const prompt = message.prompt;
  
  // Extract sources from content if this is an assistant message and not loading
  const { cleanedContent, sources: extractedSources } = useMemo(() => {
    if (role === 'assistant' && content && !isLoading) {
      const result = extractSourcesFromResponse(content);
      console.log('[ChatMessage] Extracted sources from content:', result);
      return result;
    }
    return { cleanedContent: content, sources: [] };
  }, [content, role, isLoading]);
  
  // Use cleaned content if available, otherwise use original content
  const contentToProcess = cleanedContent || content;
  
  const is3DScene = useMemo(() => {
    if (role !== 'assistant' || isLoading || !content) return false;
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch) return false;
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      return Array.isArray(parsed) && parsed.every(obj => 
        obj.id && obj.type && obj.position && obj.rotation && obj.scale
      );
    } catch (e) {
      return false;
    }
  }, [content, role, isLoading]);
  
  const getAvatar = () => {
    if (role === 'user') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      );
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

  // Get message alignment from settings, but default user messages to right
  const messageAlignment = role === 'user' ? 'right' : (settings.messageAlignment || 'left');

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
    const textToCopy = cleanedContent || content;
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        // Could add toast notification here if desired
        console.log('Text copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

  // TTS state for toggle
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechSynthesisRef = useRef(null);

  // Function to handle text-to-speech (toggle)
  const handleReadAloud = () => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      const textToRead = cleanedContent || content;
      const utterance = new window.SpeechSynthesisUtterance(textToRead);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
      speechSynthesisRef.current = utterance;
    } else {
      console.error('Text-to-speech not supported in this browser');
    }
  };

  // Ensure TTS state resets if user navigates away or message changes
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsSpeaking(false);
    };
  }, [content, cleanedContent]);

  // Determine if the message has sources to display
  const displaySources = extractedSources.length > 0 ? extractedSources : (Array.isArray(sources) ? sources : []);
  const hasSources = role === 'assistant' && displaySources.length > 0;
  
  console.log('[ChatMessage] Display sources:', {
    extractedSources,
    propsSources: sources,
    displaySources,
    hasSources,
    isLoading,
    role
  });

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

  // Handle generated flowchart message type
  if (type === 'generated-flowchart') {
    let generatedFlowchartContent;
    if (status === 'loading') {
      generatedFlowchartContent = (
        <ThinkingContainer>
          <SpinnerIcon />
          Creating flowchart for: "{prompt || 'your request'}"...
        </ThinkingContainer>
      );
    } else if (status === 'completed' && flowchartData) {
      generatedFlowchartContent = (
        <>
          {prompt && (
            <p style={{ margin: '0 0 8px 0', opacity: 0.85, fontSize: '0.9em' }}>
              Request: "{prompt}"
            </p>
          )}
          <FlowchartContainer>
            <FlowchartButton onClick={() => window.dispatchEvent(new CustomEvent('openFlowchartModal', { detail: { flowchartData } }))}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="18" r="3"></circle>
                <circle cx="6" cy="6" r="3"></circle>
                <circle cx="18" cy="6" r="3"></circle>
                <path d="M18 9v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9"></path>
                <path d="M12 12v3"></path>
              </svg>
              Open Flowchart Builder
            </FlowchartButton>
            <FlowchartPreview>
              <p style={{ fontSize: '0.9em', opacity: 0.7 }}>
                Flowchart instructions generated. Click "Open Flowchart Builder" to visualize and edit.
              </p>
            </FlowchartPreview>
          </FlowchartContainer>
        </>
      );
    } else if (status === 'error') {
      generatedFlowchartContent = (
        <div>
          <p style={{ fontWeight: 'bold', color: '#dc3545', marginBottom: '4px' }}>
            Flowchart Generation Failed
          </p>
          {prompt && <p style={{ margin: '4px 0', opacity: 0.85 }}>Request: "{prompt}"</p>}
          {content && <p style={{ margin: '4px 0', opacity: 0.85 }}>Error: {content}</p>}
        </div>
      );
    }

    return (
      <Message $alignment={messageAlignment}>
        {role !== 'user' && <Avatar role={role} $useModelIcon={useModelIcon}>{getAvatar()}</Avatar>}
        <MessageWrapper role={role}>
          <Content role={role} $bubbleStyle={bubbleStyle}>
            {generatedFlowchartContent}
            {timestamp && settings.showTimestamps && (status === 'completed' || status === 'error') && (
              <MessageActions role={role}>
                <Timestamp>{formatTimestamp(timestamp)}</Timestamp>
                {status === 'completed' && flowchartData && (
                  <>
                    <div style={{ flexGrow: 1 }}></div>
                    <ActionButton onClick={() => navigator.clipboard.writeText(flowchartData).then(() => console.log('Flowchart data copied'))}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      Copy Instructions
                    </ActionButton>
                  </>
                )}
              </MessageActions>
            )}
          </Content>
        </MessageWrapper>
      </Message>
    );
  }

  // Handle deep research message type
  if (type === 'deep-research') {
    let deepResearchContent;
    if (status === 'loading') {
      deepResearchContent = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SpinnerIcon />
            <span>Performing deep research...</span>
          </div>
          <div style={{ fontSize: '0.9em', opacity: 0.7 }}>
            Query: "{content || 'your query'}"
          </div>
          {message.progress !== undefined && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85em', opacity: 0.8 }}>
                  {message.statusMessage || 'Initializing...'}
                </span>
                <span style={{ fontSize: '0.8em', opacity: 0.6 }}>
                  {message.progress}%
                </span>
              </div>
              <div style={{ 
                width: '100%', 
                height: '4px', 
                backgroundColor: theme.border || '#e0e0e0',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${message.progress || 0}%`,
                  height: '100%',
                  backgroundColor: theme.primary || '#007bff',
                  transition: 'width 0.3s ease',
                  borderRadius: '2px'
                }} />
              </div>
            </div>
          )}
        </div>
      );
    } else if (status === 'completed' && content) {
      deepResearchContent = (
        <>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"></path>
              </svg>
              Deep Research Results
            </div>
            {message.subQuestions && message.subQuestions.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '0.9em', fontWeight: '500', marginBottom: '6px', opacity: 0.8 }}>
                  Research Questions ({message.subQuestions.length}):
                </div>
                <ul style={{ 
                  margin: '0', 
                  paddingLeft: '20px', 
                  fontSize: '0.85em', 
                  opacity: 0.7,
                  lineHeight: '1.4'
                }}>
                  {message.subQuestions.map((question, index) => (
                    <li key={index} style={{ marginBottom: '4px' }}>{question}</li>
                  ))}
                </ul>
              </div>
            )}
            {message.agentResults && message.agentResults.length > 0 && (
              <div style={{ fontSize: '0.85em', opacity: 0.7, marginBottom: '12px' }}>
                Analyzed by {message.agentResults.length} research agents
              </div>
            )}
          </div>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
            {robustFormatContent(contentToProcess, isLanguageExecutable, supportedLanguages, theme)}
          </div>
        </>
      );
    } else if (status === 'error') {
      deepResearchContent = (
        <div>
          <p style={{ fontWeight: 'bold', color: '#dc3545', marginBottom: '4px' }}>
            Deep Research Failed
          </p>
          <p style={{ margin: '4px 0', opacity: 0.85 }}>Query: "{content || 'your query'}"</p>
          {message.content && <p style={{ margin: '4px 0', opacity: 0.85 }}>Error: {message.content}</p>}
        </div>
      );
    }

    return (
      <Message $alignment={messageAlignment}>
        {role !== 'user' && <Avatar role={role} $useModelIcon={useModelIcon}>{getAvatar()}</Avatar>}
        <MessageWrapper role={role}>
          <Content role={role} $bubbleStyle={bubbleStyle}>
            {deepResearchContent}
            {/* Show sources if available */}
            {hasSources && status === 'completed' && (
              <SourcesContainer>
                {displaySources.map((source, index) => (
                  <SourceButton
                    key={index}
                    onClick={() => window.open(source.url, '_blank')}
                    title={source.title}
                  >
                    <SourceFavicon 
                      src={getFaviconUrl(source.url)}
                      alt=""
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <span style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {source.title || extractDomain(source.url)}
                    </span>
                  </SourceButton>
                ))}
              </SourcesContainer>
            )}
            {timestamp && settings.showTimestamps && (status === 'completed' || status === 'error') && (
              <MessageActions role={role}>
                <Timestamp>{formatTimestamp(timestamp)}</Timestamp>
                {status === 'completed' && content && (
                  <>
                    <div style={{ flexGrow: 1 }}></div>
                    <ActionButton onClick={() => navigator.clipboard.writeText(content).then(() => console.log('Research results copied'))}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      Copy Results
                    </ActionButton>
                  </>
                )}
              </MessageActions>
            )}
          </Content>
          </MessageWrapper>
      </Message>
    );
  }

  // Handle generated image message type
  if (type === 'generated-image') {
    let generatedImageContent;
    if (status === 'loading') {
      generatedImageContent = (
        <ThinkingContainer>
          <SpinnerIcon />
          Generating image for: "{imagePrompt || 'your prompt'}"...
        </ThinkingContainer>
      );
    } else if (status === 'completed' && imageUrl) {
      generatedImageContent = (
        <>
          {imagePrompt && (
            <p style={{ margin: '0 0 8px 0', opacity: 0.85, fontSize: '0.9em' }}>
              Prompt: "{imagePrompt}"
            </p>
          )}
          <MessageImage src={imageUrl} alt={imagePrompt || 'Generated AI image'} style={{ maxHeight: '400px' }} />
        </>
      );
    } else if (status === 'error') {
      generatedImageContent = (
        <div>
          <p style={{ fontWeight: 'bold', color: '#dc3545', marginBottom: '4px' }}>
            Image Generation Failed
          </p>
          {imagePrompt && <p style={{ margin: '4px 0', opacity: 0.85 }}>Prompt: "{imagePrompt}"</p>}
          {content && <p style={{ margin: '4px 0', opacity: 0.85 }}>Error: {content}</p>}
        </div>
      );
    }

    return (
      <Message $alignment={messageAlignment}>
        {role !== 'user' && <Avatar role={role} $useModelIcon={useModelIcon}>{getAvatar()}</Avatar>}
        <MessageWrapper role={role}>
          <Content role={role} $bubbleStyle={bubbleStyle} className={highContrast ? 'high-contrast' : ''}>
            {generatedImageContent}
            {timestamp && settings.showTimestamps && (status === 'completed' || status === 'error') && (
              <MessageActions role={role}>
                <Timestamp>{formatTimestamp(timestamp)}</Timestamp>
                {status === 'completed' && imageUrl && (
                  <>
                    <div style={{ flexGrow: 1 }}></div>
                    <ActionButton onClick={() => navigator.clipboard.writeText(imageUrl).then(() => console.log('Image URL copied'))}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      Copy URL
                    </ActionButton>
                  </>
                )}
              </MessageActions>
            )}
          </Content>
          </MessageWrapper>
      </Message>
    );
  }

  return (
    <Message $alignment={messageAlignment}>
      {messageAlignment !== 'right' && <Avatar role={role} $useModelIcon={useModelIcon}>{getAvatar()}</Avatar>}
      {isError ? (
        <ErrorMessage role={role} $bubbleStyle={bubbleStyle}>
          {content}
          {timestamp && settings.showTimestamps && <Timestamp>{formatTimestamp(timestamp)}</Timestamp>}
        </ErrorMessage>
      ) : (
        <MessageWrapper role={role}>
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
            {(() => {
              // If loading and no content yet, show thinking indicator
              if (isLoading && !content) {
                return (
                  <ThinkingContainer>
                    <SpinnerIcon />
                    Thinking
                  </ThinkingContainer>
                );
              }
              
              // Process content and show main content + thinking dropdown if applicable
              const processedContent = robustFormatContent(contentToProcess, isLanguageExecutable, supportedLanguages, theme);
              const isMercury = modelId?.toLowerCase().includes('mercury');
              
              if (typeof processedContent === 'object' && processedContent.main && processedContent.thinking) {
                // If content has thinking tags, show thinking dropdown first, then main content
                return (
                  <>
                    <ThinkingDropdown thinkingContent={processedContent.thinking} toolCalls={toolCalls} />
                    <StreamingMarkdownRenderer 
                      text={typeof processedContent.main === 'string' ? processedContent.main : contentToProcess}
                      isStreaming={isLoading}
                      theme={theme}
                    />
                  </>
                );
              }
              // If content has no thinking tags, but may have tool activity
              const hasToolActivity = toolCalls && toolCalls.length > 0;
              return (
                <>
                  {hasToolActivity && (
                    <ThinkingDropdown thinkingContent={null} toolCalls={toolCalls} />
                  )}
                  <StreamingMarkdownRenderer 
                    text={contentToProcess}
                    isStreaming={isLoading}
                    theme={theme}
                  />
                </>
              );
            })()}
          </Content>
          
          
          {/* Sources section */}
          {hasSources && !isLoading && (
            <SourcesContainer>
              {displaySources.map((source, index) => (
                <SourceButton key={`source-${index}`} onClick={() => window.open(source.url, '_blank')}>
                  <SourceFavicon src={getFaviconUrl(source.url)} alt="" onError={(e) => e.target.src='https://www.google.com/s2/favicons?domain=' + source.url} />
                  {source.domain || extractDomain(source.url)}
                </SourceButton>
              ))}
            </SourcesContainer>
          )}
          
          {/* Message action buttons - only show for completed AI messages (not loading) */}
          {!isLoading && contentToProcess && role === 'assistant' && (
            <MessageActions role={role}>
              {timestamp && settings.showTimestamps && <Timestamp>{formatTimestamp(timestamp)}</Timestamp>}
              <div style={{ flexGrow: 1 }}></div>
              {role === 'assistant' && (
                <ActionButton onClick={() => window.location.reload()}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <polyline points="1 20 1 14 7 14"></polyline>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                  </svg>
                </ActionButton>
              )}
              <ActionButton onClick={handleCopyText}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </ActionButton>
              <ActionButton onClick={() => {
                // Share functionality
                if (navigator.share) {
                  navigator.share({
                    title: 'AI Chat Message',
                    text: contentToProcess
                  });
                }
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
              </ActionButton>
              {role === 'assistant' && (
                <>
                  <ActionButton onClick={() => console.log('Thumbs up')}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                    </svg>
                  </ActionButton>
                  <ActionButton onClick={() => console.log('Thumbs down')}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path>
                    </svg>
                  </ActionButton>
                </>
              )}
              <ActionButton onClick={handleReadAloud} title={isSpeaking ? 'Stop speaking' : 'Read aloud'}>
                {isSpeaking ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="6" y="6" width="12" height="12" rx="2"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                  </svg>
                )}
              </ActionButton>
              <ActionButton onClick={() => console.log('More options')}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="1"></circle>
                  <circle cx="19" cy="12" r="1"></circle>
                  <circle cx="5" cy="12" r="1"></circle>
                </svg>
              </ActionButton>
              {is3DScene && (
                <ActionButton onClick={() => {
                  const jsonMatch = contentToProcess.match(/```json\n([\s\S]*?)\n```/);
                  if (jsonMatch) {
                    try {
                      const parsed = JSON.parse(jsonMatch[1]);
                      if (Array.isArray(parsed)) {
                        window.dispatchEvent(new CustomEvent('load3DScene', { detail: { objects: parsed } }));
                      }
                    } catch (e) {
                      console.error('Failed to parse 3D scene JSON', e);
                    }
                  }
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
                  </svg>
                  Load in 3D
                </ActionButton>
              )}
            </MessageActions>
          )}
        </MessageWrapper>
      )}
    </Message>
  );
};

export default ChatMessage;