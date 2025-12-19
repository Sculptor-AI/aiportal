import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { toPng } from 'html-to-image';
import { parseFlowchartInstructions, parseAIFlowchartResponse, validateFlowchartInstructions } from '../utils/flowchartTools';
import { useTranslation } from '../contexts/TranslationContext';

// --- Styled Components (Glassmorphism) ---

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  opacity: ${props => props.$isOpen ? 1 : 0};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;
`;

const ModalContainer = styled.div`
  background: ${props => props.theme.background};
  border-radius: 20px;
  width: 95vw;
  height: 90vh;
  max-width: 1600px;
  max-height: 1000px;
  display: flex;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
  border: 1px solid ${props => props.theme.border};
  overflow: hidden;
  position: relative;
  transform: ${props => props.$isOpen ? 'scale(1)' : 'scale(0.95)'};
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
`;

const Sidebar = styled.div`
  width: 250px;
  background: ${props => props.theme.sidebar};
  border-right: 1px solid ${props => props.theme.border};
  display: flex;
  flex-direction: column;
  z-index: 10;
  backdrop-filter: blur(20px);
`;

const SidebarHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid ${props => props.theme.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  background: linear-gradient(135deg, ${props => props.theme.primary}, ${props => props.theme.secondary});
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 2px 10px rgba(0,0,0,0.1);
`;

const TitleText = styled.span`
  color: ${props => props.theme.text};
`;

const SidebarContent = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
`;

const NodeButton = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: ${props => props.theme.inputBackground};
  border: 1px solid ${props => props.theme.border};
  border-radius: 12px;
  cursor: grab;
  color: ${props => props.theme.text};
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    border-color: ${props => props.theme.primary};
    background: ${props => props.theme.primary}10;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  }

  &:active {
    cursor: grabbing;
  }
`;

const MainContent = styled.div`
  flex: 1;
  position: relative;
  background: #f8f9fa; /* Light grid background */
`;

const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.theme.inputBackground};
  border: 1px solid ${props => props.theme.border};
  color: ${props => props.theme.text};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 20;
  transition: all 0.2s;
  font-size: 24px;
  line-height: 1;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);

  &:hover {
    background: ${props => props.theme.border};
    transform: rotate(90deg);
  }
`;

const ToolbarOverlay = styled.div`
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12px;
  padding: 10px;
  background: ${props => props.theme.inputBackground};
  border: 1px solid ${props => props.theme.border};
  border-radius: 100px; // Pill shape
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  z-index: 10;
  backdrop-filter: blur(12px);
`;

const ToolButton = styled.button`
  padding: 8px 16px;
  border-radius: 20px;
  border: none;
  background: ${props => props.$primary ? props.theme.primary : 'transparent'};
  color: ${props => props.$primary ? 'white' : props.theme.text};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.$primary ? props.theme.primaryDark : props.theme.border};
  }
`;

// --- Custom Node ---

const NodeWrapper = styled.div`
  padding: 10px 20px;
  border-radius: 8px;
  background: white;
  border: 2px solid #333;
  min-width: 120px;
  text-align: center;
  font-family: inherit;
  font-size: 14px;
  position: relative;
  transition: all 0.2s;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);

  ${props => props.$selected && `
    border-color: ${props.theme.primary};
    box-shadow: 0 0 0 2px ${props.theme.primary}40;
  `}
`;

const NodeInput = styled.input`
  border: none;
  background: transparent;
  width: 100%;
  text-align: center;
  outline: none;
  font-family: inherit;
  font-weight: 500;
`;

const CustomNode = ({ data, selected }) => {
  const [label, setLabel] = useState(data.label);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const onBlur = () => {
    setIsEditing(false);
    data.onLabelChange && data.onLabelChange(label);
  };

  return (
    <NodeWrapper $selected={selected}>
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      <div onDoubleClick={() => setIsEditing(true)}>
        {isEditing ? (
          <NodeInput
            ref={inputRef}
            value={label}
            onChange={e => setLabel(e.target.value)}
            onBlur={onBlur}
            onKeyDown={e => e.key === 'Enter' && onBlur()}
          />
        ) : (
          label
        )}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </NodeWrapper>
  );
};

const nodeTypes = {
  default: CustomNode,
  input: CustomNode,
  output: CustomNode,
};

// --- Main Components ---

const FlowchartModal = ({ isOpen, onClose, onSubmit, theme, aiFlowchartData }) => {
  const { t } = useTranslation();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  // Initialize - removed auto-creation of Start Node

  // Update node helpers
  const onNodeLabelChange = useCallback((id, newLabel) => {
    setNodes((nds) => nds.map((node) => {
      if (node.id === id) {
        node.data = { ...node.data, label: newLabel };
      }
      return node;
    }));
  }, [setNodes]);

  // Apply wrapper to nodes
  const nodesWithHandler = useMemo(() => {
    return nodes.map(node => ({
      ...node,
      data: { ...node.data, onLabelChange: (l) => onNodeLabelChange(node.id, l) }
    }));
  }, [nodes, onNodeLabelChange]);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: Math.random().toString(), // Simple ID gen
        type,
        position,
        data: { label: `${type} node` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes],
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleExport = async () => {
    if (!reactFlowWrapper.current) return;
    try {
      // Add a small delay to ensure rendering
      await new Promise(r => setTimeout(r, 100));
      const dataUrl = await toPng(reactFlowWrapper.current, {
        backgroundColor: '#fff',
        filter: (node) => !node.classList?.contains('react-flow__controls'),
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'flowchart.png', { type: 'image/png' });
      onSubmit(file);
    } catch (err) {
      console.error("Export failed", err);
      alert("Failed to export image");
    }
  };

  // AI Data Loading
  useEffect(() => {
    if (aiFlowchartData) {
      // ... (Keep existing AI parsing logic here if needed, or simplifed)
      console.log("AI Data loaded (Stub)", aiFlowchartData);
    }
  }, [aiFlowchartData]);

  return (
    <ModalOverlay $isOpen={isOpen} onClick={onClose}>
      <ModalContainer $isOpen={isOpen} onClick={e => e.stopPropagation()}>
        <ReactFlowProvider>
          <Sidebar>
            <SidebarHeader>
              <Title>SCULPTOR <TitleText>{t('flowchart.titleSuffix', 'Flow')}</TitleText></Title>
            </SidebarHeader>
            <SidebarContent>
              <div style={{ fontSize: '14px', color: '#888', marginBottom: '8px' }}>
                {t('flowchart.sidebar.helper')}
              </div>
              <NodeButton draggable onDragStart={(event) => onDragStart(event, 'input')}>
                {t('flowchart.node.start')}
              </NodeButton>
              <NodeButton draggable onDragStart={(event) => onDragStart(event, 'default')}>
                {t('flowchart.node.process')}
              </NodeButton>
              <NodeButton draggable onDragStart={(event) => onDragStart(event, 'output')}>
                {t('flowchart.node.end')}
              </NodeButton>
            </SidebarContent>
          </Sidebar>

          <MainContent ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodesWithHandler}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              fitView
            >
              <Background color="#aaa" gap={16} />
              <Controls />
            </ReactFlow>

            <CloseButton onClick={onClose}>×</CloseButton>

            <ToolbarOverlay>
              <ToolButton onClick={handleExport} $primary>{t('flowchart.toolbar.save')}</ToolButton>
              <ToolButton onClick={() => setNodes([])}>{t('flowchart.toolbar.clear')}</ToolButton>
            </ToolbarOverlay>
          </MainContent>
        </ReactFlowProvider>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default FlowchartModal;
