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
import FlowchartSidebar from './FlowchartSidebar';
import { parseFlowchartInstructions, parseAIFlowchartResponse, validateFlowchartInstructions } from '../utils/flowchartTools';

const ModalContainer = styled.div`
  position: fixed;
  top: 0;
  right: ${props => props.$otherPanelsOpen * 450}px;
  width: 450px;
  height: 100vh;
  background: ${props => props.theme.background};
  z-index: 1000;
  display: flex;
  flex-direction: column;
  box-shadow: -3px 0 10px rgba(0, 0, 0, 0.15);
  border-left: 1px solid ${props => props.theme.border};
  transform: ${props => props.$isOpen ? 'translateX(0%)' : 'translateX(100%)'};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transition: transform 0.3s ease-in-out, visibility 0.3s ease-in-out;
  
  @media (max-width: 768px) {
    width: 100vw;
    right: 0;
    left: 0;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.name === 'retro' ? props.theme.buttonFace : 'transparent'};
`;

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  color: ${props => props.theme.text};
  font-family: ${props => props.theme.name === 'retro' ? 'MS Sans Serif, sans-serif' : 'inherit'};
`;

const CloseButton = styled.button`
  background: ${props => props.theme.name === 'retro' ? props.theme.buttonFace : 'transparent'};
  border: ${props => props.theme.name === 'retro' ? 
    `1px solid ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight}` : 
    'none'};
  color: ${props => props.theme.text};
  padding: ${props => props.theme.name === 'retro' ? '4px 12px' : '8px'};
  cursor: pointer;
  font-size: ${props => props.theme.name === 'retro' ? '12px' : '24px'};
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '4px'};
  
  &:hover {
    background: ${props => props.theme.name === 'retro' ? props.theme.buttonFace : 'rgba(0, 0, 0, 0.1)'};
  }
  
  &:active {
    ${props => props.theme.name === 'retro' && `
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
      padding: 5px 11px 3px 13px;
    `}
  }
`;

const Content = styled.div`
  flex: 1;
  position: relative;
  background: ${props => props.theme.name === 'retro' ? '#c0c0c0' : '#f5f5f5'};
`;

const FlowchartWrapper = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  background: white;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid ${props => props.theme.border};
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    padding: 12px 16px;
    gap: 8px;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    gap: 8px;
  }
`;

const Button = styled.button`
  padding: 8px 20px;
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '6px'};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  
  @media (max-width: 768px) {
    padding: 6px 16px;
    font-size: 13px;
  }
  
  @media (max-width: 480px) {
    padding: 6px 12px;
    font-size: 12px;
  }
  
  ${props => props.theme.name === 'retro' ? `
    background: ${props.theme.buttonFace};
    border: 1px solid ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight};
    color: ${props.theme.buttonText};
    box-shadow: 1px 1px 0 0 ${props.theme.buttonHighlightSoft} inset, -1px -1px 0 0 ${props.theme.buttonShadowSoft} inset;
    
    &:active {
      border-color: ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight} ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark};
      box-shadow: -1px -1px 0 0 ${props.theme.buttonHighlightSoft} inset, 1px 1px 0 0 ${props.theme.buttonShadowSoft} inset;
      padding: 9px 19px 7px 21px;
    }
  ` : `
    background: ${props.$primary ? props.theme.primary : 'transparent'};
    color: ${props.$primary ? 'white' : props.theme.text};
    border: 1px solid ${props.$primary ? props.theme.primary : props.theme.border};
    
    &:hover {
      background: ${props.$primary ? props.theme.primaryDark : props.theme.border};
      ${!props.$primary && `color: ${props.theme.text};`}
    }
  `}
`;

const HelpText = styled.div`
  padding: 12px 20px;
  background: ${props => props.theme.inputBackground};
  border-bottom: 1px solid ${props => props.theme.border};
  font-size: 13px;
  color: ${props => props.theme.textSecondary || props.theme.text};
  line-height: 1.5;
`;

const StyledReactFlow = styled.div`
  height: 100%;
  width: 100%;
  
  .react-flow__node {
    font-size: 14px;
  }
  
  .react-flow__node.selected {
    .react-flow__handle {
      background: ${props => props.theme.primary};
    }
  }
  
  .react-flow__edge-path {
    stroke: ${props => props.theme.text};
  }
  
  .react-flow__edge.selected .react-flow__edge-path {
    stroke: ${props => props.theme.primary};
  }
  
  .react-flow__controls {
    button {
      background: ${props => props.theme.background};
      border: 1px solid ${props => props.theme.border};
      color: ${props => props.theme.text};
      
      &:hover {
        background: ${props => props.theme.border};
      }
    }
  }
  
  .react-flow__minimap {
    background: ${props => props.theme.background};
    border: 1px solid ${props => props.theme.border};
    
    .react-flow__minimap-mask {
      fill: ${props => props.theme.primary};
      fill-opacity: 0.2;
    }
  }
`;

const NodeLabel = styled.div`
  padding: 8px 12px;
  border-radius: 4px;
  background: white;
  border: 1px solid #ccc;
  min-width: 100px;
  text-align: center;
  cursor: text;
  
  &:hover {
    border-color: #999;
  }
`;

const NodeInput = styled.input`
  border: none;
  background: none;
  text-align: center;
  width: 100%;
  outline: none;
  font-size: 14px;
  font-family: inherit;
`;

// Custom node component with editable label
const CustomNode = ({ data, isConnectable }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label);
  const inputRef = useRef(null);

  const handleDoubleClick = () => {
    setIsEditing(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (data.onLabelChange) {
      data.onLabelChange(label);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      <NodeLabel onDoubleClick={handleDoubleClick}>
        {isEditing ? (
          <NodeInput
            ref={inputRef}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          />
        ) : (
          label
        )}
      </NodeLabel>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
      />
    </>
  );
};

const initialNodes = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Start' },
    position: { x: 225, y: 50 },
  },
];

let id = 2;
const getId = () => `${id++}`;

const FlowchartModal = ({ isOpen, onClose, onSubmit, theme, otherPanelsOpen = 0, aiFlowchartData = null }) => {
  const nodeTypes = useMemo(() => ({
    default: CustomNode,
    input: CustomNode,
    output: CustomNode,
  }), []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const flowchartRef = useRef(null);
  const exportRef = useRef(null);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onNodeLabelChange = useCallback((nodeId, newLabel) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, label: newLabel } }
          : node
      )
    );
  }, [setNodes]);

  const onAddNode = useCallback((type, data) => {
    const nodeId = getId();
    const newNode = {
      id: nodeId,
      type,
      data: {
        ...data,
        onLabelChange: (newLabel) => onNodeLabelChange(nodeId, newLabel),
      },
      position: {
        x: 100 + Math.random() * 200,
        y: 100 + Math.random() * 200,
      },
    };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes, onNodeLabelChange]);

  const onSelectionChange = useCallback(({ nodes }) => {
    setSelectedNodes(nodes);
  }, []);

  const deleteSelectedNodes = useCallback(() => {
    if (selectedNodes.length === 0) return;
    
    const selectedIds = selectedNodes.map(node => node.id);
    setNodes((nds) => nds.filter((node) => !selectedIds.includes(node.id)));
    setEdges((eds) => eds.filter((edge) => 
      !selectedIds.includes(edge.source) && !selectedIds.includes(edge.target)
    ));
    setSelectedNodes([]);
  }, [selectedNodes, setNodes, setEdges]);

  const clearFlowchart = useCallback(() => {
    setNodes([{
      ...initialNodes[0],
      data: {
        ...initialNodes[0].data,
        onLabelChange: (newLabel) => onNodeLabelChange('1', newLabel),
      },
    }]);
    setEdges([]);
    setSelectedNodes([]);
  }, [setNodes, setEdges, onNodeLabelChange]);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Delete' || event.key === 'Backspace') {
      deleteSelectedNodes();
    }
  }, [deleteSelectedNodes]);

  const handleDone = useCallback(async () => {
    try {
      console.log('Starting flowchart export...');
      
      // Make sure we have the export ref
      if (!exportRef.current) {
        console.error('Export ref not found');
        alert('Cannot find flowchart element to export');
        return;
      }

      // Wait for any pending renders
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log('Capturing flowchart...');
      
      // Use html-to-image to capture the flowchart
      const dataUrl = await toPng(exportRef.current, { 
        backgroundColor: 'white',
        quality: 0.95,
        pixelRatio: 2,
        filter: (node) => {
          // Filter out controls and minimap
          if (node.classList && (
            node.classList.contains('react-flow__minimap') ||
            node.classList.contains('react-flow__controls') ||
            node.classList.contains('react-flow__attribution')
          )) {
            return false;
          }
          return true;
        }
      });

      console.log('Image created, converting to blob...');
      
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      console.log('Blob created, size:', blob.size);
      
      // Verify blob is valid
      if (blob.size === 0) {
        throw new Error('Generated image is empty');
      }
      
      // Create a File object from the blob
      const file = new File([blob], 'flowchart.png', { type: 'image/png' });
      
      console.log('File created successfully');
      
      // Submit the file
      if (onSubmit && typeof onSubmit === 'function') {
        onSubmit(file);
      } else {
        console.error('onSubmit is not a function');
      }
    } catch (error) {
      console.error('Error creating flowchart image:', error);
      console.error('Error details:', error.message, error.stack);
      
      // Try a fallback method
      try {
        console.log('Trying fallback export method...');
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black';
        ctx.font = '16px Arial';
        ctx.fillText('Flowchart (export failed - using fallback)', 20, 30);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'flowchart.png', { type: 'image/png' });
            if (onSubmit && typeof onSubmit === 'function') {
              onSubmit(file);
            }
          }
        }, 'image/png');
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        alert(`Failed to export flowchart: ${error.message}`);
      }
    }
  }, [onSubmit]);

  const handleDownload = useCallback(async () => {
    try {
      if (!exportRef.current) {
        console.error('Export ref not found for download');
        alert('Cannot find flowchart element to download');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 200));
      
      const dataUrl = await toPng(exportRef.current, { 
        backgroundColor: 'white',
        quality: 0.95,
        pixelRatio: 2,
        filter: (node) => {
          if (node.classList && (
            node.classList.contains('react-flow__minimap') ||
            node.classList.contains('react-flow__controls') ||
            node.classList.contains('react-flow__attribution')
          )) {
            return false;
          }
          return true;
        }
      });
      
      const link = document.createElement('a');
      link.download = 'flowchart.png';
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error downloading flowchart:', error);
      alert(`Failed to download flowchart: ${error.message}`);
    }
  }, []);

  // Initialize nodes with label change handlers
  React.useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onLabelChange: (newLabel) => onNodeLabelChange(node.id, newLabel),
        },
      }))
    );
  }, [setNodes, onNodeLabelChange]);

  // Process AI flowchart data when provided
  useEffect(() => {
    if (aiFlowchartData && isOpen) {
      try {
        console.log('Processing AI flowchart data:', aiFlowchartData);
        
        // Parse AI response for flowchart instructions
        const instructions = parseAIFlowchartResponse(aiFlowchartData);
        console.log('Parsed instructions:', instructions);
        
        if (instructions.length === 0) {
          console.log('No valid instructions found in AI response');
          return;
        }
        
        // Validate instructions
        const validation = validateFlowchartInstructions(instructions);
        if (!validation.valid) {
          console.error('Invalid flowchart instructions:', validation.errors);
          return;
        }
        
        // Convert instructions to nodes and edges
        const { nodes: aiNodes, edges: aiEdges } = parseFlowchartInstructions(
          instructions,
          onNodeLabelChange
        );
        
        console.log('Generated nodes:', aiNodes);
        console.log('Generated edges:', aiEdges);
        
        // Update the flowchart with AI-generated content
        if (aiNodes.length > 0) {
          setNodes(aiNodes);
          setEdges(aiEdges);
        }
        
      } catch (error) {
        console.error('Error processing AI flowchart data:', error);
      }
    }
  }, [aiFlowchartData, isOpen, onNodeLabelChange, setNodes, setEdges]);

  return (
    <ModalContainer $isOpen={isOpen} $otherPanelsOpen={otherPanelsOpen}>
      <Header>
        <Title>Flowchart Builder</Title>
        <CloseButton onClick={onClose}>
          {theme?.name === 'retro' ? '✕' : '×'}
        </CloseButton>
      </Header>
      
      <HelpText>
        Click "Add Nodes" to show/hide the node toolbar. Double-click nodes to rename them. Select nodes and press Delete to remove them. 
        Drag from handles to create connections.
      </HelpText>
      
      <Content ref={flowchartRef}>
        <ReactFlowProvider>
          <FlowchartWrapper ref={exportRef}>
            <StyledReactFlow>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onSelectionChange={onSelectionChange}
                onKeyDown={handleKeyDown}
                deleteKeyCode={['Delete', 'Backspace']}
                nodeTypes={nodeTypes}
                fitView
              >
                <Controls />
                <Background variant="dots" gap={12} size={1} />
              </ReactFlow>
            </StyledReactFlow>
          </FlowchartWrapper>
          <FlowchartSidebar onAddNode={onAddNode} theme={theme} isVisible={showSidebar} />
        </ReactFlowProvider>
      </Content>
      
      <ButtonContainer>
        <ActionButtons>
          <Button onClick={() => setShowSidebar(!showSidebar)}>
            {showSidebar ? 'Hide' : 'Add Nodes'}
          </Button>
          <Button onClick={clearFlowchart}>Clear All</Button>
          {selectedNodes.length > 0 && (
            <Button onClick={deleteSelectedNodes}>
              Delete Selected ({selectedNodes.length})
            </Button>
          )}
        </ActionButtons>
        <ActionButtons>
          <Button onClick={handleDownload}>Download</Button>
          <Button onClick={onClose}>Cancel</Button>
          <Button $primary onClick={handleDone}>Done</Button>
        </ActionButtons>
      </ButtonContainer>
    </ModalContainer>
  );
};

export default FlowchartModal;
