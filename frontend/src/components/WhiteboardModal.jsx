import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
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
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '12px'};
  width: 95vw;
  height: 90vh;
  max-width: 1400px;
  max-height: 900px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  border: ${props => props.theme.name === 'retro' ? 
    `2px solid ${props.theme.buttonShadowDark}` : 
    `1px solid ${props.theme.border}`};
  overflow: hidden;
  transform: ${props => props.$isOpen ? 'scale(1)' : 'scale(0.95)'};
  transition: transform 0.3s ease-in-out;
  
  @media (max-width: 768px) {
    width: 98vw;
    height: 95vh;
    border-radius: ${props => props.theme.name === 'retro' ? '0' : '8px'};
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid ${props => props.theme.border};
  background: ${props => props.theme.name === 'retro' ? props.theme.buttonFace : props.theme.background};
  flex-shrink: 0;
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
    transform: ${props => props.theme.name === 'retro' ? 'none' : 'scale(0.95)'};
  }
`;

const ToolsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  padding: 16px 20px;
  background: ${props => props.theme.name === 'retro' ? props.theme.buttonFace : props.theme.inputBackground};
  border-top: 1px solid ${props => props.theme.border};
  align-items: center;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
`;

const ToolGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  
  @media (max-width: 768px) {
    flex-wrap: wrap;
    justify-content: center;
  }
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: ${props => props.theme.text};
  font-family: ${props => props.theme.name === 'retro' ? 'MS Sans Serif, sans-serif' : 'inherit'};
`;

const ToolButton = styled.button`
  background: ${props => {
    if (props.theme.name === 'retro') {
      return props.$active ? props.theme.buttonShadowDark : props.theme.buttonFace;
    }
    return props.$active ? props.theme.primary : props.theme.inputBackground;
  }};
  border: ${props => props.theme.name === 'retro' ? 
    `1px solid ${props.theme.buttonHighlightLight} ${props.theme.buttonShadowDark} ${props.theme.buttonShadowDark} ${props.theme.buttonHighlightLight}` : 
    `1px solid ${props.theme.border}`};
  color: ${props => props.$active ? 'white' : props.theme.text};
  padding: ${props => props.theme.name === 'retro' ? '4px 12px' : '8px 16px'};
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '6px'};
  cursor: pointer;
  font-size: ${props => props.theme.name === 'retro' ? '11px' : '14px'};
  font-family: ${props => props.theme.name === 'retro' ? 'MS Sans Serif, sans-serif' : 'inherit'};
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.$active ? props.theme.primary : props.theme.border};
  }
  
  &:active {
    transform: ${props => props.theme.name === 'retro' ? 'none' : 'scale(0.98)'};
  }
`;

const ColorGroup = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  flex-wrap: wrap;
`;

const ColorButton = styled.button`
  width: 24px;
  height: 24px;
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '50%'};
  border: ${props => props.$selected ? 
    `3px solid ${props.theme.text}` : 
    `2px solid ${props.theme.border}`};
  background: ${props => props.$color};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: ${props => props.theme.name === 'retro' ? 'none' : 'scale(1.1)'};
  }
  
  &:active {
    transform: ${props => props.theme.name === 'retro' ? 'none' : 'scale(0.9)'};
  }
`;

const ColorPicker = styled.input`
  width: 32px;
  height: 24px;
  border: none;
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '4px'};
  cursor: pointer;
  background: transparent;
  
  &::-webkit-color-swatch {
    border: 1px solid ${props => props.theme.border};
    border-radius: ${props => props.theme.name === 'retro' ? '0' : '4px'};
  }
  
  &::-moz-color-swatch {
    border: 1px solid ${props => props.theme.border};
    border-radius: ${props => props.theme.name === 'retro' ? '0' : '4px'};
  }
`;

const BrushSizeSlider = styled.input`
  width: 100px;
  height: 4px;
  border-radius: 2px;
  background: ${props => props.theme.border};
  outline: none;
  
  &::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: ${props => props.theme.name === 'retro' ? '0' : '50%'};
    background: ${props => props.theme.primary || '#4a90e2'};
    cursor: pointer;
    border: ${props => props.theme.name === 'retro' ? `1px solid ${props.theme.buttonShadowDark}` : 'none'};
  }
  
  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: ${props => props.theme.name === 'retro' ? '0' : '50%'};
    background: ${props => props.theme.primary || '#4a90e2'};
    cursor: pointer;
    border: ${props => props.theme.name === 'retro' ? `1px solid ${props.theme.buttonShadowDark}` : 'none'};
  }
`;

const BrushSizeDisplay = styled.span`
  font-size: 12px;
  color: ${props => props.theme.text};
  font-family: ${props => props.theme.name === 'retro' ? 'MS Sans Serif, sans-serif' : 'inherit'};
  min-width: 32px;
  text-align: center;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  margin-left: auto;
  
  @media (max-width: 768px) {
    margin-left: 0;
    width: 100%;
    justify-content: center;
  }
`;

const CanvasContainer = styled.div`
  flex: 1;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: ${props => props.theme.name === 'retro' ? props.theme.buttonFace : 'transparent'};
  min-height: 0;
  
  @media (max-width: 768px) {
    padding: 10px;
  }
`;

const Canvas = styled.canvas`
  border: ${props => props.theme.name === 'retro' ? 
    `2px solid ${props.theme.buttonShadowDark}` : 
    `2px solid ${props.theme.border}`};
  border-radius: ${props => props.theme.name === 'retro' ? '0' : '8px'};
  background: white;
  cursor: crosshair;
  max-width: 100%;
  max-height: 100%;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary || '#4a90e2'};
  }
`;

const WhiteboardModal = ({ isOpen, onClose, onSubmit, theme }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState('brush'); // 'brush' or 'eraser'
  const [context, setContext] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

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
      
      // Maintain aspect ratio but use larger default size
      const aspectRatio = 4 / 3; // 800/600
      let width = maxWidth;
      let height = width / aspectRatio;
      
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }
      
      // Ensure minimum size
      width = Math.max(width, 400);
      height = Math.max(height, 300);
      
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

  const handleOutsideClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <ModalOverlay $isOpen={isOpen} onClick={handleOutsideClick}>
      <WhiteboardContainer $isOpen={isOpen} onClick={(e) => e.stopPropagation()}>
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
          
          <ActionButtons>
            <ToolButton onClick={clearCanvas}>Clear</ToolButton>
            <ToolButton onClick={handleDownload}>Export</ToolButton>
            <ToolButton onClick={handleDone} style={{ 
              background: theme?.primary || '#4a90e2', 
              color: 'white',
              fontWeight: '600'
            }}>
              Send to Chat
            </ToolButton>
          </ActionButtons>
        </ToolsContainer>
        
        <CanvasContainer ref={containerRef}>
          <Canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            style={{
              width: `${canvasSize.width}px`,
              height: `${canvasSize.height}px`
            }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </CanvasContainer>
      </WhiteboardContainer>
    </ModalOverlay>
  );
};

export default WhiteboardModal; 