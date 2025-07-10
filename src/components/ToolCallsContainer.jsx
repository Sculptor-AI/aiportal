import React, { useState, useEffect, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import ToolCallPreview from './ToolCallPreview';

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const Container = styled.div`
  margin: 8px 0;
  animation: ${slideIn} 0.3s ease-out;
`;

const SummaryHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: ${props => props.theme.name === 'light' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.2)'};
  border: 1px solid ${props => props.theme.name === 'light' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.4)'};
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.theme.name === 'light' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.25)'};
  }
`;

const SummaryInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SummaryIcon = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: #3b82f6;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
`;

const SummaryText = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme.text};
`;

const StatusCounts = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const StatusCount = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: ${props => props.theme.text}aa;
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
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
`;

const ToggleButton = styled.div`
  transition: transform 0.2s ease;
  transform: ${props => props.expanded ? 'rotate(180deg)' : 'rotate(0deg)'};
  color: ${props => props.theme.text}80;
  font-size: 12px;
`;

const ToolCallsList = styled.div`
  max-height: ${props => props.expanded ? '1000px' : '0'};
  overflow: hidden;
  transition: max-height 0.3s ease;
`;

const ToolCallsContainer = ({ toolCalls = [], theme, defaultExpanded = true }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [toolStates, setToolStates] = useState(new Map());

  // Update tool states when toolCalls prop changes
  useEffect(() => {
    const newStates = new Map(toolStates);
    
    toolCalls.forEach(toolCall => {
      const { tool_id } = toolCall;
      if (tool_id) {
        newStates.set(tool_id, toolCall);
      }
    });
    
    setToolStates(newStates);
  }, [toolCalls]);

  // Calculate status counts
  const statusCounts = useMemo(() => {
    const counts = {
      pending: 0,
      executing: 0,
      completed: 0,
      error: 0
    };
    
    Array.from(toolStates.values()).forEach(toolCall => {
      const status = toolCall.status || 'pending';
      if (counts.hasOwnProperty(status)) {
        counts[status]++;
      }
    });
    
    return counts;
  }, [toolStates]);

  const totalTools = toolStates.size;
  const hasActiveTools = statusCounts.pending > 0 || statusCounts.executing > 0;

  if (totalTools === 0) {
    return null;
  }

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <Container>
      <SummaryHeader onClick={toggleExpanded} theme={theme}>
        <SummaryInfo>
          <SummaryIcon>
            🔧
          </SummaryIcon>
          <SummaryText theme={theme}>
            {totalTools === 1 ? '1 Tool Call' : `${totalTools} Tool Calls`}
            {hasActiveTools && ' (Active)'}
          </SummaryText>
        </SummaryInfo>
        
        <StatusCounts>
          {statusCounts.executing > 0 && (
            <StatusCount theme={theme}>
              <StatusDot status="executing" />
              {statusCounts.executing} running
            </StatusCount>
          )}
          {statusCounts.pending > 0 && (
            <StatusCount theme={theme}>
              <StatusDot status="pending" />
              {statusCounts.pending} pending
            </StatusCount>
          )}
          {statusCounts.completed > 0 && (
            <StatusCount theme={theme}>
              <StatusDot status="completed" />
              {statusCounts.completed} done
            </StatusCount>
          )}
          {statusCounts.error > 0 && (
            <StatusCount theme={theme}>
              <StatusDot status="error" />
              {statusCounts.error} failed
            </StatusCount>
          )}
          
          <ToggleButton expanded={expanded} theme={theme}>
            ▼
          </ToggleButton>
        </StatusCounts>
      </SummaryHeader>
      
      <ToolCallsList expanded={expanded}>
        {Array.from(toolStates.values()).map((toolCall) => (
          <ToolCallPreview
            key={toolCall.tool_id}
            toolCall={toolCall}
            theme={theme}
          />
        ))}
      </ToolCallsList>
    </Container>
  );
};

export default ToolCallsContainer;