import React, { useState } from 'react';
import styled from 'styled-components';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark, atomOneLight } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { executeCode, isLanguageSupported, getLanguageDisplayName, detectLanguage } from '../services/codeExecutionService';

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

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Language = styled.span`
  font-size: 0.85rem;
  font-weight: 500;
  color: ${props => props.theme.text};
  opacity: 0.8;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Button = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.theme.primary};
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  
  &:hover {
    background: ${props => props.theme.name.includes('dark') || props.theme.name === 'oled' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ExecutionResult = styled.div`
  background: ${props => props.theme.name.includes('dark') || props.theme.name === 'oled' ? '#2a2a2a' : '#f5f5f5'};
  border-top: 1px solid ${props => props.theme.name.includes('dark') || props.theme.name === 'oled' ? '#444' : '#e0e0e0'};
  padding: 12px;
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace;
  font-size: 0.85rem;
  line-height: 1.4;
`;

const ResultHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 600;
  color: ${props => props.theme.text};
`;

const ResultContent = styled.pre`
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: ${props => props.theme.text};
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  background: rgba(231, 76, 60, 0.1);
  border: 1px solid rgba(231, 76, 60, 0.3);
  border-radius: 4px;
  padding: 8px;
  margin-top: 8px;
  font-size: 0.85rem;
`;

const SuccessMessage = styled.div`
  color: #27ae60;
  background: rgba(39, 174, 96, 0.1);
  border: 1px solid rgba(39, 174, 96, 0.3);
  border-radius: 4px;
  padding: 8px;
  margin-top: 8px;
  font-size: 0.85rem;
`;

const ExecutionInfo = styled.div`
  font-size: 0.75rem;
  color: ${props => props.theme.text}80;
  margin-top: 8px;
  display: flex;
  gap: 16px;
`;

const Spinner = styled.div`
  width: 12px;
  height: 12px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ExecutableCodeBlock = ({ 
  language = null, 
  value, 
  enableSyntaxHighlighting = true,
  settings = {},
  theme = {}
}) => {
  const [copied, setCopied] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [executionError, setExecutionError] = useState(null);
  
  // Auto-detect language if not provided
  const detectedLanguage = language || detectLanguage(value);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunCode = async () => {
    if (!isLanguageSupported(detectedLanguage)) {
      setExecutionError('This language is not supported for execution');
      return;
    }

    setIsExecuting(true);
    setExecutionError(null);
    setExecutionResult(null);

    try {
      const result = await executeCode(value, detectedLanguage);
      
      if (result.success) {
        setExecutionResult(result);
      } else {
        setExecutionError(result.error);
      }
    } catch (err) {
      setExecutionError(err.message || 'Failed to execute code');
    } finally {
      setIsExecuting(false);
    }
  };
  
  // Format language for display
  const displayLanguage = getLanguageDisplayName(detectedLanguage);
  const isSupported = isLanguageSupported(detectedLanguage);
  
  // Check settings
  const codeHighlighting = settings.codeHighlighting !== false;
  const highContrast = settings.highContrast || false;
  const reducedMotion = settings.reducedMotion || false;
  
  // Apply high contrast styles if needed
  const contrastStyles = highContrast ? {
    backgroundColor: '#000000',
    color: '#ffffff',
    border: '2px solid #ffffff',
  } : {};
  
  return (
    <Container style={contrastStyles}>
      <Header style={contrastStyles}>
        <HeaderLeft>
          <Language>{displayLanguage}</Language>
        </HeaderLeft>
        <HeaderRight>
          {isSupported && (
            <Button 
              onClick={handleRunCode}
              disabled={isExecuting}
              style={highContrast ? { color: '#ffffff' } : {}}
            >
              {isExecuting ? (
                <>
                  <Spinner />
                  Running...
                </>
              ) : (
                <>
                  ▶️ Run
                </>
              )}
            </Button>
          )}
          <Button 
            onClick={handleCopy}
            style={highContrast ? { color: '#ffffff' } : {}}
          >
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </HeaderRight>
      </Header>
      
      {(enableSyntaxHighlighting && codeHighlighting) ? (
        <SyntaxHighlighter
          language={detectedLanguage}
          style={highContrast ? {
            ...atomOneDark,
            hljs: { 
              background: '#000', 
              color: '#fff'
            }
          } : atomOneDark}
          customStyle={{
            fontSize: '14px',
            fontFamily: "'SF Mono', Menlo, Monaco, 'Courier New', monospace",
            lineHeight: '1.5',
            padding: '16px',
            borderRadius: '0',
            margin: 0,
            ...contrastStyles,
            transition: reducedMotion ? 'none' : 'all 0.2s ease'
          }}
        >
          {value}
        </SyntaxHighlighter>
      ) : (
        <pre style={{ 
          fontSize: '14px',
          fontFamily: "'SF Mono', Menlo, Monaco, 'Courier New', monospace",
          lineHeight: '1.5',
          padding: '16px',
          margin: 0,
          ...contrastStyles,
          transition: reducedMotion ? 'none' : 'all 0.2s ease'
        }}>
          {value}
        </pre>
      )}
      
      {/* Execution Results */}
      {executionResult && (
        <ExecutionResult theme={theme}>
          <ResultHeader theme={theme}>
            <span>Output</span>
            <span>✓ Execution Complete</span>
          </ResultHeader>
          <ResultContent theme={theme}>
            {executionResult.output}
          </ResultContent>
          {executionResult.error && (
            <ErrorMessage>
              <strong>Error:</strong> {executionResult.error}
            </ErrorMessage>
          )}
          {executionResult.result !== undefined && executionResult.result !== null && (
            <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px' }}>
              <strong>Return Value:</strong>
              <pre style={{ margin: '4px 0 0 0', fontSize: '0.8rem' }}>
                {typeof executionResult.result === 'object' 
                  ? JSON.stringify(executionResult.result, null, 2)
                  : String(executionResult.result)
                }
              </pre>
            </div>
          )}
          <ExecutionInfo theme={theme}>
            <span>Execution time: {executionResult.executionTime}ms</span>
            {executionResult.executionId && (
              <span>ID: {executionResult.executionId}</span>
            )}
          </ExecutionInfo>
        </ExecutionResult>
      )}
      
      {executionError && (
        <ExecutionResult theme={theme}>
          <ResultHeader theme={theme}>
            <span>Error</span>
            <span>✗ Execution Failed</span>
          </ResultHeader>
          <ErrorMessage>
            {executionError}
          </ErrorMessage>
        </ExecutionResult>
      )}
    </Container>
  );
};

export default ExecutableCodeBlock; 