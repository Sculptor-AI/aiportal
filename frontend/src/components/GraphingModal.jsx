import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

const GraphingContainer = styled.div`
  position: fixed;
  top: 0;
  right: ${props => props.$otherPanelsOpen * 450}px;
  width: 600px; /* Wider for graph */
  height: 100vh;
  background: ${props => props.theme.background};
  z-index: 1002;
  display: flex;
  flex-direction: column;
  box-shadow: -3px 0 10px rgba(0, 0, 0, 0.15);
  border-left: 1px solid ${props => props.theme.border};
  transform: ${props => props.$isOpen ? 'translateX(0%)' : 'translateX(100%)'};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transition: transform 0.3s ease-in-out, visibility 0.3s ease-in-out;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.name === 'retro' ? props.theme.buttonFace : '#f7f7f7'};
`;

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  color: ${props => props.theme.text};
  font-family: ${props => props.theme.name === 'retro' ? 'MS Sans Serif, sans-serif' : 'inherit'};
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.theme.text};
  padding: 8px;
  cursor: pointer;
  font-size: 24px;
  border-radius: 4px;
  
  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }
`;

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
`;

const GraphCanvas = styled.canvas`
  flex: 1;
  background: white;
  cursor: crosshair;
  min-height: 0; /* Important for flexbox to allow shrinking */
`;

const EquationPanel = styled.div`
  background: ${props => props.theme.name === 'retro' ? props.theme.buttonFace : '#f7f7f7'};
  border-bottom: 1px solid ${props => props.theme.border};
  display: flex;
  flex-direction: column;
  max-height: 40vh; /* Use viewport height instead of fixed pixels */
  min-height: 120px; /* Ensure minimum space for at least 2-3 equations */
  overflow: hidden; /* Hide overflow on the panel itself */
  
  @media (max-height: 700px) {
    max-height: 35vh;
    min-height: 100px;
  }
  
  @media (max-height: 500px) {
    max-height: 30vh;
    min-height: 80px;
  }
`;

const EquationList = styled.div`
  flex: 1;
  padding: 8px;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0; /* Important for flexbox */
`;

const EquationItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: ${props => props.$active ? 'rgba(0, 0, 0, 0.05)' : 'transparent'};
  border-radius: 6px;
  margin-bottom: 4px;
  min-height: 36px; /* Ensure minimum height for each item */
  flex-shrink: 0; /* Prevent items from shrinking */
  
  &:hover {
    background: rgba(0, 0, 0, 0.05);
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ColorDot = styled.div`
  width: 20px;
  height: 20px;
  min-width: 20px; /* Prevent shrinking */
  min-height: 20px; /* Prevent shrinking */
  border-radius: 50%;
  background: ${props => props.$color};
  cursor: pointer;
  flex-shrink: 0;
  transition: transform 0.1s ease;
  
  &:hover {
    transform: scale(1.1);
  }
`;

const EquationInput = styled.input`
  flex: 1;
  background: white;
  border: 1px solid ${props => props.theme.border};
  border-radius: 4px;
  padding: 8px 12px;
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 14px;
  color: ${props => props.theme.text};
  width: 100%; /* Use full available width */
  min-width: 0; /* Allow shrinking on small screens */
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary};
  }
  
  &::placeholder {
    color: #999;
  }
`;

const AddButton = styled.button`
  margin: 0;
  padding: 8px 16px;
  background: ${props => props.theme.primary};
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  
  &:hover {
    background: ${props => props.theme.primaryDark};
  }
`;

const AxisLabel = styled.text`
  font-size: 14px;
  fill: #666;
  font-family: Arial, sans-serif;
`;

const GridLine = styled.line`
  stroke: #e0e0e0;
  stroke-width: 0.5;
`;

const AxisLine = styled.line`
  stroke: #333;
  stroke-width: 1.5;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 8px;
  padding: 8px;
  border-top: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.name === 'retro' ? props.theme.buttonFace : '#f0f0f0'};
`;

const DeleteButton = styled.button`
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  font-size: 18px;
  padding: 4px 8px;
  min-width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  flex-shrink: 0;
  
  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: #666;
  }
`;

const GraphingModal = ({ isOpen, onClose, theme, otherPanelsOpen = 0 }) => {
  const canvasRef = useRef(null);
  const equationListRef = useRef(null);
  const [items, setItems] = useState([
    { id: 1, type: 'equation', expression: '', color: '#c74440', active: true }
  ]); // Start with one empty equation input
  const [scale, setScale] = useState(50); // pixels per unit
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const colors = ['#c74440', '#2d70b3', '#388c46', '#e68d39', '#9147b1', '#47a5a5'];

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      
      setCanvasSize({ width: rect.width, height: rect.height });
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !canvasRef.current || canvasSize.width === 0) return;
    drawGraph();
  }, [isOpen, items, scale, offset, canvasSize]);

  // Auto-scroll to bottom when new items are added
  useEffect(() => {
    if (equationListRef.current && items.length > 1) {
      // Small delay to ensure DOM has updated
      setTimeout(() => {
        equationListRef.current.scrollTop = equationListRef.current.scrollHeight;
      }, 100);
    }
  }, [items.length]);

  const drawGraph = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvasSize;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);
    
    // Calculate center
    const centerX = width / 2 + offset.x;
    const centerY = height / 2 + offset.y;
    
    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    
    // Vertical grid lines
    for (let x = centerX % scale; x < width; x += scale) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Horizontal grid lines
    for (let y = centerY % scale; y < height; y += scale) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();
    
    // Draw axis labels
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    // X-axis labels
    for (let i = Math.floor(-centerX / scale); i <= Math.floor((width - centerX) / scale); i++) {
      if (i !== 0) {
        const x = centerX + i * scale;
        ctx.fillText(i.toString(), x, centerY + 5);
      }
    }
    
    // Y-axis labels
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = Math.floor(-centerY / scale); i <= Math.floor((height - centerY) / scale); i++) {
      if (i !== 0) {
        const y = centerY - i * scale;
        ctx.fillText(i.toString(), centerX - 5, y);
      }
    }
    
    // Draw items
    items.forEach(item => {
      if (!item.active || !item.expression) return;
      
      if (item.type === 'equation') {
        // Draw equation
        ctx.strokeStyle = item.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        let firstPoint = true;
        
        for (let px = 0; px < width; px++) {
          const x = (px - centerX) / scale;
          
          try {
            const y = evaluateExpression(item.expression, x);
            const py = centerY - y * scale;
            
            if (!isNaN(y) && isFinite(y) && py >= -100 && py <= height + 100) {
              if (firstPoint) {
                ctx.moveTo(px, py);
                firstPoint = false;
              } else {
                ctx.lineTo(px, py);
              }
            } else {
              firstPoint = true;
            }
          } catch (e) {
            // Invalid expression
            break;
          }
        }
        
        ctx.stroke();
      } else if (item.type === 'point') {
        // Draw point
        const pointMatch = item.expression.match(/\(\s*(-?\d*\.?\d+)\s*,\s*(-?\d*\.?\d+)\s*\)/);
        if (pointMatch) {
          const x = parseFloat(pointMatch[1]);
          const y = parseFloat(pointMatch[2]);
          const px = centerX + x * scale;
          const py = centerY - y * scale;
          
          // Draw point circle
          ctx.fillStyle = item.color;
          ctx.beginPath();
          ctx.arc(px, py, 5, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw point border
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Draw point label
          ctx.fillStyle = item.color;
          ctx.font = '12px Arial';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'bottom';
          ctx.fillText(`(${x}, ${y})`, px + 8, py - 8);
        }
      }
    });
  };

  // Enhanced expression evaluator
  const evaluateExpression = (expr, x) => {
    // Handle implicit multiplication (e.g., 2x -> 2*x)
    let jsExpr = expr.replace(/(\d)([a-zA-Z])/g, '$1*$2');
    
    // Replace common functions and constants
    jsExpr = jsExpr
      .replace(/\^/g, '**')
      .replace(/sin/g, 'Math.sin')
      .replace(/cos/g, 'Math.cos')
      .replace(/tan/g, 'Math.tan')
      .replace(/log/g, 'Math.log10')
      .replace(/ln/g, 'Math.log')
      .replace(/sqrt/g, 'Math.sqrt')
      .replace(/abs/g, 'Math.abs')
      .replace(/pi/g, 'Math.PI')
      .replace(/e(?![a-zA-Z])/g, 'Math.E');
    
    // Use Function constructor for evaluation
    try {
      const func = new Function('x', `return ${jsExpr}`);
      return func(x);
    } catch (e) {
      return NaN;
    }
  };

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - rect.left - offset.x,
      y: e.clientY - rect.top - offset.y
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    setOffset({
      x: e.clientX - rect.left - dragStart.x,
      y: e.clientY - rect.top - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(10, Math.min(200, prev * delta)));
  };

  const addEquation = () => {
    const newId = Math.max(...items.map(item => item.id), 0) + 1;
    const colorIndex = items.length % colors.length;
    setItems([...items, {
      id: newId,
      type: 'equation',
      expression: '',
      color: colors[colorIndex],
      active: true
    }]);
  };

  const addPoint = () => {
    const newId = Math.max(...items.map(item => item.id), 0) + 1;
    const colorIndex = items.length % colors.length;
    setItems([...items, {
      id: newId,
      type: 'point',
      expression: '(0, 0)',
      color: colors[colorIndex],
      active: true
    }]);
  };

  const updateItem = (id, expression) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, expression } : item
    ));
  };

  const toggleItem = (id) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, active: !item.active } : item
    ));
  };

  const deleteItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const getPlaceholder = (item, index) => {
    if (item.type === 'equation') {
      // Provide varied examples that cycle through
      const examples = ['y = x^2', 'y = sin(x)', 'y = 2x + 1', 'y = cos(x)', 'y = 1/x', 'y = sqrt(x)'];
      return examples[index % examples.length];
    } else {
      // Provide example points
      const pointExamples = ['(0, 0)', '(2, 4)', '(-1, 3)', '(3, -2)'];
      return pointExamples[index % pointExamples.length];
    }
  };

  return (
    <GraphingContainer $isOpen={isOpen} $otherPanelsOpen={otherPanelsOpen}>
      <Header>
        <Title>Graphing Calculator</Title>
        <CloseButton onClick={onClose}>×</CloseButton>
      </Header>
      
      <ContentArea>
        <EquationPanel>
          <EquationList ref={equationListRef}>
            {items.map((item, index) => {
              // Calculate proper index for placeholder based on item type
              const equationIndex = items.filter((i, idx) => i.type === 'equation' && idx < index).length;
              const pointIndex = items.filter((i, idx) => i.type === 'point' && idx < index).length;
              const placeholderIndex = item.type === 'equation' ? equationIndex : pointIndex;
              
              return (
                <EquationItem key={item.id} $active={item.active}>
                  <ColorDot 
                    $color={item.color}
                    onClick={() => toggleItem(item.id)}
                  />
                  <EquationInput
                    type="text"
                    value={item.expression}
                    onChange={(e) => updateItem(item.id, e.target.value)}
                    placeholder={getPlaceholder(item, placeholderIndex)}
                    autoFocus={index === items.length - 1 && item.expression === ''}
                  />
                  <DeleteButton
                    onClick={() => deleteItem(item.id)}
                  >
                    ×
                  </DeleteButton>
                </EquationItem>
              );
            })}
          </EquationList>
          
          <ButtonContainer>
            <AddButton onClick={addEquation} style={{ flex: 1 }}>
              <span>+</span> Equation
            </AddButton>
            <AddButton onClick={addPoint} style={{ flex: 1 }}>
              <span>+</span> Point
            </AddButton>
          </ButtonContainer>
        </EquationPanel>
        
        <GraphCanvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        />
      </ContentArea>
    </GraphingContainer>
  );
};

export default GraphingModal; 