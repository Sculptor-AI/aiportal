import React, { useState } from 'react';
import styled from 'styled-components';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark, atomOneLight } from 'react-syntax-highlighter/dist/esm/styles/hljs';

const Container = styled.div`
  position: relative;
  margin: 16px 0;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  background: ${props => props.theme.name.includes('dark') || props.theme.name === 'oled' ? '#1e1e1e' : '#f8f8f8'};
  border: 1px solid ${props => props.theme.name.includes('dark') || props.theme.name === 'oled' ? '#333' : '#e0e0e0'};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: ${props => props.theme.name.includes('dark') || props.theme.name === 'oled' ? '#2d2d2d' : '#f0f0f0'};
  border-bottom: 1px solid ${props => props.theme.name.includes('dark') || props.theme.name === 'oled' ? '#333' : '#e0e0e0'};
`;

const Language = styled.span`
  font-size: 0.85rem;
  font-weight: 500;
  color: ${props => props.theme.text};
  opacity: 0.8;
`;

const CopyButton = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.theme.primary};
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  padding: 2px 5px;
  transition: all 0.2s ease;
  
  &:hover {
    opacity: 0.8;
  }
`;

// Custom styles to override react-syntax-highlighter defaults
const customStyleOverrides = {
  fontSize: '14px',
  fontFamily: "'SF Mono', Menlo, Monaco, 'Courier New', monospace",
  lineHeight: '1.5',
  padding: '16px',
  borderRadius: '0 0 10px 10px',
};

// Apply high contrast modifications if needed
const getHighContrastStyles = (isHighContrast) => {
  if (isHighContrast) {
    return {
      backgroundColor: '#000000',
      color: '#ffffff',
      border: '2px solid #ffffff',
    };
  }
  return {};
};

const CodeBlock = ({ 
  language = 'javascript', 
  value, 
  enableSyntaxHighlighting = true,
  settings = {}
}) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Format language for display
  const displayLanguage = language === 'js' ? 'javascript' : 
                          language === 'ts' ? 'typescript' :
                          language;
  
  // Check settings
  const codeHighlighting = settings.codeHighlighting !== false;
  const highContrast = settings.highContrast || false;
  const reducedMotion = settings.reducedMotion || false;
  
  // Apply high contrast styles if needed
  const contrastStyles = getHighContrastStyles(highContrast);
  
  return (
    <Container style={contrastStyles}>
      <Header style={contrastStyles}>
        <Language>{displayLanguage}</Language>
        <CopyButton 
          onClick={handleCopy}
          style={highContrast ? { color: '#ffffff' } : {}}
        >
          {copied ? 'Copied!' : 'Copy code'}
        </CopyButton>
      </Header>
      {(enableSyntaxHighlighting && codeHighlighting) ? (
        <SyntaxHighlighter
          language={language}
          style={highContrast ? {
            ...atomOneDark,
            hljs: { 
              background: '#000', 
              color: '#fff'
            }
          } : atomOneDark}
          customStyle={{
            ...customStyleOverrides,
            ...contrastStyles,
            transition: reducedMotion ? 'none' : 'all 0.2s ease'
          }}
        >
          {value}
        </SyntaxHighlighter>
      ) : (
        <pre style={{ 
          ...customStyleOverrides, 
          ...contrastStyles,
          margin: 0,
          transition: reducedMotion ? 'none' : 'all 0.2s ease'
        }}>
          {value}
        </pre>
      )}
    </Container>
  );
};

export default CodeBlock;