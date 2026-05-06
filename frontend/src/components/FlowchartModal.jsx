import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Handle,
  Position,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { toPng } from 'html-to-image';
import {
  parseFlowchartInstructions,
  parseAIFlowchartResponse,
  autoLayoutFlowchart,
  createNode,
} from '../utils/flowchartTools';
import { useTranslation } from '../contexts/TranslationContext';

// --- Node visuals ---

const NODE_STYLES = {
  start:    { fill: '#10b981', stroke: '#059669', shape: 'pill' },
  process:  { fill: '#3b82f6', stroke: '#2563eb', shape: 'rect' },
  decision: { fill: '#f59e0b', stroke: '#d97706', shape: 'diamond' },
  end:      { fill: '#ef4444', stroke: '#dc2626', shape: 'pill' },
};

const NodeShell = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-weight: 500;
  font-size: 13px;
  color: #fff;
  min-width: 140px;
  min-height: 48px;
  padding: ${props => props.$shape === 'diamond' ? '28px 22px' : '12px 18px'};
  background: ${props => props.$fill};
  border: 2px solid ${props => props.$selected ? '#fff' : props.$stroke};
  box-shadow: ${props => props.$selected
    ? `0 0 0 3px ${props.$fill}66, 0 6px 18px rgba(0,0,0,0.18)`
    : '0 4px 10px rgba(0,0,0,0.12)'};
  border-radius: ${props => {
    if (props.$shape === 'pill') return '9999px';
    if (props.$shape === 'diamond') return '8px';
    return '10px';
  }};
  ${props => props.$shape === 'diamond' && `
    transform: rotate(45deg);
    width: 110px;
    height: 110px;
    min-width: 0;
    min-height: 0;
    padding: 0;
  `}
  transition: box-shadow 0.15s, transform 0.15s;
`;

const DiamondLabel = styled.div`
  transform: rotate(-45deg);
  width: 130px;
  text-align: center;
  font-weight: 500;
  font-size: 13px;
  color: #fff;
  line-height: 1.3;
  word-break: break-word;
`;

const NodeInput = styled.input`
  border: none;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  width: 100%;
  text-align: center;
  outline: none;
  font: inherit;
  font-weight: 500;
  border-radius: 6px;
  padding: 2px 4px;
  &::selection { background: rgba(255,255,255,0.35); }
`;

const InlineLabel = styled.div`
  width: 100%;
  word-break: break-word;
  line-height: 1.3;
`;

const FlowNode = ({ data, selected, type }) => {
  const style = NODE_STYLES[type] || NODE_STYLES.process;
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(data.label);
  const inputRef = useRef(null);

  useEffect(() => { setDraft(data.label); }, [data.label]);
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commit = () => {
    setIsEditing(false);
    if (draft !== data.label) data.onLabelChange?.(draft);
  };

  const labelContent = isEditing ? (
    <NodeInput
      ref={inputRef}
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => {
        if (e.key === 'Enter') { e.preventDefault(); commit(); }
        if (e.key === 'Escape') { setDraft(data.label); setIsEditing(false); }
      }}
      onClick={e => e.stopPropagation()}
    />
  ) : (
    <InlineLabel>{data.label}</InlineLabel>
  );

  return (
    <NodeShell
      $shape={style.shape}
      $fill={style.fill}
      $stroke={style.stroke}
      $selected={selected}
      onDoubleClick={() => setIsEditing(true)}
    >
      <Handle type="target" position={Position.Top} style={{ background: style.stroke, width: 8, height: 8 }} />
      {style.shape === 'diamond' ? <DiamondLabel>{labelContent}</DiamondLabel> : labelContent}
      <Handle type="source" position={Position.Bottom} style={{ background: style.stroke, width: 8, height: 8 }} />
    </NodeShell>
  );
};

const nodeTypes = {
  start: FlowNode,
  process: FlowNode,
  decision: FlowNode,
  end: FlowNode,
};

// --- Modal chrome ---

const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  opacity: ${props => props.$isOpen ? 1 : 0};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transition: opacity 0.2s ease-in-out, visibility 0.2s ease-in-out;
`;

const ModalContainer = styled.div`
  background: ${props => props.theme.background || '#1a1a1a'};
  color: ${props => props.theme.text || '#fff'};
  border-radius: 18px;
  width: 95vw;
  height: 90vh;
  max-width: 1500px;
  max-height: 950px;
  display: flex;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.45);
  border: 1px solid ${props => props.theme.border || 'rgba(255,255,255,0.1)'};
  overflow: hidden;
  position: relative;
  animation: ${fadeIn} 0.18s ease-out;
`;

const Sidebar = styled.div`
  width: 240px;
  background: ${props => props.theme.sidebar || 'rgba(0,0,0,0.2)'};
  border-right: 1px solid ${props => props.theme.border || 'rgba(255,255,255,0.08)'};
  display: flex;
  flex-direction: column;
`;

const SidebarHeader = styled.div`
  padding: 18px 20px 14px;
  border-bottom: 1px solid ${props => props.theme.border || 'rgba(255,255,255,0.08)'};
`;

const Title = styled.h2`
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  opacity: 0.8;
`;

const Subtitle = styled.div`
  margin-top: 4px;
  font-size: 0.8rem;
  opacity: 0.55;
`;

const SidebarSection = styled.div`
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SidebarLabel = styled.div`
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.5;
  margin-bottom: 2px;
`;

const NodeChip = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: ${props => props.theme.inputBackground || 'rgba(255,255,255,0.04)'};
  border: 1px solid ${props => props.theme.border || 'rgba(255,255,255,0.1)'};
  border-radius: 10px;
  cursor: grab;
  font-size: 0.88rem;
  user-select: none;
  transition: background 0.15s, border-color 0.15s, transform 0.15s;

  &:hover {
    background: ${props => props.theme.primary || '#0078d7'}18;
    border-color: ${props => props.theme.primary || '#0078d7'};
    transform: translateY(-1px);
  }
  &:active { cursor: grabbing; }
`;

const Swatch = styled.span`
  display: inline-block;
  width: 18px;
  height: 18px;
  background: ${props => props.$fill};
  border: 1.5px solid ${props => props.$stroke};
  border-radius: ${props => {
    if (props.$shape === 'pill') return '9999px';
    if (props.$shape === 'diamond') return '3px';
    return '4px';
  }};
  ${props => props.$shape === 'diamond' && `transform: rotate(45deg);`}
  flex-shrink: 0;
`;

const Hint = styled.div`
  font-size: 0.78rem;
  line-height: 1.45;
  opacity: 0.55;
  padding: 0 4px;
`;

const FooterActions = styled.div`
  margin-top: auto;
  padding: 14px 16px;
  border-top: 1px solid ${props => props.theme.border || 'rgba(255,255,255,0.08)'};
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ActionButton = styled.button`
  padding: 9px 14px;
  border-radius: 9px;
  font-weight: 500;
  font-size: 0.88rem;
  cursor: pointer;
  transition: filter 0.15s, background 0.15s, border-color 0.15s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  ${props => props.$primary ? `
    background: ${props.theme.primary || '#0078d7'};
    color: #fff;
    border: none;
    &:hover:not(:disabled) { filter: brightness(1.1); }
    &:disabled { opacity: 0.4; cursor: not-allowed; }
  ` : `
    background: transparent;
    color: ${props.theme.text || '#fff'};
    border: 1px solid ${props.theme.border || 'rgba(255,255,255,0.12)'};
    &:hover { background: rgba(255,255,255,0.06); }
  `}
`;

const MainContent = styled.div`
  flex: 1;
  position: relative;
  background: ${props => props.theme.isDark
    ? 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.03), transparent 60%), #0f1115'
    : 'radial-gradient(circle at 50% 0%, rgba(0,0,0,0.03), transparent 60%), #f7f8fa'};
`;

const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${props => props.theme.inputBackground || 'rgba(0,0,0,0.4)'};
  border: 1px solid ${props => props.theme.border || 'rgba(255,255,255,0.12)'};
  color: ${props => props.theme.text || '#fff'};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 20;
  transition: background 0.15s, transform 0.15s;
  &:hover { background: rgba(255,255,255,0.08); transform: scale(1.05); }
  svg { width: 16px; height: 16px; }
`;

const EmptyState = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 1;
`;

const EmptyCard = styled.div`
  text-align: center;
  padding: 32px 36px;
  border-radius: 14px;
  background: ${props => props.theme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'};
  border: 1px dashed ${props => props.theme.border || 'rgba(255,255,255,0.15)'};
  max-width: 380px;
  pointer-events: auto;
`;

const EmptyTitle = styled.div`
  font-weight: 600;
  font-size: 1.05rem;
  margin-bottom: 6px;
  color: ${props => props.theme.text || '#fff'};
`;

const EmptyDescription = styled.div`
  font-size: 0.86rem;
  opacity: 0.65;
  line-height: 1.5;
  color: ${props => props.theme.text || '#fff'};
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const ErrorBanner = styled.div`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(220, 38, 38, 0.95);
  color: #fff;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 0.85rem;
  z-index: 30;
  box-shadow: 0 6px 20px rgba(0,0,0,0.3);
  max-width: 80%;
`;

// --- Icons ---

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="6" y1="6" x2="18" y2="18" />
    <line x1="18" y1="6" x2="6" y2="18" />
  </svg>
);

const UploadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const SaveIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
);

const LayoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

// --- Main Component ---

const NODE_DEFS = [
  { type: 'start',    labelKey: 'flowchart.node.start',    fallback: 'Start' },
  { type: 'process',  labelKey: 'flowchart.node.process',  fallback: 'Process' },
  { type: 'decision', labelKey: 'flowchart.node.decision', fallback: 'Decision' },
  { type: 'end',      labelKey: 'flowchart.node.end',      fallback: 'End' },
];

const defaultEdgeOptions = {
  type: 'smoothstep',
  markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
};

const FlowchartModal = ({ isOpen, onClose, onSubmit, theme, aiFlowchartData }) => {
  const { t } = useTranslation();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [error, setError] = useState(null);
  const reactFlowWrapper = useRef(null);
  const fileInputRef = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const lastLoadedAiDataRef = useRef(null);

  const flashError = useCallback((msg) => {
    setError(msg);
    window.setTimeout(() => setError(null), 4000);
  }, []);

  const onNodeLabelChange = useCallback((id, newLabel) => {
    setNodes((nds) => nds.map((node) => {
      if (node.id === id) return { ...node, data: { ...node.data, label: newLabel } };
      return node;
    }));
  }, [setNodes]);

  // Inject onLabelChange handler into node data
  const nodesWithHandlers = useMemo(() => nodes.map(node => ({
    ...node,
    data: { ...node.data, onLabelChange: (l) => onNodeLabelChange(node.id, l) },
  })), [nodes, onNodeLabelChange]);

  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge({ ...params, type: 'smoothstep', markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 } }, eds));
  }, [setEdges]);

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = useCallback((event) => {
    event.preventDefault();
    if (!reactFlowWrapper.current || !reactFlowInstance) return;

    const nodeType = event.dataTransfer.getData('application/reactflow');
    if (!nodeType) return;

    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    const newNode = createNode(nodeType, t(`flowchart.node.${nodeType}`, nodeType), position);
    setNodes((nds) => nds.concat(newNode));
  }, [reactFlowInstance, setNodes, t]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleAddNodeAtCenter = (nodeType) => {
    if (!reactFlowInstance) return;
    const center = reactFlowInstance.screenToFlowPosition({
      x: (reactFlowWrapper.current?.clientWidth || 800) / 2 - 70,
      y: (reactFlowWrapper.current?.clientHeight || 600) / 2 - 24,
    });
    const newNode = createNode(nodeType, t(`flowchart.node.${nodeType}`, nodeType), center);
    setNodes((nds) => nds.concat(newNode));
  };

  const handleAutoLayout = () => {
    if (nodes.length === 0) return;
    const laidOut = autoLayoutFlowchart(nodes, edges);
    setNodes(laidOut);
    window.setTimeout(() => reactFlowInstance?.fitView({ padding: 0.2, duration: 300 }), 30);
  };

  const handleClear = () => {
    setNodes([]);
    setEdges([]);
  };

  const handleExport = async () => {
    if (!reactFlowWrapper.current) {
      flashError(t('flowchart.error.exportFailed', 'Export failed'));
      return;
    }
    if (nodes.length === 0) {
      flashError(t('flowchart.error.empty', 'Add at least one node before saving.'));
      return;
    }
    try {
      // Fit view first so the export captures the whole graph
      reactFlowInstance?.fitView({ padding: 0.15 });
      await new Promise(r => setTimeout(r, 200));

      const viewportEl = reactFlowWrapper.current.querySelector('.react-flow__viewport')?.parentElement
        || reactFlowWrapper.current;

      const dataUrl = await toPng(viewportEl, {
        backgroundColor: theme?.isDark ? '#0f1115' : '#ffffff',
        cacheBust: true,
        filter: (node) => {
          if (!node.classList) return true;
          return !node.classList.contains('react-flow__controls')
            && !node.classList.contains('react-flow__minimap')
            && !node.classList.contains('react-flow__panel');
        },
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `flowchart-${Date.now()}.png`, { type: 'image/png' });
      onSubmit(file);
    } catch (err) {
      console.error('Flowchart export failed:', err);
      flashError(t('flowchart.error.exportFailed', 'Export failed'));
    }
  };

  const loadInstructions = useCallback((instructions) => {
    if (!Array.isArray(instructions) || instructions.length === 0) return false;
    const { nodes: newNodes, edges: newEdges } = parseFlowchartInstructions(instructions);
    if (newNodes.length === 0) return false;

    const styledEdges = newEdges.map(e => ({
      ...e,
      markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
    }));
    setNodes(newNodes);
    setEdges(styledEdges);
    window.setTimeout(() => reactFlowInstance?.fitView({ padding: 0.2, duration: 300 }), 50);
    return true;
  }, [setNodes, setEdges, reactFlowInstance]);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChosen = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (file.type.startsWith('image/')) {
      // Send image straight to chat
      onSubmit(file);
      return;
    }

    if (file.type === 'application/json' || /\.json$/i.test(file.name)) {
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const instructions = Array.isArray(parsed)
          ? parsed
          : (Array.isArray(parsed.flowchart) ? parsed.flowchart : (Array.isArray(parsed.instructions) ? parsed.instructions : null));
        if (!instructions) {
          flashError(t('flowchart.error.invalidJson', 'JSON must be an array of flowchart instructions.'));
          return;
        }
        const ok = loadInstructions(instructions);
        if (!ok) flashError(t('flowchart.error.invalidJson', 'No nodes found in the uploaded JSON.'));
      } catch {
        flashError(t('flowchart.error.invalidJson', 'Could not parse JSON file.'));
      }
      return;
    }

    flashError(t('flowchart.error.unsupportedType', 'Unsupported file type. Use an image or JSON.'));
  };

  // Load AI-generated flowchart when modal opens with new data
  useEffect(() => {
    if (!isOpen || !aiFlowchartData) return;
    if (lastLoadedAiDataRef.current === aiFlowchartData) return;

    const instructions = parseAIFlowchartResponse(aiFlowchartData);
    if (instructions.length === 0) {
      flashError(t('flowchart.error.aiParseFailed', 'Could not read AI-generated flowchart instructions.'));
      lastLoadedAiDataRef.current = aiFlowchartData;
      return;
    }
    const ok = loadInstructions(instructions);
    if (!ok) {
      flashError(t('flowchart.error.aiParseFailed', 'Could not read AI-generated flowchart instructions.'));
    }
    lastLoadedAiDataRef.current = aiFlowchartData;
  }, [isOpen, aiFlowchartData, loadInstructions, t, flashError]);

  // Reset the load tracker when modal closes so reopening with same data still works after edits
  useEffect(() => {
    if (!isOpen) lastLoadedAiDataRef.current = null;
  }, [isOpen]);

  const isEmpty = nodes.length === 0;

  return (
    <ModalOverlay $isOpen={isOpen} onClick={onClose}>
      <ModalContainer onClick={e => e.stopPropagation()}>
        <ReactFlowProvider>
          <Sidebar>
            <SidebarHeader>
              <Title>{t('flowchart.titleSuffix', 'Flowchart')}</Title>
              <Subtitle>{t('flowchart.subtitle', 'Build, drop, or upload')}</Subtitle>
            </SidebarHeader>

            <SidebarSection>
              <SidebarLabel>{t('flowchart.sidebar.nodesLabel', 'Nodes')}</SidebarLabel>
              {NODE_DEFS.map(def => {
                const style = NODE_STYLES[def.type];
                return (
                  <NodeChip
                    key={def.type}
                    draggable
                    onDragStart={(e) => onDragStart(e, def.type)}
                    onDoubleClick={() => handleAddNodeAtCenter(def.type)}
                    title={t('flowchart.sidebar.dragOrDouble', 'Drag onto the canvas, or double-click to add at center')}
                  >
                    <Swatch $fill={style.fill} $stroke={style.stroke} $shape={style.shape} />
                    {t(def.labelKey, def.fallback)}
                  </NodeChip>
                );
              })}
              <Hint>{t('flowchart.sidebar.helper', 'Drag onto the canvas, or double-click a chip to drop one in the middle.')}</Hint>
            </SidebarSection>

            <FooterActions>
              <ActionButton onClick={handleAutoLayout} disabled={isEmpty}>
                <LayoutIcon /> {t('flowchart.toolbar.layout', 'Auto-layout')}
              </ActionButton>
              <ActionButton onClick={handleUploadClick}>
                <UploadIcon /> {t('flowchart.toolbar.upload', 'Upload')}
              </ActionButton>
              <ActionButton onClick={handleClear} disabled={isEmpty}>
                <TrashIcon /> {t('flowchart.toolbar.clear', 'Clear')}
              </ActionButton>
              <ActionButton onClick={handleExport} $primary disabled={isEmpty}>
                <SaveIcon /> {t('flowchart.toolbar.save', 'Save & Insert')}
              </ActionButton>
              <HiddenFileInput
                ref={fileInputRef}
                type="file"
                accept="image/*,application/json,.json"
                onChange={handleFileChosen}
              />
            </FooterActions>
          </Sidebar>

          <MainContent ref={reactFlowWrapper} theme={theme}>
            <ReactFlow
              nodes={nodesWithHandlers}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              defaultEdgeOptions={defaultEdgeOptions}
              deleteKeyCode={['Backspace', 'Delete']}
              fitView
              proOptions={{ hideAttribution: true }}
            >
              <Background
                color={theme?.isDark ? '#2a2f3a' : '#cfd4dc'}
                gap={18}
                size={1.2}
              />
              <Controls
                showInteractive={false}
                style={{
                  background: theme?.isDark ? 'rgba(20,22,28,0.85)' : 'rgba(255,255,255,0.9)',
                  border: `1px solid ${theme?.border || 'rgba(0,0,0,0.1)'}`,
                  borderRadius: 8,
                }}
              />
              <MiniMap
                pannable
                zoomable
                nodeStrokeColor={(n) => NODE_STYLES[n.type]?.stroke || '#666'}
                nodeColor={(n) => NODE_STYLES[n.type]?.fill || '#999'}
                maskColor={theme?.isDark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.6)'}
                style={{
                  background: theme?.isDark ? '#14171c' : '#fff',
                  border: `1px solid ${theme?.border || 'rgba(0,0,0,0.1)'}`,
                  borderRadius: 8,
                }}
              />
            </ReactFlow>

            {isEmpty && (
              <EmptyState>
                <EmptyCard theme={theme}>
                  <EmptyTitle theme={theme}>{t('flowchart.empty.title', 'Build a flowchart')}</EmptyTitle>
                  <EmptyDescription theme={theme}>
                    {t('flowchart.empty.description',
                      'Drag node chips from the left, or click Upload to bring in your own image or JSON. Connect nodes by dragging from one handle to another. Double-click a node to rename.')}
                  </EmptyDescription>
                </EmptyCard>
              </EmptyState>
            )}

            {error && <ErrorBanner>{error}</ErrorBanner>}

            <CloseButton onClick={onClose} aria-label="Close flowchart">
              <CloseIcon />
            </CloseButton>
          </MainContent>
        </ReactFlowProvider>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default FlowchartModal;
