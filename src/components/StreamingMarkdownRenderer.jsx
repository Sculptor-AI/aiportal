import React from 'react';
import styled, { keyframes } from 'styled-components';
import ReactKatex from '@pkasila/react-katex';
import 'katex/dist/katex.min.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { processCodeBlocks } from '../utils/codeBlockProcessor';
import CodeBlockWithExecution from './CodeBlockWithExecution';
import useSupportedLanguages from '../hooks/useSupportedLanguages';

// Styled components for markdown formatting aligned with design language
const Bold = styled.span`
  font-weight: 700;
  color: ${props => props.theme.text};
`;

const Italic = styled.span`
  font-style: italic;
  color: ${props => props.theme.text};
`;

const Heading1 = styled.h1`
  font-size: 1.6rem;
  font-weight: 700;
  margin: 0;
  color: ${props => props.theme.text};
  border-bottom: 2px solid ${props => props.theme.border};
  padding-bottom: 0.3rem;
  line-height: 1.3;
  
  &:first-child {
    margin-top: 0;
  }
`;

const Heading2 = styled.h2`
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0;
  color: ${props => props.theme.text};
  border-bottom: 1px solid ${props => props.theme.border};
  padding-bottom: 0.2rem;
  line-height: 1.3;
  
  &:first-child {
    margin-top: 0;
  }
`;

const Heading3 = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  color: ${props => props.theme.text};
  line-height: 1.3;
  
  &:first-child {
    margin-top: 0;
  }
`;

const Heading4 = styled.h4`
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: ${props => props.theme.text};
  line-height: 1.3;
  
  &:first-child {
    margin-top: 0;
  }
`;

const Heading5 = styled.h5`
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0;
  color: ${props => props.theme.text};
  line-height: 1.3;
  
  &:first-child {
    margin-top: 0;
  }
`;

const Heading6 = styled.h6`
  font-size: 0.85rem;
  font-weight: 600;
  margin: 0;
  color: ${props => props.theme.text};
  line-height: 1.3;
  
  &:first-child {
    margin-top: 0;
  }
`;

const Paragraph = styled.p`
  margin: 0;
  line-height: 1.5;
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
  margin: 0;
  
  li {
    position: relative;
    padding-left: 1.2em;
    margin: 0;
    line-height: 1.5;
    color: ${props => props.theme.text};
    
    &:before {
      content: "•";
      position: absolute;
      left: 0.2em;
      color: ${props => props.theme.primary};
      font-weight: bold;
      font-size: 1.1em;
    }
  }
`;

const NumberedList = styled.ol`
  padding-left: 1.2em;
  margin: 0;
  
  li {
    margin: 0;
    line-height: 1.5;
    color: ${props => props.theme.text};
  }
`;

const Blockquote = styled.blockquote`
  border-left: 4px solid ${props => props.theme.primary};
  margin: 0.5rem 0;
  padding: 0.4rem 0 0.4rem 1rem;
  background: ${props => props.theme.name === 'light' ? 'rgba(0, 122, 255, 0.05)' : 'rgba(10, 132, 255, 0.1)'};
  border-radius: 0 8px 8px 0;
  font-style: italic;
  color: ${props => props.theme.text};
  
  p {
    margin: 0;
    line-height: 1.5;
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
  margin: 0.5rem 0;
  border: 1px solid ${props => props.theme.border};
  border-radius: 8px;
  overflow: hidden;
  background: ${props => props.theme.name === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(30, 30, 30, 0.8)'};
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
`;

const TableHeader = styled.th`
  background: ${props => props.theme.name === 'light' ? 'rgba(240, 240, 240, 0.8)' : 'rgba(45, 45, 45, 0.8)'};
  padding: 8px 10px;
  text-align: left;
  font-weight: 600;
  color: ${props => props.theme.text};
  border-bottom: 1px solid ${props => props.theme.border};
`;

const TableCell = styled.td`
  padding: 8px 10px;
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

const CodeBlock = styled.div`
  background: ${props => props.theme.name === 'light' ? 'rgba(246, 248, 250, 0.9)' : 'rgba(30, 30, 30, 0.9)'};
  border: 1px solid ${props => props.theme.border};
  border-radius: 12px;
  overflow: hidden;
  margin: 0.5rem 0;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace;
  font-size: 0.9em;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
`;

const CodeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: ${props => props.theme.name === 'light' ? 'rgba(240, 240, 240, 0.8)' : 'rgba(45, 45, 45, 0.8)'};
  border-bottom: 1px solid ${props => props.theme.border};
  font-size: 0.8em;
`;

const CodeLanguage = styled.span`
  color: ${props => props.theme.text};
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75em;
  letter-spacing: 0.5px;
`;

const CopyButton = styled.button`
  background: none;
  border: 1px solid ${props => props.theme.border};
  color: ${props => props.theme.primary};
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.7em;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  
  &:hover {
    background: ${props => props.theme.primary}10;
    border-color: ${props => props.theme.primary};
  }
`;

const Pre = styled.pre`
  margin: 0;
  padding: 10px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  background: none;
  color: ${props => props.theme.text};
  line-height: 1.4;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    height: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0,0,0,0.1);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.border};
    border-radius: 4px;
  }
`;

const InlineCode = styled.code`
  background: ${props => props.theme.name === 'light' ? 'rgba(246, 248, 250, 0.8)' : 'rgba(30, 30, 30, 0.8)'};
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace;
  font-size: 0.9em;
  border: 1px solid ${props => props.theme.border};
  color: ${props => props.theme.text};
`;

const HorizontalRule = styled.hr`
  border: none;
  height: 1px;
  background: ${props => props.theme.border};
  margin: 1rem 0;
  border-radius: 1px;
`;

const Cursor = styled.span`
  opacity: ${props => props.$show ? 1 : 0};
  transition: opacity 0.1s ease-in-out;
  color: ${props => props.theme.text};
  animation: blink 1s infinite;

  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
`;

const Strikethrough = styled.del`
  text-decoration: line-through;
  color: ${props => props.theme.text};
`;

// Process inline formatting (bold, italic, inline code, links)
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

// Process bold, italic, and links
const processTextFormatting = (text, theme) => {
  if (!text) return text;
  
  const parts = [];
  let lastIndex = 0;
  
  // Handle links first
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  
  while ((match = linkPattern.exec(text)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      const beforeText = text.substring(lastIndex, match.index);
      parts.push(<span key={`text-${lastIndex}`}>{processBoldItalic(beforeText, theme)}</span>);
    }
    
    // Add the link
    parts.push(
      <Link key={`link-${match.index}`} href={match[2]} target="_blank" rel="noopener noreferrer" theme={theme}>
        {processBoldItalic(match[1], theme)}
      </Link>
    );
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add any remaining text
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    parts.push(<span key={`text-${lastIndex}`}>{processBoldItalic(remainingText, theme)}</span>);
  }
  
  return parts.length > 0 ? <>{parts}</> : processBoldItalic(text, theme);
};

// Process bold and italic formatting
const processBoldItalic = (text, theme) => {
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
    parts.push(<Bold key={`bold-${match.index}`} theme={theme}>{processItalic(match[1], theme)}</Bold>);
    
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
  
  const italicPattern = /\*((?!\*).+?)\*/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  
  while ((match = italicPattern.exec(text)) !== null) {
    // Add text before the italic part
    if (match.index > lastIndex) {
      parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex, match.index)}</span>);
    }
    
    // Add the italic text
    parts.push(<Italic key={`italic-${match.index}`} theme={theme}>{match[1]}</Italic>);
    
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
  theme = {},
  enableCodeExecution = true
}) => {
  const { supportedLanguages, isLanguageExecutable } = useSupportedLanguages();

  if (!text) {
    return isStreaming && showCursor ? <Cursor $show={true} theme={theme}>|</Cursor> : null;
  }

  // Helper to render LaTeX
  const renderLatex = (latex, displayMode) => (
    <ReactKatex key={`latex-${Math.random()}`} displayMode={displayMode}>
      {latex}
    </ReactKatex>
  );

  // Custom renderers for markdown elements
  const components = {
    h1: props => <Heading1 {...props} theme={theme} />,
    h2: props => <Heading2 {...props} theme={theme} />,
    h3: props => <Heading3 {...props} theme={theme} />,
    h4: props => <Heading4 {...props} theme={theme} />,
    h5: props => <Heading5 {...props} theme={theme} />,
    h6: props => <Heading6 {...props} theme={theme} />,
    p: props => <Paragraph {...props} theme={theme} />,
    ul: props => <BulletList {...props} theme={theme} />,
    ol: props => <NumberedList {...props} theme={theme} />,
    li: props => <li {...props} style={{ color: theme.text }} />,
    blockquote: props => <Blockquote {...props} theme={theme} />,
    a: props => <Link {...props} theme={theme} />,
    table: props => <Table {...props} theme={theme} />,
    th: props => <TableHeader {...props} theme={theme} />,
    td: props => <TableCell {...props} theme={theme} />,
    del: props => <Strikethrough {...props} theme={theme} />,
    code({node, inline, className, children, ...props}) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      if (!inline) {
        // Use CodeBlockWithExecution for executable code
        if (enableCodeExecution && isLanguageExecutable && isLanguageExecutable(language)) {
          return (
            <CodeBlockWithExecution
              language={language}
              content={String(children).replace(/\n$/, '')}
              theme={theme}
              supportedLanguages={supportedLanguages}
            />
          );
        }
        // Otherwise, use styled code block
        return (
          <CodeBlock key={`code-block-${Math.random()}`} theme={theme}>
            <CodeHeader theme={theme}>
              <CodeLanguage theme={theme}>{language}</CodeLanguage>
              <CopyButton theme={theme} onClick={() => navigator.clipboard.writeText(String(children).replace(/\n$/, ''))}>
                Copy
              </CopyButton>
            </CodeHeader>
            <Pre theme={theme}>
              <code className={className} style={{ color: theme.text }}>{children}</code>
            </Pre>
          </CodeBlock>
        );
      }
      // Inline code
      return <InlineCode theme={theme}>{children}</InlineCode>;
    },
    // Optionally, add math/latex support here if you want to parse $...$ and $$...$$
  };

  return (
    <div style={{ 
      fontFamily: 'inherit', 
      lineHeight: 1.5, 
      wordWrap: 'break-word', 
      whiteSpace: 'pre-wrap',
      color: theme.text || '#000'
    }}>
      <ReactMarkdown
        children={text}
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      />
      {isStreaming && showCursor && (
        <Cursor $show={true} theme={theme}>|</Cursor>
      )}
    </div>
  );
};

export default StreamingMarkdownRenderer;