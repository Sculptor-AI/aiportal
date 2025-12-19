import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { useTranslation } from '../contexts/TranslationContext';

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

const WhiteboardContainer = styled.div`
  background: ${props => props.theme.background};
  border-radius: 20px;
  width: 95vw;
  height: 90vh;
  max-width: 1600px;
  max-height: 1000px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
  border: 1px solid ${props => props.theme.border};
  overflow: hidden;
  position: relative;
  transform: ${props => props.$isOpen ? 'scale(1)' : 'scale(0.95)'};
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
`;

const CanvasArea = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
  background-color: #ffffff; /* Always white paper for drawings */
  background-image: radial-gradient(#e0e0e0 1px, transparent 1px);
  background-size: 20px 20px;
  cursor: crosshair;
`;

const FloatingToolbar = styled.div`
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: ${props => props.theme.inputBackground};
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid ${props => props.theme.border};
  border-radius: 16px;
  padding: 8px 16px;
  display: flex;
  gap: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  z-index: 10;
  align-items: center;
`;

const ToolButton = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: ${props => props.$active ? `2px solid ${props.theme.primary}` : '1px solid transparent'};
  background: ${props => props.$active ? `${props.theme.primary}20` : 'transparent'};
  color: ${props => props.$active ? props.theme.primary : props.theme.text};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background: ${props => props.$active ? `${props.theme.primary}30` : 'rgba(0, 0, 0, 0.05)'};
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }

  svg {
    width: 24px;
    height: 24px;
  }
  
  &::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: -30px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s;
    white-space: nowrap;
  }

  &:hover::after {
    opacity: 1;
    transition-delay: 0.5s;
  }
`;

const Divider = styled.div`
  width: 1px;
  height: 24px;
  background: ${props => props.theme.border};
  margin: 0 4px;
`;

const PropertiesBar = styled.div`
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: ${props => props.theme.inputBackground};
  backdrop-filter: blur(10px);
  border: 1px solid ${props => props.theme.border};
  border-radius: 12px;
  padding: 8px 16px;
  display: flex;
  gap: 16px;
  align-items: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  z-index: 9;
  
  /* Animate in */
  animation: slideDown 0.3s ease-out;
  @keyframes slideDown {
    from { opacity: 0; transform: translate(-50%, -10px); }
    to { opacity: 1; transform: translate(-50%, 0); }
  }
`;

const ColorButton = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: ${props => props.$color};
  border: 2px solid ${props => props.$active ? props.theme.text : 'transparent'};
  cursor: pointer;
  transition: transform 0.2s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);

  &:hover {
    transform: scale(1.1);
  }
`;

const SizeSlider = styled.input`
  width: 100px;
  height: 4px;
  border-radius: 2px;
  background: ${props => props.theme.border};
  outline: none;
  cursor: pointer;
  
  &::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${props => props.theme.primary};
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
`;

const ActionToolbar = styled.div`
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: ${props => props.theme.inputBackground};
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid ${props => props.theme.border};
  border-radius: 100px;
  padding: 6px 8px;
  display: flex;
  gap: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  z-index: 10;
  align-items: center;
`;

const PillButton = styled.button`
  padding: 10px 24px;
  border-radius: 100px;
  border: none;
  background: ${props => props.$primary ? props.theme.primary : 'transparent'};
  color: ${props => props.$primary ? 'white' : props.theme.text};
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;

  &:hover {
    background: ${props => props.$primary ? props.theme.primaryDark : 'rgba(0,0,0,0.05)'};
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }

  svg {
    width: 18px;
    height: 18px;
  }
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

  &:hover {
    background: ${props => props.theme.border};
    transform: rotate(90deg);
  }
`;

// Icons
const Icons = {
  Pencil: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>,
  Square: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>,
  Circle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>,
  Line: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="19" x2="19" y2="5"></line></svg>,
  Text: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>,
  Eraser: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 14.5L14.5 2.5 21.5 9.5 9.5 21.5 2.5 14.5z"></path></svg>,
  Undo: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"></path><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"></path></svg>,
  Redo: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"></path><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"></path></svg>,
  Trash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
  Download: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>,
  Send: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
};

const WhiteboardModal = ({ isOpen, onClose, onSubmit }) => {
  const { t } = useTranslation();
  const canvasRef = useRef(null);
  const [ctx, setCtx] = useState(null);
  const [tool, setTool] = useState('pencil');
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);
  const [actions, setActions] = useState([]); // History of all actions
  const [redoStack, setRedoStack] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState(null); // Currently drawing path/shape
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  // Text Tool State
  const [textInput, setTextInput] = useState(null); // {x, y, value}

  const colors = ['#000000', '#FF3B30', '#34C759', '#007AFF', '#5856D6', '#FF9500', '#AF52DE', '#5AC8FA'];

  // Initialize Canvas
  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.parentElement.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const context = canvas.getContext('2d');
      context.scale(dpr, dpr);
      context.lineCap = 'round';
      context.lineJoin = 'round';

      // Need style width/height for display size
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      setCtx(context);
    }
  }, [isOpen]);

  // Redraw Function
  const redraw = useCallback(() => {
    if (!ctx || !canvasRef.current) return;
    const canvas = canvasRef.current;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Use raw width/height (pixel space)

    // Helper to draw an action
    const drawItem = (item) => {
      ctx.beginPath();
      ctx.strokeStyle = item.color;
      ctx.lineWidth = item.lineWidth;
      ctx.globalCompositeOperation = item.tool === 'eraser' ? 'destination-out' : 'source-over';

      if (item.tool === 'eraser') {
        // Eraser usually acts like a thick brush in 'destination-out' mode
        // But on a white background, we can just paint white if we want to support layers later?
        // For now, destination-out works well for transparency, but since we have a white bg div behind,
        // it looks like clearing. 
        // Actually, let's use 'source-over' with white color for eraser to keep it simple and consistent with paper.
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = '#ffffff';
      }

      if (item.type === 'path') {
        if (item.points.length > 0) {
          ctx.moveTo(item.points[0].x, item.points[0].y);
          item.points.forEach(p => ctx.lineTo(p.x, p.y));
          ctx.stroke();
        }
      } else if (item.type === 'rect') {
        ctx.strokeRect(item.x, item.y, item.w, item.h);
      } else if (item.type === 'circle') {
        ctx.beginPath();
        ctx.arc(item.cx, item.cy, item.r, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (item.type === 'line') {
        ctx.moveTo(item.x1, item.y1);
        ctx.lineTo(item.x2, item.y2);
        ctx.stroke();
      } else if (item.type === 'text') {
        ctx.font = `${item.size * 5}px Inter, sans-serif`; // Scale font size
        ctx.fillStyle = item.color;
        ctx.fillText(item.text, item.x, item.y);
      }
    };

    // Draw all completed actions
    actions.forEach(drawItem);

    // Draw current action being drawn
    if (currentPath) {
      drawItem(currentPath);
    }
  }, [ctx, actions, currentPath]);

  // Effect to trigger redraw when needed
  useEffect(() => {
    redraw();
  }, [redraw, actions, currentPath]);


  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    return { x, y };
  };

  const handleMouseDown = (e) => {
    const { x, y } = getPos(e);
    setStartPos({ x, y });
    setIsDrawing(true);

    if (tool === 'text') {
      setTextInput({ x, y, value: '' });
      setIsDrawing(false); // Text is a click action, not drag
      return;
    }

    if (tool === 'pencil' || tool === 'eraser') {
      setCurrentPath({
        type: 'path',
        tool: tool,
        color: color,
        lineWidth: tool === 'eraser' ? lineWidth * 4 : lineWidth,
        points: [{ x, y }]
      });
    } else {
      // Shapes
      setCurrentPath({
        type: tool, // rect, circle, line
        tool: tool,
        color: color,
        lineWidth: lineWidth,
        // Start props, will be updated in Move
        x: x, y: y, w: 0, h: 0,
        cx: x, cy: y, r: 0,
        x1: x, y1: y, x2: x, y2: y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !currentPath) return;
    const { x, y } = getPos(e);

    if (tool === 'pencil' || tool === 'eraser') {
      setCurrentPath(prev => ({
        ...prev,
        points: [...prev.points, { x, y }]
      }));
    } else if (tool === 'square') {
      setCurrentPath(prev => ({
        ...prev,
        type: 'rect',
        w: x - startPos.x,
        h: y - startPos.y
      }));
    } else if (tool === 'circle') {
      const radius = Math.sqrt(Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2));
      setCurrentPath(prev => ({
        ...prev,
        type: 'circle',
        r: radius
      }));
    } else if (tool === 'line') {
      setCurrentPath(prev => ({
        ...prev,
        type: 'line',
        x2: x,
        y2: y
      }));
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentPath) {
      setActions(prev => [...prev, currentPath]);
      setCurrentPath(null);
      setRedoStack([]); // Clear redo stack on new action
    }
  };

  const handleUndo = () => {
    if (actions.length === 0) return;
    const lastAction = actions[actions.length - 1];
    setActions(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, lastAction]);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextAction = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setActions(prev => [...prev, nextAction]);
  };

  const clearCanvas = () => {
    if (window.confirm("Are you sure you want to clear the whiteboard?")) {
      setActions([]);
      setRedoStack([]);
      setCtx(prev => {
        // Force clear visually immediately
        if (prev && canvasRef.current) prev.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        return prev;
      });
    }
  };

  const handleTextSubmit = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (textInput.value.trim()) {
        setActions(prev => [...prev, {
          type: 'text',
          text: textInput.value,
          x: textInput.x,
          y: textInput.y,
          color: color,
          size: lineWidth,
          tool: 'text'
        }]);
      }
      setTextInput(null);
      setTool('pencil'); // Switch back to pencil after text or stay? Let's switch back for flow
    }
  };

  const handleExport = () => {
    if (!canvasRef.current) return;

    // Create a temporary canvas to composite white background
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvasRef.current.width;
    tempCanvas.height = canvasRef.current.height;
    const tCtx = tempCanvas.getContext('2d');

    // Fill white background
    tCtx.fillStyle = '#ffffff';
    tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw original canvas over it
    tCtx.drawImage(canvasRef.current, 0, 0);

    const link = document.createElement('a');
    link.download = 'whiteboard.png';
    link.href = tempCanvas.toDataURL();
    link.click();
  };

  const handleSendToChat = () => {
    if (!canvasRef.current) return;
    // Create a temporary canvas to composite white background
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvasRef.current.width;
    tempCanvas.height = canvasRef.current.height;
    const tCtx = tempCanvas.getContext('2d');

    // Fill white background
    tCtx.fillStyle = '#ffffff';
    tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw original canvas over it
    tCtx.drawImage(canvasRef.current, 0, 0);

    tempCanvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'whiteboard-drawing.png', { type: 'image/png' });
        onSubmit(file);
        onClose();
      }
    }, 'image/png');
  };

  return (
    <ModalOverlay $isOpen={isOpen} onClick={onClose}>
      <WhiteboardContainer $isOpen={isOpen} onClick={e => e.stopPropagation()}>
        <CloseButton onClick={onClose}>×</CloseButton>

        <FloatingToolbar>
          <ToolButton $active={tool === 'pencil'} onClick={() => setTool('pencil')} data-tooltip={t('whiteboard.tool.pencil')}>
            <Icons.Pencil />
          </ToolButton>
          <ToolButton $active={tool === 'square'} onClick={() => setTool('square')} data-tooltip={t('whiteboard.tool.square')}>
            <Icons.Square />
          </ToolButton>
          <ToolButton $active={tool === 'circle'} onClick={() => setTool('circle')} data-tooltip={t('whiteboard.tool.circle')}>
            <Icons.Circle />
          </ToolButton>
          <ToolButton $active={tool === 'line'} onClick={() => setTool('line')} data-tooltip={t('whiteboard.tool.line')}>
            <Icons.Line />
          </ToolButton>
          <ToolButton $active={tool === 'text'} onClick={() => setTool('text')} data-tooltip={t('whiteboard.tool.text')}>
            <Icons.Text />
          </ToolButton>
          <ToolButton $active={tool === 'eraser'} onClick={() => setTool('eraser')} data-tooltip={t('whiteboard.tool.eraser')}>
            <Icons.Eraser />
          </ToolButton>

          <Divider />

          <ToolButton onClick={handleUndo} data-tooltip={t('whiteboard.tool.undo')}>
            <Icons.Undo />
          </ToolButton>
          <ToolButton onClick={handleRedo} data-tooltip={t('whiteboard.tool.redo')}>
            <Icons.Redo />
          </ToolButton>
          <ToolButton onClick={clearCanvas} data-tooltip={t('whiteboard.tool.clear')}>
            <Icons.Trash />
          </ToolButton>
        </FloatingToolbar>

        <PropertiesBar>
          {colors.map(c => (
            <ColorButton
              key={c}
              $color={c}
              $active={color === c}
              onClick={() => setColor(c)}
            />
          ))}
          <Divider />
          <SizeSlider
            type="range"
            min="1"
            max="20"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
          />
        </PropertiesBar>

        <CanvasArea>
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
          {textInput && (
            <input
              autoFocus
              style={{
                position: 'absolute',
                left: textInput.x,
                top: textInput.y,
                border: '1px solid #007AFF',
                background: 'transparent',
                padding: '4px',
                font: `${lineWidth * 5}px Inter, sans-serif`,
                color: color,
                outline: 'none',
                minWidth: '50px'
              }}
              value={textInput.value}
              onChange={e => setTextInput(prev => ({ ...prev, value: e.target.value }))}
              onKeyDown={handleTextSubmit}
              onBlur={() => setTextInput(null)} // Cancel on blur without enter
            />
          )}
        </CanvasArea>

        <ActionToolbar>
          <PillButton onClick={handleExport}>
            <Icons.Download /> {t('whiteboard.action.export')}
          </PillButton>
          <PillButton $primary onClick={handleSendToChat}>
            <Icons.Send /> {t('whiteboard.action.send')}
          </PillButton>
        </ActionToolbar>

      </WhiteboardContainer>
    </ModalOverlay>
  );
};

export default WhiteboardModal;
