import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import ModelIcon from './ModelIcon';
import TextDiffusionAnimation from './TextDiffusionAnimation';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import StreamingMarkdownRenderer from './StreamingMarkdownRenderer';
import { extractSourcesFromResponse } from '../utils/sourceExtractor';
import { openExternalUrl } from '../utils/urlSecurity';
import { processCodeBlocks } from '../utils/codeBlockProcessor';
import CodeBlockWithExecution from './CodeBlockWithExecution';
import useSupportedLanguages from '../hooks/useSupportedLanguages';
import ReactKatex from '@pkasila/react-katex';
import 'katex/dist/katex.min.css';
import { useTranslation } from '../contexts/TranslationContext';
import { downloadGeneratedVideo } from '../services/videoService';
import kokoroTTSService from '../services/kokoroTTSService';

// Helper function to parse and render LaTeX
const renderLatex = (latex, displayMode, keyPrefix = 'latex') => (
  <ReactKatex
    key={`${keyPrefix}-${latex.length}-${displayMode}`}
    displayMode={displayMode}
    throwOnError={false}
    strict={false}
  >
    {latex}
  </ReactKatex>
);

const extractThinkingFromContent = (content = '') => {
  if (!content) {
    return { mainContent: '', thinkingContent: null };
  }

  const thinkingRegex = /<think>([\s\S]*?)<\/think>/gi;
  const matches = [...content.matchAll(thinkingRegex)];

  if (matches.length === 0) {
    return { mainContent: content, thinkingContent: null };
  }

  const thinkingContent = matches
    .map((match) => match[1]?.trim())
    .filter(Boolean)
    .join('\n\n');

  return {
    mainContent: content.replace(thinkingRegex, '').trim(),
    thinkingContent: thinkingContent || null
  };
};

// Format markdown text including bold, italic, bullet points and code blocks
const robustFormatContent = (content, isLanguageExecutable = null, supportedLanguages = [], theme = {}) => {
  if (!content) return '';

  const { mainContent, thinkingContent } = extractThinkingFromContent(content);

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

  const pushInlineSegments = (segment) => {
    let inlineLastIndex = 0;
    let inlineMatch;

    while ((inlineMatch = inlineRegex.exec(segment)) !== null) {
      if (inlineMatch.index > inlineLastIndex) {
        parts.push(
          <span key={`text-${keyCounter++}`}>
            {processMarkdownText(segment.substring(inlineLastIndex, inlineMatch.index), theme)}
          </span>
        );
      }

      parts.push(renderLatex(inlineMatch[1], false, `inline-${keyCounter++}`));
      inlineLastIndex = inlineMatch.index + inlineMatch[0].length;
    }

    if (inlineLastIndex < segment.length) {
      parts.push(
        <span key={`text-${keyCounter++}`}>
          {processMarkdownText(segment.substring(inlineLastIndex), theme)}
        </span>
      );
    }

    inlineRegex.lastIndex = 0;
  };

  let match;
  while ((match = displayRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      pushInlineSegments(text.substring(lastIndex, match.index));
    }

    parts.push(renderLatex(match[1], true, `display-${keyCounter++}`));
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    pushInlineSegments(text.substring(lastIndex));
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
  background: ${props => props.theme.name === 'light' ? '#f8f9fb' : 'rgba(24, 24, 27, 0.95)'};
  border-radius: 10px;
  margin: 14px 0;
  overflow: hidden;
  border: 1px solid ${props => props.theme.name === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'};
  max-width: 100%;
  width: 100%;
`;

const CodeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  background: ${props => props.theme.name === 'light' ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.04)'};
  border-bottom: 1px solid ${props => props.theme.name === 'light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'};
`;

const CodeLanguage = styled.div`
  font-size: 0.78rem;
  font-weight: 500;
  color: ${props => `${props.theme.text}88`};
  letter-spacing: 0.01em;
  text-transform: lowercase;
`;

const CopyButton = styled.button`
  background: none;
  border: none;
  color: ${props => `${props.theme.text}66`};
  font-size: 0.78rem;
  cursor: pointer;
  padding: 2px 6px;
  font-weight: 500;
  border-radius: 4px;
  transition: all 0.15s ease;
  
  &:hover {
    color: ${props => props.theme.text};
    background: ${props => `${props.theme.text}0a`};
  }
`;

const Pre = styled.pre`
  margin: 0;
  padding: 14px 16px;
  overflow-x: auto;
  font-family: 'SF Mono', SFMono-Regular, ui-monospace, Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.84rem;
  line-height: 1.6;
  max-width: 100%;
  word-wrap: normal;
  white-space: pre;
  text-overflow: ellipsis;
  color: ${props => props.theme.text};
  
  &::-webkit-scrollbar {
    height: 5px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => `${props.theme.text}18`};
    border-radius: 3px;
  }
`;

const Message = styled.div`
  display: flex;
  flex-direction: ${props => props.$alignment === 'right' ? 'row-reverse' : 'row'};
  align-items: flex-start;
  justify-content: flex-start;
  margin-bottom: var(--message-spacing, 28px);
  max-width: 780px;
  width: 100%;
  padding-left: ${props => props.$alignment === 'left' ? '16px' : '16px'};
  padding-right: ${props => props.$alignment === 'right' ? '16px' : '16px'};
`;

const Avatar = styled.div`
  width: ${props => props.role === 'user' ? '26px' : '28px'};
  height: ${props => props.role === 'user' ? '26px' : '28px'};
  border-radius: ${props => props.role === 'user' ? '50%' : '8px'};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: ${props => props.$alignment === 'right' ? '0' : '12px'};
  margin-left: ${props => props.$alignment === 'left' ? '0' : '12px'};
  margin-top: 2px;
  font-weight: 600;
  flex-shrink: 0;
  background: ${props => props.$profilePicture
    ? `url(${props.$profilePicture}) center/cover`
    : (props.$useModelIcon
      ? 'transparent'
      : (props.role === 'user'
        ? `${props.theme.text}12`
        : props.theme.secondary))};
  color: ${props => props.$profilePicture ? 'transparent' : (props.role === 'user' ? `${props.theme.text}70` : 'white')};
  transition: all 0.2s ease;
  box-shadow: none;
  opacity: 1;
  
  &:hover {
    opacity: 0.85;
  }
  
  svg {
    width: ${props => props.role === 'user' ? '14px' : '18px'};
    height: ${props => props.role === 'user' ? '14px' : '18px'};
  }
`;

const MessageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  max-width: ${props => props.role === 'user' ? '72%' : 'calc(100% - 52px)'};
  flex: ${props => props.role === 'user' ? '0 1 auto' : '1'};
  align-items: ${props => props.$alignment === 'right' ? 'flex-end' : 'flex-start'};
  
  @media (max-width: 768px) {
    max-width: ${props => props.role === 'user' ? '85%' : 'calc(100% - 52px)'};
  }
`;

const isCustomAccent = (theme) => theme?.accentChoice && theme.accentChoice !== 'theme';

const getBubbleBackground = (role, theme) => {
  const customAccent = isCustomAccent(theme);
  if (role === 'user') {
    if (customAccent) return theme.accentBackground;
    return theme.name === 'light' ? `${theme.text}08` : `${theme.text}0c`;
  }
  return 'transparent';
};

const getBubbleBorderColor = (role, theme) => {
  if (role !== 'user') return 'transparent';
  return isCustomAccent(theme) ? theme.accentColor : theme.border;
};

const getBubbleTextColor = (theme) => isCustomAccent(theme) ? '#FFFFFF' : theme.text;

const Content = styled.div`
  width: ${props => props.role === 'user' ? 'fit-content' : '100%'};
  white-space: ${props => props.role === 'user' ? 'pre-wrap' : 'normal'};
  color: ${props => getBubbleTextColor(props.theme)};
  line-height: var(--line-height, 1.6);
  overflow: hidden;
  flex: 1;
  margin-left: ${props => props.$alignment === 'right' ? 'auto' : '0'};
  margin-right: ${props => props.$alignment === 'left' ? 'auto' : '0'};
  position: relative;
  text-align: ${props => props.$alignment === 'right' ? 'right' : 'left'};
  direction: ltr;
  unicode-bidi: plaintext;
  transition: background 0.2s ease, border-color 0.2s ease;
  background: ${props => getBubbleBackground(props.role, props.theme)};
  border: ${props => props.role === 'user'
    ? `var(--bubble-border, 1px solid ${getBubbleBorderColor(props.role, props.theme)})`
    : 'none'};
  border-radius: ${props => props.role === 'user'
    ? 'var(--bubble-radius, 20px)'
    : '0'};
  padding: ${props => props.role === 'user'
    ? 'var(--bubble-padding-vertical, 12px) var(--bubble-padding-horizontal, 18px)'
    : '2px 0'};
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  font-size: 0.94rem;
  letter-spacing: -0.008em;
  
  ${props => props.theme.name === 'bisexual' && props.role === 'user' && `
    border: none !important;
    &::before {
      content: '';
      position: absolute;
      top: -1px;
      left: -1px;
      right: -1px;
      bottom: -1px;
      background: linear-gradient(145deg, #D60270, #9B4F96);
      border-radius: 21px;
      z-index: -1;
      opacity: 0.3;
    }
  `}
  
  & > ${CodeBlock} {
    max-width: 100%;
    text-align: left;
    direction: ltr;
  }
  
  & > em:last-child {
    display: block;
    margin-top: 12px;
    opacity: 0.5;
    font-size: 0.82em;
    text-align: right;
    font-style: normal;
    color: ${props => props.theme.text}99;
    ${props => props.theme.name === 'bisexual' && `
      background: ${props.theme.accentGradient};
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      opacity: 0.9;
    `}
  }
  
  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

const Timestamp = styled.div`
  font-size: 0.72rem;
  color: ${props => `${props.theme.text}55`};
  display: flex;
  align-items: center;
  letter-spacing: 0.01em;
`;

const MessageActions = styled.div`
  display: flex;
  justify-content: ${props => props.$alignment === 'right' ? 'flex-end' : 'flex-start'};
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  padding: 0;
  opacity: 0.7;
  width: ${props => props.$alignment === 'right' ? '100%' : 'fit-content'};
  max-width: 100%;
  align-self: ${props => props.$alignment === 'right' ? 'flex-end' : 'flex-start'};
  transition: opacity 0.15s ease;
  
  &:hover {
    opacity: 1;
  }
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  font-size: 0.78rem;
  color: ${props => `${props.theme.text}50`};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.15s ease;
  
  &:hover {
    background: ${props => `${props.theme.text}08`};
    color: ${props => `${props.theme.text}90`};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  svg {
    width: 15px;
    height: 15px;
  }
`;

const DeepResearchExportTemplate = styled.div`
  position: fixed;
  left: -12000px;
  top: 0;
  width: 840px;
  background: #ffffff;
  color: #0f172a;
  padding: 44px 48px 48px;
  box-sizing: border-box;
  font-family: ${props => props.theme?.fontFamily || 'Inter, "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif'};
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
`;

const DRExportAccentBar = styled.div`
  height: 4px;
  width: 64px;
  background: linear-gradient(90deg, #1d4ed8 0%, #2563eb 60%, #60a5fa 100%);
  border-radius: 2px;
  margin-bottom: 22px;
`;

const DRExportHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e2e8f0;
`;

const DRExportLogo = styled.img`
  width: 44px;
  height: 44px;
  object-fit: contain;
  flex-shrink: 0;
`;

const DRExportTitle = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
`;

const DRExportEyebrow = styled.div`
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #2563eb;
  font-weight: 600;
`;

const DRExportTitleMain = styled.div`
  font-size: 1.58rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #0f172a;
  line-height: 1.25;
`;

const DRExportTitleSub = styled.div`
  font-size: 0.88rem;
  color: #475569;
  line-height: 1.5;
`;

const DRExportMetadata = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 24px;
  padding: 18px 20px;
  margin-bottom: 24px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
`;

const DRExportMetadataItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

const DRExportMetadataLabel = styled.div`
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
  font-weight: 600;
`;

const DRExportMetadataValue = styled.div`
  font-size: 0.9rem;
  color: #0f172a;
  font-weight: 500;
  word-break: break-word;
`;

const DRExportSection = styled.div`
  margin-bottom: 22px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const DRExportSectionTitle = styled.div`
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 10px;
  color: #1d4ed8;
  display: flex;
  align-items: center;
  gap: 8px;

  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #e2e8f0;
  }
`;

const DRExportBody = styled.div`
  font-size: 13.5px;
  line-height: 1.72;
  color: #1e293b;

  h1, h2, h3, h4, h5, h6 {
    color: #0f172a;
    margin-top: 1.2em;
    margin-bottom: 0.5em;
    line-height: 1.3;
  }

  p {
    margin: 0 0 0.75em;
  }

  ul, ol {
    padding-left: 22px;
    margin: 0 0 0.75em;
  }

  li {
    margin-bottom: 4px;
  }

  a {
    color: #1d4ed8;
    text-decoration: none;
    word-break: break-word;
  }

  blockquote {
    border-left: 3px solid #cbd5e1;
    margin: 0 0 0.75em;
    padding: 2px 0 2px 12px;
    color: #475569;
  }

  code {
    background: #f1f5f9;
    color: #0f172a;
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 0.86em;
  }

  pre {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 10px 12px;
    overflow-x: hidden;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 0.82em;
  }
`;

const DRExportQuestionList = styled.ol`
  margin: 0;
  padding-left: 22px;
  color: #1e293b;

  li {
    margin-bottom: 4px;
    font-size: 0.88rem;
  }
`;

const DRExportQualityBox = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 0.85rem;
  line-height: 1.5;
`;

const DRExportSources = styled.ol`
  margin: 0;
  padding-left: 22px;
  counter-reset: dr-source;
  list-style: decimal;
`;

const DRExportSourceItem = styled.li`
  margin-bottom: 8px;
  font-size: 0.84rem;
  color: #334155;
  line-height: 1.5;

  strong {
    color: #0f172a;
    font-weight: 600;
  }

  a {
    color: #1d4ed8;
    word-break: break-word;
  }

  .dr-source-domain {
    color: #64748b;
    font-size: 0.78rem;
    margin-left: 6px;
  }
`;

const ErrorMessage = styled(Content)`
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.12);
  border-radius: 12px;
  padding: 12px 16px;
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
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0.8em 0 0.3em 0;
  color: ${props => props.theme.text};
  border-bottom: 1px solid ${props => props.theme.border};
  padding-bottom: 0.25rem;
  line-height: 1.3;
  letter-spacing: -0.02em;
  
  &:first-child {
    margin-top: 0;
  }
`;

const Heading2 = styled.h2`
  font-size: 1.25rem;
  font-weight: 650;
  margin: 0.7em 0 0.25em 0;
  color: ${props => props.theme.text};
  line-height: 1.3;
  letter-spacing: -0.015em;
  
  &:first-child {
    margin-top: 0;
  }
`;

const Heading3 = styled.h3`
  font-size: 1.08rem;
  font-weight: 600;
  margin: 0.6em 0 0.2em 0;
  color: ${props => props.theme.text};
  line-height: 1.3;
  letter-spacing: -0.01em;
  
  &:first-child {
    margin-top: 0;
  }
`;

const Heading4 = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  margin: 0.5em 0 0.2em 0;
  color: ${props => props.theme.text};
  line-height: 1.3;
  
  &:first-child {
    margin-top: 0;
  }
`;

const Heading5 = styled.h5`
  font-size: 0.92rem;
  font-weight: 600;
  margin: 0.4em 0 0.15em 0;
  color: ${props => props.theme.text};
  line-height: 1.3;
  
  &:first-child {
    margin-top: 0;
  }
`;

const Heading6 = styled.h6`
  font-size: 0.85rem;
  font-weight: 600;
  margin: 0.35em 0 0.1em 0;
  color: ${props => props.theme.text};
  line-height: 1.3;
  
  &:first-child {
    margin-top: 0;
  }
`;

const Paragraph = styled.p`
  margin: 0.4em 0;
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
  padding-left: 1em;
  margin: 0.35em 0;
  
  li {
    position: relative;
    padding-left: 1.3em;
    margin: 0.2em 0;
    line-height: 1.6;
    color: ${props => props.theme.text};
    
    &:before {
      content: "•";
      position: absolute;
      left: 0.15em;
      color: ${props => props.theme.accentColor || props.theme.text};
      font-weight: bold;
      font-size: 1em;
      opacity: 0.55;
    }
  }
`;

const NumberedList = styled.ol`
  padding-left: 1.4em;
  margin: 0.35em 0;
  
  li {
    margin: 0.2em 0;
    line-height: 1.6;
    color: ${props => props.theme.text};
    padding-left: 0.2em;
    
    &::marker {
      color: ${props => props.theme.accentColor || props.theme.text};
      opacity: 0.55;
      font-weight: 600;
      font-size: 0.9em;
    }
  }
`;

const Blockquote = styled.blockquote`
  border-left: 3px solid ${props => `${props.theme.accentColor || props.theme.text}44`};
  margin: 0.4em 0;
  padding: 0.3rem 0 0.3rem 0.9rem;
  background: transparent;
  border-radius: 0;
  font-style: italic;
  color: ${props => `${props.theme.text}cc`};
  
  p {
    margin: 0;
    line-height: 1.6;
  }
`;

const Link = styled.a`
  color: ${props => props.theme.accentColor || props.theme.primary};
  text-decoration: underline;
  text-decoration-color: ${props => `${props.theme.accentColor || props.theme.primary}44`};
  text-underline-offset: 2px;
  transition: text-decoration-color 0.15s ease;
  
  &:hover {
    text-decoration-color: ${props => props.theme.accentColor || props.theme.primary};
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  overflow: hidden;
  background: transparent;
  font-size: 0.88rem;
`;

const TableHeader = styled.th`
  background: ${props => `${props.theme.text}06`};
  padding: 10px 14px;
  text-align: left;
  font-weight: 600;
  font-size: 0.82rem;
  color: ${props => `${props.theme.text}cc`};
  border-bottom: 1px solid ${props => props.theme.border};
  letter-spacing: 0.01em;
`;

const TableCell = styled.td`
  padding: 10px 14px;
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
    background: ${props => `${props.theme.text}04`};
  }
`;

const HorizontalRule = styled.hr`
  border: none;
  height: 1px;
  background: ${props => props.theme.border};
  margin: 1rem 0;
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

const MessageVideo = styled.video`
  max-width: 100%;
  max-height: 400px;
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

const formatReportTimestamp = (timestamp) => {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const sanitizeFileName = (input = '') => {
  const cleanInput = String(input || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  return cleanInput.slice(0, 70) || 'deep-research-report';
};

const buildPrintTheme = (theme = {}) => ({
  ...theme,
  name: 'light',
  text: '#0f172a',
  textSecondary: '#334155',
  border: '#e5e7eb',
  inputBackground: '#ffffff',
  primary: '#2563eb',
  secondary: '#1d4ed8',
  accentColor: '#2563eb',
  background: '#ffffff'
});

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
  margin: 10px 0 12px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid ${props => props.theme.border || '#e1e5e9'};
  background: ${props => props.theme.name === 'light' ? 'rgba(248, 249, 251, 0.8)' : 'rgba(24, 24, 27, 0.45)'};
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
`;

const ThinkingHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 12px;
  cursor: pointer;
  user-select: none;
  font-weight: 500;
  font-size: 0.85rem;
  color: ${props => `${props.theme.text}88`};
  transition: color 0.15s ease;
  
  &:hover {
    color: ${props => props.theme.text};
  }
`;

const ThinkingHeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
`;

const ThinkingBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid ${props => `${props.theme.text}22`};
  background: ${props => `${props.theme.text}10`};
  color: ${props => `${props.theme.text}dd`};
  font-size: 0.74rem;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  white-space: nowrap;
`;

const ThinkingPreview = styled.div`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.82rem;
  color: ${props => `${props.theme.text}aa`};
`;

const ThinkingArrow = styled.span`
  transition: transform 0.2s ease;
  transform: ${props => props.expanded ? 'rotate(180deg)' : 'rotate(0deg)'};
  font-size: 12px;
  display: inline-block;
  width: 14px;
  text-align: center;
  opacity: 0.8;
`;

const ThinkingContent = styled.div`
  padding: ${props => props.expanded ? '10px 12px 12px 12px' : '0 12px'};
  max-height: ${props => props.expanded ? '1000px' : '0'};
  opacity: ${props => props.expanded ? '1' : '0'};
  transition: max-height 0.3s ease, opacity 0.25s ease, padding 0.25s ease;
  overflow: hidden;
  border-top: ${props => props.expanded ? `1px solid ${props.theme.border || '#e1e5e9'}40` : 'none'};
  font-size: 0.88rem;
  color: ${props => `${props.theme.text}cc`};
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

// Code Execution Components (for Gemini's code execution feature)
const CodeExecutionSection = styled.div`
  margin: 12px 0;
  border: 1px solid ${props => props.theme.border || '#e1e5e9'}40;
  border-radius: 8px;
  overflow: hidden;
  background: ${props => props.theme.background || '#f8f9fa'}20;
`;

const CodeExecutionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: ${props => props.theme.background || '#f8f9fa'}40;
  border-bottom: 1px solid ${props => props.theme.border || '#e1e5e9'}30;
  font-size: 0.85em;
  font-weight: 600;
  color: ${props => props.theme.text}dd;
`;

const CodeExecutionIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-radius: 4px;
  color: white;
  font-size: 10px;
`;

const CodeExecutionBody = styled.div`
  padding: 12px;
`;

const CodeExecutionCode = styled.pre`
  background: ${props => props.theme.codeBackground || '#1e1e1e'};
  color: ${props => props.theme.codeText || '#d4d4d4'};
  padding: 12px;
  border-radius: 6px;
  font-family: 'SF Mono', SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.85em;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  max-height: 300px;
  
  &::-webkit-scrollbar {
    height: 6px;
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.border}60;
    border-radius: 3px;
  }
`;

const CodeExecutionResultSection = styled.div`
  margin-top: 12px;
`;

const CodeExecutionResultHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8em;
  font-weight: 600;
  color: ${props => props.outcome === 'OUTCOME_OK' ? '#10b981' : '#ef4444'};
  margin-bottom: 8px;
`;

const CodeExecutionOutput = styled.pre`
  background: ${props => props.outcome === 'OUTCOME_OK'
    ? 'rgba(16, 185, 129, 0.1)'
    : 'rgba(239, 68, 68, 0.1)'};
  border: 1px solid ${props => props.outcome === 'OUTCOME_OK'
    ? 'rgba(16, 185, 129, 0.3)'
    : 'rgba(239, 68, 68, 0.3)'};
  color: ${props => props.theme.text};
  padding: 10px 12px;
  border-radius: 6px;
  font-family: 'SF Mono', SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 0.85em;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.border}60;
    border-radius: 2px;
  }
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

const ThinkingDropdown = ({ thinkingContent, thinkingPreviewText = '', toolCalls, isStreaming = false }) => {
  const { t } = useTranslation();
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
    if (hasThinking && hasToolActivity) return t('chat.thinking.header.thoughtsAndTools');
    if (hasThinking) return t('chat.thinking.header.thoughts');
    return t('chat.thinking.header.tools');
  };

  const normalizedThinkingPreview = typeof thinkingPreviewText === 'string'
    ? thinkingPreviewText.replace(/\s+/g, ' ').trim()
    : '';
  const clippedThinkingPreview = normalizedThinkingPreview.length > 140
    ? `${normalizedThinkingPreview.slice(0, 140)}...`
    : normalizedThinkingPreview;
  const thinkingLabel = t('composer.chip.thinking', 'Thinking');

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '[...]';
      case 'executing': return '[~]';
      case 'completed': return '[ok]';
      case 'error': return '[x]';
      default: return '[*]';
    }
  };

  return (
    <ThinkingDropdownContainer>
      <ThinkingHeader onClick={toggleExpanded}>
        <ThinkingHeaderTitle>
          <ThinkingBadge>{thinkingLabel}</ThinkingBadge>
          {!expanded && (
            <ThinkingPreview>
              {clippedThinkingPreview || (isStreaming ? t('chat.status.thinking') : getHeaderTitle())}
            </ThinkingPreview>
          )}
        </ThinkingHeaderTitle>
        <ThinkingArrow expanded={expanded}>v</ThinkingArrow>
      </ThinkingHeader>
      <ThinkingContent expanded={expanded}>
        {hasToolActivity && (
          <ToolActivitySection>
            <ToolActivitySectionHeader>{t('chat.thinking.toolActivity')}</ToolActivitySectionHeader>
            {toolCalls.map((toolCall, index) => (
              <ToolActivityItem key={toolCall.tool_id || index}>
                <ToolActivityItemHeader>
                  <ToolActivityIcon>
                    {getStatusIcon(toolCall.status)}
                  </ToolActivityIcon>
                  <ToolActivityName>
                    {toolCall.tool_name || t('chat.thinking.tool.unknown')}
                  </ToolActivityName>
                  <ToolActivityStatus status={toolCall.status}>
                    {t(`chat.thinking.tool.status.${toolCall.status || 'pending'}`, toolCall.status || 'pending')}
                  </ToolActivityStatus>
                </ToolActivityItemHeader>

                {toolCall.parameters && Object.keys(toolCall.parameters).length > 0 && (
                  <ToolActivityDetail>
                    <ToolActivityLabel>{t('chat.thinking.tool.parameters')}</ToolActivityLabel>
                    <ToolActivityValue>
                      {JSON.stringify(toolCall.parameters, null, 2)}
                    </ToolActivityValue>
                  </ToolActivityDetail>
                )}

                {toolCall.result && toolCall.status === 'completed' && (
                  <ToolActivityDetail>
                    <ToolActivityLabel>{t('chat.thinking.tool.result')}</ToolActivityLabel>
                    <ToolActivityValue>
                      {typeof toolCall.result === 'string' ? toolCall.result : JSON.stringify(toolCall.result, null, 2)}
                    </ToolActivityValue>
                  </ToolActivityDetail>
                )}

                {toolCall.error && toolCall.status === 'error' && (
                  <ToolActivityDetail>
                    <ToolActivityLabel>{t('chat.thinking.tool.error')}</ToolActivityLabel>
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
            {hasToolActivity && <ThinkingSectionHeader>{thinkingLabel}</ThinkingSectionHeader>}
            {thinkingContent}
          </ThinkingSection>
        )}
      </ThinkingContent>
    </ThinkingDropdownContainer>
  );
};

const ChatMessage = ({ message, showModelIcons = true, settings = {}, theme = {}, userProfilePicture = null, showProfileIcon = true }) => {
  const { t } = useTranslation();
  const { role, content, timestamp, isError, isLoading, modelId, image, file, sources, type, status, imageUrl, prompt: imagePrompt, flowchartData, id, toolCalls, availableTools, codeExecution, codeExecutionResult, reasoningTrace } = message;
  const { supportedLanguages, isLanguageExecutable } = useSupportedLanguages();
  const deepResearchExportRef = useRef(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const printableTheme = useMemo(() => buildPrintTheme(theme), [theme]);

  // Debug logging
  if (role === 'assistant' && sources) {
    console.log('[ChatMessage] Message has sources:', sources);
  }

  // Get the prompt for both image and flowchart messages
  const prompt = message.prompt;

  const translateSystemMessage = useCallback((text) => {
    if (!text) return text;
    const trimmed = text.trim();
    if (trimmed.startsWith('API keys are not configured')) {
      return t('chat.errors.apiKeys.notConfigured');
    }
    if (trimmed.startsWith('Add OPENROUTER_API_KEY')) {
      return t('chat.errors.apiKeys.instructions');
    }
    return text;
  }, [t]);

  const normalizedContent = translateSystemMessage(content);

  // Extract sources from content if this is an assistant message and not loading
  const { cleanedContent, sources: extractedSources } = useMemo(() => {
    if (role === 'assistant' && normalizedContent && !isLoading) {
      const result = extractSourcesFromResponse(normalizedContent);
      console.log('[ChatMessage] Extracted sources from content:', result);
      return result;
    }
    return { cleanedContent: content, sources: [] };
  }, [normalizedContent, content, role, isLoading]);

  // Use cleaned content if available, otherwise use original content
  const contentToProcess = cleanedContent || normalizedContent;

  const safeQueryForExport = useMemo(() => {
    const query = message?.query || message?.content || message?.prompt || 'deep research report';
    return sanitizeFileName(query);
  }, [message?.query, message?.content, message?.prompt]);

  const generatedReportAt = useMemo(() => formatReportTimestamp(timestamp) || new Date().toLocaleString(), [timestamp]);

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
      if (userProfilePicture) {
        return null;
      }
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

  // Determine alignment preference; default keeps AI left and user right
  const messageAlignmentPreference = settings.messageAlignment || 'default';
  const messageAlignment = messageAlignmentPreference === 'default'
    ? (role === 'assistant' ? 'left' : 'right')
    : (messageAlignmentPreference === 'right' ? 'right' : 'left');
  const shouldRenderAvatar = role !== 'user' || showProfileIcon;

  // Get bubble style from settings
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

  // Function to handle text-to-speech (toggle)
  const handleReadAloud = async () => {
    if (isSpeaking) {
      kokoroTTSService.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToRead = cleanedContent || content;
    if (!textToRead) {
      return;
    }

    try {
      setIsSpeaking(true);
      await kokoroTTSService.speak(textToRead);
    } catch (error) {
      console.error('Kokoro text-to-speech failed:', error);
    } finally {
      setIsSpeaking(false);
    }
  };

  // Ensure TTS state resets if user navigates away or message changes
  useEffect(() => {
    return () => {
      kokoroTTSService.cancel();
      setIsSpeaking(false);
    };
  }, [content, cleanedContent]);

  const exportImageSliceToPdf = useCallback(async (image, doc, sourceY, sourceHeight, targetWidthMM, targetHeightMM, topMarginMM, footerYMM, pageIndex, totalPages, footerMeta) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const leftMarginMM = 14;
    const rightTextX = pageWidth - leftMarginMM;

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = image.width;
    cropCanvas.height = sourceHeight;
    const cropContext = cropCanvas.getContext('2d');

    if (!cropContext) {
      throw new Error('Unable to create canvas context for PDF export');
    }

    cropContext.fillStyle = '#ffffff';
    cropContext.fillRect(0, 0, cropCanvas.width, cropCanvas.height);
    cropContext.drawImage(
      image,
      0,
      sourceY,
      image.width,
      sourceHeight,
      0,
      0,
      image.width,
      sourceHeight
    );

    const sliceDataUrl = cropCanvas.toDataURL('image/png');

    if (pageIndex > 0) {
      doc.addPage();
    }

    doc.addImage(
      sliceDataUrl,
      'PNG',
      leftMarginMM,
      topMarginMM,
      targetWidthMM,
      targetHeightMM
    );

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(leftMarginMM, footerYMM - 4, rightTextX, footerYMM - 4);

    doc.setFontSize(8);
    doc.setTextColor(29, 78, 216);
    doc.text('Sculptor AI', leftMarginMM, footerYMM);

    doc.setTextColor(100, 116, 139);
    const centerMeta = footerMeta?.generatedAt ? `Generated ${footerMeta.generatedAt}` : 'Deep Research Report';
    doc.text(centerMeta, pageWidth / 2, footerYMM, { align: 'center' });

    doc.text(`Page ${pageIndex + 1} of ${totalPages}`, rightTextX, footerYMM, { align: 'right' });
  }, []);

  const handleExportDeepResearchPdf = useCallback(async () => {
    if (!deepResearchExportRef.current || !contentToProcess || status !== 'completed' || isExportingPdf) {
      return;
    }

    setIsExportingPdf(true);

    try {
      const imageDataUrl = await toPng(deepResearchExportRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2
      });
      const image = new Image();
      image.src = imageDataUrl;

      await new Promise((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = (error) => reject(error);
      });

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const reportFileDate = timestamp ? new Date(timestamp) : new Date();
      const reportDate = Number.isNaN(reportFileDate.getTime()) ? new Date() : reportFileDate;
      const humanGeneratedAt = generatedReportAt || reportDate.toLocaleString();
      const queryTitle = (message.query || content || 'Deep Research Report').toString().slice(0, 120);

      try {
        doc.setProperties({
          title: `Sculptor AI Deep Research — ${queryTitle}`,
          subject: queryTitle,
          author: 'Sculptor AI',
          creator: 'Sculptor AI Deep Research',
          keywords: [
            'sculptor',
            'deep research',
            message.metadata?.reportLength || 'standard',
            message.metadata?.reportDepth || 'standard'
          ].join(', ')
        });
      } catch (metadataError) {
        console.warn('Failed to set PDF metadata:', metadataError);
      }

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const topMarginMM = 14;
      const bottomMarginMM = 16;
      const sideMarginMM = 14;
      const contentWidthMM = pageWidth - sideMarginMM * 2;
      const contentHeightMM = pageHeight - topMarginMM - bottomMarginMM;
      const footerYMM = pageHeight - 8;
      const scaleMmPerPx = contentWidthMM / image.width;
      const sliceHeightPx = Math.max(1, Math.floor(contentHeightMM / scaleMmPerPx));
      const totalPages = Math.max(1, Math.ceil(image.height / sliceHeightPx));

      for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
        const sourceY = pageIndex * sliceHeightPx;
        const sourceHeight = Math.min(sliceHeightPx, image.height - sourceY);
        const sliceHeightMM = sourceHeight * scaleMmPerPx;
        await exportImageSliceToPdf(
          image,
          doc,
          sourceY,
          sourceHeight,
          contentWidthMM,
          sliceHeightMM,
          topMarginMM,
          footerYMM,
          pageIndex,
          totalPages,
          { generatedAt: humanGeneratedAt }
        );
      }

      const reportTime = reportDate.toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const fileName = `${safeQueryForExport}-${reportTime}.pdf`;

      doc.save(fileName);
    } catch (error) {
      console.error('Failed to export deep research report as PDF:', error);
      window.alert('Unable to generate PDF right now. Please try again.');
    } finally {
      setIsExportingPdf(false);
    }
  }, [contentToProcess, isExportingPdf, safeQueryForExport, status, timestamp, exportImageSliceToPdf, generatedReportAt, message?.query, message?.metadata?.reportLength, message?.metadata?.reportDepth, content]);

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
          {t('chat.flowchart.creating', { prompt: prompt || t('chat.labels.yourRequest') })}
        </ThinkingContainer>
      );
    } else if (status === 'completed' && flowchartData) {
      generatedFlowchartContent = (
        <>
          {prompt && (
            <p style={{ margin: '0 0 8px 0', opacity: 0.85, fontSize: '0.9em' }}>
              {t('chat.labels.request')}: "{prompt || t('chat.labels.yourRequest')}"
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
              {t('chat.flowchart.openBuilder')}
            </FlowchartButton>
            <FlowchartPreview>
              <p style={{ fontSize: '0.9em', opacity: 0.7 }}>{t('chat.flowchart.instructionsHint', { buttonLabel: t('chat.flowchart.openBuilder') })}</p>
            </FlowchartPreview>
          </FlowchartContainer>
        </>
      );
    } else if (status === 'error') {
      generatedFlowchartContent = (
        <div>
          <p style={{ fontWeight: 'bold', color: '#dc3545', marginBottom: '4px' }}>
            {t('chat.flowchart.failed')}
          </p>
          {prompt && <p style={{ margin: '4px 0', opacity: 0.85 }}>{t('chat.labels.request')}: "{prompt || t('chat.labels.yourRequest')}"</p>}
          {content && <p style={{ margin: '4px 0', opacity: 0.85 }}>{t('chat.labels.error')}: {content}</p>}
        </div>
      );
    }

    return (
      <Message $alignment={messageAlignment}>
        {role !== 'user' && (
          <Avatar
            role={role}
            $alignment={messageAlignment}
            $useModelIcon={useModelIcon}
            $profilePicture={role === 'user' ? userProfilePicture : null}
          >
            {getAvatar()}
          </Avatar>
        )}
        <MessageWrapper role={role} $alignment={messageAlignment}>
          <Content role={role} $alignment={messageAlignment} className={`chat-message chat-message--${role}`}>
            {generatedFlowchartContent}
            {timestamp && settings.showTimestamps && (status === 'completed' || status === 'error') && (
              <MessageActions role={role} $alignment={messageAlignment}>
                <Timestamp>{formatTimestamp(timestamp)}</Timestamp>
                {status === 'completed' && flowchartData && (
                  <>
                    <div style={{ flexGrow: 1 }}></div>
                    <ActionButton onClick={() => navigator.clipboard.writeText(flowchartData).then(() => console.log('Flowchart data copied'))}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      {t('chat.actions.copyInstructions')}
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
            <span>{t('chat.research.performing')}</span>
          </div>
          <div style={{ fontSize: '0.9em', opacity: 0.7 }}>
            {t('chat.labels.query')}: "{message.query || content || t('chat.labels.yourQuery')}"
          </div>
          {message.progress !== undefined && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85em', opacity: 0.8 }}>
                  {message.statusMessage || t('chat.research.initializing')}
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
              {t('chat.research.results')}
            </div>
            {message.subQuestions && message.subQuestions.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '0.9em', fontWeight: '500', marginBottom: '6px', opacity: 0.8 }}>
                  {t('chat.research.questionsLabel', { count: message.subQuestions.length })}
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
                {t('chat.research.analyzedBy', { count: message.agentResults.length })}
              </div>
            )}
            {message.metadata?.models && (
              <div style={{
                marginBottom: '12px',
                padding: '10px 12px',
                borderRadius: '8px',
                background: theme.inputBackground || 'rgba(0,0,0,0.04)',
                border: `1px solid ${theme.border || 'rgba(0,0,0,0.1)'}`,
                fontSize: '0.82em',
                lineHeight: '1.5',
                opacity: 0.86
              }}>
                <div>Planner: {message.metadata.models.planner || 'N/A'}</div>
                <div>Research agents: {message.metadata.models.researcher || 'N/A'}</div>
                <div>Writer: {message.metadata.models.writer || 'N/A'}</div>
                {message.metadata.reportLength && (
                  <div>Report length: {message.metadata.reportLength}</div>
                )}
                {message.metadata.reportDepth && (
                  <div>Report depth: {message.metadata.reportDepth}</div>
                )}
                {message.metadata.agentCount && (
                  <div>Agents used: {message.metadata.agentCount}</div>
                )}
              </div>
            )}
            {Array.isArray(message.qualityIssues) && message.qualityIssues.length > 0 && (
              <div style={{
                marginBottom: '12px',
                padding: '10px 12px',
                borderRadius: '8px',
                background: '#7f1d1d1f',
                border: '1px solid #ef444466',
                fontSize: '0.82em',
                lineHeight: '1.4'
              }}>
                Quality notes: {message.qualityIssues.join(' | ')}
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
            {t('chat.research.failed')}
          </p>
          <p style={{ margin: '4px 0', opacity: 0.85 }}>{t('chat.labels.query')}: "{message.query || content || t('chat.labels.yourQuery')}"</p>
          {(message.errorMessage || message.content) && <p style={{ margin: '4px 0', opacity: 0.85 }}>{t('chat.labels.error')}: {message.errorMessage || message.content}</p>}
        </div>
      );
    }

    const exportQueryText = (message.query || content || '').toString().trim();
    const deepResearchExportTemplate = status === 'completed' && content ? (
      <DeepResearchExportTemplate ref={deepResearchExportRef}>
        <DRExportAccentBar />
        <DRExportHeader>
          <DRExportLogo src="/images/sculptor.svg" alt="Sculptor AI" />
          <DRExportTitle>
            <DRExportEyebrow>Sculptor AI · Deep Research</DRExportEyebrow>
            <DRExportTitleMain>
              {exportQueryText
                ? exportQueryText.length > 140
                  ? `${exportQueryText.slice(0, 140)}…`
                  : exportQueryText
                : 'Deep Research Report'}
            </DRExportTitleMain>
            <DRExportTitleSub>
              Synthesized multi-agent investigation with verified citations.
            </DRExportTitleSub>
          </DRExportTitle>
        </DRExportHeader>

        <DRExportMetadata>
          <DRExportMetadataItem>
            <DRExportMetadataLabel>Generated</DRExportMetadataLabel>
            <DRExportMetadataValue>{generatedReportAt || 'Just now'}</DRExportMetadataValue>
          </DRExportMetadataItem>
          <DRExportMetadataItem>
            <DRExportMetadataLabel>Length · Depth</DRExportMetadataLabel>
            <DRExportMetadataValue style={{ textTransform: 'capitalize' }}>
              {(message.metadata?.reportLength || 'standard')} · {(message.metadata?.reportDepth || 'standard')}
            </DRExportMetadataValue>
          </DRExportMetadataItem>
          <DRExportMetadataItem>
            <DRExportMetadataLabel>Planner</DRExportMetadataLabel>
            <DRExportMetadataValue>{message.metadata?.models?.planner || 'Auto'}</DRExportMetadataValue>
          </DRExportMetadataItem>
          <DRExportMetadataItem>
            <DRExportMetadataLabel>Researcher</DRExportMetadataLabel>
            <DRExportMetadataValue>{message.metadata?.models?.researcher || 'Auto'}</DRExportMetadataValue>
          </DRExportMetadataItem>
          <DRExportMetadataItem>
            <DRExportMetadataLabel>Writer</DRExportMetadataLabel>
            <DRExportMetadataValue>{message.metadata?.models?.writer || 'Auto'}</DRExportMetadataValue>
          </DRExportMetadataItem>
          <DRExportMetadataItem>
            <DRExportMetadataLabel>Agents</DRExportMetadataLabel>
            <DRExportMetadataValue>
              {message.metadata?.agentCount ?? (Array.isArray(message.agentResults) ? message.agentResults.length : 'N/A')}
              {displaySources.length > 0 ? ` · ${displaySources.length} sources` : ''}
            </DRExportMetadataValue>
          </DRExportMetadataItem>
        </DRExportMetadata>

        {message.subQuestions && message.subQuestions.length > 0 && (
          <DRExportSection>
            <DRExportSectionTitle>Research plan</DRExportSectionTitle>
            <DRExportQuestionList>
              {message.subQuestions.map((question, index) => (
                <li key={`export-question-${index}`}>{question}</li>
              ))}
            </DRExportQuestionList>
          </DRExportSection>
        )}

        {Array.isArray(message.qualityIssues) && message.qualityIssues.length > 0 && (
          <DRExportSection>
            <DRExportSectionTitle>Quality notes</DRExportSectionTitle>
            <DRExportQualityBox>
              {message.qualityIssues.join(' · ')}
            </DRExportQualityBox>
          </DRExportSection>
        )}

        <DRExportSection>
          <DRExportSectionTitle>Report</DRExportSectionTitle>
          <DRExportBody>
            {robustFormatContent(contentToProcess, isLanguageExecutable, supportedLanguages, printableTheme)}
          </DRExportBody>
        </DRExportSection>

        {displaySources.length > 0 && (
          <DRExportSection>
            <DRExportSectionTitle>Sources ({displaySources.length})</DRExportSectionTitle>
            <DRExportSources>
              {displaySources.map((source, index) => {
                const domain = (() => {
                  try { return new URL(source.url).hostname.replace(/^www\./, ''); }
                  catch { return ''; }
                })();
                return (
                  <DRExportSourceItem key={`export-source-${index}`}>
                    <strong>{source.title || domain || 'Untitled source'}</strong>
                    {domain ? <span className="dr-source-domain">{domain}</span> : null}
                    <div style={{ fontSize: '0.78rem', color: '#64748b', wordBreak: 'break-all', marginTop: '2px' }}>
                      {source.url}
                    </div>
                  </DRExportSourceItem>
                );
              })}
            </DRExportSources>
          </DRExportSection>
        )}
      </DeepResearchExportTemplate>
    ) : null;

    return (
      <Message $alignment={messageAlignment}>
        {role !== 'user' && (
          <Avatar
            role={role}
            $alignment={messageAlignment}
            $useModelIcon={useModelIcon}
            $profilePicture={role === 'user' ? userProfilePicture : null}
          >
            {getAvatar()}
          </Avatar>
        )}
        <MessageWrapper role={role} $alignment={messageAlignment}>
          <Content role={role} $alignment={messageAlignment} className={`chat-message chat-message--${role}`}>
            {deepResearchContent}
            {deepResearchExportTemplate}
            {/* Show sources if available */}
            {hasSources && status === 'completed' && (
              <SourcesContainer>
                {displaySources.map((source, index) => (
                  <SourceButton
                    key={index}
                  onClick={() => openExternalUrl(source.url)}
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
              <MessageActions role={role} $alignment={messageAlignment}>
                <Timestamp>{formatTimestamp(timestamp)}</Timestamp>
                {status === 'completed' && content && (
                  <>
                    <div style={{ flexGrow: 1 }}></div>
                    <ActionButton onClick={handleExportDeepResearchPdf} disabled={isExportingPdf} title="Export this deep research report as PDF">
                      {isExportingPdf ? (
                        <LoadingDots />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="7 10 12 15 17 10"></polyline>
                          <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                      )}
                      {isExportingPdf ? 'Exporting…' : 'Export PDF'}
                    </ActionButton>
                    <ActionButton onClick={() => navigator.clipboard.writeText(content).then(() => console.log('Research results copied'))}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      {t('chat.actions.copyResults')}
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
          {t('chat.image.generating', { prompt: imagePrompt || t('chat.labels.yourPrompt') })}
        </ThinkingContainer>
      );
    } else if (status === 'completed' && imageUrl) {
      generatedImageContent = (
        <>
          {imagePrompt && (
            <p style={{ margin: '0 0 8px 0', opacity: 0.85, fontSize: '0.9em' }}>
              {t('chat.labels.prompt')}: "{imagePrompt}"
            </p>
          )}
          <MessageImage src={imageUrl} alt={imagePrompt || 'Generated AI image'} style={{ maxHeight: '400px' }} />
        </>
      );
    } else if (status === 'error') {
      generatedImageContent = (
        <div>
          <p style={{ fontWeight: 'bold', color: '#dc3545', marginBottom: '4px' }}>
            {t('chat.image.failed')}
          </p>
          {imagePrompt && <p style={{ margin: '4px 0', opacity: 0.85 }}>{t('chat.labels.prompt')}: "{imagePrompt}"</p>}
          {content && <p style={{ margin: '4px 0', opacity: 0.85 }}>{t('chat.labels.error')}: {content}</p>}
        </div>
      );
    }

    return (
      <Message $alignment={messageAlignment}>
        {role !== 'user' && (
          <Avatar
            role={role}
            $alignment={messageAlignment}
            $useModelIcon={useModelIcon}
            $profilePicture={role === 'user' ? userProfilePicture : null}
          >
            {getAvatar()}
          </Avatar>
        )}
        <MessageWrapper role={role} $alignment={messageAlignment}>
          <Content
            role={role}
            $alignment={messageAlignment}
            className={`chat-message chat-message--${role}${highContrast ? ' high-contrast' : ''}`}
          >
            {generatedImageContent}
            {timestamp && settings.showTimestamps && (status === 'completed' || status === 'error') && (
              <MessageActions role={role} $alignment={messageAlignment}>
                <Timestamp>{formatTimestamp(timestamp)}</Timestamp>
                {status === 'completed' && imageUrl && (
                  <>
                    <div style={{ flexGrow: 1 }}></div>
                    <ActionButton onClick={() => navigator.clipboard.writeText(imageUrl).then(() => console.log('Image URL copied'))}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      {t('chat.actions.copyUrl')}
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

  // Handle generated video message type
  if (type === 'generated-video') {
    const { videoUrl, videoId } = message;
    let generatedVideoContent;
    if (status === 'loading') {
      generatedVideoContent = (
        <ThinkingContainer>
          <SpinnerIcon />
          {t('chat.video.generating', { prompt: imagePrompt || t('chat.labels.yourPrompt') })}
        </ThinkingContainer>
      );
    } else if (status === 'completed' && (videoUrl || videoId)) {
      generatedVideoContent = (
        <>
          {imagePrompt && (
            <p style={{ margin: '0 0 8px 0', opacity: 0.85, fontSize: '0.9em' }}>
              {t('chat.labels.prompt')}: "{imagePrompt}"
            </p>
          )}
          {videoUrl ? (
            <MessageVideo controls src={videoUrl} style={{ maxHeight: '400px' }} />
          ) : (
            <p style={{ margin: 0, opacity: 0.85 }}>
              {t('chat.video.previewUnavailable', 'Preview unavailable. Download the video to view it.')}
            </p>
          )}
        </>
      );
    } else if (status === 'error') {
      generatedVideoContent = (
        <div>
          <p style={{ fontWeight: 'bold', color: '#dc3545', marginBottom: '4px' }}>
            {t('chat.video.failed')}
          </p>
          {imagePrompt && <p style={{ margin: '4px 0', opacity: 0.85 }}>{t('chat.labels.prompt')}: "{imagePrompt}"</p>}
          {content && <p style={{ margin: '4px 0', opacity: 0.85 }}>{t('chat.labels.error')}: {content}</p>}
        </div>
      );
    }

    return (
      <Message $alignment={messageAlignment}>
        {role !== 'user' && (
          <Avatar
            role={role}
            $alignment={messageAlignment}
            $useModelIcon={useModelIcon}
            $profilePicture={role === 'user' ? userProfilePicture : null}
          >
            {getAvatar()}
          </Avatar>
        )}
        <MessageWrapper role={role} $alignment={messageAlignment}>
          <Content
            role={role}
            $alignment={messageAlignment}
            className={`chat-message chat-message--${role}${highContrast ? ' high-contrast' : ''}`}
          >
            {generatedVideoContent}
            {timestamp && settings.showTimestamps && (status === 'completed' || status === 'error') && (
              <MessageActions role={role} $alignment={messageAlignment}>
                <Timestamp>{formatTimestamp(timestamp)}</Timestamp>
                {status === 'completed' && videoId && (
                  <>
                    <div style={{ flexGrow: 1 }}></div>
                    <ActionButton onClick={() => downloadGeneratedVideo(videoId).catch((error) => console.error('Video download failed', error))}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      {t('chat.actions.download', 'Download')}
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
      {shouldRenderAvatar && (
        <Avatar
          role={role}
          $alignment={messageAlignment}
          $useModelIcon={useModelIcon}
          $profilePicture={role === 'user' ? userProfilePicture : null}
        >
          {getAvatar()}
        </Avatar>
      )}
      {isError ? (
        <ErrorMessage role={role} $alignment={messageAlignment} className={`chat-message chat-message--${role}`}>
          {content}
          {timestamp && settings.showTimestamps && <Timestamp>{formatTimestamp(timestamp)}</Timestamp>}
        </ErrorMessage>
      ) : (
        <MessageWrapper role={role} $alignment={messageAlignment}>
          <Content
            role={role}
            $alignment={messageAlignment}
            className={`chat-message chat-message--${role}${highContrast ? ' high-contrast' : ''}`}
          >
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
              if (
                isLoading &&
                !content &&
                !(typeof reasoningTrace === 'string' && reasoningTrace.trim()) &&
                !(toolCalls && toolCalls.length > 0)
              ) {
                return (
                  <ThinkingContainer>
                    <SpinnerIcon />
                    {t('chat.status.thinking')}
                  </ThinkingContainer>
                );
              }

              // Process content and show main content + thinking dropdown if applicable
              const { mainContent: mainContentWithoutThinking, thinkingContent: rawThinkingContent } =
                extractThinkingFromContent(contentToProcess);
              const combinedThinkingText = [reasoningTrace, rawThinkingContent]
                .map(value => (typeof value === 'string' ? value.trim() : ''))
                .filter(Boolean)
                .filter((value, index, array) => array.indexOf(value) === index)
                .join('\n\n');
              const formattedThinkingContent = combinedThinkingText
                ? processText(combinedThinkingText, true, isLanguageExecutable, supportedLanguages, theme)
                : null;

              if (formattedThinkingContent) {
                // If content has reasoning/thinking traces, show the collapsible trace first.
                return (
                  <>
                    <ThinkingDropdown
                      thinkingContent={formattedThinkingContent}
                      thinkingPreviewText={combinedThinkingText}
                      toolCalls={toolCalls}
                      isStreaming={isLoading}
                    />
                    <StreamingMarkdownRenderer
                      text={mainContentWithoutThinking}
                      isStreaming={isLoading}
                      theme={theme}
                    />
                  </>
                );
              }
              // If content has no thinking tags, but may have tool activity or code execution
              const hasToolActivity = toolCalls && toolCalls.length > 0;
              const hasCodeExecution = codeExecution || codeExecutionResult;

              return (
                <>
                  {hasToolActivity && (
                    <ThinkingDropdown
                      thinkingContent={null}
                      thinkingPreviewText=""
                      toolCalls={toolCalls}
                      isStreaming={isLoading}
                    />
                  )}

                  {/* Code Execution Display (Gemini) */}
                  {hasCodeExecution && (
                    <CodeExecutionSection>
                      <CodeExecutionHeader>
                        <CodeExecutionIcon>
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="16 18 22 12 16 6"></polyline>
                            <polyline points="8 6 2 12 8 18"></polyline>
                          </svg>
                        </CodeExecutionIcon>
                        Code Execution
                      </CodeExecutionHeader>
                      <CodeExecutionBody>
                        {codeExecution && (
                          <>
                            <div style={{ fontSize: '0.75em', color: 'inherit', opacity: 0.7, marginBottom: '6px' }}>
                              {codeExecution.language || 'python'}
                            </div>
                            <CodeExecutionCode>
                              {codeExecution.code}
                            </CodeExecutionCode>
                          </>
                        )}
                        {codeExecutionResult && (
                          <CodeExecutionResultSection>
                            <CodeExecutionResultHeader outcome={codeExecutionResult.outcome}>
                              {codeExecutionResult.outcome === 'OUTCOME_OK' ? (
                                <>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                  </svg>
                                  Output
                                </>
                              ) : (
                                <>
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="15" y1="9" x2="9" y2="15"></line>
                                    <line x1="9" y1="9" x2="15" y2="15"></line>
                                  </svg>
                                  Error
                                </>
                              )}
                            </CodeExecutionResultHeader>
                            <CodeExecutionOutput outcome={codeExecutionResult.outcome}>
                              {codeExecutionResult.output || 'No output'}
                            </CodeExecutionOutput>
                          </CodeExecutionResultSection>
                        )}
                      </CodeExecutionBody>
                    </CodeExecutionSection>
                  )}

                  <StreamingMarkdownRenderer
                    text={mainContentWithoutThinking}
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
                <SourceButton key={`source-${index}`} onClick={() => openExternalUrl(source.url)}>
                  <SourceFavicon src={getFaviconUrl(source.url)} alt="" onError={(e) => e.target.src = 'https://www.google.com/s2/favicons?domain=' + source.url} />
                  {source.domain || extractDomain(source.url)}
                </SourceButton>
              ))}
            </SourcesContainer>
          )}

          {/* Message action buttons - only show for completed AI messages (not loading) */}
          {!isLoading && contentToProcess && role === 'assistant' && (
            <MessageActions role={role} $alignment={messageAlignment}>
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
                    title: t('chat.share.title', 'AI Chat Message'),
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
              <ActionButton onClick={handleReadAloud} title={isSpeaking ? t('chat.actions.stopSpeaking', 'Stop speaking') : t('chat.actions.readAloud', 'Read aloud')}>
                {isSpeaking ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                    <line x1="15" y1="9" x2="9" y2="15" />
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
                  {t('chat.actions.load3d', 'Load in 3D')}
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
