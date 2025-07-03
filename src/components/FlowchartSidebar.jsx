import React from 'react';
import styled from 'styled-components';

const SidebarContainer = styled.div`
  position: absolute;
  top: 80px;
  left: 20px;
  width: 180px;
  background: ${props => props.theme.background};
  border: 1px solid ${props => props.theme.border};
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '8px'};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1001;
  overflow: hidden;
`;

const SidebarHeader = styled.div`
  padding: 12px 16px;
  background: ${props => props.theme.name === 'retro' ? props.theme.buttonFace : props.theme.inputBackground};
  border-bottom: 1px solid ${props => props.theme.border};
`;

const SidebarTitle = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: ${props => props.theme.text};
  font-family: ${props => props.theme.name === 'retro' ? 'MS Sans Serif, sans-serif' : 'inherit'};
`;

const NodeList = styled.div`
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const NodeButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  padding: 10px 12px;
  background: ${props => props.theme.background};
  color: ${props => props.theme.text};
  border: 1px solid ${props => props.theme.border};
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '6px'};
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s ease;
  
  ${props => props.theme.name === 'retro' ? `
    box-shadow: 1px 1px 0 0 ${props.theme.buttonHighlightSoft} inset, -1px -1px 0 0 ${props.theme.buttonShadowSoft} inset;
    
    &:active {
      box-shadow: -1px -1px 0 0 ${props.theme.buttonHighlightSoft} inset, 1px 1px 0 0 ${props.theme.buttonShadowSoft} inset;
      padding: 11px 11px 9px 13px;
    }
  ` : `
    &:hover {
      background: ${props.theme.primary};
      color: white;
      border-color: ${props.theme.primary};
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  `}

  &:focus {
    outline: none;
    ${props => props.theme.name !== 'retro' && `
      box-shadow: 0 0 0 2px ${props.theme.primary}33;
    `}
  }
`;

const NodeIcon = styled.span`
  margin-right: 8px;
  font-size: 16px;
`;

const nodeTypes = [
  { type: 'default', label: 'Process', icon: '□', data: { label: 'Process' } },
  { type: 'input', label: 'Start/Input', icon: '○', data: { label: 'Start' } },
  { type: 'output', label: 'End/Output', icon: '◎', data: { label: 'End' } },
  { type: 'default', label: 'Decision', icon: '◇', data: { label: 'Decision' } },
];

const FlowchartSidebar = ({ onAddNode, theme }) => {
  return (
    <SidebarContainer theme={theme}>
      <SidebarHeader>
        <SidebarTitle>Add Nodes</SidebarTitle>
      </SidebarHeader>
      <NodeList>
        {nodeTypes.map((node, index) => (
          <NodeButton 
            key={index}
            onClick={() => onAddNode(node.type, node.data)}
            theme={theme}
          >
            <NodeIcon>{node.icon}</NodeIcon>
            {node.label}
          </NodeButton>
        ))}
      </NodeList>
    </SidebarContainer>
  );
};

export default FlowchartSidebar;