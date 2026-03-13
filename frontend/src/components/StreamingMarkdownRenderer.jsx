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

// Helper for generating IDs from header text
const slugify = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

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
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0.8em 0 0.3em 0;
  color: ${props => props.theme.text};
  border-bottom: 1px solid ${props => props.theme.border};
  padding-bottom: 0.25rem;
  line-height: 1.3;
  letter-spacing: -0.02em;
  scroll-margin-top: 100px;
  
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
  scroll-margin-top: 100px;
  
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
  scroll-margin-top: 100px;
  
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
  border-left: 3px solid ${props => props.theme.accentColor || props.theme.text}44;
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

  // Custom renderers for markdown elements
  const components = {
    h1: ({node, children, ...props}) => {
      const id = slugify(children?.[0]?.toString());
      return <Heading1 id={id} {...props} theme={theme}>{children}</Heading1>;
    },
    h2: ({node, children, ...props}) => {
      const id = slugify(children?.[0]?.toString());
      return <Heading2 id={id} {...props} theme={theme}>{children}</Heading2>;
    },
    h3: ({node, children, ...props}) => {
      const id = slugify(children?.[0]?.toString());
      return <Heading3 id={id} {...props} theme={theme}>{children}</Heading3>;
    },
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
      return <InlineCode theme={theme}>{children}</InlineCode>;
    },
  };

  return (
    <div style={{ 
      fontFamily: 'inherit', 
      lineHeight: 1.6, 
      wordWrap: 'break-word', 
      whiteSpace: 'normal',
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
