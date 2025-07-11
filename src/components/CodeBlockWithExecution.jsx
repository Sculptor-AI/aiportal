import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { processCodeBlocks } from '../utils/codeBlockProcessor';

// Styled components for the enhanced code block
const CodeBlockContainer = styled.div`
  background: ${props => props.theme?.cardBackground || (props.theme?.name === 'dark' || props.theme?.name === 'oled' ? '#1e1e1e' : '#f8f8f8')};
  border: 1px solid ${props => props.theme?.border || (props.theme?.name === 'dark' || props.theme?.name === 'oled' ? '#333' : '#e0e0e0')};
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
  background: ${props => props.theme?.name === 'dark' || props.theme?.name === 'oled' ? '#2d2d2d' : '#f0f0f0'};
  border-bottom: 1px solid ${props => props.theme?.border || (props.theme?.name === 'dark' || props.theme?.name === 'oled' ? '#333' : '#e0e0e0')};
  font-size: 0.8em;
`;

const CodeLanguage = styled.span`
  color: ${props => props.theme?.text || '#000000'} !important;
  font-weight: 500;
  text-transform: uppercase;
  font-size: 0.75em;
  letter-spacing: 0.5px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const ActionButton = styled.button`
  background: none;
  border: 1px solid ${props => props.theme?.border || 'rgba(0,0,0,0.2)'};
  color: ${props => props.theme?.text || '#000000'} !important;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.7em;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
  
  &:hover {
    background: ${props => (props.theme?.text || '#000000') + '10'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Pre = styled.pre`
  margin: 0;
  padding: 12px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  background: none;
  color: ${props => props.theme?.text || '#000000'} !important;
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
  
  code {
    color: inherit !important;
    background: none !important;
  }
`;

const ExecutionResults = styled.div`
  border-top: 1px solid ${props => props.theme?.border || (props.theme?.name === 'dark' || props.theme?.name === 'oled' ? '#333' : '#e0e0e0')};
  background: ${props => props.theme?.name === 'dark' || props.theme?.name === 'oled' ? '#2d2d2d' : '#f0f0f0'};
  padding: 12px;
  font-size: 0.85em;
`;

const ResultsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 600;
  color: ${props => props.theme?.text || '#000000'} !important;
`;

const ExecutionTime = styled.span`
  font-size: 0.8em;
  color: ${props => (props.theme?.text || '#000000') + '80'} !important;
`;

const OutputContent = styled.pre`
  margin: 0;
  padding: 8px;
  background: ${props => props.theme?.cardBackground || (props.theme?.name === 'dark' || props.theme?.name === 'oled' ? '#1e1e1e' : '#ffffff')};
  border-radius: 4px;
  border: 1px solid ${props => props.theme?.border || (props.theme?.name === 'dark' || props.theme?.name === 'oled' ? '#333' : '#e0e0e0')};
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace;
  font-size: 0.85em;
  line-height: 1.4;
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: ${props => props.theme?.text || '#000000'} !important;
`;

const ErrorOutput = styled(OutputContent)`
  color: #e53e3e !important;
  background: ${props => props.theme?.name === 'dark' || props.theme?.name === 'oled' ? 'rgba(45, 25, 25, 0.8)' : 'rgba(254, 242, 242, 0.8)'};
  border-color: #fed7d7;
`;

const SuccessOutput = styled(OutputContent)`
  color: #38a169 !important;
  background: ${props => props.theme?.name === 'dark' || props.theme?.name === 'oled' ? 'rgba(25, 45, 25, 0.8)' : 'rgba(240, 253, 244, 0.8)'};
  border-color: #c6f6d5;
`;



const CodeBlockWithExecution = ({ 
  language = 'javascript', 
  content, 
  theme = {},
  supportedLanguages = [],
  onExecutionComplete = null
}) => {
  // Preserve original theme values, only add minimal fallbacks
  const safeTheme = {
    ...theme,
    name: theme.name || 'light',
    text: theme.text || (theme.name === 'dark' ? '#ffffff' : '#000000'),
    border: theme.border || 'rgba(0,0,0,0.1)'
  };
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [executionTime, setExecutionTime] = useState(null);
  const [showResults, setShowResults] = useState(false);

  const executeCode = async () => {
    if (!content || isExecuting) return;

    setIsExecuting(true);
    setError(null);
    setResult(null);
    setExecutionTime(null);
    setShowResults(true);

    const startTime = Date.now();
    const execId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      await executeCodeSync(execId);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsExecuting(false);
      const endTime = Date.now();
      setExecutionTime(endTime - startTime);
    }
  };

  const executeCodeSync = async (execId) => {
    const response = await fetch('/api/tools/execute-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: content,
        language: language,
        execution_id: execId
      })
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Code execution failed');
    }

    setResult(data.result);
    
    if (onExecutionComplete) {
      onExecutionComplete(data.result, null, data.execution_time);
    }
  };



  const clearResults = () => {
    setResult(null);
    setError(null);
    setExecutionTime(null);
    setShowResults(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const getLanguageDisplayName = (langId) => {
    const lang = supportedLanguages.find(l => l.id === langId);
    return lang ? lang.name : langId;
  };

  const isExecutable = supportedLanguages.some(lang => lang.id === language);

  return (
    <CodeBlockContainer theme={safeTheme}>
      <CodeHeader theme={safeTheme}>
        <CodeLanguage theme={safeTheme}>
          {getLanguageDisplayName(language)}
        </CodeLanguage>
        <ButtonGroup>
          {isExecutable && (
            <>
              <ActionButton
                onClick={executeCode}
                disabled={isExecuting}
                theme={safeTheme}
                title="Run code"
              >
                {isExecuting ? 'Running...' : 'Run'}
              </ActionButton>
            </>
          )}
          <ActionButton
            onClick={() => copyToClipboard(content)}
            theme={safeTheme}
            title="Copy code"
          >
            Copy
          </ActionButton>
          {showResults && (
            <ActionButton
              onClick={clearResults}
              theme={safeTheme}
              title="Clear results"
            >
              Clear
            </ActionButton>
          )}
        </ButtonGroup>
      </CodeHeader>
      
      <Pre theme={safeTheme}>
        <code>{content}</code>
      </Pre>

      {/* Execution Results */}
      {showResults && (result || error || isExecuting) && (
        <ExecutionResults theme={safeTheme}>
          <ResultsHeader theme={safeTheme}>
            <span>Execution Results</span>
            {executionTime && (
              <ExecutionTime theme={safeTheme}>
                {executionTime}ms
              </ExecutionTime>
            )}
          </ResultsHeader>

          {/* Error Display */}
          {error && (
            <div>
              <div style={{ marginBottom: '8px', fontWeight: '600', color: '#e53e3e' }}>
                Error
              </div>
              <ErrorOutput theme={safeTheme}>{error}</ErrorOutput>
            </div>
          )}

          {/* Success Result */}
          {result && result.success && (
            <div>
              <div style={{ marginBottom: '8px', fontWeight: '600', color: '#38a169' }}>
                Success
              </div>
              {result.output && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ marginBottom: '4px', fontWeight: '500' }}>Output:</div>
                  <SuccessOutput theme={safeTheme}>{result.output}</SuccessOutput>
                </div>
              )}
              {result.result && (
                <div>
                  <div style={{ marginBottom: '4px', fontWeight: '500' }}>Result:</div>
                  <OutputContent theme={safeTheme}>
                    {JSON.stringify(result.result, null, 2)}
                  </OutputContent>
                </div>
              )}
            </div>
          )}

          {/* Failed Result */}
          {result && !result.success && (
            <div>
              <div style={{ marginBottom: '8px', fontWeight: '600', color: '#e53e3e' }}>
                Execution Failed
              </div>
              <ErrorOutput theme={safeTheme}>{result.error}</ErrorOutput>
            </div>
          )}
        </ExecutionResults>
      )}
    </CodeBlockContainer>
  );
};

export default CodeBlockWithExecution; 