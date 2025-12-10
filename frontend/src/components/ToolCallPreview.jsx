import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';

// Animation keyframes
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
`;

const slideDown = keyframes`
  0% { 
    max-height: 0; 
    opacity: 0; 
    transform: translateY(-10px);
  }
  100% { 
    max-height: 300px; 
    opacity: 1; 
    transform: translateY(0);
  }
`;

const slideUp = keyframes`
  0% { 
    max-height: 300px; 
    opacity: 1; 
    transform: translateY(0);
  }
  100% { 
    max-height: 0; 
    opacity: 0; 
    transform: translateY(-10px);
  }
`;

// Styled components
const ToolCallContainer = styled.div`
  margin: 12px 0;
  background: ${props => props.theme.name === 'light' ? 'rgba(248, 249, 250, 0.95)' : 'rgba(32, 33, 36, 0.95)'};
  border: 1px solid ${props => props.theme.border};
  border-radius: 12px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  &:hover {
    border-color: ${props => props.theme.primary};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
`;

const ToolCallHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  user-select: none;
  border-bottom: ${props => props.expanded ? `1px solid ${props.theme.border}` : 'none'};
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.name === 'light' ? 'rgba(240, 241, 242, 0.8)' : 'rgba(45, 46, 50, 0.8)'};
  }
`;

const ToolIcon = styled.div`
  width: 24px;
  height: 24px;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: ${props => {
    switch (props.status) {
      case 'pending': return '#fbbf24';
      case 'executing': return '#3b82f6';
      case 'completed': return '#10b981';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  }};
  color: white;
  font-size: 12px;
  font-weight: 600;
  
  ${props => props.status === 'executing' && `
    animation: ${pulse} 2s infinite;
  `}
`;

const ToolInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ToolName = styled.div`
  font-weight: 600;
  color: ${props => props.theme.text};
  font-size: 14px;
`;

const ToolStatus = styled.div`
  font-size: 12px;
  color: ${props => props.theme.text}aa;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const StatusIndicator = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => {
    switch (props.status) {
      case 'pending': return '#fbbf24';
      case 'executing': return '#3b82f6';
      case 'completed': return '#10b981';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  }};
  
  ${props => props.status === 'executing' && `
    animation: ${spin} 1s linear infinite;
    border: 2px solid #3b82f6;
    border-top: 2px solid transparent;
    background: transparent;
  `}
`;

const ExpandToggle = styled.div`
  margin-left: 8px;
  transition: transform 0.2s ease;
  transform: ${props => props.expanded ? 'rotate(180deg)' : 'rotate(0deg)'};
  color: ${props => props.theme.text}80;
`;

const ToolCallDetails = styled.div`
  padding: ${props => props.expanded ? '16px' : '0'};
  max-height: ${props => props.expanded ? '300px' : '0'};
  overflow: hidden;
  transition: all 0.3s ease;
  animation: ${props => props.expanded ? slideDown : slideUp} 0.3s ease;
`;

const DetailSection = styled.div`
  margin-bottom: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const DetailLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: ${props => props.theme.text}aa;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const DetailContent = styled.div`
  background: ${props => props.theme.name === 'light' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(20, 21, 24, 0.6)'};
  border: 1px solid ${props => props.theme.border}50;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: ${props => props.theme.text};
  font-family: 'SF Mono', SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 120px;
  overflow-y: auto;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.border};
    border-radius: 2px;
  }
`;

const ExecutionTime = styled.div`
  font-size: 11px;
  color: ${props => props.theme.text}60;
  font-weight: 500;
`;

const CopyButton = styled.button`
  background: none;
  border: 1px solid ${props => props.theme.border};
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 11px;
  color: ${props => props.theme.text}80;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.name === 'light' ? 'rgba(240, 241, 242, 0.8)' : 'rgba(45, 46, 50, 0.8)'};
    color: ${props => props.theme.text};
  }
`;

const ToolCallPreview = ({ toolCall, theme }) => {
  const [expanded, setExpanded] = useState(false);
  
  const {
    tool_id,
    tool_name,
    status = 'pending',
    parameters = {},
    result,
    error,
    execution_time,
    timestamp
  } = toolCall;

  const getStatusText = () => {
    switch (status) {
      case 'pending': return 'Waiting to execute...';
      case 'executing': return 'Running...';
      case 'completed': return `Completed${execution_time ? ` in ${execution_time}ms` : ''}`;
      case 'error': return 'Failed';
      default: return 'Unknown status';
    }
  };

  const getToolIcon = () => {
    switch (status) {
      case 'pending': return '⏳';
      case 'executing': return '⚡';
      case 'completed': return '✓';
      case 'error': return '✗';
      default: return '🔧';
    }
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
      console.log('Copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  const formatObject = (obj) => {
    if (typeof obj === 'string') return obj;
    return JSON.stringify(obj, null, 2);
  };

  return (
    <ToolCallContainer theme={theme}>
      <ToolCallHeader expanded={expanded} onClick={toggleExpanded} theme={theme}>
        <ToolIcon status={status}>
          {getToolIcon()}
        </ToolIcon>
        <ToolInfo>
          <ToolName theme={theme}>{tool_name || 'Unknown Tool'}</ToolName>
          <ToolStatus theme={theme}>
            <StatusIndicator status={status} />
            {getStatusText()}
          </ToolStatus>
        </ToolInfo>
        <ExpandToggle expanded={expanded} theme={theme}>
          ▼
        </ExpandToggle>
      </ToolCallHeader>
      
      {expanded && (
        <ToolCallDetails expanded={expanded}>
          {Object.keys(parameters).length > 0 && (
            <DetailSection>
              <DetailLabel theme={theme}>Parameters</DetailLabel>
              <DetailContent theme={theme}>
                {formatObject(parameters)}
              </DetailContent>
              <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'flex-end' }}>
                <CopyButton 
                  onClick={() => copyToClipboard(formatObject(parameters))}
                  theme={theme}
                >
                  Copy
                </CopyButton>
              </div>
            </DetailSection>
          )}
          
          {result && (
            <DetailSection>
              <DetailLabel theme={theme}>Result</DetailLabel>
              <DetailContent theme={theme}>
                {formatObject(result)}
              </DetailContent>
              <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'flex-end' }}>
                <CopyButton 
                  onClick={() => copyToClipboard(formatObject(result))}
                  theme={theme}
                >
                  Copy
                </CopyButton>
              </div>
            </DetailSection>
          )}
          
          {error && (
            <DetailSection>
              <DetailLabel theme={theme} style={{ color: '#ef4444' }}>Error</DetailLabel>
              <DetailContent theme={theme} style={{ borderColor: '#ef444450', color: '#ef4444' }}>
                {error}
              </DetailContent>
            </DetailSection>
          )}
          
          <DetailSection>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <DetailLabel theme={theme}>Tool ID</DetailLabel>
                <div style={{ fontSize: '11px', fontFamily: 'monospace', color: theme.text + '80' }}>
                  {tool_id}
                </div>
              </div>
              {execution_time && (
                <ExecutionTime theme={theme}>
                  {execution_time}ms
                </ExecutionTime>
              )}
            </div>
          </DetailSection>
        </ToolCallDetails>
      )}
    </ToolCallContainer>
  );
};

export default ToolCallPreview;