import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

const WhiteboardContainer = styled.div`
  position: fixed;
  top: 0;
  right: ${props => props.$otherPanelsOpen * 450}px; /* Shift right based on other panels */
  width: 450px; /* Adjust width as needed */
  height: 100vh;
  background: ${props => props.theme.background};
  z-index: 1000; /* Ensure it's above other content, adjust if necessary */
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

const ToolsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 12px 20px;
  border-bottom: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.inputBackground};
  flex-wrap: wrap;
`;

const ToolGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  color: ${props => props.theme.text};
  font-weight: 500;
`;

const ColorPicker = styled.input`
  width: 40px;
  height: 40px;
  border: 2px solid ${props => props.theme.border};
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '8px'};
  cursor: pointer;
  
  ${props => props.theme.name === 'retro' && `
    -webkit-appearance: none;
    &::-webkit-color-swatch-wrapper {
      padding: 0;
    }
    &::-webkit-color-swatch {
      border: none;
    }
  `}
`;

const ColorButton = styled.button`
  width: 30px;
  height: 30px;
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '50%'};
  border: 2px solid ${props => props.$selected ? props.theme.text : props.theme.border};
  background: ${props => props.$color};
  cursor: pointer;
  position: relative;
  
  &:hover {
    transform: scale(1.1);
  }
  
  ${props => props.$selected && `
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 6px;
      height: 6px;
      background: ${props.$color === '#000000' ? 'white' : 'black'};
      border-radius: 50%;
    }
  `}
`;

const ColorGroup = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
`;

const BrushSizeSlider = styled.input`
  width: 100px;
`;

const BrushSizeDisplay = styled.span`
  font-size: 14px;
  color: ${props => props.theme.text};
  min-width: 30px;
  text-align: center;
`;

const CanvasContainer = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: ${props => props.theme.name === 'retro' ? '#c0c0c0' : '#f5f5f5'};
  overflow: hidden;
`;

const Canvas = styled.canvas`
  background: white;
  border: 2px solid ${props => props.theme.border};
  cursor: crosshair;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: block;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid ${props => props.theme.border};
`;

const Button = styled.button`
  padding: 8px 20px;
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '6px'};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
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

const ToolButton = styled.button`
  padding: 8px 12px;
  background: ${props => props.$active ? props.theme.primary : props.theme.background};
  color: ${props => props.$active ? 'white' : props.theme.text};
  border: 1px solid ${props => props.$active ? props.theme.primary : props.theme.border};
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '6px'};
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.$active ? props.theme.primaryDark : props.theme.border};
  }
`;

const WhiteboardModal = ({ isOpen, onClose, onSubmit, theme, otherPanelsOpen = 0 }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState('brush'); // 'brush' or 'eraser'
  const [context, setContext] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 });

  const predefinedColors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500'];

  // Resize canvas to fit container
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    
    const resizeCanvas = () => {
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      // Account for padding
      const padding = 40; // 20px on each side
      const maxWidth = rect.width - padding;
      const maxHeight = rect.height - padding;
      
      // Maintain aspect ratio
      const aspectRatio = 3 / 2; // 600/400
      let width = maxWidth;
      let height = width / aspectRatio;
      
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }
      
      setCanvasSize({ width, height });
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Handle device pixel ratio for crisp drawing
      const dpr = window.devicePixelRatio || 1;
      
      // Set actual canvas size accounting for device pixel ratio
      canvas.width = canvasSize.width * dpr;
      canvas.height = canvasSize.height * dpr;
      
      // Scale canvas back down using CSS
      canvas.style.width = canvasSize.width + 'px';
      canvas.style.height = canvasSize.height + 'px';
      
      // Scale context to match device pixel ratio
      ctx.scale(dpr, dpr);
      
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      setContext(ctx);
      
      // Clear canvas on open
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
    }
  }, [isOpen, canvasSize]);

  // Helper function to get correct mouse position
  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    
    if (e.type.includes('touch')) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    // Simple calculation since we're now properly sizing the canvas
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    return { x, y };
  };

  const startDrawing = (e) => {
    if (!context) return;
    
    const pos = getMousePos(e);
    
    setIsDrawing(true);
    context.beginPath();
    context.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    if (!isDrawing || !context) return;
    
    if (e.type === 'touchmove') {
      e.preventDefault(); // Prevent scrolling
    }
    
    const pos = getMousePos(e);
    
    context.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    context.strokeStyle = tool === 'eraser' ? 'rgba(255,255,255,1)' : color;
    context.lineWidth = brushSize;
    context.lineTo(pos.x, pos.y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!context) return;
    context.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!context || !canvasRef.current) return;
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvasSize.width, canvasSize.height);
  };

  const handleDone = () => {
    if (!canvasRef.current) return;
    
    canvasRef.current.toBlob((blob) => {
      if (blob) {
        // Create a File object from the blob
        const file = new File([blob], 'whiteboard-drawing.png', { type: 'image/png' });
        onSubmit(file);
        onClose();
      }
    }, 'image/png');
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = 'whiteboard-drawing.png';
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  return (
    <WhiteboardContainer $isOpen={isOpen} $otherPanelsOpen={otherPanelsOpen}>
      <Header>
        <Title>Whiteboard</Title>
        <CloseButton onClick={onClose}>
          {theme?.name === 'retro' ? '✕' : '×'}
        </CloseButton>
      </Header>
      
      <ToolsContainer>
        <ToolGroup>
          <Label>Tool:</Label>
          <ToolButton 
            $active={tool === 'brush'} 
            onClick={() => setTool('brush')}
          >
            Brush
          </ToolButton>
          <ToolButton 
            $active={tool === 'eraser'} 
            onClick={() => setTool('eraser')}
          >
            Eraser
          </ToolButton>
        </ToolGroup>
        
        <ToolGroup>
          <Label>Color:</Label>
          <ColorGroup>
            {predefinedColors.map((c) => (
              <ColorButton
                key={c}
                $color={c}
                $selected={color === c && tool !== 'eraser'}
                onClick={() => {
                  setColor(c);
                  setTool('brush');
                }}
              />
            ))}
            <ColorPicker 
              type="color" 
              value={color} 
              onChange={(e) => setColor(e.target.value)}
              disabled={tool === 'eraser'}
            />
          </ColorGroup>
        </ToolGroup>
        
        <ToolGroup>
          <Label>Size:</Label>
          <BrushSizeSlider 
            type="range" 
            min="1" 
            max="50" 
            value={brushSize} 
            onChange={(e) => setBrushSize(e.target.value)}
          />
          <BrushSizeDisplay>{brushSize}px</BrushSizeDisplay>
        </ToolGroup>
        
        <ToolButton onClick={clearCanvas}>Clear</ToolButton>
      </ToolsContainer>
      
      <CanvasContainer ref={containerRef}>
        <Canvas 
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </CanvasContainer>
      
      <ButtonContainer>
        <Button onClick={handleDownload}>Download</Button>
        <Button onClick={onClose}>Cancel</Button>
        <Button $primary onClick={handleDone}>Done</Button>
      </ButtonContainer>
    </WhiteboardContainer>
  );
};

export default WhiteboardModal; 