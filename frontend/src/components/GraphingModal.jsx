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

const GraphingContainer = styled.div`
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
  width: 350px;
  background: ${props => props.theme.sidebar};
  border-right: 1px solid ${props => props.theme.border};
  display: flex;
  flex-direction: column;
  z-index: 10;
  backdrop-filter: blur(20px);
  min-width: 300px;
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
  color: transparent; /* Use gradient text */
  /* Fallback color if gradient fails or theme missing */
  text-shadow: 0 2px 10px rgba(0,0,0,0.1);
`;

const TitleText = styled.span`
  color: ${props => props.theme.text};
`;

const EquationList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const EquationItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: ${props => props.theme.inputBackground};
  border: 1px solid ${props => props.$active ? props.theme.border : 'transparent'};
  border-radius: 12px;
  transition: all 0.2s ease;
  box-shadow: ${props => props.$active ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'};

  &:focus-within {
    border-color: ${props => props.theme.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.primary}20;
  }
`;

const ColorIndicator = styled.button`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${props => props.$visible ? props.$color : 'transparent'};
  border: 2px solid ${props => props.$color};
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 60%;
    height: 60%;
    background: ${props => props.$visible ? 'white' : props.$color};
    border-radius: 50%;
    opacity: ${props => props.$visible ? 0.3 : 0};
    transition: opacity 0.2s;
  }

  &:hover {
    transform: scale(1.1);
  }
`;

const InputWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const StyledInput = styled.input`
  width: 100%;
  border: none;
  background: transparent;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 16px;
  color: ${props => props.theme.text};
  outline: none;
  
  &::placeholder {
    color: ${props => props.theme.text}40;
  }
`;

const DeleteButton = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.theme.text}60;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s;

  ${EquationItem}:hover & {
    opacity: 1;
  }

  &:hover {
    background: rgba(255, 59, 48, 0.1);
    color: #ff3b30;
  }
`;

const AddButton = styled.button`
  margin-top: 8px;
  padding: 12px;
  background: transparent;
  border: 1px dashed ${props => props.theme.border};
  border-radius: 12px;
  color: ${props => props.theme.text}80;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    border-color: ${props => props.theme.primary};
    color: ${props => props.theme.primary};
    background: ${props => props.theme.primary}10;
  }
`;

const CanvasArea = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
  background: white; /* Graph paper usually white */
  cursor: crosshair;
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

const ControlsOverlay = styled.div`
  position: absolute;
  bottom: 24px;
  right: 24px;
  display: flex;
  gap: 12px;
  z-index: 10;
`;

const ControlButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: white;
  border: 1px solid #e0e0e0;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0,0,0,0.15);
  }
`;

const GraphingModal = ({ isOpen, onClose, theme }) => {
  const { t } = useTranslation();
  const canvasRef = useRef(null);
  const [items, setItems] = useState([
    { id: 1, type: 'equation', expression: 'y = sin(x)', color: '#c74440', visible: true },
    { id: 2, type: 'equation', expression: 'y = x^2 / 10', color: '#2d70b3', visible: true }
  ]);
  const [scale, setScale] = useState(40); // pixels per scal unit
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // center offset
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialOffset, setInitialOffset] = useState({ x: 0, y: 0 }); // offset at start of drag

  const colors = ['#c74440', '#2d70b3', '#388c46', '#e68d39', '#9147b1', '#47a5a5'];

  // Initialize Canvas Size
  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const resizeCanvas = () => {
        const canvas = canvasRef.current;
        const rect = canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        requestAnimationFrame(drawGraph);
      };

      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      return () => window.removeEventListener('resize', resizeCanvas);
    }
  }, [isOpen]);

  // Redraw when dependencies change
  useEffect(() => {
    requestAnimationFrame(drawGraph);
  }, [items, scale, offset, isOpen]);


  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Use layout size for calculations to match CSS pixels
    const width = parseFloat(canvas.style.width);
    const height = parseFloat(canvas.style.height);

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Grid Settings
    const centerX = width / 2 + offset.x;
    const centerY = height / 2 + offset.y;

    // --- Draw Grid ---
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = '#e0e0e0';

    const gridSize = scale;
    const startX = centerX % gridSize;
    const startY = centerY % gridSize;

    // Vertical Lines
    /*
      We iterate from left edge (minus some buffer) to right edge.
      Finding the first grid line: 
      The center is at `centerX`. Lines are at `centerX + N * scale`.
      So we find N such that `centerX + N * scale < 0`.
    */

    ctx.beginPath();
    for (let x = startX - gridSize; x < width; x += gridSize) {
      // Simple modulo based grid
      if (x < 0) continue;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    // Better grid loop:
    const minGridX = Math.floor(-centerX / gridSize) - 1;
    const maxGridX = Math.ceil((width - centerX) / gridSize) + 1;

    for (let i = minGridX; i <= maxGridX; i++) {
      const x = centerX + i * gridSize;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }

    const minGridY = Math.floor(-centerY / gridSize) - 1;
    const maxGridY = Math.ceil((height - centerY) / gridSize) + 1;

    for (let i = minGridY; i <= maxGridY; i++) {
      const y = centerY - i * gridSize;
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // --- Draw Axes ---
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#333';
    ctx.beginPath();
    // X Axis
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    // Y Axis
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    // --- Draw Functions ---
    items.forEach(item => {
      if (!item.visible || !item.expression) return;

      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = item.color;

      let first = true;
      // Optimization: Don't check every pixel if scale is large
      // Use a step size. 1 pixel is fine for accuracy.
      for (let px = 0; px < width; px += 1) {
        const mathX = (px - centerX) / scale;
        const mathY = evaluateExpression(item.expression, mathX);

        if (isNaN(mathY) || !isFinite(mathY)) {
          first = true;
          continue;
        }

        const py = centerY - mathY * scale;

        // Clip very large values to avoid bad rendering
        if (py < -height || py > height * 2) {
          first = true;
          continue;
        }

        if (first) {
          ctx.moveTo(px, py);
          first = false;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
    });
  };

  const evaluateExpression = (expr, x) => {
    try {
      // Pre-process for convenience
      // Support standard math notation like 2x instead of 2*x
      // Replace 'x' with value, handle implicit multiplication
      let cleanExpr = expr.toLowerCase();

      // Handle common constants and functions
      // Must perform replacements carefully to avoid sub-string matches
      // Ideally use a math parser library, but we use a simple regex replacer for now

      // 1. Insert * between a number and a variable (2x -> 2*x)
      cleanExpr = cleanExpr.replace(/(\d)(x)/g, '$1*$2');
      // 2. Insert * between number and function (2sin -> 2*sin)
      cleanExpr = cleanExpr.replace(/(\d)([a-z])/g, '$1*$2');
      // 3. Insert * between ) and (  ((a)(b) -> (a)*(b))
      cleanExpr = cleanExpr.replace(/\)\(/g, ')*(');

      // Replace math functions with Math.
      cleanExpr = cleanExpr
        .replace(/\^/g, '**')
        .replace(/\bsin\b/g, 'Math.sin')
        .replace(/\bcos\b/g, 'Math.cos')
        .replace(/\btan\b/g, 'Math.tan')
        .replace(/\blog\b/g, 'Math.log10')
        .replace(/\bln\b/g, 'Math.log')
        .replace(/\bsqrt\b/g, 'Math.sqrt')
        .replace(/\bpi\b/g, 'Math.PI')
        .replace(/\be\b/g, 'Math.E');

      // Execute safely
      // Note: Using Function constructor has security implications in general, 
      // but here it's client-side only and confined to math.
      const f = new Function('x', `return ${cleanExpr}`);
      return f(x);
    } catch (e) {
      return NaN;
    }
  };

  // Interactions
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialOffset({ ...offset });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setOffset({
      x: initialOffset.x + dx,
      y: initialOffset.y + dy
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    const zoomSensitivity = 0.001;
    const newScale = Math.max(10, Math.min(1000, scale * (1 - e.deltaY * zoomSensitivity)));
    setScale(newScale);
  };

  // Sidebar Actions
  const addItem = () => {
    setItems([...items, {
      id: Date.now(),
      type: 'equation',
      expression: '',
      color: colors[items.length % colors.length],
      visible: true
    }]);
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const centerGraph = () => {
    setOffset({ x: 0, y: 0 });
    setScale(40);
  };

  return (
    <ModalOverlay $isOpen={isOpen} onClick={onClose}>
      <GraphingContainer $isOpen={isOpen} onClick={e => e.stopPropagation()}>
        <Sidebar>
          <SidebarHeader>
            <Title>SCULPTOR <TitleText>{t('graph.titleSuffix', 'Graph')}</TitleText></Title>
          </SidebarHeader>
          <EquationList>
            {items.map(item => (
              <EquationItem key={item.id} $active={item.visible}>
                <ColorIndicator
                  $color={item.color}
                  $visible={item.visible}
                  onClick={() => updateItem(item.id, 'visible', !item.visible)}
                />
                <InputWrapper>
                  <StyledInput
                    value={item.expression}
                    onChange={e => updateItem(item.id, 'expression', e.target.value)}
                    placeholder={t('graph.placeholder')}
                  />
                </InputWrapper>
                <DeleteButton onClick={() => removeItem(item.id)}>×</DeleteButton>
              </EquationItem>
            ))}
            <AddButton onClick={addItem}>{t('graph.button.addExpression')}</AddButton>
          </EquationList>
        </Sidebar>

        <CanvasArea
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

          <CloseButton onClick={onClose}>×</CloseButton>

            <ControlsOverlay>
              <ControlButton onClick={centerGraph} title={t('graph.controls.reset')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M12 3v18M19 12a7 7 0 0 1-7 7 7 7 0 0 1 0-14 7 7 0 0 1 7 7z" /></svg>
              </ControlButton>
              <ControlButton onClick={() => setScale(s => s * 1.2)} title={t('graph.controls.zoomIn')}>+</ControlButton>
              <ControlButton onClick={() => setScale(s => s / 1.2)} title={t('graph.controls.zoomOut')}>-</ControlButton>
          </ControlsOverlay>
        </CanvasArea>

      </GraphingContainer>
    </ModalOverlay>
  );
};

export default GraphingModal;
