import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { processCodeBlocks } from '../utils/codeBlockProcessor';

// Styled components for the enhanced code block
const CodeBlockContainer = styled.div`
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

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const ActionButton = styled.button`
  background: none;
  border: 1px solid ${props => props.theme.border || 'rgba(0,0,0,0.2)'};
  color: ${props => props.theme.text || '#000'};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.7em;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
  
  &:hover {
    background: ${props => props.theme.text || '#000'}10;
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

const ExecutionResults = styled.div`
  border-top: 1px solid ${props => props.theme.border || 'rgba(0,0,0,0.1)'};
  background: ${props => props.theme.name === 'light' ? 'rgba(248, 250, 252, 0.8)' : 'rgba(25, 25, 25, 0.8)'};
  padding: 12px;
  font-size: 0.85em;
`;

const ResultsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 600;
`;

const ExecutionTime = styled.span`
  font-size: 0.8em;
  color: ${props => props.theme.text || '#000'}80;
`;

const OutputContent = styled.pre`
  margin: 0;
  padding: 8px;
  background: ${props => props.theme.name === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(20, 20, 20, 0.8)'};
  border-radius: 4px;
  border: 1px solid ${props => props.theme.border || 'rgba(0,0,0,0.1)'};
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace;
  font-size: 0.85em;
  line-height: 1.4;
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
`;

const ErrorOutput = styled(OutputContent)`
  color: #e53e3e;
  background: ${props => props.theme.name === 'light' ? 'rgba(254, 242, 242, 0.8)' : 'rgba(45, 25, 25, 0.8)'};
  border-color: #fed7d7;
`;

const SuccessOutput = styled(OutputContent)`
  color: #38a169;
  background: ${props => props.theme.name === 'light' ? 'rgba(240, 253, 244, 0.8)' : 'rgba(25, 45, 25, 0.8)'};
  border-color: #c6f6d5;
`;

const StreamingIndicator = styled.span`
  color: #3182ce;
  animation: pulse 1.5s infinite;
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const CodeBlockWithExecution = ({ 
  language = 'javascript', 
  content, 
  theme = {},
  supportedLanguages = [],
  onExecutionComplete = null
}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [executionTime, setExecutionTime] = useState(null);
  const [streamingOutput, setStreamingOutput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [executionId, setExecutionId] = useState(null);
  const [showResults, setShowResults] = useState(false);
  
  const eventSourceRef = useRef(null);

  // Cleanup event source on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const executeCode = async (useStreaming = false) => {
    if (!content || isExecuting) return;

    setIsExecuting(true);
    setError(null);
    setResult(null);
    setExecutionTime(null);
    setStreamingOutput('');
    setIsStreaming(false);
    setShowResults(true);

    const startTime = Date.now();
    const execId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setExecutionId(execId);

    try {
      if (useStreaming) {
        await executeCodeStreaming(execId);
      } else {
        await executeCodeSync(execId);
      }
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

  const executeCodeStreaming = async (execId) => {
    setIsStreaming(true);

    // Close existing event source if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Create new event source for streaming
    const eventSource = new EventSource(`/api/tools/execute-code/stream`, {
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

    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'connected':
            setStreamingOutput(prev => prev + `Connected to execution server...\n`);
            break;
          case 'execution_started':
            setStreamingOutput(prev => prev + `Execution started...\n`);
            break;
          case 'execution_completed':
            setResult(data.result);
            setStreamingOutput(prev => prev + `\nExecution completed!\n`);
            if (onExecutionComplete) {
              onExecutionComplete(data.result, null, data.execution_time);
            }
            eventSource.close();
            break;
          case 'execution_failed':
            setError(data.error);
            setStreamingOutput(prev => prev + `\nExecution failed: ${data.error}\n`);
            eventSource.close();
            break;
          case 'ping':
            // Keep connection alive
            break;
          default:
            if (data.output) {
              setStreamingOutput(prev => prev + data.output);
            }
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      setError('Streaming connection failed');
      eventSource.close();
    };
  };

  const stopExecution = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsExecuting(false);
    setIsStreaming(false);
    setError('Execution stopped by user');
  };

  const clearResults = () => {
    setResult(null);
    setError(null);
    setExecutionTime(null);
    setStreamingOutput('');
    setIsStreaming(false);
    setShowResults(false);
    setExecutionId(null);
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
    <CodeBlockContainer theme={theme}>
      <CodeHeader theme={theme}>
        <CodeLanguage theme={theme}>
          {getLanguageDisplayName(language)}
        </CodeLanguage>
        <ButtonGroup>
          {isExecutable && (
            <>
              <ActionButton
                onClick={() => executeCode(false)}
                disabled={isExecuting}
                theme={theme}
                title="Run code"
              >
                ▶️ Run
              </ActionButton>
              <ActionButton
                onClick={() => executeCode(true)}
                disabled={isExecuting}
                theme={theme}
                title="Run with streaming output"
              >
                {isStreaming ? <StreamingIndicator>●</StreamingIndicator> : '📡'} Stream
              </ActionButton>
              {isExecuting && (
                <ActionButton
                  onClick={stopExecution}
                  theme={theme}
                  title="Stop execution"
                >
                  ⏹️ Stop
                </ActionButton>
              )}
            </>
          )}
          <ActionButton
            onClick={() => copyToClipboard(content)}
            theme={theme}
            title="Copy code"
          >
            📋 Copy
          </ActionButton>
          {showResults && (
            <ActionButton
              onClick={clearResults}
              theme={theme}
              title="Clear results"
            >
              🗑️ Clear
            </ActionButton>
          )}
        </ButtonGroup>
      </CodeHeader>
      
      <Pre theme={theme}>
        <code>{content}</code>
      </Pre>

      {/* Execution Results */}
      {showResults && (result || error || streamingOutput || isExecuting) && (
        <ExecutionResults theme={theme}>
          <ResultsHeader>
            <span>Execution Results</span>
            {executionTime && (
              <ExecutionTime theme={theme}>
                ⏱️ {executionTime}ms
              </ExecutionTime>
            )}
          </ResultsHeader>

          {/* Streaming Output */}
          {isStreaming && (
            <div>
              <div style={{ marginBottom: '8px', fontWeight: '600' }}>
                Real-time Output {isStreaming && <StreamingIndicator>●</StreamingIndicator>}
              </div>
              <OutputContent theme={theme}>
                {streamingOutput || 'Waiting for output...'}
              </OutputContent>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div>
              <div style={{ marginBottom: '8px', fontWeight: '600', color: '#e53e3e' }}>
                ❌ Error
              </div>
              <ErrorOutput theme={theme}>{error}</ErrorOutput>
            </div>
          )}

          {/* Success Result */}
          {result && result.success && (
            <div>
              <div style={{ marginBottom: '8px', fontWeight: '600', color: '#38a169' }}>
                ✅ Success
              </div>
              {result.output && (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ marginBottom: '4px', fontWeight: '500' }}>Output:</div>
                  <SuccessOutput theme={theme}>{result.output}</SuccessOutput>
                </div>
              )}
              {result.result && (
                <div>
                  <div style={{ marginBottom: '4px', fontWeight: '500' }}>Result:</div>
                  <OutputContent theme={theme}>
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
                ❌ Execution Failed
              </div>
              <ErrorOutput theme={theme}>{result.error}</ErrorOutput>
            </div>
          )}
        </ExecutionResults>
      )}
    </CodeBlockContainer>
  );
};

export default CodeBlockWithExecution; 