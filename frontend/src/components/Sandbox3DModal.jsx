import React, { useRef, useState, useEffect, Suspense } from 'react';
import styled from 'styled-components';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, TransformControls, Grid, Stage, PerspectiveCamera } from '@react-three/drei';

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
  max-width: 1800px;
  max-height: 1100px;
  display: flex;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
  border: 1px solid ${props => props.theme.border};
  overflow: hidden;
  position: relative;
  transform: ${props => props.$isOpen ? 'scale(1)' : 'scale(0.95)'};
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
`;

// --- Sidebars ---

const Sidebar = styled.div`
  width: 250px;
  background: ${props => props.theme.sidebar};
  border-right: 1px solid ${props => props.theme.border};
  display: flex;
  flex-direction: column;
  z-index: 10;
  backdrop-filter: blur(20px);
`;

const RightSidebar = styled(Sidebar)`
  border-right: none;
  border-left: 1px solid ${props => props.theme.border};
  width: 300px;
`;

const SidebarHeader = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid ${props => props.theme.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const SectionHeader = styled.div`
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${props => props.theme.text}80;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ItemList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const ObjectItem = styled.button`
  display: flex;
  align-items: center;
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  background: ${props => props.$active ? props.theme.primary + '20' : 'transparent'};
  color: ${props => props.$active ? props.theme.primary : props.theme.text};
  border: 1px solid ${props => props.$active ? props.theme.primary + '40' : 'transparent'};
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.15s;

  &:hover {
    background: ${props => props.$active ? props.theme.primary + '30' : props.theme.inputBackground};
  }
`;

const Icon = styled.span`
  margin-right: 10px;
  opacity: 0.7;
`;

// --- Properties Panel Inputs ---

const PropertyGroup = styled.div`
  padding: 16px;
  border-bottom: 1px solid ${props => props.theme.border};
`;

const PropertyRow = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  &:last-child { margin-bottom: 0; }
`;

const Label = styled.label`
  width: 80px;
  font-size: 13px;
  color: ${props => props.theme.text}90;
`;

const InputGroup = styled.div`
  flex: 1;
  display: flex;
  gap: 8px;
`;

const NumInputWrapper = styled.div`
  flex: 1;
  position: relative;
`;

const InputLabel = styled.span`
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
  color: ${props => props.theme.text}60;
  pointer-events: none;
`;

const StyledInput = styled.input`
  width: 100%;
  background: ${props => props.theme.inputBackground};
  border: 1px solid ${props => props.theme.border};
  border-radius: 6px;
  padding: 6px 6px 6px 20px;
  color: ${props => props.theme.text};
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  border: 1px solid transparent; /* default */
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.primary};
    background: ${props => props.theme.background};
  }
`;

const MainContent = styled.div`
  flex: 1;
  position: relative;
  background: #111; /* Dark background for 3D usually looks best */
`;

const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 20;
  transition: all 0.2s;
  font-size: 24px;
  line-height: 1;
  backdrop-filter: blur(4px);

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: rotate(90deg);
  }
`;

const ToolbarOverlay = styled.div`
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  padding: 6px;
  background: rgba(30, 30, 30, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  z-index: 10;
  backdrop-filter: blur(12px);
`;

const ToolButton = styled.button`
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  background: ${props => props.$primary ? props.theme.primary : 'transparent'};
  color: ${props => props.$primary ? 'white' : 'white'};
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover {
    background: ${props => props.$primary ? props.theme.primaryDark : 'rgba(255,255,255,0.1)'};
  }
`;

const Title = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, ${props => props.theme.primary}, ${props => props.theme.secondary});
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  width: fit-content;
`;

const FloatingGizmo = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  pointer-events: none;
  background: rgba(0,0,0,0.5);
  padding: 4px 8px;
  border-radius: 4px;
  color: white;
  font-size: 12px;
`;

// --- 3D Components ---

const DraggableMesh = ({ object, isSelected, onSelect, onChange }) => {
  const meshRef = useRef();

  return (
    <>
      <mesh
        ref={meshRef}
        position={[object.position.x, object.position.y, object.position.z]}
        rotation={[object.rotation.x, object.rotation.y, object.rotation.z]}
        scale={[object.scale.x, object.scale.y, object.scale.z]}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(object.id);
        }}
      >
        {object.type === 'box' && <boxGeometry args={[1, 1, 1]} />}
        {object.type === 'sphere' && <sphereGeometry args={[1, 32, 32]} />}
        {object.type === 'cylinder' && <cylinderGeometry args={[0.5, 0.5, 1, 32]} />}
        {object.type === 'torus' && <torusGeometry args={[0.5, 0.2, 16, 100]} />}
        <meshStandardMaterial color={object.color} roughness={0.3} metalness={0.1} />
      </mesh>

      {isSelected && (
        <TransformControls
          object={meshRef}
          mode="translate"
          onObjectChange={(e) => {
            if (meshRef.current) {
              const { position, rotation, scale } = meshRef.current;
              onChange(object.id, {
                position: { x: position.x, y: position.y, z: position.z },
                rotation: { x: rotation.x, y: rotation.y, z: rotation.z },
                scale: { x: scale.x, y: scale.y, z: scale.z }
              });
            }
          }}
        />
      )}
    </>
  );
};

// --- Main Modal ---

const Sandbox3DModal = ({ isOpen, onClose, onSend, theme, initialScene }) => {
  const [objects, setObjects] = useState([
    { id: '1', type: 'box', position: { x: 0, y: 0.5, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, color: '#4facfe' }
  ]);
  const [selectedId, setSelectedId] = useState('1');

  // Load initial scene if provided
  useEffect(() => {
    if (initialScene && initialScene.length) {
      setObjects(initialScene);
      setSelectedId(initialScene[0].id);
    }
  }, [initialScene]);

  const selectedObject = objects.find(o => o.id === selectedId);

  const updateObject = (id, newProps) => {
    setObjects(objs => objs.map(o => o.id === id ? { ...o, ...newProps } : o));
  };

  const handlePropChange = (key, axis, value) => {
    if (!selectedObject) return;
    const val = parseFloat(value) || 0;
    updateObject(selectedId, {
      [key]: { ...selectedObject[key], [axis]: val }
    });
  };

  const addObject = (type) => {
    const id = Date.now().toString();
    const newObj = {
      id, type,
      position: { x: (Math.random() - 0.5) * 2, y: 0.5, z: (Math.random() - 0.5) * 2 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      color: '#' + Math.floor(Math.random() * 16777215).toString(16)
    };
    setObjects([...objects, newObj]);
    setSelectedId(id);
  };

  const deleteSelected = () => {
    setObjects(objs => objs.filter(o => o.id !== selectedId));
    setSelectedId(null);
  };

  const handleSend = () => {
    onSend(objects);
    onClose();
  };

  return (
    <ModalOverlay $isOpen={isOpen} onClick={onClose}>
      <ModalContainer $isOpen={isOpen} onClick={e => e.stopPropagation()}>

        {/* Left Sidebar: Outliner */}
        <Sidebar>
          <SidebarHeader>
            <Title>SCULPTOR <span style={{ color: theme.text }}>3D</span></Title>
          </SidebarHeader>
          <SectionHeader>
            OUTLINER ({objects.length})
          </SectionHeader>
          <ItemList>
            {objects.map(obj => (
              <ObjectItem
                key={obj.id}
                $active={obj.id === selectedId}
                onClick={() => setSelectedId(obj.id)}
              >
                <Icon>
                  {obj.type === 'box' && '📦'}
                  {obj.type === 'sphere' && '⚪'}
                  {obj.type === 'cylinder' && '🛢️'}
                  {obj.type === 'torus' && '🍩'}
                </Icon>
                {obj.type} {obj.id.slice(-4)}
              </ObjectItem>
            ))}
          </ItemList>
        </Sidebar>

        {/* Center: Canvas */}
        <MainContent>
          <Canvas shadows className="canvas">
            <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={50} />
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />

            <Grid infiniteGrid fadeDistance={20} fadeStrength={1} cellSize={1} sectionSize={5} sectionThickness={1.5} cellColor="#444" sectionColor="#666" />

            <Suspense fallback={null}>
              {objects.map(obj => (
                <DraggableMesh
                  key={obj.id}
                  object={obj}
                  isSelected={obj.id === selectedId}
                  onSelect={setSelectedId}
                  onChange={updateObject}
                />
              ))}
            </Suspense>

            <OrbitControls makeDefault />
          </Canvas>

          <FloatingGizmo>
            Use Mouse to Orbit • Click to Select • Drag Gizmo to Move
          </FloatingGizmo>

          <ToolbarOverlay>
            <ToolButton onClick={() => addObject('box')}>+ Box</ToolButton>
            <ToolButton onClick={() => addObject('sphere')}>+ Sphere</ToolButton>
            <ToolButton onClick={() => addObject('cylinder')}>+ Cyl</ToolButton>
            <ToolButton onClick={() => addObject('torus')}>+ Torus</ToolButton>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.2)', margin: '0 4px' }} />
            <ToolButton onClick={deleteSelected} disabled={!selectedId} style={{ color: '#ff4d4d' }}>Delete</ToolButton>
          </ToolbarOverlay>

          <CloseButton onClick={onClose}>×</CloseButton>
        </MainContent>

        {/* Right Sidebar: Properties */}
        <RightSidebar>
          <SidebarHeader>
            <div style={{ fontWeight: 600 }}>PROPERTIES</div>
            <ToolButton $primary onClick={handleSend} style={{ padding: '4px 12px', fontSize: '12px' }}>
              Save
            </ToolButton>
          </SidebarHeader>

          {selectedObject ? (
            <>
              <SectionHeader>TRANSFORM</SectionHeader>
              <PropertyGroup>
                <PropertyRow>
                  <Label>Position</Label>
                  <InputGroup>
                    {['x', 'y', 'z'].map(axis => (
                      <NumInputWrapper key={axis}>
                        <InputLabel>{axis.toUpperCase()}</InputLabel>
                        <StyledInput
                          type="number" step="0.1"
                          value={Math.round(selectedObject.position[axis] * 100) / 100}
                          onChange={e => handlePropChange('position', axis, e.target.value)}
                        />
                      </NumInputWrapper>
                    ))}
                  </InputGroup>
                </PropertyRow>
                <PropertyRow>
                  <Label>Rotation</Label>
                  <InputGroup>
                    {['x', 'y', 'z'].map(axis => (
                      <NumInputWrapper key={axis}>
                        <InputLabel>{axis.toUpperCase()}</InputLabel>
                        <StyledInput
                          type="number" step="0.1"
                          value={Math.round(selectedObject.rotation[axis] * 100) / 100}
                          onChange={e => handlePropChange('rotation', axis, e.target.value)}
                        />
                      </NumInputWrapper>
                    ))}
                  </InputGroup>
                </PropertyRow>
                <PropertyRow>
                  <Label>Scale</Label>
                  <InputGroup>
                    {['x', 'y', 'z'].map(axis => (
                      <NumInputWrapper key={axis}>
                        <InputLabel>{axis.toUpperCase()}</InputLabel>
                        <StyledInput
                          type="number" step="0.1"
                          value={Math.round(selectedObject.scale[axis] * 100) / 100}
                          onChange={e => handlePropChange('scale', axis, e.target.value)}
                        />
                      </NumInputWrapper>
                    ))}
                  </InputGroup>
                </PropertyRow>
              </PropertyGroup>

              <SectionHeader>MATERIAL</SectionHeader>
              <PropertyGroup>
                <PropertyRow>
                  <Label>Color</Label>
                  <StyledInput
                    type="color"
                    value={selectedObject.color}
                    onChange={e => updateObject(selectedId, { color: e.target.value })}
                    style={{ padding: 2, height: 32 }}
                  />
                </PropertyRow>
                <PropertyRow>
                  <Label>Hex</Label>
                  <StyledInput
                    type="text"
                    value={selectedObject.color}
                    onChange={e => updateObject(selectedId, { color: e.target.value })}
                  />
                </PropertyRow>
              </PropertyGroup>
            </>
          ) : (
            <div style={{ padding: 20, textAlign: 'center', opacity: 0.5 }}>
              No object selected
            </div>
          )}
        </RightSidebar>

      </ModalContainer>
    </ModalOverlay>
  );
};

export default Sandbox3DModal;
