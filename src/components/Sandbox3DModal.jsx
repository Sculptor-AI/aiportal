
import React, { useRef, useState, useEffect } from 'react';
import styled from 'styled-components';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import ObjectControls from './ObjectControls';

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
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid ${props => props.theme.border};
`;

const Title = styled.h2`
  margin: 0;
  font-size: 18px;
  color: ${props => props.theme.text};
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.theme.text};
  font-size: 24px;
  cursor: pointer;
`;

const Content = styled.div`
  flex: 1;
  position: relative; /* Add relative positioning */
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: ${props => props.theme.text};
`;

const MeshObj = ({ object }) => {
  const meshRef = useRef();

  return (
    <mesh
      ref={meshRef}
      position={[object.position.x, object.position.y, object.position.z]}
      rotation={[object.rotation.x, object.rotation.y, object.rotation.z]}
      scale={[object.scale.x, object.scale.y, object.scale.z]}
    >
      {object.type === 'box' && <boxGeometry args={[1, 1, 1]} />}
      {object.type === 'sphere' && <sphereGeometry args={[1, 32, 32]} />}
      <meshStandardMaterial color={object.color || 'orange'} />
    </mesh>
  );
};

const Sandbox3DModal = ({ isOpen, onClose, theme, otherPanelsOpen = 0, onSend, initialScene }) => {
  const [objects, setObjects] = useState([{
    id: '1',
    type: 'box',
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    color: 'orange'
  }]);

  const [selectedId, setSelectedId] = useState('1');

  const selectedObject = objects.find(o => o.id === selectedId);

  const updateSelectedObject = (updated) => {
    setObjects(objs => objs.map(o => o.id === selectedId ? updated : o));
  };

  const handleSendToAI = () => {
    onSend(objects);
    onClose();
  };

  useEffect(() => {
    if (initialScene && initialScene.length > 0) {
      setObjects(initialScene);
      setSelectedId(initialScene[0].id);
    }
  }, [initialScene]);

  return (
    <ModalContainer $isOpen={isOpen} $otherPanelsOpen={otherPanelsOpen}>
      <Header>
        <Title>3D Object Sandbox</Title>
        <CloseButton onClick={onClose}>×</CloseButton>
      </Header>
      <Content>
        <Canvas>
          <ambientLight />
          <pointLight position={[10, 10, 10]} />
          {objects.map(obj => <MeshObj key={obj.id} object={obj} />)}
          <OrbitControls />
        </Canvas>
        <select value={selectedId} onChange={e => setSelectedId(e.target.value)} style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 1001 }}>
          {objects.map(obj => <option key={obj.id} value={obj.id}>Object {obj.id}</option>)}
        </select>
        <ObjectControls
          object={selectedObject}
          setObject={updateSelectedObject}
          sendToAI={handleSendToAI}
          theme={theme}
          objects={objects}
          setObjects={setObjects}
          setSelectedId={setSelectedId}
        />
      </Content>
    </ModalContainer>
  );
};

export default Sandbox3DModal;
